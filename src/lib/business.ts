/**
 * Multi-product business calculations.
 *
 * Every function here works with plain numbers (already validated) so it can
 * be tested on its own. Money is converted to whole cents before arithmetic,
 * and BigInt is used where products of large numbers could lose precision.
 *
 * Key rule: product contribution margin is NOT profit. Fixed costs belong to
 * the whole business and are subtracted ONCE, from the total contribution
 * margin – never from each product separately.
 */

export interface ProductNumbers {
  id: string;
  name: string;
  /** Selling price per unit (CAD). */
  price: number;
  /** Variable cost per unit (CAD). */
  variableCost: number;
  /** Units sold per month (whole number). */
  units: number;
}

export interface ProductMetrics {
  id: string;
  name: string;
  price: number;
  variableCost: number;
  units: number;
  /** Revenue = Selling Price × Units Sold */
  revenue: number;
  /** Total Variable Costs = Variable Cost per Unit × Units Sold */
  totalVariableCosts: number;
  /** Contribution Margin per Unit = Selling Price − Variable Cost per Unit */
  cmPerUnit: number;
  /** Total Contribution Margin = Revenue − Total Variable Costs */
  totalCM: number;
  /** CM per Unit ÷ Selling Price × 100, or null when the price is $0. */
  cmRatio: number | null;
}

export const toCents = (dollars: number): number => Math.round(dollars * 100);
const toDollars = (cents: number | bigint): number => Number(cents) / 100;

export function productMetrics(p: ProductNumbers): ProductMetrics {
  const priceC = toCents(p.price);
  const varC = toCents(p.variableCost);
  const cmC = priceC - varC;
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    variableCost: p.variableCost,
    units: p.units,
    revenue: toDollars(priceC * p.units),
    totalVariableCosts: toDollars(varC * p.units),
    cmPerUnit: toDollars(cmC),
    totalCM: toDollars(cmC * p.units),
    cmRatio: priceC === 0 ? null : (cmC / priceC) * 100,
  };
}

export type SortKey = 'revenue' | 'totalCM' | 'cmPerUnit' | 'units';

/** Sorts highest first; ties keep their original order. */
export function sortProducts(metrics: ProductMetrics[], key: SortKey): ProductMetrics[] {
  return metrics
    .map((m, i) => ({ m, i }))
    .sort((a, b) => b.m[key] - a.m[key] || a.i - b.i)
    .map(({ m }) => m);
}

/* ------------------------------------------------------------------ */
/* Sales-mix break-even                                                */
/* ------------------------------------------------------------------ */

export interface MixWeight {
  id: string;
  /** Contribution margin per unit in cents. */
  cmCents: number;
  /** Relative share of units in the mix (e.g. expected units). Whole number ≥ 0. */
  weight: number;
}

export interface MixAllocation {
  /** Theoretical (unrounded) total units needed. */
  totalExact: number;
  /** Whole units per product, keeping the assumed mix as closely as possible. */
  allocation: { id: string; units: number }[];
  totalUnits: number;
}

/**
 * Splits `total` whole units across products in proportion to their weights
 * using the largest-remainder (Hamilton) method. Ties go to the earlier product.
 */
export function allocateByMix(weights: MixWeight[], total: number): { id: string; units: number }[] {
  const W = weights.reduce((s, w) => s + BigInt(w.weight), 0n);
  if (W === 0n) return weights.map((w) => ({ id: w.id, units: 0 }));
  const N = BigInt(total);
  const parts = weights.map((w, i) => {
    const q = N * BigInt(w.weight);
    return { i, id: w.id, floor: q / W, rem: q % W };
  });
  let left = N - parts.reduce((s, p) => s + p.floor, 0n);
  const order = [...parts].sort((a, b) => (b.rem > a.rem ? 1 : b.rem < a.rem ? -1 : a.i - b.i));
  for (const p of order) {
    if (left <= 0n) break;
    if (p.rem > 0n) {
      p.floor += 1n;
      left -= 1n;
    }
  }
  return parts.map((p) => ({ id: p.id, units: Number(p.floor) }));
}

/**
 * Smallest whole-unit plan, at the assumed sales mix, whose total contribution
 * margin is at least `requiredCents`. Used for break-even (required = fixed
 * costs) and for profit targets (required = fixed costs + target profit).
 *
 * Returns null when the weighted-average contribution margin is not positive.
 */
