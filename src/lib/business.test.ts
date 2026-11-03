import { describe, expect, it } from 'vitest';
import { allocateByMix, businessSummary, productMetrics, sortProducts, unitsForContribution } from './business';

const P = (id: string, price: number, variableCost: number, units: number) => ({ id, name: id, price, variableCost, units });

// The project's required financial verification example.
const verification = [P('Coffee', 6, 2, 300), P('Muffin', 4, 1.5, 150), P('Sandwich', 9, 4, 100), P('Cookie', 3, 1, 200)];

describe('required verification example (fixed costs $1,500)', () => {
  const s = businessSummary(verification, 1500);
  it('reproduces the expected totals', () => {
    expect(s.totalRevenue).toBe(3900);
    expect(s.totalVariableCosts).toBe(1425);
    expect(s.totalCM).toBe(2475);
    expect(s.operatingProfit).toBe(975);
  });
  it('calculates the overall contribution margin ratio', () => {
    expect(s.overallCMRatio).toBeCloseTo((2475 / 3900) * 100, 6); // 63.46 %
  });
  it('product contribution margins add up to the total – fixed costs are subtracted once', () => {
    const sum = s.products.reduce((t, p) => t + p.totalCM, 0);
    expect(sum).toBe(2475);
    expect(s.products.map((p) => p.totalCM)).toEqual([1200, 375, 500, 400]);
  });
});

describe('product calculations', () => {
  it('calculates revenue, variable costs and contribution margins', () => {
    expect(productMetrics(P('Muffin', 4, 1.5, 150))).toMatchObject({
      revenue: 600,
      totalVariableCosts: 225,
      cmPerUnit: 2.5,
      totalCM: 375,
      cmRatio: 62.5,
    });
  });
  it('handles a $0 selling price without dividing by zero', () => {
    const m = productMetrics(P('Free sample', 0, 0.5, 10));
    expect(m.cmRatio).toBeNull();
    expect(m.totalCM).toBe(-5);
  });
  it('sorts by each supported key, highest first', () => {
    const metrics = verification.map(productMetrics);
    // Muffin and Cookie both have $600 revenue – the tie keeps their original order.
    expect(sortProducts(metrics, 'revenue').map((m) => m.name)).toEqual(['Coffee', 'Sandwich', 'Muffin', 'Cookie']);
    expect(sortProducts(metrics, 'totalCM').map((m) => m.name)).toEqual(['Coffee', 'Sandwich', 'Cookie', 'Muffin']);
    expect(sortProducts(metrics, 'cmPerUnit').map((m) => m.name)).toEqual(['Sandwich', 'Coffee', 'Muffin', 'Cookie']);
    expect(sortProducts(metrics, 'units').map((m) => m.name)).toEqual(['Coffee', 'Cookie', 'Muffin', 'Sandwich']);
  });
});

describe('one-product business', () => {
  it('matches the single-product calculator (coffee $6 / $2 / $800 / 300)', () => {
    const s = businessSummary([P('Coffee', 6, 2, 300)], 800);
    expect(s.operatingProfit).toBe(400);
    expect(s.breakEven).toMatchObject({ status: 'reachable', totalUnits: 200, totalUnitsExact: 200, revenueExact: 1200 });
    expect(s.marginOfSafety).toBe(600);
  });
  it('rounds break-even units up', () => {
    const s = businessSummary([P('Bread', 5, 2, 400)], 1000);
    if (s.breakEven.status !== 'reachable') throw new Error('expected reachable');
    expect(s.breakEven.totalUnitsExact).toBeCloseTo(333.333, 3);
    expect(s.breakEven.totalUnits).toBe(334);
  });
});

