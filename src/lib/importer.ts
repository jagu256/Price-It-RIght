/**
 * Excel (.xlsx) and CSV import – everything runs in the browser; files are
 * never uploaded anywhere.
 *
 * Steps: read the file → pick a worksheet → map columns → validate rows →
 * the user confirms → records are added. Problems are reported row by row,
 * and duplicate records are flagged, never silently merged.
 */
import { t, tx } from '../i18n/i18n';
import { UNITS, parseQuantity, type UnitId } from './inventory';
import { normaliseName, parseCost, parseUnitText } from './stock';
import type { InventoryRecord, RecipeLineInput } from './types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_ROWS = 2000;

export interface RawSheet {
  name: string;
  /** Every cell as text; empty rows removed. */
  rows: string[][];
}

export type ReadResult = { ok: true; sheets: RawSheet[] } | { ok: false; error: string };

function cellText(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') return Number.isFinite(v) ? String(Number(v.toPrecision(12))) : '';
  return String(v).trim();
}

function cleanRows(rows: unknown[][]): string[][] {
  return rows.map((r) => r.map(cellText)).filter((r) => r.some((c) => c !== ''));
}

export async function readSpreadsheet(file: File): Promise<ReadResult> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith('.csv');
  const isXlsx = name.endsWith('.xlsx');
  if (!isCsv && !isXlsx) {
    const message = t('Unsupported file type. Please upload an Excel (.xlsx) or CSV (.csv) file.');
    return { ok: false, error: name.endsWith('.xls') ? `${message} ${t('Older .xls files: open them in Excel and save as .xlsx first.')}` : message };
  }
  if (file.size === 0) return { ok: false, error: t('This file is empty.') };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: t('This file is larger than 5 MB. Please upload a smaller file.') };

  try {
    let sheets: RawSheet[];
    if (isCsv) {
      // Spreadsheet libraries load only when a file is chosen.
      const { default: Papa } = await import('papaparse');
      const text = await file.text();
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' });
      sheets = [{ name: 'CSV', rows: cleanRows(parsed.data) }];
    } else {
      const { default: readXlsxFile } = await import('read-excel-file/universal');
      const workbook = await readXlsxFile(file);
      sheets = workbook.map((s) => ({ name: s.sheet, rows: cleanRows(s.data as unknown[][]) }));
    }
    const withData = sheets.filter((s) => s.rows.length > 0);
    if (withData.length === 0) return { ok: false, error: t('This file has no data in it.') };
    return { ok: true, sheets };
  } catch {
    return { ok: false, error: t('We couldn’t read this file. Make sure it is a valid Excel (.xlsx) or CSV file.') };
  }
}

/* ------------------------------------------------------------------ */
/* Column mapping                                                      */
/* ------------------------------------------------------------------ */

export interface FieldSpec<K extends string> {
  key: K;
  label: string;
  required: boolean;
  synonyms: string[];
}

export type InventoryFieldKey = 'name' | 'quantity' | 'unit' | 'cost';
export type RecipeFieldKey = 'product' | 'item' | 'quantity' | 'unit';

export const INVENTORY_FIELDS: FieldSpec<InventoryFieldKey>[] = [
  { key: 'name', label: tx('Item name'), required: true, synonyms: ['item name', 'item', 'name', 'inventory item', 'ingredient', 'material', 'description', 'product name', 'sku name', 'nom de l article', 'nom', 'article', 'matiere'] },
  { key: 'quantity', label: tx('Available quantity'), required: true, synonyms: ['quantite disponible', 'available quantity', 'quantity available', 'quantity', 'qty', 'on hand', 'qty on hand', 'stock', 'in stock', 'available', 'amount', 'count'] },
  { key: 'unit', label: tx('Unit'), required: true, synonyms: ['unit', 'units', 'uom', 'unit of measure', 'unit of measurement', 'measure', 'measurement', 'unite de mesure', 'unite', 'unites'] },
  { key: 'cost', label: tx('Cost per unit (optional)'), required: false, synonyms: ['cost per unit', 'unit cost', 'cost', 'price per unit', 'cost unit', 'purchase cost', 'unit price', 'cout unitaire', 'cout par unite', 'cout', 'prix unitaire'] },
];

