import { describe, expect, it } from 'vitest';
import { calculate, compareNewPrice } from './accounting';

describe('Test 1: profitable coffee shop ($6 price, $2 variable, $800 fixed, 300 units)', () => {
  const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 });

  it('calculates revenue, variable costs and contribution margin', () => {
    expect(r.revenue).toBe(1800);
    expect(r.totalVariableCosts).toBe(600);
    expect(r.contributionMarginPerUnit).toBe(4);
    expect(r.totalContributionMargin).toBe(1200);
    expect(r.contributionMarginRatio).toBeCloseTo(66.6667, 3);
    expect(r.totalCosts).toBe(1400);
  });

  it('calculates operating profit of $400', () => {
    expect(r.operatingProfit).toBe(400);
  });

  it('breaks even at 200 units / $1,200 revenue', () => {
    expect(r.breakEven).toEqual({
      status: 'reachable',
      unitsExact: 200,
      unitsRounded: 200,
      revenueExact: 1200,
      revenueAtRounded: 1200,
    });
  });

  it('calculates margin of safety of $600 (33.3%)', () => {
    expect(r.marginOfSafety).toBe(600);
    expect(r.marginOfSafetyPercent).toBeCloseTo(33.333, 2);
  });
});

describe('Test 2: loss-making business ($10 price, $6 variable, $1,000 fixed, 100 units)', () => {
  const r = calculate({ sellingPrice: 10, variableCost: 6, fixedCosts: 1000, units: 100 });

  it('calculates revenue, variable costs and a $600 loss', () => {
    expect(r.revenue).toBe(1000);
    expect(r.totalVariableCosts).toBe(600);
    expect(r.operatingProfit).toBe(-600);
  });

  it('breaks even at 250 units', () => {
    expect(r.breakEven.status).toBe('reachable');
    if (r.breakEven.status === 'reachable') expect(r.breakEven.unitsRounded).toBe(250);
  });

  it('shows a negative margin of safety', () => {
    expect(r.marginOfSafety).toBe(-1500);
    expect(r.marginOfSafetyPercent).toBe(-150);
  });
});

describe('Test 3: no positive contribution margin ($5 price, $7 variable, $500 fixed, 100 units)', () => {
  const r = calculate({ sellingPrice: 5, variableCost: 7, fixedCosts: 500, units: 100 });

  it('calculates a $700 loss', () => {
    expect(r.operatingProfit).toBe(-700);
    expect(r.contributionMarginPerUnit).toBe(-2);
  });

  it('reports that no finite break-even point exists', () => {
    expect(r.breakEven.status).toBe('unreachable');
    expect(r.marginOfSafety).toBeNull();
    expect(r.marginOfSafetyPercent).toBeNull();
  });

  it('also treats price equal to variable cost as unreachable', () => {
    const equal = calculate({ sellingPrice: 7, variableCost: 7, fixedCosts: 500, units: 100 });
    expect(equal.breakEven.status).toBe('unreachable');
    expect(equal.operatingProfit).toBe(-500);
  });
});

describe('rounding break-even units up', () => {
  // $1,000 fixed ÷ $3 CM = 333.33… units
  const r = calculate({ sellingPrice: 5, variableCost: 2, fixedCosts: 1000, units: 400 });

  it('rounds up to the next whole unit', () => {
    expect(r.breakEven.status).toBe('reachable');
    if (r.breakEven.status !== 'reachable') return;
    expect(r.breakEven.unitsExact).toBeCloseTo(333.333, 3);
    expect(r.breakEven.unitsRounded).toBe(334);
  });

  it('distinguishes theoretical break-even revenue from revenue at the rounded units', () => {
    if (r.breakEven.status !== 'reachable') throw new Error('expected reachable');
    expect(r.breakEven.revenueExact).toBeCloseTo(1666.67, 2); // 333.33 × $5
    expect(r.breakEven.revenueAtRounded).toBe(1670); // 334 × $5
    // Margin of safety uses the theoretical (unrounded) break-even revenue.
    expect(r.marginOfSafety).toBeCloseTo(2000 - 1666.6667, 3);
  });

  it('does not over-round because of floating-point error', () => {
    // 1.10 ÷ 0.10 is 11.000000000000002 in floating point; the answer must be 11.
    const tricky = calculate({ sellingPrice: 0.3, variableCost: 0.2, fixedCosts: 1.1, units: 20 });
    if (tricky.breakEven.status !== 'reachable') throw new Error('expected reachable');
    expect(tricky.breakEven.unitsRounded).toBe(11);
  });
});

