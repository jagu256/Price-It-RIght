import { describe, expect, it } from 'vitest';
import { rankProducts } from './productRanking';

const demo = [
  { id: 'c', name: 'Coffee', price: 6, variableCost: 2, units: 300 }, // CM 4.00
  { id: 'm', name: 'Muffin', price: 4, variableCost: 1.5, units: 150 }, // CM 2.50
  { id: 's', name: 'Sandwich', price: 9, variableCost: 4, units: 100 }, // CM 5.00
  { id: 'k', name: 'Cookie', price: 3, variableCost: 1, units: 200 }, // CM 2.00
];

describe('product ranking badges – demo café (average CM $3.30, average volume 187.5 units)', () => {
  it('Coffee star, Muffin review, Sandwich hidden gem, Cookie popular', () => {
    expect(rankProducts(demo)!.map((p) => [p.name, p.rank])).toEqual([
      ['Coffee', 'star'],
      ['Muffin', 'review'],
      ['Sandwich', 'gem'],
      ['Cookie', 'popular'],
    ]);
  });

  it('exactly average counts as high (no rounding: a $3.30 CM product is high margin)', () => {
    const r = rankProducts([...demo, { id: 'x', name: 'X', price: 4.3, variableCost: 1, units: 0 }])!;
    // adding a 0-unit product doesn't change total CM/units, so the average CM is still $3.30
    expect(r[4].highMargin).toBe(true);
    expect(r[4].highVolume).toBe(false);
    const two = rankProducts([{ id: 'a', name: 'A', price: 2, variableCost: 1, units: 10 }, { id: 'b', name: 'B', price: 2, variableCost: 1, units: 10 }])!;
    expect(two.map((p) => p.rank)).toEqual(['star', 'star']);
  });

  it('a product selling below its variable cost is a loss-maker whatever its volume', () => {
    const r = rankProducts([...demo, { id: 'l', name: 'Loss', price: 2, variableCost: 2.5, units: 500 }])!;
    expect(r[4].rank).toBe('loss-maker');
  });

  it('no products or no expected sales → no ranking (no division by zero)', () => {
    expect(rankProducts([])).toBeNull();
    expect(rankProducts(demo.map((p) => ({ ...p, units: 0 })))).toBeNull();
  });
});
