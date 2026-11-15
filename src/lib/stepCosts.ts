/**
 * 🪜 Step fixed costs and the relevant range.
 *
 * Fixed costs are only fixed within a range of activity. Here the user adds
 * steps such as "above 600 units a month, fixed costs rise by $500" (an extra
 * staff member). Total units keep the expected sales mix, so every unit earns
 * the weighted-average contribution margin (total CM ÷ total expected units).
 *
 *   Range k: from (threshold k + 1) to threshold k+1 units, fixed costs = base + every step at or below it
 *   Break-even in range k = fixed costs of the range ÷ weighted CM per unit, rounded UP,
 *                           and only counted if it falls inside that range
 *
 * A step can push profit back below zero, so there can be several break-even points.
 * Money is worked in whole cents with BigInt (exact fractions, rounded only at the end).
 */
import { toCents } from './business';

export interface FixedCostStep {
  /** Fixed costs rise when total units are ABOVE this number. */
  aboveUnits: number;
  /** Extra fixed costs per month (CAD). */
  increase: number;
}

export interface CostRange {
  /** First unit count in this range. */
  fromUnits: number;
  /** Last unit count in this range, or null for "and above". */
  toUnits: number | null;
  fixedCosts: number;
  /** Whole-unit break-even inside this range, or null if the range never breaks even. */
  breakEvenUnits: number | null;
}

export interface StepCostResult {
  ranges: CostRange[];
  /** Fixed costs and operating profit at the expected sales volume. */
  expectedUnits: number;
  expectedFixedCosts: number;
  expectedProfit: number;
  /** Weighted-average CM per unit (expected mix), unrounded. */
  weightedCM: number;
}

/** Sorted copy of the steps (lowest threshold first). */
export const sortSteps = (steps: FixedCostStep[]) => [...steps].sort((a, b) => a.aboveUnits - b.aboveUnits);

/** Fixed costs at a given total number of units. */
export function fixedCostsAt(baseFixed: number, steps: FixedCostStep[], units: number): number {
  const cents = steps.reduce((s, st) => (units > st.aboveUnits ? s + toCents(st.increase) : s), toCents(baseFixed));
  return cents / 100;
}

/**
 * @param totalCM   total contribution margin at expected sales (CAD)
 * @param totalUnits total expected units (must be > 0 for a sales mix to exist)
 * Returns null when there is no sales mix or the mix earns no contribution per unit.
 */
export function stepCostAnalysis(totalCM: number, totalUnits: number, baseFixed: number, steps: FixedCostStep[]): StepCostResult | null {
  const cmC = BigInt(toCents(totalCM));
  if (totalUnits <= 0 || cmC <= 0n) return null;
  const U = BigInt(totalUnits);
  const sorted = sortSteps(steps);
  const ranges: CostRange[] = [];
  let fixedC = BigInt(toCents(baseFixed));
  let from = 0;
  for (let k = 0; k <= sorted.length; k++) {
    if (k > 0) {
      fixedC += BigInt(toCents(sorted[k - 1].increase));
      from = sorted[k - 1].aboveUnits + 1;
    }
    const to = k < sorted.length ? sorted[k].aboveUnits : null;
    // smallest N with N × cm ÷ U ≥ fixed  →  N = ceil(fixed × U ÷ cm)
    const need = fixedC <= 0n ? 0n : (fixedC * U + cmC - 1n) / cmC;
    const candidate = need < BigInt(from) ? BigInt(from) : need;
    const inside = to === null || candidate <= BigInt(to);
    ranges.push({ fromUnits: from, toUnits: to, fixedCosts: Number(fixedC) / 100, breakEvenUnits: inside ? Number(candidate) : null });
  }
  const expectedFixed = fixedCostsAt(baseFixed, sorted, totalUnits);
  return {
    ranges,
    expectedUnits: totalUnits,
    expectedFixedCosts: expectedFixed,
    expectedProfit: (toCents(totalCM) - toCents(expectedFixed)) / 100,
    weightedCM: totalCM / totalUnits,
  };
}

/** Operating profit at N total units with the expected mix (theoretical: N × weighted CM − fixed), to the cent. */
export function profitAtUnits(totalCM: number, totalUnits: number, baseFixed: number, steps: FixedCostStep[], units: number): number {
  const cm = (BigInt(units) * BigInt(toCents(totalCM)) * 2n + BigInt(totalUnits)) / (2n * BigInt(totalUnits)); // nearest cent
  return (Number(cm) - toCents(fixedCostsAt(baseFixed, steps, units))) / 100;
}

/** Points for a profit-vs-units chart, including both sides of every step. */
export function stepProfitCurve(totalCM: number, totalUnits: number, baseFixed: number, steps: FixedCostStep[], maxUnits: number, points = 40) {
  const xs = new Set<number>();
  for (let i = 0; i <= points; i++) xs.add(Math.round((maxUnits * i) / points));
  for (const s of steps) if (s.aboveUnits <= maxUnits) { xs.add(s.aboveUnits); xs.add(Math.min(maxUnits, s.aboveUnits + 1)); }
  return [...xs].sort((a, b) => a - b).map((units) => ({ units, profit: profitAtUnits(totalCM, totalUnits, baseFixed, steps, units) }));
}
