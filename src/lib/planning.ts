/**
 * Production planning with SHARED inventory.
 *
 * Products that use the same inventory item compete for it, so capacities are
 * never calculated separately and added together. Instead, a plan's combined
 * requirements are checked against what is available:
 *
 *   Required Quantity  = Σ (Planned Units × Quantity Required Per Product)
 *   Remaining          = Available − Required
 *   Shortage           = MAX(0, Required − Available)
 */
import { businessSummary, toCents, type BusinessSummary } from './business';
import { calculateProduction, type Dimension, type ProductionResult } from './inventory';
import type { ParsedProduct } from './model';
import type { RecipeEval } from './recipes';
import type { ParsedStockItem } from './stock';

export type StockStatus = 'sufficient' | 'low' | 'shortage' | 'unused';

/** A plan uses ≥ 80 % of an item → "Low Stock". Over 100 % → "Inventory Shortage". */
export const LOW_STOCK_THRESHOLD = 0.8;

export interface ItemRequirement {
  itemId: string;
  name: string;
  dimension: Dimension;
  availableBase: number;
  requiredBase: number;
  remainingBase: number;
  shortageBase: number;
  /** Required ÷ available, or null when nothing is required. */
  usage: number | null;
  status: StockStatus;
  /** Product names whose recipes use this item. */
  usedBy: string[];
}

export interface PlanCheck {
  items: ItemRequirement[];
  /**
   * 'feasible'   – every planned product has a recipe and nothing is short
   * 'infeasible' – at least one item is short
   * 'unverified' – nothing known is short, but some planned products have no recipe
   */
  feasibility: 'feasible' | 'infeasible' | 'unverified';
  /** Planned products whose inventory requirements are unknown. */
  unknownProducts: string[];
}

export type Plan = Record<string, number>;

export function statusFor(requiredBase: number, availableBase: number): StockStatus {
  if (requiredBase === 0) return 'unused';
  if (requiredBase > availableBase) return 'shortage';
  if (requiredBase >= LOW_STOCK_THRESHOLD * availableBase) return 'low';
  return 'sufficient';
}

export function checkPlan(
  plan: Plan,
  products: ParsedProduct[],
  recipes: Record<string, RecipeEval>,
  stock: ParsedStockItem[],
  extraBase: Record<string, number> = {},
): PlanCheck {
  const required = new Map<string, number>(stock.map((s) => [s.id, 0]));
  const usedBy = new Map<string, Set<string>>(stock.map((s) => [s.id, new Set()]));
  const unknownProducts: string[] = [];

  for (const p of products) {
    const units = plan[p.id] ?? 0;
    const recipe = recipes[p.id];
    if (!recipe || recipe.status !== 'complete') {
      if (units > 0) unknownProducts.push(p.name);
      continue;
    }
    for (const line of recipe.lines) {
      if (!required.has(line.itemId)) continue;
      required.set(line.itemId, (required.get(line.itemId) ?? 0) + units * line.requiredBase);
      usedBy.get(line.itemId)?.add(p.name);
    }
  }

  const items: ItemRequirement[] = stock.map((s) => {
    const availableBase = s.availableBase + (extraBase[s.id] ?? 0);
    const requiredBase = required.get(s.id) ?? 0;
    return {
      itemId: s.id,
      name: s.name,
      dimension: s.dimension,
      availableBase,
      requiredBase,
      remainingBase: availableBase - requiredBase,
      shortageBase: Math.max(0, requiredBase - availableBase),
      usage: requiredBase === 0 ? null : availableBase === 0 ? Infinity : requiredBase / availableBase,
      status: statusFor(requiredBase, availableBase),
      usedBy: [...(usedBy.get(s.id) ?? [])],
    };
  });

  const short = items.some((i) => i.status === 'shortage');
  return {
    items,
    feasibility: short ? 'infeasible' : unknownProducts.length > 0 ? 'unverified' : 'feasible',
    unknownProducts,
  };
}

/* ------------------------------------------------------------------ */
/* One product on its own                                              */
/* ------------------------------------------------------------------ */

/** Maximum units of ONE product if it had all the inventory to itself. */
export function singleProductCapacity(recipe: RecipeEval, stock: ParsedStockItem[]): ProductionResult | null {
  if (recipe.status !== 'complete') return null;
  const byId = new Map(stock.map((s) => [s.id, s]));
  const items = recipe.lines.flatMap((l) => {
    const s = byId.get(l.itemId);
    return s ? [{ id: s.id, name: s.name, dimension: s.dimension, availableBase: s.availableBase, requiredBase: l.requiredBase }] : [];
  });
  return items.length > 0 ? calculateProduction(items) : null;
}

/* ------------------------------------------------------------------ */
/* Plan financials                                                     */
/* ------------------------------------------------------------------ */

export interface PlanFinancials {
  summary: BusinessSummary;
  /** Units sold = MIN(planned, expected demand). Unsold units are not revenue. */
  sold: Plan;
  unsold: { productId: string; name: string; units: number }[];
}

export function planFinancials(plan: Plan, products: ParsedProduct[], fixedCosts: number): PlanFinancials {
  const sold: Plan = {};
  const unsold: PlanFinancials['unsold'] = [];
  for (const p of products) {
    const planned = plan[p.id] ?? 0;
    sold[p.id] = Math.min(planned, p.units);
    if (planned > p.units) unsold.push({ productId: p.id, name: p.name, units: planned - p.units });
  }
  const summary = businessSummary(
    products.map((p) => ({ ...p, units: sold[p.id] })),
    fixedCosts,
  );
  return { summary, sold, unsold };
}

