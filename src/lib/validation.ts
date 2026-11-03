/**
 * Input validation. The form keeps what the user typed as text, so invalid
 * entries are never silently replaced with zero – they are shown back to the
 * user with a friendly message instead.
 */
import type { PricingInputs } from './accounting';

export type FieldKey = 'sellingPrice' | 'variableCost' | 'fixedCosts' | 'units';

export const FIELD_KEYS: FieldKey[] = ['sellingPrice', 'variableCost', 'fixedCosts', 'units'];

/** Largest value accepted in any field (one billion). */
export const MAX_VALUE = 1_000_000_000;

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

export interface RawInputs {
  businessName: string;
  sellingPrice: string;
  variableCost: string;
  fixedCosts: string;
  units: string;
}

const FIELD_NAMES: Record<FieldKey, string> = {
  sellingPrice: 'selling price',
  variableCost: 'variable cost',
  fixedCosts: 'fixed costs',
  units: 'sales volume',
};

/** Removes spaces and checks that any commas are proper thousands separators. */
export function cleanNumberText(raw: string): { text: string } | { error: string } {
  const text = raw.trim().replace(/\s+/g, '');
  if (text.includes(',')) {
    if (!/^\$?\d{1,3}(,\d{3})+(\.\d*)?$/.test(text)) {
      return { error: 'Please check the commas – use them only as thousands separators, like 1,500.' };
    }
    return { text: text.replace(/,/g, '') };
  }
  return { text };
}

export function parseMoney(raw: string, field: Exclude<FieldKey, 'units'>): ParseResult {
  return parseAmount(raw, FIELD_NAMES[field]);
}

/** Validates a CAD amount (0 or more, max 2 decimals). `name` is used in messages, e.g. "selling price". */
export function parseAmount(raw: string, name: string): ParseResult {
  if (raw.trim() === '') return { ok: false, error: `Please enter the ${name}.` };

  const cleaned = cleanNumberText(raw);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  let text = cleaned.text;

  if (/^[-−–]/.test(text) || /^\$[-−–]/.test(text)) {
    return { ok: false, error: `The ${name} can't be negative. Please enter 0 or more.` };
  }
  if (text.startsWith('$')) text = text.slice(1);

  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    return { ok: false, error: 'Please use numbers only, for example 6 or 6.50.' };
  }
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 2) {
    return { ok: false, error: 'Please use no more than 2 decimal places (dollars and cents).' };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_VALUE) {
    return { ok: false, error: 'That number is larger than this simulator supports (max $1,000,000,000).' };
  }
  return { ok: true, value };
}

export function parseUnits(raw: string): ParseResult {
  if (raw.trim() === '') return { ok: false, error: 'Please enter your expected monthly sales volume.' };

  const cleaned = cleanNumberText(raw);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;

  if (/^[-−–]/.test(text)) {
    return { ok: false, error: "Sales volume can't be negative. Please enter 0 or more." };
  }
  if (/^\d*\.\d*$/.test(text) && text !== '.') {
    return { ok: false, error: 'Please enter a whole number of units – you can’t sell part of a unit.' };
  }
  if (!/^\d+$/.test(text)) {
    return { ok: false, error: 'Please use whole numbers only, for example 300.' };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value > MAX_VALUE) {
    return { ok: false, error: 'That number is larger than this simulator supports (max 1,000,000,000 units).' };
  }
  return { ok: true, value };
}

export function parseField(field: FieldKey, raw: string): ParseResult {
  return field === 'units' ? parseUnits(raw) : parseMoney(raw, field);
}

export interface ValidationResult {
  /** Parsed numbers, or `null` if any field is invalid. */
  values: PricingInputs | null;
  errors: Partial<Record<FieldKey, string>>;
}

export function validateInputs(raw: RawInputs): ValidationResult {
  const errors: Partial<Record<FieldKey, string>> = {};
  const parsed: Partial<PricingInputs> = {};
  for (const key of FIELD_KEYS) {
    const result = parseField(key, raw[key]);
    if (result.ok) parsed[key] = result.value;
    else errors[key] = result.error;
  }
  const valid = Object.keys(errors).length === 0;
  return { values: valid ? (parsed as PricingInputs) : null, errors };
}

/** Turns a number back into text for an input box (6 → "6", 6.5 → "6.50"). */
export function toInputText(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}
