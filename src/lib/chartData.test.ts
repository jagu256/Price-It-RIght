import { describe, expect, it } from 'vitest';
import { calculate } from './accounting';
import { chartMaxUnits, costVolumeSeries, niceCeil, profitSeries } from './chartData';

const coffee = { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 };

describe('chart data', () => {
  it('rounds chart limits to nice numbers', () => {
    expect(niceCeil(450)).toBe(500);
    expect(niceCeil(10)).toBe(10);
    expect(niceCeil(1200)).toBe(2000);
  });

  it('covers both expected sales and break-even on the horizontal axis', () => {
    const max = chartMaxUnits(calculate(coffee));
    expect(max).toBeGreaterThanOrEqual(300);
    expect(max).toBeGreaterThanOrEqual(200);
  });

  it('uses the same formulas as the dashboard', () => {
    const series = costVolumeSeries(coffee, 500);
    const at200 = series.find((p) => p.units === 200)!;
    expect(at200.revenue).toBe(1200);
    expect(at200.totalCosts).toBe(1200); // break-even: lines cross here
    const profits = profitSeries(coffee, 500);
    const plan = profits.find((p) => p.isPlan)!;
    expect(plan.units).toBe(300);
    expect(plan.profit).toBe(calculate(coffee).operatingProfit);
  });

  it('includes the expected volume even when it is not on the regular steps', () => {
    const series = profitSeries({ ...coffee, units: 333 }, 500);
    expect(series.some((p) => p.units === 333 && p.isPlan)).toBe(true);
  });
});
