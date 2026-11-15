import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { businessSummary } from '../lib/business';
import { costPlusPrice, parseRate, type PricingMethod } from '../lib/costPlus';
import { formatCAD, formatCADDecimals, formatPercent, formatSignedCAD } from '../lib/format';
import { toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SignedMoney, SubHeader } from './ui';

/** 🏷️ Cost-plus pricing helper. A starting point only – not a guaranteed or market-tested price. */
export default function CostPlusPricing() {
  const { model, dispatch } = useStore();
  const [productId, setProductId] = useState('');
  const [method, setMethod] = useState<PricingMethod>('markup');
  const [rateText, setRateText] = useState('50');
  const [tried, setTried] = useState(false);
  if (!model.summary || model.fixedCosts === null || model.products.length === 0) return null;

  const product = model.products.find((p) => p.id === productId) ?? model.products[0];
  const rate = parseRate(rateText, method);
  const r = rate.ok ? costPlusPrice(product.variableCost, method, rate.basisPoints) : null;
  const after = r ? businessSummary(model.products.map((p) => (p.id === product.id ? { ...p, price: r.price } : p)), model.fixedCosts) : null;

  return (
    <section aria-labelledby="costplus-title" className="space-y-5">
      <SubHeader id="costplus-title" emoji="🏷️" title={t('Cost-plus pricing helper')} term="markup" subtitle={t('Get a starting price from a product’s variable cost, using a markup or a target margin.')} />
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-sage-800">
            {t('Product')}
            <select className="select w-auto" value={product.id} onChange={(e) => { setProductId(e.target.value); setTried(false); }}>
              {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <fieldset className="flex flex-wrap gap-3 text-sm">
            <legend className="mb-1 font-semibold text-sage-800">{t('Method')}</legend>
            <label className="flex items-center gap-1.5"><input type="radio" name="costplus-method" checked={method === 'markup'} onChange={() => { setMethod('markup'); setTried(false); }} /> {t('Markup on cost')}</label>
            <label className="flex items-center gap-1.5"><input type="radio" name="costplus-method" checked={method === 'margin'} onChange={() => { setMethod('margin'); setTried(false); }} /> {t('Margin on price')}</label>
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="costplus-rate" className="text-sm font-semibold text-sage-800">{method === 'markup' ? t('Markup %') : t('Target margin %')}</label>
            <div className="flex items-center gap-1">
              <CellInput id="costplus-rate" label={method === 'markup' ? t('Markup %') : t('Target margin %')} value={rateText} invalid={!rate.ok} width="w-24" onChange={(v) => { setRateText(v); setTried(false); }} />
              <span className="text-sm text-sage-600">%</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-sage-700">{t('Variable cost of {name}: {cost} per unit · current price {price}', { name: product.name, cost: formatCAD(product.variableCost), price: formatCAD(product.price) })}</p>
        <ErrorList messages={[rate.ok ? undefined : rate.error]} />

        {r && after && (
          <div className="space-y-3" aria-live="polite">
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Cost-plus price')}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-sage-900">{formatCADDecimals(r.price, 2)}</dd>
                <dd className="text-xs text-sage-600">{t('Rounded up to the next cent')}</dd>
              </div>
              <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Contribution margin per unit')}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-sage-900">{formatCADDecimals(r.cmPerUnit, 2)}</dd>
                <dd className="text-xs text-sage-600">
                  {t('Markup {markup} · margin {margin}', {
                    markup: r.markupPercent === null ? t('N/A') : formatPercent(r.markupPercent),
                    margin: r.marginPercent === null ? t('N/A') : formatPercent(r.marginPercent),
                  })}
                </dd>
              </div>
              <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Operating profit at this price')}</dt>
                <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-sage-900"><SignedMoney value={after.operatingProfit} text={formatCAD(after.operatingProfit)} /></dd>
                <dd className="text-xs text-sage-600">{t('{change} vs now, if expected units stay the same', { change: formatSignedCAD(after.operatingProfit - model.summary.operatingProfit) })}</dd>
              </div>
            </dl>
            <p className="text-sm text-sage-700">
              {method === 'markup'
                ? t('A {rate} markup on cost is the same as a {other} margin on price.', { rate: formatPercent(rate.ok ? rate.basisPoints / 100 : 0), other: formatPercent(r.equivalentPercent) })
                : t('A {rate} margin on price is the same as a {other} markup on cost.', { rate: formatPercent(rate.ok ? rate.basisPoints / 100 : 0), other: formatPercent(r.equivalentPercent) })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  dispatch({ type: 'scenario-set', productId: product.id, field: 'price', value: toInputText(r.price) });
                  setTried(true);
                }}
              >
                {t('Try {price} in the What-If simulator', { price: formatCADDecimals(r.price, 2) })}
              </button>
              {tried && <span role="status" className="text-sm font-semibold text-sage-700">{t('Added to the modified plan above – your business is not changed until you apply it.')}</span>}
            </div>
          </div>
        )}
        <Notice tone="idea" title={t('Markup or margin?')}>
          {t('Markup is profit as a % of COST; margin is profit as a % of PRICE, so the same dollar amount is a bigger markup than margin. This helper uses variable cost only: fixed costs still have to be covered by total contribution margin, so check break-even too. A cost-plus price is a starting point – it ignores what customers will pay and what competitors charge.')}
        </Notice>
      </div>
    </section>
  );
}
