/**
 * 📋 Budget vs actual (flexible-budget variance analysis).
 *
 *   Static budget profit      = what you planned (expected units, budget price, budget costs)
 *   Sales volume variance     = (actual units − budget units) × budget CM per unit
 *     · sales quantity variance = (actual total units − budget total units) × budget weighted-average CM per unit
 *     · sales mix variance      = sales volume variance − sales quantity variance
 *   Flexible budget profit    = static budget profit + sales volume variance
 *   Selling price variance    = (actual price − budget price) × actual units
 *   Variable cost variance    = (budget variable cost − actual variable cost) × actual units
 *   Fixed cost variance       = budget fixed costs − actual fixed costs
 *   Actual profit             = flexible budget profit + price + variable cost + fixed cost variances
 *
 * A positive variance is Favourable (F – it raised profit); negative is Unfavourable (U).
 * Everything is worked in whole cents, so the variances add up to the actual
 * profit exactly. Only the quantity variance needs rounding (to the nearest
 * cent); the mix variance is what is left, so the two still add up to the volume variance.
 */
import type { ProductNumbers } from './business';
import { toCents } from './business';

export interface ActualProduct {
  id: string;
  /** Units actually sold (whole number). */
  units: number;
  /** Actual average selling price per unit. */
  price: number;
  /** Actual variable cost per unit. */
  variableCost: number;
}

export interface ProductVariance {
  id: string;
  name: string;
  budgetUnits: number;
  actualUnits: number;
  volume: number;
  price: number;
  variableCost: number;
  /** Volume + price + variable cost for this product. */
  total: number;
}

export interface VarianceResult {
  staticProfit: number;
  /** Profit you'd expect at the ACTUAL units, with budget prices and costs. */
  flexibleProfit: number;
  actualProfit: number;
  actualRevenue: number;
  volume: number;
  /** null when the budget has no units (there is no budget mix to compare with). */
  quantity: number | null;
  mix: number | null;
  price: number;
  variableCost: number;
  fixedCosts: number;
  /** Actual profit − static budget profit. */
  total: number;
  products: ProductVariance[];
}

/** Rounds numerator ÷ denominator (denominator > 0) to the nearest whole number, halves away from zero. */
function roundDiv(numerator: bigint, denominator: bigint): bigint {
  const sign = numerator < 0n ? -1n : 1n;
  const n = numerator * sign;
  return sign * ((2n * n + denominator) / (2n * denominator));
}

export function varianceAnalysis(budget: ProductNumbers[], budgetFixed: number, actual: ActualProduct[], actualFixed: number): VarianceResult {
  const byId = new Map(actual.map((a) => [a.id, a]));
  let staticC = 0n;
  let volumeC = 0n;
  let priceC = 0n;
  let vcC = 0n;
  let revenueC = 0n;
  let budgetUnits = 0n;
  let actualUnits = 0n;
  let budgetCMC = 0n;

  const products = budget.map((b) => {
    const a = byId.get(b.id) ?? { id: b.id, units: b.units, price: b.price, variableCost: b.variableCost };
    const bp = BigInt(toCents(b.price));
    const bv = BigInt(toCents(b.variableCost));
    const ap = BigInt(toCents(a.price));
    const av = BigInt(toCents(a.variableCost));
    const bu = BigInt(b.units);
    const au = BigInt(a.units);
    const volume = (au - bu) * (bp - bv);
    const price = (ap - bp) * au;
    const vc = (bv - av) * au;
    staticC += bu * (bp - bv);
    budgetCMC += bu * (bp - bv);
    volumeC += volume;
    priceC += price;
    vcC += vc;
    revenueC += ap * au;
    budgetUnits += bu;
    actualUnits += au;
    return {
      id: b.id,
      name: b.name,
      budgetUnits: b.units,
      actualUnits: a.units,
      volume: Number(volume) / 100,
      price: Number(price) / 100,
      variableCost: Number(vc) / 100,
      total: Number(volume + price + vc) / 100,
    };
  });

  const bfC = BigInt(toCents(budgetFixed));
  const afC = BigInt(toCents(actualFixed));
  staticC -= bfC;
  const fixedC = bfC - afC;
  const flexibleC = staticC + volumeC;
  const actualC = flexibleC + priceC + vcC + fixedC;
  const quantityC = budgetUnits > 0n ? roundDiv((actualUnits - budgetUnits) * budgetCMC, budgetUnits) : null;

  return {
    staticProfit: Number(staticC) / 100,
    flexibleProfit: Number(flexibleC) / 100,
    actualProfit: Number(actualC) / 100,
    actualRevenue: Number(revenueC) / 100,
    volume: Number(volumeC) / 100,
    quantity: quantityC === null ? null : Number(quantityC) / 100,
    mix: quantityC === null ? null : Number(volumeC - quantityC) / 100,
    price: Number(priceC) / 100,
    variableCost: Number(vcC) / 100,
    fixedCosts: Number(fixedC) / 100,
    total: Number(actualC - staticC) / 100,
    products,
  };
}

/** 'F' (favourable – raised profit), 'U' (unfavourable – lowered profit) or '' for $0. */
export function varianceLabel(amount: number): 'F' | 'U' | '' {
  return amount > 0 ? 'F' : amount < 0 ? 'U' : '';
}
