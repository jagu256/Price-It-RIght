import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { formatQuantity, joinNames } from '../lib/inventory';
import { checkPlan, singleProductCapacity } from '../lib/planning';
import { Notice, StatusPill, SubHeader } from './ui';

/** 📦 How Much Can You Produce? (replaces the earlier single-product Inventory & Sales Estimator) */
export default function ProductionCapacity() {
  const { model } = useStore();
  const [productId, setProductId] = useState('');
  const stockOk = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const withRecipe = model.products.filter((p) => model.recipes[p.id]?.status === 'complete');
  const product = withRecipe.find((p) => p.id === productId) ?? withRecipe[0];

  if (!stockOk || model.products.length === 0) {
    return (
      <section aria-labelledby="capacity-title" className="space-y-3">
        <SubHeader id="capacity-title" emoji="📦" title="How Much Can You Produce?" />
        <Notice tone="warn">Add valid inventory and products to estimate production capacity.</Notice>
      </section>
    );
  }

  const cap = product ? singleProductCapacity(model.recipes[product.id], model.stock) : null;
  const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
  const check = checkPlan(demand, model.products, model.recipes, model.stock);
  const short = check.items.filter((i) => i.shortageBase > 0);

  return (
    <section aria-labelledby="capacity-title" className="space-y-5">
      <SubHeader id="capacity-title" emoji="📦" title="How Much Can You Produce?" subtitle="Estimate production capacity from your current inventory." />

      <div className="card space-y-4 p-5 sm:p-6">
        <h4 className="text-lg font-bold text-sage-900">One product on its own</h4>
        {withRecipe.length === 0 ? (
          <p className="text-sage-700">No product has a complete recipe yet.</p>
        ) : (
          <>
            <label className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              Product
              <select className="select" value={product!.id} onChange={(e) => setProductId(e.target.value)}>
                {withRecipe.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            {cap && (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table min-w-[30rem]">
                    <caption className="sr-only">Maximum units by inventory item</caption>
                    <thead><tr><th scope="col">Inventory</th><th scope="col" className="text-right">Available</th><th scope="col" className="text-right">Required per {product!.name}</th><th scope="col" className="text-right">Maximum {product!.name}s</th></tr></thead>
                    <tbody>
                      {cap.items.map((i) => (
                        <tr key={i.id} className={i.isLimiting ? 'bg-butter-100/70 font-bold' : ''}>
                          <th scope="row" className="font-semibold">{i.name}{i.isLimiting && <span className="ml-2 rounded-full bg-butter-300 px-2 py-0.5 text-[10px] uppercase tracking-wider text-butter-700">Limiting</span>}</th>
                          <td className="text-right">{formatQuantity(i.availableBase, i.dimension, 'short')}</td>
                          <td className="text-right">{formatQuantity(i.requiredBase, i.dimension, 'short')}</td>
                          <td className="text-right">{i.maxProducts.toLocaleString('en-CA')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="rounded-2xl bg-sage-700 px-4 py-3 font-semibold text-cream-50" aria-live="polite">
                  Maximum production: {cap.maxProduction.toLocaleString('en-CA')} {product!.name}{cap.maxProduction === 1 ? '' : 's'} · Limiting inventory: {joinNames(cap.limiting.map((l) => l.name))}
                  <span className="block text-sm font-normal opacity-90">Each item is divided and rounded DOWN to whole units; the lowest result wins. This assumes {product!.name} gets all of the inventory.</span>
                </p>
              </>
            )}
          </>
        )}
      </div>

      <div className="card space-y-4 p-5 sm:p-6">
        <h4 className="text-lg font-bold text-sage-900">All products together (shared inventory)</h4>
        <p className="text-sm text-sage-700">
          Products that share an ingredient compete for it, so capacities are never added together. This checks the combined needs of
          your expected sales: required = Σ (planned units × quantity per product).
        </p>
        {check.feasibility === 'infeasible' && <Notice tone="error" title="This plan is not feasible">Your current inventory can’t cover expected sales. Planned sales above what stock allows can’t be treated as achievable – see the 🏆 Production Planner for options.</Notice>}
        {check.feasibility === 'feasible' && <Notice tone="success">Your inventory covers expected sales for every product.</Notice>}
        {check.unknownProducts.length > 0 && <Notice tone="warn">Not checked – no recipe: {check.unknownProducts.join(', ')}.</Notice>}
        <div className="overflow-x-auto">
          <table className="data-table min-w-[40rem]">
            <caption className="sr-only">Inventory needed for expected sales</caption>
            <thead><tr><th scope="col">Item</th><th scope="col" className="text-right">Available</th><th scope="col" className="text-right">Required</th><th scope="col" className="text-right">Remaining</th><th scope="col" className="text-right">Shortage</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {check.items.map((i) => (
                <tr key={i.itemId}>
                  <th scope="row" className="font-semibold">{i.name}<span className="block text-xs font-normal text-sage-600">{i.usedBy.join(', ') || 'Not in any recipe'}</span></th>
                  <td className="text-right">{formatQuantity(i.availableBase, i.dimension, 'short')}</td>
                  <td className="text-right">{formatQuantity(i.requiredBase, i.dimension, 'short')}</td>
                  <td className={`text-right ${i.remainingBase < 0 ? 'text-loss-700' : ''}`}>{i.remainingBase < 0 ? `−${formatQuantity(-i.remainingBase, i.dimension, 'short')}` : formatQuantity(i.remainingBase, i.dimension, 'short')}</td>
                  <td className={`text-right font-bold ${i.shortageBase > 0 ? 'text-loss-700' : 'text-sage-600'}`}>{i.shortageBase > 0 ? formatQuantity(i.shortageBase, i.dimension, 'short') : 'None'}</td>
                  <td><StatusPill status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {short.length > 0 && (
          <ul className="space-y-1 text-sm text-sage-800">
            {short.map((i) => (
              <li key={i.itemId}>🔴 To meet expected sales, an additional <strong>{formatQuantity(i.shortageBase, i.dimension)}</strong> of {i.name} would be required.</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
