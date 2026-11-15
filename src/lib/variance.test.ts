import { describe, expect, it } from 'vitest';
import { varianceAnalysis, varianceLabel, type ActualProduct } from './variance';

const budget = [
  { id: 'c', name: 'Coffee', price: 6, variableCost: 2, units: 300 },
  { id: 'm', name: 'Muffin', price: 4, variableCost: 1.5, units: 150 },
  { id: 's', name: 'Sandwich', price: 9, variableCost: 4, units: 100 },
  { id: 'k', name: 'Cookie', price: 3, variableCost: 1, units: 200 },
];
const same = (): ActualProduct[] => budget.map((b) => ({ id: b.id, units: b.units, price: b.price, variableCost: b.variableCost }));

describe('budget vs actual – hand-worked demo café month', () => {
  // Actual: Coffee 320 sold, VC $2.10; Muffin 140; Sandwich 90 at $9.50; Cookie 200; fixed $1,550.
  const actual: ActualProduct[] = [
    { id: 'c', units: 320, price: 6, variableCost: 2.1 },
    { id: 'm', units: 140, price: 4, variableCost: 1.5 },
    { id: 's', units: 90, price: 9.5, variableCost: 4 },
    { id: 'k', units: 200, price: 3, variableCost: 1 },
  ];
  const r = varianceAnalysis(budget, 1500, actual, 1550);

  it('static budget $975 → actual $943 (checked directly: 1,248 + 350 + 495 + 400 − 1,550)', () => {
    expect(r.staticProfit).toBe(975);
    expect(r.actualProfit).toBe(943);
    expect(r.total).toBe(-32);
    expect(r.actualRevenue).toBe(3935);
  });

  it('volume +$5 (Coffee +20 × $4 = +$80, Muffin −10 × $2.50 = −$25, Sandwich −10 × $5 = −$50)', () => {
    expect(r.products.map((p) => p.volume)).toEqual([80, -25, -50, 0]);
    expect(r.volume).toBe(5);
    expect(r.flexibleProfit).toBe(980);
  });

  it('same 750 units in total → quantity $0, so the whole +$5 is a mix variance (more coffee, CM $4 > average $3.30)', () => {
    expect(r.quantity).toBe(0);
    expect(r.mix).toBe(5);
  });

  it('price +$45 F (Sandwich $0.50 × 90); variable cost −$32 U (Coffee $0.10 × 320); fixed −$50 U', () => {
    expect(r.price).toBe(45);
    expect(r.variableCost).toBe(-32);
    expect(r.fixedCosts).toBe(-50);
  });

  it('the variances add up exactly: 975 + 5 + 45 − 32 − 50 = 943', () => {
    expect(r.staticProfit + r.volume + r.price + r.variableCost + r.fixedCosts).toBe(r.actualProfit);
    expect(r.products.reduce((s, p) => s + p.total, 0) + r.fixedCosts).toBe(r.total);
  });
});

describe('budget vs actual – other cases', () => {
  it('actual = budget → every variance is $0', () => {
    const r = varianceAnalysis(budget, 1500, same(), 1500);
    expect([r.volume, r.quantity, r.mix, r.price, r.variableCost, r.fixedCosts, r.total]).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(r.actualProfit).toBe(975);
  });

  it('every product +10 % units (same mix) → all quantity, no mix: 75 × $3.30 = $247.50', () => {
    const a = same().map((p) => ({ ...p, units: (p.units * 11) / 10 }));
    const r = varianceAnalysis(budget, 1500, a, 1500);
    expect(r.volume).toBe(247.5);
    expect(r.quantity).toBe(247.5);
    expect(r.mix).toBe(0);
  });

  it('rounds the quantity variance to the nearest cent and keeps quantity + mix = volume', () => {
    // 1 extra coffee: volume $4; quantity = 1 × 2,475 ÷ 750 = $3.30; mix $0.70
    const a = same();
    a[0].units = 301;
    let r = varianceAnalysis(budget, 1500, a, 1500);
    expect([r.volume, r.quantity, r.mix]).toEqual([4, 3.3, 0.7]);
    // budget of 3 units with CM $1 each, $1 + $1 + $0 → quantity for +1 unit = 2 ÷ 3 = $0.666… → $0.67
    const tiny = [
      { id: 'a', name: 'A', price: 1, variableCost: 0, units: 2 },
      { id: 'b', name: 'B', price: 0, variableCost: 0, units: 1 },
    ];
    r = varianceAnalysis(tiny, 0, [{ id: 'a', units: 2, price: 1, variableCost: 0 }, { id: 'b', units: 2, price: 0, variableCost: 0 }], 0);
    expect(r.quantity).toBe(0.67);
    expect(Math.round((r.quantity! + r.mix!) * 100)).toBe(Math.round(r.volume * 100));
  });

  it('a budget with no units has no mix → quantity and mix are N/A (null), not NaN', () => {
    const zero = budget.map((b) => ({ ...b, units: 0 }));
    const r = varianceAnalysis(zero, 1500, same(), 1500);
    expect(r.quantity).toBeNull();
    expect(r.mix).toBeNull();
    expect(r.volume).toBe(2475);
    expect(Number.isFinite(r.actualProfit)).toBe(true);
  });

  it('works in whole cents (no 0.1 + 0.2 drift) and with very large numbers', () => {
    const r = varianceAnalysis([{ id: 'x', name: 'X', price: 0.3, variableCost: 0.1, units: 3 }], 0, [{ id: 'x', units: 3, price: 0.2, variableCost: 0.1 }], 0);
    expect(r.price).toBe(-0.3);
    const big = varianceAnalysis([{ id: 'x', name: 'X', price: 999_999.99, variableCost: 0, units: 1_000_000_000 }], 0, [{ id: 'x', units: 1_000_000_000, price: 999_999.98, variableCost: 0 }], 0);
    expect(big.price).toBe(-10_000_000);
  });

  it('labels F / U / blank', () => {
    expect([varianceLabel(5), varianceLabel(-0.01), varianceLabel(0)]).toEqual(['F', 'U', '']);
  });
});
