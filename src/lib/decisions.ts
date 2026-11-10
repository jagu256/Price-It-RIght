/**
 * 🧭 Decisions: special orders and make-or-buy, using RELEVANT costs only.
 *
 * Special order:
 *   Incremental profit = (offered price − variable cost) × order units
 *                        − extra one-time costs
 *                        − contribution margin lost on displaced regular sales
 *   Fixed costs don't change, so they are not part of the decision.
 *   Inventory: the order is only achievable if every inventory item the
 *   product uses can cover regular demand (all products sharing that item)
 *   PLUS the order, using the same shared-inventory check as the planner.
 *
 * Make or buy:
 *   Relevant cost to make = variable cost × units + avoidable fixed costs + opportunity cost
 *   Cost to buy           = purchase price × units
 *   Unavoidable fixed costs are paid either way, so they are irrelevant.
 *
 * Money is worked in whole cents.
 */
import { toCents } from './business';
import type { Dimension } from './inventory';
import type { BusinessModel, ParsedProduct } from './model';
import { checkPlan, type Plan } from './planning';

export type Decision = 'accept' | 'reject' | 'indifferent';

/* ------------------------------------------------------------------ */
/* Special order                                                       */
/* ------------------------------------------------------------------ */

export interface SpecialOrderInput {
  orderUnits: number;
  offeredPrice: number;
  extraCosts: number;
  /** Regular sales of this product that the order would replace (0 if none). */
  lostRegularUnits: number;
}

export interface SpecialOrderResult {
  /** Offered price − variable cost per unit. */
  orderCMPerUnit: number;
  /** Order CM per unit × order units. */
  orderCM: number;
  extraCosts: number;
  /** Regular price − variable cost per unit. */
  regularCMPerUnit: number;
  /** Regular CM per unit × lost regular units. */
  lostCM: number;
  incrementalProfit: number;
  /** Accept if incremental profit > $0 – the qualitative factors still matter. */
  decision: Decision;
}

export function specialOrder(product: ParsedProduct, input: SpecialOrderInput): SpecialOrderResult {
  const vcC = toCents(product.variableCost);
  const orderCMPerUnitC = toCents(input.offeredPrice) - vcC;
  const regularCMPerUnitC = toCents(product.price) - vcC;
  const orderCMC = orderCMPerUnitC * input.orderUnits;
  const lostCMC = regularCMPerUnitC * input.lostRegularUnits;
  const extraC = toCents(input.extraCosts);
  const incC = orderCMC - extraC - lostCMC;
  return {
    orderCMPerUnit: orderCMPerUnitC / 100,
    orderCM: orderCMC / 100,
    extraCosts: extraC / 100,
    regularCMPerUnit: regularCMPerUnitC / 100,
    lostCM: lostCMC / 100,
    incrementalProfit: incC / 100,
    decision: incC > 0 ? 'accept' : incC < 0 ? 'reject' : 'indifferent',
  };
}

export interface Shortage {
  name: string;
  dimension: Dimension;
  /** Thousandths of g / mL / piece. */
  shortageBase: number;
  /** True when regular demand alone is already short of this item. */
  alreadyShort: boolean;
}

export type OrderInventoryCheck =
  | { status: 'not-checked'; reason: string }
  | { status: 'no-recipe' }
  | {
      status: 'feasible' | 'infeasible';
      /** Shortages of items the ordered product uses (these make the order infeasible). */
      shortages: Shortage[];
      /** Items the product does NOT use that regular demand is already short of (not caused by the order). */
      otherShortages: Shortage[];
      /** Products without a recipe – their use of shared items is unknown. */
      unknownProducts: string[];
    };

/**
 * Can stock cover regular demand plus the order? Regular demand = every
 * product's expected units, with the lost regular units taken off this product.
 */
export function specialOrderInventory(model: BusinessModel, productId: string, orderUnits: number, lostRegularUnits: number): OrderInventoryCheck {
  if (model.data.inventory.length === 0) return { status: 'not-checked', reason: 'No inventory has been entered, so the order could not be checked against stock.' };
  if (Object.keys(model.stockErrors).length > 0) return { status: 'not-checked', reason: 'Some inventory records have errors, so the order could not be checked against stock.' };
  const recipe = model.recipes[productId];
  if (!recipe || recipe.status !== 'complete') return { status: 'no-recipe' };

  const regular: Plan = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
  const withOrder: Plan = { ...regular, [productId]: Math.max(0, (regular[productId] ?? 0) - lostRegularUnits) + orderUnits };
  const before = checkPlan(regular, model.products, model.recipes, model.stock);
  const after = checkPlan(withOrder, model.products, model.recipes, model.stock);
  const used = new Set(recipe.lines.map((l) => l.itemId));
  const shortBefore = new Set(before.items.filter((i) => i.shortageBase > 0).map((i) => i.itemId));

  const toShortage = (i: (typeof after.items)[number]): Shortage => ({ name: i.name, dimension: i.dimension, shortageBase: i.shortageBase, alreadyShort: shortBefore.has(i.itemId) });
  const shortages = after.items.filter((i) => used.has(i.itemId) && i.shortageBase > 0).map(toShortage);
  const otherShortages = after.items.filter((i) => !used.has(i.itemId) && i.shortageBase > 0).map(toShortage);
  return {
    status: shortages.length > 0 ? 'infeasible' : 'feasible',
    shortages,
    otherShortages,
    unknownProducts: after.unknownProducts,
  };
}

/* ------------------------------------------------------------------ */
/* Make or buy                                                         */
/* ------------------------------------------------------------------ */

export interface MakeOrBuyInput {
  /** Units needed (whole number, at least 1). */
  units: number;
  /** Supplier's price per unit. */
  purchasePrice: number;
  /** Variable cost to make one unit. */
  variableCostPerUnit: number;
  /** Fixed costs that would disappear if you bought instead. */
  avoidableFixedCosts: number;
  /** Fixed costs you pay either way – shown, but irrelevant. */
  unavoidableFixedCosts: number;
  /** Contribution you give up by using your capacity to make it (0 if none). */
  opportunityCost: number;
}

export interface MakeOrBuyResult {
  makeVariableCost: number;
  /** Variable cost + avoidable fixed + opportunity cost. */
  relevantCostToMake: number;
  costToBuy: number;
  /** Cost to buy − relevant cost to make. Positive: making saves this much. */
  savingFromMaking: number;
  decision: 'make' | 'buy' | 'indifferent';
  unavoidableFixedCosts: number;
}

export function makeOrBuy(i: MakeOrBuyInput): MakeOrBuyResult {
  const variableC = toCents(i.variableCostPerUnit) * i.units;
  const makeC = variableC + toCents(i.avoidableFixedCosts) + toCents(i.opportunityCost);
  const buyC = toCents(i.purchasePrice) * i.units;
  const diffC = buyC - makeC;
  return {
    makeVariableCost: variableC / 100,
    relevantCostToMake: makeC / 100,
    costToBuy: buyC / 100,
    savingFromMaking: diffC / 100,
    decision: diffC > 0 ? 'make' : diffC < 0 ? 'buy' : 'indifferent',
    unavoidableFixedCosts: toCents(i.unavoidableFixedCosts) / 100,
  };
}
