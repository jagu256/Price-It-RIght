/**
 * 🧮 Exact product-mix optimizer (branch and bound).
 *
 * Goal: choose whole-unit production for each product to MAXIMISE total
 * contribution margin, subject to:
 *   • every inventory item: Σ (units × quantity per product) ≤ available
 *   • expected demand: 0 ≤ units ≤ expected units (unsold units earn nothing)
 *   • whole units only
 * Fixed costs are the same for every plan, so the plan with the most
 * contribution margin also has the most operating profit.
 *
 * Method: a depth-first search over the products, trying each possible
 * quantity. A branch is skipped only when an UPPER BOUND proves it can't beat
 * the best plan already found. The bound gives every remaining product the
 * most it could make on its own from the stock that is left – no real plan can
 * do better, so nothing better is ever skipped. If the search finishes, the
 * best plan found is PROVEN optimal. If it hits the node limit first, the best
 * plan so far is returned and labelled as NOT proven.
 *
 * Products without a complete recipe can't be checked against inventory, so
 * they are left at expected demand and reported; products with a contribution
 * margin of $0 or less are set to 0 (making them can never add contribution).
 */
import { toCents } from './business';
import type { ParsedProduct } from './model';
import type { Plan } from './planning';
import type { RecipeEval } from './recipes';
import type { ParsedStockItem } from './stock';

export const DEFAULT_NODE_LIMIT = 2_000_000;

export interface OptimizerResult {
  /** 'proven-optimal' only when the whole search finished. */
  status: 'proven-optimal' | 'not-proven';
  plan: Plan;
  /** Total contribution margin of the products the optimizer chose (recipe products). */
  optimizedCM: number;
  /** Search steps used. */
  nodes: number;
  /** Left at expected demand because they have no recipe (not checked against stock). */
  unchecked: string[];
  /** Set to 0 because each unit would earn $0 or less contribution. */
  zeroMargin: string[];
}

interface Candidate {
  id: string;
  cmC: number;
  demand: number;
  /** [stock index, quantity per unit] – one entry per inventory item used. */
  uses: [number, number][];
}

export function optimalMix(products: ParsedProduct[], recipes: Record<string, RecipeEval>, stock: ParsedStockItem[], nodeLimit = DEFAULT_NODE_LIMIT): OptimizerResult {
  const index = new Map(stock.map((s, i) => [s.id, i]));
  const plan: Plan = {};
  const unchecked: string[] = [];
  const zeroMargin: string[] = [];
  const candidates: Candidate[] = [];

  for (const p of products) {
    const recipe = recipes[p.id];
    const cmC = toCents(p.price) - toCents(p.variableCost);
    if (!recipe || recipe.status !== 'complete') {
      plan[p.id] = p.units;
      if (p.units > 0) unchecked.push(p.name);
      continue;
    }
    if (cmC <= 0) {
      plan[p.id] = 0;
      if (p.units > 0) zeroMargin.push(p.name);
      continue;
    }
    // Add up the quantity of each item per unit (a recipe could list an item twice).
    const perItem = new Map<number, number>();
    for (const line of recipe.lines) {
      const i = index.get(line.itemId);
      if (i === undefined || line.requiredBase <= 0) continue;
      perItem.set(i, (perItem.get(i) ?? 0) + line.requiredBase);
    }
    candidates.push({ id: p.id, cmC, demand: p.units, uses: [...perItem.entries()] });
    plan[p.id] = 0;
  }

  // Trying higher-margin products first finds good plans early, so more branches are skipped.
  candidates.sort((a, b) => b.cmC - a.cmC);
  const remaining = stock.map((s) => s.availableBase);
  const n = candidates.length;

  /** Most units of one product that fit in what is left (and demand). */
  const capacity = (c: Candidate) => {
    let max = c.demand;
    for (const [i, q] of c.uses) max = Math.min(max, Math.floor(remaining[i] / q));
    return Math.max(0, max);
  };

  const current = new Array<number>(n).fill(0);
  let best: number[] = new Array<number>(n).fill(0);
  let bestCM = 0;
  let nodes = 0;
  let stopped = false;

  const search = (k: number, cmSoFar: number) => {
    if (stopped) return;
    if (++nodes > nodeLimit) {
      stopped = true;
      return;
    }
    if (cmSoFar > bestCM) {
      bestCM = cmSoFar;
      best = current.slice();
    }
    if (k === n) return;
    // Upper bound: every remaining product makes the most it could on its own.
    let bound = cmSoFar;
    for (let j = k; j < n; j++) bound += candidates[j].cmC * capacity(candidates[j]);
    if (bound <= bestCM) return; // nothing below here can beat the best plan
    const c = candidates[k];
    for (let u = capacity(c); u >= 0; u--) {
      for (const [i, q] of c.uses) remaining[i] -= u * q;
      current[k] = u;
      search(k + 1, cmSoFar + u * c.cmC);
      for (const [i, q] of c.uses) remaining[i] += u * q;
      current[k] = 0;
      if (stopped) return;
    }
  };
  search(0, 0);

  candidates.forEach((c, i) => (plan[c.id] = best[i]));
  return { status: stopped ? 'not-proven' : 'proven-optimal', plan, optimizedCM: bestCM / 100, nodes: Math.min(nodes, nodeLimit), unchecked, zeroMargin };
}
