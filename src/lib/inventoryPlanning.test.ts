import { describe, expect, it } from 'vitest';
import { formatQuantity } from './inventory';
import { buildModel } from './model';
import { checkPlan, contributionPerResource, planFinancials, proportionalPlan, singleProductCapacity, suggestedPlan } from './planning';
import { initialAppState, reducer } from './store';
import { changeUnit, parseCost, parseUnitText, validateStock } from './stock';
import { EMPTY_OTHER_COSTS, type BusinessData, type InventoryRecord, type ProductInput } from './types';

/* Helpers to build small businesses by hand ------------------------- */
let n = 0;
const id = (p: string) => `${p}${++n}`;
function product(name: string, price: string, variableCost: string, units: string, extra: Partial<ProductInput> = {}): ProductInput {
  return { id: id('p'), name, category: '', price, variableCost, units, costMode: 'manual', otherCosts: { ...EMPTY_OTHER_COSTS }, ...extra };
}
function item(name: string, quantity: string, unit: InventoryRecord['unit'], cost = ''): InventoryRecord {
  return { id: id('i'), name, quantity, unit, cost };
}
function business(products: ProductInput[], inventory: InventoryRecord[], recipes: Record<string, [InventoryRecord, string, InventoryRecord['unit']][]>, fixedCosts = '1500'): BusinessData {
  return {
    type: 'coffee',
    name: 'Test',
    isDemo: false,
    fixedCosts,
    products,
    inventory,
    recipes: Object.fromEntries(
      Object.entries(recipes).map(([pid, lines]) => [pid, lines.map(([it, q, u]) => ({ id: id('r'), itemId: it.id, quantity: q, unit: u }))]),
    ),
  };
}

/* Required inventory verification example --------------------------- */
describe('required inventory example: 2,000 g beans, 5,000 mL milk, 100 cups', () => {
  const coffee = product('Coffee', '6', '2', '300');
  const beans = item('Coffee beans', '2000', 'g');
  const milk = item('Milk', '5000', 'mL');
  const cups = item('Cups', '100', 'pcs');
  const m = buildModel(business([coffee], [beans, milk, cups], { [coffee.id]: [[beans, '20', 'g'], [milk, '200', 'mL'], [cups, '1', 'pcs']] }));

  it('can make a maximum of 25 coffees, limited by milk', () => {
    const cap = singleProductCapacity(m.recipes[coffee.id], m.stock)!;
    expect(cap.items.map((i) => i.maxProducts)).toEqual([100, 25, 100]);
    expect(cap.maxProduction).toBe(25);
    expect(cap.limiting.map((i) => i.name)).toEqual(['Milk']);
  });

  it('shows the milk shortage for 100 planned coffees: 15 litres', () => {
    const check = checkPlan({ [coffee.id]: 100 }, m.products, m.recipes, m.stock);
    const milkReq = check.items.find((i) => i.name === 'Milk')!;
    expect(formatQuantity(milkReq.requiredBase, 'volume')).toBe('20 litres');
    expect(formatQuantity(milkReq.shortageBase, 'volume')).toBe('15 litres');
    expect(check.feasibility).toBe('infeasible');
  });
});

