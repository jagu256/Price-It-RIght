/**
 * The shape of the business data the user edits. Numbers are kept exactly as
 * typed (strings) so invalid entries can be shown back with a message instead
 * of being silently changed. `model.ts` turns this into validated numbers.
 */
import type { BusinessId } from './businesses';
import type { UnitId } from './inventory';

export type CostMode = 'manual' | 'itemized';

export interface OtherCosts {
  labour: string;
  packaging: string;
  paymentFees: string;
  other: string;
}

export interface ProductInput {
  /** Unique internal identifier – never shown, never reused. */
  id: string;
  name: string;
  category: string;
  price: string;
  /** Total variable cost per unit, used when costMode is 'manual'. */
  variableCost: string;
  units: string;
  /** 'manual' = one total figure; 'itemized' = recipe materials + other variable costs. */
  costMode: CostMode;
  otherCosts: OtherCosts;
}

export interface InventoryRecord {
  id: string;
  name: string;
  quantity: string;
  unit: UnitId;
  /** Purchase cost per one `unit` (e.g. per g). Blank = unknown, never treated as $0. */
  cost: string;
}

export interface RecipeLineInput {
  id: string;
  itemId: string;
  quantity: string;
  unit: UnitId;
}

export interface BusinessData {
  type: BusinessId;
  name: string;
  isDemo: boolean;
  fixedCosts: string;
  products: ProductInput[];
  inventory: InventoryRecord[];
  /** productId → recipe lines. A product with no entry has unknown inventory requirements. */
  recipes: Record<string, RecipeLineInput[]>;
}

export const EMPTY_OTHER_COSTS: OtherCosts = { labour: '', packaging: '', paymentFees: '', other: '' };
