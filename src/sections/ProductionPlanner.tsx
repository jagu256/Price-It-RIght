import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts';
import ChartContainer from '../components/ChartContainer';
import { useStore } from '../app/StoreContext';
import ShowMath from '../components/ShowMath';
import { CellInput, ErrorList, Notice, Rich, SectionHeader, SignedMoney, StatusPill, SubHeader } from '../components/ui';
import { plural, t } from '../i18n/i18n';
import { formatCAD, formatNumber, formatPercent, formatSignedCAD } from '../lib/format';
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
import { optimalMix, type OptimizerResult } from '../lib/optimizer';
import { parseUnits } from '../lib/validation';

export default function ProductionPlanner() {
  const { model } = useStore();
  const stockOk = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const anyRecipe = Object.values(model.recipes).some((r) => r.status === 'complete');
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <SectionHeader emoji="🏆" title={t('What Should I Produce More Of?')} subtitle={t('Discover which products make the best use of your limited inventory.')} />
      {!model.summary ? (
        <Notice tone="error">{t('Fix the highlighted numbers in 🏠 My Business first.')}</Notice>
      ) : !stockOk || !anyRecipe ? (
        <Notice tone="warn" title={t('Inventory and recipes needed')}>{t('Add valid inventory and at least one product recipe in the 📦 Smart Inventory Hub to plan production.')}</Notice>
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
  const [best, setBest] = useState<OptimizerResult | null>(null);

  return (
    <>
      <ResourceRanking resource={resource} setResource={setResourceId} bindingId={binding?.itemId ?? null} />

      <section aria-labelledby="sim-title" className="space-y-4">
        <SubHeader id="sim-title" emoji="🧪" title={t('Production Plan Simulator')} subtitle={t('Change planned production and try extra (hypothetical) inventory. Your business plan is not changed.')} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-small" onClick={() => dispatch({ type: 'planner-reset' })}>↺ {t('Expected demand (original)')}</button>
          <button type="button" className="btn-small" onClick={() => fill(proportionalPlan(model.products, model.recipes, model.stock).plan)}>⚖️ {t('Keep my mix, fit inventory')}</button>
          <button type="button" className="btn-small" onClick={() => fill(suggestedPlan(model.products, model.recipes, model.stock, resource))}>💡 {t('Suggested plan')}</button>
          <button
            type="button"
            className="btn-small"
            onClick={() => {
              const r = optimalMix(model.products, model.recipes, model.stock);
              setBest(r);
              fill(r.plan);
            }}
          >
            🧮 {t('Best mix (exact search)')}
          </button>
        </div>
        <p className="text-xs text-sage-600">
          <Rich
            text={t(
              '“Keep my mix” scales every product down by the same percentage until inventory fits. “Suggested plan” fills demand in order of contribution per unit of the selected scarce item while respecting every item – a rule of thumb, **not proven optimal**. When several items are limited, other plans may earn more. “Best mix” searches every possible whole-unit plan (skipping only groups it can prove can’t do better) for the most total contribution margin within all your inventory and expected demand.',
            )}
          />
        </p>
        {best && <BestMixNote r={best} />}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="data-table min-w-[26rem]">
              <caption className="mb-2 text-left font-semibold text-sage-900">{t('Planned production per month')}</caption>
              <thead><tr><th scope="col">{t('Product')}</th><th scope="col" className="text-right">{t('Demand')}</th><th scope="col">{t('Planned')}</th></tr></thead>
              <tbody>
                {model.products.map((p) => (
                  <tr key={p.id}>
                    <th scope="row" className="font-semibold">
                      {p.name}
                      {model.recipes[p.id]?.status !== 'complete' && <span className="block text-xs font-normal text-butter-700">{t('No recipe – inventory not checked')}</span>}
                      <ErrorList messages={[unitErrors[p.id]]} />
                    </th>
                    <td className="text-right">{formatNumber(p.units)}</td>
                    <td><CellInput id={`plan-${p.id}`} label={t('Planned production of {name}', { name: p.name })} inputMode="numeric" value={state.planner.units[p.id] ?? String(p.units)} invalid={!!unitErrors[p.id]} onChange={(v) => dispatch({ type: 'planner-set-units', productId: p.id, value: v })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-x-auto p-2 sm:p-4">
            <table className="data-table min-w-[26rem]">
              <caption className="mb-2 text-left font-semibold text-sage-900">{t('What if I had more inventory? (hypothetical)')}</caption>
              <thead><tr><th scope="col">{t('Item')}</th><th scope="col" className="text-right">{t('Have')}</th><th scope="col">{t('Extra')}</th></tr></thead>
              <tbody>
                {model.stock.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="font-semibold">{s.name}<ErrorList messages={[extraErrors[s.id]]} /></th>
                    <td className="text-right">{formatQuantity(s.availableBase, s.dimension, 'short')}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <CellInput id={`extra-${s.id}`} label={t('Extra {name} in {unit}', { name: s.name, unit: t(UNITS[s.unit].plural) })} placeholder="0" value={state.planner.extra[s.id] ?? ''} invalid={!!extraErrors[s.id]} onChange={(v) => dispatch({ type: 'planner-set-extra', itemId: s.id, value: v })} />
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
          {t('Buying inventory is a cash payment, not an expense. Its cost is recognised (as part of variable cost per unit) only when products are sold, so extra inventory here does not reduce operating profit by itself.')}
        </Notice>

        {modified && modifiedCheck ? <Comparison original={original} originalCheck={originalCheck} modified={modified} modifiedCheck={modifiedCheck} /> : <Notice tone="error">{t('Fix the highlighted values to compare plans.')}</Notice>}
      </section>

      {modifiedCheck && <Alerts check={modifiedCheck} plan={plan} />}
    </>
  );
}

/** Says exactly what the exact search proved – "proven optimal" only when the whole search finished. */
function BestMixNote({ r }: { r: OptimizerResult }) {
  return r.status === 'proven-optimal' ? (
    <Notice tone="success" title={t('Best mix – proven optimal for these numbers')} role="status">
      <p>
        {t('No other whole-unit plan within your current inventory and expected demand earns more than {cm} of contribution margin from products with recipes (checked with {steps} search steps). Fixed costs are the same for every plan, so this is also the highest operating profit.', {
          cm: formatCAD(r.optimizedCM),
          steps: formatNumber(r.nodes),
        })}
      </p>
      <p className="mt-1">
        {t('It is only as good as your numbers: it assumes demand, prices, costs and recipes are right, and it ignores the hypothetical extra inventory below. There may be other plans that tie.')}
        {r.unchecked.length > 0 &&
          ' ' + plural(r.unchecked.length, '{names} has no recipe, so it was left at expected demand and not checked.', '{names} have no recipe, so they were left at expected demand and not checked.', { names: r.unchecked.join(', ') })}
        {r.zeroMargin.length > 0 &&
          ' ' + plural(r.zeroMargin.length, '{names} earns no contribution per unit, so it is set to 0.', '{names} earn no contribution per unit, so they are set to 0.', { names: r.zeroMargin.join(', ') })}
      </p>
    </Notice>
  ) : (
    <Notice tone="warn" title={t('Suggested mix – NOT proven optimal')} role="status">
      {t('The search stopped after {steps} steps before it could check every possibility, so this is the best plan found so far ({cm} of contribution margin). A better plan may exist.', {
        steps: formatNumber(r.nodes),
        cm: formatCAD(r.optimizedCM),
      })}
    </Notice>
  );
}

function ResourceRanking({ resource, setResource, bindingId }: { resource: string | null; setResource: (id: string) => void; bindingId: string | null }) {
  const { model } = useStore();
  const r = resource ? contributionPerResource(resource, model.products, model.recipes, model.stock) : null;
  if (!r) return null;
  const unit = t(resourceUnitLabel(r.item.dimension));
  const data = r.ranking.map((x) => ({ name: x.name, value: x.cmPerResourceUnit }));
  const [a, b] = r.ranking;

  return (
    <section aria-labelledby="rank-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader id="rank-title" emoji="🥇" title={t('Contribution margin per unit of a scarce resource')} subtitle={t('CM per unit ÷ amount of the scarce item used. When ONE item limits production, this shows which products use it best.')} />
      <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {t('Scarce inventory item')}
        <select className="select" value={resource ?? ''} onChange={(e) => setResource(e.target.value)}>
          {model.stock.map((s) => <option key={s.id} value={s.id}>{s.name}{s.id === bindingId ? ` ${t('(most constrained)')}` : ''}</option>)}
        </select>
      </label>
      {r.ranking.length === 0 ? (
        <p className="text-sage-700">{t('No product with a complete recipe uses {name}.', { name: r.item.name })}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[28rem]">
              <caption className="sr-only">{t('Contribution per unit of {name}', { name: r.item.name })}</caption>
              <thead><tr><th scope="col">{t('Product')}</th><th scope="col" className="text-right">{t('CM / unit')}</th><th scope="col" className="text-right">{t('{name} used', { name: r.item.name })}</th><th scope="col" className="text-right">{t('CM per {unit}', { unit })}</th></tr></thead>
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
          <figure className="h-56" role="img" aria-label={t('Bar chart of contribution margin per {unit} of {name}', { unit, name: r.item.name })}>
            <ChartContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatCAD(v)} stroke="#3E5A40" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} stroke="#3E5A40" tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [formatCAD(v), t('CM per {unit} of {name}', { unit, name: r.item.name })]} contentStyle={{ borderRadius: 16 }} />
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
          {t('{a} generates more contribution margin per {unit} of {item} than {b}. If {item} is the only limiting resource, prioritizing {a} may generate more contribution, subject to customer demand and other constraints.', {
            a: a.name,
            b: b.name,
            unit,
            item: r.item.name,
          })}
        </Notice>
      )}
      <p className="text-xs text-sage-600">
        {t('The product with the highest CM per unit is not automatically the best one to prioritise. With several limited items, simple rankings may not give the best overall plan.')}
        {r.notUsing.length > 0 && ' ' + t('Not using {item}: {names}.', { item: r.item.name, names: r.notUsing.join(', ') })}
        {r.unknown.length > 0 && ' ' + t('No recipe: {names}.', { names: r.unknown.join(', ') })}
      </p>
    </section>
  );
}

function Comparison({ original, originalCheck, modified, modifiedCheck }: { original: PlanFinancials; originalCheck: PlanCheck; modified: PlanFinancials; modifiedCheck: PlanCheck }) {
  // The key (not the shown label) decides which row is bold and which is a cost.
  const rows: { key: string; label: string; a: number; b: number }[] = [
    { key: 'revenue', label: t('Revenue (units sold)'), a: original.summary.totalRevenue, b: modified.summary.totalRevenue },
    { key: 'variable', label: t('Variable costs'), a: original.summary.totalVariableCosts, b: modified.summary.totalVariableCosts },
    { key: 'cm', label: t('Contribution margin'), a: original.summary.totalCM, b: modified.summary.totalCM },
    { key: 'profit', label: t('Operating profit'), a: original.summary.operatingProfit, b: modified.summary.operatingProfit },
  ];
  const math = summaryMath(modified.summary, t('units sold (planned units, but never more than expected demand)'));
  const label = (c: PlanCheck) => (c.feasibility === 'feasible' ? `✅ ${t('Feasible')}` : c.feasibility === 'infeasible' ? `🔴 ${t('Not feasible – inventory short')}` : `🟡 ${t('Unverified – some products have no recipe')}`);
  return (
    <div className="card overflow-x-auto p-4 sm:p-6" aria-live="polite">
      <table className="data-table min-w-[34rem]">
        <caption className="mb-3 text-left font-display text-lg font-bold text-sage-900">{t('Original plan vs. modified plan')}</caption>
        <thead><tr><th scope="col">{t('Metric')}</th><th scope="col" className="text-right">{t('Original (expected demand)')}</th><th scope="col" className="text-right">{t('Modified plan')}</th><th scope="col" className="text-right">{t('Difference')}</th></tr></thead>
        <tbody>
          <tr>
            <th scope="row" className="font-semibold">{t('Inventory check')}</th>
            <td className="text-right text-xs font-bold">{label(originalCheck)}</td>
            <td className="text-right text-xs font-bold">{label(modifiedCheck)}</td>
            <td />
          </tr>
          {rows.map(({ key, label: l, a, b }) => (
            <tr key={key} className={key === 'profit' ? 'font-bold' : ''}>
              <th scope="row" className="font-semibold">{l}</th>
              <td className={`text-right ${originalCheck.feasibility === 'infeasible' ? 'text-sage-400 line-through decoration-loss-600/60' : ''}`}>{formatCAD(a)}</td>
              <td className={`text-right ${modifiedCheck.feasibility === 'infeasible' ? 'text-sage-400 line-through decoration-loss-600/60' : ''}`}>{formatCAD(b)}</td>
              <td className="text-right"><SignedMoney value={key === 'variable' ? a - b : b - a} text={formatSignedCAD(b - a)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {(originalCheck.feasibility === 'infeasible' || modifiedCheck.feasibility === 'infeasible') && (
        <p className="mt-3 text-sm font-semibold text-loss-700">{t('Crossed-out figures belong to a plan your inventory can’t support – they are not achievable sales.')}</p>
      )}
      {modified.unsold.length > 0 && (
        <p className="mt-2 text-sm text-butter-700">
          {t('Planned above demand: {list}. Unsold units are not counted as revenue.', { list: modified.unsold.map((u) => `${formatNumber(u.units)} ${u.name}`).join(', ') })}
        </p>
      )}
      <ShowMath label={t('the modified production plan')} items={[math.revenue, math.variableCosts, math.contributionMargin, math.operatingProfit]} />
      {modifiedCheck.feasibility === 'infeasible' && <p className="mt-2 text-xs font-semibold text-loss-700">{t('The math describes a plan your inventory can’t support, so its profit is not achievable.')}</p>}
    </div>
  );
}

function Alerts({ check, plan }: { check: PlanCheck; plan: Plan }) {
  const { model } = useStore();
  const shortItems = check.items.filter((i) => i.status === 'shortage');
  const affected = model.products.filter((p) => (plan[p.id] ?? 0) > 0 && model.recipes[p.id]?.lines.some((l) => shortItems.some((s) => s.itemId === l.itemId)));
  return (
    <section aria-labelledby="alerts-title" className="space-y-4">
      <SubHeader id="alerts-title" emoji="🚦" title={t('Inventory alerts (modified plan)')} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {check.items.map((i) => (
          <div key={i.itemId} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sage-900">{i.name}</p>
              <StatusPill status={i.status} />
            </div>
            <p className="text-sm text-sage-700">
              {t('Needs {required} of {available}', { required: formatQuantity(i.requiredBase, i.dimension, 'short'), available: formatQuantity(i.availableBase, i.dimension, 'short') })}
              {i.usage !== null && Number.isFinite(i.usage) ? ` (${formatPercent(Math.round(i.usage * 100))})` : ''}
            </p>
            {i.shortageBase > 0 && <p className="text-sm font-semibold text-loss-700">{t('An additional {qty} of {name} would be required.', { qty: formatQuantity(i.shortageBase, i.dimension), name: i.name })}</p>}
          </div>
        ))}
      </div>
      {affected.map((p) => (
        <Notice key={p.id} tone="error">{t('Your current inventory is insufficient to produce the planned quantity of {name}.', { name: p.name })}</Notice>
      ))}
    </section>
  );
}
