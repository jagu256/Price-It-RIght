/**
 * Product recipes: how much of each inventory item one product uses, and the
 * direct material cost that follows from inventory purchase costs.
 */
import { t } from '../i18n/i18n';
import { UNITS, formatQuantity, parseQuantity, toBase, type Dimension } from './inventory';
import type { ParsedStockItem } from './stock';
import type { RecipeLineInput } from './types';

export interface ParsedRecipeLine {
  lineId: string;
  itemId: string;
  itemName: string;
  dimension: Dimension;
  /** Quantity per product in thousandths of the base unit. */
  requiredBase: number;
}

export type RecipeStatus = 'complete' | 'missing' | 'invalid';

export interface RecipeEval {
  status: RecipeStatus;
  lines: ParsedRecipeLine[];
  /** lineId → message */
  errors: Record<string, string>;
}

/**
 * A recipe is "complete" when it has at least one line and every line is valid.
 * No lines = "missing": the product's inventory requirements are unknown, and
 * the app never invents them.
 */
export function evaluateRecipe(lines: RecipeLineInput[] | undefined, stockById: Map<string, ParsedStockItem>, recordNames: Map<string, string>): RecipeEval {
  if (!lines || lines.length === 0) return { status: 'missing', lines: [], errors: {} };
  const errors: Record<string, string> = {};
  const parsed: ParsedRecipeLine[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const name = recordNames.get(line.itemId);
    if (name === undefined) {
      errors[line.id] = t('This inventory item no longer exists. Choose another item or remove the line.');
      continue;
    }
    if (seen.has(line.itemId)) {
      errors[line.id] = t('{name} is listed twice in this recipe. Combine them into one line.', { name });
      continue;
    }
    seen.add(line.itemId);
    const q = parseQuantity(line.quantity, 'required');
    if (!q.ok) {
      errors[line.id] = q.error;
      continue;
    }
    const item = stockById.get(line.itemId);
    if (!item) {
      errors[line.id] = t('Fix the inventory record for {name} first.', { name });
      continue;
    }
    if (UNITS[line.unit].dimension !== item.dimension) {
      errors[line.id] = t('{name} is measured in {unit}, so this line can’t use {other}.', { name, unit: t(UNITS[item.unit].plural), other: t(UNITS[line.unit].plural) });
      continue;
    }
    parsed.push({ lineId: line.id, itemId: item.id, itemName: item.name, dimension: item.dimension, requiredBase: toBase(q.value, line.unit) });
  }
  const status: RecipeStatus = Object.keys(errors).length > 0 ? 'invalid' : 'complete';
  return { status, lines: parsed, errors };
}

export interface MaterialLineCost {
  itemId: string;
  itemName: string;
  quantityText: string;
  /** Cost of this line per product, or null if the item's purchase cost is unknown. */
  cost: number | null;
}

export interface MaterialCost {
  lines: MaterialLineCost[];
  /** Total direct material cost per product, or null if any cost is unknown. */
  total: number | null;
  missingCostItems: string[];
}

/** Material Cost Per Product = Σ (quantity required × cost per compatible unit). */
export function materialCost(recipe: RecipeEval, stockById: Map<string, ParsedStockItem>): MaterialCost {
  const lines = recipe.lines.map((l) => {
    const item = stockById.get(l.itemId);
    const perBase = item?.costPerBaseUnit ?? null;
    return {
      itemId: l.itemId,
      itemName: l.itemName,
      quantityText: formatQuantity(l.requiredBase, l.dimension, 'short'),
      cost: perBase === null ? null : (l.requiredBase / 1000) * perBase,
    };
  });
  const missingCostItems = lines.filter((l) => l.cost === null).map((l) => l.itemName);
  const total = missingCostItems.length > 0 || recipe.status !== 'complete' ? null : lines.reduce((s, l) => s + (l.cost ?? 0), 0);
  return { lines, total, missingCostItems };
}
