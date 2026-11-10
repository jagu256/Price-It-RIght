/**
 * Business categories and their starting values.
 * IMPORTANT: these are fictional examples for learning – NOT industry benchmarks.
 */
import { tx } from '../i18n/i18n';
import type { PricingInputs } from './accounting';

export type BusinessId = 'coffee' | 'bakery' | 'nails' | 'clothing' | 'custom';

export interface BusinessPreset {
  id: BusinessId;
  label: string;
  emoji: string;
  blurb: string;
  /** What one "unit" means for this business, used in helper text. */
  unitExample: string;
  defaults: PricingInputs;
}

export const BUSINESSES: BusinessPreset[] = [
  {
    id: 'coffee',
    label: tx('Coffee Shop'),
    emoji: '☕',
    blurb: tx('Lattes, drip coffee & cold brew'),
    unitExample: tx('cups of coffee'),
    defaults: { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 },
  },
  {
    id: 'bakery',
    label: tx('Bakery'),
    emoji: '🧁',
    blurb: tx('Cupcakes, loaves & cookies'),
    unitExample: tx('baked goods'),
    defaults: { sellingPrice: 5, variableCost: 2, fixedCosts: 1000, units: 500 },
  },
  {
    id: 'nails',
    label: tx('Nail Salon'),
    emoji: '💅',
    blurb: tx('Manicures, pedicures & gel sets'),
    unitExample: tx('appointments'),
    defaults: { sellingPrice: 45, variableCost: 12, fixedCosts: 2500, units: 150 },
  },
  {
    id: 'clothing',
    label: tx('Clothing Store'),
    emoji: '👕',
    blurb: tx('Tees, hoodies & accessories'),
    unitExample: tx('items of clothing'),
    defaults: { sellingPrice: 40, variableCost: 18, fixedCosts: 1800, units: 120 },
  },
  {
    id: 'custom',
    label: tx('Custom Business'),
    emoji: '✨',
    blurb: tx('Your own idea – start from a template'),
    unitExample: tx('products or services'),
    defaults: { sellingPrice: 20, variableCost: 8, fixedCosts: 500, units: 100 },
  },
];

export function getBusiness(id: BusinessId): BusinessPreset {
  const found = BUSINESSES.find((b) => b.id === id);
  if (!found) throw new Error(`Unknown business: ${id}`);
  return found;
}
