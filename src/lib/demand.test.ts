import { describe, expect, it } from 'vitest';
import { intermediateDemand } from './challenges';
import { buildModel } from './model';
import { contributionFromOthers } from './pricing';
import { sampleBusiness } from './samples';
import { bestPrice, MAX_SEARCH_CENTS, parseUnitsPerDollar, pricesForTarget, profitAtPrice, profitCurve, searchRange, unitsAtPrice, type DemandAssumption, type ProfitContext } from './demand';

/** The intermediate challenge: 300 coffees at $5, 20 fewer per $1 up (400 − 20 × price), cost $2, fixed $1,300. */
const challenge: DemandAssumption = { basePrice: 5, baseUnits: 300, unitsPerDollar: 20 };
const coffee: ProfitContext = { variableCost: 2, otherContribution: 0, fixedCosts: 1300 };

describe('price-sensitive demand – challenge rule 400 − 20 × price', () => {
  it('hand check: a $9 price gives 220 units and a $240 profit', () => {
    expect(unitsAtPrice(challenge, 9)).toBe(220);
    expect(profitAtPrice(challenge, coffee, 9)).toEqual({ price: 9, units: 220, profit: 240 });
  });

  it('agrees with the challenge’s own demand rule at every 5 cents from $3 to $12', () => {
    for (let c = 300; c <= 1200; c += 5) expect(unitsAtPrice(challenge, c / 100)).toBe(intermediateDemand(c / 100));
  });

  it('at the current price nothing changes; lower prices sell more', () => {
    expect(unitsAtPrice(challenge, 5)).toBe(300);
    expect(unitsAtPrice(challenge, 4)).toBe(320);
  });

  it('rounds DOWN to whole units and never goes below 0', () => {
    expect(unitsAtPrice(challenge, 9.01)).toBe(219); // 219.8 → 219
    expect(unitsAtPrice(challenge, 20)).toBe(0);
    expect(unitsAtPrice(challenge, 50)).toBe(0);
  });

  it('checks every cent from $0 to where sales reach zero ($20), and finds $11 → 180 units → $320', () => {
    const best = bestPrice(challenge, coffee);
    expect(best.status).toBe('ok');
    if (best.status !== 'ok') return;
    expect(best.range).toEqual({ from: 0, to: 20, pricesChecked: 2001, capped: false });
    expect(best).toMatchObject({ price: 11, units: 180, profit: 320, tiedPrices: 0 });
  });

  it('the best price really is the best: a brute-force check of every cent agrees', () => {
    let max = -Infinity;
    for (let c = 0; c <= 2000; c++) max = Math.max(max, profitAtPrice(challenge, coffee, c / 100).profit);
    const best = bestPrice(challenge, coffee);
    expect(best.status === 'ok' && best.profit).toBe(max);
  });

  it('finds the range of prices that reach a $200 target', () => {
    const r = pricesForTarget(challenge, coffee, 200);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    // $8.58 sells floor(400 − 171.6) = 228: (8.58 − 2) × 228 − 1,300 = $200.24.
    // $8.57 also sells 228: (8.57 − 2) × 228 − 1,300 = $197.96, just short.
    expect(r.lowest).toEqual({ price: 8.58, units: 228, profit: 200.24 });
    expect(profitAtPrice(challenge, coffee, 8.57).profit).toBe(197.96);
    // Highest: $13.40 sells 132 → $204.80; $13.41 sells 131 → $194.71.
    expect(r.highest).toEqual({ price: 13.4, units: 132, profit: 204.8 });
    expect(profitAtPrice(challenge, coffee, 13.41).profit).toBe(194.71);
  });

  it('because units are whole, a price between the lowest and highest can fall just short', () => {
    // $13.35 sells 133 (OK), $13.36 sells only 132 → $199.52 (short), $13.40 sells 132 (OK).
    expect(profitAtPrice(challenge, coffee, 13.35).profit).toBe(209.55);
    expect(profitAtPrice(challenge, coffee, 13.36).profit).toBe(199.52);
  });

  it('says when no price reaches the target', () => {
    expect(pricesForTarget(challenge, coffee, 500).status).toBe('unreachable');
  });
});

