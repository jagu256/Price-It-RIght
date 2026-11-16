/**
 * Pricing Lab calculations: scenario comparison, required price for a target
 * profit, and profit-goal tracking. Results describe the user's assumptions –
 * they are never presented as a market-optimal or guaranteed price.
 */
import { businessSummary, toCents, unitsForContribution, type BusinessSummary } from './business';
import type { ParsedProduct } from './model';
import type { ScenarioOverrides } from './store';
import { parseMoney, parseUnits } from './validation';

/* ------------------------------------------------------------------ */
/* What-if scenario                                                    */
/* ------------------------------------------------------------------ */

export interface ScenarioResult {
  products: ParsedProduct[];
  fixedCosts: number;
  errors: Record<string, string>; // key: `${productId}.${field}` or 'fixedCosts'
  summary: BusinessSummary | null;
  /** True when any override differs from the current plan. */
  changed: boolean;
}

export function resolveScenario(products: ParsedProduct[], fixedCosts: number, o: ScenarioOverrides): ScenarioResult {
  const errors: Record<string, string> = {};
  let changed = false;
  let fixed = fixedCosts;
  if (o.fixedCosts !== undefined) {
    const r = parseMoney(o.fixedCosts, 'fixedCosts');
    if (r.ok) {
      fixed = r.value;
      if (toCents(r.value) !== toCents(fixedCosts)) changed = true;
    } else errors.fixedCosts = r.error;
  }
  const modified = products.map((p) => {
    const ov = o.products[p.id];
    if (!ov) return p;
    const next = { ...p };
    if (ov.price !== undefined) {
      const r = parseMoney(ov.price, 'sellingPrice');
      if (r.ok) next.price = r.value;
      else errors[`${p.id}.price`] = r.error;
    }
    if (ov.variableCost !== undefined) {
      const r = parseMoney(ov.variableCost, 'variableCost');
      if (r.ok) next.variableCost = r.value;
      else errors[`${p.id}.variableCost`] = r.error;
    }
    if (ov.units !== undefined) {
      const r = parseUnits(ov.units);
      if (r.ok) next.units = r.value;
      else errors[`${p.id}.units`] = r.error;
    }
    if (toCents(next.price) !== toCents(p.price) || toCents(next.variableCost) !== toCents(p.variableCost) || next.units !== p.units) {
      changed = true;
    }
    return next;
  });
  const ok = Object.keys(errors).length === 0;
  return { products: modified, fixedCosts: fixed, errors, summary: ok ? businessSummary(modified, fixed) : null, changed };
}

/* ------------------------------------------------------------------ */
/* Saved scenarios, compared side by side                              */
/* ------------------------------------------------------------------ */

export interface SavedScenario {
  id: string;
  name: string;
  overrides: ScenarioOverrides;
}

export interface ScenarioComparisonRow {
  id: string;
  name: string;
  /** null when a saved value is no longer valid. */
  summary: BusinessSummary | null;
  /** Operating profit − the current plan's operating profit (null if not available). */
  profitChange: number | null;
  /** True for the scenario(s) with the most operating profit among the valid ones. */
  highest: boolean;
}

/**
 * Re-calculates every saved scenario from the CURRENT business (a saved
 * scenario stores only the changes the user typed). "Highest" = most operating
 * profit among these scenarios – not a claim that it is the best possible plan.
 */
