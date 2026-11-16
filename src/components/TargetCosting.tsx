import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { parseRate, targetCost } from '../lib/costPlus';
import { formatCADDecimals, formatPercent } from '../lib/format';
import { parseMoney, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SubHeader } from './ui';

/** 🎯 Target costing: from the price customers will pay and the margin you want, the most a unit may cost. */
export default function TargetCosting() {
  const { model } = useStore();
  const [productId, setProductId] = useState('');
  const [priceText, setPriceText] = useState<string | null>(null);
  const [marginText, setMarginText] = useState('60');
  if (!model.summary || model.products.length === 0) return null;

  const product = model.products.find((p) => p.id === productId) ?? model.products[0];
  const text = priceText ?? toInputText(product.price);
  const price = parseMoney(text, 'sellingPrice');
  const margin = parseRate(marginText, 'margin');
  const r = price.ok && margin.ok ? targetCost(price.value, margin.basisPoints, product.variableCost) : null;

  return (
    <section aria-labelledby="target-cost-title" className="space-y-5">
      <SubHeader id="target-cost-title" emoji="🎯" title={t('Target costing')} term="margin" subtitle={t('Start from the price customers will pay and the margin you want: what is the most one unit may cost?')} />
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-sage-800">
            {t('Product')}
            <select className="select w-auto" value={product.id} onChange={(e) => { setProductId(e.target.value); setPriceText(null); }}>
              {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="tc-price" className="text-sm font-semibold text-sage-800">{t('Market price')}</label>
            <CellInput id="tc-price" label={t('Market price')} prefix="$" value={text} invalid={!price.ok} width="w-28" onChange={setPriceText} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="tc-margin" className="text-sm font-semibold text-sage-800">{t('Target margin %')}</label>
            <div className="flex items-center gap-1">
              <CellInput id="tc-margin" label={t('Target margin %')} value={marginText} invalid={!margin.ok} width="w-20" onChange={setMarginText} />
              <span className="text-sm text-sage-600">%</span>
            </div>
          </div>
        </div>
        <ErrorList messages={[price.ok ? undefined : price.error, margin.ok ? undefined : margin.error]} />
        {r && (
          <div className="space-y-2" aria-live="polite">
            <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('Target cost per unit')}</p>
              <p className="font-display text-3xl font-extrabold">{formatCADDecimals(r.targetCost, 2)}</p>
              <p className="text-sm opacity-95">
                {r.reductionNeeded > 0
                  ? t('Today’s variable cost of {cost} must fall by {cut} ({pct}) to reach this margin.', { cost: formatCADDecimals(product.variableCost, 2), cut: formatCADDecimals(r.reductionNeeded, 2), pct: r.reductionPercent === null ? t('N/A') : formatPercent(r.reductionPercent) })
                  : t('Today’s variable cost of {cost} already meets this margin, with {room} to spare per unit.', { cost: formatCADDecimals(product.variableCost, 2), room: formatCADDecimals(-r.reductionNeeded, 2) })}
              </p>
            </div>
            <p className="text-sm text-sage-700">{t('Actual margin at the target cost: {pct} (the cost is rounded down to the cent, so the margin is at least what you asked for).', { pct: r.actualMarginPercent === null ? t('N/A') : formatPercent(r.actualMarginPercent) })}</p>
          </div>
        )}
        <Notice tone="idea" title={t('Cost-plus vs target costing')}>
          {t('Cost-plus starts from your cost and adds a markup to get a price. Target costing works backwards: the market sets the price, you choose the margin, and target cost = price × (1 − margin). If your cost is higher, look for cheaper ingredients, smaller portions or less waste. Nothing here changes your business.')}
        </Notice>
      </div>
    </section>
  );
}
