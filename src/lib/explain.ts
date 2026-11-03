/**
 * Plain-language explanations of the results. These describe what the
 * numbers mean – they deliberately do not tell the user what price to charge.
 */
import type { PricingResults } from './accounting';
import { formatCAD, formatNumber, formatPercent, roundCents, unitsLabel } from './format';

export function profitSummary(r: PricingResults): string {
  const { units, fixedCosts } = r.inputs;
  const profit = roundCents(r.operatingProfit);

  if (units === 0) {
    return fixedCosts > 0
      ? `With 0 expected sales, revenue would be $0 and the business would have a monthly operating loss equal to its fixed costs (${formatCAD(fixedCosts)}).`
      : 'With 0 expected sales and no fixed costs, revenue, costs and operating profit would all be $0.';
  }
  if (profit > 0) {
    return `At your current price and expected sales volume, your business is projected to earn ${formatCAD(profit)} in monthly operating profit.`;
  }
  if (profit === 0) {
    return 'At your current price and expected sales volume, your business is projected to break even exactly, with $0 in monthly operating profit.';
  }
  return `At your current price and expected sales volume, your business is projected to have a monthly operating loss of ${formatCAD(-profit)}. Projected revenue of ${formatCAD(r.revenue)} would not cover total costs of ${formatCAD(r.totalCosts)}.`;
}

export function breakEvenSummary(r: PricingResults): string {
  const { sellingPrice, variableCost, fixedCosts, units } = r.inputs;
  const cm = roundCents(r.contributionMarginPerUnit);
  const be = r.breakEven;

  switch (be.status) {
    case 'reachable': {
      let text = `Your business must sell at least ${unitsLabel(be.unitsRounded)} per month to break even.`;
      if (be.unitsExact !== be.unitsRounded) {
        text += ` The theoretical break-even point is ${formatNumber(be.unitsExact)} units (${formatCAD(be.revenueExact)} in revenue). Because you can’t sell part of a unit, this is rounded up to ${formatNumber(be.unitsRounded)} units, which bring in ${formatCAD(be.revenueAtRounded)}.`;
      }
      if (units < be.unitsRounded) {
        const gap = be.unitsRounded - units;
        text += ` Your current projection of ${unitsLabel(units)} is ${unitsLabel(gap)} short of that.`;
      }
      return text;
    }
    case 'no-fixed-costs':
      return 'With no fixed costs and a positive contribution margin, every unit sold adds to profit, so the business breaks even at 0 units.';
    case 'unreachable':
      return cm < 0
        ? `Each unit sells for ${formatCAD(sellingPrice)} but costs ${formatCAD(variableCost)} in variable costs, so every sale adds ${formatCAD(-cm)} to the loss. With ${formatCAD(fixedCosts)} in fixed costs, a finite break-even point cannot be achieved under the current assumptions.`
        : `Each unit sells for exactly its variable cost, so sales contribute $0 toward the ${formatCAD(fixedCosts)} of fixed costs. A finite break-even point cannot be achieved under the current assumptions.`;
    case 'no-contribution-no-fixed':
      return cm < 0
        ? `There are no fixed costs, but every unit sold loses ${formatCAD(-cm)}, so operating profit falls below $0 as soon as anything is sold.`
        : 'There are no fixed costs, but each unit contributes $0, so operating profit stays at $0 at any sales volume.';
  }
}

export function marginOfSafetySummary(r: PricingResults): string {
  if (r.marginOfSafety === null) {
    return 'Margin of safety is not available because there is no finite break-even point to compare against.';
  }
  const mos = roundCents(r.marginOfSafety);
  if (r.revenue === 0) {
    return 'Margin of safety percentage can’t be calculated when projected revenue is $0.';
  }
  const pct = r.marginOfSafetyPercent !== null ? ` (${formatPercent(r.marginOfSafetyPercent)} of projected revenue)` : '';
  if (mos > 0) {
    return `Projected sales could fall by ${formatCAD(mos)}${pct} before the business reaches its break-even revenue.`;
  }
  if (mos === 0) {
    return 'Projected revenue is exactly equal to the break-even revenue, so there is no margin of safety.';
  }
  return `Projected revenue is ${formatCAD(-mos)} below the break-even revenue, so the margin of safety is negative.`;
}

/** Short label for the break-even card value. */
export function breakEvenValue(r: PricingResults): string {
  switch (r.breakEven.status) {
    case 'reachable':
      return unitsLabel(r.breakEven.unitsRounded);
    case 'no-fixed-costs':
      return '0 units';
    default:
      return 'Not reachable';
  }
}
