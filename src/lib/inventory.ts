/**
 * Inventory & Sales Estimator – calculations.
 *
 * How many finished products can be made from the inventory on hand, which
 * item runs out first, and what that means for sales, revenue and profit.
 * Revenue and profit reuse `calculate` from accounting.ts, so they follow
 * exactly the same formulas as the rest of the app.
 *
 * Quantities are converted to a base unit (grams, millilitres or pieces) and
 * stored as whole thousandths of that unit. Using whole numbers keeps the
 * "round down" step exact (e.g. 0.3 ÷ 0.1 is exactly 3, not 2.9999…).
 */
import { calculate, type PricingInputs } from './accounting';
import type { BusinessId } from './businesses';
import { cleanNumberText, type ParseResult } from './validation';

/* ------------------------------------------------------------------ */
/* Units                                                               */
/* ------------------------------------------------------------------ */

export type UnitId = 'g' | 'kg' | 'mL' | 'L' | 'pcs';
export type Dimension = 'mass' | 'volume' | 'count';

interface UnitInfo {
  short: string;
  singular: string;
  plural: string;
  dimension: Dimension;
  /** How many base units (g, mL or pieces) one of this unit equals. */
  factor: number;
}

export const UNITS: Record<UnitId, UnitInfo> = {
  g: { short: 'g', singular: 'gram', plural: 'grams', dimension: 'mass', factor: 1 },
  kg: { short: 'kg', singular: 'kilogram', plural: 'kilograms', dimension: 'mass', factor: 1000 },
  mL: { short: 'mL', singular: 'millilitre', plural: 'millilitres', dimension: 'volume', factor: 1 },
  L: { short: 'L', singular: 'litre', plural: 'litres', dimension: 'volume', factor: 1000 },
  pcs: { short: 'pcs', singular: 'piece', plural: 'pieces', dimension: 'count', factor: 1 },
};

export const UNIT_OPTIONS: { id: UnitId; label: string }[] = [
  { id: 'g', label: 'grams (g)' },
  { id: 'kg', label: 'kilograms (kg)' },
  { id: 'mL', label: 'millilitres (mL)' },
  { id: 'L', label: 'litres (L)' },
  { id: 'pcs', label: 'pieces' },
];

/** Converts a quantity to whole thousandths of its base unit (g, mL or pieces). */
export function toBase(value: number, unit: UnitId): number {
  return Math.round(value * UNITS[unit].factor * 1000);
}

/* ------------------------------------------------------------------ */
/* Inputs and validation                                               */
/* ------------------------------------------------------------------ */

/** One inventory row exactly as the user typed it. */
export interface InventoryItemInput {
  id: string;
  name: string;
  available: string;
  availableUnit: UnitId;
  required: string;
  requiredUnit: UnitId;
}

export interface ParsedItem {
  id: string;
  name: string;
  dimension: Dimension;
  /** Available quantity in thousandths of the base unit. */
  availableBase: number;
  /** Quantity needed for one product, in thousandths of the base unit. */
  requiredBase: number;
}

export type ItemErrors = Partial<Record<'name' | 'available' | 'required' | 'unit', string>>;

/** Largest quantity accepted in any inventory field (one billion). */
export const MAX_QUANTITY = 1_000_000_000;

export function parseQuantity(raw: string, kind: 'available' | 'required'): ParseResult {
  if (raw.trim() === '') {
    return {
      ok: false,
      error: kind === 'available' ? 'Please enter the quantity available.' : 'Please enter how much one product uses.',
    };
  }
  const cleaned = cleanNumberText(raw);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;

  if (/^[-−–]/.test(text)) {
    return {
      ok: false,
      error:
        kind === 'available'
          ? "Quantity available can't be negative. Enter 0 if you have none."
          : "Quantity per product can't be negative.",
    };
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { ok: false, error: 'Please use numbers only, for example 2000 or 2.5.' };
  }
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 3) {
    return { ok: false, error: 'Please use no more than 3 decimal places.' };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_QUANTITY) {
    return { ok: false, error: 'That number is larger than this estimator supports (max 1,000,000,000).' };
  }
  if (kind === 'required' && value === 0) {
    return {
      ok: false,
      error: 'Quantity per product must be more than 0. If a product doesn’t use this item, remove the item instead.',
    };
  }
  return { ok: true, value };
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function validateItem(item: InventoryItemInput): { parsed: ParsedItem | null; errors: ItemErrors } {
  const errors: ItemErrors = {};
  const name = item.name.trim();
  if (name === '') errors.name = 'Please give this item a name, such as “Milk”.';

  const available = parseQuantity(item.available, 'available');
  if (!available.ok) errors.available = available.error;
  const required = parseQuantity(item.required, 'required');
  if (!required.ok) errors.required = required.error;

  const a = UNITS[item.availableUnit];
  const r = UNITS[item.requiredUnit];
  if (a.dimension !== r.dimension) {
    errors.unit = `${capitalise(a.plural)} and ${r.plural} can’t be converted. Use weight (g, kg), volume (mL, L) or pieces for both quantities.`;
  }

  if (Object.keys(errors).length > 0 || !available.ok || !required.ok) return { parsed: null, errors };
  return {
    parsed: {
      id: item.id,
      name,
      dimension: a.dimension,
      availableBase: toBase(available.value, item.availableUnit),
      requiredBase: toBase(required.value, item.requiredUnit),
    },
    errors,
  };
}

