/**
 * Sensitivity analysis and degree of operating leverage (DOL).
 *
 * "What happens to operating profit if ONE input moves by ±10 % and
 * everything else stays the same?" Each change follows directly from the
 * contribution-format income statement:
 *
 *   Selling prices ±p %   → revenue changes by p % of total revenue
 *   Variable costs ±p %   → variable costs change by p % of total variable costs
 *   Sales volume ±p %     → revenue AND variable costs both change by p %, so
 *                           contribution margin changes by p % (same sales mix)
 *   Fixed costs ±p %      → fixed costs change by p % of fixed costs
 *
 * Everything is worked in whole cents; each change is rounded to the nearest
 * cent once (halves rounded away from zero).
 */
import { toCents, type BusinessSummary } from './business';

export type SensitivityFactor = 'prices' | 'variableCosts' | 'volume' | 'fixedCosts';

export interface SensitivityRow {
  factor: SensitivityFactor;
  label: string;
  /** The total the percentage is applied to (e.g. total revenue for prices). */
  baseAmount: number;
  /** Name of that total, for explanations ("total revenue"). */
  baseName: string;
  /** Change in operating profit when the input goes DOWN by p %. */
  downChange: number;
  /** Change in operating profit when the input goes UP by p %. */
  upChange: number;
  downProfit: number;
  upProfit: number;
  /** Change as a % of current operating profit; null when current profit is $0. */
  downPercent: number | null;
  upPercent: number | null;
}

export interface SensitivityResult {
  percent: number;
  baseProfit: number;
  rows: SensitivityRow[];
}

/** Rounds a whole number ÷ 100 to the nearest whole number, halves away from zero. */
function divideBy100(n: number): number {
  const sign = n < 0 ? -1 : 1;
  const a = Math.abs(n);
  const q = Math.floor(a / 100);
  return sign * (a % 100 >= 50 ? q + 1 : q);
}

/** p % of an amount in cents, rounded to the nearest cent. `percent` must be a whole number. */
export function percentOfCents(amountC: number, percent: number): number {
  return divideBy100(amountC * percent);
}

export function sensitivity(s: BusinessSummary, percent = 10): SensitivityResult {
  const revC = toCents(s.totalRevenue);
  const vcC = toCents(s.totalVariableCosts);
  const cmC = toCents(s.totalCM);
  const fixedC = toCents(s.fixedCosts);
  const profitC = cmC - fixedC;

  // +1 means "profit rises when this input rises", −1 means it falls.
  const defs: { factor: SensitivityFactor; label: string; baseC: number; baseName: string; direction: 1 | -1 }[] = [
    { factor: 'prices', label: 'Selling prices', baseC: revC, baseName: 'total revenue', direction: 1 },
    { factor: 'variableCosts', label: 'Variable costs', baseC: vcC, baseName: 'total variable costs', direction: -1 },
    { factor: 'volume', label: 'Sales volume (same mix)', baseC: cmC, baseName: 'total contribution margin', direction: 1 },
    { factor: 'fixedCosts', label: 'Fixed costs', baseC: fixedC, baseName: 'fixed costs', direction: -1 },
  ];

  const pctOfProfit = (changeC: number) => (profitC === 0 ? null : (changeC / Math.abs(profitC)) * 100);

  const rows = defs.map((d): SensitivityRow => {
    const upC = d.direction * percentOfCents(d.baseC, percent);
    const downC = -upC;
    return {
      factor: d.factor,
      label: d.label,
      baseAmount: d.baseC / 100,
      baseName: d.baseName,
      downChange: downC / 100,
      upChange: upC / 100,
      downProfit: (profitC + downC) / 100,
      upProfit: (profitC + upC) / 100,
      downPercent: pctOfProfit(downC),
      upPercent: pctOfProfit(upC),
    };
  });

  return { percent, baseProfit: profitC / 100, rows };
}

/** Rows sorted by how much profit swings (largest first) – the order of a tornado chart. */
export function tornadoOrder(rows: SensitivityRow[]): SensitivityRow[] {
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => Math.abs(b.r.upChange) - Math.abs(a.r.upChange) || a.i - b.i)
    .map(({ r }) => r);
}

/* ------------------------------------------------------------------ */
/* Degree of operating leverage                                        */
/* ------------------------------------------------------------------ */

export type OperatingLeverage =
  | { status: 'ok'; value: number; totalCM: number; operatingProfit: number }
  | { status: 'not-meaningful'; reason: string; totalCM: number; operatingProfit: number };

/**
 * DOL = total contribution margin ÷ operating profit.
 * Only meaningful when operating profit is positive.
 */
export function operatingLeverage(s: BusinessSummary): OperatingLeverage {
  const cmC = toCents(s.totalCM);
  const profitC = cmC - toCents(s.fixedCosts);
  const base = { totalCM: cmC / 100, operatingProfit: profitC / 100 };
  if (profitC === 0) {
    return { status: 'not-meaningful', reason: 'Operating profit is exactly $0, and dividing by $0 has no answer. At break-even, any small change in sales is an infinitely large percentage change in profit.', ...base };
  }
  if (profitC < 0) {
    return { status: 'not-meaningful', reason: 'The business has an operating loss. Dividing by a negative profit gives a negative number that can’t be read as “profit changes this many times as fast as sales”.', ...base };
  }
  return { status: 'ok', value: cmC / profitC, ...base };
}

/** DOL shown to 2 decimals, e.g. 2.54. */
export function formatLeverage(value: number): string {
  return value.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