/* Independent multi-product verification with SHARED inventory ------ */
describe('shared inventory: coffee and latte both use milk (worked by hand)', () => {
  // Inventory: 10,000 mL milk, 5,000 g beans, 200 cups.
  // Coffee: 200 mL milk, 20 g beans, 1 cup. Latte: 300 mL milk, 20 g beans, 1 cup.
  const coffee = product('Coffee', '6', '2', '30');
  const latte = product('Latte', '8', '3', '20');
  const milk = item('Milk', '10000', 'mL', '0.002');
  const beans = item('Coffee beans', '5000', 'g', '0.03');
  const cups = item('Cups', '200', 'pcs', '0.15');
  const data = business([coffee, latte], [milk, beans, cups], {
    [coffee.id]: [[beans, '20', 'g'], [milk, '200', 'mL'], [cups, '1', 'pcs']],
    [latte.id]: [[beans, '20', 'g'], [milk, '300', 'mL'], [cups, '1', 'pcs']],
  }, '100');
  const m = buildModel(data);

  it('does not add separate capacities together', () => {
    // Alone: coffee 10,000 ÷ 200 = 50; latte 10,000 ÷ 300 = 33. 50 + 33 = 83 drinks is NOT possible together.
    expect(singleProductCapacity(m.recipes[coffee.id], m.stock)!.maxProduction).toBe(50);
    expect(singleProductCapacity(m.recipes[latte.id], m.stock)!.maxProduction).toBe(33);
    const both = checkPlan({ [coffee.id]: 50, [latte.id]: 33 }, m.products, m.recipes, m.stock);
    expect(both.feasibility).toBe('infeasible'); // needs 10,000 + 9,900 = 19,900 mL
  });

  it('sums combined requirements: 30 coffees + 20 lattes need 12,000 mL milk (2,000 mL short)', () => {
    const check = checkPlan({ [coffee.id]: 30, [latte.id]: 20 }, m.products, m.recipes, m.stock);
    const milkReq = check.items.find((i) => i.name === 'Milk')!;
    expect(milkReq.requiredBase / 1000).toBe(12000);
    expect(milkReq.remainingBase / 1000).toBe(-2000);
    expect(milkReq.shortageBase / 1000).toBe(2000);
    expect(milkReq.status).toBe('shortage');
    expect(check.items.find((i) => i.name === 'Coffee beans')!.requiredBase / 1000).toBe(1000); // 50 × 20 g
    expect(check.items.find((i) => i.name === 'Cups')!.status).toBe('sufficient'); // 50 of 200
  });

  it('a feasible plan: 20 coffees + 10 lattes use 7,000 mL', () => {
    const check = checkPlan({ [coffee.id]: 20, [latte.id]: 10 }, m.products, m.recipes, m.stock);
    expect(check.feasibility).toBe('feasible');
    expect(check.items.find((i) => i.name === 'Milk')!.remainingBase / 1000).toBe(3000);
  });

  it('flags low stock at 80 % or more of an item', () => {
    // 25 coffees + 10 lattes = 5,000 + 3,000 = 8,000 mL = 80 %
    const check = checkPlan({ [coffee.id]: 25, [latte.id]: 10 }, m.products, m.recipes, m.stock);
    expect(check.items.find((i) => i.name === 'Milk')!.status).toBe('low');
  });

  it('extra hypothetical inventory changes the result', () => {
    const extra = { [milk.id]: 2000 * 1000 };
    const check = checkPlan({ [coffee.id]: 30, [latte.id]: 20 }, m.products, m.recipes, m.stock, extra);
    expect(check.feasibility).toBe('feasible');
  });

  it('ranks contribution per litre of milk: coffee $20.00, latte $16.67', () => {
    const r = contributionPerResource(milk.id, m.products, m.recipes, m.stock)!;
    expect(r.ranking.map((x) => x.name)).toEqual(['Coffee', 'Latte']);
    expect(r.ranking[0].cmPerResourceUnit).toBeCloseTo(20, 10); // $4 ÷ 0.2 L
    expect(r.ranking[1].cmPerResourceUnit).toBeCloseTo(16.6667, 3); // $5 ÷ 0.3 L
  });

  it('calculates direct material cost: coffee $1.15, latte $1.35', () => {
    expect(m.materials[coffee.id].total).toBeCloseTo(1.15, 10); // 20 g × $0.03 + 200 mL × $0.002 + 1 × $0.15
    expect(m.materials[latte.id].total).toBeCloseTo(1.35, 10);
  });

  it('proportional inventory-constrained plan keeps the mix and fits', () => {
    // Demand needs 12,000 mL; only 10,000 → scale 10/12 → coffee 25, latte 16
    const { plan, scale } = proportionalPlan(m.products, m.recipes, m.stock);
    expect(scale).toBeCloseTo(10000 / 12000, 10);
    expect(plan).toEqual({ [coffee.id]: 25, [latte.id]: 16 });
    expect(checkPlan(plan, m.products, m.recipes, m.stock).feasibility).toBe('feasible');
  });

  it('suggested plan favours the higher CM per litre and respects every item and demand', () => {
    const plan = suggestedPlan(m.products, m.recipes, m.stock, milk.id);
    // Coffee first: 30 (demand) → 6,000 mL; latte gets the remaining 4,000 mL → 13.
    expect(plan).toEqual({ [coffee.id]: 30, [latte.id]: 13 });
    expect(checkPlan(plan, m.products, m.recipes, m.stock).feasibility).toBe('feasible');
  });

  it('plan profit: unsold production is not revenue', () => {
    const f = planFinancials({ [coffee.id]: 40, [latte.id]: 0 }, m.products, 100);
    expect(f.sold[coffee.id]).toBe(30); // demand is 30
    expect(f.unsold).toEqual([{ productId: coffee.id, name: 'Coffee', units: 10 }]);
    expect(f.summary.totalRevenue).toBe(180);
    expect(f.summary.operatingProfit).toBe(30 * 4 - 100);
  });
});