export function compareScenarios(products: ParsedProduct[], fixedCosts: number, saved: SavedScenario[]): ScenarioComparisonRow[] {
  const current = businessSummary(products, fixedCosts);
  const rows = saved.map((s) => {
    const summary = resolveScenario(products, fixedCosts, s.overrides).summary;
    return {
      id: s.id,
      name: s.name,
      summary,
      profitChange: summary ? (toCents(summary.operatingProfit) - toCents(current.operatingProfit)) / 100 : null,
      highest: false,
    };
  });
  const valid = rows.filter((r) => r.summary);
  if (valid.length > 0) {
    const best = Math.max(...valid.map((r) => toCents(r.summary!.operatingProfit)));
    for (const r of valid) r.highest = toCents(r.summary!.operatingProfit) === best;
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* 💡 What price should I charge?                                     */
/* ------------------------------------------------------------------ */

export type RequiredPriceResult =
  | {
      status: 'ok';
      /** Minimum price (rounded UP to the next cent) that meets the target under these assumptions. */
      price: number;
      /** The unrounded formula result. */
      exact: number;
      belowVariableCost: boolean;
      /** Operating profit at the rounded price – shown as a check. */
      profitAtPrice: number;
    }
  | { status: 'already-met'; exact: number }
  | { status: 'no-sales' };

/**
 * Required Price = Variable Cost + (Fixed Costs + Target Profit − Contribution From Other Products) ÷ Expected Units
 *
 * For a single product, contribution from other products is $0, which gives the
 * standard single-product formula. For "a share of fixed costs", pass that share
 * as `fixedCosts` and 0 as `otherContribution`.
 */
export function requiredPrice(input: {
  variableCost: number;
  units: number;
  fixedCosts: number;
  targetProfit: number;
  otherContribution: number;
}): RequiredPriceResult {
  const { variableCost, units, fixedCosts, targetProfit, otherContribution } = input;
  if (units <= 0) return { status: 'no-sales' };
  const neededC = toCents(fixedCosts) + toCents(targetProfit) - toCents(otherContribution);
  const vcC = toCents(variableCost);
  const exact = (vcC + neededC / units) / 100;
  // Price can't go below $0.
  if (vcC * units + neededC <= 0) return { status: 'already-met', exact };
  // Round UP to the next whole cent so the target is met, not just missed.
  const priceC = vcC + Math.ceil(neededC / units);
  const profitC = (priceC - vcC) * units + toCents(otherContribution) - toCents(fixedCosts);
  return {
    status: 'ok',
    price: priceC / 100,
    exact,
    belowVariableCost: priceC < vcC,
    profitAtPrice: profitC / 100,
  };
}

/* ------------------------------------------------------------------ */
/* 🎯 Profit goal tracker                                             */
/* ------------------------------------------------------------------ */

export interface GoalProgress {
  target: number;
  current: number;
  /** Current − target (negative = short of the target). */
  difference: number;
  /** MAX(0, target − current). */
  additionalCMRequired: number;
  /** 0–1 for the progress bar. */
  progress: number;
  met: boolean;
}

export function goalProgress(currentProfit: number, target: number): GoalProgress {
  const diffC = toCents(currentProfit) - toCents(target);
  let progress: number;
  if (diffC >= 0) progress = 1;
  else if (target > 0) progress = Math.max(0, Math.min(1, currentProfit / target));
  else progress = 0;
  return {
    target,
    current: currentProfit,
    difference: diffC / 100,
    additionalCMRequired: Math.max(0, -diffC) / 100,
    progress,
    met: diffC >= 0,
  };
}

/** Total contribution margin of every product EXCEPT one (expected units), in dollars. */
export function contributionFromOthers(products: ParsedProduct[], exceptId: string): number {
  return products.filter((p) => p.id !== exceptId).reduce((s, p) => s + (toCents(p.price) - toCents(p.variableCost)) * p.units, 0) / 100;
}

/** Extra units of ONE product needed to earn `additionalCM` (other products unchanged). */
export function extraUnitsOfProduct(additionalCM: number, product: ParsedProduct): number | null {
  const cmC = toCents(product.price) - toCents(product.variableCost);
  const needC = toCents(additionalCM);
  if (needC <= 0) return 0;
  if (cmC <= 0) return null; // selling more never adds contribution
  return Math.ceil(needC / cmC);
}

/**
 * Whole-unit plan at a given sales mix that reaches the target profit:
 * total CM ≥ fixed costs + target. Mix weights default to expected units.
 */
export function planForTarget(products: ParsedProduct[], fixedCosts: number, target: number, mix?: Record<string, number>) {
  const weights = products.map((p) => ({
    id: p.id,
    cmCents: toCents(p.price) - toCents(p.variableCost),
    weight: Math.max(0, Math.round(mix ? mix[p.id] ?? 0 : p.units)),
  }));
  return unitsForContribution(weights, toCents(fixedCosts) + toCents(target));
}

/* ------------------------------------------------------------------ */
/* Price change: how many units keep the same profit?                  */
/* ------------------------------------------------------------------ */

export type VolumeForPriceResult =
  | {
      status: 'ok';
      /** The product’s total contribution margin now. */
      currentContribution: number;
      oldCMPerUnit: number;
      newCMPerUnit: number;
      /** Units needed at the new price to earn at least the same total contribution (rounded UP). */
      requiredUnits: number;
      /** requiredUnits − current units (negative: you could sell this many fewer). */
      unitChange: number;
      /** unitChange as % of current units, or null when current units are 0. */
      percentChange: number | null;
      /** Contribution at requiredUnits − the current contribution (≥ $0, less than one unit’s CM). */
      roundingExtra: number;
    }
  | { status: 'not-possible'; newCMPerUnit: number };

/**
 * At a new price, how many units of this product earn the SAME total
 * contribution margin – and so the same operating profit, since fixed costs
 * don’t change? Required units = current total CM ÷ new CM per unit, rounded UP.
 * Assumes variable cost per unit stays the same. Whole cents.
 */
export function volumeForPrice(product: ParsedProduct, newPrice: number): VolumeForPriceResult {
  const vc = toCents(product.variableCost);
  const oldCM = toCents(product.price) - vc;
  const newCM = toCents(newPrice) - vc;
  const currentTotal = BigInt(oldCM) * BigInt(product.units);
  let required: bigint;
  if (currentTotal <= 0n) required = 0n; // nothing to protect: any volume keeps at least the current contribution
  else if (newCM <= 0) return { status: 'not-possible', newCMPerUnit: newCM / 100 };
  else required = (currentTotal + BigInt(newCM) - 1n) / BigInt(newCM);
  const requiredUnits = Number(required);
  const unitChange = requiredUnits - product.units;
  return {
    status: 'ok',
    currentContribution: Number(currentTotal) / 100,
    oldCMPerUnit: oldCM / 100,
    newCMPerUnit: newCM / 100,
    requiredUnits,
    unitChange,
    percentChange: product.units === 0 ? null : (unitChange / product.units) * 100,
    roundingExtra: Number(required * BigInt(newCM) - currentTotal) / 100,
  };
}
