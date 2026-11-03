import { Fragment } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { UNIT_OPTIONS, formatQuantity, type UnitId } from '../lib/inventory';
import { checkPlan } from '../lib/planning';
import InfoTip from './InfoTip';
import { CellInput, ErrorList, Notice, StatusPill } from './ui';

export default function InventoryTable() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const records = state.business.inventory;
  const stockOk = Object.keys(model.stockErrors).length === 0;
  const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
  const check = stockOk ? checkPlan(demand, model.products, model.recipes, model.stock) : null;
  const reqById = new Map(check?.items.map((i) => [i.itemId, i]));

  const remove = async (id: string, name: string) => {
    const used = Object.entries(state.business.recipes).filter(([, lines]) => lines.some((l) => l.itemId === id)).map(([pid]) => state.business.products.find((p) => p.id === pid)?.name).filter(Boolean);
    const ok = await confirm({
      title: `Delete “${name || 'this item'}”?`,
      message: used.length ? `It is used in the recipes for ${used.join(', ')}. Those recipe lines will be flagged so you can fix them.` : 'This cannot be undone.',
      confirmLabel: 'Delete item',
      danger: true,
    });
    if (ok) dispatch({ type: 'delete-stock', id });
  };

  const clearAll = async () => {
    const ok = await confirm({
      title: 'Clear all inventory?',
      message: `All ${records.length} inventory items will be removed. Recipes stay, but lines using these items will be flagged.`,
      confirmLabel: 'Clear inventory',
      danger: true,
    });
    if (ok) dispatch({ type: 'clear-stock' });
  };

  return (
    <div className="space-y-3">
      <div className="card overflow-x-auto p-2 sm:p-4">
        <table className="data-table min-w-[52rem]">
          <caption className="sr-only">Inventory items</caption>
          <thead>
            <tr>
              <th scope="col">Item name</th>
              <th scope="col">Available quantity</th>
              <th scope="col">Unit</th>
              <th scope="col">
                <span className="inline-flex items-center gap-1">
                  Cost per unit
                  <InfoTip label="Cost per unit">Purchase cost for ONE unit in the Unit column (e.g. per g). Leave blank if unknown – it is never assumed to be $0.</InfoTip>
                </span>
              </th>
              <th scope="col">Needed for expected sales</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const e = model.stockErrors[r.id] ?? {};
              const req = reqById.get(r.id);
              const label = r.name.trim() || 'new item';
              return (
                <Fragment key={r.id}>
                  <tr>
                    <td><CellInput id={`stock-${r.id}-name`} label={`Item name (${label})`} inputMode="text" width="w-44" value={r.name} invalid={!!e.name} onChange={(v) => dispatch({ type: 'update-stock', id: r.id, field: 'name', value: v })} /></td>
                    <td><CellInput id={`stock-${r.id}-quantity`} label={`Available quantity of ${label}`} width="w-28" value={r.quantity} invalid={!!e.quantity} onChange={(v) => dispatch({ type: 'update-stock', id: r.id, field: 'quantity', value: v })} /></td>
                    <td>
                      <select className="select" aria-label={`Unit for ${label}`} value={r.unit} onChange={(ev) => dispatch({ type: 'change-stock-unit', id: r.id, unit: ev.target.value as UnitId })}>
                        {UNIT_OPTIONS.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                      </select>
                    </td>
                    <td><CellInput id={`stock-${r.id}-cost`} label={`Cost per ${r.unit} for ${label}`} prefix="$" width="w-28" placeholder="unknown" value={r.cost} invalid={!!e.cost} onChange={(v) => dispatch({ type: 'update-stock', id: r.id, field: 'cost', value: v })} /></td>
                    <td className="whitespace-nowrap">{req ? (req.requiredBase ? formatQuantity(req.requiredBase, req.dimension, 'short') : '—') : '—'}</td>
                    <td>{req ? <StatusPill status={req.status} /> : '—'}</td>
                    <td>
                      <button type="button" className="btn-small hover:!border-loss-600 hover:!text-loss-700" aria-label={`Delete ${label}`} onClick={() => remove(r.id, r.name.trim())}>✕</button>
                    </td>
                  </tr>
                  {Object.keys(e).length > 0 && (
                    <tr><td colSpan={7} className="!border-t-0 !pt-0"><ErrorList messages={Object.values(e)} /></td></tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {records.length === 0 && <p className="p-6 text-center text-sage-700">No inventory yet. Upload a spreadsheet above or add items by hand.</p>}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => dispatch({ type: 'add-stock' })}><span aria-hidden="true">+</span> Add inventory item</button>
        {records.length > 0 && <button type="button" className="btn-secondary" onClick={clearAll}>Clear inventory</button>}
      </div>
      <p className="text-xs text-sage-600">
        Switching between g ↔ kg or mL ↔ L converts the quantity and cost automatically. Switching to an incompatible unit (e.g. g → pieces) does not convert anything – check the numbers yourself.
        Status compares available stock with what your expected sales need: 🟡 low stock = the plan uses 80 % or more; 🔴 shortage = more than you have.
      </p>
      {!stockOk && <Notice tone="error">Fix the highlighted inventory records to see stock statuses and production estimates.</Notice>}
    </div>
  );
}
