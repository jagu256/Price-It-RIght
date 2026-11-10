/**
 * Turns the business data the user typed (strings) into validated numbers.
 * Every section reads from this one model, so prices, costs and inventory
 * always agree across the app.
 *
 * Order matters: inventory → recipes → material costs → product variable costs.
 */
import { t, tx } from '../i18n/i18n';
import { businessSummary, type BusinessSummary, type ProductNumbers } from './business';
import { evaluateRecipe, materialCost, type MaterialCost, type RecipeEval } from './recipes';
import { normaliseName, validateStock, type ParsedStockItem, type StockErrors } from './stock';
import type { BusinessData, OtherCosts, ProductInput } from './types';
import { parseAmount, parseMoney, parseUnits } from './validation';

export type ProductField = 'name' | 'price' | 'variableCost' | 'units' | keyof OtherCosts;
export type ProductErrors = Partial<Record<ProductField, string>>;

export interface ParsedProduct extends ProductNumbers {
  category: string;
  costMode: ProductInput['costMode'];
  /** Direct material cost per unit from the recipe, if it can be calculated. */
  materialCost: number | null;
  /** Labour + packaging + payment fees + other (itemized mode only). */
  otherVariableCost: number;
}

export interface BusinessModel {
  data: BusinessData;
  fixedCosts: number | null;
  fixedError?: string;
  /** Valid products only. */
  products: ParsedProduct[];
  productErrors: Record<string, ProductErrors>;
  stock: ParsedStockItem[];
  stockById: Map<string, ParsedStockItem>;
  stockErrors: Record<string, StockErrors>;
  recipes: Record<string, RecipeEval>;
  materials: Record<string, MaterialCost>;
  /** True when fixed costs and every product are valid (inventory is checked separately). */
  financialsReady: boolean;
  /** Expected-demand summary – only when financialsReady. */
  summary: BusinessSummary | null;
}

const OTHER_LABELS: Record<keyof OtherCosts, string> = {
  labour: tx('variable labour cost'),
  packaging: tx('packaging cost'),
  paymentFees: tx('payment processing fee'),
  other: tx('other variable cost'),
};

/** Optional extra variable costs: blank means $0 (they are optional extras). */
function parseOtherCosts(o: OtherCosts, errors: ProductErrors): number {
  let total = 0;
  for (const key of Object.keys(OTHER_LABELS) as (keyof OtherCosts)[]) {
    if (o[key].trim() === '') continue;
    const r = parseAmount(o[key], OTHER_LABELS[key]);
    if (r.ok) total += Math.round(r.value * 100);
    else errors[key] = r.error;
  }
  return total / 100;
}

export function buildModel(data: BusinessData): BusinessModel {
  // 1. Inventory
  const stockResult = validateStock(data.inventory);
  const stockById = new Map(stockResult.items.map((s) => [s.id, s]));
  const recordNames = new Map(data.inventory.map((r) => [r.id, r.name.trim() || t('Unnamed item')]));

  // 2. Recipes and material costs
  const recipes: Record<string, RecipeEval> = {};
  const materials: Record<string, MaterialCost> = {};
  for (const p of data.products) {
    recipes[p.id] = evaluateRecipe(data.recipes[p.id], stockById, recordNames);
    materials[p.id] = materialCost(recipes[p.id], stockById);
  }

  // 3. Products
  const nameCount = new Map<string, number>();
  for (const p of data.products) {
    const k = normaliseName(p.name);
    if (k) nameCount.set(k, (nameCount.get(k) ?? 0) + 1);
  }
  const products: ParsedProduct[] = [];
  const productErrors: Record<string, ProductErrors> = {};
  for (const p of data.products) {
    const e: ProductErrors = {};
    const key = normaliseName(p.name);
    if (!key) e.name = t('Please enter a product name.');
    else if ((nameCount.get(key) ?? 0) > 1) e.name = t('Two products are called “{name}”. Please give each product a unique name.', { name: p.name.trim() });

    const price = parseMoney(p.price, 'sellingPrice');
    if (!price.ok) e.price = price.error;
    const units = parseUnits(p.units);
    if (!units.ok) e.units = units.error;

    const mat = materials[p.id];
    let variableCost: number | null = null;
    let other = 0;
    if (p.costMode === 'manual') {
      const vc = parseMoney(p.variableCost, 'variableCost');
      if (vc.ok) variableCost = vc.value;
      else e.variableCost = vc.error;
    } else {
      // Itemized: Variable Cost = Direct Materials + Other Variable Costs.
      other = parseOtherCosts(p.otherCosts, e);
      const recipe = recipes[p.id];
      if (recipe.status === 'missing') e.variableCost = t('Itemized costing needs a recipe. Add one in the Smart Inventory Hub, or switch to a manual cost.');
      else if (recipe.status === 'invalid') e.variableCost = t('Fix the errors in this product’s recipe to calculate its itemized cost.');
      else if (mat.total === null) e.variableCost = t('Missing purchase cost for {items}. Costs are never assumed to be $0.', { items: mat.missingCostItems.join(', ') });
      else variableCost = Math.round((mat.total + other) * 100) / 100; // rounded to the nearest cent
    }

    if (Object.keys(e).length > 0 || !price.ok || !units.ok || variableCost === null) {
      productErrors[p.id] = e;
      continue;
    }
    products.push({
      id: p.id,
      name: p.name.trim(),
      category: p.category.trim(),
      price: price.value,
      variableCost,
      units: units.value,
      costMode: p.costMode,
      materialCost: mat.total,
      otherVariableCost: other,
    });
  }

  const fixed = parseMoney(data.fixedCosts, 'fixedCosts');
  const financialsReady = fixed.ok && data.products.length > 0 && Object.keys(productErrors).length === 0;

  return {
    data,
    fixedCosts: fixed.ok ? fixed.value : null,
    fixedError: fixed.ok ? undefined : fixed.error,
    products,
    productErrors,
    stock: stockResult.items,
    stockById,
    stockErrors: stockResult.errors,
    recipes,
    materials,
    financialsReady,
    summary: financialsReady && fixed.ok ? businessSummary(products, fixed.value) : null,
  };
}