export interface InventoryValidation {
  /** Every item parsed, or `null` if there are no items or any item is invalid. */
  parsed: ParsedItem[] | null;
  errors: Record<string, ItemErrors>;
  issue: 'no-items' | 'invalid' | null;
}

export function validateInventory(items: InventoryItemInput[]): InventoryValidation {
  if (items.length === 0) return { parsed: null, errors: {}, issue: 'no-items' };
  const errors: Record<string, ItemErrors> = {};
  const parsed: ParsedItem[] = [];
  for (const item of items) {
    const result = validateItem(item);
    if (result.parsed) parsed.push(result.parsed);
    else errors[item.id] = result.errors;
  }
  // Ignoring an invalid row could overstate capacity, so nothing is calculated
  // until every row is valid.
  if (Object.keys(errors).length > 0) return { parsed: null, errors, issue: 'invalid' };
  return { parsed, errors, issue: null };
}

/* ------------------------------------------------------------------ */
/* Maximum production                                                  */
/* ------------------------------------------------------------------ */

/** Whole-number division rounded DOWN, exact for whole-number inputs. */
function floorDiv(a: number, b: number): number {
  let q = Math.floor(a / b);
  while (q > 0 && q * b > a) q--;
  while ((q + 1) * b <= a) q++;
  return q;
}

export interface ItemCapacity extends ParsedItem {
  /** Available ÷ required per product, rounded down. */
  maxProducts: number;
  isLimiting: boolean;
}

export interface ProductionResult {
  items: ItemCapacity[];
  /** The lowest maxProducts across all items. */
  maxProduction: number;
  /** Every item tied for the lowest result. */
  limiting: ItemCapacity[];
}

export function calculateProduction(items: ParsedItem[]): ProductionResult {
  if (items.length === 0) throw new Error('At least one inventory item is required.');
  // Maximum Products From Each Item = Available Quantity ÷ Quantity Required Per Product (rounded down)
  const withMax = items.map((item) => ({ ...item, maxProducts: floorDiv(item.availableBase, item.requiredBase) }));
  // Overall maximum = the LOWEST result among all items
  const maxProduction = Math.min(...withMax.map((i) => i.maxProducts));
  const capacities = withMax.map((i) => ({ ...i, isLimiting: i.maxProducts === maxProduction }));
  return { items: capacities, maxProduction, limiting: capacities.filter((i) => i.isLimiting) };
}

/* ------------------------------------------------------------------ */
/* Sales estimate                                                      */
/* ------------------------------------------------------------------ */

export interface SalesEstimate {
  /** Production capacity from materials. */
  maxProduction: number;
  /** Expected customer demand (expected monthly sales from Step 2). */
  expectedDemand: number;
  /** MIN(maximum production, expected demand). */
  estimatedSales: number;
  inventorySufficient: boolean;
  /** Maximum production × selling price (assumes everything producible is sold). */
  maxPotentialRevenue: number;
  /** Estimated sales × selling price. */
  estimatedRevenue: number;
  /** Estimated sales × (price − variable cost) − fixed costs. */
  estimatedOperatingProfit: number;
  /** Operating profit on the main dashboard (assumes all expected sales happen). */
  dashboardProfit: number;
}

export function estimateSales(maxProduction: number, pricing: PricingInputs): SalesEstimate {
  const expectedDemand = pricing.units;
  // Estimated Sales = MIN(Maximum Production, Expected Monthly Sales)
  const estimatedSales = Math.min(maxProduction, expectedDemand);
  const atCapacity = calculate({ ...pricing, units: maxProduction });
  const atEstimate = calculate({ ...pricing, units: estimatedSales });
  return {
    maxProduction,
    expectedDemand,
    estimatedSales,
    inventorySufficient: maxProduction >= expectedDemand,
    maxPotentialRevenue: atCapacity.revenue,
    estimatedRevenue: atEstimate.revenue,
    estimatedOperatingProfit: atEstimate.operatingProfit,
    dashboardProfit: calculate(pricing).operatingProfit,
  };
}

