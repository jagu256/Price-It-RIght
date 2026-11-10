/**
 * 📅 12-month projection with seasonality.
 *
 * Each month has a sales multiplier (100 % = the expected monthly sales you
 * entered, keeping the same sales mix) and its own fixed costs.
 *
 *   Units in a month   = expected units × multiplier, rounded DOWN to whole units
 *   Month results      = the usual contribution-format figures for those units
 *   Annual totals      = the sum of the 12 months (worked in whole cents)
 *
 * A month is "below break-even" when its operating profit is less than $0.
 */
import { t, tx } from '../i18n/i18n';
import { businessSummary, toCents, type ProductNumbers } from './business';
import { cleanNumberText } from './validation';

/** English month names (shown with t() on screen). */
export const MONTHS = [tx('January'), tx('February'), tx('March'), tx('April'), tx('May'), tx('June'), tx('July'), tx('August'), tx('September'), tx('October'), tx('November'), tx('December')];

/** Highest multiplier accepted (10× normal sales). */
export const MAX_MULTIPLIER_PERCENT = 1000;

export type PercentResult = { ok: true; basisPoints: number; percent: number } | { ok: false; error: string };

/** Sales multiplier: 0 to 1,000 %, up to 2 decimals, with or without a % sign. */
export function parseMultiplier(raw: string): PercentResult {
  const trimmed = raw.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { ok: false, error: t('Please enter a sales level, for example 100 for a normal month.') };
  const cleaned = cleanNumberText(trimmed);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;
  if (/^[-−–]/.test(text)) return { ok: false, error: t('A sales level can’t be negative. Use 0 for a month with no sales.') };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, error: t('Please enter the sales level as a number, for example 120.') };
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 2) return { ok: false, error: t('Please use no more than 2 decimal places.') };
  const percent = Number(text);
  if (percent > MAX_MULTIPLIER_PERCENT) return { ok: false, error: t('The sales level must be between 0 and {max} %.', { max: MAX_MULTIPLIER_PERCENT }) };
  return { ok: true, basisPoints: Math.round(percent * 100), percent };
}

export interface MonthInput {
  /** Sales multiplier in basis points (100 % = 10,000). */
  multiplierBasisPoints: number;
  fixedCosts: number;
}

export interface MonthResult {
  month: string;
  /** 1–12 */
  index: number;
  multiplierPercent: number;
  units: { id: string; name: string; units: number }[];
  totalUnits: number;
  revenue: number;
  variableCosts: number;
  contributionMargin: number;
  fixedCosts: number;
  operatingProfit: number;
  belowBreakEven: boolean;
}

export interface ProjectionResult {
  months: MonthResult[];
  annual: { totalUnits: number; revenue: number; variableCosts: number; contributionMargin: number; fixedCosts: number; operatingProfit: number };
  /** Highest operating profit (earliest month if tied). */
  best: MonthResult;
  /** Lowest operating profit (earliest month if tied). */
  worst: MonthResult;
  monthsBelowBreakEven: string[];
}

/** Whole units in a month: expected units × multiplier, rounded down. */
export function unitsForMonth(expectedUnits: number, multiplierBasisPoints: number): number {
  return Math.floor((expectedUnits * multiplierBasisPoints) / 10_000);
}

export function projectYear(products: ProductNumbers[], months: MonthInput[]): ProjectionResult {
  if (months.length !== 12) throw new Error('A projection needs exactly 12 months.');
  const results: MonthResult[] = months.map((m, i) => {
    const scaled = products.map((p) => ({ ...p, units: unitsForMonth(p.units, m.multiplierBasisPoints) }));
    const s = businessSummary(scaled, m.fixedCosts);
    const profitC = toCents(s.operatingProfit);
    return {
      month: MONTHS[i],
      index: i + 1,
      multiplierPercent: m.multiplierBasisPoints / 100,
      units: scaled.map((p) => ({ id: p.id, name: p.name, units: p.units })),
      totalUnits: s.totalUnits,
      revenue: s.totalRevenue,
      variableCosts: s.totalVariableCosts,
      contributionMargin: s.totalCM,
      fixedCosts: s.fixedCosts,
      operatingProfit: s.operatingProfit,
      belowBreakEven: profitC < 0,
    };
  });

  // Annual totals: add the months up in whole cents.
  const sumC = (pick: (m: MonthResult) => number) => results.reduce((t, m) => t + toCents(pick(m)), 0);
  const annual = {
    totalUnits: results.reduce((t, m) => t + m.totalUnits, 0),
    revenue: sumC((m) => m.revenue) / 100,
    variableCosts: sumC((m) => m.variableCosts) / 100,
    contributionMargin: sumC((m) => m.contributionMargin) / 100,
    fixedCosts: sumC((m) => m.fixedCosts) / 100,
    operatingProfit: sumC((m) => m.operatingProfit) / 100,
  };

  let best = results[0];
  let worst = results[0];
  for (const m of results) {
    if (toCents(m.operatingProfit) > toCents(best.operatingProfit)) best = m;
    if (toCents(m.operatingProfit) < toCents(worst.operatingProfit)) worst = m;
  }
  return { months: results, annual, best, worst, monthsBelowBreakEven: results.filter((m) => m.belowBreakEven).map((m) => m.month) };
}
