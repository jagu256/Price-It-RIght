import { describe, expect, it } from 'vitest';
import { initialAppState, reducer, type Action, type AppState } from './store';

const run = (s: AppState, ...actions: Action[]) => actions.reduce(reducer, s);

describe('undo after big changes', () => {
  const start = initialAppState('demo');
  const muffin = start.business.products.find((p) => p.name === 'Muffin')!;

  it('deleting a product can be undone, bringing back exactly the same business', () => {
    const deleted = run(start, { type: 'delete-product', id: muffin.id });
    expect(deleted.business.products.some((p) => p.id === muffin.id)).toBe(false);
    expect(deleted.undo).toMatchObject({ message: 'Deleted the product “{name}”.', vars: { name: 'Muffin' } });
    const back = run(deleted, { type: 'undo' });
    expect(back.business).toEqual(start.business);
    expect(back.baseline).toBe(start.baseline);
    expect(back.undo).toBeUndefined();
  });

  it('applying the What-If plan, deleting or clearing stock, and loading another business can all be undone', () => {
    const coffee = start.business.products.find((p) => p.name === 'Coffee')!;
    const applied = run(start, { type: 'scenario-apply', resolved: { products: { [coffee.id]: { price: '7' } } } });
    expect(applied.business.products.find((p) => p.id === coffee.id)!.price).toBe('7');
    expect(run(applied, { type: 'undo' }).business).toEqual(start.business);

    const item = start.business.inventory[0];
    expect(run(start, { type: 'delete-stock', id: item.id }, { type: 'undo' }).business).toEqual(start.business);
    expect(run(start, { type: 'clear-stock' }, { type: 'undo' }).business).toEqual(start.business);

    const other = run(start, { type: 'load-sample', business: 'bakery' });
    expect(other.business.type).toBe('bakery');
    const back = run(other, { type: 'undo' });
    expect(back.business).toEqual(start.business);
    expect(back.baseline).toBe(start.baseline); // "unsaved work" detection is restored too
  });

  it('any other change to the business clears the undo, so a later edit is never thrown away', () => {
    const deleted = run(start, { type: 'delete-product', id: muffin.id });
    const edited = run(deleted, { type: 'set-fixed-costs', value: '2000' });
    expect(edited.undo).toBeUndefined();
    expect(run(edited, { type: 'undo' })).toBe(edited); // nothing to undo → unchanged
  });

  it('experiments (What-If, planner) don’t clear it, and dismissing it removes it', () => {
    const deleted = run(start, { type: 'delete-product', id: muffin.id });
    const tried = run(deleted, { type: 'scenario-set', productId: null, field: 'fixedCosts', value: '1000' });
    expect(tried.undo).toBeDefined();
    expect(run(tried, { type: 'undo-dismiss' }).undo).toBeUndefined();
  });

  it('small edits are not undo points (only big changes are)', () => {
    expect(run(start, { type: 'set-business-name', value: 'X' }).undo).toBeUndefined();
    expect(run(start, { type: 'add-product' }).undo).toBeUndefined();
  });

  it('each new undo point gets a new id (so the message restarts its timer)', () => {
    const a = run(start, { type: 'delete-product', id: muffin.id });
    const b = run(a, { type: 'clear-stock' });
    expect(b.undo!.id).not.toBe(a.undo!.id);
    expect(run(b, { type: 'undo' }).business).toEqual(a.business); // one step back
  });
});