export const RECIPE_FIELDS: FieldSpec<RecipeFieldKey>[] = [
  { key: 'product', label: tx('Product'), required: true, synonyms: ['product', 'product name', 'menu item', 'finished product', 'service', 'nom du produit', 'produit'] },
  { key: 'item', label: tx('Inventory item'), required: true, synonyms: ['inventory item', 'item', 'ingredient', 'material', 'supply', 'component', 'item name', 'article en stock', 'article', 'matiere'] },
  { key: 'quantity', label: tx('Quantity required'), required: true, synonyms: ['quantity required', 'quantity', 'qty', 'amount', 'quantity per product', 'qty per unit', 'required', 'quantite requise', 'quantite par produit', 'quantite'] },
  { key: 'unit', label: tx('Unit'), required: true, synonyms: ['unit', 'units', 'uom', 'unit of measure', 'measure', 'unite de mesure', 'unite', 'unites'] },
];

/** Lower case, no accents, no punctuation: "Quantité disponible" → "quantite disponible". */
const normHeader = (h: string) =>
  h
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export type Mapping<K extends string> = Record<K, number | null>;

/** Guesses which column holds each field from the header names. */
export function guessMapping<K extends string>(headers: string[], fields: FieldSpec<K>[]): Mapping<K> {
  const normalised = headers.map(normHeader);
  const used = new Set<number>();
  const mapping = {} as Mapping<K>;
  // Exact synonym matches first (in synonym order), then "contains" matches.
  for (const f of fields) {
    let found: number | null = null;
    for (const syn of f.synonyms) {
      const i = normalised.findIndex((h, idx) => h === syn && !used.has(idx));
      if (i >= 0) {
        found = i;
        break;
      }
    }
    if (found === null) {
      for (const syn of f.synonyms) {
        const i = normalised.findIndex((h, idx) => !used.has(idx) && h.includes(syn));
        if (i >= 0) {
          found = i;
          break;
        }
      }
    }
    if (found !== null) used.add(found);
    mapping[f.key] = found;
  }
  return mapping;
}

export function mappingErrors<K extends string>(mapping: Mapping<K>, fields: FieldSpec<K>[]): string[] {
  const errors: string[] = [];
  for (const f of fields) if (f.required && mapping[f.key] === null) errors.push(t('Choose which column holds “{field}”.', { field: t(f.label) }));
  const cols = fields.map((f) => mapping[f.key]).filter((c): c is number => c !== null);
  if (new Set(cols).size !== cols.length) errors.push(t('Each column can only be used for one field.'));
  return errors;
}

export function columnHeaders(sheet: RawSheet, hasHeaderRow: boolean): string[] {
  const width = Math.max(0, ...sheet.rows.map((r) => r.length));
  return Array.from({ length: width }, (_, i) =>
    hasHeaderRow && sheet.rows[0]?.[i] ? sheet.rows[0][i] : `Column ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? Math.floor(i / 26) : ''}`,
  );
}

export function dataRows(sheet: RawSheet, hasHeaderRow: boolean): { rowNumber: number; cells: string[] }[] {
  // Row numbers match what the user sees in Excel (after empty rows are skipped).
  return sheet.rows.slice(hasHeaderRow ? 1 : 0).map((cells, i) => ({ rowNumber: i + (hasHeaderRow ? 2 : 1), cells }));
}

export interface RowProblem {
  rowNumber: number;
  messages: string[];
}

/* ------------------------------------------------------------------ */
/* Inventory rows                                                      */
/* ------------------------------------------------------------------ */

export interface InventoryImport {
  valid: { rowNumber: number; record: Omit<InventoryRecord, 'id'> }[];
  problems: RowProblem[];
  tooManyRows: boolean;
  /** Most rows failed – the column mapping is probably wrong. */
  mappingLooksWrong: boolean;
}

