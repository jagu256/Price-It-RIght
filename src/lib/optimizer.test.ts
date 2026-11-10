import { describe, expect, it } from 'vitest';
import { buildModel, type ParsedProduct } from './model';
import { optimalMix } from './optimizer';
import { checkPlan, planFinancials, suggestedPlan, mostConstrainedItem, type Plan } from './planning';
import type { RecipeEval } from './recipes';
import { sampleBusiness } from './samples';
import type { ParsedStockItem } from './stock';
import type { BusinessData } from './types';

/* ------------------------------------------------------------------ */
/* An independent brute-force check: tries EVERY whole-unit plan.       */
/* Written separately from the optimizer and shares none of its code.   */
/* ------------------------------------------------------------------ */
interface Toy {
  cm: number[]; // cents per unit
  demand: number[];
  use: number[][]; // use[product][item] per unit
  available: number[];
}
function bruteForce(t: Toy): number {
  let best = 0;
  const units = new Array(t.cm.length).fill(0);
  const visit = (k: number) => {
    if (k === t.cm.length) {
      for (let i = 0; i < t.available.length; i++) {
        let need = 0;
        for (let p = 0; p < t.cm.length; p++) need += units[p] * t.use[p][i];
        if (need > t.available[i]) return;
      }
      best = Math.max(best, units.reduce((s, u, p) => s + u * t.cm[p], 0));
      return;
    }
    for (let u = 0; u <= t.demand[k]; u++) {
      units[k] = u;
      visit(k + 1);
    }
    units[k] = 0;
  };
  visit(0);
  return best;
}

/** Turns a toy problem into the app's own data shapes. */
function asApp(t: Toy) {
  const stock = t.available.map((a, i) => ({ id: `i${i}`, name: `Item ${i}`, availableBase: a, dimension: 'mass' }) as ParsedStockItem);
  const products = t.cm.map((c, p) => ({ id: `p${p}`, name: `P${p}`, price: (c + 100) / 100, variableCost: 1, units: t.demand[p] }) as ParsedProduct);
  const recipes: Record<string, RecipeEval> = Object.fromEntries(
    products.map((p, k) => [
      p.id,
      { status: 'complete', errors: {}, lines: t.use[k].map((q, i) => ({ lineId: `l${k}${i}`, itemId: `i${i}`, itemName: `Item ${i}`, dimension: 'mass', requiredBase: q })).filter((l) => l.requiredBase > 0) } as RecipeEval,
    ]),
  );
  return { stock, products, recipes };
}

const feasible = (plan: Plan, t: Toy) =>
  t.available.every((a, i) => t.cm.reduce((s, _, p) => s + plan[`p${p}`] * t.use[p][i], 0) <= a) && t.demand.every((d, p) => plan[`p${p}`] >= 0 && plan[`p${p}`] <= d && Number.isInteger(plan[`p${p}`]));

