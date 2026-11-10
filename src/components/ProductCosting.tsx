import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { t, tx } from '../i18n/i18n';
import { formatCAD, formatCADDecimals } from '../lib/format';
import type { OtherCosts } from '../lib/types';
import { parseMoney, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, Rich, SubHeader } from './ui';

const OTHER: { key: keyof OtherCosts; label: string }[] = [
  { key: 'labour', label: tx('Variable labour') },
  { key: 'packaging', label: tx('Packaging') },
  { key: 'paymentFees', label: tx('Payment processing fees') },
  { key: 'other', label: tx('Other variable expenses') },
];

/** Shows unit costs to 4 decimal places when they are fractions of a cent. */
const fine = (v: number) => (Math.abs(v - Math.round(v * 100) / 100) > 1e-9 ? formatCADDecimals(v, 4) : formatCAD(v));

export default function ProductCosting() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();

  return (
    <section aria-labelledby="costing-title" className="space-y-5">
      <SubHeader
        id="costing-title"
        emoji="🧾"
        title={t('Know Your Product Costs')}
        subtitle={t('Direct material cost = Σ (quantity of each ingredient × its cost per unit). Choose ONE cost method per product so nothing is counted twice.')}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {state.business.products.map((p) => {
          const mat = model.materials[p.id];
          const recipe = model.recipes[p.id];
          const errs = model.productErrors[p.id] ?? {};
          const parsed = model.products.find((x) => x.id === p.id);
          const canItemize = recipe?.status === 'complete' && mat?.total !== null;
          const manual = parseMoney(p.variableCost, 'variableCost');
          const name = p.name.trim() || t('Unnamed product');

          const addMaterialsToManual = async () => {
            if (!manual.ok || mat.total === null) return;
            const ok = await confirm({
              title: t('Add materials on top of your manual cost?'),
              message: t('Only do this if your manual cost of {manual} does NOT already include materials. It becomes “other variable expenses”, and the recipe’s {materials} of materials is added: new variable cost {total}.', {
                manual: formatCAD(manual.value),
                materials: fine(mat.total),
                total: formatCAD(Math.round((manual.value + mat.total) * 100) / 100),
              }),
              confirmLabel: t('Yes, materials were excluded'),
            });
            if (!ok) return;
            dispatch({ type: 'update-other-cost', id: p.id, field: 'other', value: toInputText(manual.value) });
            dispatch({ type: 'set-cost-mode', id: p.id, mode: 'itemized' });
          };

          return (
            <article key={p.id} className="card space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-lg font-bold text-sage-900">{name}</h4>
                <p className="text-right text-sm">
                  <span className="block text-xs font-bold uppercase tracking-wider text-sage-600">{t('Variable cost used')}</span>
                  <span className={`font-display text-xl font-extrabold ${parsed ? 'text-sage-900' : 'text-loss-700'}`}>{parsed ? formatCAD(parsed.variableCost) : t('Not available')}</span>
                </p>
              </div>

              {recipe?.status === 'complete' ? (
                <table className="data-table">
                  <caption className="sr-only">{t('Direct materials for {name}', { name })}</caption>
                  <thead><tr><th scope="col">{t('Ingredient')}</th><th scope="col">{t('Quantity')}</th><th scope="col" className="text-right">{t('Cost')}</th></tr></thead>
                  <tbody>
                    {mat.lines.map((l) => (
                      <tr key={l.itemId}>
                        <th scope="row" className="font-normal">{l.itemName}</th>
                        <td>{l.quantityText}</td>
                        <td className={`text-right ${l.cost === null ? 'font-semibold text-loss-700' : ''}`}>{l.cost === null ? t('Missing cost') : fine(l.cost)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <th scope="row">{t('Total direct material cost')}</th>
                      <td />
                      <td className="text-right">{mat.total === null ? t('Incomplete') : fine(mat.total)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="rounded-2xl bg-cream-50 p-3 text-sm text-sage-700">
                  {recipe?.status === 'invalid' ? `⚠️ ${t('The recipe has errors, so material cost can’t be calculated.')}` : `❓ ${t('No recipe yet – material cost is unknown.')}`}
                </p>
              )}
              {mat && mat.missingCostItems.length > 0 && <p className="text-xs font-semibold text-loss-700">{t('Missing purchase cost for {items} – enter it in the inventory table. Missing costs are never treated as $0.', { items: mat.missingCostItems.join(', ') })}</p>}

              <fieldset className="space-y-2 text-sm">
                <legend className="font-semibold text-sage-900">{t('Cost method')}</legend>
                <label className="flex items-start gap-2">
                  <input type="radio" name={`cost-${p.id}`} className="mt-1" checked={p.costMode === 'manual'} onChange={() => dispatch({ type: 'set-cost-mode', id: p.id, mode: 'manual' })} />
                  <span>
                    <Rich text={t('**One total variable cost** ({cost}, edited in My Business). Materials are assumed to be included – they are never added on top.', { cost: manual.ok ? formatCAD(manual.value) : t('not set') })} />
                  </span>
                </label>
                <label className={`flex items-start gap-2 ${canItemize || p.costMode === 'itemized' ? '' : 'opacity-60'}`}>
                  <input type="radio" name={`cost-${p.id}`} className="mt-1" disabled={!canItemize && p.costMode !== 'itemized'} checked={p.costMode === 'itemized'} onChange={() => dispatch({ type: 'set-cost-mode', id: p.id, mode: 'itemized' })} />
                  <span>
                    <Rich text={t('**Itemized:** direct materials from the recipe + other variable costs below.')} />
                    {!canItemize && p.costMode !== 'itemized' && <span className="block text-xs text-sage-600">{t('Needs a complete recipe with every ingredient cost.')}</span>}
                  </span>
                </label>
              </fieldset>

              {p.costMode === 'itemized' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {OTHER.map((o) => (
                    <label key={o.key} className="text-xs font-semibold text-sage-800">
                      {t('{label} (per unit)', { label: t(o.label) })}
                      <div className="mt-1">
                        <CellInput id={`other-${p.id}-${o.key}`} label={t('{label} per unit for {name}', { label: t(o.label), name })} prefix="$" width="w-full" placeholder="0" value={p.otherCosts[o.key]} invalid={!!errs[o.key]} onChange={(v) => dispatch({ type: 'update-other-cost', id: p.id, field: o.key, value: v })} />
                      </div>
                    </label>
                  ))}
                  <p className="text-xs text-sage-600 sm:col-span-2">{t('Variable cost per unit = direct materials + these costs (blank = $0), rounded to the nearest cent.')}</p>
                </div>
              )}
              <ErrorList messages={[errs.variableCost, ...OTHER.map((o) => errs[o.key])]} />

              {p.costMode === 'manual' && canItemize && manual.ok && (
                <button type="button" className="text-left text-xs font-semibold text-sage-700 underline underline-offset-2" onClick={addMaterialsToManual}>
                  {t('My manual cost excludes materials – add the recipe’s {amount} on top', { amount: fine(mat.total!) })}
                </button>
              )}
            </article>
          );
        })}
      </div>
      <Notice tone="info">{t('Costs marked as estimates come from the inventory purchase costs you entered or imported. Check them against your supplier invoices.')}</Notice>
    </section>
  );
}