describe('sales-mix break-even', () => {
  const s = businessSummary(verification, 1500);
  it('uses the weighted-average contribution margin', () => {
    if (s.breakEven.status !== 'reachable') throw new Error('expected reachable');
    // Mix: 300/750, 150/750, 100/750, 200/750 → WACM = 2,475 ÷ 750 = $3.30
    expect(s.breakEven.weightedCM).toBeCloseTo(3.3, 10);
    expect(s.breakEven.totalUnitsExact).toBeCloseTo(1500 / 3.3, 6); // 454.55
    expect(s.breakEven.revenueExact).toBeCloseTo(1500 / (2475 / 3900), 6); // $2,363.64
  });
  it('splits break-even units into whole units that keep the mix and cover fixed costs', () => {
    if (s.breakEven.status !== 'reachable') throw new Error('expected reachable');
    const units = Object.fromEntries(s.breakEven.allocation.map((a) => [a.id, a.units]));
    expect(units).toEqual({ Coffee: 182, Muffin: 91, Sandwich: 61, Cookie: 121 });
    const cm = 182 * 4 + 91 * 2.5 + 61 * 5 + 121 * 2;
    expect(cm).toBeGreaterThanOrEqual(1500);
  });
  it('a different sales mix has a different break-even point', () => {
    const coffeeHeavy = businessSummary([P('Coffee', 6, 2, 700), P('Cookie', 3, 1, 50)], 1500);
    const cookieHeavy = businessSummary([P('Coffee', 6, 2, 50), P('Cookie', 3, 1, 700)], 1500);
    if (coffeeHeavy.breakEven.status !== 'reachable' || cookieHeavy.breakEven.status !== 'reachable') throw new Error();
    expect(coffeeHeavy.breakEven.totalUnits).not.toBe(cookieHeavy.breakEven.totalUnits);
  });
  it('finds the smallest whole-unit plan at the mix (5 units: 3 + 2 → $13 ≥ $10)', () => {
    const plan = unitsForContribution(
      [
        { id: 'good', cmCents: 500, weight: 1 },
        { id: 'loss', cmCents: -100, weight: 1 },
      ],
      1000,
    );
    // WACM = ($5 − $1) ÷ 2 = $2.00 → exactly 5 units.
    expect(plan!.totalUnits).toBe(5);
    expect(plan!.allocation).toEqual([{ id: 'good', units: 3 }, { id: 'loss', units: 2 }]);
  });
  it('steps up when rounding leaves the plan short because a product has a negative margin', () => {
    const weights = [
      { id: 'loss', cmCents: -100, weight: 1 },
      { id: 'good', cmCents: 500, weight: 1 },
    ];
    const plan = unitsForContribution(weights, 1000);
    // 5 units would round to loss 3 + good 2 → $10 − $3 = $7, which is short; 6 units (3 + 3) → $12.
    expect(plan!.totalUnits).toBe(6);
    const cm = plan!.allocation.reduce((t, a) => t + a.units * (a.id === 'good' ? 500 : -100), 0);
    expect(cm).toBe(1200);
  });
  it('allocates by largest remainder', () => {
    expect(allocateByMix([{ id: 'a', cmCents: 1, weight: 1 }, { id: 'b', cmCents: 1, weight: 1 }, { id: 'c', cmCents: 1, weight: 1 }], 10)).toEqual([
      { id: 'a', units: 4 },
      { id: 'b', units: 3 },
      { id: 'c', units: 3 },
    ]);
  });
  it('reports "no sales" when nothing is expected to sell', () => {
    const z = businessSummary([P('Coffee', 6, 2, 0)], 800);
    expect(z.breakEven.status).toBe('no-sales');
    expect(z.overallCMRatio).toBeNull();
    expect(z.marginOfSafetyPercent).toBeNull();
    expect(z.operatingProfit).toBe(-800);
  });
  it('handles zero fixed costs', () => {
    const z = businessSummary(verification, 0);
    expect(z.breakEven.status).toBe('no-fixed-costs');
    expect(z.marginOfSafetyPercent).toBe(100);
  });
  it('reports unreachable when the mix has no positive contribution margin', () => {
    const z = businessSummary([P('Loss leader', 5, 7, 100)], 500);
    expect(z.breakEven.status).toBe('unreachable');
    expect(z.marginOfSafety).toBeNull();
    expect(z.operatingProfit).toBe(-700);
  });
  it('never produces NaN or Infinity, even with huge numbers', () => {
    const z = businessSummary([P('Big', 1e9, 1, 1e9), P('Other', 0, 0, 0)], 1e9);
    for (const v of [z.totalRevenue, z.operatingProfit, z.totalCM, z.overallCMRatio ?? 0]) expect(Number.isFinite(v)).toBe(true);
  });
});
