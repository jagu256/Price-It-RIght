import { describe, expect, it } from 'vitest';
import { operatingProfitOf, profitChange } from './changeSummary';
import { initialAppState, reducer } from './store';

describe('what changed: operating profit before and after', () => {
  const start = initialAppState('demo');
  const muffin = start.business.products.find((p) => p.name === 'Muffin')!;

  it('deleting the Muffin (CM $375) takes profit from $975 to $600', () => {
    const after = reducer(start, { type: 'delete-product', id: muffin.id });
    expect(profitChange(start.business, after.business)).toEqual({ before: 975, after: 600 });
  });

  it('applying Coffee at $7 takes profit from $975 to $1,275', () => {
    const coffee = start.business.products.find((p) => p.name === 'Coffee')!;
    const after = reducer(start, { type: 'scenario-apply', resolved: { products: { [coffee.id]: { price: '7' } } } });
    expect(profitChange(start.business, after.business)).toEqual({ before: 975, after: 1275 });
  });

  it('invalid numbers → no profit to compare (null, never 0)', () => {
    const bad = { ...start.business, fixedCosts: 'abc' };
    expect(operatingProfitOf(bad)).toBeNull();
    expect(profitChange(start.business, bad)).toBeNull();
  });
});
