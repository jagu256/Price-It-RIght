import { describe, expect, it } from 'vitest';
import { buildModel } from './model';
import { checkPlan } from './planning';
import {
  APP_ID,
  MAX_FILE_BYTES,
  SCHEMA_VERSION,
  STORAGE_KEY,
  clearStorage,
  loadFromStorage,
  parseSavedBusiness,
  saveFileName,
  saveToStorage,
  serializeBusiness,
  type StorageLike,
} from './saveWork';
import { hasUnsavedWork, initialAppState, reducer } from './store';

const demo = () => initialAppState('demo').business;
const WHEN = '2026-11-09T18:00:00.000Z';

/** A save file as a plain object, so one field at a time can be broken. */
const fileObject = () => JSON.parse(serializeBusiness(demo(), WHEN));
const parseObject = (o: unknown) => parseSavedBusiness(JSON.stringify(o));
const errorsOf = (o: unknown) => {
  const r = parseObject(o);
  return r.ok ? [] : r.errors;
};

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}
const brokenStorage: StorageLike = {
  getItem: () => { throw new Error('blocked'); },
  setItem: () => { throw new Error('quota'); },
  removeItem: () => { throw new Error('blocked'); },
};

describe('save file – writing', () => {
  it('stores the app name, a schema version, the date and only the business', () => {
    const file = fileObject();
    expect(Object.keys(file)).toEqual(['app', 'schemaVersion', 'savedAt', 'business']);
    expect(file.app).toBe(APP_ID);
    expect(file.schemaVersion).toBe(SCHEMA_VERSION);
    expect(file.savedAt).toBe(WHEN);
    expect(Object.keys(file.business).sort()).toEqual(['fixedCosts', 'inventory', 'isDemo', 'name', 'products', 'recipes', 'type']);
  });

  it('makes a safe file name', () => {
    expect(saveFileName('Maple Leaf Café (demo)')).toBe('price-it-right-maple-leaf-cafe-demo.json');
    expect(saveFileName('   ')).toBe('price-it-right-business.json');
  });
});

describe('save file – reading back', () => {
  it('round-trips the demo café with the same verified results', () => {
    const r = parseSavedBusiness(serializeBusiness(demo(), WHEN));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.savedAt).toBe(WHEN);
    expect(r.business.isDemo).toBe(true);
    const before = buildModel(demo());
    const after = buildModel(r.business);
    expect(after.summary!.totalRevenue).toBe(3900);
    expect(after.summary!.totalCM).toBe(2475);
    expect(after.summary!.operatingProfit).toBe(975);
    expect(after.products.map((p) => [p.name, p.price, p.variableCost, p.units])).toEqual(before.products.map((p) => [p.name, p.price, p.variableCost, p.units]));
    // Recipes still point at the right inventory items: same shortages as before saving.
    const shortages = (m: typeof before) =>
      checkPlan(Object.fromEntries(m.products.map((p) => [p.id, p.units])), m.products, m.recipes, m.stock).items.map((i) => [i.name, i.shortageBase]);
    expect(shortages(after)).toEqual(shortages(before));
    expect(shortages(after).filter(([, s]) => (s as number) > 0).map(([n]) => n)).toEqual(['Milk', 'Butter']);
  });

  it('gives every record a fresh id and a next id that cannot clash', () => {
    const r = parseSavedBusiness(serializeBusiness(demo(), WHEN));
    if (!r.ok) throw new Error('expected ok');
    const ids = [...r.business.products.map((p) => p.id), ...r.business.inventory.map((i) => i.id), ...Object.values(r.business.recipes).flat().map((l) => l.id)];
    expect(new Set(ids).size).toBe(ids.length);
    const largest = Math.max(...ids.map((id) => Number(id.slice(1))));
    expect(r.nextId).toBeGreaterThan(largest);
  });

  it('keeps exactly what the user typed – invalid text is not turned into 0', () => {
    const file = fileObject();
    file.business.products[0].price = 'abc';
    file.business.fixedCosts = '';
    const r = parseObject(file);
    if (!r.ok) throw new Error('expected ok');
    expect(r.business.products[0].price).toBe('abc');
    expect(r.business.fixedCosts).toBe('');
    expect(buildModel(r.business).summary).toBeNull(); // results pause, as everywhere else
  });

  it('drops anything that is not part of the business (experiments, unknown fields)', () => {
    const file = fileObject();
    file.scenario = { products: { p1: { price: '99' } } };
    file.business.planner = { units: {} };
    file.business.products[0].secret = 'x';
    const r = parseObject(file);
    if (!r.ok) throw new Error('expected ok');
    expect(JSON.stringify(r.business)).not.toMatch(/scenario|planner|secret/);
  });
});

