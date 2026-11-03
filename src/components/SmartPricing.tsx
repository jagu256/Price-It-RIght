import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { toCents } from '../lib/business';
import { formatCAD, unitsLabel } from '../lib/format';
import { requiredPrice } from '../lib/pricing';
import { parseAmount, parseMoney, parseUnits, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SubHeader } from './ui';

/** 💡 What Price Should I Charge? */
export default function SmartPricing() {
  const { model } = useStore();
  const products = model.products;
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [target, setTarget] = useState('500');
  const [unitsText, setUnitsText] = useState<string | null>(null);
  const [vcText, setVcText] = useState<string | null>(null);
  const [mode, setMode] = useState<'business' | 'share'>('business');
  const [shareText, setShareText] = useState('');
  const product = products.find((p) => p.id === productId) ?? products[0];
  if (!product || model.fixedCosts === null) return null;

  const targetR = parseSignedAmount(target);
  const unitsR = parseUnits(unitsText ?? String(product.units));
  const vcR = parseMoney(vcText ?? toInputText(product.variableCost), 'variableCost');
  const shareR = mode === 'share' ? parseAmount(shareText, 'share of fixed costs') : null;
  const errors = [targetR.ok ? undefined : targetR.error, unitsR.ok ? undefined : unitsR.error, vcR.ok ? undefined : vcR.error, shareR && !shareR.ok ? shareR.error : undefined];

  const others = products.filter((p) => p.id !== product.id);
  const otherCM = others.reduce((s, p) => s + (toCents(p.price) - toCents(p.variableCost)) * p.units, 0) / 100;
  const ready = targetR.ok && unitsR.ok && vcR.ok && (!shareR || shareR.ok);
  const result =
    ready && targetR.ok && unitsR.ok && vcR.ok
      ? requiredPrice({
          variableCost: vcR.value,
          units: unitsR.value,
          fixedCosts: mode === 'business' ? model.fixedCosts : shareR && shareR.ok ? shareR.value : 0,
          targetProfit: targetR.value,
          otherContribution: mode === 'business' ? otherCM : 0,
        })
      : null;

  return (
    <section aria-labelledby="smart-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="smart-title" emoji="💡" title="What Price Should I Charge?" subtitle="Find the minimum price for one product that reaches your profit target, under the assumptions you enter." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="sp-product" className="block text-sm font-semibold text-sage-900">Product</label>
          <select id="sp-product" className="select mt-1 w-full" value={product.id} onChange={(e) => { setProductId(e.target.value); setUnitsText(null); setVcText(null); }}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Field id="sp-target" label="Desired monthly operating profit" value={target} onChange={setTarget} invalid={!targetR.ok} prefix="$" help="Can be negative to plan a smaller loss." />
        <Field id="sp-units" label={`Expected sales of ${product.name}`} value={unitsText ?? String(product.units)} onChange={setUnitsText} invalid={!unitsR.ok} />
        <Field id="sp-vc" label="Variable cost per unit" value={vcText ?? toInputText(product.variableCost)} onChange={setVcText} invalid={!vcR.ok} prefix="$" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-sage-900">Which fixed costs should this price cover?</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="sp-mode" className="mt-1" checked={mode === 'business'} onChange={() => setMode('business')} />
          <span>
            <strong>Whole business</strong> – all fixed costs ({formatCAD(model.fixedCosts)}), counting the {formatCAD(otherCM)} contribution expected from
            {others.length ? ` your other products (${others.map((o) => o.name).join(', ')})` : ' other products (none)'}.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="sp-mode" className="mt-1" checked={mode === 'share'} onChange={() => setMode('share')} />
          <span>
            <strong>A chosen share</strong> – this product alone covers an amount of fixed costs you choose, plus the target.
          </span>
        </label>
        {mode === 'share' && (
          <div className="pl-6">
            <Field id="sp-share" label="Fixed costs this product should cover" value={shareText} onChange={setShareText} invalid={!!shareR && !shareR.ok} prefix="$" />
          </div>
        )}
      </fieldset>
      <ErrorList messages={errors} />

      <div className="rounded-2xl bg-cream-50 p-4 font-mono text-xs text-sage-800 ring-1 ring-sage-100">
        Required price = variable cost + (fixed costs + target profit − contribution from other products) ÷ expected units
      </div>

      {result && (
        <div aria-live="polite" className="space-y-3">
          {result.status === 'ok' && (
            <>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90">Minimum calculated price</p>
                  <p className="font-display text-4xl font-extrabold tabular-nums">{formatCAD(result.price)}</p>
                </div>
                <p className="max-w-md text-sm opacity-95">
                  At {formatCAD(result.price)} and {unitsR.ok ? unitsLabel(unitsR.value) : ''} of {product.name}, projected operating profit would be {formatCAD(result.profitAtPrice)}
                  {mode === 'share' ? ' (for this product’s share)' : ''}. {Math.round(result.exact * 100) === Math.round(result.price * 100) && Math.abs(result.exact * 100 - Math.round(result.exact * 100)) < 1e-9 ? 'The formula gives this price exactly.' : `The formula gives $${result.exact.toFixed(4)}, rounded up to the next cent so the target is met.`}
                </p>
              </div>
              {result.belowVariableCost && (
                <Notice tone="warn">This price is below the variable cost per unit – each {product.name} would lose money, but other products would still cover the target.</Notice>
              )}
            </>
          )}
          {result.status === 'already-met' && (
            <Notice tone="success" title="Target already met">Your other products already cover fixed costs and the target, even if {product.name} were sold at $0.</Notice>
          )}
          {result.status === 'no-sales' && <Notice tone="error" title="Not Available">A required price can’t be calculated with 0 expected sales of {product.name}.</Notice>}
          <Notice tone="idea">
            This is a minimum price under the entered assumptions – not a guaranteed or market-optimal price. Actual demand may
            change when prices change, so check that customers would still buy {unitsR.ok ? unitsLabel(unitsR.value) : 'that many'} at this price.
          </Notice>
        </div>
      )}
    </section>
  );
}

function parseSignedAmount(raw: string) {
  const t = raw.trim();
  const negative = /^[-−–]/.test(t);
  const r = parseAmount(negative ? t.slice(1) : t, 'target profit');
  return r.ok ? { ok: true as const, value: negative ? -r.value : r.value } : r;
}

function Field({ id, label, value, onChange, invalid, prefix, help }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid?: boolean; prefix?: string; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-sage-900">{label}</label>
      <div className="mt-1">
        <CellInput id={id} label={label} value={value} onChange={onChange} invalid={invalid} prefix={prefix} width="w-full" />
      </div>
      {help && <p className="mt-1 text-xs text-sage-600">{help}</p>}
    </div>
  );
}

export { Field, parseSignedAmount };