describe('price-sensitive demand – demo café Coffee (others earn $1,275, fixed $1,500)', () => {
  it('uses the other products’ contribution from the business', () => {
    const m = buildModel(sampleBusiness('demo', (p) => `${p}-${Math.random()}`));
    const coffeeId = m.products.find((p) => p.name === 'Coffee')!.id;
    expect(contributionFromOthers(m.products, coffeeId)).toBe(1275);
  });

  it('20 fewer coffees per $1: best price $11.50 → 190 units → $1,580', () => {
    const a = { basePrice: 6, baseUnits: 300, unitsPerDollar: 20 };
    const ctx = { variableCost: 2, otherContribution: 1275, fixedCosts: 1500 };
    expect(profitAtPrice(a, ctx, 6).profit).toBe(975); // unchanged at today’s price
    expect(bestPrice(a, ctx)).toMatchObject({ status: 'ok', price: 11.5, units: 190, profit: 1580 });
  });
});

describe('price-sensitive demand – edge cases', () => {
  it('X = 0 means sales never fall: no best price, explained', () => {
    const flat = { ...challenge, unitsPerDollar: 0 };
    expect(searchRange(flat)).toBeNull();
    const r = bestPrice(flat, coffee);
    expect(r.status).toBe('no-maximum');
    if (r.status === 'no-maximum') expect(r.reason).toMatch(/no best price/);
    expect(profitCurve(flat, coffee)).toEqual([]);
  });

  it('includes other products’ contribution and the chosen fixed costs', () => {
    const ctx = { variableCost: 2, otherContribution: 1275, fixedCosts: 1500 };
    expect(profitAtPrice({ basePrice: 6, baseUnits: 300, unitsPerDollar: 0 }, ctx, 6).profit).toBe(975); // the demo café
  });

  it('caps the search at $20,000 and says so', () => {
    const r = searchRange({ basePrice: 10, baseUnits: 1_000_000, unitsPerDollar: 1 });
    expect(r).toEqual({ from: 0, to: MAX_SEARCH_CENTS / 100, pricesChecked: MAX_SEARCH_CENTS + 1, capped: true });
  });

  it('no sales at today’s price: the rule still predicts sales at lower prices', () => {
    // 0 units at $5; each $1 lower wins 20 customers. (p − 2) × 20 × (5 − p) is largest at $3.50: 30 units.
    const r = bestPrice({ basePrice: 5, baseUnits: 0, unitsPerDollar: 20 }, coffee);
    expect(r).toMatchObject({ status: 'ok', price: 3.5, units: 30, profit: -1255 });
  });

  it('the chart points cover the whole range with no NaN', () => {
    const pts = profitCurve(challenge, coffee, 40);
    expect(pts[0].price).toBe(0);
    expect(pts[pts.length - 1].price).toBe(20);
    expect(JSON.stringify(pts)).not.toMatch(/NaN|Infinity/);
  });

  it('validates X as a whole number, 0 or more – never turned into 0', () => {
    expect(parseUnitsPerDollar('20')).toEqual({ ok: true, value: 20 });
    expect(parseUnitsPerDollar('0')).toEqual({ ok: true, value: 0 });
    expect(parseUnitsPerDollar('')).toMatchObject({ ok: false });
    expect(parseUnitsPerDollar('-5')).toMatchObject({ ok: false, error: expect.stringMatching(/opposite/) });
    expect(parseUnitsPerDollar('2.5')).toMatchObject({ ok: false, error: expect.stringMatching(/whole number/) });
    expect(parseUnitsPerDollar('abc')).toMatchObject({ ok: false });
  });
});