describe('demand limits, zero inventory and multiple limiting resources', () => {
  const a = product('A', '10', '4', '50');
  const b = product('B', '10', '5', '50');
  const x = item('X', '0', 'g');
  const y = item('Y', '1', 'kg');
  const m = buildModel(business([a, b], [x, y], { [a.id]: [[x, '10', 'g'], [y, '10', 'g']], [b.id]: [[y, '10', 'g']] }));

  it('zero available inventory means zero capacity for products that need it', () => {
    expect(singleProductCapacity(m.recipes[a.id], m.stock)!.maxProduction).toBe(0);
    expect(singleProductCapacity(m.recipes[b.id], m.stock)!.maxProduction).toBe(100);
  });

  it('reports two tied limiting resources', () => {
    const c = product('C', '1', '0', '1');
    const p = item('P', '100', 'g');
    const q = item('Q', '200', 'g');
    const mm = buildModel(business([c], [p, q], { [c.id]: [[p, '10', 'g'], [q, '20', 'g']] }));
    const cap = singleProductCapacity(mm.recipes[c.id], mm.stock)!;
    expect(cap.limiting.map((i) => i.name)).toEqual(['P', 'Q']);
  });

  it('suggested plan never exceeds demand', () => {
    const plan = suggestedPlan(m.products, m.recipes, m.stock, y.id);
    expect(plan[b.id]).toBeLessThanOrEqual(50);
    expect(plan[a.id]).toBe(0); // X has none
  });
});

describe('recipes', () => {
  const coffee = product('Coffee', '6', '2', '10');
  const sandwich = product('Sandwich', '9', '4', '10');
  const milk = item('Milk', '5', 'L');
  it('never invents recipes: a product without one has unknown requirements', () => {
    const m = buildModel(business([coffee, sandwich], [milk], { [coffee.id]: [[milk, '200', 'mL']] }));
    expect(m.recipes[sandwich.id].status).toBe('missing');
    const check = checkPlan({ [coffee.id]: 10, [sandwich.id]: 10 }, m.products, m.recipes, m.stock);
    expect(check.feasibility).toBe('unverified');
    expect(check.unknownProducts).toEqual(['Sandwich']);
  });
  it('converts compatible units (5 L ÷ 200 mL = 25)', () => {
    const m = buildModel(business([coffee], [milk], { [coffee.id]: [[milk, '200', 'mL']] }));
    expect(singleProductCapacity(m.recipes[coffee.id], m.stock)!.maxProduction).toBe(25);
  });
  it('rejects incompatible units and zero quantities', () => {
    const m = buildModel(business([coffee], [milk], { [coffee.id]: [[milk, '200', 'g']] }));
    expect(m.recipes[coffee.id].status).toBe('invalid');
    expect(Object.values(m.recipes[coffee.id].errors)[0]).toMatch(/measured in litres/);
    const z = buildModel(business([coffee], [milk], { [coffee.id]: [[milk, '0', 'mL']] }));
    expect(Object.values(z.recipes[coffee.id].errors)[0]).toMatch(/more than 0/);
  });
  it('flags a line whose inventory item was deleted', () => {
    const data = business([coffee], [milk], { [coffee.id]: [[milk, '200', 'mL']] });
    const m = buildModel({ ...data, inventory: [] });
    expect(Object.values(m.recipes[coffee.id].errors)[0]).toMatch(/no longer exists/);
  });
});

describe('product costing – no double counting', () => {
  const milk = item('Milk', '5', 'L', '2'); // $2 per L = $0.002 per mL
  const cups = item('Cups', '100', 'pcs', '');
  it('manual mode uses the entered total and ignores recipe materials', () => {
    const p = product('Coffee', '6', '2', '10');
    const m = buildModel(business([p], [milk], { [p.id]: [[milk, '200', 'mL']] }));
    expect(m.products[0].variableCost).toBe(2);
    expect(m.materials[p.id].total).toBeCloseTo(0.4, 10);
  });
  it('itemized mode = direct materials + other variable costs', () => {
    const p = product('Coffee', '6', '999', '10', { costMode: 'itemized', otherCosts: { labour: '0.50', packaging: '0.10', paymentFees: '0.15', other: '' } });
    const m = buildModel(business([p], [milk], { [p.id]: [[milk, '200', 'mL']] }));
    expect(m.products[0].variableCost).toBe(1.15); // 0.40 + 0.50 + 0.10 + 0.15 – the manual $999 is not added
  });
  it('missing purchase costs are never treated as $0', () => {
    const p = product('Coffee', '6', '2', '10', { costMode: 'itemized' });
    const m = buildModel(business([p], [milk, cups], { [p.id]: [[milk, '200', 'mL'], [cups, '1', 'pcs']] }));
    expect(m.materials[p.id].total).toBeNull();
    expect(m.productErrors[p.id].variableCost).toMatch(/Missing purchase cost for Cups/);
    expect(m.financialsReady).toBe(false);
  });
  it('an explicit cost of $0 is accepted', () => {
    const free = item('Napkins', '100', 'pcs', '0');
    const p = product('Coffee', '6', '2', '10', { costMode: 'itemized' });
    const m = buildModel(business([p], [free], { [p.id]: [[free, '1', 'pcs']] }));
    expect(m.products[0].variableCost).toBe(0);
  });
});

