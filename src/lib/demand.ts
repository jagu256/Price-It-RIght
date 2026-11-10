/**
 * OPTIONAL price-sensitive demand – an assumption the user switches on.
 *
 *   "For every $1 change in price, sales change by X units (opposite direction)."
 *
 *   Units at a price = expected units − X × (price − current price)
 *
 * rounded DOWN to whole units (you can't sell part of a unit) and never below
 * 0. All prices are worked in whole cents.
 *
 * The best price is found by brute force: profit is worked out at EVERY cent
 * from $0.00 up to the price where sales reach zero (no calculus shortcut),
 * and the highest profit wins. It is only the best price UNDER THIS
 * ASSUMPTION – real customers may behave differently.
 */
import { toCents } from './business';
import { cleanNumberText, MAX_VALUE } from './validation';

export interface DemandAssumption {
  /** Current selling price (where expected units were estimated). */
  basePrice: number;
  /** Expected units at the current price (whole number). */
  baseUnits: number;
  /** X: units lost for each $1 the price goes up (and gained for each $1 down). Whole number ≥ 0. */
  unitsPerDollar: number;
}

export interface ProfitContext {
  /** Variable cost per unit of this product. */
  variableCost: number;
  /** Contribution margin from all OTHER products (unchanged). */
  otherContribution: number;
  /** Fixed costs this calculation must cover. */
  fixedCosts: number;
}

/** The search never checks more than this many cents ($20,000.00). */
export const MAX_SEARCH_CENTS = 2_000_000;

export type WholeResult = { ok: true; value: number } | { ok: false; error: string };

/** X must be a whole number of units, 0 or more. */
export function parseUnitsPerDollar(raw: string): WholeResult {
  if (raw.trim() === '') return { ok: false, error: 'Please enter how many units sales change for each $1 change in price.' };
  const cleaned = cleanNumberText(raw);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;
  if (/^[-−–]/.test(text)) return { ok: false, error: 'Please enter the size of the change as 0 or more – the direction is always opposite to the price.' };
  if (/^\d*\.\d*$/.test(text) && text !== '.') return { ok: false, error: 'Please enter a whole number of units – you can’t sell part of a unit.' };
  if (!/^\d+$/.test(text)) return { ok: false, error: 'Please use whole numbers only, for example 20.' };
  const value = Number(text);
  if (value > MAX_VALUE) return { ok: false, error: 'That number is larger than this simulator supports.' };
  return { ok: true, value };
}

/** Whole units sold at a price (in cents) under the assumption. */
function unitsAtCents(a: DemandAssumption, priceC: number): number {
  // 100 × units, exactly: 100 × base − X × (price − base price) in cents
  const hundredths = a.baseUnits * 100 - a.unitsPerDollar * (priceC - toCents(a.basePrice));
  if (hundredths <= 0) return 0;
  return Math.floor(hundredths / 100);
}

export function unitsAtPrice(a: DemandAssumption, price: number): number {
  return unitsAtCents(a, toCents(price));
}

function profitCentsAt(a: DemandAssumption, ctx: ProfitContext, priceC: number): { units: number; profitC: number } {
  const units = unitsAtCents(a, priceC);
  const profitC = (priceC - toCents(ctx.variableCost)) * units + toCents(ctx.otherContribution) - toCents(ctx.fixedCosts);
  return { units, profitC };
}

export interface PricePoint {
  price: number;
  units: number;
  profit: number;
}

export function profitAtPrice(a: DemandAssumption, ctx: ProfitContext, price: number): PricePoint {
  const priceC = toCents(price);
  const { units, profitC } = profitCentsAt(a, ctx, priceC);
  return { price: priceC / 100, units, profit: profitC / 100 };
}

export interface SearchRange {
  /** Lowest price checked (always $0.00). */
  from: number;
  /** Highest price checked. */
  to: number;
  /** Number of prices checked (one per cent). */
  pricesChecked: number;
  /** True when the range was cut at $20,000 rather than at zero sales. */
  capped: boolean;
}

/**
 * $0.00 up to the first price where sales reach zero (above it nothing changes).
 * Null when X = 0, because then sales never fall and there is no top.
 */
export function searchRange(a: DemandAssumption): SearchRange | null {
  if (a.unitsPerDollar <= 0) return null;
  const zeroC = toCents(a.basePrice) + Math.ceil((a.baseUnits * 100) / a.unitsPerDollar);
  const toC = Math.max(0, Math.min(zeroC, MAX_SEARCH_CENTS));
  return { from: 0, to: toC / 100, pricesChecked: toC + 1, capped: zeroC > MAX_SEARCH_CENTS };
}

export type BestPriceResult =
  | (PricePoint & { status: 'ok'; range: SearchRange; /** Other prices that tie for the same profit. */ tiedPrices: number })
  | { status: 'no-maximum'; reason: string };

/** Checks every cent in the range and returns the most profitable price (the lowest one if several tie). */
export function bestPrice(a: DemandAssumption, ctx: ProfitContext): BestPriceResult {
  const range = searchRange(a);
  if (!range) {
    return {
      status: 'no-maximum',
      reason: 'With 0 units lost per $1, sales never fall, so every higher price earns more and there is no best price. Enter how many units customers would stop buying for each $1.',
    };
  }
  const toC = Math.round(range.to * 100);
  let best = profitCentsAt(a, ctx, 0);
  let bestC = 0;
  let ties = 0;
  for (let p = 1; p <= toC; p++) {
    const r = profitCentsAt(a, ctx, p);
    if (r.profitC > best.profitC) {
      best = r;
      bestC = p;
      ties = 0;
    } else if (r.profitC === best.profitC) ties++;
  }
  return { status: 'ok', price: bestC / 100, units: best.units, profit: best.profitC / 100, range, tiedPrices: ties };
}

export type TargetPriceResult =
  | { status: 'ok'; lowest: PricePoint; highest: PricePoint; range: SearchRange }
  | { status: 'unreachable'; range: SearchRange }
  | { status: 'no-maximum'; reason: string };

/** Lowest and highest prices (checked every cent) whose profit reaches the target. */
export function pricesForTarget(a: DemandAssumption, ctx: ProfitContext, targetProfit: number): TargetPriceResult {
  const range = searchRange(a);
  if (!range) return { status: 'no-maximum', reason: 'With 0 units lost per $1, sales never fall, so this assumption can’t limit the price.' };
  const targetC = toCents(targetProfit);
  const toC = Math.round(range.to * 100);
  let lowC = -1;
  let highC = -1;
  for (let p = 0; p <= toC; p++) {
    if (profitCentsAt(a, ctx, p).profitC >= targetC) {
      if (lowC < 0) lowC = p;
      highC = p;
    }
  }
  if (lowC < 0) return { status: 'unreachable', range };
  return { status: 'ok', lowest: profitAtPrice(a, ctx, lowC / 100), highest: profitAtPrice(a, ctx, highC / 100), range };
}

/** About `points` evenly spaced prices across the search range, for the chart. */
export function profitCurve(a: DemandAssumption, ctx: ProfitContext, points = 60): PricePoint[] {
  const range = searchRange(a);
  if (!range) return [];
  const toC = Math.round(range.to * 100);
  const step = Math.max(1, Math.ceil(toC / points));
  const out: PricePoint[] = [];
  for (let p = 0; p < toC; p += step) out.push(profitAtPrice(a, ctx, p / 100));
  out.push(profitAtPrice(a, ctx, toC / 100));
  return out;
}
