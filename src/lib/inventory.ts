/**
 * Inventory units, quantities and the round-down production rule.
 * (Shared-inventory planning for several products lives in planning.ts.)
 *
 * Quantities are converted to a base unit (grams, millilitres or pieces) and
 * stored as whole thousandths of that unit. Using whole numbers keeps the
 * "round down" step exact (e.g. 0.3 ÷ 0.1 is exactly 3, not 2.9999…).
 */
import { getLanguage, locale, t, tx } from '../i18n/i18n';
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
  g: { short: 'g', singular: tx('gram'), plural: tx('grams'), dimension: 'mass', factor: 1 },
  kg: { short: 'kg', singular: tx('kilogram'), plural: tx('kilograms'), dimension: 'mass', factor: 1000 },
  mL: { short: 'mL', singular: tx('millilitre'), plural: tx('millilitres'), dimension: 'volume', factor: 1 },
  L: { short: 'L', singular: tx('litre'), plural: tx('litres'), dimension: 'volume', factor: 1000 },
  pcs: { short: 'pcs', singular: tx('piece'), plural: tx('pieces'), dimension: 'count', factor: 1 },
};

export const UNIT_OPTIONS: { id: UnitId; label: string }[] = [
  { id: 'g', label: tx('grams (g)') },
  { id: 'kg', label: tx('kilograms (kg)') },
  { id: 'mL', label: tx('millilitres (mL)') },
  { id: 'L', label: tx('litres (L)') },
  { id: 'pcs', label: tx('pieces') },
];

/** Converts a quantity to whole thousandths of its base unit (g, mL or pieces). */
export function toBase(value: number, unit: UnitId): number {
  return Math.round(value * UNITS[unit].factor * 1000);
}

/* ------------------------------------------------------------------ */
/* Quantities                                                          */
/* ------------------------------------------------------------------ */

/** Quantity ready for the round-down production calculation. */
export interface ParsedItem {
  id: string;
  name: string;
  dimension: Dimension;
  /** Available quantity in thousandths of the base unit. */
  availableBase: number;
  /** Quantity needed for one product, in thousandths of the base unit. */
  requiredBase: number;
}

/** Largest quantity accepted in any inventory field (one billion). */
export const MAX_QUANTITY = 1_000_000_000;

export function parseQuantity(raw: string, kind: 'available' | 'required'): ParseResult {
  if (raw.trim() === '') {
    return {
      ok: false,
      error: kind === 'available' ? t('Please enter the quantity available.') : t('Please enter how much one product uses.'),
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
          ? t("Quantity available can't be negative. Enter 0 if you have none.")
          : t("Quantity per product can't be negative."),
    };
  }
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { ok: false, error: t('Please use numbers only, for example 2000 or 2.5.') };
  }
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 3) {
    return { ok: false, error: t('Please use no more than 3 decimal places.') };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_QUANTITY) {
    return { ok: false, error: t('That number is larger than this estimator supports (max 1,000,000,000).') };
  }
  if (kind === 'required' && value === 0) {
    return {
      ok: false,
      error: t('Quantity per product must be more than 0. If a product doesn’t use this item, remove the item instead.'),
    };
  }
  return { ok: true, value };
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
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

const quantityFormats = new Map<string, Intl.NumberFormat>();
const quantityFormat = () => {
  const loc = locale();
  if (!quantityFormats.has(loc)) quantityFormats.set(loc, new Intl.NumberFormat(loc, { maximumFractionDigits: 3 }));
  return quantityFormats.get(loc)!;
};

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
  const num = quantityFormat().format(value);
  if (style === 'short') return `${num} ${info.short}`;
  // English: 1 is singular. French: anything under 2 is singular (« 1,25 kilogramme »).
  const singular = getLanguage() === 'fr' ? Math.abs(value) < 2 : value === 1;
  return `${num} ${t(singular ? info.singular : info.plural)}`;
}

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return t('{first} and {last}', { first: names.slice(0, -1).join(', '), last: names[names.length - 1] });
}

/* ------------------------------------------------------------------ */
/* Business-specific notes                                             */
/* ------------------------------------------------------------------ */

export const BUSINESS_NOTES: Partial<Record<BusinessId, string>> = {
  nails:
    tx('For a service business, the result is the number of services your consumable supplies can cover. It does not account for staff availability or appointment capacity.'),
  clothing:
    tx('Enter your finished products as inventory, with 1 piece required per item sold. Add packaging, such as shopping bags, as separate items.'),
};
