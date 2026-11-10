import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import ProfitGoal from '../components/ProfitGoal';
import ShowMath from '../components/ShowMath';
import SmartPricing from '../components/SmartPricing';
import SurpriseEvents from '../components/SurpriseEvents';
import { CellInput, ErrorList, NeedsValidBusiness, Notice, SectionHeader, SignedMoney, SubHeader } from '../components/ui';
import type { BusinessSummary } from '../lib/business';
import { formatCAD, formatCompactCAD, formatSignedCAD, roundCents } from '../lib/format';
import { resolveScenario } from '../lib/pricing';
import { summaryMath } from '../lib/showMath';
import { toInputText } from '../lib/validation';

export default function PricingLab() {
  const { model } = useStore();
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <SectionHeader emoji="🎯" title="Pricing Lab" subtitle="Experiment with prices and discover how your decisions affect profit." />
      <NeedsValidBusiness ready={!!model.summary}>
        <WhatIfSimulator />
        <SmartPricing />
        <ProfitGoal />
        <SurpriseEvents />
      </NeedsValidBusiness>
    </div>
  );
}

/** The modified plan’s figures, explained with the same summary the table shows. */
const planMath = (s: BusinessSummary) => {
  const x = summaryMath(s);
  return [x.revenue, x.variableCosts, x.contributionMargin, x.operatingProfit];
};

const breakEvenText = (s: BusinessSummary) =>
  s.breakEven.status === 'reachable' ? `${s.breakEven.totalUnits.toLocaleString('en-CA')} units` : s.breakEven.status === 'no-fixed-costs' ? '0 units' : 'Not Available';

