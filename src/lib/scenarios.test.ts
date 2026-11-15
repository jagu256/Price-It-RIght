import { describe, expect, it } from 'vitest';
import { buildModel } from './model';
import { compareScenarios, type SavedScenario } from './pricing';
import { sampleBusiness } from './samples';
import { copyScenario, initialAppState, reducer } from './store';

let n = 0;
const demo = () => buildModel(sampleBusiness('demo', (p) => `${p}${++n}`));

describe('saved scenarios compared side by side (demo café, profit $975)', () => {
  const m = demo();
  const id = (name: string) => m.products.find((p) => p.name === name)!.id;
  const saved: SavedScenario[] = [
    { id: 'a', name: 'Coffee $7', overrides: { products: { [id('Coffee')]: { price: '7' } } } }, // +$1 × 300 = +$300 → $1,275
    { id: 'b', name: 'Cheaper rent', overrides: { fixedCosts: '1300', products: {} } }, // +$200 → $1,175
    { id: 'c', name: 'More muffins', overrides: { products: { [id('Muffin')]: { units: '200' } } } }, // +50 × $2.50 = +$125 → $1,100
  ];
  const rows = compareScenarios(m.products, m.fixedCosts!, saved);

  it('works out each scenario’s profit and its change from the current plan', () => {
    expect(rows.map((r) => [r.name, r.summary!.operatingProfit, r.profitChange])).toEqual([
      ['Coffee $7', 1275, 300],
      ['Cheaper rent', 1175, 200],
      ['More muffins', 1100, 125],
    ]);
  });

  it('marks the highest operating profit among the saved scenarios (ties all marked)', () => {
    expect(rows.map((r) => r.highest)).toEqual([true, false, false]);
    const tie = compareScenarios(m.products, m.fixedCosts!, [saved[0], { ...saved[0], id: 'd', name: 'Copy' }]);
    expect(tie.map((r) => r.highest)).toEqual([true, true]);
  });

  it('a scenario with an invalid value shows no figures (never treated as 0) and is not marked highest', () => {
    const bad = compareScenarios(m.products, m.fixedCosts!, [{ id: 'x', name: 'Typo', overrides: { products: { [id('Coffee')]: { price: 'abc' } } } }, saved[2]]);
    expect(bad[0].summary).toBeNull();
    expect(bad[0].profitChange).toBeNull();
    expect(bad.map((r) => r.highest)).toEqual([false, true]);
  });

  it('no saved scenarios → empty list', () => {
    expect(compareScenarios(m.products, m.fixedCosts!, [])).toEqual([]);
  });
});

describe('loading a saved scenario', () => {
  it('replaces the What-If changes with a copy, so editing afterwards never changes the saved scenario', () => {
    const saved = { products: { p1: { price: '7' } }, fixedCosts: '1300' };
    const copy = copyScenario(saved);
    expect(copy).toEqual(saved);
    copy.products.p1.price = '8';
    expect(saved.products.p1.price).toBe('7');

    const s0 = initialAppState('demo');
    const s1 = reducer(s0, { type: 'scenario-load', overrides: saved });
    expect(s1.scenario).toEqual(saved);
    expect(s1.scenario).not.toBe(saved);
    expect(s1.business).toBe(s0.business); // the business itself is not changed
  });
});
