/**
 * One shared application state. Every section reads and changes the business
 * through these actions, so nothing gets out of sync between sections.
 *
 * Experiments (Pricing Lab scenario, Production Planner plan, surprise events)
 * are kept SEPARATE from the business plan until the user explicitly applies them.
 */
import type { BusinessId } from './businesses';
import type { UnitId } from './inventory';
import { sampleBusiness } from './samples';
import { changeUnit } from './stock';
import { EMPTY_OTHER_COSTS, type BusinessData, type CostMode, type InventoryRecord, type OtherCosts, type ProductInput, type RecipeLineInput } from './types';

/** Pricing Lab "Modified Business Plan": only the fields the user changed. */
export interface ScenarioOverrides {
  fixedCosts?: string;
  products: Record<string, Partial<Record<'price' | 'variableCost' | 'units', string>>>;
}

/** Production Planner "Modified Plan": planned units and hypothetical extra inventory. */
export interface PlannerOverrides {
  units: Record<string, string>;
  /** Extra quantity per inventory item, in that item's own unit. */
  extra: Record<string, string>;
}

export interface AppState {
  business: BusinessData;
  /** JSON of the business when it was loaded – used to detect unsaved work. */
  baseline: string;
  scenario: ScenarioOverrides;
  planner: PlannerOverrides;
  nextId: number;
}

type ProductTextField = 'name' | 'category' | 'price' | 'variableCost' | 'units';
type StockTextField = 'name' | 'quantity' | 'cost';

export type Action =
  | { type: 'load-sample'; business: BusinessId | 'demo' }
  | { type: 'set-business-name'; value: string }
  | { type: 'set-fixed-costs'; value: string }
  | { type: 'add-product' }
  | { type: 'update-product'; id: string; field: ProductTextField; value: string }
  | { type: 'update-other-cost'; id: string; field: keyof OtherCosts; value: string }
  | { type: 'set-cost-mode'; id: string; mode: CostMode }
  | { type: 'duplicate-product'; id: string }
  | { type: 'delete-product'; id: string }
  | { type: 'add-stock' }
  | { type: 'update-stock'; id: string; field: StockTextField; value: string }
  | { type: 'change-stock-unit'; id: string; unit: UnitId }
  | { type: 'delete-stock'; id: string }
  | { type: 'clear-stock' }
  | { type: 'import-stock'; mode: 'replace' | 'append'; items: Omit<InventoryRecord, 'id'>[] }
  | { type: 'save-recipe'; productId: string; lines: Omit<RecipeLineInput, 'id'>[] }
  | { type: 'import-recipes'; recipes: Record<string, Omit<RecipeLineInput, 'id'>[]> }
  | { type: 'scenario-set'; productId: string | null; field: 'price' | 'variableCost' | 'units' | 'fixedCosts'; value: string }
  | { type: 'scenario-reset' }
  | { type: 'scenario-apply'; resolved: { fixedCosts?: string; products: Record<string, { price?: string; variableCost?: string; units?: string }> } }
  | { type: 'planner-set-units'; productId: string; value: string }
  | { type: 'planner-set-extra'; itemId: string; value: string }
  | { type: 'planner-fill'; units: Record<string, number> }
  | { type: 'planner-reset' }
  | { type: 'replace-business'; business: BusinessData };

function idMaker(state: { nextId: number }) {
  let n = state.nextId;
  return { newId: (prefix: string) => `${prefix}${n++}`, next: () => n };
}

const emptyScenario = (): ScenarioOverrides => ({ products: {} });
const emptyPlanner = (): PlannerOverrides => ({ units: {}, extra: {} });

export function initialAppState(business: BusinessId | 'demo' = 'coffee'): AppState {
  const ids = idMaker({ nextId: 1 });
  const data = sampleBusiness(business, ids.newId);
  return { business: data, baseline: JSON.stringify(data), scenario: emptyScenario(), planner: emptyPlanner(), nextId: ids.next() };
}

