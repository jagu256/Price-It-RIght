import { describe, expect, it } from 'vitest';
import { calculate } from './accounting';
import { businessSummary } from './business';
import { formatCAD, formatPercent, formatSignedCAD, unitsLabel } from './format';
import { buildModel } from './model';
import { goalProgress, requiredPrice } from './pricing';
import { sampleBusiness } from './samples';
import { breakEvenMath, goalMath, isWholeCents, marginOfSafetyMath, requiredPriceMath, singleBreakEvenMath, summaryMath } from './showMath';

let n = 0;
const demo = buildModel(sampleBusiness('demo', (p) => `${p}-${++n}`));
const s = demo.summary!;

describe('show the math – demo café (Coffee, Muffin, Sandwich, Cookie; fixed $1,500)', () => {
  const math = summaryMath(s);

  it('explains operating profit with the hand-checked numbers', () => {
    expect(math.operatingProfit.formula).toBe('Operating profit = total contribution margin − fixed costs');
    expect(math.operatingProfit.withNumbers).toBe('$2,475 − $1,500 = $975');
  });

  it('explains revenue, variable costs, contribution margin and CM ratio', () => {
    expect(math.revenue.steps).toEqual(['Coffee: $6 × 300 = $1,800', 'Muffin: $4 × 150 = $600', 'Sandwich: $9 × 100 = $900', 'Cookie: $3 × 200 = $600']);
    expect(math.revenue.withNumbers).toBe('$1,800 + $600 + $900 + $600 = $3,900');
    expect(math.variableCosts.withNumbers).toBe('$600 + $225 + $400 + $200 = $1,425');
    expect(math.contributionMargin.withNumbers).toBe('$3,900 − $1,425 = $2,475');
    expect(math.cmRatio.withNumbers).toBe('$2,475 ÷ $3,900 × 100 = 63.5%');
  });

  it('every explanation ends in exactly the figure the dashboard card displays', () => {
    // The right-hand side of each list is how the dashboard formats its cards.
    const shown: [string, string][] = [
      [math.revenue.resultText, formatCAD(s.totalRevenue)],
      [math.variableCosts.resultText, formatCAD(s.totalVariableCosts)],
      [math.contributionMargin.resultText, formatCAD(s.totalCM)],
      [math.fixedCosts.resultText, formatCAD(s.fixedCosts)],
      [math.operatingProfit.resultText, formatCAD(s.operatingProfit)],
      [math.cmRatio.resultText, formatPercent(s.overallCMRatio!)],
    ];
    for (const [explained, displayed] of shown) expect(explained).toBe(displayed);
    expect(shown.map(([e]) => e)).toEqual(['$3,900', '$1,425', '$2,475', '$1,500', '$975', '63.5%']);
    // …and the worked line finishes with that same figure.
    for (const x of [math.revenue, math.variableCosts, math.contributionMargin, math.operatingProfit, math.cmRatio]) {
      expect(x.withNumbers.endsWith(`= ${x.resultText}`)).toBe(true);
    }
  });

  it('explains the sales-mix break-even (455 units, $2,363.64) and margin of safety', () => {
    const [weighted, units, revenue] = breakEvenMath(s);
    expect(weighted.withNumbers).toBe('$2,475 ÷ 750 units = $3.30');
    expect(units.withNumbers).toBe('$1,500 ÷ ($2,475 ÷ 750) = 454.55, rounded UP to 455 units');
    expect(units.resultText).toBe('455 units');
    expect(revenue.withNumbers).toBe('$1,500 ÷ ($2,475 ÷ $3,900) = $2,363.64');
    const [mos, pct] = marginOfSafetyMath(s);
    expect(mos.withNumbers).toBe('$3,900 − $2,363.64 = $1,536.36');
    expect(mos.resultText).toBe(formatCAD(s.marginOfSafety!));
    expect(pct.withNumbers).toBe('$1,536.36 ÷ $3,900 × 100 = 39.4%');
  });
});

