/**
 * Business categories and their starting values.
 * IMPORTANT: these are fictional examples for learning – NOT industry benchmarks.
 */
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
    label: 'Coffee Shop',
    emoji: '☕',
    blurb: 'Lattes, drip coffee & cold brew',
    unitExample: 'cups of coffee',
    defaults: { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 },
  },
  {
    id: 'bakery',
    label: 'Bakery',
    emoji: '🧁',
    blurb: 'Cupcakes, loaves & cookies',
    unitExample: 'baked goods',
    defaults: { sellingPrice: 5, variableCost: 2, fixedCosts: 1000, units: 500 },
  },
  {
    id: 'nails',
    label: 'Nail Salon',
    emoji: '💅',
    blurb: 'Manicures, pedicures & gel sets',
    unitExample: 'appointments',
    defaults: { sellingPrice: 45, variableCost: 12, fixedCosts: 2500, units: 150 },
  },
  {
    id: 'clothing',
    label: 'Clothing Store',
    emoji: '👕',
    blurb: 'Tees, hoodies & accessories',
    unitExample: 'items of clothing',
    defaults: { sellingPrice: 40, variableCost: 18, fixedCosts: 1800, units: 120 },
  },
  {
    id: 'custom',
    label: 'Custom Business',
    emoji: '✨',
    blurb: 'Your own idea – start from a template',
    unitExample: 'products or services',
    defaults: { sellingPrice: 20, variableCost: 8, fixedCosts: 500, units: 100 },
  },
];

export function getBusiness(id: BusinessId): BusinessPreset {
  const found = BUSINESSES.find((b) => b.id === id);
  if (!found) throw new Error(`Unknown business: ${id}`);
  return found;
}
