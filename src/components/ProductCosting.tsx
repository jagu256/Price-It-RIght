import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { formatCAD } from '../lib/format';
import type { OtherCosts } from '../lib/types';
import { parseMoney, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SubHeader } from './ui';

const OTHER: { key: keyof OtherCosts; label: string }[] = [
  { key: 'labour', label: 'Variable labour' },
  { key: 'packaging', label: 'Packaging' },
  { key: 'paymentFees', label: 'Payment processing fees' },
  { key: 'other', label: 'Other variable expenses' },
];

/** Shows unit costs to 4 decimal places when they are fractions of a cent. */
const fine = (v: number) => (Math.abs(v - Math.round(v * 100) / 100) > 1e-9 ? `$${v.toFixed(4)}` : formatCAD(v));

export default function ProductCosting() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();

  return (
    <section aria-labelledby="costing-title" className="space-y-5">
      <SubHeader
        id="costing-title"
        emoji="🧾"
        title="Know Your Product Costs"
        subtitle="Direct material cost = Σ (quantity of each ingredient × its cost per unit). Choose ONE cost method per product so nothing is counted twice."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {state.business.products.map((p) => {
          const mat = model.materials[p.id];
          const recipe = model.recipes[p.id];
          const errs = model.productErrors[p.id] ?? {};
          const parsed = model.products.find((x) => x.id === p.id);
          const canItemize = recipe?.status === 'complete' && mat?.total !== null;
          const manual = parseMoney(p.variableCost, 'variableCost');
          const name = p.name.trim() || 'Unnamed product';

          const addMaterialsToManual = async () => {
            if (!manual.ok || mat.total === null) return;
            const ok = await confirm({
              title: 'Add materials on top of your manual cost?',
              message: `Only do this if your manual cost of ${formatCAD(manual.value)} does NOT already include materials. It becomes “other variable expenses”, and the recipe’s ${fine(mat.total)} of materials is added: new variable cost ${formatCAD(Math.round((manual.value + mat.total) * 100) / 100)}.`,
              confirmLabel: 'Yes, materials were excluded',
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
                  <span className="block text-xs font-bold uppercase tracking-wider text-sage-600">Variable cost used</span>
                  <span className={`font-display text-xl font-extrabold ${parsed ? 'text-sage-900' : 'text-loss-700'}`}>{parsed ? formatCAD(parsed.variableCost) : 'Not available'}</span>
                </p>
              </div>

              {recipe?.status === 'complete' ? (
                <table className="data-table">
                  <caption className="sr-only">Direct materials for {name}</caption>
                  <thead><tr><th scope="col">Ingredient</th><th scope="col">Quantity</th><th scope="col" className="text-right">Cost</th></tr></thead>
                  <tbody>
                    {mat.lines.map((l) => (
                      <tr key={l.itemId}>
                        <th scope="row" className="font-normal">{l.itemName}</th>
                        <td>{l.quantityText}</td>
                        <td className={`text-right ${l.cost === null ? 'font-semibold text-loss-700' : ''}`}>{l.cost === null ? 'Missing cost' : fine(l.cost)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <th scope="row">Total direct material cost</th>
                      <td />
                      <td className="text-right">{mat.total === null ? 'Incomplete' : fine(mat.total)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="rounded-2xl bg-cream-50 p-3 text-sm text-sage-700">
                  {recipe?.status === 'invalid' ? '⚠️ The recipe has errors, so material cost can’t be calculated.' : '❓ No recipe yet – material cost is unknown.'}
                </p>
              )}
              {mat && mat.missingCostItems.length > 0 && <p className="text-xs font-semibold text-loss-700">Missing purchase cost for {mat.missingCostItems.join(', ')} – enter it in the inventory table. Missing costs are never treated as $0.</p>}

              <fieldset className="space-y-2 text-sm">
                <legend className="font-semibold text-sage-900">Cost method</legend>
                <label className="flex items-start gap-2">
                  <input type="radio" name={`cost-${p.id}`} className="mt-1" checked={p.costMode === 'manual'} onChange={() => dispatch({ type: 'set-cost-mode', id: p.id, mode: 'manual' })} />
                  <span><strong>One total variable cost</strong> ({manual.ok ? formatCAD(manual.value) : 'not set'}, edited in My Business). Materials are assumed to be included – they are never added on top.</span>
                </label>
                <label className={`flex items-start gap-2 ${canItemize || p.costMode === 'itemized' ? '' : 'opacity-60'}`}>
                  <input type="radio" name={`cost-${p.id}`} className="mt-1" disabled={!canItemize && p.costMode !== 'itemized'} checked={p.costMode === 'itemized'} onChange={() => dispatch({ type: 'set-cost-mode', id: p.id, mode: 'itemized' })} />
                  <span>
                    <strong>Itemized:</strong> direct materials from the recipe + other variable costs below.
                    {!canItemize && p.costMode !== 'itemized' && <span className="block text-xs text-sage-600">Needs a complete recipe with every ingredient cost.</span>}
                  </span>
                </label>
              </fieldset>

              {p.costMode === 'itemized' && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {OTHER.map((o) => (
                    <label key={o.key} className="text-xs font-semibold text-sage-800">
                      {o.label} (per unit)
                      <div className="mt-1">
                        <CellInput id={`other-${p.id}-${o.key}`} label={`${o.label} per unit for ${name}`} prefix="$" width="w-full" placeholder="0" value={p.otherCosts[o.key]} invalid={!!errs[o.key]} onChange={(v) => dispatch({ type: 'update-other-cost', id: p.id, field: o.key, value: v })} />
                      </div>
                    </label>
                  ))}
                  <p className="text-xs text-sage-600 sm:col-span-2">Variable cost per unit = direct materials + these costs (blank = $0), rounded to the nearest cent.</p>
                </div>
              )}
              <ErrorList messages={[errs.variableCost, ...OTHER.map((o) => errs[o.key])]} />

              {p.costMode === 'manual' && canItemize && manual.ok && (
                <button type="button" className="text-left text-xs font-semibold text-sage-700 underline underline-offset-2" onClick={addMaterialsToManual}>
                  My manual cost excludes materials – add the recipe’s {fine(mat.total!)} on top
                </button>
              )}
            </article>
          );
        })}
      </div>
      <Notice tone="info">Costs marked as estimates come from the inventory purchase costs you entered or imported. Check them against your supplier invoices.</Notice>
    </section>
  );
}
