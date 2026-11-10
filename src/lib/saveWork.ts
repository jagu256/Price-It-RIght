/**
 * Save my work: turning the business into a saved file / browser-storage
 * entry, and reading one back safely.
 *
 * Only the BUSINESS is saved (name, fixed costs, products, inventory and
 * recipes). Pricing Lab and Production Planner experiments and challenge
 * progress are deliberately left out.
 *
 * Reading is defensive: a saved file can be edited by hand, damaged, or come
 * from somewhere else entirely, so every field is checked before it is used.
 * Values the user typed (prices, quantities…) are kept exactly as text – they
 * are never converted or "fixed" here; `model.ts` validates them as usual.
 */
import { BUSINESSES, type BusinessId } from './businesses';
import { UNITS, type UnitId } from './inventory';
import type { BusinessData, InventoryRecord, OtherCosts, ProductInput, RecipeLineInput } from './types';

/** Increase this whenever the saved shape changes, and add a migration below. */
export const SCHEMA_VERSION = 1;
export const APP_ID = 'price-it-right';
export const STORAGE_KEY = 'price-it-right:business';

/** Generous limits so a damaged or unrelated file can't freeze the page. */
export const MAX_FILE_BYTES = 1_000_000;
const MAX_PRODUCTS = 200;
const MAX_INVENTORY = 2000;
const MAX_RECIPE_LINES = 200;
const MAX_TEXT = 200;

export interface SavedFile {
  app: typeof APP_ID;
  schemaVersion: number;
  /** ISO date-time the copy was made. */
  savedAt: string;
  business: BusinessData;
}

export type ParseResult =
  | { ok: true; business: BusinessData; nextId: number; savedAt: string | null }
  | { ok: false; errors: string[] };

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

export function serializeBusiness(business: BusinessData, savedAt: string): string {
  const file: SavedFile = { app: APP_ID, schemaVersion: SCHEMA_VERSION, savedAt, business };
  return JSON.stringify(file, null, 2);
}

/** price-it-right-maple-leaf-cafe.json */
export function saveFileName(businessName: string): string {
  const safe =
    businessName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'business';
  return `price-it-right-${safe}.json`;
}

/* ------------------------------------------------------------------ */
/* Reading and validating                                              */
/* ------------------------------------------------------------------ */

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isText = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TEXT;
const isUnit = (v: unknown): v is UnitId => typeof v === 'string' && Object.prototype.hasOwnProperty.call(UNITS, v);
const isBusinessId = (v: unknown): v is BusinessId => BUSINESSES.some((b) => b.id === v);

const PRODUCT_TEXT = ['name', 'category', 'price', 'variableCost', 'units'] as const;
const OTHER_COSTS = ['labour', 'packaging', 'paymentFees', 'other'] as const;

/**
 * Checks a saved file completely. Returns either a clean business (with fresh
 * internal ids, so they can never clash) or a list of friendly error messages.
 * Never throws.
 */
