/**
 * Fictional sample businesses. Every number here is invented for learning –
 * these are NOT industry benchmarks or market averages.
 */
import { t, tx } from '../i18n/i18n';
import type { BusinessId } from './businesses';
import type { UnitId } from './inventory';
import { EMPTY_OTHER_COSTS, type BusinessData, type ProductInput } from './types';

type P = [name: string, category: string, price: string, variableCost: string, units: string];
type I = [name: string, quantity: string, unit: UnitId, cost: string];
type R = Record<string, [item: string, quantity: string, unit: UnitId][]>;

interface Sample {
  name: string;
  fixedCosts: string;
  products: P[];
  inventory: I[];
  recipes: R;
}

const SAMPLES: Record<BusinessId | 'demo', Sample> = {
  coffee: {
    name: 'My Coffee Shop',
    fixedCosts: '1500',
    products: [
      ['Coffee', 'Drinks', '6', '2', '300'],
      ['Latte', 'Drinks', '8', '3', '200'],
      ['Muffin', 'Bakery', '4', '1.50', '150'],
      ['Sandwich', 'Food', '9', '4', '100'],
    ],
    inventory: [
      ['Coffee beans', '8000', 'g', '0.03'],
      ['Milk', '100000', 'mL', '0.002'],
      ['Coffee cups', '600', 'pcs', '0.15'],
      ['Flour', '20000', 'g', '0.004'],
      ['Sugar', '5000', 'g', '0.003'],
    ],
    recipes: {
      Coffee: [['Coffee beans', '20', 'g'], ['Milk', '200', 'mL'], ['Coffee cups', '1', 'pcs']],
      Latte: [['Coffee beans', '20', 'g'], ['Milk', '300', 'mL'], ['Coffee cups', '1', 'pcs']],
      Muffin: [['Flour', '100', 'g'], ['Sugar', '30', 'g']],
      // Sandwich deliberately has no recipe: its inventory needs are "unknown".
    },
  },
  bakery: {
    name: 'My Bakery',
    fixedCosts: '2200',
    products: [
      ['Sourdough loaf', 'Bread', '9', '3', '120'],
      ['Croissant', 'Pastry', '4.50', '1.60', '200'],
      ['Cupcake', 'Sweets', '3.50', '1.20', '250'],
      ['Cookie box', 'Sweets', '12', '4.50', '60'],
    ],
    inventory: [
      ['Flour', '50', 'kg', '1.80'],
      ['Butter', '10', 'kg', '9'],
      ['Sugar', '10', 'kg', '2.50'],
      ['Eggs', '300', 'pcs', '0.35'],
      ['Gift boxes', '100', 'pcs', '0.60'],
    ],
    recipes: {
      'Sourdough loaf': [['Flour', '500', 'g']],
      Croissant: [['Flour', '60', 'g'], ['Butter', '30', 'g']],
      Cupcake: [['Flour', '40', 'g'], ['Sugar', '30', 'g'], ['Butter', '15', 'g'], ['Eggs', '0.5', 'pcs']],
      'Cookie box': [['Flour', '150', 'g'], ['Sugar', '100', 'g'], ['Butter', '60', 'g'], ['Eggs', '1', 'pcs'], ['Gift boxes', '1', 'pcs']],
    },
  },
  nails: {
    name: 'My Nail Salon',
    fixedCosts: '3000',
    products: [
      ['Classic manicure', 'Hands', '35', '6', '120'],
      ['Gel manicure', 'Hands', '50', '10', '90'],
      ['Pedicure', 'Feet', '45', '8', '70'],
      ['Nail art add-on', 'Extras', '15', '3', '60'],
    ],
    inventory: [
      ['Gel polish', '1', 'L', '0.40'],
      ['Regular polish', '2', 'L', '0.10'],
      ['Nail files', '300', 'pcs', '0.50'],
      ['Cotton pads', '1500', 'pcs', '0.02'],
      ['Foot soak', '5', 'L', '0.01'],
    ],
    recipes: {
      'Classic manicure': [['Regular polish', '4', 'mL'], ['Nail files', '1', 'pcs'], ['Cotton pads', '4', 'pcs']],
      'Gel manicure': [['Gel polish', '5', 'mL'], ['Nail files', '1', 'pcs'], ['Cotton pads', '4', 'pcs']],
      Pedicure: [['Regular polish', '5', 'mL'], ['Nail files', '1', 'pcs'], ['Cotton pads', '6', 'pcs'], ['Foot soak', '200', 'mL']],
      'Nail art add-on': [['Gel polish', '2', 'mL']],
    },
  },
  clothing: {
    name: 'My Clothing Store',
    fixedCosts: '2500',
    products: [
      ['T-shirt', 'Tops', '25', '9', '120'],
      ['Hoodie', 'Tops', '55', '22', '60'],
      ['Cap', 'Accessories', '20', '7', '80'],
      ['Tote bag', 'Accessories', '18', '6', '50'],
    ],
    inventory: [
      ['T-shirts (finished)', '100', 'pcs', '9'],
      ['Hoodies (finished)', '70', 'pcs', '22'],
      ['Caps (finished)', '80', 'pcs', '7'],
      ['Tote bags (finished)', '40', 'pcs', '6'],
      ['Shopping bags', '300', 'pcs', '0.10'],
    ],
    recipes: {
      'T-shirt': [['T-shirts (finished)', '1', 'pcs'], ['Shopping bags', '1', 'pcs']],
      Hoodie: [['Hoodies (finished)', '1', 'pcs'], ['Shopping bags', '1', 'pcs']],
      Cap: [['Caps (finished)', '1', 'pcs'], ['Shopping bags', '1', 'pcs']],
      'Tote bag': [['Tote bags (finished)', '1', 'pcs'], ['Shopping bags', '1', 'pcs']],
    },
  },
  custom: {
    name: 'My Business',
    fixedCosts: '800',
    products: [
      ['Product A', '', '20', '8', '100'],
      ['Product B', '', '35', '15', '50'],
    ],
    inventory: [
      ['Main material', '20', 'kg', '5'],
      ['Packaging', '200', 'pcs', '0.50'],
    ],
    recipes: {
      'Product A': [['Main material', '100', 'g'], ['Packaging', '1', 'pcs']],
      'Product B': [['Main material', '250', 'g'], ['Packaging', '1', 'pcs']],
    },
  },
  // ✨ Demo business – matches the project's required verification example.
  demo: {
    name: 'Maple Leaf Café (demo)',
    fixedCosts: '1500',
    products: [
      ['Coffee', 'Drinks', '6', '2', '300'],
      ['Muffin', 'Bakery', '4', '1.50', '150'],
      ['Sandwich', 'Food', '9', '4', '100'],
      ['Cookie', 'Bakery', '3', '1', '200'],
    ],
    inventory: [
      ['Coffee beans', '8000', 'g', '0.03'],
      ['Milk', '50', 'L', '2'],
      ['Coffee cups', '400', 'pcs', '0.15'],
      ['Flour', '25', 'kg', '4'],
      ['Sugar', '10', 'kg', '3'],
      ['Butter', '3', 'kg', '9'],
      ['Bread slices', '250', 'pcs', '0.20'],
      ['Cheese', '3', 'kg', '12'],
    ],
    recipes: {
      Coffee: [['Coffee beans', '20', 'g'], ['Milk', '200', 'mL'], ['Coffee cups', '1', 'pcs']],
      Muffin: [['Flour', '100', 'g'], ['Sugar', '30', 'g'], ['Butter', '15', 'g']],
      Sandwich: [['Bread slices', '2', 'pcs'], ['Cheese', '30', 'g']],
      Cookie: [['Flour', '40', 'g'], ['Sugar', '20', 'g'], ['Butter', '10', 'g']],
    },
  },
};