function WhatIfSimulator() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const [showChart, setShowChart] = useState(false);
  const current = model.summary!;
  const fixed = model.fixedCosts!;
  const scenario = resolveScenario(model.products, fixed, state.scenario);
  const modified = scenario.summary;

  const field = (productId: string, key: 'price' | 'variableCost' | 'units', base: string) => state.scenario.products[productId]?.[key] ?? base;

  const apply = async () => {
    if (!scenario.changed || !modified) return;
    const itemizedChanged = model.products.filter((p) => p.costMode === 'itemized' && state.scenario.products[p.id]?.variableCost !== undefined && roundCents(scenario.products.find((x) => x.id === p.id)!.variableCost) !== roundCents(p.variableCost));
    const ok = await confirm({
      title: 'Apply the modified plan?',
      message: (
        <>
          <p>This replaces your current business plan with the modified prices, costs and sales volumes.</p>
          {itemizedChanged.length > 0 && (
            <p className="mt-2 font-semibold">
              {itemizedChanged.map((p) => p.name).join(', ')} {itemizedChanged.length === 1 ? 'uses' : 'use'} itemized costing; applying a new variable cost switches {itemizedChanged.length === 1 ? 'it' : 'them'} to a manual cost.
            </p>
          )}
        </>
      ),
      confirmLabel: 'Apply changes',
    });
    if (!ok) return;
    const resolved: { fixedCosts?: string; products: Record<string, { price?: string; variableCost?: string; units?: string }> } = { products: {} };
    if (roundCents(scenario.fixedCosts) !== roundCents(fixed)) resolved.fixedCosts = toInputText(scenario.fixedCosts);
    for (const p of scenario.products) {
      const before = model.products.find((x) => x.id === p.id)!;
      const o: { price?: string; variableCost?: string; units?: string } = {};
      if (roundCents(p.price) !== roundCents(before.price)) o.price = toInputText(p.price);
      if (roundCents(p.variableCost) !== roundCents(before.variableCost)) o.variableCost = toInputText(p.variableCost);
      if (p.units !== before.units) o.units = String(p.units);
      if (Object.keys(o).length) resolved.products[p.id] = o;
    }
    dispatch({ type: 'scenario-apply', resolved });
  };

  const rows: { label: string; a: number; b: number | null; money?: boolean }[] = [
    { label: 'Revenue', a: current.totalRevenue, b: modified?.totalRevenue ?? null },
    { label: 'Variable costs', a: current.totalVariableCosts, b: modified?.totalVariableCosts ?? null },
    { label: 'Contribution margin', a: current.totalCM, b: modified?.totalCM ?? null },
    { label: 'Fixed costs', a: current.fixedCosts, b: modified?.fixedCosts ?? null },
    { label: 'Operating profit', a: current.operatingProfit, b: modified?.operatingProfit ?? null },
  ];

  return (
    <section aria-labelledby="whatif-title" className="space-y-4">
      <SubHeader id="whatif-title" emoji="🔁" title="What-If Pricing Simulator" subtitle="Change prices, costs, sales volumes or fixed costs. Your current business plan stays the same unless you apply the changes." />

      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="data-table min-w-[44rem]">
          <caption className="sr-only">Modified business plan inputs</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price (current → modified)</th>
              <th scope="col">Variable cost</th>
              <th scope="col">Expected sales</th>
            </tr>
          </thead>
          <tbody>
            {model.products.map((p) => {
              const errs = ['price', 'variableCost', 'units'].map((k) => scenario.errors[`${p.id}.${k}`]);
              return (
                <tr key={p.id}>
                  <th scope="row" className="font-semibold text-sage-900">
                    {p.name}
                    <ErrorList messages={errs} />
                  </th>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-sage-500">{formatCAD(p.price)}</span>→
                      <CellInput id={`sc-${p.id}-price`} label={`Modified price for ${p.name}`} prefix="$" value={field(p.id, 'price', toInputText(p.price))} invalid={!!errs[0]} onChange={(v) => dispatch({ type: 'scenario-set', productId: p.id, field: 'price', value: v })} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-sage-500">{formatCAD(p.variableCost)}</span>→
                      <CellInput id={`sc-${p.id}-vc`} label={`Modified variable cost for ${p.name}`} prefix="$" value={field(p.id, 'variableCost', toInputText(p.variableCost))} invalid={!!errs[1]} onChange={(v) => dispatch({ type: 'scenario-set', productId: p.id, field: 'variableCost', value: v })} />
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-sage-500">{p.units.toLocaleString('en-CA')}</span>→
                      <CellInput id={`sc-${p.id}-units`} label={`Modified expected sales for ${p.name}`} inputMode="numeric" value={field(p.id, 'units', String(p.units))} invalid={!!errs[2]} onChange={(v) => dispatch({ type: 'scenario-set', productId: p.id, field: 'units', value: v })} />
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr>
              <th scope="row" className="font-semibold text-sage-900">
                Monthly fixed costs
                <ErrorList messages={[scenario.errors.fixedCosts]} />
              </th>
              <td colSpan={3}>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-sage-500">{formatCAD(fixed)}</span>→
                  <CellInput id="sc-fixed" label="Modified monthly fixed costs" prefix="$" width="w-32" value={state.scenario.fixedCosts ?? toInputText(fixed)} invalid={!!scenario.errors.fixedCosts} onChange={(v) => dispatch({ type: 'scenario-set', productId: null, field: 'fixedCosts', value: v })} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card overflow-x-auto p-4 sm:p-6" aria-live="polite">
        <table className="data-table min-w-[32rem]">
          <caption className="mb-3 text-left font-display text-lg font-bold text-sage-900">Current Business Plan vs. Modified Business Plan</caption>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col" className="text-right">Current</th>
              <th scope="col" className="text-right">Modified</th>
              <th scope="col" className="text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className={r.label === 'Operating profit' ? 'font-bold' : ''}>
                <th scope="row" className="font-semibold">{r.label}</th>
                <td className="text-right">{formatCAD(r.a)}</td>
                <td className="text-right">{r.b === null ? '—' : formatCAD(r.b)}</td>
                <td className="text-right">{r.b === null ? '—' : <SignedMoney value={r.label === 'Variable costs' || r.label === 'Fixed costs' ? -(r.b - r.a) : r.b - r.a} text={formatSignedCAD(r.b - r.a)} />}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="font-semibold">Break-even point (sales mix)</th>
              <td className="text-right">{breakEvenText(current)}</td>
              <td className="text-right">{modified ? breakEvenText(modified) : '—'}</td>
              <td />
            </tr>
          </tbody>
        </table>
        {!modified && <p className="mt-3 text-sm font-semibold text-loss-700">Fix the highlighted values to see the modified plan.</p>}
        {modified && !scenario.changed && <p className="mt-3 text-sm text-sage-600">No changes yet – edit any value above to compare.</p>}
        {modified && <ShowMath label="the modified plan" items={planMath(modified)} />}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={apply} disabled={!scenario.changed || !modified}>Apply Changes</button>
        <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'scenario-reset' })}>↺ Reset Scenario</button>
        <button type="button" className="btn-secondary" onClick={() => setShowChart((v) => !v)} aria-expanded={showChart} disabled={!modified}>
          📊 {showChart ? 'Hide comparison' : 'Compare Results'}
        </button>
      </div>

      {showChart && modified && (
        <figure className="card p-4 sm:p-6">
          <figcaption className="font-display text-lg font-bold text-sage-900">Scenario comparison</figcaption>
          <div className="mt-3 h-72" role="img" aria-label="Bar chart comparing the current and modified plans">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.map((r) => ({ name: r.label, Current: r.a, Modified: r.b ?? 0 }))} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#3E5A40" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tickFormatter={formatCompactCAD} stroke="#3E5A40" tick={{ fontSize: 12 }} width={64} />
                <Tooltip formatter={(v: number) => formatCAD(v)} contentStyle={{ borderRadius: 16 }} />
                <Legend />
                <Bar dataKey="Current" fill="#86A882" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Modified" fill="#C9A227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      )}

      <Notice tone="idea">
        Each scenario uses only the numbers you enter. In real life, changing a price can change how many customers buy – adjust
        expected sales too if you expect demand to react.
      </Notice>
    </section>
  );
}