export function parseSavedBusiness(text: string): ParseResult {
  if (text.length > MAX_FILE_BYTES) return fail('This file is too large to be a Price It Right save file (limit 1 MB).');
  if (text.trim() === '') return fail('This file is empty.');

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('This file could not be read. It is not a valid Price It Right save file (.json) or it has been damaged.');
  }
  if (!isObject(raw) || raw.app !== APP_ID) return fail('This is not a Price It Right save file. Choose a file made with “Export my business”.');

  const version = raw.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return fail('This save file has no valid version number, so it can’t be read safely.');
  if (version > SCHEMA_VERSION) return fail(`This save file was made by a newer version of Price It Right (file version ${version}; this app reads up to version ${SCHEMA_VERSION}).`);
  // Older versions would be upgraded here, one step at a time. Version 1 is the first.

  const b = raw.business;
  if (!isObject(b)) return fail('The save file has no business in it.');

  const errors: string[] = [];
  if (!isBusinessId(b.type)) errors.push('The business category is missing or not recognised.');
  if (!isText(b.name)) errors.push('The business name is missing or too long.');
  if (typeof b.isDemo !== 'boolean') errors.push('The “fictional demo” marker is missing.');
  if (!isText(b.fixedCosts)) errors.push('Monthly fixed costs are missing.');

  // Products
  const products: ProductInput[] = [];
  const productIds = new Map<string, string>(); // id in the file → fresh id
  if (!Array.isArray(b.products)) errors.push('The product list is missing.');
  else if (b.products.length > MAX_PRODUCTS) errors.push(`The file has ${b.products.length} products; the limit is ${MAX_PRODUCTS}.`);
  else {
    b.products.forEach((p: unknown, i: number) => {
      const where = `Product ${i + 1}`;
      if (!isObject(p)) return errors.push(`${where} is not a valid product.`);
      const before = errors.length;
      const bad = PRODUCT_TEXT.filter((k) => !isText(p[k]));
      const costs = p.otherCosts;
      if (typeof p.id !== 'string' || p.id === '') errors.push(`${where} has no internal id.`);
      else if (productIds.has(p.id)) errors.push(`${where} repeats the internal id of another product.`);
      if (bad.length) errors.push(`${where} is missing: ${bad.join(', ')}.`);
      if (p.costMode !== 'manual' && p.costMode !== 'itemized') errors.push(`${where} has an unknown costing method.`);
      if (!isObject(costs) || OTHER_COSTS.some((k) => !isText(costs[k]))) errors.push(`${where} has missing “other variable costs”.`);
      if (errors.length > before || !isObject(costs) || (p.costMode !== 'manual' && p.costMode !== 'itemized')) return;
      const id = `p${i + 1}`;
      productIds.set(p.id as string, id);
      products.push({
        id,
        name: p.name as string,
        category: p.category as string,
        price: p.price as string,
        variableCost: p.variableCost as string,
        units: p.units as string,
        costMode: p.costMode,
        otherCosts: Object.fromEntries(OTHER_COSTS.map((k) => [k, costs[k]])) as unknown as OtherCosts,
      });
    });
  }

  // Inventory
  const inventory: InventoryRecord[] = [];
  const itemIds = new Map<string, string>();
  if (!Array.isArray(b.inventory)) errors.push('The inventory list is missing.');
  else if (b.inventory.length > MAX_INVENTORY) errors.push(`The file has ${b.inventory.length} inventory items; the limit is ${MAX_INVENTORY}.`);
  else {
    b.inventory.forEach((r: unknown, i: number) => {
      const where = `Inventory item ${i + 1}`;
      if (!isObject(r)) return errors.push(`${where} is not a valid item.`);
      const before = errors.length;
      if (typeof r.id !== 'string' || r.id === '') errors.push(`${where} has no internal id.`);
      else if (itemIds.has(r.id)) errors.push(`${where} repeats the internal id of another item.`);
      if (!isText(r.name) || !isText(r.quantity) || !isText(r.cost)) errors.push(`${where} is missing its name, quantity or cost.`);
      if (!isUnit(r.unit)) errors.push(`${where} has an unknown unit (allowed: g, kg, mL, L, pcs).`);
      if (errors.length > before) return;
      const id = `i${i + 1}`;
      itemIds.set(r.id as string, id);
      inventory.push({ id, name: r.name as string, quantity: r.quantity as string, unit: r.unit as UnitId, cost: r.cost as string });
    });
  }

  // Recipes (productId → lines)
  const recipes: Record<string, RecipeLineInput[]> = {};
  let lineNo = 0;
  if (!isObject(b.recipes)) errors.push('The recipe list is missing.');
  else {
    for (const [fileProductId, lines] of Object.entries(b.recipes)) {
      const productId = productIds.get(fileProductId);
      if (!productId) {
        errors.push('A recipe belongs to a product that is not in the file.');
        continue;
      }
      const name = products.find((p) => p.id === productId)?.name || 'a product';
      if (!Array.isArray(lines) || lines.length > MAX_RECIPE_LINES) {
        errors.push(`The recipe for ${name} is not valid.`);
        continue;
      }
      const clean: RecipeLineInput[] = [];
      for (const l of lines as unknown[]) {
        if (!isObject(l) || typeof l.itemId !== 'string' || !isText(l.quantity) || !isUnit(l.unit)) {
          errors.push(`The recipe for ${name} has a line that is not valid.`);
          continue;
        }
        lineNo += 1;
        // A line may point at an inventory item that was deleted; the app flags that itself.
        clean.push({ id: `r${lineNo}`, itemId: itemIds.get(l.itemId) ?? `missing-${lineNo}`, quantity: l.quantity, unit: l.unit });
      }
      recipes[productId] = clean;
    }
  }

  if (errors.length > 0) return { ok: false, errors: errors.slice(0, 8).concat(errors.length > 8 ? [`…and ${errors.length - 8} more problems.`] : []) };

  return {
    ok: true,
    business: {
      type: b.type as BusinessId,
      name: b.name as string,
      isDemo: b.isDemo as boolean,
      fixedCosts: b.fixedCosts as string,
      products,
      inventory,
      recipes,
    },
    // Ids p1…, i1…, r1… are used above, so the next free number is one past the largest count.
    nextId: Math.max(products.length, inventory.length, lineNo) + 1,
    savedAt: typeof raw.savedAt === 'string' && !Number.isNaN(Date.parse(raw.savedAt)) ? raw.savedAt : null,
  };
}

function fail(message: string): ParseResult {
  return { ok: false, errors: [message] };
}

/* ------------------------------------------------------------------ */
/* Browser storage (localStorage)                                      */
/* ------------------------------------------------------------------ */

/** The three calls we need – so tests can pass in a fake or a broken storage. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** The browser's localStorage, or null when it is blocked or missing (e.g. some private modes). */
export function browserStorage(): StorageLike | null {
  try {
    const s = window.localStorage;
    const probe = `${STORAGE_KEY}:test`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** Returns true when the business was saved. Never throws. */
export function saveToStorage(storage: StorageLike | null, business: BusinessData, savedAt: string): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, serializeBusiness(business, savedAt));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

/** Returns true when storage is working and holds no saved business afterwards. Never throws. */
export function clearStorage(storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export type LoadResult =
  | { status: 'unavailable' }
  | { status: 'empty' }
  | { status: 'restored'; business: BusinessData; nextId: number; savedAt: string | null }
  | { status: 'unreadable'; errors: string[] };

/** Reads the saved business, if any. Never throws. */
export function loadFromStorage(storage: StorageLike | null): LoadResult {
  if (!storage) return { status: 'unavailable' };
  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (text === null) return { status: 'empty' };
  const parsed = parseSavedBusiness(text);
  return parsed.ok ? { status: 'restored', business: parsed.business, nextId: parsed.nextId, savedAt: parsed.savedAt } : { status: 'unreadable', errors: parsed.errors };
}
