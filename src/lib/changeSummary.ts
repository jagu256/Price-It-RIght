/**
 * "What changed?" – operating profit before and after a big change (Apply,
 * delete, import, undo…), worked out with the same model as the dashboard.
 * null when either business has invalid numbers (then there is no profit to show).
 */
import { buildModel } from './model';
import type { BusinessData } from './types';

export interface ProfitChange {
  before: number;
  after: number;
}

export function operatingProfitOf(business: BusinessData): number | null {
  return buildModel(business).summary?.operatingProfit ?? null;
}

export function profitChange(before: BusinessData, after: BusinessData): ProfitChange | null {
  const a = operatingProfitOf(before);
  const b = operatingProfitOf(after);
  return a === null || b === null ? null : { before: a, after: b };
}