describe('save file – friendly errors, never a crash', () => {
  it('rejects files that are not save files', () => {
    expect(parseSavedBusiness('')).toEqual({ ok: false, errors: ['This file is empty.'] });
    expect(errorsOf([1, 2, 3])[0]).toMatch(/not a Price It Right save file/);
    expect(errorsOf({ app: 'something-else' })[0]).toMatch(/not a Price It Right save file/);
    const notJson = parseSavedBusiness('Item Name,Quantity\nMilk,3');
    expect(notJson.ok).toBe(false);
    if (!notJson.ok) expect(notJson.errors[0]).toMatch(/could not be read/);
    for (const junk of ['null', '42', '"text"', '{', '{"app":"price-it-right"}']) expect(parseSavedBusiness(junk).ok).toBe(false);
  });

  it('rejects a file that is too large', () => {
    const r = parseSavedBusiness('x'.repeat(MAX_FILE_BYTES + 1));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/too large/);
  });

  it('checks the schema version', () => {
    const newer = fileObject();
    newer.schemaVersion = SCHEMA_VERSION + 1;
    expect(errorsOf(newer)[0]).toMatch(/newer version of Price It Right/);
    for (const bad of [undefined, '1', 0, 1.5]) {
      const f = fileObject();
      f.schemaVersion = bad;
      expect(errorsOf(f)[0]).toMatch(/no valid version number/);
    }
  });

  it('explains which part is wrong', () => {
    const check = (change: (f: ReturnType<typeof fileObject>) => void, message: RegExp) => {
      const f = fileObject();
      change(f);
      expect(errorsOf(f).join(' | ')).toMatch(message);
    };
    check((f) => delete f.business, /no business in it/);
    check((f) => (f.business.type = 'bank'), /business category/);
    check((f) => (f.business.name = 7), /business name/);
    check((f) => (f.business.isDemo = 'yes'), /fictional demo/);
    check((f) => (f.business.fixedCosts = 1500), /fixed costs are missing/);
    check((f) => (f.business.products = 'none'), /product list is missing/);
    check((f) => (f.business.products[1] = null), /Product 2 is not a valid product/);
    check((f) => (f.business.products[0].price = 6), /Product 1 is missing: price/);
    check((f) => (f.business.products[0].costMode = 'magic'), /unknown costing method/);
    check((f) => delete f.business.products[0].otherCosts.labour, /other variable costs/);
    check((f) => (f.business.products[1].id = f.business.products[0].id), /Product 2 repeats the internal id/);
    check((f) => (f.business.inventory = {}), /inventory list is missing/);
    check((f) => (f.business.inventory[0].unit = 'cups'), /Inventory item 1 has an unknown unit/);
    check((f) => delete f.business.inventory[0].quantity, /Inventory item 1 is missing/);
    check((f) => (f.business.recipes = []), /recipe list is missing/);
    check((f) => (f.business.recipes.ghost = []), /product that is not in the file/);
    check((f) => (f.business.recipes[f.business.products[0].id][0].unit = 'cups'), /recipe for Coffee has a line that is not valid/);
    check((f) => (f.business.products[0].name = 'x'.repeat(500)), /Product 1 is missing: name/);
  });

  it('limits a long list of problems', () => {
    const f = fileObject();
    f.business.products = Array.from({ length: 30 }, () => null);
    f.business.recipes = {};
    const errors = errorsOf(f);
    expect(errors).toHaveLength(9);
    expect(errors[8]).toBe('…and 22 more problems.');
  });
});

describe('browser storage', () => {
  it('saves, restores and clears', () => {
    const s = memoryStorage();
    expect(loadFromStorage(s)).toEqual({ status: 'empty' });
    expect(saveToStorage(s, demo(), WHEN)).toBe(true);
    expect(JSON.parse(s.data.get(STORAGE_KEY)!).schemaVersion).toBe(SCHEMA_VERSION);
    const loaded = loadFromStorage(s);
    expect(loaded.status).toBe('restored');
    if (loaded.status === 'restored') expect(buildModel(loaded.business).summary!.operatingProfit).toBe(975);
    expect(clearStorage(s)).toBe(true);
    expect(loadFromStorage(s)).toEqual({ status: 'empty' });
  });

  it('never throws when storage is missing, blocked or full', () => {
    expect(saveToStorage(null, demo(), WHEN)).toBe(false);
    expect(clearStorage(null)).toBe(false);
    expect(loadFromStorage(null)).toEqual({ status: 'unavailable' });
    expect(saveToStorage(brokenStorage, demo(), WHEN)).toBe(false);
    expect(clearStorage(brokenStorage)).toBe(false);
    expect(loadFromStorage(brokenStorage)).toEqual({ status: 'unavailable' });
  });

  it('reports a damaged saved copy instead of using it', () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, '{"app":"price-it-right","schemaVersion":1,"business":{');
    expect(loadFromStorage(s).status).toBe('unreadable');
  });
});

describe('store – loading a saved business', () => {
  it('replaces the business, clears experiments and counts as the user’s own work', () => {
    let state = initialAppState('coffee');
    state = reducer(state, { type: 'scenario-set', productId: state.business.products[0].id, field: 'price', value: '9' });
    state = reducer(state, { type: 'planner-set-units', productId: state.business.products[0].id, value: '5' });
    const parsed = parseSavedBusiness(serializeBusiness(demo(), WHEN));
    if (!parsed.ok) throw new Error('expected ok');
    state = reducer(state, { type: 'load-business', business: parsed.business, nextId: parsed.nextId });
    expect(state.business.name).toBe('Maple Leaf Café (demo)');
    expect(state.scenario).toEqual({ products: {} });
    expect(state.planner).toEqual({ units: {}, extra: {} });
    expect(hasUnsavedWork(state)).toBe(true); // so the app asks before replacing it
    // New records get ids that don't clash with restored ones.
    const next = reducer(state, { type: 'add-product' });
    expect(new Set(next.business.products.map((p) => p.id)).size).toBe(next.business.products.length);
  });

  it('an untouched example is not “my work”, an edited one is', () => {
    const state = initialAppState('coffee');
    expect(hasUnsavedWork(state)).toBe(false);
    expect(hasUnsavedWork(reducer(state, { type: 'set-fixed-costs', value: '900' }))).toBe(true);
  });
});
