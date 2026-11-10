import { describe, expect, it } from 'vitest';
import { makeOrBuy, specialOrder, specialOrderInventory } from './decisions';
import { buildModel } from './model';
import { makeOrBuyMath, specialOrderMath } from './showMath';
import { sampleBusiness } from './samples';

let n = 0;
const model = (type: 'coffee' | 'demo') => buildModel(sampleBusiness(type, (p) => `${p}${++n}`));
const coffee = { id: 'c', name: 'Coffee', category: '', price: 6, variableCost: 2, units: 300, costMode: 'manual' as const, materialCost: null, otherVariableCost: 0 };

describe('special order – incremental profit', () => {
  it('worked by hand: 100 units at $4, $50 extra costs, 20 regular sales lost → +$70, accept', () => {
    // (4 − 2) × 100 − 50 − (6 − 2) × 20 = 200 − 50 − 80 = 70
    const r = specialOrder(coffee, { orderUnits: 100, offeredPrice: 4, extraCosts: 50, lostRegularUnits: 20 });
    expect(r).toEqual({ orderCMPerUnit: 2, orderCM: 200, extraCosts: 50, regularCMPerUnit: 4, lostCM: 80, incrementalProfit: 70, decision: 'accept' });
  });

  it('a low offer loses money → reject; break-even → indifferent', () => {
    expect(specialOrder(coffee, { orderUnits: 100, offeredPrice: 2.5, extraCosts: 50, lostRegularUnits: 20 })).toMatchObject({ incrementalProfit: -80, decision: 'reject' });
    expect(specialOrder(coffee, { orderUnits: 100, offeredPrice: 3.3, extraCosts: 50, lostRegularUnits: 20 })).toMatchObject({ incrementalProfit: 0, decision: 'indifferent' });
  });

  it('a price below the full average cost can still add profit when there is spare capacity', () => {
    // Offered $3 is far below the $6 regular price, but above the $2 variable cost.
    expect(specialOrder(coffee, { orderUnits: 50, offeredPrice: 3, extraCosts: 0, lostRegularUnits: 0 })).toMatchObject({ incrementalProfit: 50, decision: 'accept' });
  });

  it('a price below variable cost always loses money', () => {
    expect(specialOrder(coffee, { orderUnits: 10, offeredPrice: 1.5, extraCosts: 0, lostRegularUnits: 0 })).toMatchObject({ orderCMPerUnit: -0.5, incrementalProfit: -5, decision: 'reject' });
  });

  it('works in whole cents', () => {
    expect(specialOrder({ ...coffee, variableCost: 0.1 }, { orderUnits: 3, offeredPrice: 0.3, extraCosts: 0, lostRegularUnits: 0 }).incrementalProfit).toBe(0.6);
  });

  it('explains the result with the same numbers', () => {
    const input = { orderUnits: 100, offeredPrice: 4, extraCosts: 50, lostRegularUnits: 20 };
    const [x] = specialOrderMath(coffee, input, specialOrder(coffee, input));
    expect(x.steps).toEqual(['Order contribution: ($4 − $2) × 100 = $200', 'Lost contribution: ($6 − $2) × 20 = $80']);
    expect(x.withNumbers).toBe('$200 − $50 − $80 = $70');
  });
});

