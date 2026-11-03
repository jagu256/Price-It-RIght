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
