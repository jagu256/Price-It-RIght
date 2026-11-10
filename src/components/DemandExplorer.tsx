import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '../app/language';
import { plural, t } from '../i18n/i18n';
import { bestPrice, parseUnitsPerDollar, pricesForTarget, profitCurve, type DemandAssumption, type ProfitContext } from '../lib/demand';
import { formatCAD, formatCompactCAD, formatNumber, unitsLabel } from '../lib/format';
import ChartContainer from './ChartContainer';
import { Field } from './SmartPricing';
import { ErrorList, Notice, Rich } from './ui';

interface Props {
  /** Makes ids unique when the panel appears twice. */
  idPrefix: string;
  productName: string;
  /** Current price and expected units (where the line is anchored). */
  basePrice: number;
  baseUnits: number;
  variableCost: number;
  otherContribution: number;
  fixedCosts: number;
  /** Optional profit target – shows the prices that reach it. */
  target?: number;
  /** Optional: copy the best price (and its units) somewhere, e.g. the What-If plan. */
  onTry?: (price: number, units: number) => void;
}

/** 📉 OPTIONAL price-sensitive demand: off by default, so nothing else changes unless it is ticked. */
export default function DemandExplorer(props: Props) {
  const [on, setOn] = useState(false);
  const [xText, setXText] = useState('');
  const x = parseUnitsPerDollar(xText);
  const p = props;

  return (
    <div className="space-y-4 rounded-2xl bg-cream-50 p-4 ring-1 ring-sage-100">
      <label className="flex items-start gap-2 text-sm font-semibold text-sage-900">
        <input type="checkbox" className="mt-1" checked={on} onChange={(e) => setOn(e.target.checked)} />
        <span>
          📉 {t('Optional assumption: customers react to the price of {name}', { name: p.productName })}
          <span className="block text-xs font-normal text-sage-600">{t('Off by default. When it is off, every result stays exactly as before.')}</span>
        </span>
      </label>
      {on && (
        <>
          <div className="max-w-sm">
            <Field
              id={`${p.idPrefix}-x`}
              label={t('For every $1 change in price, sales change by this many units (opposite direction)')}
              value={xText}
              onChange={setXText}
              invalid={xText.trim() !== '' && !x.ok}
              help={t('Whole units, 0 or more. Starts from {units} at {price}.', { units: unitsLabel(p.baseUnits), price: formatCAD(p.basePrice) })}
            />
            <ErrorList messages={[xText.trim() === '' || x.ok ? undefined : x.error]} />
          </div>
          {x.ok && (
            <Results
              {...p}
              a={{ basePrice: p.basePrice, baseUnits: p.baseUnits, unitsPerDollar: x.value }}
              ctx={{ variableCost: p.variableCost, otherContribution: p.otherContribution, fixedCosts: p.fixedCosts }}
            />
          )}
          <Notice tone="warn" title={t('An assumption, not a forecast')}>
            <Rich
              text={t(
                'This straight-line rule is something you choose. Real customers may react differently, and the effect may not be the same for every $1. The best price below is the best price **under this assumption only** – not a guaranteed or market-optimal price.',
              )}
            />
          </Notice>
        </>
      )}
    </div>
  );
}

