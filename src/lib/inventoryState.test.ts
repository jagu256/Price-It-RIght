import { describe, expect, it } from 'vitest';
import { initialInventory, inventoryReducer } from './inventoryState';

describe('inventory state', () => {
  it('starts with the selected business’s sample inventory', () => {
    const s = initialInventory('coffee');
    expect(s.items.map((i) => i.name)).toEqual(['Coffee beans', 'Milk', 'Coffee cups']);
  });

  it('adds, edits and removes items', () => {
    let s = initialInventory('coffee');
    s = inventoryReducer(s, { type: 'add' });
    expect(s.items).toHaveLength(4);
    const id = s.items[3].id;
    expect(s.items.map((i) => i.id)).toEqual([...new Set(s.items.map((i) => i.id))]); // unique ids
    s = inventoryReducer(s, { type: 'update', id, field: 'name', value: 'Lids' });
    expect(s.items[3].name).toBe('Lids');
    expect(s.touched[id].name).toBe(true);
    s = inventoryReducer(s, { type: 'remove', id });
    expect(s.items).toHaveLength(3);
  });

  it('Reset Inventory restores the sample items after edits', () => {
    let s = initialInventory('bakery');
    s = inventoryReducer(s, { type: 'update', id: s.items[0].id, field: 'available', value: 'oops' });
    s = inventoryReducer(s, { type: 'clear' });
    expect(s.items).toHaveLength(0);
    s = inventoryReducer(s, { type: 'reset' });
    expect(s.items.map((i) => i.name)).toEqual(['Flour', 'Butter', 'Pastry boxes']);
    expect(s.items[0].available).toBe('25');
    expect(s.touched).toEqual({});
  });
});
