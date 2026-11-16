import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatCAD, formatCADDecimals, formatNumber, formatPercent, unitsLabel } from '../lib/format';
import { volumeForPrice } from '../lib/pricing';
import { parseMoney, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SubHeader } from './ui';

/** 🔁 Price change: how many units keep the same profit? An experiment – nothing changes until applied in What-If. */
export default function PriceChangeVolume() {
  const { model, dispatch } = useStore();
  const [productId, setProductId] = useState('');
  const [priceText, setPriceText] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  if (!model.summary || model.products.length === 0) return null;

  const product = model.products.find((p) => p.id === productId) ?? model.products[0];
  const text = priceText ?? toInputText(product.price);
  const price = parseMoney(text, 'sellingPrice');
  const r = price.ok ? volumeForPrice(product, price.value) : null;

  return (
    <section aria-labelledby="pcv-title" className="space-y-5">
      <SubHeader id="pcv-title" emoji="🔁" title={t('Price change: how many must I sell?')} term="contributionMargin" subtitle={t('If you change one product’s price, how many units keep your profit the same?')} />
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-semibold text-sage-800">
            {t('Product')}
            <select className="select w-auto" value={product.id} onChange={(e) => { setProductId(e.target.value); setPriceText(null); setTried(false); }}>
              {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="pcv-price" className="text-sm font-semibold text-sage-800">{t('New price')}</label>
            <CellInput id="pcv-price" label={t('New price')} prefix="$" value={text} invalid={!price.ok} width="w-28" onChange={(v) => { setPriceText(v); setTried(false); }} />
          </div>
        </div>
        <p className="text-sm text-sage-700">{t('Now: {price} each, variable cost {cost}, {units} a month.', { price: formatCADDecimals(product.price, 2), cost: formatCADDecimals(product.variableCost, 2), units: unitsLabel(product.units) })}</p>
        <ErrorList messages={[price.ok ? undefined : price.error]} />

        {r?.status === 'not-possible' && (
          <Notice tone="warn" title={t('Not possible')}>
            {t('At this price each unit earns {cm} of contribution margin, so no number of sales can replace the contribution you earn now.', { cm: formatCADDecimals(r.newCMPerUnit, 2) })}
          </Notice>
        )}
        {r?.status === 'ok' && (
          <div className="space-y-3" aria-live="polite">
            <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('To keep the same profit')}</p>
              <p className="font-display text-3xl font-extrabold">{t('Sell {units}', { units: unitsLabel(r.requiredUnits) })}</p>
              <p className="text-sm opacity-95">
                {r.unitChange > 0
                  ? t('{n} more than now ({pct}).', { n: formatNumber(r.unitChange), pct: r.percentChange === null ? t('N/A') : `+${formatPercent(r.percentChange)}` })
                  : r.unitChange < 0
                    ? t('You could sell {n} fewer ({pct}) and still earn the same.', { n: formatNumber(-r.unitChange), pct: r.percentChange === null ? t('N/A') : formatPercent(r.percentChange) })
                    : t('The same number as now.')}
              </p>
            </div>
            <p className="text-sm text-sage-700">
              {t('Contribution margin per unit goes from {old} to {new}. Units needed = current total contribution {total} ÷ {new}, rounded up.', {
                old: formatCADDecimals(r.oldCMPerUnit, 2),
                new: formatCADDecimals(r.newCMPerUnit, 2),
                total: formatCAD(r.currentContribution),
              })}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  dispatch({ type: 'scenario-set', productId: product.id, field: 'price', value: text });
                  dispatch({ type: 'scenario-set', productId: product.id, field: 'units', value: String(r.requiredUnits) });
                  setTried(true);
                }}
              >
                {t('Try it in the What-If simulator')}
              </button>
              {tried && <span role="status" className="text-sm font-semibold text-sage-700">{t('Added to the modified plan above – your business is not changed until you apply it.')}</span>}
            </div>
          </div>
        )}
        <Notice tone="idea" title={t('How this works')}>
          {t('Fixed costs don’t change with price, so profit stays the same when the product’s total contribution margin stays the same. A price cut lowers the margin on every unit, so you need more units; a rise means you can afford to lose some sales. This assumes the variable cost per unit stays the same – it doesn’t tell you whether customers will actually buy that many.')}
        </Notice>
      </div>
    </section>
  );
}
