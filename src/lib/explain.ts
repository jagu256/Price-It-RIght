/**
 * Plain-language explanations of the results. These describe what the
 * numbers mean – they deliberately do not tell the user what price to charge.
 */
import { t } from '../i18n/i18n';
import type { PricingResults } from './accounting';
import { formatCAD, formatNumber, formatPercent, roundCents, unitsLabel } from './format';

export function profitSummary(r: PricingResults): string {
  const { units, fixedCosts } = r.inputs;
  const profit = roundCents(r.operatingProfit);

  if (units === 0) {
    return fixedCosts > 0
      ? t('With 0 expected sales, revenue would be $0 and the business would have a monthly operating loss equal to its fixed costs ({fixed}).', { fixed: formatCAD(fixedCosts) })
      : t('With 0 expected sales and no fixed costs, revenue, costs and operating profit would all be $0.');
  }
  if (profit > 0) {
    return t('At your current price and expected sales volume, your business is projected to earn {profit} in monthly operating profit.', { profit: formatCAD(profit) });
  }
  if (profit === 0) {
    return t('At your current price and expected sales volume, your business is projected to break even exactly, with $0 in monthly operating profit.');
  }
  return t(
    'At your current price and expected sales volume, your business is projected to have a monthly operating loss of {loss}. Projected revenue of {revenue} would not cover total costs of {costs}.',
    { loss: formatCAD(-profit), revenue: formatCAD(r.revenue), costs: formatCAD(r.totalCosts) },
  );
}

export function breakEvenSummary(r: PricingResults): string {
  const { sellingPrice, variableCost, fixedCosts, units } = r.inputs;
  const cm = roundCents(r.contributionMarginPerUnit);
  const be = r.breakEven;

  switch (be.status) {
    case 'reachable': {
      let text = t('Your business must sell at least {units} per month to break even.', { units: unitsLabel(be.unitsRounded) });
      if (be.unitsExact !== be.unitsRounded) {
        text +=
          ' ' +
          t(
            'The theoretical break-even point is {exact} units ({revenue} in revenue). Because you can’t sell part of a unit, this is rounded up to {rounded} units, which bring in {roundedRevenue}.',
            { exact: formatNumber(be.unitsExact), revenue: formatCAD(be.revenueExact), rounded: formatNumber(be.unitsRounded), roundedRevenue: formatCAD(be.revenueAtRounded) },
          );
      }
      if (units < be.unitsRounded) {
        const gap = be.unitsRounded - units;
        text += ' ' + t('Your current projection of {units} is {gap} short of that.', { units: unitsLabel(units), gap: unitsLabel(gap) });
      }
      return text;
    }
    case 'no-fixed-costs':
      return t('With no fixed costs and a positive contribution margin, every unit sold adds to profit, so the business breaks even at 0 units.');
    case 'unreachable':
      return cm < 0
        ? t(
            'Each unit sells for {price} but costs {cost} in variable costs, so every sale adds {loss} to the loss. With {fixed} in fixed costs, a finite break-even point cannot be achieved under the current assumptions.',
            { price: formatCAD(sellingPrice), cost: formatCAD(variableCost), loss: formatCAD(-cm), fixed: formatCAD(fixedCosts) },
          )
        : t('Each unit sells for exactly its variable cost, so sales contribute $0 toward the {fixed} of fixed costs. A finite break-even point cannot be achieved under the current assumptions.', {
            fixed: formatCAD(fixedCosts),
          });
    case 'no-contribution-no-fixed':
      return cm < 0
        ? t('There are no fixed costs, but every unit sold loses {loss}, so operating profit falls below $0 as soon as anything is sold.', { loss: formatCAD(-cm) })
        : t('There are no fixed costs, but each unit contributes $0, so operating profit stays at $0 at any sales volume.');
  }
}

export function marginOfSafetySummary(r: PricingResults): string {
  if (r.marginOfSafety === null) {
    return t('Margin of safety is not available because there is no finite break-even point to compare against.');
  }
  const mos = roundCents(r.marginOfSafety);
  if (r.revenue === 0) {
    return t('Margin of safety percentage can’t be calculated when projected revenue is $0.');
  }
  if (mos > 0) {
    return r.marginOfSafetyPercent !== null
      ? t('Projected sales could fall by {amount} ({pct} of projected revenue) before the business reaches its break-even revenue.', { amount: formatCAD(mos), pct: formatPercent(r.marginOfSafetyPercent) })
      : t('Projected sales could fall by {amount} before the business reaches its break-even revenue.', { amount: formatCAD(mos) });
  }
  if (mos === 0) {
    return t('Projected revenue is exactly equal to the break-even revenue, so there is no margin of safety.');
  }
  return t('Projected revenue is {amount} below the break-even revenue, so the margin of safety is negative.', { amount: formatCAD(-mos) });
}

/** Short label for the break-even card value. */
export function breakEvenValue(r: PricingResults): string {
  switch (r.breakEven.status) {
    case 'reachable':
      return unitsLabel(r.breakEven.unitsRounded);
    case 'no-fixed-costs':
      return unitsLabel(0);
    default:
      return t('Not reachable');
  }
}