/* ------------------------------------------------------------------ */
/* Shortages                                                           */
/* ------------------------------------------------------------------ */

export interface Shortage {
  id: string;
  name: string;
  dimension: Dimension;
  /** Expected sales × quantity required per product. */
  requiredTotalBase: number;
  availableBase: number;
  /** MAX(0, required − available). */
  shortageBase: number;
}

export function findShortages(items: ParsedItem[], expectedSales: number): Shortage[] {
  return items.map((item) => {
    // Required Inventory = Expected Sales Volume × Quantity Required Per Product
    const requiredTotalBase = expectedSales * item.requiredBase;
    return {
      id: item.id,
      name: item.name,
      dimension: item.dimension,
      requiredTotalBase,
      availableBase: item.availableBase,
      // Shortage = MAX(0, Required Inventory − Available Inventory)
      shortageBase: Math.max(0, requiredTotalBase - item.availableBase),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

const quantityFormat = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 3 });

/**
 * Shows a base quantity in a friendly unit: 15,000 mL → "15 litres",
 * 500 g → "500 grams", 1,000 g → "1 kilogram".
 */
export function formatQuantity(base: number, dimension: Dimension, style: 'long' | 'short' = 'long'): string {
  let value = base / 1000;
  let unit: UnitId;
  if (dimension === 'count') unit = 'pcs';
  else if (value >= 1000) {
    unit = dimension === 'mass' ? 'kg' : 'L';
    value /= 1000;
  } else unit = dimension === 'mass' ? 'g' : 'mL';
  const info = UNITS[unit];
  const num = quantityFormat.format(value);
  if (style === 'short') return `${num} ${info.short}`;
  return `${num} ${value === 1 ? info.singular : info.plural}`;
}

/** Keeps a name as typed but lower-cases a capital first letter mid-sentence ("Milk" → "milk", "BC salt" stays). */
export function midSentence(name: string): string {
  return /^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name;
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/* ------------------------------------------------------------------ */
/* Business-specific wording and fictional sample inventory            */
/* ------------------------------------------------------------------ */

export interface ProductNoun {
  one: string;
  many: string;
}

export const PRODUCT_NOUNS: Record<BusinessId, ProductNoun> = {
  coffee: { one: 'coffee', many: 'coffees' },
  bakery: { one: 'baked good', many: 'baked goods' },
  nails: { one: 'service', many: 'services' },
  clothing: { one: 'item', many: 'items' },
  custom: { one: 'product', many: 'products' },
};

export function countNoun(count: number, noun: ProductNoun): string {
  return `${count.toLocaleString('en-CA')} ${count === 1 ? noun.one : noun.many}`;
}

export const BUSINESS_NOTES: Partial<Record<BusinessId, string>> = {
  nails:
    'For a service business, the result is the number of services your consumable supplies can cover. It does not account for staff availability or appointment capacity.',
  clothing:
    'Enter your finished products as inventory, with 1 piece required per item sold. Add packaging, such as shopping bags, as separate items.',
};

type SampleItem = Omit<InventoryItemInput, 'id'>;

/** Fictional example inventory for each business – not industry benchmarks. */
export const SAMPLE_INVENTORY: Record<BusinessId, SampleItem[]> = {
  coffee: [
    { name: 'Coffee beans', available: '2000', availableUnit: 'g', required: '20', requiredUnit: 'g' },
    { name: 'Milk', available: '5000', availableUnit: 'mL', required: '200', requiredUnit: 'mL' },
    { name: 'Coffee cups', available: '100', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
  ],
  bakery: [
    { name: 'Flour', available: '25', availableUnit: 'kg', required: '80', requiredUnit: 'g' },
    { name: 'Butter', available: '5', availableUnit: 'kg', required: '20', requiredUnit: 'g' },
    { name: 'Pastry boxes', available: '400', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
  ],
  nails: [
    { name: 'Gel polish', available: '1', availableUnit: 'L', required: '5', requiredUnit: 'mL' },
    { name: 'Nail files', available: '200', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
    { name: 'Cotton pads', available: '1000', availableUnit: 'pcs', required: '4', requiredUnit: 'pcs' },
  ],
  clothing: [
    { name: 'Finished clothing items', available: '150', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
    { name: 'Shopping bags', available: '200', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
  ],
  custom: [
    { name: 'Main material', available: '10', availableUnit: 'kg', required: '50', requiredUnit: 'g' },
    { name: 'Packaging', available: '80', availableUnit: 'pcs', required: '1', requiredUnit: 'pcs' },
  ],
};