describe('inventory records', () => {
  it('detects missing names, invalid and negative quantities, and duplicates (not merged)', () => {
    const v = validateStock([item('', '5', 'g'), item('Milk', '-1', 'mL'), item('Sugar', 'abc', 'g'), item('Flour', '1', 'kg'), item(' flour ', '2', 'kg')]);
    const msgs = Object.values(v.errors).flatMap((e) => Object.values(e));
    expect(msgs.some((m) => /item name/.test(m!))).toBe(true);
    expect(msgs.some((m) => /negative/.test(m!))).toBe(true);
    expect(msgs.some((m) => /numbers only/.test(m!))).toBe(true);
    expect(msgs.filter((m) => /Duplicates are not merged/.test(m!))).toHaveLength(2);
    expect(v.items).toHaveLength(0);
  });
  it('converts compatible units when the unit changes, and leaves incompatible ones alone', () => {
    const r = item('Beans', '2000', 'g', '0.03');
    expect(changeUnit(r, 'kg').record).toMatchObject({ quantity: '2', unit: 'kg', cost: '30' });
    expect(changeUnit({ ...r, quantity: '5', unit: 'L', cost: '2' }, 'mL').record).toMatchObject({ quantity: '5000', cost: '0.002' });
    const bad = changeUnit(r, 'pcs');
    expect(bad.converted).toBe(false);
    expect(bad.record.quantity).toBe('2000');
  });
  it('reads common unit spellings and costs', () => {
    expect(parseUnitText('Grams')).toBe('g');
    expect(parseUnitText('litres')).toBe('L');
    expect(parseUnitText('pieces')).toBe('pcs');
    expect(parseUnitText('oz')).toBeNull();
    expect(parseCost('')).toEqual({ ok: true, value: null });
    expect(parseCost('0.002')).toEqual({ ok: true, value: 0.002 });
    expect(parseCost('-1').ok).toBe(false);
  });
});

describe('samples and store', () => {
  it('the demo business reproduces the verification example', () => {
    const s = initialAppState('demo');
    const m = buildModel(s.business);
    expect(m.summary).toMatchObject({ totalRevenue: 3900, totalVariableCosts: 1425, totalCM: 2475, operatingProfit: 975 });
    expect(Object.values(m.recipes).every((r) => r.status === 'complete')).toBe(true);
  });
  it('every sample business is valid', () => {
    for (const b of ['coffee', 'bakery', 'nails', 'clothing', 'custom', 'demo'] as const) {
      const m = buildModel(initialAppState(b).business);
      expect(m.financialsReady, b).toBe(true);
      expect(Object.keys(m.stockErrors), b).toHaveLength(0);
      expect(Object.values(m.recipes).every((r) => r.status !== 'invalid'), b).toBe(true);
    }
  });
  it('adds, duplicates and deletes products with unique ids', () => {
    let s = initialAppState('coffee');
    s = reducer(s, { type: 'add-product' });
    const added = s.business.products[s.business.products.length - 1];
    s = reducer(s, { type: 'duplicate-product', id: s.business.products[0].id });
    const ids = s.business.products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(s.business.products[1].name).toBe('Coffee (copy)');
    expect(s.business.recipes[s.business.products[1].id]).toHaveLength(3); // recipe copied too
    s = reducer(s, { type: 'delete-product', id: added.id });
    expect(s.business.products.find((p) => p.id === added.id)).toBeUndefined();
  });
  it('scenario changes do not touch the business until applied', () => {
    let s = initialAppState('coffee');
    const coffee = s.business.products[0];
    s = reducer(s, { type: 'scenario-set', productId: coffee.id, field: 'price', value: '7' });
    expect(s.business.products[0].price).toBe('6');
    s = reducer(s, { type: 'scenario-reset' });
    expect(s.scenario.products).toEqual({});
    s = reducer(s, { type: 'scenario-apply', resolved: { products: { [coffee.id]: { price: '7' } } } });
    expect(s.business.products[0].price).toBe('7');
  });
});
