import { describe, expect, it } from 'vitest';
import { calculateProduction, formatQuantity, joinNames, parseQuantity, toBase, type ParsedItem, type UnitId } from './inventory';

let n = 0;
/** Builds a parsed item the same way the app does: quantities → thousandths of the base unit. */
function item(name: string, available: number, availableUnit: UnitId, required: number, requiredUnit = availableUnit): ParsedItem {
  n += 1;
  const dim = availableUnit === 'pcs' ? 'count' : availableUnit === 'g' || availableUnit === 'kg' ? 'mass' : 'volume';
  return { id: `t${n}`, name, dimension: dim, availableBase: toBase(available, availableUnit), requiredBase: toBase(required, requiredUnit) };
}

describe('maximum production (one product, round down, lowest item wins)', () => {
  it('spec example: beans 100, milk 25, cups 100 → 25 coffees, milk limiting', () => {
    const p = calculateProduction([item('Coffee beans', 2000, 'g', 20), item('Milk', 5000, 'mL', 200), item('Coffee cups', 100, 'pcs', 1)]);
    expect(p.items.map((i) => i.maxProducts)).toEqual([100, 25, 100]);
    expect(p.maxProduction).toBe(25);
    expect(p.limiting.map((i) => i.name)).toEqual(['Milk']);
  });
  it('rounds DOWN to whole products', () => {
    expect(calculateProduction([item('Flour', 1000, 'g', 300)]).maxProduction).toBe(3);
  });
  it('shows all tied limiting items', () => {
    const p = calculateProduction([item('Beans', 2000, 'g', 20), item('Milk', 50000, 'mL', 200), item('Cups', 100, 'pcs', 1)]);
    expect(p.limiting.map((i) => i.name)).toEqual(['Beans', 'Cups']);
  });
  it('zero available inventory means zero production', () => {
    expect(calculateProduction([item('Milk', 0, 'mL', 200)]).maxProduction).toBe(0);
  });
  it('converts compatible units and avoids floating-point errors', () => {
    expect(calculateProduction([item('Beans', 2, 'kg', 20, 'g')]).maxProduction).toBe(100);
    expect(calculateProduction([item('Sugar', 0.3, 'kg', 100, 'g')]).maxProduction).toBe(3); // 0.3 ÷ 0.1 is not 2.999…
    expect(calculateProduction([item('Syrup', 1.1, 'L', 100, 'mL')]).maxProduction).toBe(11);
  });
  it('handles very large numbers', () => {
    expect(calculateProduction([item('Sand', 1e9, 'kg', 0.001, 'g')]).maxProduction).toBe(1e15);
  });
});

describe('quantity validation', () => {
  it('accepts zero available, thousands separators and up to 3 decimals', () => {
    expect(parseQuantity('0', 'available')).toEqual({ ok: true, value: 0 });
    expect(parseQuantity('2,000', 'available')).toEqual({ ok: true, value: 2000 });
    expect(parseQuantity('0.025', 'required')).toEqual({ ok: true, value: 0.025 });
  });
  it('rejects negative, zero-per-product, empty, non-numeric, too-precise and too-large values', () => {
    expect(parseQuantity('-5', 'available')).toMatchObject({ ok: false, error: expect.stringMatching(/can't be negative/) });
    expect(parseQuantity('0', 'required')).toMatchObject({ ok: false, error: expect.stringMatching(/more than 0/) });
    for (const raw of ['', 'abc', '20g', '1.2345', '99999999999']) expect(parseQuantity(raw, 'available').ok, raw).toBe(false);
  });
});

describe('display helpers', () => {
  it('formats quantities in friendly units', () => {
    expect(formatQuantity(15_000_000, 'volume')).toBe('15 litres');
    expect(formatQuantity(1_000_000, 'volume')).toBe('1 litre');
    expect(formatQuantity(500_000, 'mass')).toBe('500 grams');
    expect(formatQuantity(4_000_000, 'mass', 'short')).toBe('4 kg');
    expect(formatQuantity(200_000, 'count')).toBe('200 pieces');
    expect(formatQuantity(1_000, 'count')).toBe('1 piece');
  });
  it('joins names', () => {
    expect(joinNames(['Milk'])).toBe('Milk');
    expect(joinNames(['Beans', 'Cups', 'Milk'])).toBe('Beans, Cups and Milk');
  });
});