function Results({ a, ctx, target, onTry, idPrefix, productName }: Props & { a: DemandAssumption; ctx: ProfitContext }) {
  const { lang } = useLanguage(); // results include sentences, so redo them when the language changes
  // Checking every cent can mean up to 2 million prices, so only redo it when an input changes.
  const deps = [a.basePrice, a.baseUnits, a.unitsPerDollar, ctx.variableCost, ctx.otherContribution, ctx.fixedCosts, lang];
  const best = useMemo(() => bestPrice(a, ctx), deps); // eslint-disable-line react-hooks/exhaustive-deps
  const curve = useMemo(() => profitCurve(a, ctx), deps); // eslint-disable-line react-hooks/exhaustive-deps
  const forTarget = useMemo(() => (target === undefined ? null : pricesForTarget(a, ctx, target)), [...deps, target]); // eslint-disable-line react-hooks/exhaustive-deps

  if (best.status === 'no-maximum') return <Notice tone="info" title={t('No best price')}>{best.reason}</Notice>;

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50" data-testid={`${idPrefix}-best`}>
        <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('Best price under this assumption only')}</p>
        <p className="font-display text-3xl font-extrabold tabular-nums">{formatCAD(best.price)}</p>
        <p className="text-sm opacity-95">
          {t('Sells {units} of {name}, for an operating profit of {profit}.', { units: unitsLabel(best.units), name: productName, profit: formatCAD(best.profit) })}{' '}
          {best.range.capped
            ? t('Found by checking every cent from {from} to {to} ({count} prices) – the search stops at $20,000.', {
                from: formatCAD(best.range.from),
                to: formatCAD(best.range.to),
                count: formatNumber(best.range.pricesChecked),
              })
            : t('Found by checking every cent from {from} to {to} ({count} prices), where sales reach zero.', {
                from: formatCAD(best.range.from),
                to: formatCAD(best.range.to),
                count: formatNumber(best.range.pricesChecked),
              })}
          {best.tiedPrices > 0 &&
            ' ' + plural(best.tiedPrices, '{n} other price earns the same; the lowest is shown.', '{n} other prices earn the same; the lowest is shown.', { n: formatNumber(best.tiedPrices) })}
        </p>
      </div>
      {onTry && (
        <button type="button" className="btn-secondary" onClick={() => onTry(best.price, best.units)}>
          {t('Try {price} ({units}) in the modified plan', { price: formatCAD(best.price), units: unitsLabel(best.units) })}
        </button>
      )}

      {forTarget && forTarget.status === 'ok' && (
        <p className="text-sm text-sage-800">
          <Rich
            text={t(
              '**Prices that reach your {target} target under this assumption:** lowest {low} ({lowUnits}, {lowProfit}), highest {high} ({highUnits}, {highProfit}). Because sales are whole units, a few prices between these can fall just short – check the exact price before using it.',
              {
                target: formatCAD(target!),
                low: formatCAD(forTarget.lowest.price),
                lowUnits: unitsLabel(forTarget.lowest.units),
                lowProfit: formatCAD(forTarget.lowest.profit),
                high: formatCAD(forTarget.highest.price),
                highUnits: unitsLabel(forTarget.highest.units),
                highProfit: formatCAD(forTarget.highest.profit),
              },
            )}
          />
        </p>
      )}
      {forTarget && forTarget.status === 'unreachable' && (
        <Notice tone="error" title={t('Target not reachable under this assumption')}>
          {t('No price from {from} to {to} reaches {target}. The most this product can help is {profit} at {price}.', {
            from: formatCAD(forTarget.range.from),
            to: formatCAD(forTarget.range.to),
            target: formatCAD(target!),
            profit: formatCAD(best.profit),
            price: formatCAD(best.price),
          })}
        </Notice>
      )}

      <figure>
        <figcaption className="text-sm font-semibold text-sage-900">{t('Operating profit at different prices of {name} (other products unchanged)', { name: productName })}</figcaption>
        <div className="mt-2 h-64" role="img" aria-label={t('Line chart of operating profit against the price of {name}', { name: productName })}>
          <ChartContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 16, right: 16, bottom: 20, left: 8 }}>
              <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" />
              <XAxis
                dataKey="price"
                type="number"
                domain={[0, 'dataMax']}
                tickFormatter={(v) => formatCAD(v)}
                stroke="#3E5A40"
                tick={{ fontSize: 11 }}
                label={{ value: t('Price of {name}', { name: productName }), position: 'insideBottom', offset: -12, fill: '#3E5A40', fontSize: 12 }}
              />
              <YAxis tickFormatter={formatCompactCAD} stroke="#3E5A40" tick={{ fontSize: 11 }} width={64} />
              <Tooltip
                contentStyle={{ borderRadius: 16 }}
                labelFormatter={(v) => t('Price {price}', { price: formatCAD(Number(v)) })}
                formatter={(v: number, n: string) => (n === 'units' ? [formatNumber(v), t('Units sold')] : [formatCAD(v), t('Operating profit')])}
              />
              <ReferenceLine y={0} stroke="#3E5A40" />
              <ReferenceLine x={a.basePrice} stroke="#86A882" strokeDasharray="2 4" label={{ value: t('Now'), position: 'insideTopLeft', fill: '#3E5A40', fontSize: 11 }} />
              <Line type="linear" dataKey="profit" name="profit" stroke="#4F7150" strokeWidth={3} dot={false} />
              <ReferenceDot x={best.price} y={best.profit} r={7} fill="#FAEDA8" stroke="#304633" strokeWidth={2.5} label={{ value: t('Best'), position: 'top', fill: '#304633', fontSize: 12, fontWeight: 700 }} />
            </LineChart>
          </ChartContainer>
        </div>
      </figure>
    </div>
  );
}