/* ------------------------------------------------------------------ */
/* Contribution margin per unit of a scarce resource                   */
/* ------------------------------------------------------------------ */

export interface ResourceRanking {
  productId: string;
  name: string;
  cmPerUnit: number;
  /** Quantity of the resource used per product, in thousandths of the base unit. */
  usedBase: number;
  /** CM ÷ resource used, expressed per kg, per L or per piece. */
  cmPerResourceUnit: number;
}

/** "per kg", "per L" or "per piece" – the unit used for CM-per-resource figures. */
export function resourceUnitLabel(dimension: Dimension): string {
  return dimension === 'mass' ? 'kg' : dimension === 'volume' ? 'L' : 'piece';
}

export function contributionPerResource(
  itemId: string,
  products: ParsedProduct[],
  recipes: Record<string, RecipeEval>,
  stock: ParsedStockItem[],
): { item: ParsedStockItem; ranking: ResourceRanking[]; notUsing: string[]; unknown: string[] } | null {
  const item = stock.find((s) => s.id === itemId);
  if (!item) return null;
  // Thousandths of a base unit per display unit: 1 kg = 1,000 g = 1,000,000 thousandths.
  const perDisplay = item.dimension === 'count' ? 1000 : 1_000_000;
  const ranking: ResourceRanking[] = [];
  const notUsing: string[] = [];
  const unknown: string[] = [];
  for (const p of products) {
    const recipe = recipes[p.id];
    if (!recipe || recipe.status !== 'complete') {
      unknown.push(p.name);
      continue;
    }
    const line = recipe.lines.find((l) => l.itemId === itemId);
    if (!line) {
      notUsing.push(p.name);
      continue;
    }
    const cm = (toCents(p.price) - toCents(p.variableCost)) / 100;
    ranking.push({
      productId: p.id,
      name: p.name,
      cmPerUnit: cm,
      usedBase: line.requiredBase,
      // Contribution Margin per Unit of Scarce Resource = CM per Unit ÷ Resource Used per Product
      cmPerResourceUnit: (cm / line.requiredBase) * perDisplay,
    });
  }
  ranking.sort((a, b) => b.cmPerResourceUnit - a.cmPerResourceUnit);
  return { item, ranking, notUsing, unknown };
}

/** The item the plan needs most of relative to what is available. */
export function mostConstrainedItem(check: PlanCheck): ItemRequirement | null {
  let best: ItemRequirement | null = null;
  for (const i of check.items) {
    if (i.usage === null) continue;
    if (!best || (i.usage ?? 0) > (best.usage ?? 0)) best = i;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Inventory-constrained plans                                         */
/* ------------------------------------------------------------------ */

/**
 * Keeps the expected sales MIX and scales every product down by the same
 * factor until all inventory fits, then rounds down to whole units.
 * One feasible plan – not necessarily the most profitable one.
 * Products without a recipe stay at expected demand (flagged in the UI).
 */
export function proportionalPlan(products: ParsedProduct[], recipes: Record<string, RecipeEval>, stock: ParsedStockItem[]): { plan: Plan; scale: number } {
  const demand: Plan = Object.fromEntries(products.map((p) => [p.id, p.units]));
  const check = checkPlan(demand, products, recipes, stock);
  // Smallest available ÷ required ratio, kept as an exact fraction.
  let num = 1n;
  let den = 1n;
  for (const i of check.items) {
    if (i.requiredBase === 0) continue;
    const a = BigInt(i.availableBase);
    const r = BigInt(i.requiredBase);
    if (a * den < num * r) {
      num = a;
      den = r;
    }
  }
  const plan: Plan = {};
  for (const p of products) {
    const constrained = recipes[p.id]?.status === 'complete';
    plan[p.id] = constrained ? Number((BigInt(p.units) * num) / den) : p.units;
  }
  return { plan, scale: Number(num) / Number(den) };
}

/**
 * A simple rule of thumb: fill demand for products in order of contribution
 * margin per unit of the most constrained item, using whatever inventory is
 * left each time and respecting every item. This is a SUGGESTION – it is not
 * proven to be optimal when several items are limited.
 */
export function suggestedPlan(
  products: ParsedProduct[],
  recipes: Record<string, RecipeEval>,
  stock: ParsedStockItem[],
  bindingItemId: string | null,
): Plan {
  const remaining = new Map(stock.map((s) => [s.id, s.availableBase]));
  const ranking = bindingItemId ? contributionPerResource(bindingItemId, products, recipes, stock)?.ranking ?? [] : [];
  const rankIndex = new Map(ranking.map((r, i) => [r.productId, i]));
  const cm = (p: ParsedProduct) => toCents(p.price) - toCents(p.variableCost);

  const order = products
    .filter((p) => recipes[p.id]?.status === 'complete')
    .sort((a, b) => {
      const ra = rankIndex.get(a.id);
      const rb = rankIndex.get(b.id);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return cm(b) - cm(a);
    });

  const plan: Plan = {};
  for (const p of products) if (recipes[p.id]?.status !== 'complete') plan[p.id] = p.units;
  for (const p of order) {
    if (cm(p) <= 0) {
      plan[p.id] = 0; // producing it would reduce contribution margin
      continue;
    }
    let max = p.units;
    for (const line of recipes[p.id].lines) {
      const left = remaining.get(line.itemId) ?? 0;
      max = Math.min(max, Math.floor(left / line.requiredBase));
    }
    max = Math.max(0, max);
    plan[p.id] = max;
    for (const line of recipes[p.id].lines) {
      remaining.set(line.itemId, (remaining.get(line.itemId) ?? 0) - max * line.requiredBase);
    }
  }
  return plan;
}