describe('optimizer agrees with brute force', () => {
  it('on 300 random small problems (2–4 products, 1–3 shared items)', () => {
    let seed = 12345;
    const rnd = (n: number) => (seed = (seed * 48271) % 2147483647) % n;
    for (let trial = 0; trial < 300; trial++) {
      const nP = 2 + rnd(3);
      const nI = 1 + rnd(3);
      const t: Toy = {
        cm: Array.from({ length: nP }, () => 1 + rnd(500)),
        demand: Array.from({ length: nP }, () => rnd(nP === 4 ? 7 : 11)),
        use: Array.from({ length: nP }, () => Array.from({ length: nI }, () => rnd(6) * 1000)),
        available: Array.from({ length: nI }, () => rnd(30) * 1000),
      };
      // Every product must use something, or it is unlimited by stock (still fine, but keep it realistic).
      for (const row of t.use) if (row.every((q) => q <= 0)) row[0] = 1000;
      const { stock, products, recipes } = asApp(t);
      const r = optimalMix(products, recipes, stock);
      expect(r.status).toBe('proven-optimal');
      expect(Math.round(r.optimizedCM * 100)).toBe(bruteForce(t));
      expect(feasible(r.plan, t)).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */

function bakeryChallenge(): BusinessData {
  return {
    type: 'bakery',
    name: 'Maple & Moss (fictional)',
    isDemo: false,
    fixedCosts: '550',
    products: [
      ['Muffin', '4', '1.50', '150'],
      ['Croissant', '5', '2', '120'],
      ['Cookie', '3', '1', '200'],
    ].map(([name, price, variableCost, units], k) => ({ id: `p${k}`, name, category: '', price, variableCost, units, costMode: 'manual', otherCosts: { labour: '', packaging: '', paymentFees: '', other: '' } })),
    inventory: [
      { id: 'flour', name: 'Flour', quantity: '20000', unit: 'g', cost: '' },
      { id: 'butter', name: 'Butter', quantity: '4000', unit: 'g', cost: '' },
    ],
    recipes: {
      p0: [{ id: 'r1', itemId: 'flour', quantity: '100', unit: 'g' }, { id: 'r2', itemId: 'butter', quantity: '20', unit: 'g' }],
      p1: [{ id: 'r3', itemId: 'flour', quantity: '80', unit: 'g' }, { id: 'r4', itemId: 'butter', quantity: '40', unit: 'g' }],
      p2: [{ id: 'r5', itemId: 'flour', quantity: '50', unit: 'g' }, { id: 'r6', itemId: 'butter', quantity: '10', unit: 'g' }],
    },
  };
}

describe('optimizer – the Expert challenge bakery (20 kg flour, 4 kg butter)', () => {
  const m = buildModel(bakeryChallenge());
  const r = optimalMix(m.products, m.recipes, m.stock);

  it('matches a brute-force search of all 151 × 121 × 201 plans', () => {
    const t: Toy = { cm: [250, 300, 200], demand: [150, 120, 200], use: [[100_000, 20_000], [80_000, 40_000], [50_000, 10_000]], available: [20_000_000, 4_000_000] };
    expect(r.status).toBe('proven-optimal');
    expect(Math.round(r.optimizedCM * 100)).toBe(bruteForce(t));
  });

  it('the plan fits the inventory and demand, and beats the labelled heuristic', () => {
    const check = checkPlan(r.plan, m.products, m.recipes, m.stock);
    expect(check.feasibility).toBe('feasible');
    const demand = Object.fromEntries(m.products.map((p) => [p.id, p.units]));
    const binding = mostConstrainedItem(checkPlan(demand, m.products, m.recipes, m.stock))?.itemId ?? null;
    const heuristic = planFinancials(suggestedPlan(m.products, m.recipes, m.stock, binding), m.products, 550).summary.totalCM;
    expect(r.optimizedCM).toBeGreaterThanOrEqual(heuristic);
  });
});

describe('optimizer – the demo café', () => {
  const m = buildModel(sampleBusiness('demo', (p) => `${p}-${Math.random()}`));
  const r = optimalMix(m.products, m.recipes, m.stock);

  it('is proven optimal, fits every item and never exceeds demand', () => {
    expect(r.status).toBe('proven-optimal');
    expect(checkPlan(r.plan, m.products, m.recipes, m.stock).feasibility).not.toBe('infeasible');
    for (const p of m.products) expect(r.plan[p.id]).toBeLessThanOrEqual(p.units);
  });

  it('agrees with a brute-force search (all plans of the first three products, the last filled as far as stock allows)', () => {
    const recipeProducts = m.products.filter((p) => m.recipes[p.id]?.status === 'complete');
    const idx = new Map(m.stock.map((s, i) => [s.id, i]));
    const use = recipeProducts.map((p) => {
      const row = new Array(m.stock.length).fill(0);
      for (const l of m.recipes[p.id].lines) row[idx.get(l.itemId)!] += l.requiredBase;
      return row;
    });
    const cm = recipeProducts.map((p) => Math.round(p.price * 100) - Math.round(p.variableCost * 100));
    const avail = m.stock.map((s) => s.availableBase);
    let best = 0;
    const n = recipeProducts.length;
    const units = new Array(n).fill(0);
    const visit = (k: number) => {
      if (k === n - 1) {
        // With a positive margin, the best choice for the last product is the most that fits.
        let last = recipeProducts[k].units;
        for (let i = 0; i < avail.length; i++) {
          const used = units.slice(0, k).reduce((s, u, p) => s + u * use[p][i], 0);
          if (used > avail[i]) return;
          if (use[k][i] > 0) last = Math.min(last, Math.floor((avail[i] - used) / use[k][i]));
        }
        best = Math.max(best, units.slice(0, k).reduce((s, u, p) => s + u * cm[p], 0) + last * cm[k]);
        return;
      }
      for (let u = 0; u <= recipeProducts[k].units; u++) {
        units[k] = u;
        visit(k + 1);
      }
      units[k] = 0;
    };
    visit(0);
    expect(cm.every((c) => c > 0)).toBe(true);
    expect(Math.round(r.optimizedCM * 100)).toBe(best);
  });
});

describe('optimizer – honest labels and edge cases', () => {
  it('a search stopped by the limit is labelled NOT proven, but still returns a plan that fits', () => {
    const m = buildModel(bakeryChallenge());
    const r = optimalMix(m.products, m.recipes, m.stock, 5);
    expect(r.status).toBe('not-proven');
    expect(checkPlan(r.plan, m.products, m.recipes, m.stock).feasibility).toBe('feasible');
  });

  it('products without a recipe stay at demand and are reported; $0-margin products are set to 0', () => {
    const data = bakeryChallenge();
    data.products.push({ ...data.products[0], id: 'p3', name: 'Tea', price: '2', variableCost: '2', units: '50' });
    data.recipes.p3 = [{ id: 'r7', itemId: 'flour', quantity: '1', unit: 'g' }];
    data.products.push({ ...data.products[0], id: 'p4', name: 'Gift card', price: '25', variableCost: '20', units: '10' });
    const m = buildModel(data);
    const r = optimalMix(m.products, m.recipes, m.stock);
    expect(r.plan.p3).toBe(0);
    expect(r.zeroMargin).toEqual(['Tea']);
    expect(r.plan.p4).toBe(10);
    expect(r.unchecked).toEqual(['Gift card']);
  });

  it('no inventory left: everything that uses stock is 0', () => {
    const data = bakeryChallenge();
    data.inventory = data.inventory.map((i) => ({ ...i, quantity: '0' }));
    const m = buildModel(data);
    const r = optimalMix(m.products, m.recipes, m.stock);
    expect(r).toMatchObject({ status: 'proven-optimal', optimizedCM: 0, plan: { p0: 0, p1: 0, p2: 0 } });
  });
});
