/**
 * "Show the math" explanations.
 *
 * Each function takes a result that was ALREADY calculated elsewhere in
 * src/lib (the same object the screen displays) and describes how it was
 * reached: the formula in words, then the same formula with the user's
 * numbers. Nothing is recalculated or re-typed here – the figures are read
 * from the result and formatted with the same helpers the cards use, so the
 * explanation can never disagree with the number on screen.
 */
import { t } from '../i18n/i18n';
import type { PricingResults } from './accounting';
import type { BusinessSummary } from './business';
import type { MakeOrBuyInput, MakeOrBuyResult, SpecialOrderInput, SpecialOrderResult } from './decisions';
import { formatCAD, formatCADDecimals, formatNumber, formatPercent, formatSignedCAD, roundCents, unitsLabel } from './format';
import type { GoalProgress, RequiredPriceResult } from './pricing';
import { formatLeverage, type OperatingLeverage, type SensitivityResult } from './sensitivity';
import { formatRate, type PreTaxResult, type TaxEstimate } from './tax';

export interface MathExplanation {
  /** Which number this explains. */
  title: string;
  /** The formula in words. */
  formula: string;
  /** Optional working lines, e.g. one per product. */
  steps: string[];
  /** The same formula with the user's actual numbers, ending in the result. */
  withNumbers: string;
  /** The result exactly as it is displayed on screen. */
  resultText: string;
  /** Optional assumption or rounding note. */
  note?: string;
}

/** Money for use after an operator: negatives go in brackets, e.g. $975 − (−$200). */
const m = (value: number): string => (roundCents(value) < 0 ? `(${formatCAD(value)})` : formatCAD(value));

/** "a + b + c = total", or just the single working line when there is one product. */
function sumLine(parts: string[], total: string, single: string): string {
  return parts.length === 1 ? single : `${parts.map((p, i) => (i > 0 && p.startsWith('−') ? `(${p})` : p)).join(' + ')} = ${total}`;
}

/* ------------------------------------------------------------------ */
/* Whole-business figures (dashboard cards, scenarios, production plan) */
/* ------------------------------------------------------------------ */

export interface SummaryMath {
  revenue: MathExplanation;
  variableCosts: MathExplanation;
  contributionMargin: MathExplanation;
  fixedCosts: MathExplanation;
  operatingProfit: MathExplanation;
  cmRatio: MathExplanation;
}

/**
 * Explanations for the six main business figures.
 * `unitsWord` describes the units used, e.g. "expected units" or "units sold".
 */
export function summaryMath(s: BusinessSummary, unitsWord = t('expected units')): SummaryMath {
  const revenueSteps = s.products.map((p) => `${p.name}: ${formatCAD(p.price)} × ${formatNumber(p.units)} = ${formatCAD(p.revenue)}`);
  const costSteps = s.products.map((p) => `${p.name}: ${formatCAD(p.variableCost)} × ${formatNumber(p.units)} = ${formatCAD(p.totalVariableCosts)}`);
  const first = s.products[0];

  return {
    revenue: {
      title: t('Total revenue'),
      formula: t('Total revenue = selling price × {units}, added up for every product', { units: unitsWord }),
      steps: s.products.length > 1 ? revenueSteps : [],
      withNumbers: sumLine(
        s.products.map((p) => formatCAD(p.revenue)),
        formatCAD(s.totalRevenue),
        first ? `${formatCAD(first.price)} × ${formatNumber(first.units)} = ${formatCAD(s.totalRevenue)}` : formatCAD(s.totalRevenue),
      ),
      resultText: formatCAD(s.totalRevenue),
    },
    variableCosts: {
      title: t('Total variable costs'),
      formula: t('Total variable costs = variable cost per unit × {units}, added up for every product', { units: unitsWord }),
      steps: s.products.length > 1 ? costSteps : [],
      withNumbers: sumLine(
        s.products.map((p) => formatCAD(p.totalVariableCosts)),
        formatCAD(s.totalVariableCosts),
        first ? `${formatCAD(first.variableCost)} × ${formatNumber(first.units)} = ${formatCAD(s.totalVariableCosts)}` : formatCAD(s.totalVariableCosts),
      ),
      resultText: formatCAD(s.totalVariableCosts),
    },
    contributionMargin: {
      title: t('Total contribution margin'),
      formula: t('Total contribution margin = total revenue − total variable costs'),
      steps: [],
      withNumbers: `${formatCAD(s.totalRevenue)} − ${m(s.totalVariableCosts)} = ${formatCAD(s.totalCM)}`,
      resultText: formatCAD(s.totalCM),
    },
    fixedCosts: {
      title: t('Monthly fixed costs'),
      formula: t('Monthly fixed costs are a number you enter, not a calculation'),
      steps: [],
      withNumbers: t('{fixed} for the whole business, subtracted once (never once per product)', { fixed: formatCAD(s.fixedCosts) }),
      resultText: formatCAD(s.fixedCosts),
    },
    operatingProfit: {
      title: t('Operating profit'),
      formula: t('Operating profit = total contribution margin − fixed costs'),
      steps: [],
      withNumbers: `${formatCAD(s.totalCM)} − ${m(s.fixedCosts)} = ${formatCAD(s.operatingProfit)}`,
      resultText: formatCAD(s.operatingProfit),
      note: t('Operating profit is before taxes and interest, so it is not net income.'),
    },
    cmRatio:
      s.overallCMRatio === null
        ? {
            title: t('Overall contribution margin ratio'),
            formula: t('Overall CM ratio = total contribution margin ÷ total revenue × 100'),
            steps: [],
            withNumbers: t('Not available: total revenue is $0, and dividing by $0 has no answer.'),
            resultText: 'N/A',
          }
        : {
            title: t('Overall contribution margin ratio'),
            formula: t('Overall CM ratio = total contribution margin ÷ total revenue × 100'),
            steps: [],
            withNumbers: `${formatCAD(s.totalCM)} ÷ ${formatCAD(s.totalRevenue)} × 100 = ${formatPercent(s.overallCMRatio)}`,
            resultText: formatPercent(s.overallCMRatio),
          },
  };
}

