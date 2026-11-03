import { useStore } from '../app/StoreContext';
import { formatCAD } from '../lib/format';
import { checkPlan, planFinancials, proportionalPlan } from '../lib/planning';
import { resolveScenario } from '../lib/pricing';
import { SignedMoney } from './ui';

/**
 * Three different profit figures that must not be mixed up:
 * expected (demand), inventory-constrained (what stock allows) and scenario (modified assumptions).
 */
export default function ProfitLenses() {
  const { state, model } = useStore();
  const s = model.summary;
  if (!s || model.fixedCosts === null) return null;

  const stockOk = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const hasRecipes = Object.values(model.recipes).some((r) => r.status === 'complete');
  let constrained: { profit: number; note: string } | null = null;
  if (stockOk && hasRecipes) {
    const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
    const check = checkPlan(demand, model.products, model.recipes, model.stock);
    if (check.feasibility === 'infeasible') {
      const { plan } = proportionalPlan(model.products, model.recipes, model.stock);
      constrained = { profit: planFinancials(plan, model.products, model.fixedCosts).summary.operatingProfit, note: 'Inventory can’t cover expected demand. This keeps your mix and scales down to what stock allows.' };
    } else {
      constrained = { profit: s.operatingProfit, note: check.feasibility === 'feasible' ? 'Your inventory covers expected demand, so this equals expected profit.' : 'No shortages found, but some products have no recipe and were not checked.' };
    }
  }

  const scenario = resolveScenario(model.products, model.fixedCosts, state.scenario);
  const scenarioProfit = scenario.changed && scenario.summary ? scenario.summary.operatingProfit : null;

  const lenses = [
    { title: 'Expected Profit', value: s.operatingProfit, note: 'Based on the expected customer demand you entered.', href: '#my-business' },
    constrained
      ? { title: 'Inventory-Constrained Profit', value: constrained.profit, note: constrained.note, href: '#planner' }
      : { title: 'Inventory-Constrained Profit', value: null, note: 'Add inventory and recipes in the Smart Inventory Hub to see what your stock allows.', href: '#inventory' },
    scenarioProfit !== null
      ? { title: 'Scenario Profit', value: scenarioProfit, note: 'Based on the modified assumptions in the Pricing Lab (not applied).', href: '#pricing' }
      : { title: 'Scenario Profit', value: null, note: 'Try a what-if scenario in the Pricing Lab.', href: '#pricing' },
  ];

  return (
    <section aria-labelledby="lenses-title" className="space-y-3">
      <h3 id="lenses-title" className="text-xl font-bold text-sage-900">Three ways to look at profit</h3>
      <div className="grid gap-3 md:grid-cols-3">
        {lenses.map((l) => (
          <a key={l.title} href={l.href} className="card block p-4 transition hover:-translate-y-0.5 hover:shadow-lift">
            <p className="text-xs font-bold uppercase tracking-wider text-sage-600">{l.title}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums">
              {l.value === null ? <span className="text-sage-400">—</span> : <SignedMoney value={l.value} text={formatCAD(l.value)} />}
            </p>
            <p className="mt-1 text-sm text-sage-700">{l.note}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
