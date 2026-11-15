/**
 * ✅ Setup checklist: what is filled in so far, worked out from the same
 * validated model the rest of the app uses (nothing is guessed).
 */
import type { SectionId } from '../app/routes';
import { tx } from '../i18n/i18n';
import type { BusinessModel } from './model';

export interface ChecklistItem {
  id: 'name' | 'fixed' | 'products' | 'inventory' | 'recipes';
  done: boolean;
  /** Inventory and recipes are only needed for the inventory and production features. */
  optional: boolean;
  label: string;
  hint: string;
  section: SectionId;
}

export function setupChecklist(model: BusinessModel): { items: ChecklistItem[]; done: number; total: number; essentialsDone: boolean } {
  const d = model.data;
  const products = d.products.length > 0 && Object.keys(model.productErrors).length === 0;
  const inventory = d.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const recipes = d.products.length > 0 && d.products.every((p) => model.recipes[p.id]?.status === 'complete');
  const items: ChecklistItem[] = [
    { id: 'name', done: d.name.trim() !== '', optional: false, label: tx('Name your business'), hint: tx('Type a name in My Business.'), section: 'my-business' },
    { id: 'fixed', done: !model.fixedError, optional: false, label: tx('Enter monthly fixed costs'), hint: tx('Rent, insurance, software – entered once for the whole business.'), section: 'my-business' },
    { id: 'products', done: products, optional: false, label: tx('Add your products with valid numbers'), hint: tx('Price, variable cost and expected monthly sales for each product.'), section: 'my-business' },
    { id: 'inventory', done: inventory, optional: true, label: tx('Add your inventory'), hint: tx('Upload a spreadsheet or type items in (needed for stock checks).'), section: 'inventory' },
    { id: 'recipes', done: recipes, optional: true, label: tx('Give every product a recipe'), hint: tx('Tell the app how much of each item one product uses (needed for production planning).'), section: 'inventory' },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, essentialsDone: items.filter((i) => !i.optional).every((i) => i.done) };
}