describe('edge cases', () => {
  it('zero sales: revenue $0, loss equals fixed costs, percentages not defined', () => {
    const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 0 });
    expect(r.revenue).toBe(0);
    expect(r.operatingProfit).toBe(-800);
    expect(r.marginOfSafetyPercent).toBeNull();
    expect(r.breakEven.status).toBe('reachable');
    expect(Number.isNaN(r.marginOfSafety)).toBe(false);
  });

  it('zero fixed costs with positive margin: break-even at 0 units, no division by zero', () => {
    const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 0, units: 300 });
    expect(r.breakEven.status).toBe('no-fixed-costs');
    expect(r.operatingProfit).toBe(1200);
    expect(r.marginOfSafety).toBe(1800);
    expect(r.marginOfSafetyPercent).toBe(100);
  });

  it('zero fixed costs with no positive margin', () => {
    const r = calculate({ sellingPrice: 2, variableCost: 2, fixedCosts: 0, units: 10 });
    expect(r.breakEven.status).toBe('no-contribution-no-fixed');
    expect(r.operatingProfit).toBe(0);
    expect(r.marginOfSafety).toBeNull();
  });

  it('zero selling price: contribution margin ratio is not defined', () => {
    const r = calculate({ sellingPrice: 0, variableCost: 2, fixedCosts: 100, units: 10 });
    expect(r.contributionMarginRatio).toBeNull();
    expect(r.revenue).toBe(0);
    expect(r.operatingProfit).toBe(-120);
    expect(r.breakEven.status).toBe('unreachable');
  });

  it('handles cents without floating-point drift', () => {
    const r = calculate({ sellingPrice: 0.1, variableCost: 0, fixedCosts: 0, units: 3 });
    expect(r.revenue).toBe(0.3);
  });

  it('handles extremely large numbers without crashing', () => {
    const r = calculate({ sellingPrice: 1e9, variableCost: 1, fixedCosts: 1e9, units: 1e9 });
    for (const v of [r.revenue, r.operatingProfit, r.totalCosts, r.contributionMarginRatio ?? 0]) {
      expect(Number.isFinite(v)).toBe(true);
    }
    expect(r.breakEven.status).toBe('reachable');
  });
});

describe('what-if price comparison', () => {
  const base = { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 };

  it('raising the price to $7 (same volume) adds $300 profit and lowers break-even to 160 units', () => {
    const c = compareNewPrice(base, 7);
    expect(c.original.operatingProfit).toBe(400);
    expect(c.updated.revenue).toBe(2100);
    expect(c.updated.operatingProfit).toBe(700);
    expect(c.profitDifference).toBe(300);
    expect(c.revenueDifference).toBe(300);
    if (c.updated.breakEven.status !== 'reachable') throw new Error('expected reachable');
    expect(c.updated.breakEven.unitsRounded).toBe(160);
  });

  it('lowering the price below variable cost makes break-even unreachable', () => {
    const c = compareNewPrice(base, 1.5);
    expect(c.updated.operatingProfit).toBe(-950);
    expect(c.profitDifference).toBe(-1350);
    expect(c.updated.breakEven.status).toBe('unreachable');
  });

  it('does not change the original inputs', () => {
    const copy = { ...base };
    compareNewPrice(base, 9);
    expect(base).toEqual(copy);
  });
});