/* ------------------------------------------------------------------ */
/* Sales-mix break-even and margin of safety (whole business)          */
/* ------------------------------------------------------------------ */

/** Three explanations (weighted CM, break-even units, break-even revenue), or none when break-even is not available. */
export function breakEvenMath(s: BusinessSummary): MathExplanation[] {
  const be = s.breakEven;
  if (be.status !== 'reachable') return [];

  const exact = formatNumber(be.totalUnitsExact);
  const roundedUp = Math.ceil(be.totalUnitsExact);
  let unitsEnd: string;
  if (be.totalUnitsExact === be.totalUnits) unitsEnd = unitsLabel(be.totalUnits);
  else if (be.totalUnits === roundedUp) unitsEnd = t('{exact}, rounded UP to {units}', { exact, units: unitsLabel(be.totalUnits) });
  else unitsEnd = t('{exact}; {units} are needed so the whole-unit split below covers fixed costs', { exact, units: unitsLabel(be.totalUnits) });

  const weightedIsWholeCents = Math.abs(be.weightedCM * 100 - Math.round(be.weightedCM * 100)) < 1e-9;

  return [
    {
      title: t('Weighted-average CM per unit'),
      formula: t('Weighted-average CM per unit = total contribution margin ÷ total expected units'),
      steps: [],
      withNumbers: `${formatCAD(s.totalCM)} ÷ ${unitsLabel(s.totalUnits)} = ${formatCAD(be.weightedCM)}`,
      resultText: formatCAD(be.weightedCM),
      note: weightedIsWholeCents ? undefined : 'Shown rounded to the nearest cent. The unrounded figure is used for the break-even point.',
    },
    {
      title: t('Break-even units (total)'),
      formula: t('Break-even units = fixed costs ÷ weighted-average CM per unit'),
      steps: [],
      withNumbers: `${formatCAD(s.fixedCosts)} ÷ (${formatCAD(s.totalCM)} ÷ ${formatNumber(s.totalUnits)}) = ${unitsEnd}`,
      resultText: unitsLabel(be.totalUnits),
      note: t('Assumes your sales mix stays the same. You can’t sell part of a unit, so break-even units always round up.'),
    },
    {
      title: t('Break-even revenue'),
      formula: t('Break-even revenue = fixed costs ÷ overall CM ratio, where CM ratio = total contribution margin ÷ total revenue'),
      steps: [],
      withNumbers: `${formatCAD(s.fixedCosts)} ÷ (${formatCAD(s.totalCM)} ÷ ${formatCAD(s.totalRevenue)}) = ${formatCAD(be.revenueExact)}`,
      resultText: formatCAD(be.revenueExact),
      note: t('This is the theoretical figure before rounding to whole units.'),
    },
  ];
}

