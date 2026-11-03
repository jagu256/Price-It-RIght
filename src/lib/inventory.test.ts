import { describe, expect, it } from 'vitest';
import {
  calculateProduction,
  estimateSales,
  findShortages,
  formatQuantity,
  parseQuantity,
  validateInventory,
  validateItem,
  type InventoryItemInput,
  type ParsedItem,
} from './inventory';

let n = 0;
function item(name: string, available: string, availableUnit: InventoryItemInput['availableUnit'], required: string, requiredUnit = availableUnit): InventoryItemInput {
  n += 1;
  return { id: `t${n}`, name, available, availableUnit, required, requiredUnit };
}

function parse(items: InventoryItemInput[]): ParsedItem[] {
  const v = validateInventory(items);
  if (!v.parsed) throw new Error(`invalid: ${JSON.stringify(v.errors)}`);
  return v.parsed;
}

const coffeeInventory = () => [
  item('Coffee beans', '2000', 'g', '20'),
  item('Milk', '5000', 'mL', '200'),
  item('Coffee cups', '100', 'pcs', '1'),
];

const coffeePricing = { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 };

describe('maximum production with multiple inventory items', () => {
  it('uses the lowest item result and identifies the limiting item (spec example)', () => {
    const p = calculateProduction(parse(coffeeInventory()));
    expect(p.items.map((i) => i.maxProducts)).toEqual([100, 25, 100]);
    expect(p.maxProduction).toBe(25);
    expect(p.limiting.map((i) => i.name)).toEqual(['Milk']);
  });

  it('rounds each item DOWN to whole products', () => {
    const p = calculateProduction(parse([item('Flour', '1000', 'g', '300')]));
    expect(p.maxProduction).toBe(3); // 3.33 → 3
  });

  it('shows every item when two items are tied as limiting', () => {
    const p = calculateProduction(
      parse([item('Coffee beans', '2000', 'g', '20'), item('Milk', '50000', 'mL', '200'), item('Coffee cups', '100', 'pcs', '1')]),
    );
    expect(p.maxProduction).toBe(100);
    expect(p.limiting.map((i) => i.name)).toEqual(['Coffee beans', 'Coffee cups']);
  });

  it('zero available inventory means zero production', () => {
    const p = calculateProduction(parse([item('Milk', '0', 'mL', '200'), item('Cups', '100', 'pcs', '1')]));
    expect(p.maxProduction).toBe(0);
    expect(p.limiting.map((i) => i.name)).toEqual(['Milk']);
  });

  it('handles very large numbers without crashing', () => {
    const p = calculateProduction(parse([item('Sand', '1000000000', 'kg', '0.001', 'g')]));
    expect(p.maxProduction).toBe(1e15);
    expect(Number.isFinite(estimateSales(p.maxProduction, coffeePricing).maxPotentialRevenue)).toBe(true);
  });
});

describe('unit conversions', () => {
  it('converts kg to g and L to mL', () => {
    const p = calculateProduction(parse([item('Beans', '2', 'kg', '20', 'g'), item('Milk', '5', 'L', '200', 'mL')]));
    expect(p.items.map((i) => i.maxProducts)).toEqual([100, 25]);
  });

  it('converts g to kg (smaller available unit, larger required unit)', () => {
    const p = calculateProduction(parse([item('Flour', '2500', 'g', '0.5', 'kg')]));
    expect(p.maxProduction).toBe(5);
  });

  it('avoids floating-point errors when rounding down', () => {
    // 0.3 ÷ 0.1 is 2.9999999999999996 in floating point; the answer must be 3.
    expect(calculateProduction(parse([item('Sugar', '0.3', 'kg', '100', 'g')])).maxProduction).toBe(3);
    expect(calculateProduction(parse([item('Syrup', '1.1', 'L', '100', 'mL')])).maxProduction).toBe(11);
  });

  it('rejects incompatible units', () => {
    const r = validateItem(item('Milk', '5', 'kg', '200', 'mL'));
    expect(r.parsed).toBeNull();
    expect(r.errors.unit).toMatch(/Kilograms and millilitres can’t be converted/);
    expect(validateItem(item('Cups', '100', 'pcs', '1', 'g')).errors.unit).toBeDefined();
  });

  it('formats quantities in friendly units', () => {
    expect(formatQuantity(15_000_000, 'volume')).toBe('15 litres');
    expect(formatQuantity(1_000_000, 'volume')).toBe('1 litre');
    expect(formatQuantity(500_000, 'mass')).toBe('500 grams');
    expect(formatQuantity(4_000_000, 'mass', 'short')).toBe('4 kg');
    expect(formatQuantity(200_000, 'count')).toBe('200 pieces');
    expect(formatQuantity(1_000, 'count')).toBe('1 piece');
  });
});

