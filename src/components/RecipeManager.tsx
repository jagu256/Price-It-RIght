import { useEffect, useMemo, useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { UNITS, UNIT_OPTIONS, type UnitId } from '../lib/inventory';
import { evaluateRecipe } from '../lib/recipes';
import type { RecipeLineInput } from '../lib/types';
import ImportWizard from './ImportWizard';
import { CellInput, Notice, SubHeader } from './ui';

type DraftLine = Omit<RecipeLineInput, 'id'> & { key: number };

const STATUS = {
  complete: { label: 'Complete recipe', cls: 'bg-sage-100 text-sage-800', icon: '✅' },
  missing: { label: 'Requirements unknown', cls: 'bg-cream-200 text-sage-700', icon: '❓' },
  invalid: { label: 'Recipe has errors', cls: 'bg-loss-100 text-loss-700', icon: '⚠️' },
};

export default function RecipeManager() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const products = state.business.products;
  const inventory = state.business.inventory;
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const product = products.find((p) => p.id === productId) ?? products[0];
  const saved = product ? state.business.recipes[product.id] ?? [] : [];
  const savedKey = JSON.stringify(saved.map(({ itemId, quantity, unit }) => ({ itemId, quantity, unit })));

  const [draft, setDraft] = useState<DraftLine[]>([]);
  const [nextKey, setNextKey] = useState(1);
  useEffect(() => {
    setDraft(saved.map((l, i) => ({ key: i + 1, itemId: l.itemId, quantity: l.quantity, unit: l.unit })));
    setNextKey(saved.length + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, savedKey]);

  const draftKey = JSON.stringify(draft.map(({ itemId, quantity, unit }) => ({ itemId, quantity, unit })));
  const dirty = draftKey !== savedKey;
  const recordNames = useMemo(() => new Map(inventory.map((r) => [r.id, r.name.trim() || 'Unnamed item'])), [inventory]);
  const evaluated = evaluateRecipe(draft.map((d) => ({ ...d, id: String(d.key) })), model.stockById, recordNames);

  const choose = async (id: string) => {
    if (dirty && !(await confirm({ title: 'Discard unsaved recipe changes?', message: `Your changes to the ${product?.name} recipe have not been saved.`, confirmLabel: 'Discard changes', danger: true }))) return;
    setProductId(id);
  };

  if (!product) return null;
  const usedItems = new Set(draft.map((d) => d.itemId));
  const addLine = () => {
    const item = inventory.find((i) => !usedItems.has(i.id)) ?? inventory[0];
    if (!item) return;
    setDraft([...draft, { key: nextKey, itemId: item.id, quantity: '', unit: item.unit }]);
    setNextKey(nextKey + 1);
  };
  const update = (key: number, patch: Partial<DraftLine>) => setDraft(draft.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  return (
    <section aria-labelledby="recipes-title" className="space-y-5">
      <SubHeader id="recipes-title" emoji="🔗" title="Connect Your Products to Inventory" subtitle="Tell the app how much of each inventory item ONE product uses. Products without a recipe are shown as “requirements unknown” – recipes are never guessed." />

      <ul className="flex flex-wrap gap-2" aria-label="Recipe status by product">
        {products.map((p) => {
          const s = STATUS[model.recipes[p.id]?.status ?? 'missing'];
          return (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p.id)} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset transition ${p.id === product.id ? 'ring-sage-600' : 'ring-transparent'} ${s.cls}`} aria-pressed={p.id === product.id}>
                <span aria-hidden="true">{s.icon}</span>
                {p.name.trim() || 'Unnamed product'}
                <span className="sr-only">: {s.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 font-semibold text-sage-900">
            Recipe for
            <select className="select" value={product.id} onChange={(e) => choose(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name.trim() || 'Unnamed product'}</option>)}
            </select>
          </label>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS[model.recipes[product.id]?.status ?? 'missing'].cls}`}>
            {STATUS[model.recipes[product.id]?.status ?? 'missing'].icon} Saved: {STATUS[model.recipes[product.id]?.status ?? 'missing'].label}
          </span>
        </div>

        {inventory.length === 0 ? (
          <Notice tone="warn">Add inventory items first – recipes are built from your inventory list.</Notice>
        ) : draft.length === 0 ? (
          <p className="rounded-2xl bg-cream-50 p-4 text-sage-700">No recipe yet. Add the inventory items one {product.name.trim() || 'product'} uses.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[34rem]">
              <caption className="sr-only">Recipe lines</caption>
              <thead>
                <tr><th scope="col">Inventory item</th><th scope="col">Quantity per product</th><th scope="col">Unit</th><th scope="col"><span className="sr-only">Remove</span></th></tr>
              </thead>
              <tbody>
                {draft.map((d) => {
                  const item = inventory.find((i) => i.id === d.itemId);
                  const dim = item ? UNITS[item.unit].dimension : null;
                  const err = evaluated.errors[String(d.key)];
                  return (
                    <tr key={d.key}>
                      <td>
                        <select className="select" aria-label="Inventory item" value={d.itemId} onChange={(e) => { const it = inventory.find((i) => i.id === e.target.value); update(d.key, { itemId: e.target.value, unit: it ? it.unit : d.unit }); }}>
                          {!item && <option value={d.itemId}>Deleted item</option>}
                          {inventory.map((i) => <option key={i.id} value={i.id}>{i.name.trim() || 'Unnamed item'}</option>)}
                        </select>
                        {err && <p className="mt-1 text-xs font-semibold text-loss-700">⚠ {err}</p>}
                      </td>
                      <td><CellInput id={`recipe-${d.key}-qty`} label={`Quantity of ${item?.name ?? 'item'} per product`} value={d.quantity} invalid={!!err && /quantity|number|decimal|more than 0|negative|enter/i.test(err)} onChange={(v) => update(d.key, { quantity: v })} /></td>
                      <td>
                        <select className="select" aria-label={`Unit for ${item?.name ?? 'item'}`} value={d.unit} onChange={(e) => update(d.key, { unit: e.target.value as UnitId })}>
                          {UNIT_OPTIONS.filter((u) => !dim || UNITS[u.id].dimension === dim || u.id === d.unit).map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                        </select>
                      </td>
                      <td><button type="button" className="btn-small" aria-label={`Remove ${item?.name ?? 'line'} from recipe`} onClick={() => setDraft(draft.filter((x) => x.key !== d.key))}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={addLine} disabled={inventory.length === 0}>+ Add ingredient</button>
          <button type="button" className="btn-primary" disabled={!dirty || evaluated.status === 'invalid'} onClick={() => dispatch({ type: 'save-recipe', productId: product.id, lines: draft.map(({ itemId, quantity, unit }) => ({ itemId, quantity, unit })) })}>
            Save recipe
          </button>
          {dirty && <button type="button" className="btn-secondary" onClick={() => setDraft(saved.map((l, i) => ({ key: i + 1, itemId: l.itemId, quantity: l.quantity, unit: l.unit })))}>Discard changes</button>}
          {dirty && <span className="text-sm font-semibold text-butter-700" role="status">Unsaved changes</span>}
        </div>
        {dirty && evaluated.status === 'invalid' && <p className="text-sm font-semibold text-loss-700">Fix the highlighted lines before saving.</p>}
      </div>

      <ImportWizard kind="recipes" />
    </section>
  );
}