export function unitsForContribution(weights: MixWeight[], requiredCents: number): MixAllocation | null {
  const W = weights.reduce((s, w) => s + BigInt(w.weight), 0n);
  if (W === 0n) return null;
  // Weighted contribution of one "mix bundle" of W units, in cents.
  const bundleCM = weights.reduce((s, w) => s + BigInt(w.weight) * BigInt(w.cmCents), 0n);
  if (bundleCM <= 0n) return null;
  if (requiredCents <= 0) {
    return { totalExact: 0, allocation: weights.map((w) => ({ id: w.id, units: 0 })), totalUnits: 0 };
  }
  const R = BigInt(requiredCents);
  // Exact total = required ÷ weighted-average CM = R × W ÷ bundleCM
  const totalExact = Number(R * W) / Number(bundleCM);
  let n = (R * W + bundleCM - 1n) / bundleCM; // ceiling

  const cmOf = (alloc: { id: string; units: number }[]) =>
    alloc.reduce((s, a, i) => s + BigInt(a.units) * BigInt(weights[i].cmCents), 0n);

  // Rounding to whole units can leave the plan a few cents short (especially
  // when some products have a negative margin), so step up until it covers.
  for (let step = 0; step < 100_000; step++) {
    const allocation = allocateByMix(weights, Number(n));
    if (cmOf(allocation) >= R) {
      return { totalExact, allocation, totalUnits: Number(n) };
    }
    n += 1n;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Business summary                                                    */
/* ------------------------------------------------------------------ */

export type MixBreakEven =
  | {
      status: 'reachable';
      /** Weighted-average CM per unit = Σ (mix share × CM per unit). */
      weightedCM: number;
      totalUnitsExact: number;
      totalUnits: number;
      allocation: { id: string; units: number }[];
      /** Theoretical break-even revenue = fixed costs ÷ overall CM ratio. */
      revenueExact: number;
      /** Revenue from the whole-unit allocation. */
      revenueAtAllocation: number;
    }
  | { status: 'no-fixed-costs'; weightedCM: number }
  | { status: 'unreachable'; weightedCM: number }
  | { status: 'no-contribution-no-fixed'; weightedCM: number }
  | { status: 'no-sales' };

export interface BusinessSummary {
  products: ProductMetrics[];
  fixedCosts: number;
  totalRevenue: number;
  totalVariableCosts: number;
  totalCM: number;
  /** Total CM − fixed costs. Not net income: no taxes or interest. */
  operatingProfit: number;
  /** Total CM ÷ total revenue × 100, or null when revenue is $0. */
  overallCMRatio: number | null;
  totalUnits: number;
  /** Each product's share of total units (0–1), or null when no units are planned. */
  salesMix: { id: string; share: number }[] | null;
  breakEven: MixBreakEven;
  /** Revenue − theoretical break-even revenue; null when no break-even exists. */
  marginOfSafety: number | null;
  marginOfSafetyPercent: number | null;
}

export function businessSummary(products: ProductNumbers[], fixedCosts: number): BusinessSummary {
  const metrics = products.map(productMetrics);
  const revC = products.reduce((s, p) => s + toCents(p.price) * p.units, 0);
  const varC = products.reduce((s, p) => s + toCents(p.variableCost) * p.units, 0);
  const cmC = revC - varC;
  const fixedC = toCents(fixedCosts);
  const totalUnits = products.reduce((s, p) => s + p.units, 0);

  const salesMix = totalUnits > 0 ? products.map((p) => ({ id: p.id, share: p.units / totalUnits })) : null;
  const weights: MixWeight[] = products.map((p) => ({
    id: p.id,
    cmCents: toCents(p.price) - toCents(p.variableCost),
    weight: p.units,
  }));

  let breakEven: MixBreakEven;
  if (totalUnits === 0) {
    breakEven = { status: 'no-sales' };
  } else {
    const weightedCM = cmC / 100 / totalUnits;
    if (fixedC === 0) {
      breakEven = weightedCM > 0 ? { status: 'no-fixed-costs', weightedCM } : { status: 'no-contribution-no-fixed', weightedCM };
    } else if (cmC <= 0) {
      breakEven = { status: 'unreachable', weightedCM };
    } else {
      const plan = unitsForContribution(weights, fixedC);
      if (!plan) {
        breakEven = { status: 'unreachable', weightedCM };
      } else {
        const priceById = new Map(products.map((p) => [p.id, toCents(p.price)]));
        breakEven = {
          status: 'reachable',
          weightedCM,
          totalUnitsExact: plan.totalExact,
          totalUnits: plan.totalUnits,
          allocation: plan.allocation,
          revenueExact: (fixedC * (revC / cmC)) / 100,
          revenueAtAllocation: toDollars(plan.allocation.reduce((s, a) => s + a.units * (priceById.get(a.id) ?? 0), 0)),
        };
      }
    }
  }

  let marginOfSafety: number | null = null;
  if (breakEven.status === 'reachable') marginOfSafety = toDollars(revC) - breakEven.revenueExact;
  else if (breakEven.status === 'no-fixed-costs') marginOfSafety = toDollars(revC);

  return {
    products: metrics,
    fixedCosts,
    totalRevenue: toDollars(revC),
    totalVariableCosts: toDollars(varC),
    totalCM: toDollars(cmC),
    operatingProfit: toDollars(cmC - fixedC),
    overallCMRatio: revC === 0 ? null : (cmC / revC) * 100,
    totalUnits,
    salesMix,
    breakEven,
    marginOfSafety,
    marginOfSafetyPercent: marginOfSafety !== null && revC > 0 ? (marginOfSafety / toDollars(revC)) * 100 : null,
  };
}

/**
 * Revenue and total costs if every product's sales are scaled by `factor`
 * (keeping the sales mix). Used for the Revenue vs. Total Costs chart.
 */
export function scaledTotals(products: ProductNumbers[], fixedCosts: number, factor: number) {
  const revenue = products.reduce((s, p) => s + toCents(p.price) * p.units * factor, 0) / 100;
  const variable = products.reduce((s, p) => s + toCents(p.variableCost) * p.units * factor, 0) / 100;
  return { revenue, totalCosts: variable + fixedCosts, profit: revenue - variable - fixedCosts };
}
