import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { formatCAD, formatPercent, formatSignedCAD, unitsLabel } from '../lib/format';
import { extraUnitsOfProduct, goalProgress, planForTarget } from '../lib/pricing';
import { goalMath } from '../lib/showMath';
import ShowMath from './ShowMath';
import { Field, parseSignedAmount } from './SmartPricing';
import { ErrorList, Notice, SignedMoney, SubHeader } from './ui';

/** 🎯 Profit Goal Tracker */
export default function ProfitGoal() {
  const { model } = useStore();
  const s = model.summary!;
  const [target, setTarget] = useState(String(Math.max(500, Math.ceil((s.operatingProfit + 500) / 100) * 100)));
  const [method, setMethod] = useState<'mix' | 'custom' | 'product'>('mix');
  const [productId, setProductId] = useState(model.products[0]?.id ?? '');
  const [custom, setCustom] = useState<Record<string, string>>({});

  const t = parseSignedAmount(target);
  const g = t.ok ? goalProgress(s.operatingProfit, t.value) : null;
  const product = model.products.find((p) => p.id === productId) ?? model.products[0];

  const customWeights = Object.fromEntries(model.products.map((p) => [p.id, Number(custom[p.id] ?? String(Math.round((p.units / Math.max(1, s.totalUnits)) * 100)))]));
  const customTotal = Object.values(customWeights).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const customValid = Object.values(customWeights).every((w) => Number.isFinite(w) && w >= 0) && Math.round(customTotal) === 100;

  const plan = g && !g.met && t.ok ? (method === 'mix' ? planForTarget(model.products, s.fixedCosts, t.value) : method === 'custom' && customValid ? planForTarget(model.products, s.fixedCosts, t.value, Object.fromEntries(Object.entries(customWeights).map(([k, v]) => [k, Math.round(v * 100)]))) : null) : null;

  return (
    <section aria-labelledby="goal-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="goal-title" emoji="🎯" title="Profit Goal Tracker" subtitle="Set a monthly operating profit goal and see what it would take to get there." />
      <div className="max-w-xs">
        <Field id="goal-target" label="Target monthly operating profit" value={target} onChange={setTarget} invalid={!t.ok} prefix="$" />
        <ErrorList messages={[t.ok ? undefined : t.error]} />
      </div>

      {g && (
        <>
          <dl className="grid gap-3 sm:grid-cols-4">
            {[
              ['Target operating profit', formatCAD(g.target), g.target],
              ['Current projected profit', formatCAD(g.current), g.current],
              ['Difference from target', formatSignedCAD(g.difference), g.difference],
              ['Additional contribution margin required', formatCAD(g.additionalCMRequired), -g.additionalCMRequired],
            ].map(([label, text, v]) => (
              <div key={label as string} className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{label}</dt>
                <dd className="mt-1 font-display text-xl font-extrabold tabular-nums"><SignedMoney value={v as number} text={text as string} /></dd>
              </div>
            ))}
          </dl>
          <ShowMath label="the profit goal" items={goalMath(g)} />

          <div>
            <div className="flex justify-between text-sm font-semibold text-sage-700">
              <span>Progress</span>
              <span>{formatPercent(g.progress * 100)}</span>
            </div>
            <div className="mt-1 h-4 overflow-hidden rounded-full bg-sage-100" role="progressbar" aria-label="Progress toward profit target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(g.progress * 100)}>
              <div className={`h-full rounded-full transition-all duration-500 ${g.met ? 'bg-sage-600' : 'bg-butter-500'}`} style={{ width: `${g.progress * 100}%` }} />
            </div>
          </div>

          {g.met ? (
            <Notice tone="success" title="Goal met!">Your current plan already reaches this target by {formatCAD(g.difference)}.</Notice>
          ) : (
            <div className="space-y-4">
              <fieldset className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <legend className="mb-1 w-full font-semibold text-sage-900">How would you close the gap?</legend>
                {([['mix', 'Grow all products, same sales mix'], ['custom', 'Grow with a sales mix I choose'], ['product', 'Sell more of one product']] as const).map(([k, l]) => (
                  <label key={k} className="flex items-center gap-2">
                    <input type="radio" name="goal-method" checked={method === k} onChange={() => setMethod(k)} /> {l}
                  </label>
                ))}
              </fieldset>

              {method === 'product' && product && (
                <div className="space-y-2">
                  <label htmlFor="goal-product" className="block text-sm font-semibold text-sage-900">Product</label>
                  <select id="goal-product" className="select" value={product.id} onChange={(e) => setProductId(e.target.value)}>
                    {model.products.map((p) => <option key={p.id} value={p.id}>{p.name} (CM {formatCAD(p.price - p.variableCost)} per unit)</option>)}
                  </select>
                  {(() => {
                    const extra = extraUnitsOfProduct(g.additionalCMRequired, product);
                    return extra === null ? (
                      <Notice tone="error">{product.name} doesn’t earn a positive contribution margin, so selling more of it can’t close the gap.</Notice>
                    ) : (
                      <p className="font-semibold text-sage-800">
                        Sell {unitsLabel(extra)} more {product.name} per month ({unitsLabel(product.units + extra)} in total), with other products unchanged.
                      </p>
                    );
                  })()}
                </div>
              )}

              {method === 'custom' && (
                <div className="space-y-2">
                  <p className="text-sm text-sage-700">Share of total units for each product (must add up to 100 %):</p>
                  <div className="flex flex-wrap gap-3">
                    {model.products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm font-semibold">
                        {p.name}
                        <input className="select w-20" inputMode="decimal" aria-label={`Sales mix share for ${p.name} (%)`} value={custom[p.id] ?? String(Math.round((p.units / Math.max(1, s.totalUnits)) * 100))} onChange={(e) => setCustom({ ...custom, [p.id]: e.target.value })} />%
                      </label>
                    ))}
                  </div>
                  {!customValid && <p className="text-sm font-semibold text-loss-700">⚠ Shares must be 0 or more and add up to 100 % (now {formatPercent(customTotal)}).</p>}
                </div>
              )}

              {(method === 'mix' || method === 'custom') &&
                (plan ? (
                  <div className="overflow-x-auto">
                    <table className="data-table min-w-[26rem]">
                      <caption className="mb-2 text-left text-sm font-semibold text-sage-800">
                        Monthly sales needed to reach {formatCAD(g.target)} ({unitsLabel(plan.totalUnits)} in total):
                      </caption>
                      <thead>
                        <tr><th scope="col">Product</th><th scope="col" className="text-right">Now</th><th scope="col" className="text-right">Needed</th><th scope="col" className="text-right">Change</th></tr>
                      </thead>
                      <tbody>
                        {plan.allocation.map((a) => {
                          const p = model.products.find((x) => x.id === a.id)!;
                          return (
                            <tr key={a.id}>
                              <th scope="row" className="font-semibold">{p.name}</th>
                              <td className="text-right">{p.units.toLocaleString('en-CA')}</td>
                              <td className="text-right font-bold">{a.units.toLocaleString('en-CA')}</td>
                              <td className="text-right">{a.units - p.units >= 0 ? '+' : ''}{(a.units - p.units).toLocaleString('en-CA')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  (method === 'mix' || customValid) && <Notice tone="error">Not Available: at this mix the products don’t earn a positive contribution margin overall, so more sales can’t reach the target.</Notice>
                ))}
              <p className="text-xs text-sage-600">Each product keeps its own contribution margin – products are never assumed to earn the same margin. Prices and costs stay as they are.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
