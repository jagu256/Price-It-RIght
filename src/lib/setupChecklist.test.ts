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

  it('no inventory and no products → those items are not done; inventory and recipes are optional', () => {
    const d: BusinessData = { ...sample('demo'), products: [], inventory: [], recipes: {} };
    const c = setupChecklist(buildModel(d));
    expect(c.items.filter((i) => i.done).map((i) => i.id)).toEqual(['name', 'fixed']);
    expect(c.items.filter((i) => i.optional).map((i) => i.id)).toEqual(['inventory', 'recipes']);
  });
});
