/**
 * State for the Inventory & Sales Estimator: the list of inventory rows,
 * which fields the user has interacted with, and add / edit / remove / reset.
 */
import type { BusinessId } from './businesses';
import { SAMPLE_INVENTORY, type InventoryItemInput } from './inventory';

export type ItemField = 'name' | 'available' | 'availableUnit' | 'required' | 'requiredUnit';

export interface InventoryState {
  businessId: BusinessId;
  items: InventoryItemInput[];
  /** Fields the user has typed in or left. Errors only show for these. */
  touched: Record<string, Partial<Record<ItemField, boolean>>>;
  nextId: number;
}

export type InventoryAction =
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'update'; id: string; field: ItemField; value: string }
  | { type: 'touch'; id: string; field: ItemField }
  | { type: 'touch-all' }
  | { type: 'reset' }
  | { type: 'clear' };

export function initialInventory(businessId: BusinessId): InventoryState {
  const items = SAMPLE_INVENTORY[businessId].map((item, i) => ({ ...item, id: `item-${i + 1}` }));
  return { businessId, items, touched: {}, nextId: items.length + 1 };
}

export function inventoryReducer(state: InventoryState, action: InventoryAction): InventoryState {
  switch (action.type) {
    case 'add': {
      const id = `item-${state.nextId}`;
      const blank: InventoryItemInput = {
        id,
        name: '',
        available: '',
        availableUnit: 'pcs',
        required: '',
        requiredUnit: 'pcs',
      };
      return { ...state, items: [...state.items, blank], nextId: state.nextId + 1 };
    }
    case 'remove': {
      const touched = { ...state.touched };
      delete touched[action.id];
      return { ...state, items: state.items.filter((i) => i.id !== action.id), touched };
    }
    case 'update':
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.id ? { ...i, [action.field]: action.value } : i)),
        touched: { ...state.touched, [action.id]: { ...state.touched[action.id], [action.field]: true } },
      };
    case 'touch':
      return {
        ...state,
        touched: { ...state.touched, [action.id]: { ...state.touched[action.id], [action.field]: true } },
      };
    case 'touch-all': {
      const all: Partial<Record<ItemField, boolean>> = {
        name: true,
        available: true,
        availableUnit: true,
        required: true,
        requiredUnit: true,
      };
      return { ...state, touched: Object.fromEntries(state.items.map((i) => [i.id, { ...all }])) };
    }
    case 'reset':
      // Restores the selected business's fictional example inventory.
      return initialInventory(state.businessId);
    case 'clear':
      return { ...state, items: [], touched: {} };
    default:
      return state;
  }
}
