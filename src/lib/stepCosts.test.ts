import { describe, expect, it } from 'vitest';
import { fixedCostsAt, profitAtUnits, stepCostAnalysis, stepProfitCurve } from './stepCosts';

// Demo café: total CM $2,475 on 750 units → $3.30 per unit; base fixed costs $1,500.
const CM = 2475;
const UNITS = 750;

describe('step fixed costs – hand checks (demo café, $3.30 weighted CM)', () => {
  it('no steps: one range, break-even 1,500 ÷ 3.30 = 454.5 → 455 units, profit $975 (same as the dashboard)', () => {
    const r = stepCostAnalysis(CM, UNITS, 1500, [])!;
    expect(r.ranges).toEqual([{ fromUnits: 0, toUnits: null, fixedCosts: 1500, breakEvenUnits: 455 }]);
    expect(r.expectedProfit).toBe(975);
  });

  it('+$500 above 600 units: break-even 455, then a loss from 601 to 606, break-even again at 2,000 ÷ 3.30 = 606.1 → 607; expected profit $475', () => {
    const r = stepCostAnalysis(CM, UNITS, 1500, [{ aboveUnits: 600, increase: 500 }])!;
    expect(r.ranges).toEqual([
      { fromUnits: 0, toUnits: 600, fixedCosts: 1500, breakEvenUnits: 455 },
      { fromUnits: 601, toUnits: null, fixedCosts: 2000, breakEvenUnits: 607 },
    ]);
    expect(r.expectedFixedCosts).toBe(2000);
    expect(r.expectedProfit).toBe(475);
    expect(profitAtUnits(CM, UNITS, 1500, [{ aboveUnits: 600, increase: 500 }], 601)).toBe(-16.7); // 601 × 3.30 − 2,000
    expect(profitAtUnits(CM, UNITS, 1500, [{ aboveUnits: 600, increase: 500 }], 607)).toBe(3.1);
  });

  it('+$1,000 above 400 units: no break-even in the first range; 2,500 ÷ 3.30 = 757.6 → 758, so the expected 750 units make a $25 loss', () => {
    const r = stepCostAnalysis(CM, UNITS, 1500, [{ aboveUnits: 400, increase: 1000 }])!;
    expect(r.ranges.map((x) => x.breakEvenUnits)).toEqual([null, 758]);
    expect(r.expectedProfit).toBe(-25);
  });

  it('steps are sorted and added up: above 300 (+$200) and above 100 (+$100) → ranges 0–100, 101–300, 301+', () => {
    const steps = [{ aboveUnits: 300, increase: 200 }, { aboveUnits: 100, increase: 100 }];
    const r = stepCostAnalysis(CM, UNITS, 1500, steps)!;
    expect(r.ranges.map((x) => [x.fromUnits, x.toUnits, x.fixedCosts])).toEqual([[0, 100, 1500], [101, 300, 1600], [301, null, 1800]]);
    expect(r.ranges.map((x) => x.breakEvenUnits)).toEqual([null, null, 546]); // 1,800 ÷ 3.30 = 545.45 → 546
    expect([fixedCostsAt(1500, steps, 100), fixedCostsAt(1500, steps, 101), fixedCostsAt(1500, steps, 301)]).toEqual([1500, 1600, 1800]);
  });

  it('a break-even that would fall below a range starts at that range’s first unit', () => {
    // Tiny step: +$1 above 500 units. Range 501+: ceil(1,501 ÷ 3.30) = 455 < 501 → already profitable at 501.
    const r = stepCostAnalysis(CM, UNITS, 1500, [{ aboveUnits: 500, increase: 1 }])!;
    expect(r.ranges[1].breakEvenUnits).toBe(501);
  });

  it('no sales mix or no contribution → null (no division by zero)', () => {
    expect(stepCostAnalysis(CM, 0, 1500, [])).toBeNull();
    expect(stepCostAnalysis(0, UNITS, 1500, [])).toBeNull();
    expect(stepCostAnalysis(-10, UNITS, 1500, [])).toBeNull();
  });

  it('$0 fixed costs break even at 0 units', () => {
    expect(stepCostAnalysis(CM, UNITS, 0, [])!.ranges[0].breakEvenUnits).toBe(0);
  });

  it('the chart includes both sides of each step, so the drop is visible', () => {
    const pts = stepProfitCurve(CM, UNITS, 1500, [{ aboveUnits: 600, increase: 500 }], 1000);
    const at = (u: number) => pts.find((p) => p.units === u)!.profit;
    expect(at(600)).toBe(480); // 600 × 3.30 − 1,500
    expect(at(601)).toBe(-16.7);
    expect(pts[0]).toEqual({ units: 0, profit: -1500 });
  });
});
