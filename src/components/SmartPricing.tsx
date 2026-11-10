import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { formatCAD, formatCADDecimals, unitsLabel } from '../lib/format';
import { contributionFromOthers, requiredPrice } from '../lib/pricing';
import { isWholeCents, requiredPriceMath, type RequiredPriceInput } from '../lib/showMath';
import { t, tx } from '../i18n/i18n';
import { formatRate } from '../lib/tax';
import { parseAmount, parseMoney, parseUnits, toInputText } from '../lib/validation';
import type { LinkedTarget } from './AfterTaxTarget';
import DemandExplorer from './DemandExplorer';
import ShowMath from './ShowMath';
import { CellInput, ErrorList, Notice, Rich, SubHeader } from './ui';

/** 💡 What Price Should I Charge? */
export default function SmartPricing({ linkedTarget = null }: { linkedTarget?: LinkedTarget | null }) {
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

  // With an after-tax target switched on, the pre-tax figure from that panel is used.
  const targetR = linkedTarget ? { ok: true as const, value: linkedTarget.preTax } : parseSignedAmount(target);
  const unitsR = parseUnits(unitsText ?? String(product.units));
  const vcR = parseMoney(vcText ?? toInputText(product.variableCost), 'variableCost');
  const shareR = mode === 'share' ? parseAmount(shareText, 'share of fixed costs') : null;
  const errors = [targetR.ok ? undefined : targetR.error, unitsR.ok ? undefined : unitsR.error, vcR.ok ? undefined : vcR.error, shareR && !shareR.ok ? shareR.error : undefined];

  const others = products.filter((p) => p.id !== product.id);
  const otherCM = contributionFromOthers(products, product.id);
  const ready = targetR.ok && unitsR.ok && vcR.ok && (!shareR || shareR.ok);
  const input: RequiredPriceInput | null =
    ready && targetR.ok && unitsR.ok && vcR.ok
      ? {
          variableCost: vcR.value,
          units: unitsR.value,
          fixedCosts: mode === 'business' ? model.fixedCosts : shareR && shareR.ok ? shareR.value : 0,
          targetProfit: targetR.value,
          otherContribution: mode === 'business' ? otherCM : 0,
        }
      : null;
  const result = input ? requiredPrice(input) : null;

  return (
    <section aria-labelledby="smart-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="smart-title" emoji="💡" title={t('What Price Should I Charge?')} subtitle={t('Find the minimum price for one product that reaches your profit target, under the assumptions you enter.')} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="sp-product" className="block text-sm font-semibold text-sage-900">{t('Product')}</label>
          <select id="sp-product" className="select mt-1 w-full" value={product.id} onChange={(e) => { setProductId(e.target.value); setUnitsText(null); setVcText(null); }}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {linkedTarget ? (
          <Field
            id="sp-target"
            label={t('Desired monthly operating profit (pre-tax)')}
            value={toInputText(linkedTarget.preTax)}
            onChange={() => {}}
            readOnly
            prefix="$"
            help={t('From your after-tax target of {amount} at {rate} tax (set above).', { amount: formatCAD(linkedTarget.afterTax), rate: formatRate(linkedTarget.ratePercent) })}
          />
        ) : (
          <Field id="sp-target" label={t('Desired monthly operating profit')} value={target} onChange={setTarget} invalid={!targetR.ok} prefix="$" help={t('Can be negative to plan a smaller loss.')} />
        )}
        <Field id="sp-units" label={t('Expected sales of {name}', { name: product.name })} value={unitsText ?? String(product.units)} onChange={setUnitsText} invalid={!unitsR.ok} />
        <Field id="sp-vc" label={t('Variable cost per unit')} value={vcText ?? toInputText(product.variableCost)} onChange={setVcText} invalid={!vcR.ok} prefix="$" />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-sage-900">{t('Which fixed costs should this price cover?')}</legend>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="sp-mode" className="mt-1" checked={mode === 'business'} onChange={() => setMode('business')} />
          <span>
            <Rich
              text={
                others.length
                  ? t('**Whole business** – all fixed costs ({fixed}), counting the {cm} contribution expected from your other products ({names}).', {
                      fixed: formatCAD(model.fixedCosts),
                      cm: formatCAD(otherCM),
                      names: others.map((o) => o.name).join(', '),
                    })
                  : t('**Whole business** – all fixed costs ({fixed}), counting the {cm} contribution expected from other products (none).', { fixed: formatCAD(model.fixedCosts), cm: formatCAD(otherCM) })
              }
            />
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="radio" name="sp-mode" className="mt-1" checked={mode === 'share'} onChange={() => setMode('share')} />
          <span>
            <Rich text={t('**A chosen share** – this product alone covers an amount of fixed costs you choose, plus the target.')} />
          </span>
        </label>
        {mode === 'share' && (
          <div className="pl-6">
            <Field id="sp-share" label={t('Fixed costs this product should cover')} value={shareText} onChange={setShareText} invalid={!!shareR && !shareR.ok} prefix="$" />
          </div>
        )}
      </fieldset>
      <ErrorList messages={errors} />

      <div className="rounded-2xl bg-cream-50 p-4 font-mono text-xs text-sage-800 ring-1 ring-sage-100">
        {t('Required price = variable cost + (fixed costs + target profit − contribution from other products) ÷ expected units')}
      </div>

      {result && (
        <div aria-live="polite" className="space-y-3">
          {result.status === 'ok' && (
            <>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('Minimum calculated price')}</p>
                  <p className="font-display text-4xl font-extrabold tabular-nums">{formatCAD(result.price)}</p>
                </div>
                <p className="max-w-md text-sm opacity-95">
                  {mode === 'share'
                    ? t('At {price} and {units} of {name}, projected operating profit would be {profit} (for this product’s share).', { price: formatCAD(result.price), units: unitsR.ok ? unitsLabel(unitsR.value) : '', name: product.name, profit: formatCAD(result.profitAtPrice) })
                    : t('At {price} and {units} of {name}, projected operating profit would be {profit}.', { price: formatCAD(result.price), units: unitsR.ok ? unitsLabel(unitsR.value) : '', name: product.name, profit: formatCAD(result.profitAtPrice) })}{' '}
                  {isWholeCents(result.exact) ? t('The formula gives this price exactly.') : t('The formula gives {exact}, rounded up to the next cent so the target is met.', { exact: formatCADDecimals(result.exact, 4) })}
                </p>
              </div>
              {input && <ShowMath label={t('the minimum calculated price')} items={requiredPriceMath(input, result)} />}
              {result.belowVariableCost && (
                <Notice tone="warn">{t('This price is below the variable cost per unit – each {name} would lose money, but other products would still cover the target.', { name: product.name })}</Notice>
              )}
            </>
          )}
          {result.status === 'already-met' && (
            <Notice tone="success" title={t('Target already met')}>{t('Your other products already cover fixed costs and the target, even if {name} were sold at $0.', { name: product.name })}</Notice>
          )}
          {result.status === 'no-sales' && <Notice tone="error" title={t('Not Available')}>{t('A required price can’t be calculated with 0 expected sales of {name}.', { name: product.name })}</Notice>}
          <Notice tone="idea">
            {t('This is a minimum price under the entered assumptions – not a guaranteed or market-optimal price. Actual demand may change when prices change, so check that customers would still buy {units} at this price.', { units: unitsR.ok ? unitsLabel(unitsR.value) : t('that many') })}
          </Notice>
        </div>
      )}
      {input && (
        <DemandExplorer
          idPrefix="sp-demand"
          productName={product.name}
          basePrice={product.price}
          baseUnits={input.units}
          variableCost={input.variableCost}
          otherContribution={input.otherContribution}
          fixedCosts={input.fixedCosts}
          target={input.targetProfit}
        />
      )}
    </section>
  );
}

function parseSignedAmount(raw: string) {
  const text = raw.trim();
  const negative = /^[-−–]/.test(text);
  const r = parseAmount(negative ? text.slice(1) : text, tx('target profit'));
  return r.ok ? { ok: true as const, value: negative ? -r.value : r.value } : r;
}

function Field({ id, label, value, onChange, invalid, prefix, help, readOnly }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid?: boolean; prefix?: string; help?: string; readOnly?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-sage-900">{label}</label>
      <div className="mt-1">
        <CellInput id={id} label={label} value={value} onChange={onChange} invalid={invalid} prefix={prefix} width="w-full" readOnly={readOnly} />
      </div>
      {help && <p className="mt-1 text-xs text-sage-600">{help}</p>}
    </div>
  );
}

export { Field, parseSignedAmount };
