import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { plural, t } from '../i18n/i18n';
import { formatCAD, formatNumber } from '../lib/format';
import { formatQuantity, joinNames, parseQuantity, toBase, UNITS } from '../lib/inventory';
import { checkPlan } from '../lib/planning';
import { parseBuffer, purchasePlan } from '../lib/purchasing';
import { CellInput, ErrorList, Notice, SubHeader } from './ui';

/** 🛒 What should I buy? Shopping list for expected sales. Inputs here are not saved and never change the business. */
export default function PurchasePlanner() {
  const { model } = useStore();
  const [bufferText, setBufferText] = useState('0');
  const [packText, setPackText] = useState<Record<string, string>>({});
  const stockOk = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;

  if (!stockOk || model.products.length === 0) {
    return (
      <section aria-labelledby="buy-title" className="space-y-3">
        <SubHeader id="buy-title" emoji="🛒" title={t('What should I buy?')} />
        <Notice tone="warn">{t('Add valid inventory, products and recipes to get a shopping list.')}</Notice>
      </section>
    );
  }

  const buffer = parseBuffer(bufferText);
  const packs = model.stock.map((s) => {
    const raw = packText[s.id] ?? '';
    const r = raw.trim() === '' ? null : parseQuantity(raw, 'required');
    return { s, raw, r };
  });
  const errors = [
    buffer.ok ? undefined : buffer.error,
    ...packs.map(({ s, r }) => (r && !r.ok ? t('{name} pack size: {error}', { name: s.name, error: r.error }) : undefined)),
  ];
  const valid = buffer.ok && packs.every(({ r }) => !r || r.ok);
  const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
  const check = checkPlan(demand, model.products, model.recipes, model.stock);
  const packBase = Object.fromEntries(packs.flatMap(({ s, r }) => (r && r.ok ? [[s.id, toBase(r.value, s.unit)]] : [])));
  const plan = valid && buffer.ok ? purchasePlan(check, model.stock, buffer.basisPoints, packBase) : null;
  const packOf = (id: string) => packs.find((p) => p.s.id === id)!;

  return (
    <section aria-labelledby="buy-title" className="space-y-5">
      <SubHeader id="buy-title" emoji="🛒" title={t('What should I buy?')} subtitle={t('A shopping list so your inventory covers expected sales for every product with a recipe.')} />
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="buy-buffer" className="text-sm font-semibold text-sage-800">{t('Safety buffer (extra % above expected needs)')}</label>
          <CellInput id="buy-buffer" label={t('Safety buffer (extra % above expected needs)')} value={bufferText} invalid={!buffer.ok} width="w-20" onChange={setBufferText} />
          <span className="text-sm text-sage-600">%</span>
        </div>
        <ErrorList messages={errors} />
        {!valid && <p className="text-sm font-semibold text-loss-700">{t('Fix the highlighted values to see the shopping list.')}</p>}

        {plan && plan.lines.length === 0 && (
          <Notice tone="success" title={t('Nothing to buy')}>{t('Your current inventory already covers expected sales (plus the safety buffer) for every product with a recipe.')}</Notice>
        )}
        {plan && plan.lines.length > 0 && (
          <>
            <div className="overflow-x-auto" aria-live="polite">
              <table className="data-table min-w-[42rem]">
                <caption className="sr-only">{t('Shopping list')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('Item')}</th>
                    <th scope="col" className="text-right">{t('Needed (with buffer)')}</th>
                    <th scope="col" className="text-right">{t('Have')}</th>
                    <th scope="col">{t('Pack size (optional)')}</th>
                    <th scope="col" className="text-right">{t('Buy')}</th>
                    <th scope="col" className="text-right">{t('Estimated cost')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.lines.map((l) => {
                    const p = packOf(l.itemId);
                    return (
                      <tr key={l.itemId}>
                        <th scope="row" className="font-semibold">{l.name}</th>
                        <td className="text-right">{formatQuantity(l.targetBase, l.dimension, 'short')}</td>
                        <td className="text-right">{formatQuantity(l.availableBase, l.dimension, 'short')}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <CellInput id={`buy-pack-${l.itemId}`} label={t('Pack size for {name} in {unit}', { name: l.name, unit: UNITS[l.unit].short })} value={p.raw} invalid={!!p.r && !p.r.ok} width="w-20" placeholder="—" onChange={(v) => setPackText((old) => ({ ...old, [l.itemId]: v }))} />
                            <span className="text-xs text-sage-600">{UNITS[l.unit].short}</span>
                          </div>
                        </td>
                        <td className="text-right font-semibold">
                          {formatQuantity(l.buyBase, l.dimension, 'short')}
                          {l.packs !== null && <span className="block text-xs font-normal text-sage-600">{plural(l.packs, '{n} pack', '{n} packs', { n: formatNumber(l.packs) })}</span>}
                        </td>
                        <td className="text-right">{l.cost === null ? <span className="text-butter-700">{t('Unknown cost')}</span> : formatCAD(l.cost)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold">
                    <th scope="row" colSpan={5}>{plan.unknownCost.length ? t('Total of the known costs') : t('Total estimated purchase cost')}</th>
                    <td className="text-right">{formatCAD(plan.knownCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {plan.unknownCost.length > 0 && (
              <Notice tone="warn">{t('No purchase cost is entered for {names}, so the total leaves them out. Add their cost per unit in the inventory table.', { names: joinNames(plan.unknownCost) })}</Notice>
            )}
          </>
        )}
        {check.unknownProducts.length > 0 && (
          <p className="text-sm text-sage-700">{t('Not included (no recipe): {names}.', { names: joinNames(check.unknownProducts) })}</p>
        )}
        <Notice tone="idea" title={t('Buying stock is not an expense yet')}>
          {t('Paying for inventory uses cash, but it does not reduce operating profit when you buy it. Its cost is counted (through variable cost per unit) when the products are sold. The list is for expected sales; packs are rounded up, so you may buy a little extra. Pack sizes and the buffer are not saved.')}
        </Notice>
      </div>
    </section>
  );
}
