import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatCAD, formatNumber } from '../lib/format';
import { parseMoney, parseUnits, toInputText } from '../lib/validation';
import { varianceAnalysis, varianceLabel } from '../lib/variance';
import { CellInput, ErrorList, Notice, SignedMoney, SubHeader } from './ui';

type Field = 'units' | 'price' | 'variableCost';

/** A variance with its F / U label, e.g. "$45 F". */
function Var({ amount }: { amount: number | null }) {
  if (amount === null) return <span title={t('Not available – the budget has no units, so there is no budget mix.')}>{t('N/A')}</span>;
  const label = varianceLabel(amount);
  return (
    <span className={`tabular-nums ${amount < 0 ? 'text-loss-700' : amount > 0 ? 'text-sage-800' : ''}`}>
      {formatCAD(Math.abs(amount))} {label && <abbr title={label === 'F' ? t('Favourable – raised profit') : t('Unfavourable – lowered profit')}>{label === 'F' ? t('F') : t('U')}</abbr>}
    </span>
  );
}

/**
 * 📋 Budget vs actual. The budget is the business as entered; the actual
 * figures are typed in here, kept on this screen only, and never change the business.
 */
export default function VarianceAnalysis() {
  const { model } = useStore();
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [fixedTyped, setFixedTyped] = useState<string | null>(null);
  if (!model.summary || model.fixedCosts === null) return null;

  const products = model.products;
  const budgetText = (id: string, f: Field) => {
    const p = products.find((x) => x.id === id)!;
    return f === 'units' ? String(p.units) : toInputText(f === 'price' ? p.price : p.variableCost);
  };
  const text = (id: string, f: Field) => typed[`${id}:${f}`] ?? budgetText(id, f);
  const fixedText = fixedTyped ?? toInputText(model.fixedCosts);

  const parsed = products.map((p) => ({
    p,
    units: parseUnits(text(p.id, 'units')),
    price: parseMoney(text(p.id, 'price'), 'sellingPrice'),
    variableCost: parseMoney(text(p.id, 'variableCost'), 'variableCost'),
  }));
  const fixed = parseMoney(fixedText, 'fixedCosts');
  const errors = [
    ...parsed.flatMap(({ p, units, price, variableCost }) => [
      units.ok ? undefined : t('{name} – actual units: {error}', { name: p.name, error: units.error }),
      price.ok ? undefined : t('{name} – actual price: {error}', { name: p.name, error: price.error }),
      variableCost.ok ? undefined : t('{name} – actual variable cost: {error}', { name: p.name, error: variableCost.error }),
    ]),
    fixed.ok ? undefined : t('Actual fixed costs: {error}', { error: fixed.error }),
  ];
  const valid = parsed.every((x) => x.units.ok && x.price.ok && x.variableCost.ok) && fixed.ok;
  const r = valid
    ? varianceAnalysis(
        products,
        model.fixedCosts,
        parsed.map(({ p, units, price, variableCost }) => ({
          id: p.id,
          units: units.ok ? units.value : 0,
          price: price.ok ? price.value : 0,
          variableCost: variableCost.ok ? variableCost.value : 0,
        })),
        fixed.ok ? fixed.value : 0,
      )
    : null;
  const set = (id: string, f: Field, v: string) => setTyped((old) => ({ ...old, [`${id}:${f}`]: v }));

  return (
    <section aria-labelledby="variance-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader
        id="variance-title"
        term="variance"
        emoji="📋"
        title={t('Budget vs actual')}
        subtitle={t('After a month, type in what really happened. The app explains the difference from your plan (the budget) as variances. Nothing here changes your business.')}
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-small" onClick={() => { setTyped({}); setFixedTyped(null); }}>↺ {t('Start again from the budget')}</button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[40rem]">
          <caption className="sr-only">{t('Actual results for the month')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('Product')}</th>
              <th scope="col">{t('Actual units sold')}</th>
              <th scope="col">{t('Actual price')}</th>
              <th scope="col">{t('Actual variable cost / unit')}</th>
              <th scope="col" className="text-right">{t('Budget units')}</th>
            </tr>
          </thead>
          <tbody>
            {parsed.map(({ p, units, price, variableCost }) => (
              <tr key={p.id}>
                <th scope="row" className="font-semibold">{p.name}</th>
                <td><CellInput id={`var-units-${p.id}`} label={t('Actual units sold of {name}', { name: p.name })} inputMode="numeric" value={text(p.id, 'units')} invalid={!units.ok} width="w-24" onChange={(v) => set(p.id, 'units', v)} /></td>
                <td><CellInput id={`var-price-${p.id}`} label={t('Actual price of {name}', { name: p.name })} prefix="$" value={text(p.id, 'price')} invalid={!price.ok} width="w-24" onChange={(v) => set(p.id, 'price', v)} /></td>
                <td><CellInput id={`var-vc-${p.id}`} label={t('Actual variable cost per unit of {name}', { name: p.name })} prefix="$" value={text(p.id, 'variableCost')} invalid={!variableCost.ok} width="w-24" onChange={(v) => set(p.id, 'variableCost', v)} /></td>
                <td className="text-right text-sage-600">{formatNumber(p.units)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="var-fixed" className="text-sm font-semibold text-sage-800">{t('Actual fixed costs for the month')}</label>
        <CellInput id="var-fixed" label={t('Actual fixed costs for the month')} prefix="$" value={fixedText} invalid={!fixed.ok} width="w-32" onChange={setFixedTyped} />
        <span className="text-xs text-sage-600">{t('Budget: {amount}', { amount: formatCAD(model.fixedCosts) })}</span>
      </div>
      <ErrorList messages={errors} />
      {!valid && <p className="text-sm font-semibold text-loss-700">{t('Fix the highlighted values to see the variances.')}</p>}

      {r && (
        <>
          <div className="overflow-x-auto" aria-live="polite">
            <table className="data-table min-w-[30rem]">
              <caption className="text-left text-sm font-semibold text-sage-900">{t('From budgeted profit to actual profit')}</caption>
              <tbody>
                <tr><th scope="row">{t('Budgeted operating profit (static budget)')}</th><td className="text-right font-semibold"><SignedMoney value={r.staticProfit} text={formatCAD(r.staticProfit)} /></td></tr>
                <tr><th scope="row">+ {t('Sales volume variance')}</th><td className="text-right"><Var amount={r.volume} /></td></tr>
                <tr className="text-sm text-sage-600"><th scope="row" className="pl-8 font-normal">{t('of which sales quantity variance')}</th><td className="text-right"><Var amount={r.quantity} /></td></tr>
                <tr className="text-sm text-sage-600"><th scope="row" className="pl-8 font-normal">{t('of which sales mix variance')}</th><td className="text-right"><Var amount={r.mix} /></td></tr>
                <tr className="bg-cream-50"><th scope="row">= {t('Flexible budget profit (actual units, budget prices and costs)')}</th><td className="text-right font-semibold"><SignedMoney value={r.flexibleProfit} text={formatCAD(r.flexibleProfit)} /></td></tr>
                <tr><th scope="row">+ {t('Selling price variance')}</th><td className="text-right"><Var amount={r.price} /></td></tr>
                <tr><th scope="row">+ {t('Variable cost variance')}</th><td className="text-right"><Var amount={r.variableCost} /></td></tr>
                <tr><th scope="row">+ {t('Fixed cost variance')}</th><td className="text-right"><Var amount={r.fixedCosts} /></td></tr>
                <tr className="font-bold"><th scope="row">= {t('Actual operating profit')}</th><td className="text-right"><SignedMoney value={r.actualProfit} text={formatCAD(r.actualProfit)} /></td></tr>
                <tr className="font-bold"><th scope="row">{t('Total variance')}</th><td className="text-right"><Var amount={r.total} /></td></tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table min-w-[36rem]">
              <caption className="text-left text-sm font-semibold text-sage-900">{t('Variances by product')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Product')}</th>
                  <th scope="col" className="text-right">{t('Sales volume')}</th>
                  <th scope="col" className="text-right">{t('Selling price')}</th>
                  <th scope="col" className="text-right">{t('Variable cost')}</th>
                  <th scope="col" className="text-right">{t('Total')}</th>
                </tr>
              </thead>
              <tbody>
                {r.products.map((p) => (
                  <tr key={p.id}>
                    <th scope="row" className="font-semibold">{p.name}</th>
                    <td className="text-right"><Var amount={p.volume} /></td>
                    <td className="text-right"><Var amount={p.price} /></td>
                    <td className="text-right"><Var amount={p.variableCost} /></td>
                    <td className="text-right font-semibold"><Var amount={p.total} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-sage-700">{t('Actual revenue: {amount}.', { amount: formatCAD(r.actualRevenue) })}</p>
        </>
      )}

      <Notice tone="idea" title={t('How to read this')}>
        {t('F (favourable) means the difference raised profit; U (unfavourable) means it lowered profit. Sales volume variance = (actual units − budget units) × budget CM per unit; it splits into quantity (selling more or fewer units in total) and mix (selling a different mix of products). Price variance = (actual price − budget price) × actual units. Variable cost variance = (budget − actual variable cost per unit) × actual units. Fixed cost variance = budget − actual fixed costs. The variances add up exactly to the difference between budgeted and actual profit. These actual figures are not saved.')}
      </Notice>
    </section>
  );
}