/**
 * Every name in the fictional samples, marked for translation: a sample loaded
 * in French gets French names. (The user's own data is never translated.)
 */
export const SAMPLE_TEXT = [
  tx('My Coffee Shop'), tx('My Bakery'), tx('My Nail Salon'), tx('My Clothing Store'), tx('My Business'), tx('Maple Leaf Café (demo)'),
  tx('Coffee'), tx('Latte'), tx('Muffin'), tx('Sandwich'), tx('Cookie'), tx('Sourdough loaf'), tx('Croissant'), tx('Cupcake'), tx('Cookie box'),
  tx('Classic manicure'), tx('Gel manicure'), tx('Pedicure'), tx('Nail art add-on'), tx('T-shirt'), tx('Hoodie'), tx('Cap'), tx('Tote bag'),
  tx('Product A'), tx('Product B'),
  tx('Drinks'), tx('Bakery'), tx('Food'), tx('Bread'), tx('Pastry'), tx('Sweets'), tx('Hands'), tx('Feet'), tx('Extras'), tx('Tops'), tx('Accessories'),
  tx('Coffee beans'), tx('Milk'), tx('Coffee cups'), tx('Flour'), tx('Sugar'), tx('Butter'), tx('Eggs'), tx('Gift boxes'), tx('Gel polish'), tx('Regular polish'),
  tx('Nail files'), tx('Cotton pads'), tx('Foot soak'), tx('T-shirts (finished)'), tx('Hoodies (finished)'), tx('Caps (finished)'), tx('Tote bags (finished)'),
  tx('Shopping bags'), tx('Main material'), tx('Packaging'), tx('Bread slices'), tx('Cheese'),
];

/** Builds a complete business from a sample, giving every record a unique id. */
export function sampleBusiness(type: BusinessId | 'demo', newId: (prefix: string) => string): BusinessData {
  const s = SAMPLES[type];
  const products: ProductInput[] = s.products.map(([name, category, price, variableCost, units]) => ({
    id: newId('p'),
    name,
    category,
    price,
    variableCost,
    units,
    costMode: 'manual',
    otherCosts: { ...EMPTY_OTHER_COSTS },
  }));
  const inventory = s.inventory.map(([name, quantity, unit, cost]) => ({ id: newId('i'), name, quantity, unit, cost }));
  const itemId = new Map(inventory.map((i) => [i.name, i.id]));
  const recipes: BusinessData['recipes'] = {};
  for (const p of products) {
    const lines = s.recipes[p.name];
    if (!lines) continue;
    recipes[p.id] = lines.map(([item, quantity, unit]) => {
      const id = itemId.get(item);
      if (!id) throw new Error(`Sample recipe uses unknown item ${item}`);
      return { id: newId('r'), itemId: id, quantity, unit };
    });
  }
  // Recipes are linked by id above, so the names can now be shown in the chosen language.
  return {
    type: type === 'demo' ? 'coffee' : type,
    name: t(s.name),
    isDemo: type === 'demo',
    fixedCosts: s.fixedCosts,
    products: products.map((p) => ({ ...p, name: t(p.name), category: p.category ? t(p.category) : '' })),
    inventory: inventory.map((i) => ({ ...i, name: t(i.name) })),
    recipes,
  };
}
