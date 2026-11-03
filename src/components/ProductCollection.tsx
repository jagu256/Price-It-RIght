import { useMemo, useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { productMetrics, sortProducts, type ProductMetrics, type SortKey } from '../lib/business';
import { formatCAD, formatPercent } from '../lib/format';
import { CellInput, ErrorList, SignedMoney, SubHeader } from './ui';

const SORTS: { key: SortKey | 'none'; label: string }[] = [
  { key: 'none', label: 'Original order' },
  { key: 'revenue', label: 'Highest revenue' },
  { key: 'totalCM', label: 'Highest total contribution margin' },
  { key: 'cmPerUnit', label: 'Highest contribution margin per unit' },
  { key: 'units', label: 'Highest sales volume' },
];

export default function ProductCollection() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const [sort, setSort] = useState<SortKey | 'none'>('none');
  const products = state.business.products;

  const metricsById = useMemo(() => new Map(model.products.map((p) => [p.id, productMetrics(p)])), [model.products]);

  // The order is worked out when the sort changes (or products are added/removed),
  // not on every keystroke – so a row doesn't jump away while you type in it.
  const idsKey = products.map((p) => p.id).join(',');
  const order = useMemo(() => {
    if (sort === 'none') return products.map((p) => p.id);
    const valid = sortProducts([...metricsById.values()], sort).map((m) => m.id);
    const invalid = products.filter((p) => !metricsById.has(p.id)).map((p) => p.id);
    return [...valid, ...invalid];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, idsKey]);
  const visible = order.map((id) => products.find((p) => p.id === id)).filter(Boolean) as typeof products;
  // Newly added products that the sorted snapshot doesn't know about yet go last.
  for (const p of products) if (!order.includes(p.id)) visible.push(p);

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete “${name || 'this product'}”?`,
      message: 'Its recipe will be deleted too. This cannot be undone.',
      confirmLabel: 'Delete product',
      danger: true,
    });
    if (ok) dispatch({ type: 'delete-product', id });
  };

  return (
    <section aria-labelledby="products-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SubHeader id="products-title" emoji="🛒" title="My Product Collection" subtitle="Manage your products and see how each one contributes to your business." />
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="product-sort" className="text-sm font-semibold text-sage-700">Sort by</label>
          <select id="product-sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey | 'none')}>
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="data-table min-w-[64rem]">
          <caption className="sr-only">Products with expected monthly sales and contribution margins</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Price / unit</th>
              <th scope="col">Variable cost / unit</th>
              <th scope="col">Expected sales / month</th>
              <th scope="col" className="text-right">Revenue</th>
              <th scope="col" className="text-right">Total variable costs</th>
              <th scope="col" className="text-right">CM / unit</th>
              <th scope="col" className="text-right">Total CM</th>
              <th scope="col" className="text-right">CM ratio</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <ProductRow
                key={p.id}
                id={p.id}
                metrics={metricsById.get(p.id)}
                onDelete={() => remove(p.id, p.name.trim())}
              />
            ))}
          </tbody>
          {model.summary && (
            <tfoot>
              <tr className="font-bold">
                <th scope="row" colSpan={5} className="px-2 py-3 text-right text-sage-700">Totals (before fixed costs)</th>
                <td className="px-2 py-3 text-right">{formatCAD(model.summary.totalRevenue)}</td>
                <td className="px-2 py-3 text-right">{formatCAD(model.summary.totalVariableCosts)}</td>
                <td />
                <td className="px-2 py-3 text-right"><SignedMoney value={model.summary.totalCM} text={formatCAD(model.summary.totalCM)} /></td>
                <td className="px-2 py-3 text-right">{model.summary.overallCMRatio === null ? 'N/A' : formatPercent(model.summary.overallCMRatio)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
        {products.length === 0 && <p className="p-6 text-center text-sage-700">No products yet. Add your first product to get started.</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="btn-primary" onClick={() => dispatch({ type: 'add-product' })}>
          <span aria-hidden="true">+</span> Add a product
        </button>
        <p className="max-w-xl text-sm text-sage-600">
          Contribution margin is not profit. Fixed costs belong to the whole business and are subtracted once, on the 💰 Profit
          Dashboard – never from each product.
        </p>
      </div>
    </section>
  );
}

function ProductRow({ id, metrics, onDelete }: { id: string; metrics?: ProductMetrics; onDelete: () => void }) {
  const { state, dispatch, model } = useStore();
  const p = state.business.products.find((x) => x.id === id)!;
  const e = model.productErrors[id] ?? {};
  const set = (field: 'name' | 'category' | 'price' | 'variableCost' | 'units') => (value: string) => dispatch({ type: 'update-product', id, field, value });
  const label = p.name.trim() || 'new product';
  const errId = `product-${id}-errors`;
  const itemized = p.costMode === 'itemized';
  const parsed = model.products.find((x) => x.id === id);

  return (
    <>
      <tr>
        <td>
          <CellInput id={`product-${id}-name`} label={`Product name (${label})`} value={p.name} onChange={set('name')} invalid={!!e.name} inputMode="text" width="w-40" describedBy={errId} />
        </td>
        <td>
          <CellInput id={`product-${id}-category`} label={`Category for ${label}`} value={p.category} onChange={set('category')} inputMode="text" width="w-28" placeholder="Optional" />
        </td>
        <td>
          <CellInput id={`product-${id}-price`} label={`Selling price per unit for ${label}`} value={p.price} onChange={set('price')} invalid={!!e.price} prefix="$" width="w-24" describedBy={errId} />
        </td>
        <td>
          {itemized ? (
            <div className="w-28">
              <p className={`text-sm font-bold ${e.variableCost ? 'text-loss-700' : 'text-sage-900'}`}>{parsed ? formatCAD(parsed.variableCost) : '—'}</p>
              <a href="#inventory" className="text-[11px] font-bold uppercase tracking-wider text-butter-700 underline underline-offset-2">Itemized cost</a>
            </div>
          ) : (
            <CellInput id={`product-${id}-variableCost`} label={`Variable cost per unit for ${label}`} value={p.variableCost} onChange={set('variableCost')} invalid={!!e.variableCost} prefix="$" width="w-24" describedBy={errId} />
          )}
        </td>
        <td>
          <CellInput id={`product-${id}-units`} label={`Expected monthly sales for ${label}`} value={p.units} onChange={set('units')} invalid={!!e.units} inputMode="numeric" width="w-24" describedBy={errId} />
        </td>
        <td className="text-right">{metrics ? formatCAD(metrics.revenue) : '—'}</td>
        <td className="text-right">{metrics ? formatCAD(metrics.totalVariableCosts) : '—'}</td>
        <td className="text-right">{metrics ? <SignedMoney value={metrics.cmPerUnit} text={formatCAD(metrics.cmPerUnit)} /> : '—'}</td>
        <td className="text-right font-semibold">{metrics ? <SignedMoney value={metrics.totalCM} text={formatCAD(metrics.totalCM)} /> : '—'}</td>
        <td className="text-right">{metrics ? (metrics.cmRatio === null ? 'N/A' : formatPercent(metrics.cmRatio)) : '—'}</td>
        <td>
          <div className="flex justify-end gap-1">
            <button type="button" className="btn-small" onClick={() => dispatch({ type: 'duplicate-product', id })} aria-label={`Duplicate ${label}`} title="Duplicate">
              ⧉<span className="sr-only">Duplicate</span>
            </button>
            <button type="button" className="btn-small hover:!border-loss-600 hover:!text-loss-700" onClick={onDelete} aria-label={`Delete ${label}`} title="Delete">
              ✕<span className="sr-only">Delete</span>
            </button>
          </div>
        </td>
      </tr>
      {Object.keys(e).length > 0 && (
        <tr>
          <td colSpan={11} className="!border-t-0 !pt-0">
            <ErrorList id={errId} messages={Object.values(e)} />
          </td>
        </tr>
      )}
    </>
  );
}