describe('input validation', () => {
  it('rejects negative quantities', () => {
    expect(parseQuantity('-5', 'available')).toEqual({ ok: false, error: "Quantity available can't be negative. Enter 0 if you have none." });
    expect(parseQuantity('-1', 'required').ok).toBe(false);
  });

  it('rejects zero quantity required per product', () => {
    const r = parseQuantity('0', 'required');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/must be more than 0/);
  });

  it('accepts zero quantity available', () => {
    expect(parseQuantity('0', 'available')).toEqual({ ok: true, value: 0 });
  });

  it('rejects empty, non-numeric, too-precise and too-large values', () => {
    for (const raw of ['', '   ', 'abc', '20g', '1.2345', '99999999999']) {
      expect(parseQuantity(raw, 'available').ok, raw).toBe(false);
    }
  });

  it('accepts thousands separators and decimals', () => {
    expect(parseQuantity('2,000', 'available')).toEqual({ ok: true, value: 2000 });
    expect(parseQuantity('0.025', 'required')).toEqual({ ok: true, value: 0.025 });
  });

  it('requires an item name', () => {
    expect(validateItem(item('  ', '10', 'pcs', '1')).errors.name).toMatch(/give this item a name/);
  });

  it('does not calculate anything when no items are entered', () => {
    expect(validateInventory([])).toEqual({ parsed: null, errors: {}, issue: 'no-items' });
  });

  it('does not calculate a partial result when any item is invalid', () => {
    const v = validateInventory([item('Beans', '2000', 'g', '20'), item('Milk', 'lots', 'mL', '200')]);
    expect(v.parsed).toBeNull();
    expect(v.issue).toBe('invalid');
    expect(Object.keys(v.errors)).toHaveLength(1);
  });
});

describe('sales estimate', () => {
  const production = () => calculateProduction(parse(coffeeInventory())).maxProduction; // 25

  it('insufficient inventory: expected sales (300) higher than production capacity (25)', () => {
    const s = estimateSales(production(), coffeePricing);
    expect(s.estimatedSales).toBe(25);
    expect(s.inventorySufficient).toBe(false);
    expect(s.maxPotentialRevenue).toBe(150);
    expect(s.estimatedRevenue).toBe(150);
    expect(s.estimatedOperatingProfit).toBe(-700); // 25 × ($6 − $2) − $800
    expect(s.dashboardProfit).toBe(400);
  });

  it('sufficient inventory: expected sales (20) lower than production capacity (25)', () => {
    const s = estimateSales(production(), { ...coffeePricing, units: 20 });
    expect(s.estimatedSales).toBe(20);
    expect(s.inventorySufficient).toBe(true);
    expect(s.maxPotentialRevenue).toBe(150); // assumes all 25 sold
    expect(s.estimatedRevenue).toBe(120);
    expect(s.estimatedOperatingProfit).toBe(-720);
  });

  it('expected sales exactly equal to capacity counts as sufficient', () => {
    expect(estimateSales(25, { ...coffeePricing, units: 25 }).inventorySufficient).toBe(true);
  });

  it('updates when selling price, variable cost and fixed costs change', () => {
    const s = estimateSales(25, { sellingPrice: 8, variableCost: 3, fixedCosts: 50, units: 300 });
    expect(s.estimatedRevenue).toBe(200);
    expect(s.maxPotentialRevenue).toBe(200);
    expect(s.estimatedOperatingProfit).toBe(75); // 25 × ($8 − $3) − $50
  });

  it('zero production gives zero sales and a loss equal to fixed costs', () => {
    const s = estimateSales(0, coffeePricing);
    expect(s.estimatedSales).toBe(0);
    expect(s.estimatedRevenue).toBe(0);
    expect(s.estimatedOperatingProfit).toBe(-800);
  });
});

describe('inventory shortage calculator', () => {
  it('calculates the milk shortage for 100 expected coffees (spec example)', () => {
    const s = findShortages(parse(coffeeInventory()), 100);
    const milk = s.find((x) => x.name === 'Milk')!;
    expect(formatQuantity(milk.requiredTotalBase, milk.dimension)).toBe('20 litres');
    expect(formatQuantity(milk.shortageBase, milk.dimension)).toBe('15 litres');
    expect(s.find((x) => x.name === 'Coffee beans')!.shortageBase).toBe(0); // 2,000 g needed, 2,000 g available
    expect(s.find((x) => x.name === 'Coffee cups')!.shortageBase).toBe(0);
  });

  it('shows no shortage when inventory is sufficient', () => {
    expect(findShortages(parse(coffeeInventory()), 20).every((x) => x.shortageBase === 0)).toBe(true);
  });

  it('works with converted units', () => {
    const [flour] = findShortages(parse([item('Flour', '1', 'kg', '80', 'g')]), 25);
    expect(formatQuantity(flour.shortageBase, flour.dimension)).toBe('1 kilogram'); // 2 kg needed − 1 kg
  });
});
