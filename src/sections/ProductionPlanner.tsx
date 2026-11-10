import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import ChartContainer from '../components/ChartContainer';
import { useStore } from '../app/StoreContext';
import ShowMath from '../components/ShowMath';
import { CellInput, ErrorList, Notice, SectionHeader, SignedMoney, StatusPill, SubHeader } from '../components/ui';
import { formatCAD, formatSignedCAD } from '../lib/format';
import { UNITS, formatQuantity, parseQuantity, toBase } from '../lib/inventory';
import {
  checkPlan,
  contributionPerResource,
  mostConstrainedItem,
  planFinancials,
  proportionalPlan,
  resourceUnitLabel,
  suggestedPlan,
  type Plan,
  type PlanCheck,
  type PlanFinancials,
} from '../lib/planning';
import { summaryMath } from '../lib/showMath';
import { parseUnits } from '../lib/validation';

export default function ProductionPlanner() {
  const { model } = useStore();
  const stockOk = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const anyRecipe = Object.values(model.recipes).some((r) => r.status === 'complete');
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <SectionHeader emoji="🏆" title="What Should I Produce More Of?" subtitle="Discover which products make the best use of your limited inventory." />
      {!model.summary ? (
        <Notice tone="error">Fix the highlighted numbers in 🏠 My Business first.</Notice>
      ) : !stockOk || !anyRecipe ? (
        <Notice tone="warn" title="Inventory and recipes needed">Add valid inventory and at least one product recipe in the 📦 Smart Inventory Hub to plan production.</Notice>
      ) : (
        <Planner />
      )}
    </div>
  );
}