export function validateInventoryRows(
  rows: { rowNumber: number; cells: string[] }[],
  mapping: Mapping<InventoryFieldKey>,
  existingNames: string[] = [],
): InventoryImport {
  if (rows.length > MAX_ROWS) return { valid: [], problems: [], tooManyRows: true, mappingLooksWrong: false };
  const get = (cells: string[], k: InventoryFieldKey) => (mapping[k] === null ? '' : (cells[mapping[k] as number] ?? '').trim());

  const firstRowFor = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = normaliseName(get(r.cells, 'name'));
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!firstRowFor.has(key)) firstRowFor.set(key, r.rowNumber);
  }
  const existing = new Set(existingNames.map(normaliseName));

  const valid: InventoryImport['valid'] = [];
  const problems: RowProblem[] = [];
  let quantityFailures = 0;
  for (const r of rows) {
    const messages: string[] = [];
    const name = get(r.cells, 'name');
    const key = normaliseName(name);
    if (!key) messages.push(t('Missing item name.'));
    else if ((counts.get(key) ?? 0) > 1) {
      const others = rows.filter((x) => x.rowNumber !== r.rowNumber && normaliseName(get(x.cells, 'name')) === key).map((x) => x.rowNumber);
      messages.push(t('Duplicate item “{name}” (also on row {rows}). Duplicates are not merged – keep one row.', { name, rows: others.join(', ') }));
    } else if (existing.has(key)) messages.push(t('“{name}” is already in your inventory.', { name }));

    const qtyText = get(r.cells, 'quantity');
    let quantity = '';
    if (qtyText === '') {
      messages.push(t('Missing quantity.'));
      quantityFailures++;
    } else {
      const q = parseQuantity(qtyText, 'available');
      if (q.ok) quantity = String(q.value);
      else {
        messages.push(q.error);
        quantityFailures++;
      }
    }

    const unitText = get(r.cells, 'unit');
    let unit: UnitId | null = null;
    if (unitText === '') messages.push(t('Missing unit.'));
    else {
      unit = parseUnitText(unitText);
      if (!unit) messages.push(t('Unsupported unit “{unit}”. Use g, kg, mL, L or pieces.', { unit: unitText }));
    }

    const costText = get(r.cells, 'cost');
    let cost = '';
    if (costText !== '') {
      const c = parseCost(costText);
      if (c.ok) cost = c.value === null ? '' : String(c.value);
      else messages.push(t('Cost: {error}', { error: c.error }));
    }

    if (messages.length > 0 || !unit) problems.push({ rowNumber: r.rowNumber, messages });
    else valid.push({ rowNumber: r.rowNumber, record: { name: name.replace(/\s+/g, ' '), quantity, unit, cost } });
  }
  return {
    valid,
    problems,
    tooManyRows: false,
    mappingLooksWrong: rows.length >= 2 && quantityFailures / rows.length > 0.5,
  };
}

/* ------------------------------------------------------------------ */
/* Recipe rows                                                         */
/* ------------------------------------------------------------------ */

export interface NamedRef {
  id: string;
  name: string;
}
export interface StockRef extends NamedRef {
  unit: UnitId;
}

export interface RecipeRowDraft {
  rowNumber: number;
  productName: string;
  itemName: string;
  quantity: string;
  unit: UnitId | null;
  messages: string[];
}

