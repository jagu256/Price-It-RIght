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
import type { PricingResults } from './accounting';
import type { BusinessSummary } from './business';
import { formatCAD, formatNumber, formatPercent, formatSignedCAD, roundCents, unitsLabel } from './format';
import type { GoalProgress, RequiredPriceResult } from './pricing';
import { formatLeverage, type OperatingLeverage, type SensitivityResult } from './sensitivity';

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
export function summaryMath(s: BusinessSummary, unitsWord = 'expected units'): SummaryMath {
  const revenueSteps = s.products.map((p) => `${p.name}: ${formatCAD(p.price)} × ${formatNumber(p.units)} = ${formatCAD(p.revenue)}`);
  const costSteps = s.products.map((p) => `${p.name}: ${formatCAD(p.variableCost)} × ${formatNumber(p.units)} = ${formatCAD(p.totalVariableCosts)}`);
  const first = s.products[0];

  return {
    revenue: {
      title: 'Total revenue',
      formula: `Total revenue = selling price × ${unitsWord}, added up for every product`,
      steps: s.products.length > 1 ? revenueSteps : [],
      withNumbers: sumLine(
        s.products.map((p) => formatCAD(p.revenue)),
        formatCAD(s.totalRevenue),
        first ? `${formatCAD(first.price)} × ${formatNumber(first.units)} = ${formatCAD(s.totalRevenue)}` : formatCAD(s.totalRevenue),
      ),
      resultText: formatCAD(s.totalRevenue),
    },
    variableCosts: {
      title: 'Total variable costs',
      formula: `Total variable costs = variable cost per unit × ${unitsWord}, added up for every product`,
      steps: s.products.length > 1 ? costSteps : [],
      withNumbers: sumLine(
        s.products.map((p) => formatCAD(p.totalVariableCosts)),
        formatCAD(s.totalVariableCosts),
        first ? `${formatCAD(first.variableCost)} × ${formatNumber(first.units)} = ${formatCAD(s.totalVariableCosts)}` : formatCAD(s.totalVariableCosts),
      ),
      resultText: formatCAD(s.totalVariableCosts),
    },
    contributionMargin: {
      title: 'Total contribution margin',
      formula: 'Total contribution margin = total revenue − total variable costs',
      steps: [],
      withNumbers: `${formatCAD(s.totalRevenue)} − ${m(s.totalVariableCosts)} = ${formatCAD(s.totalCM)}`,
      resultText: formatCAD(s.totalCM),
    },
    fixedCosts: {
      title: 'Monthly fixed costs',
      formula: 'Monthly fixed costs are a number you enter, not a calculation',
      steps: [],
      withNumbers: `${formatCAD(s.fixedCosts)} for the whole business, subtracted once (never once per product)`,
      resultText: formatCAD(s.fixedCosts),
    },
    operatingProfit: {
      title: 'Operating profit',
      formula: 'Operating profit = total contribution margin − fixed costs',
      steps: [],
      withNumbers: `${formatCAD(s.totalCM)} − ${m(s.fixedCosts)} = ${formatCAD(s.operatingProfit)}`,
      resultText: formatCAD(s.operatingProfit),
      note: 'Operating profit is before taxes and interest, so it is not net income.',
    },
    cmRatio:
      s.overallCMRatio === null
        ? {
            title: 'Overall contribution margin ratio',
            formula: 'Overall CM ratio = total contribution margin ÷ total revenue × 100',
            steps: [],
            withNumbers: 'Not available: total revenue is $0, and dividing by $0 has no answer.',
            resultText: 'N/A',
          }
        : {
            title: 'Overall contribution margin ratio',
            formula: 'Overall CM ratio = total contribution margin ÷ total revenue × 100',
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
  else if (be.totalUnits === roundedUp) unitsEnd = `${exact}, rounded UP to ${unitsLabel(be.totalUnits)}`;
  else unitsEnd = `${exact}; ${unitsLabel(be.totalUnits)} are needed so the whole-unit split below covers fixed costs`;

  const weightedIsWholeCents = Math.abs(be.weightedCM * 100 - Math.round(be.weightedCM * 100)) < 1e-9;

  return [
    {
      title: 'Weighted-average CM per unit',
      formula: 'Weighted-average CM per unit = total contribution margin ÷ total expected units',
      steps: [],
      withNumbers: `${formatCAD(s.totalCM)} ÷ ${unitsLabel(s.totalUnits)} = ${formatCAD(be.weightedCM)}`,
      resultText: formatCAD(be.weightedCM),
      note: weightedIsWholeCents ? undefined : 'Shown rounded to the nearest cent. The unrounded figure is used for the break-even point.',
    },
    {
      title: 'Break-even units (total)',
      formula: 'Break-even units = fixed costs ÷ weighted-average CM per unit',
      steps: [],
      withNumbers: `${formatCAD(s.fixedCosts)} ÷ (${formatCAD(s.totalCM)} ÷ ${formatNumber(s.totalUnits)}) = ${unitsEnd}`,
      resultText: unitsLabel(be.totalUnits),
      note: 'Assumes your sales mix stays the same. You can’t sell part of a unit, so break-even units always round up.',
    },
    {
      title: 'Break-even revenue',
      formula: 'Break-even revenue = fixed costs ÷ overall CM ratio, where CM ratio = total contribution margin ÷ total revenue',
      steps: [],
      withNumbers: `${formatCAD(s.fixedCosts)} ÷ (${formatCAD(s.totalCM)} ÷ ${formatCAD(s.totalRevenue)}) = ${formatCAD(be.revenueExact)}`,
      resultText: formatCAD(be.revenueExact),
      note: 'This is the theoretical figure before rounding to whole units.',
    },
  ];
}

/** Margin of safety in dollars and as a percentage, or none when it is not available. */
export function marginOfSafetyMath(s: BusinessSummary): MathExplanation[] {
  if (s.marginOfSafety === null) return [];
  const breakEvenRevenue = s.breakEven.status === 'reachable' ? s.breakEven.revenueExact : 0;
  const list: MathExplanation[] = [
    {
      title: 'Margin of safety',
      formula: 'Margin of safety = expected revenue − break-even revenue',
      steps: [],
      withNumbers: `${formatCAD(s.totalRevenue)} − ${m(breakEvenRevenue)} = ${formatCAD(s.marginOfSafety)}`,
      resultText: formatCAD(s.marginOfSafety),
    },
  ];
  if (s.marginOfSafetyPercent !== null) {
    list.push({
      title: 'Margin of safety (%)',
      formula: 'Margin of safety % = margin of safety ÷ expected revenue × 100',
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
  const unitsEnd = be.unitsExact === be.unitsRounded ? unitsLabel(be.unitsRounded) : `${formatNumber(be.unitsExact)}, rounded UP to ${unitsLabel(be.unitsRounded)}`;
  const list: MathExplanation[] = [
    {
      title: 'Break-even units',
      formula: 'Break-even units = fixed costs ÷ (selling price − variable cost per unit)',
      steps: [],
      withNumbers: `${formatCAD(fixedCosts)} ÷ (${formatCAD(sellingPrice)} − ${m(variableCost)}) = ${unitsEnd}`,
      resultText: unitsLabel(be.unitsRounded),
    },
  ];
  if (r.marginOfSafety !== null) {
    list.push({
      title: 'Margin of safety',
      formula: 'Margin of safety = projected revenue − break-even revenue',
      steps: [
        `Projected revenue: ${formatCAD(sellingPrice)} × ${formatNumber(units)} = ${formatCAD(r.revenue)}`,
        `Break-even revenue: ${formatNumber(be.unitsExact)} units × ${formatCAD(sellingPrice)} = ${formatCAD(be.revenueExact)}`,
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
  const end = isWholeCents(result.exact) ? formatCAD(result.price) : `$${result.exact.toFixed(4)}, rounded UP to ${formatCAD(result.price)}`;
  return [
    {
      title: 'Minimum calculated price',
      formula: 'Required price = variable cost + (fixed costs + target profit − contribution from other products) ÷ expected units',
      steps: [],
      withNumbers: `${formatCAD(variableCost)} + (${formatCAD(fixedCosts)} + ${m(targetProfit)} − ${m(otherContribution)}) ÷ ${formatNumber(units)} = ${end}`,
      resultText: formatCAD(result.price),
      note: 'Rounded up to the next cent so the target is met, not just missed. Assumes sales stay at the number you entered.',
    },
    {
      title: 'Check: operating profit at this price',
      formula: 'Operating profit = (price − variable cost) × expected units + contribution from other products − fixed costs',
      steps: [],
      withNumbers: `(${formatCAD(result.price)} − ${m(variableCost)}) × ${formatNumber(units)} + ${m(otherContribution)} − ${m(fixedCosts)} = ${formatCAD(result.profitAtPrice)}`,
      resultText: formatCAD(result.profitAtPrice),
    },
  ];
}

export function goalMath(g: GoalProgress): MathExplanation[] {
  return [
    {
      title: 'Difference from target',
      formula: 'Difference from target = current projected profit − target profit',
      steps: [],
      withNumbers: `${formatCAD(g.current)} − ${m(g.target)} = ${formatSignedCAD(g.difference)}`,
      resultText: formatSignedCAD(g.difference),
    },
    {
      title: 'Additional contribution margin required',
      formula: 'Additional contribution margin required = target profit − current projected profit (never less than $0)',
      steps: [],
      withNumbers: g.met
        ? `${formatCAD(g.additionalCMRequired)} – the target is already met`
        : `${formatCAD(g.target)} − ${m(g.current)} = ${formatCAD(g.additionalCMRequired)}`,
      resultText: formatCAD(g.additionalCMRequired),
      note: 'Fixed costs stay the same, so every extra dollar of contribution margin is an extra dollar of operating profit.',
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
    formula: `Change in operating profit = ${r.percent}% × ${row.baseName}${row.upChange < 0 ? ', which lowers profit' : ''}`,
    steps: [],
    withNumbers: `${r.percent}% × ${formatCAD(row.baseAmount)} = ${formatSignedCAD(row.upChange)}, so ${formatCAD(r.baseProfit)} ${row.upChange < 0 ? '−' : '+'} ${formatCAD(Math.abs(row.upChange))} = ${formatCAD(row.upProfit)}`,
    resultText: formatCAD(row.upProfit),
    note: `A ${r.percent}% decrease gives the opposite change: ${formatSignedCAD(row.downChange)} → ${formatCAD(row.downProfit)}.`,
  }));
}

export function leverageMath(d: OperatingLeverage, r: SensitivityResult): MathExplanation[] {
  if (d.status !== 'ok') return [];
  const volume = r.rows.find((x) => x.factor === 'volume');
  return [
    {
      title: 'Degree of operating leverage',
      formula: 'Degree of operating leverage = total contribution margin ÷ operating profit',
      steps: [],
      withNumbers: `${formatCAD(d.totalCM)} ÷ ${formatCAD(d.operatingProfit)} = ${formatLeverage(d.value)}`,
      resultText: formatLeverage(d.value),
      note:
        volume && volume.upPercent !== null
          ? `Check: sales volume +${r.percent}% changes profit by ${formatPercent(volume.upPercent)}, which is ${formatLeverage(d.value)} × ${r.percent}%.`
          : undefined,
    },
  ];
}
