/**
 * Price It Right – accounting engine.
 *
 * Every number shown in the app (dashboard cards, what-if simulator and both
 * charts) comes from the `calculate` function in this file, so all parts of
 * the app always agree with each other.
 *
 * Money is converted to whole cents before doing arithmetic. This avoids
 * floating-point surprises such as 0.1 + 0.2 = 0.30000000000000004, and it
 * lets us round break-even units UP exactly.
 */

export interface PricingInputs {
  /** Selling price per unit, in CAD. */
  sellingPrice: number;
  /** Variable cost per unit, in CAD. */
  variableCost: number;
  /** Total fixed costs per month, in CAD. */
  fixedCosts: number;
  /** Expected units sold per month (whole number). */
  units: number;
}

/**
 * The break-even point can take one of four shapes:
 *
 * - `reachable`: fixed costs > 0 and contribution margin per unit > 0.
 *   Break-even units = fixed costs ÷ contribution margin per unit.
 * - `no-fixed-costs`: fixed costs = 0 and contribution margin > 0.
 *   The business breaks even at 0 units; every unit sold adds profit.
 * - `unreachable`: fixed costs > 0 and contribution margin ≤ 0.
 *   Selling more never covers the fixed costs, so no finite break-even exists.
 * - `no-contribution-no-fixed`: fixed costs = 0 and contribution margin ≤ 0.
 *   Profit is $0 at zero sales, and never rises above $0.
 */
export type BreakEven =
  | {
      status: 'reachable';
      /** Fixed costs ÷ contribution margin per unit, not rounded. */
      unitsExact: number;
      /** unitsExact rounded UP to the next whole unit. */
      unitsRounded: number;
      /** Theoretical break-even revenue = unitsExact × selling price. */
      revenueExact: number;
      /** Revenue earned by selling the rounded-up number of units. */
      revenueAtRounded: number;
    }
  | { status: 'no-fixed-costs' }
  | { status: 'unreachable' }
  | { status: 'no-contribution-no-fixed' };

export interface PricingResults {
  inputs: PricingInputs;
  revenue: number;
  totalVariableCosts: number;
  contributionMarginPerUnit: number;
  totalContributionMargin: number;
  /** Percentage (e.g. 66.67). `null` when the selling price is $0. */
  contributionMarginRatio: number | null;
  totalCosts: number;
  operatingProfit: number;
  breakEven: BreakEven;
  /** Projected revenue − break-even revenue. `null` when no break-even exists. */
  marginOfSafety: number | null;
  /** Margin of safety ÷ projected revenue × 100. `null` when revenue is $0 or no break-even exists. */
  marginOfSafetyPercent: number | null;
}

const toCents = (dollars: number): number => Math.round(dollars * 100);
const toDollars = (cents: number): number => cents / 100;

export function calculate(inputs: PricingInputs): PricingResults {
  const priceC = toCents(inputs.sellingPrice);
  const varC = toCents(inputs.variableCost);
  const fixedC = toCents(inputs.fixedCosts);
  const units = inputs.units;

  const cmPerUnitC = priceC - varC;

  // Revenue = Selling Price × Units Sold
  const revenue = toDollars(priceC * units);
  // Total Variable Costs = Variable Cost per Unit × Units Sold
  const totalVariableCosts = toDollars(varC * units);
  // Contribution Margin per Unit = Selling Price − Variable Cost per Unit
  const contributionMarginPerUnit = toDollars(cmPerUnitC);
  // Total Contribution Margin = Revenue − Total Variable Costs
  const totalContributionMargin = toDollars(cmPerUnitC * units);
  // Contribution Margin Ratio = CM per Unit ÷ Selling Price × 100
  const contributionMarginRatio = priceC === 0 ? null : (cmPerUnitC / priceC) * 100;
  // Total Costs = Total Variable Costs + Fixed Costs
  const totalCosts = toDollars(varC * units + fixedC);
  // Operating Profit = Revenue − Total Variable Costs − Fixed Costs
  const operatingProfit = toDollars(cmPerUnitC * units - fixedC);

  const breakEven = findBreakEven(priceC, cmPerUnitC, fixedC);

  // Margin of Safety ($) = Projected Revenue − (theoretical) Break-Even Revenue
  let marginOfSafety: number | null = null;
  if (breakEven.status === 'reachable') {
    marginOfSafety = revenue - breakEven.revenueExact;
  } else if (breakEven.status === 'no-fixed-costs') {
    marginOfSafety = revenue; // break-even revenue is $0
  }

  // Margin of Safety (%) = Margin of Safety ÷ Projected Revenue × 100
  const marginOfSafetyPercent =
    marginOfSafety !== null && revenue > 0 ? (marginOfSafety / revenue) * 100 : null;

  return {
    inputs,
    revenue,
    totalVariableCosts,
    contributionMarginPerUnit,
    totalContributionMargin,
    contributionMarginRatio,
    totalCosts,
    operatingProfit,
    breakEven,
    marginOfSafety,
    marginOfSafetyPercent,
  };
}

function findBreakEven(priceC: number, cmPerUnitC: number, fixedC: number): BreakEven {
  if (fixedC === 0) {
    return cmPerUnitC > 0 ? { status: 'no-fixed-costs' } : { status: 'no-contribution-no-fixed' };
  }
  if (cmPerUnitC <= 0) {
    return { status: 'unreachable' };
  }

  // Break-Even Units = Fixed Costs ÷ Contribution Margin per Unit
  const unitsExact = fixedC / cmPerUnitC;
  // Round UP: a business cannot sell part of a product or service.
  // Using whole cents means we can test divisibility exactly.
  const unitsRounded =
    fixedC % cmPerUnitC === 0 ? fixedC / cmPerUnitC : Math.floor(fixedC / cmPerUnitC) + 1;

  return {
    status: 'reachable',
    unitsExact,
    unitsRounded,
    // Break-Even Revenue = Break-Even Units (unrounded) × Selling Price
    revenueExact: toDollars((fixedC * priceC) / cmPerUnitC),
    revenueAtRounded: toDollars(unitsRounded * priceC),
  };
}

export interface WhatIfComparison {
  original: PricingResults;
  updated: PricingResults;
  /** New operating profit − original operating profit. */
  profitDifference: number;
  revenueDifference: number;
}

/**
 * What-if: change ONLY the selling price. Sales volume, variable cost and
 * fixed costs stay the same (a simplifying assumption shown in the app).
 */
export function compareNewPrice(base: PricingInputs, newPrice: number): WhatIfComparison {
  const original = calculate(base);
  const updated = calculate({ ...base, sellingPrice: newPrice });
  return {
    original,
    updated,
    profitDifference: toDollars(toCents(updated.operatingProfit) - toCents(original.operatingProfit)),
    revenueDifference: toDollars(toCents(updated.revenue) - toCents(original.revenue)),
  };
}