describe('show the math – edge cases', () => {
  it('a loss is explained without NaN, and brackets keep negative numbers readable', () => {
    const loss = businessSummary([{ id: 'a', name: 'Tea', price: 3, variableCost: 4, units: 10 }], 100);
    const math = summaryMath(loss);
    expect(math.revenue.steps).toEqual([]);
    expect(math.revenue.withNumbers).toBe('$3 × 10 = $30');
    expect(math.contributionMargin.withNumbers).toBe('$30 − $40 = −$10');
    expect(math.operatingProfit.withNumbers).toBe('−$10 − $100 = −$110');
    expect(breakEvenMath(loss)).toEqual([]);
    expect(marginOfSafetyMath(loss)).toEqual([]);
  });

  it('CM ratio says “not available” when revenue is $0', () => {
    const none = businessSummary([{ id: 'a', name: 'Tea', price: 3, variableCost: 1, units: 0 }], 100);
    const ratio = summaryMath(none).cmRatio;
    expect(ratio.resultText).toBe('N/A');
    expect(ratio.withNumbers).toMatch(/^Not available/);
    expect(JSON.stringify(summaryMath(none))).not.toMatch(/NaN|Infinity/);
  });

  it('notes when the weighted-average CM is shown rounded', () => {
    const b = businessSummary(
      [
        { id: 'a', name: 'A', price: 5, variableCost: 2, units: 2 },
        { id: 'b', name: 'B', price: 4, variableCost: 2, units: 1 },
      ],
      100,
    );
    const [weighted] = breakEvenMath(b);
    expect(weighted.withNumbers).toBe('$8 ÷ 3 units = $2.67');
    expect(weighted.note).toMatch(/rounded to the nearest cent/);
  });
});

describe('show the math – one-product break-even', () => {
  it('shows whole and rounded-up answers', () => {
    const exact = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 1500, units: 300 });
    const [units, mos] = singleBreakEvenMath(exact);
    expect(units.withNumbers).toBe('$1,500 ÷ ($6 − $2) = 375 units');
    expect(mos.withNumbers).toBe('$1,800 − $2,250 = −$450');
    const rounded = calculate({ sellingPrice: 5, variableCost: 2, fixedCosts: 1000, units: 400 });
    expect(singleBreakEvenMath(rounded)[0].withNumbers).toBe('$1,000 ÷ ($5 − $2) = 333.33, rounded UP to 334 units');
    expect(singleBreakEvenMath(rounded)[0].resultText).toBe(unitsLabel(rounded.breakEven.status === 'reachable' ? rounded.breakEven.unitsRounded : -1));
  });

  it('gives no explanation when there is no break-even point', () => {
    expect(singleBreakEvenMath(calculate({ sellingPrice: 5, variableCost: 7, fixedCosts: 500, units: 100 }))).toEqual([]);
  });
});

describe('show the math – Pricing Lab', () => {
  it('explains the required price from the README example ($7.75)', () => {
    const input = { variableCost: 2, units: 300, fixedCosts: 1500, targetProfit: 1500, otherContribution: 1275 };
    const result = requiredPrice(input);
    const [price, check] = requiredPriceMath(input, result);
    expect(price.withNumbers).toBe('$2 + ($1,500 + $1,500 − $1,275) ÷ 300 = $7.75');
    expect(price.resultText).toBe(result.status === 'ok' ? formatCAD(result.price) : '');
    expect(check.withNumbers).toBe('($7.75 − $2) × 300 + $1,275 − $1,500 = $1,500');
  });

  it('shows the rounding step when the formula does not land on a whole cent', () => {
    const input = { variableCost: 2, units: 7, fixedCosts: 100, targetProfit: 0, otherContribution: 0 };
    const [price] = requiredPriceMath(input, requiredPrice(input));
    expect(price.withNumbers).toBe('$2 + ($100 + $0 − $0) ÷ 7 = $16.2857, rounded UP to $16.29');
    expect(isWholeCents(16.2857)).toBe(false);
    expect(isWholeCents(7.75)).toBe(true);
  });

  it('gives no price explanation when no price was calculated', () => {
    const input = { variableCost: 2, units: 0, fixedCosts: 100, targetProfit: 0, otherContribution: 0 };
    expect(requiredPriceMath(input, requiredPrice(input))).toEqual([]);
  });

  it('explains the profit goal gap, including negative targets', () => {
    const g = goalProgress(975, 1500);
    const [diff, extra] = goalMath(g);
    expect(diff.withNumbers).toBe('$975 − $1,500 = −$525');
    expect(diff.resultText).toBe(formatSignedCAD(g.difference));
    expect(extra.withNumbers).toBe('$1,500 − $975 = $525');
    expect(goalMath(goalProgress(975, 500))[1].withNumbers).toBe('$0 – the target is already met');
    expect(goalMath(goalProgress(-300, -200))[0].withNumbers).toBe('−$300 − (−$200) = −$100');
  });
});