/** Margin of safety in dollars and as a percentage, or none when it is not available. */
export function marginOfSafetyMath(s: BusinessSummary): MathExplanation[] {
  if (s.marginOfSafety === null) return [];
  const breakEvenRevenue = s.breakEven.status === 'reachable' ? s.breakEven.revenueExact : 0;
  const list: MathExplanation[] = [
    {
      title: t('Margin of safety'),
      formula: t('Margin of safety = expected revenue − break-even revenue'),
      steps: [],
      withNumbers: `${formatCAD(s.totalRevenue)} − ${m(breakEvenRevenue)} = ${formatCAD(s.marginOfSafety)}`,
      resultText: formatCAD(s.marginOfSafety),
    },
  ];
  if (s.marginOfSafetyPercent !== null) {
    list.push({
      title: t('Margin of safety (%)'),
      formula: t('Margin of safety % = margin of safety ÷ expected revenue × 100'),
      steps: [],
      withNumbers: `${formatCAD(s.marginOfSafety)} ÷ ${formatCAD(s.totalRevenue)} × 100 = ${formatPercent(s.marginOfSafetyPercent)}`,
      resultText: formatPercent(s.marginOfSafetyPercent),
    });
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* One-product break-even calculator                                   */
/* ------------------------------------------------------------------ */

export function singleBreakEvenMath(r: PricingResults): MathExplanation[] {
  const be = r.breakEven;
  if (be.status !== 'reachable') return [];
  const { sellingPrice, variableCost, fixedCosts, units } = r.inputs;
  const unitsEnd = be.unitsExact === be.unitsRounded ? unitsLabel(be.unitsRounded) : t('{exact}, rounded UP to {units}', { exact: formatNumber(be.unitsExact), units: unitsLabel(be.unitsRounded) });
  const list: MathExplanation[] = [
    {
      title: t('Break-even units'),
      formula: t('Break-even units = fixed costs ÷ (selling price − variable cost per unit)'),
      steps: [],
      withNumbers: `${formatCAD(fixedCosts)} ÷ (${formatCAD(sellingPrice)} − ${m(variableCost)}) = ${unitsEnd}`,
      resultText: unitsLabel(be.unitsRounded),
    },
  ];
  if (r.marginOfSafety !== null) {
    list.push({
      title: t('Margin of safety'),
      formula: t('Margin of safety = projected revenue − break-even revenue'),
      steps: [
        t('Projected revenue: {price} × {units} = {revenue}', { price: formatCAD(sellingPrice), units: formatNumber(units), revenue: formatCAD(r.revenue) }),
        t('Break-even revenue: {exact} units × {price} = {revenue}', { exact: formatNumber(be.unitsExact), price: formatCAD(sellingPrice), revenue: formatCAD(be.revenueExact) }),
      ],
      withNumbers: `${formatCAD(r.revenue)} − ${m(be.revenueExact)} = ${formatCAD(r.marginOfSafety)}`,
      resultText: formatCAD(r.marginOfSafety),
    });
  }
  return list;
}

/* ------------------------------------------------------------------ */
/* Pricing Lab                                                         */
/* ------------------------------------------------------------------ */

export interface RequiredPriceInput {
  variableCost: number;
  units: number;
  fixedCosts: number;
  targetProfit: number;
  otherContribution: number;
}

/** True when the unrounded formula result is already a whole number of cents. */
export function isWholeCents(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-9;
}

/** Explains the minimum price and the profit check; none unless a price was calculated. */
export function requiredPriceMath(input: RequiredPriceInput, result: RequiredPriceResult): MathExplanation[] {
  if (result.status !== 'ok') return [];
  const { variableCost, units, fixedCosts, targetProfit, otherContribution } = input;
  const end = isWholeCents(result.exact) ? formatCAD(result.price) : t('{exact}, rounded UP to {units}', { exact: formatCADDecimals(result.exact, 4), units: formatCAD(result.price) });
  return [
    {
      title: t('Minimum calculated price'),
      formula: t('Required price = variable cost + (fixed costs + target profit − contribution from other products) ÷ expected units'),
      steps: [],
      withNumbers: `${formatCAD(variableCost)} + (${formatCAD(fixedCosts)} + ${m(targetProfit)} − ${m(otherContribution)}) ÷ ${formatNumber(units)} = ${end}`,
      resultText: formatCAD(result.price),
      note: t('Rounded up to the next cent so the target is met, not just missed. Assumes sales stay at the number you entered.'),
    },
    {
      title: t('Check: operating profit at this price'),
      formula: t('Operating profit = (price − variable cost) × expected units + contribution from other products − fixed costs'),
      steps: [],
      withNumbers: `(${formatCAD(result.price)} − ${m(variableCost)}) × ${formatNumber(units)} + ${m(otherContribution)} − ${m(fixedCosts)} = ${formatCAD(result.profitAtPrice)}`,
      resultText: formatCAD(result.profitAtPrice),
    },
  ];
}

export function goalMath(g: GoalProgress): MathExplanation[] {
  return [
    {
      title: t('Difference from target'),
      formula: t('Difference from target = current projected profit − target profit'),
      steps: [],
      withNumbers: `${formatCAD(g.current)} − ${m(g.target)} = ${formatSignedCAD(g.difference)}`,
      resultText: formatSignedCAD(g.difference),
    },
    {
      title: t('Additional contribution margin required'),
      formula: t('Additional contribution margin required = target profit − current projected profit (never less than $0)'),
      steps: [],
      withNumbers: g.met
        ? t('{amount} – the target is already met', { amount: formatCAD(g.additionalCMRequired) })
        : `${formatCAD(g.target)} − ${m(g.current)} = ${formatCAD(g.additionalCMRequired)}`,
      resultText: formatCAD(g.additionalCMRequired),
      note: t('Fixed costs stay the same, so every extra dollar of contribution margin is an extra dollar of operating profit.'),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Sensitivity analysis and operating leverage                         */
/* ------------------------------------------------------------------ */

/** One explanation per input: p % of the total it affects, then the new profit. */
export function sensitivityMath(r: SensitivityResult): MathExplanation[] {
  return r.rows.map((row) => ({
    title: `${row.label} +${r.percent}%`,
    formula: row.upChange < 0
      ? t('Change in operating profit = {pct} × {base}, which lowers profit', { pct: formatPercent(r.percent), base: row.baseName })
      : t('Change in operating profit = {pct} × {base}', { pct: formatPercent(r.percent), base: row.baseName }),
    steps: [],
    withNumbers: `${r.percent}% × ${formatCAD(row.baseAmount)} = ${formatSignedCAD(row.upChange)}, so ${formatCAD(r.baseProfit)} ${row.upChange < 0 ? '−' : '+'} ${formatCAD(Math.abs(row.upChange))} = ${formatCAD(row.upProfit)}`,
    resultText: formatCAD(row.upProfit),
    note: t('A {pct} decrease gives the opposite change: {change} → {profit}.', { pct: formatPercent(r.percent), change: formatSignedCAD(row.downChange), profit: formatCAD(row.downProfit) }),
  }));
}

export function leverageMath(d: OperatingLeverage, r: SensitivityResult): MathExplanation[] {
  if (d.status !== 'ok') return [];
  const volume = r.rows.find((x) => x.factor === 'volume');
  return [
    {
      title: t('Degree of operating leverage'),
      formula: t('Degree of operating leverage = total contribution margin ÷ operating profit'),
      steps: [],
      withNumbers: `${formatCAD(d.totalCM)} ÷ ${formatCAD(d.operatingProfit)} = ${formatLeverage(d.value)}`,
      resultText: formatLeverage(d.value),
      note:
        volume && volume.upPercent !== null
          ? t('Check: sales volume +{pct} changes profit by {change}, which is {dol} × {pct}.', { pct: formatPercent(r.percent), change: formatPercent(volume.upPercent), dol: formatLeverage(d.value) })
          : undefined,
    },
  ];
}

/* ------------------------------------------------------------------ */
/* After-tax target profit                                             */
/* ------------------------------------------------------------------ */

export function preTaxMath(afterTaxTarget: number, ratePercent: number, r: PreTaxResult): MathExplanation[] {
  if (r.status !== 'ok') return [];
  if (r.noTax) {
    return [
      {
        title: t('Required pre-tax operating profit'),
        formula: t('There is no tax on a loss or on $0, so the pre-tax target equals the after-tax target'),
        steps: [],
        withNumbers: `${formatCAD(afterTaxTarget)} = ${formatCAD(r.preTax)}`,
        resultText: formatCAD(r.preTax),
      },
    ];
  }
  const end = isWholeCents(r.exact) ? formatCAD(r.preTax) : t('{exact}, rounded UP to {units}', { exact: formatCADDecimals(r.exact, 4), units: formatCAD(r.preTax) });
  return [
    {
      title: t('Required pre-tax operating profit'),
      formula: t('Required pre-tax profit = target after-tax profit ÷ (1 − tax rate)'),
      steps: [],
      withNumbers: `${formatCAD(afterTaxTarget)} ÷ (1 − ${formatRate(ratePercent)}) = ${end}`,
      resultText: formatCAD(r.preTax),
    },
    {
      title: t('Check: after tax'),
      formula: t('After-tax profit = pre-tax profit − (pre-tax profit × tax rate)'),
      steps: [],
      withNumbers: `${formatCAD(r.preTax)} − ${formatCAD(r.tax)} = ${formatCAD(r.afterTax)}`,
      resultText: formatCAD(r.afterTax),
    },
  ];
}

export function taxEstimateMath(e: TaxEstimate, ratePercent: number): MathExplanation[] {
  return [
    {
      title: t('Estimated tax and after-tax operating profit'),
      formula: e.noTax ? 'No tax is charged on an operating loss or on $0' : 'Estimated tax = operating profit × tax rate; after-tax profit = operating profit − estimated tax',
      steps: e.noTax ? [] : [`Tax: ${formatCAD(e.operatingProfit)} × ${formatRate(ratePercent)} = ${formatCAD(e.tax)}`],
      withNumbers: `${formatCAD(e.operatingProfit)} − ${formatCAD(e.tax)} = ${formatCAD(e.afterTax)}`,
      resultText: formatCAD(e.afterTax),
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Decisions                                                           */
/* ------------------------------------------------------------------ */

export function specialOrderMath(product: { name: string; price: number; variableCost: number }, input: SpecialOrderInput, r: SpecialOrderResult): MathExplanation[] {
  return [
    {
      title: t('Incremental profit from the special order'),
      formula: t('Incremental profit = (offered price − variable cost) × order units − extra one-time costs − contribution margin lost on displaced regular sales'),
      steps: [
        t('Order contribution: ({price} − {cost}) × {units} = {total}', { price: formatCAD(input.offeredPrice), cost: m(product.variableCost), units: formatNumber(input.orderUnits), total: formatCAD(r.orderCM) }),
        t('Lost contribution: ({price} − {cost}) × {units} = {total}', { price: formatCAD(product.price), cost: m(product.variableCost), units: formatNumber(input.lostRegularUnits), total: formatCAD(r.lostCM) }),
      ],
      withNumbers: `${formatCAD(r.orderCM)} − ${m(r.extraCosts)} − ${m(r.lostCM)} = ${formatCAD(r.incrementalProfit)}`,
      resultText: formatCAD(r.incrementalProfit),
      note: t('Fixed costs stay the same whether or not you accept, so they are left out.'),
    },
  ];
}

export function makeOrBuyMath(input: MakeOrBuyInput, r: MakeOrBuyResult): MathExplanation[] {
  return [
    {
      title: t('Relevant cost to make'),
      formula: t('Relevant cost to make = variable cost per unit × units + avoidable fixed costs + opportunity cost'),
      steps: [],
      withNumbers: `${formatCAD(input.variableCostPerUnit)} × ${formatNumber(input.units)} + ${m(input.avoidableFixedCosts)} + ${m(input.opportunityCost)} = ${formatCAD(r.relevantCostToMake)}`,
      resultText: formatCAD(r.relevantCostToMake),
      note: t('Unavoidable fixed costs ({amount}) are paid whether you make or buy, so they are left out.', { amount: formatCAD(r.unavoidableFixedCosts) }),
    },
    {
      title: t('Cost to buy'),
      formula: t('Cost to buy = purchase price × units'),
      steps: [],
      withNumbers: `${formatCAD(input.purchasePrice)} × ${formatNumber(input.units)} = ${formatCAD(r.costToBuy)}`,
      resultText: formatCAD(r.costToBuy),
    },
    {
      title: t('Difference'),
      formula: t('Saving from making = cost to buy − relevant cost to make (negative means buying is cheaper)'),
      steps: [],
      withNumbers: `${formatCAD(r.costToBuy)} − ${m(r.relevantCostToMake)} = ${formatSignedCAD(r.savingFromMaking)}`,
      resultText: formatSignedCAD(r.savingFromMaking),
    },
  ];
}