/** First pass: check values and collect names that don't match a product or inventory item. */
export function readRecipeRows(
  rows: { rowNumber: number; cells: string[] }[],
  mapping: Mapping<RecipeFieldKey>,
  products: NamedRef[],
  items: StockRef[],
): { drafts: RecipeRowDraft[]; unknownProducts: string[]; unknownItems: string[]; tooManyRows: boolean } {
  if (rows.length > MAX_ROWS) return { drafts: [], unknownProducts: [], unknownItems: [], tooManyRows: true };
  const get = (cells: string[], k: RecipeFieldKey) => (mapping[k] === null ? '' : (cells[mapping[k] as number] ?? '').trim());
  const productNames = new Set(products.map((p) => normaliseName(p.name)));
  const itemNames = new Set(items.map((i) => normaliseName(i.name)));
  const unknownProducts = new Map<string, string>();
  const unknownItems = new Map<string, string>();

  const drafts = rows.map((r) => {
    const messages: string[] = [];
    const productName = get(r.cells, 'product');
    const itemName = get(r.cells, 'item');
    if (!productName) messages.push(t('Missing product name.'));
    else if (!productNames.has(normaliseName(productName))) unknownProducts.set(normaliseName(productName), productName);
    if (!itemName) messages.push(t('Missing inventory item.'));
    else if (!itemNames.has(normaliseName(itemName))) unknownItems.set(normaliseName(itemName), itemName);

    let quantity = '';
    const q = parseQuantity(get(r.cells, 'quantity'), 'required');
    if (q.ok) quantity = String(q.value);
    else messages.push(q.error);

    const unitText = get(r.cells, 'unit');
    const unit = unitText ? parseUnitText(unitText) : null;
    if (!unitText) messages.push(t('Missing unit.'));
    else if (!unit) messages.push(t('Unsupported unit “{unit}”. Use g, kg, mL, L or pieces.', { unit: unitText }));
    return { rowNumber: r.rowNumber, productName, itemName, quantity, unit, messages };
  });
  return { drafts, unknownProducts: [...unknownProducts.values()], unknownItems: [...unknownItems.values()], tooManyRows: false };
}

/** What the user chose for each unknown name: an existing id, or null to skip those rows. */
export type NameResolution = Record<string, string | null>;

export interface RecipeImport {
  /** productId → lines (each product's recipe in the file replaces its current recipe). */
  recipes: Record<string, Omit<RecipeLineInput, 'id'>[]>;
  problems: RowProblem[];
  skipped: number;
  unresolved: string[];
}

/** Second pass, after the user has resolved unknown names. */
export function buildRecipeImport(
  drafts: RecipeRowDraft[],
  products: NamedRef[],
  items: StockRef[],
  productResolution: NameResolution,
  itemResolution: NameResolution,
): RecipeImport {
  const productByName = new Map(products.map((p) => [normaliseName(p.name), p.id]));
  const itemByName = new Map(items.map((i) => [normaliseName(i.name), i]));
  const itemById = new Map(items.map((i) => [i.id, i]));
  const recipes: RecipeImport['recipes'] = {};
  const problems: RowProblem[] = [];
  const unresolved = new Set<string>();
  const seen = new Map<string, number>();
  let skipped = 0;

  for (const d of drafts) {
    const messages = [...d.messages];
    let productId: string | null | undefined = productByName.get(normaliseName(d.productName));
    if (productId === undefined && d.productName) {
      const choice = productResolution[normaliseName(d.productName)];
      if (choice === undefined) unresolved.add(d.productName);
      productId = choice ?? null;
    }
    let item: StockRef | null | undefined = itemByName.get(normaliseName(d.itemName));
    if (item === undefined && d.itemName) {
      const choice = itemResolution[normaliseName(d.itemName)];
      if (choice === undefined) unresolved.add(d.itemName);
      item = choice ? itemById.get(choice) ?? null : null;
    }
    if (messages.length === 0 && (productId === null || item === null)) {
      skipped++;
      continue;
    }
    if (messages.length === 0 && productId && item && d.unit) {
      if (UNITS[d.unit].dimension !== UNITS[item.unit].dimension) {
        messages.push(t('{name} is measured in {unit}, so it can’t use {other}.', { name: item.name, unit: t(UNITS[item.unit].plural), other: t(UNITS[d.unit].plural) }));
      }
      const key = `${productId}|${item.id}`;
      if (seen.has(key)) messages.push(t('{name} is listed twice for this product (also row {row}).', { name: item.name, row: String(seen.get(key)) }));
      else seen.set(key, d.rowNumber);
    }
    if (messages.length > 0 || !productId || !item || !d.unit) {
      if (messages.length > 0) problems.push({ rowNumber: d.rowNumber, messages });
      continue;
    }
    (recipes[productId] ??= []).push({ itemId: item.id, quantity: d.quantity, unit: d.unit });
  }
  return { recipes, problems, skipped, unresolved: [...unresolved] };
}
