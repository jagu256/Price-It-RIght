import { describe, expect, it } from 'vitest';
import { toBase } from './inventory';
import { buildModel } from './model';
import { checkPlan } from './planning';
import { parseBuffer, purchaseCostCents, purchasePlan } from './purchasing';
import { sampleBusiness } from './samples';

let n = 0;
const demo = () => buildModel(sampleBusiness('demo', (p) => `${p}${++n}`));
const planFor = (bufferBP: number, packs: Record<string, number> = {}) => {
  const m = demo();
  const check = checkPlan(Object.fromEntries(m.products.map((p) => [p.id, p.units])), m.products, m.recipes, m.stock);
  const idOf = (name: string) => m.stock.find((s) => s.name === name)!.id;
  const packBase = Object.fromEntries(Object.entries(packs).map(([name, base]) => [idOf(name), base]));
  return purchasePlan(check, m.stock, bufferBP, packBase);
};
const summary = (p: ReturnType<typeof purchasePlan>) => p.lines.map((l) => [l.name, l.buyBase / 1000, l.cost]);

describe('purchase plan – demo café, worked by hand', () => {
  it('no buffer: milk 60 L needed − 50 L = 10 L at $2/L = $20; butter 4.25 kg − 3 kg = 1.25 kg at $9/kg = $11.25 → $31.25', () => {
    const p = planFor(0);
    expect(summary(p)).toEqual([['Milk', 10_000, 20], ['Butter', 1_250, 11.25]]);
    expect(p.knownCost).toBe(31.25);
    expect(p.unknownCost).toEqual([]);
  });

  it('10 % buffer: milk 16 L ($32), flour 0.3 kg ($1.20), butter 1.675 kg ($15.075 → $15.08), cheese 0.3 kg ($3.60) → $51.88', () => {
    const p = planFor(1000);
    expect(summary(p)).toEqual([['Milk', 16_000, 32], ['Flour', 300, 1.2], ['Butter', 1_675, 15.08], ['Cheese', 300, 3.6]]);
    expect(p.knownCost).toBe(51.88);
  });

  it('pack sizes round UP to whole packs: 10 L of milk in 2 L cartons = 5 ($20); in 4 L jugs = 3 → 12 L ($24)', () => {
    let p = planFor(0, { Milk: toBase(2, 'L') });
    expect(p.lines[0]).toMatchObject({ name: 'Milk', packs: 5, buyBase: toBase(10, 'L'), cost: 20 });
    p = planFor(0, { Milk: toBase(4, 'L') });
    expect(p.lines[0]).toMatchObject({ packs: 3, buyBase: toBase(12, 'L'), cost: 24 });
  });

  it('a missing purchase cost is unknown, never $0', () => {
    const m = demo();
    const stock = m.stock.map((s) => (s.name === 'Butter' ? { ...s, costPerBaseUnit: null } : s));
    const check = checkPlan(Object.fromEntries(m.products.map((p) => [p.id, p.units])), m.products, m.recipes, stock);
    const p = purchasePlan(check, stock, 0);
    expect(p.lines.find((l) => l.name === 'Butter')!.cost).toBeNull();
    expect(p.unknownCost).toEqual(['Butter']);
    expect(p.knownCost).toBe(20);
  });

  it('nothing short → nothing to buy', () => {
    const m = demo();
    const check = checkPlan(Object.fromEntries(m.products.map((p) => [p.id, 0])), m.products, m.recipes, m.stock);
    expect(purchasePlan(check, m.stock, 1000).lines).toEqual([]);
  });
});

describe('purchase cost in whole cents', () => {
  it('beans at $0.03 per g: 333 g → $9.99; 1 g → $0.03; half a cent rounds up', () => {
    const beans = { id: 'b', name: 'Beans', unit: 'g' as const, dimension: 'mass' as const, availableBase: 0, costPerBaseUnit: 0.03 };
    expect(purchaseCostCents(beans, toBase(333, 'g'))).toBe(999);
    expect(purchaseCostCents(beans, toBase(1, 'g'))).toBe(3);
    const cheap = { ...beans, costPerBaseUnit: 0.005 }; // half a cent per gram
    expect(purchaseCostCents(cheap, toBase(1, 'g'))).toBe(1);
  });
});

describe('safety buffer input', () => {
  it('accepts 0–100 %, rejects blank, negative, letters, too many decimals and over 100 (never turned into 0)', () => {
    expect(parseBuffer('10')).toEqual({ ok: true, basisPoints: 1000 });
    expect(parseBuffer('12.5 %')).toEqual({ ok: true, basisPoints: 1250 });
    expect(parseBuffer('0')).toEqual({ ok: true, basisPoints: 0 });
    for (const bad of ['', '-5', 'abc', '1.234', '150']) expect(parseBuffer(bad).ok).toBe(false);
  });
});