function Planner() {
  const { state, dispatch, model } = useStore();
  const fixed = model.fixedCosts!;
  const demand: Plan = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
  const originalCheck = checkPlan(demand, model.products, model.recipes, model.stock);
  const binding = mostConstrainedItem(originalCheck);
  const [resourceId, setResourceId] = useState<string | null>(null);
  const resource = resourceId ?? binding?.itemId ?? model.stock[0]?.id ?? null;

  // Modified plan (kept separate from the business until the user changes their expected sales).
  const unitErrors: Record<string, string> = {};
  const plan: Plan = {};
  for (const p of model.products) {
    const raw = state.planner.units[p.id];
    if (raw === undefined) plan[p.id] = p.units;
    else {
      const r = parseUnits(raw);
      if (r.ok) plan[p.id] = r.value;
      else unitErrors[p.id] = r.error;
    }
  }
  const extraErrors: Record<string, string> = {};
  const extraBase: Record<string, number> = {};
  for (const s of model.stock) {
    const raw = state.planner.extra[s.id];
    if (!raw || raw.trim() === '') continue;
    const r = parseQuantity(raw, 'available');
    if (r.ok) extraBase[s.id] = toBase(r.value, s.unit);
    else extraErrors[s.id] = r.error;
  }
  const valid = Object.keys(unitErrors).length === 0 && Object.keys(extraErrors).length === 0;
  const modifiedCheck = valid ? checkPlan(plan, model.products, model.recipes, model.stock, extraBase) : null;
  const original = planFinancials(demand, model.products, fixed);
  const modified = valid ? planFinancials(plan, model.products, fixed) : null;

  const fill = (p: Plan) => dispatch({ type: 'planner-fill', units: p });

  return (
    <>
      <ResourceRanking resource={resource} setResource={setResourceId} bindingId={binding?.itemId ?? null} />

      <section aria-labelledby="sim-title" className="space-y-4">
        <SubHeader id="sim-title" emoji="🧪" title="Production Plan Simulator" subtitle="Change planned production and try extra (hypothetical) inventory. Your business plan is not changed." />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-small" onClick={() => dispatch({ type: 'planner-reset' })}>↺ Expected demand (original)</button>
          <button type="button" className="btn-small" onClick={() => fill(proportionalPlan(model.products, model.recipes, model.stock).plan)}>⚖️ Keep my mix, fit inventory</button>
          <button type="button" className="btn-small" onClick={() => fill(suggestedPlan(model.products, model.recipes, model.stock, resource))}>💡 Suggested plan</button>
        </div>
        <p className="text-xs text-sage-600">
          “Keep my mix” scales every product down by the same percentage until inventory fits. “Suggested plan” fills demand in order of contribution per unit of
          the selected scarce item while respecting every item – a rule of thumb, <strong>not proven optimal</strong>. When several items are limited, other plans may earn more.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="data-table min-w-[26rem]">
              <caption className="mb-2 text-left font-semibold text-sage-900">Planned production per month</caption>
              <thead><tr><th scope="col">Product</th><th scope="col" className="text-right">Demand</th><th scope="col">Planned</th></tr></thead>
              <tbody>
                {model.products.map((p) => (
                  <tr key={p.id}>
                    <th scope="row" className="font-semibold">
                      {p.name}
                      {model.recipes[p.id]?.status !== 'complete' && <span className="block text-xs font-normal text-butter-700">No recipe – inventory not checked</span>}
                      <ErrorList messages={[unitErrors[p.id]]} />
                    </th>
                    <td className="text-right">{p.units.toLocaleString('en-CA')}</td>
                    <td><CellInput id={`plan-${p.id}`} label={`Planned production of ${p.name}`} inputMode="numeric" value={state.planner.units[p.id] ?? String(p.units)} invalid={!!unitErrors[p.id]} onChange={(v) => dispatch({ type: 'planner-set-units', productId: p.id, value: v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="data-table min-w-[26rem]">
              <caption className="mb-2 text-left font-semibold text-sage-900">What if I had more inventory? (hypothetical)</caption>
              <thead><tr><th scope="col">Item</th><th scope="col" className="text-right">Have</th><th scope="col">Extra</th></tr></thead>
              <tbody>
                {model.stock.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="font-semibold">{s.name}<ErrorList messages={[extraErrors[s.id]]} /></th>
                    <td className="text-right">{formatQuantity(s.availableBase, s.dimension, 'short')}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <CellInput id={`extra-${s.id}`} label={`Extra ${s.name} in ${UNITS[s.unit].plural}`} placeholder="0" value={state.planner.extra[s.id] ?? ''} invalid={!!extraErrors[s.id]} onChange={(v) => dispatch({ type: 'planner-set-extra', itemId: s.id, value: v })} />
                        <span className="text-xs text-sage-600">{UNITS[s.unit].short}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <Notice tone="info">
          Buying inventory is a cash payment, not an expense. Its cost is recognised (as part of variable cost per unit) only when products are sold, so extra
          inventory here does not reduce operating profit by itself.
        </Notice>

        {modified && modifiedCheck ? <Comparison original={original} originalCheck={originalCheck} modified={modified} modifiedCheck={modifiedCheck} /> : <Notice tone="error">Fix the highlighted values to compare plans.</Notice>}
      </section>

      {modifiedCheck && <Alerts check={modifiedCheck} plan={plan} />}
    </>
  );
}

function ResourceRanking({ resource, setResource, bindingId }: { resource: string | null; setResource: (id: string) => void; bindingId: string | null }) {
  const { model } = useStore();
  const r = resource ? contributionPerResource(resource, model.products, model.recipes, model.stock) : null;
  if (!r) return null;
  const unit = resourceUnitLabel(r.item.dimension);
  const data = r.ranking.map((x) => ({ name: x.name, value: x.cmPerResourceUnit }));
  const [a, b] = r.ranking;

  return (
    <section aria-labelledby="rank-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader id="rank-title" emoji="🥇" title="Contribution margin per unit of a scarce resource" subtitle="CM per unit ÷ amount of the scarce item used. When ONE item limits production, this shows which products use it best." />
      <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        Scarce inventory item
        <select className="select" value={resource ?? ''} onChange={(e) => setResource(e.target.value)}>
          {model.stock.map((s) => <option key={s.id} value={s.id}>{s.name}{s.id === bindingId ? ' (most constrained)' : ''}</option>)}
        </select>
      </label>
      {r.ranking.length === 0 ? (
        <p className="text-sage-700">No product with a complete recipe uses {r.item.name}.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[28rem]">
              <caption className="sr-only">Contribution per unit of {r.item.name}</caption>
              <thead><tr><th scope="col">Product</th><th scope="col" className="text-right">CM / unit</th><th scope="col" className="text-right">{r.item.name} used</th><th scope="col" className="text-right">CM per {unit}</th></tr></thead>
              <tbody>
                {r.ranking.map((x) => (
                  <tr key={x.productId}>
                    <th scope="row" className="font-semibold">{x.name}</th>
                    <td className="text-right"><SignedMoney value={x.cmPerUnit} text={formatCAD(x.cmPerUnit)} /></td>
                    <td className="text-right">{formatQuantity(x.usedBase, r.item.dimension, 'short')}</td>
                    <td className="text-right font-bold"><SignedMoney value={x.cmPerResourceUnit} text={formatCAD(x.cmPerResourceUnit)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <figure className="h-56" role="img" aria-label={`Bar chart of contribution margin per ${unit} of ${r.item.name}`}>
            <ChartContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCAD(v)} stroke="#3E5A40" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} stroke="#3E5A40" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatCAD(v), `CM per ${unit} of ${r.item.name}`]} contentStyle={{ borderRadius: 16 }} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {data.map((d, i) => <Cell key={d.name} fill={d.value < 0 ? '#A8324F' : i === 0 ? '#3E5A40' : '#86A882'} />)}
                </Bar>
              </BarChart>
            </ChartContainer>
          </figure>
        </div>
      )}
      {a && b && a.cmPerResourceUnit > b.cmPerResourceUnit && a.cmPerResourceUnit > 0 && (
        <Notice tone="idea">
          {a.name} generates more contribution margin per {unit} of {r.item.name} than {b.name}. If {r.item.name} is the only limiting resource, prioritizing {a.name} may
          generate more contribution, subject to customer demand and other constraints.
        </Notice>
      )}
      <p className="text-xs text-sage-600">
        The product with the highest CM per unit is not automatically the best one to prioritise. With several limited items, simple rankings may not give the best overall plan.
        {r.notUsing.length > 0 && ` Not using ${r.item.name}: ${r.notUsing.join(', ')}.`}
        {r.unknown.length > 0 && ` No recipe: ${r.unknown.join(', ')}.`}
      </p>
    </section>
  );
}

function Comparison({ original, originalCheck, modified, modifiedCheck }: { original: PlanFinancials; originalCheck: PlanCheck; modified: PlanFinancials; modifiedCheck: PlanCheck }) {
  const rows: [string, number, number][] = [
    ['Revenue (units sold)', original.summary.totalRevenue, modified.summary.totalRevenue],
    ['Variable costs', original.summary.totalVariableCosts, modified.summary.totalVariableCosts],
    ['Contribution margin', original.summary.totalCM, modified.summary.totalCM],
    ['Operating profit', original.summary.operatingProfit, modified.summary.operatingProfit],
  ];
  const math = summaryMath(modified.summary, 'units sold (planned units, but never more than expected demand)');
  const label = (c: PlanCheck) => (c.feasibility === 'feasible' ? '✅ Feasible' : c.feasibility === 'infeasible' ? '🔴 Not feasible – inventory short' : '🟡 Unverified – some products have no recipe');
  return (
    <div className="card overflow-x-auto p-4 sm:p-6" aria-live="polite">
      <table className="data-table min-w-[34rem]">
        <caption className="mb-3 text-left font-display text-lg font-bold text-sage-900">Original plan vs. modified plan</caption>
        <thead><tr><th scope="col">Metric</th><th scope="col" className="text-right">Original (expected demand)</th><th scope="col" className="text-right">Modified plan</th><th scope="col" className="text-right">Difference</th></tr></thead>
        <tbody>
          <tr>
            <th scope="row" className="font-semibold">Inventory check</th>
            <td className="text-right text-xs font-bold">{label(originalCheck)}</td>
            <td className="text-right text-xs font-bold">{label(modifiedCheck)}</td>
            <td />
          </tr>
          {rows.map(([l, a, b]) => (
            <tr key={l} className={l === 'Operating profit' ? 'font-bold' : ''}>
              <th scope="row" className="font-semibold">{l}</th>
              <td className={`text-right ${originalCheck.feasibility === 'infeasible' ? 'text-sage-400 line-through decoration-loss-600/60' : ''}`}>{formatCAD(a)}</td>
              <td className={`text-right ${modifiedCheck.feasibility === 'infeasible' ? 'text-sage-400 line-through decoration-loss-600/60' : ''}`}>{formatCAD(b)}</td>
              <td className="text-right"><SignedMoney value={l === 'Variable costs' ? a - b : b - a} text={formatSignedCAD(b - a)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(originalCheck.feasibility === 'infeasible' || modifiedCheck.feasibility === 'infeasible') && (
        <p className="mt-3 text-sm font-semibold text-loss-700">Crossed-out figures belong to a plan your inventory can’t support – they are not achievable sales.</p>
      )}
      {modified.unsold.length > 0 && (
        <p className="mt-2 text-sm text-butter-700">
          Planned above demand: {modified.unsold.map((u) => `${u.units} ${u.name}`).join(', ')}. Unsold units are not counted as revenue.
        </p>
      )}
      <ShowMath label="the modified production plan" items={[math.revenue, math.variableCosts, math.contributionMargin, math.operatingProfit]} />
      {modifiedCheck.feasibility === 'infeasible' && <p className="mt-2 text-xs font-semibold text-loss-700">The math describes a plan your inventory can’t support, so its profit is not achievable.</p>}
    </div>
  );
}

function Alerts({ check, plan }: { check: PlanCheck; plan: Plan }) {
  const { model } = useStore();
  const shortItems = check.items.filter((i) => i.status === 'shortage');
  const affected = model.products.filter((p) => (plan[p.id] ?? 0) > 0 && model.recipes[p.id]?.lines.some((l) => shortItems.some((s) => s.itemId === l.itemId)));
  return (
    <section aria-labelledby="alerts-title" className="space-y-4">
      <SubHeader id="alerts-title" emoji="🚦" title="Inventory alerts (modified plan)" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {check.items.map((i) => (
          <div key={i.itemId} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sage-900">{i.name}</p>
              <StatusPill status={i.status} />
            </div>
            <p className="text-sm text-sage-700">
              Needs {formatQuantity(i.requiredBase, i.dimension, 'short')} of {formatQuantity(i.availableBase, i.dimension, 'short')}
              {i.usage !== null && Number.isFinite(i.usage) ? ` (${Math.round(i.usage * 100)} %)` : ''}
            </p>
            {i.shortageBase > 0 && <p className="text-sm font-semibold text-loss-700">An additional {formatQuantity(i.shortageBase, i.dimension)} of {i.name} would be required.</p>}
          </div>
        ))}
      </div>
      {affected.map((p) => (
        <Notice key={p.id} tone="error">Your current inventory is insufficient to produce the planned quantity of {p.name}.</Notice>
      ))}
    </section>
  );
}
