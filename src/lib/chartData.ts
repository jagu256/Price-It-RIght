/**
 * Data for the two charts. Every point is produced by the same `calculate`
 * function used by the dashboard, so the charts can never disagree with it.
 */
import { calculate, type PricingInputs, type PricingResults } from './accounting';

/** Rounds up to a "nice" chart limit: 10, 20, 50, 100, 200, 500 … */
export function niceCeil(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const f = value / magnitude;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * magnitude;
}

/** Highest sales volume shown on the charts' horizontal axis. */
export function chartMaxUnits(results: PricingResults): number {
  const candidates = [10, results.inputs.units * 1.5];
  if (results.breakEven.status === 'reachable') candidates.push(results.breakEven.unitsRounded * 1.5);
  return Math.max(10, niceCeil(Math.max(...candidates)));
}

export interface CostVolumePoint {
  units: number;
  revenue: number;
  totalCosts: number;
}

export function costVolumeSeries(inputs: PricingInputs, maxUnits: number, steps = 10): CostVolumePoint[] {
  const step = maxUnits / steps;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const units = Math.round(i * step);
    const r = calculate({ ...inputs, units });
    return { units, revenue: r.revenue, totalCosts: r.totalCosts };
  });
}

export interface ProfitPoint {
  units: number;
  profit: number;
  /** True for the bar that matches the user's expected sales volume. */
  isPlan: boolean;
}

export function profitSeries(inputs: PricingInputs, maxUnits: number, steps = 10): ProfitPoint[] {
  const step = maxUnits / steps;
  const volumes = new Set<number>();
  for (let i = 0; i <= steps; i++) volumes.add(Math.round(i * step));
  volumes.add(inputs.units);
  return [...volumes]
    .sort((a, b) => a - b)
    .map((units) => ({
      units,
      profit: calculate({ ...inputs, units }).operatingProfit,
      isPlan: units === inputs.units,
    }));
}

/** Slider range helpers (the slider never "runs away" while dragging). */
export function sliderMax(...values: number[]): number {
  return niceCeil(Math.max(10, ...values.filter((v) => Number.isFinite(v))));
}

export function sliderStep(max: number): number {
  if (max <= 20) return 0.05;
  if (max <= 100) return 0.25;
  if (max <= 500) return 1;
  return niceCeil(max / 500);
}