describe('special order – shared inventory check', () => {
  it('Coffee Shop sample: a small muffin order fits (flour and sugar only)', () => {
    const m = model('coffee');
    const muffin = m.products.find((p) => p.name === 'Muffin')!;
    // Regular: 150 muffins use 15 kg flour and 4.5 kg sugar of 20 kg / 5 kg. +10 → 16 kg and 4.8 kg.
    const r = specialOrderInventory(m, muffin.id, 10, 0);
    expect(r.status).toBe('feasible');
    if (r.status !== 'feasible') return;
    expect(r.shortages).toEqual([]);
    // Beans and milk are already short for regular coffee and latte sales – reported separately, not caused by this order.
    expect(r.otherShortages.map((s) => [s.name, s.alreadyShort])).toEqual([
      ['Coffee beans', true],
      ['Milk', true],
    ]);
  });

  it('a larger muffin order runs out of sugar → not achievable, with the shortage', () => {
    const m = model('coffee');
    const muffin = m.products.find((p) => p.name === 'Muffin')!;
    // 150 + 20 = 170 muffins × 30 g = 5,100 g sugar; only 5,000 g → 100 g short.
    const r = specialOrderInventory(m, muffin.id, 20, 0);
    expect(r.status).toBe('infeasible');
    if (r.status !== 'infeasible') return;
    expect(r.shortages).toEqual([{ name: 'Sugar', dimension: 'mass', shortageBase: 100_000, alreadyShort: false }]);
  });

  it('displaced regular sales free up inventory', () => {
    const m = model('coffee');
    const muffin = m.products.find((p) => p.name === 'Muffin')!;
    // Losing 10 regular muffins makes room: 140 + 20 = 160 × 30 g = 4,800 g.
    expect(specialOrderInventory(m, muffin.id, 20, 10).status).toBe('feasible');
  });

  it('demo café: any coffee order is not achievable because milk is already short for regular sales', () => {
    const m = model('demo');
    const c = m.products.find((p) => p.name === 'Coffee')!;
    const r = specialOrderInventory(m, c.id, 1, 0);
    expect(r.status).toBe('infeasible');
    if (r.status !== 'infeasible') return;
    expect(r.shortages.find((s) => s.name === 'Milk')).toMatchObject({ alreadyShort: true });
  });

  it('a product without a recipe, or no inventory, is not checked (never shown as fine)', () => {
    const m = model('coffee');
    const sandwich = m.products.find((p) => p.name === 'Sandwich')!; // no recipe in the sample
    expect(specialOrderInventory(m, sandwich.id, 5, 0)).toEqual({ status: 'no-recipe' });
    const empty = buildModel({ ...m.data, inventory: [] });
    expect(specialOrderInventory(empty, sandwich.id, 5, 0).status).toBe('not-checked');
  });
});

describe('make or buy – relevant costs only', () => {
  const input = { units: 1000, purchasePrice: 5, variableCostPerUnit: 3.5, avoidableFixedCosts: 1000, unavoidableFixedCosts: 2000, opportunityCost: 300 };

  it('worked by hand: make $3,500 + $1,000 + $300 = $4,800 vs buy $5,000 → make, saves $200', () => {
    expect(makeOrBuy(input)).toEqual({
      makeVariableCost: 3500,
      relevantCostToMake: 4800,
      costToBuy: 5000,
      savingFromMaking: 200,
      decision: 'make',
      unavoidableFixedCosts: 2000,
    });
  });

  it('unavoidable fixed costs never change the answer (including them would wrongly say “buy”)', () => {
    const a = makeOrBuy(input);
    const b = makeOrBuy({ ...input, unavoidableFixedCosts: 999_999 });
    expect(b.relevantCostToMake).toBe(a.relevantCostToMake);
    expect(b.decision).toBe('make');
  });

  it('a big enough opportunity cost flips the decision to buy; equal costs → indifferent', () => {
    expect(makeOrBuy({ ...input, opportunityCost: 600 })).toMatchObject({ relevantCostToMake: 5100, savingFromMaking: -100, decision: 'buy' });
    expect(makeOrBuy({ ...input, opportunityCost: 500 })).toMatchObject({ savingFromMaking: 0, decision: 'indifferent' });
  });

  it('explains each step', () => {
    const [make, buy, diff] = makeOrBuyMath(input, makeOrBuy(input));
    expect(make.withNumbers).toBe('$3.50 × 1,000 + $1,000 + $300 = $4,800');
    expect(make.note).toMatch(/Unavoidable fixed costs \(\$2,000\)/);
    expect(buy.withNumbers).toBe('$5 × 1,000 = $5,000');
    expect(diff.withNumbers).toBe('$5,000 − $4,800 = +$200');
  });
});
