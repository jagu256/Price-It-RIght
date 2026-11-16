import { describe, expect, it } from 'vitest';
import type { ParsedProduct } from './model';
import { volumeForPrice } from './pricing';

const coffee = { price: 6, variableCost: 2, units: 300 } as ParsedProduct; // CM $4 × 300 = $1,200

describe('price change: units needed for the same profit (demo Coffee, CM $1,200)', () => {
  it('cut to $5 → CM $3 → 1,200 ÷ 3 = 400 units: sell 100 more (+33.3 %)', () => {
    const r = volumeForPrice(coffee, 5);
    expect(r).toMatchObject({ status: 'ok', currentContribution: 1200, oldCMPerUnit: 4, newCMPerUnit: 3, requiredUnits: 400, unitChange: 100, roundingExtra: 0 });
    expect(r.status === 'ok' && r.percentChange).toBeCloseTo(33.333, 3);
  });

  it('raise to $7 → CM $5 → 240 units: you could sell 60 fewer (−20 %) and keep the same profit', () => {
    expect(volumeForPrice(coffee, 7)).toMatchObject({ requiredUnits: 240, unitChange: -60, percentChange: -20 });
  });

  it('$5.50 → 1,200 ÷ 3.50 = 342.86 → 343 units (rounded UP; earns $0.50 more than now)', () => {
    expect(volumeForPrice(coffee, 5.5)).toMatchObject({ requiredUnits: 343, unitChange: 43, roundingExtra: 0.5 });
  });

  it('no change in price → no change in units', () => {
    expect(volumeForPrice(coffee, 6)).toMatchObject({ requiredUnits: 300, unitChange: 0 });
  });

  it('a price at or below variable cost can never make up the contribution → not possible (no division by zero)', () => {
    expect(volumeForPrice(coffee, 2)).toEqual({ status: 'not-possible', newCMPerUnit: 0 });
    expect(volumeForPrice(coffee, 1.5)).toEqual({ status: 'not-possible', newCMPerUnit: -0.5 });
  });

  it('a product that earns no contribution now needs 0 units to stay as profitable; 0 current units → % is N/A', () => {
    expect(volumeForPrice({ price: 2, variableCost: 2, units: 50 } as ParsedProduct, 3)).toMatchObject({ requiredUnits: 0, unitChange: -50 });
    expect(volumeForPrice({ price: 6, variableCost: 2, units: 0 } as ParsedProduct, 5)).toMatchObject({ requiredUnits: 0, percentChange: null });
  });
});
