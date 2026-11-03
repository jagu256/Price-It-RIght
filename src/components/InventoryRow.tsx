import type { Dispatch } from 'react';
import { UNIT_OPTIONS, countNoun, type InventoryItemInput, type ItemCapacity, type ItemErrors, type ProductNoun } from '../lib/inventory';
import type { InventoryAction, ItemField } from '../lib/inventoryState';
import InfoTip from './InfoTip';

export const COLUMN_TIPS = {
  name: 'What the item is, such as coffee beans, milk or cups.',
  available: 'How much of this item you have on hand right now. You can use a different unit from the next column if they measure the same thing (e.g. kg and g).',
  required: 'How much of this item goes into one finished product or service.',
  capacity: 'Available quantity ÷ quantity per product, rounded down to whole products.',
};

interface Props {
  index: number;
  item: InventoryItemInput;
  errors: ItemErrors;
  touched: Partial<Record<ItemField, boolean>>;
  capacity?: ItemCapacity;
  noun: ProductNoun;
  dispatch: Dispatch<InventoryAction>;
}

const inputBase =
  'w-full min-w-0 rounded-xl border-2 bg-white px-3 py-2.5 font-semibold tabular-nums text-ink outline-none transition focus:ring-2 focus:ring-offset-1';
const ok = 'border-sage-200 focus:border-sage-500 focus:ring-sage-400/40';
const bad = 'border-loss-600 focus:ring-loss-600/40';
const selectCls =
  'shrink-0 rounded-xl border-2 border-sage-200 bg-cream-50 px-2 py-2.5 text-sm font-semibold text-sage-800 outline-none focus:border-sage-500 focus:ring-2 focus:ring-sage-400/40';

export default function InventoryRow({ index, item, errors, touched, capacity, noun, dispatch }: Props) {
  const p = `inv-${item.id}`;
  const displayName = item.name.trim() || `item ${index + 1}`;
  const show = (field: ItemField, key: keyof ItemErrors) => (touched[field] ? errors[key] : undefined);

  const nameErr = show('name', 'name');
  const availErr = show('available', 'available');
  const reqErr = show('required', 'required');
  const unitErr = touched.availableUnit || touched.requiredUnit || touched.available || touched.required ? errors.unit : undefined;
  const messages = [nameErr, availErr, reqErr, unitErr].filter(Boolean) as string[];

  const update = (field: ItemField) => (value: string) => dispatch({ type: 'update', id: item.id, field, value });
  const touch = (field: ItemField) => () => dispatch({ type: 'touch', id: item.id, field });

  return (
    <li
      className={`rounded-2xl border p-4 transition md:rounded-none md:border-0 md:border-t md:border-sage-100 md:px-0 md:py-3 ${
        capacity?.isLimiting ? 'border-butter-300 bg-butter-100/60 md:bg-transparent' : 'border-sage-100 bg-white md:bg-transparent'
      }`}
    >
      <div className="grid gap-3 md:grid-cols-[1.25fr_1.15fr_1.15fr_0.9fr_auto] md:items-start md:gap-4">
        {/* Item name */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 md:mb-0">
            <label htmlFor={`${p}-name`} className="text-sm font-semibold text-sage-900 md:sr-only">Item name</label>
            <span className="md:hidden"><InfoTip label="Item name">{COLUMN_TIPS.name}</InfoTip></span>
          </div>
          <input
            id={`${p}-name`}
            type="text"
            maxLength={40}
            placeholder="e.g. Milk"
            value={item.name}
            onChange={(e) => update('name')(e.target.value)}
            onBlur={touch('name')}
            aria-invalid={nameErr ? true : undefined}
            className={`${inputBase} ${nameErr ? bad : ok}`}
          />
        </div>

        {/* Available quantity + unit */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 md:mb-0">
            <label htmlFor={`${p}-available`} className="text-sm font-semibold text-sage-900 md:sr-only">Quantity available</label>
            <span className="md:hidden"><InfoTip label="Quantity available">{COLUMN_TIPS.available}</InfoTip></span>
          </div>
          <div className="flex gap-2">
            <input
              id={`${p}-available`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={item.available}
              onChange={(e) => update('available')(e.target.value)}
              onBlur={touch('available')}
              aria-invalid={availErr ? true : undefined}
              className={`${inputBase} ${availErr ? bad : ok}`}
            />
            <label htmlFor={`${p}-availableUnit`} className="sr-only">Unit for quantity available</label>
            <select
              id={`${p}-availableUnit`}
              value={item.availableUnit}
              onChange={(e) => update('availableUnit')(e.target.value)}
              className={`${selectCls} ${unitErr ? '!border-loss-600' : ''}`}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.id} value={u.id}>{u.id === 'pcs' ? 'pcs' : u.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Required per product + unit */}
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-1.5 md:mb-0">
            <label htmlFor={`${p}-required`} className="text-sm font-semibold text-sage-900 md:sr-only">Quantity per {noun.one}</label>
            <span className="md:hidden"><InfoTip label={`Quantity per ${noun.one}`}>{COLUMN_TIPS.required}</InfoTip></span>
          </div>
          <div className="flex gap-2">
            <input
              id={`${p}-required`}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={item.required}
              onChange={(e) => update('required')(e.target.value)}
              onBlur={touch('required')}
              aria-invalid={reqErr ? true : undefined}
              className={`${inputBase} ${reqErr ? bad : ok}`}
            />
            <label htmlFor={`${p}-requiredUnit`} className="sr-only">Unit for quantity per {noun.one}</label>
            <select
              id={`${p}-requiredUnit`}
              value={item.requiredUnit}
              onChange={(e) => update('requiredUnit')(e.target.value)}
              className={`${selectCls} ${unitErr ? '!border-loss-600' : ''}`}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.id} value={u.id}>{u.id === 'pcs' ? 'pcs' : u.id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Capacity from this item */}
        <div className="flex min-h-[2.75rem] flex-wrap items-center gap-2 text-sm md:pt-0.5" aria-live="polite">
          {capacity ? (
            <>
              <span className="font-display text-lg font-bold tabular-nums text-sage-900">
                {countNoun(capacity.maxProducts, noun)}
              </span>
              {capacity.isLimiting && (
                <span className="rounded-full bg-butter-300 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-butter-700">
                  Limiting
                </span>
              )}
            </>
          ) : (
            <span className="text-sage-500">—</span>
          )}
        </div>

        <div className="flex justify-end md:pt-1.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'remove', id: item.id })}
            aria-label={`Remove ${displayName}`}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-sage-600 transition hover:bg-loss-50 hover:text-loss-700"
          >
            <span aria-hidden="true">✕</span>
            <span className="md:sr-only">Remove</span>
          </button>
        </div>
      </div>

      {messages.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm font-semibold text-loss-700" aria-live="polite">
          {messages.map((m) => (
            <li key={m} className="flex items-start gap-1.5">
              <span aria-hidden="true">⚠</span>
              {m}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