/** True when the user has changed the business since it was loaded. */
export const hasUnsavedWork = (s: AppState) => JSON.stringify(s.business) !== s.baseline;

function withBusiness(state: AppState, business: BusinessData, nextId = state.nextId): AppState {
  return { ...state, business, nextId };
}

function mapProducts(state: AppState, id: string, fn: (p: ProductInput) => ProductInput): AppState {
  return withBusiness(state, { ...state.business, products: state.business.products.map((p) => (p.id === id ? fn(p) : p)) });
}

function mapStock(state: AppState, id: string, fn: (r: InventoryRecord) => InventoryRecord): AppState {
  return withBusiness(state, { ...state.business, inventory: state.business.inventory.map((r) => (r.id === id ? fn(r) : r)) });
}

/** Picks a name that isn't taken yet: "Coffee (copy)", "Coffee (copy 2)"… */
function uniqueName(base: string, taken: string[]): string {
  const set = new Set(taken.map((t) => t.trim().toLowerCase()));
  if (!set.has(base.toLowerCase())) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base.replace(/ \(copy( \d+)?\)$/, '')} (copy${i === 2 ? '' : ` ${i - 1}`})`;
    if (!set.has(candidate.toLowerCase())) return candidate;
  }
}

export function reducer(state: AppState, action: Action): AppState {
  const b = state.business;
  switch (action.type) {
    case 'load-sample': {
      const ids = idMaker(state);
      const data = sampleBusiness(action.business, ids.newId);
      return { business: data, baseline: JSON.stringify(data), scenario: emptyScenario(), planner: emptyPlanner(), nextId: ids.next() };
    }
    case 'set-business-name':
      return withBusiness(state, { ...b, name: action.value });
    case 'set-fixed-costs':
      return withBusiness(state, { ...b, fixedCosts: action.value });

    /* Products */
    case 'add-product': {
      const ids = idMaker(state);
      const product: ProductInput = {
        id: ids.newId('p'),
        name: uniqueName('New product', b.products.map((p) => p.name)),
        category: '',
        price: '',
        variableCost: '',
        units: '',
        costMode: 'manual',
        otherCosts: { ...EMPTY_OTHER_COSTS },
      };
      return withBusiness(state, { ...b, products: [...b.products, product] }, ids.next());
    }
    case 'update-product':
      return mapProducts(state, action.id, (p) => ({ ...p, [action.field]: action.value }));
    case 'update-other-cost':
      return mapProducts(state, action.id, (p) => ({ ...p, otherCosts: { ...p.otherCosts, [action.field]: action.value } }));
    case 'set-cost-mode':
      return mapProducts(state, action.id, (p) => ({ ...p, costMode: action.mode }));
    case 'duplicate-product': {
      const src = b.products.find((p) => p.id === action.id);
      if (!src) return state;
      const ids = idMaker(state);
      const copy: ProductInput = {
        ...src,
        otherCosts: { ...src.otherCosts },
        id: ids.newId('p'),
        name: uniqueName(`${src.name.trim()} (copy)`, b.products.map((p) => p.name)),
      };
      const recipe = b.recipes[src.id];
      const recipes = recipe ? { ...b.recipes, [copy.id]: recipe.map((l) => ({ ...l, id: ids.newId('r') })) } : b.recipes;
      const index = b.products.findIndex((p) => p.id === src.id);
      const products = [...b.products.slice(0, index + 1), copy, ...b.products.slice(index + 1)];
      return withBusiness(state, { ...b, products, recipes }, ids.next());
    }
    case 'delete-product': {
      const recipes = { ...b.recipes };
      delete recipes[action.id];
      const sp = { ...state.scenario.products };
      delete sp[action.id];
      const pu = { ...state.planner.units };
      delete pu[action.id];
      return {
        ...withBusiness(state, { ...b, products: b.products.filter((p) => p.id !== action.id), recipes }),
        scenario: { ...state.scenario, products: sp },
        planner: { ...state.planner, units: pu },
      };
    }

    /* Inventory */
    case 'add-stock': {
      const ids = idMaker(state);
      const item: InventoryRecord = { id: ids.newId('i'), name: '', quantity: '', unit: 'g', cost: '' };
      return withBusiness(state, { ...b, inventory: [...b.inventory, item] }, ids.next());
    }
    case 'update-stock':
      return mapStock(state, action.id, (r) => ({ ...r, [action.field]: action.value }));
    case 'change-stock-unit':
      return mapStock(state, action.id, (r) => changeUnit(r, action.unit).record);
    case 'delete-stock': {
      // Recipe lines that used this item stay, and are flagged so the user decides what to do.
      const extra = { ...state.planner.extra };
      delete extra[action.id];
      return { ...withBusiness(state, { ...b, inventory: b.inventory.filter((r) => r.id !== action.id) }), planner: { ...state.planner, extra } };
    }
    case 'clear-stock':
      return { ...withBusiness(state, { ...b, inventory: [] }), planner: { ...state.planner, extra: {} } };
    case 'import-stock': {
      const ids = idMaker(state);
      const imported = action.items.map((i) => ({ ...i, id: ids.newId('i') }));
      const inventory = action.mode === 'replace' ? imported : [...b.inventory, ...imported];
      return withBusiness(state, { ...b, inventory }, ids.next());
    }

    /* Recipes */
    case 'save-recipe': {
      const ids = idMaker(state);
      const recipes = { ...b.recipes };
      if (action.lines.length === 0) delete recipes[action.productId];
      else recipes[action.productId] = action.lines.map((l) => ({ ...l, id: ids.newId('r') }));
      return withBusiness(state, { ...b, recipes }, ids.next());
    }
    case 'import-recipes': {
      const ids = idMaker(state);
      const recipes = { ...b.recipes };
      for (const [pid, lines] of Object.entries(action.recipes)) {
        recipes[pid] = lines.map((l) => ({ ...l, id: ids.newId('r') }));
      }
      return withBusiness(state, { ...b, recipes }, ids.next());
    }

    /* Pricing Lab scenario */
    case 'scenario-set': {
      if (action.productId === null) return { ...state, scenario: { ...state.scenario, fixedCosts: action.value } };
      const current = state.scenario.products[action.productId] ?? {};
      return {
        ...state,
        scenario: {
          ...state.scenario,
          products: { ...state.scenario.products, [action.productId]: { ...current, [action.field]: action.value } },
        },
      };
    }
    case 'scenario-reset':
      return { ...state, scenario: emptyScenario() };
    case 'scenario-apply': {
      const r = action.resolved;
      const products = b.products.map((p) => {
        const o = r.products[p.id];
        if (!o) return p;
        const next = { ...p };
        if (o.price !== undefined) next.price = o.price;
        if (o.units !== undefined) next.units = o.units;
        if (o.variableCost !== undefined) {
          // An explicit variable cost replaces itemized costing for this product.
          next.variableCost = o.variableCost;
          next.costMode = 'manual';
        }
        return next;
      });
      return {
        ...withBusiness(state, { ...b, products, fixedCosts: r.fixedCosts ?? b.fixedCosts }),
        scenario: emptyScenario(),
      };
    }

    /* Production Planner */
    case 'planner-set-units':
      return { ...state, planner: { ...state.planner, units: { ...state.planner.units, [action.productId]: action.value } } };
    case 'planner-set-extra':
      return { ...state, planner: { ...state.planner, extra: { ...state.planner.extra, [action.itemId]: action.value } } };
    case 'planner-fill':
      return {
        ...state,
        planner: { ...state.planner, units: Object.fromEntries(Object.entries(action.units).map(([k, v]) => [k, String(v)])) },
      };
    case 'planner-reset':
      return { ...state, planner: emptyPlanner() };

    case 'replace-business':
      return withBusiness(state, action.business);
    default:
      return state;
  }
}
