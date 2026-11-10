/**
 * Inventory records: validation, duplicate detection, purchase costs and
 * unit changes. Builds on the units and quantity rules in inventory.ts.
 */
import { t } from '../i18n/i18n';
import { MAX_QUANTITY, UNITS, parseQuantity, toBase, type Dimension, type UnitId } from './inventory';
import type { InventoryRecord } from './types';
import { cleanNumberText } from './validation';

export interface ParsedStockItem {
  id: string;
  name: string;
  unit: UnitId;
  dimension: Dimension;
  /** Available quantity in thousandths of the base unit (g, mL or piece). */
  availableBase: number;
  /** Purchase cost per ONE base unit (per g, per mL or per piece), or null if unknown. */
  costPerBaseUnit: number | null;
}

export type StockErrors = Partial<Record<'name' | 'quantity' | 'cost', string>>;

/** Purchase cost per unit: blank = unknown (null). Up to 6 decimals, e.g. $0.002 per mL. */
export function parseCost(raw: string): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw.trim() === '') return { ok: true, value: null };
  const cleaned = cleanNumberText(raw);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  let text = cleaned.text;
  if (/^[-−–]/.test(text) || /^\$[-−–]/.test(text)) return { ok: false, error: t("Cost can't be negative.") };
  if (text.startsWith('$')) text = text.slice(1);
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, error: t('Please use numbers only, for example 0.03.') };
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 6) return { ok: false, error: t('Please use no more than 6 decimal places.') };
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_QUANTITY) return { ok: false, error: t('That cost is too large.') };
  return { ok: true, value };
}

export const normaliseName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export interface StockValidation {
  items: ParsedStockItem[];
  errors: Record<string, StockErrors>;
  ok: boolean;
}

export function validateStock(records: InventoryRecord[]): StockValidation {
  const errors: Record<string, StockErrors> = {};
  const items: ParsedStockItem[] = [];
  const nameCount = new Map<string, number>();
  for (const r of records) {
    const key = normaliseName(r.name);
    if (key) nameCount.set(key, (nameCount.get(key) ?? 0) + 1);
  }

  for (const r of records) {
    const e: StockErrors = {};
    const key = normaliseName(r.name);
    if (!key) e.name = t('Please enter an item name.');
    else if ((nameCount.get(key) ?? 0) > 1) e.name = t('Another item is also called “{name}”. Duplicates are not merged – rename or delete one.', { name: r.name.trim() });

    const q = parseQuantity(r.quantity, 'available');
    if (!q.ok) e.quantity = q.error;
    const c = parseCost(r.cost);
    if (!c.ok) e.cost = c.error;

    if (Object.keys(e).length > 0) {
      errors[r.id] = e;
      continue;
    }
    if (q.ok && c.ok) {
      items.push({
        id: r.id,
        name: r.name.trim(),
        unit: r.unit,
        dimension: UNITS[r.unit].dimension,
        availableBase: toBase(q.value, r.unit),
        costPerBaseUnit: c.value === null ? null : c.value / UNITS[r.unit].factor,
      });
    }
  }
  return { items, errors, ok: Object.keys(errors).length === 0 };
}

/* ------------------------------------------------------------------ */
/* Changing an item's unit                                             */
/* ------------------------------------------------------------------ */

function decimalsOf(n: number): number {
  const s = String(n);
  if (s.includes('e')) return 99;
  return s.includes('.') ? s.split('.')[1].length : 0;
}

const trimNumber = (n: number, maxDecimals: number) => String(Number(n.toFixed(maxDecimals)));

/**
 * Changing between compatible units converts the quantity and cost
 * (2,000 g → 2 kg, $0.03/g → $30/kg). Changing to an incompatible unit is
 * NOT converted – the numbers stay as typed and recipes will flag the mismatch.
 */
export function changeUnit(
  record: InventoryRecord,
  newUnit: UnitId,
): { record: InventoryRecord; converted: boolean; note?: string } {
  const from = UNITS[record.unit];
  const to = UNITS[newUnit];
  if (record.unit === newUnit) return { record, converted: false };
  if (from.dimension !== to.dimension) {
    return {
      record: { ...record, unit: newUnit },
      converted: false,
      note: `${from.plural} can’t be converted to ${to.plural}, so the numbers were not changed. Check them.`,
    };
  }
  const ratio = from.factor / to.factor;
  const next = { ...record, unit: newUnit };

  const q = parseQuantity(record.quantity, 'available');
  if (q.ok) {
    const converted = Number((q.value * ratio).toPrecision(15));
    if (decimalsOf(converted) > 3) {
      return { record, converted: false, note: `Can’t switch to ${to.plural} without losing precision (more than 3 decimal places).` };
    }
    next.quantity = trimNumber(converted, 3);
  }
  const c = parseCost(record.cost);
  if (c.ok && c.value !== null) {
    const converted = Number((c.value / ratio).toPrecision(15));
    if (decimalsOf(converted) > 6) {
      return { record, converted: false, note: `Can’t switch to ${to.plural} without rounding the cost (more than 6 decimal places).` };
    }
    next.cost = trimNumber(converted, 6);
  }
  return { record: next, converted: true };
}

/* ------------------------------------------------------------------ */
/* Reading unit names typed in spreadsheets                            */
/* ------------------------------------------------------------------ */

const UNIT_ALIASES: Record<string, UnitId> = {
  g: 'g', gram: 'g', grams: 'g', gr: 'g', gm: 'g', gms: 'g',
  kg: 'kg', kgs: 'kg', kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg',
  ml: 'mL', millilitre: 'mL', millilitres: 'mL', milliliter: 'mL', milliliters: 'mL',
  l: 'L', litre: 'L', litres: 'L', liter: 'L', liters: 'L', lt: 'L', ltr: 'L',
  pcs: 'pcs', pc: 'pcs', piece: 'pcs', pieces: 'pcs', each: 'pcs', ea: 'pcs', unit: 'pcs', units: 'pcs', item: 'pcs', items: 'pcs',
  // French (accents are removed before looking up): gramme, kilogramme, pièce, unité…
  gramme: 'g', grammes: 'g', kilogramme: 'kg', kilogrammes: 'kg', unite: 'pcs', unites: 'pcs', article: 'pcs', articles: 'pcs',
};

export function parseUnitText(raw: string): UnitId | null {
  const key = raw.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\.$/, '');
  return UNIT_ALIASES[key] ?? null;
}
