import { describe, expect, it } from 'vitest';
import { buildModel } from './model';
import { sampleBusiness } from './samples';
import { setupChecklist } from './setupChecklist';
import type { BusinessData } from './types';

let n = 0;
const sample = (id: Parameters<typeof sampleBusiness>[0]) => sampleBusiness(id, (p) => `${p}${++n}`);
const status = (d: BusinessData) => Object.fromEntries(setupChecklist(buildModel(d)).items.map((i) => [i.id, i.done]));

describe('setup checklist', () => {
  it('the complete demo café ticks everything: 5 of 5', () => {
    const c = setupChecklist(buildModel(sample('demo')));
    expect([c.done, c.total, c.essentialsDone]).toEqual([5, 5, true]);
  });

  it('the Coffee Shop example has a product without a recipe (Sandwich), so recipes are not ticked', () => {
    expect(status(sample('coffee'))).toMatchObject({ name: true, fixed: true, products: true, inventory: true, recipes: false });
  });

  it('a blank name, invalid fixed costs or an invalid product are not ticked (never assumed)', () => {
    const d = sample('demo');
    const bad: BusinessData = { ...d, name: '  ', fixedCosts: 'abc', products: d.products.map((p, i) => (i === 0 ? { ...p, price: '' } : p)) };
    const s = status(bad);
    expect([s.name, s.fixed, s.products]).toEqual([false, false, false]);
    expect(setupChecklist(buildModel(bad)).essentialsDone).toBe(false);
  });

  it('inventory and recipes are optional items when the business has stock', () => {
    const c = setupChecklist(buildModel(sample('coffee')));
    expect(c.servicesOnly).toBe(false);
    expect(c.items.filter((i) => i.optional).map((i) => i.id)).toEqual(['inventory', 'recipes']);
  });

  it('a service business (no inventory, e.g. accounting) only needs the 3 essentials: 3 of 3, inventory and recipes left out', () => {
    const d: BusinessData = { ...sample('demo'), inventory: [], recipes: {} };
    const c = setupChecklist(buildModel(d));
    expect(c.servicesOnly).toBe(true);
    expect(c.items.map((i) => i.id)).toEqual(['name', 'fixed', 'products']);
    expect([c.done, c.total, c.essentialsDone]).toEqual([3, 3, true]);
  });

  it('no products → products not done (never assumed)', () => {
    const d: BusinessData = { ...sample('demo'), products: [], inventory: [], recipes: {} };
    expect(setupChecklist(buildModel(d)).items.filter((i) => i.done).map((i) => i.id)).toEqual(['name', 'fixed']);
  });
});

describe('Service Business example (fictional accounting practice)', () => {
  it('has no inventory or recipes and earns $4,755 a month (revenue $13,050, CM $11,255, fixed $6,500)', () => {
    const m = buildModel(sample('services'));
    expect(m.data.inventory).toEqual([]);
    expect(m.data.recipes).toEqual({});
    expect([m.summary!.totalRevenue, m.summary!.totalVariableCosts, m.summary!.totalCM, m.summary!.operatingProfit]).toEqual([13050, 1795, 11255, 4755]);
    expect(setupChecklist(m)).toMatchObject({ servicesOnly: true, done: 3, total: 3 });
  });
});
