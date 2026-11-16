import { describe, expect, it } from 'vitest';
import { costPlusPrice, parseRate } from './costPlus';

describe('cost-plus pricing – hand checks', () => {
  it('markup: $2 + 50 % = $3.00; that is a 33.3 % margin', () => {
    const r = costPlusPrice(2, 'markup', 5000);
    expect(r.price).toBe(3);
    expect(r.cmPerUnit).toBe(1);
    expect(r.marginPercent).toBeCloseTo(33.333, 3);
    expect(r.equivalentPercent).toBeCloseTo(33.333, 3);
  });

  it('margin: $2 at a 50 % margin = $4.00; that is a 100 % markup', () => {
    const r = costPlusPrice(2, 'margin', 5000);
    expect(r.price).toBe(4);
    expect(r.markupPercent).toBe(100);
    expect(r.equivalentPercent).toBe(100);
  });

  it('demo muffin $1.50 at a 60 % margin = $3.75', () => {
    expect(costPlusPrice(1.5, 'margin', 6000).price).toBe(3.75);
  });

  it('rounds UP to the cent so the rate is always reached: $2.10 + 33 % = $2.793 → $2.80; $2 at 70 % = $6.666… → $6.67 (70.01 %)', () => {
    expect(costPlusPrice(2.1, 'markup', 3300).price).toBe(2.8);
    const m = costPlusPrice(2, 'margin', 7000);
    expect(m.price).toBe(6.67);
    expect(m.marginPercent!).toBeGreaterThanOrEqual(70);
    expect(m.marginPercent).toBeCloseTo(70.015, 3);
  });

  it('never rounds when the answer is already whole cents', () => {
    expect(costPlusPrice(4, 'markup', 2500).price).toBe(5);
    expect(costPlusPrice(3, 'margin', 2500).price).toBe(4);
  });

  it('over a grid of costs and rates, the result always reaches the rate and is at most 1 cent above the exact price', () => {
    for (let c = 1; c <= 1500; c += 37) {
      for (const bp of [0, 1, 999, 2500, 3333, 5000, 7777, 9999]) {
        const mk = costPlusPrice(c / 100, 'markup', bp);
        const exactMk = (c * (10_000 + bp)) / 10_000;
        expect(mk.price * 100).toBeGreaterThanOrEqual(exactMk - 1e-9);
        expect(mk.price * 100 - exactMk).toBeLessThan(1);
        const mg = costPlusPrice(c / 100, 'margin', bp);
        const exactMg = (c * 10_000) / (10_000 - bp);
        expect(mg.price * 100).toBeGreaterThanOrEqual(exactMg - 1e-9);
        expect(mg.price * 100 - exactMg).toBeLessThan(1);
      }
    }
  });

  it('a $0 cost gives a $0 price, with markup N/A (null) and no NaN', () => {
    const r = costPlusPrice(0, 'markup', 5000);
    expect(r.price).toBe(0);
    expect(r.markupPercent).toBeNull();
    expect(r.marginPercent).toBeNull();
  });
});

describe('rate input', () => {
  it('accepts markups 0–1,000 % and margins below 100 %', () => {
    expect(parseRate('50', 'markup')).toEqual({ ok: true, basisPoints: 5000 });
    expect(parseRate('250 %', 'markup')).toEqual({ ok: true, basisPoints: 25000 });
    expect(parseRate('99.99', 'margin')).toEqual({ ok: true, basisPoints: 9999 });
  });
  it('rejects blank, negative, letters, too many decimals, a 100 % margin and markups over 1,000 % (never 0)', () => {
    for (const [raw, m] of [['', 'markup'], ['-5', 'markup'], ['abc', 'margin'], ['1.234', 'markup'], ['100', 'margin'], ['1001', 'markup']] as const) {
      expect(parseRate(raw, m).ok).toBe(false);
    }
    const r = parseRate('100', 'margin');
    expect(!r.ok && r.error).toMatch(/less than 100/);
  });
});

describe('target costing (reverse of cost-plus)', () => {
  it('Coffee sells at $6; for a 70 % margin the cost may be at most $1.80 → $0.20 (10 %) below today’s $2', async () => {
    const { targetCost } = await import('./costPlus');
    expect(targetCost(6, 7000, 2)).toEqual({ targetCost: 1.8, actualMarginPercent: 70, reductionNeeded: 0.2, reductionPercent: 10 });
  });

  it('rounds the cost DOWN so the margin is always reached: $4.99 at 60 % → $1.996 → $1.99 (60.12 %)', async () => {
    const { targetCost } = await import('./costPlus');
    const r = targetCost(4.99, 6000, 1.5);
    expect(r.targetCost).toBe(1.99);
    expect(r.actualMarginPercent!).toBeGreaterThanOrEqual(60);
    expect(r.actualMarginPercent).toBeCloseTo(60.12, 2);
    expect(r.reductionNeeded).toBe(-0.49); // already $0.49 under the target
  });

  it('0 % margin → the cost can equal the price; $0 price and $0 cost give N/A, not NaN', async () => {
    const { targetCost } = await import('./costPlus');
    expect(targetCost(6, 0, 2).targetCost).toBe(6);
    expect(targetCost(0, 5000, 0)).toEqual({ targetCost: 0, actualMarginPercent: null, reductionNeeded: 0, reductionPercent: null });
  });

  it('is the exact reverse of cost-plus when no rounding is needed: $2 at 50 % → $4 → back to $2', async () => {
    const { targetCost, costPlusPrice } = await import('./costPlus');
    expect(targetCost(costPlusPrice(2, 'margin', 5000).price, 5000, 2).targetCost).toBe(2);
  });
});
