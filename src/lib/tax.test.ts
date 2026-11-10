import { describe, expect, it } from 'vitest';
import { preTaxMath, taxEstimateMath } from './showMath';
import { estimateTax, formatRate, parseTaxRate, requiredPreTaxProfit } from './tax';

const bp = (text: string) => {
  const r = parseTaxRate(text);
  if (!r.ok) throw new Error(r.error);
  return r.basisPoints;
};

describe('tax rate input', () => {
  it('accepts 0 to 100 with up to 2 decimals and an optional % sign', () => {
    expect(parseTaxRate('20')).toEqual({ ok: true, basisPoints: 2000, percent: 20 });
    expect(parseTaxRate(' 12.5% ')).toEqual({ ok: true, basisPoints: 1250, percent: 12.5 });
    expect(parseTaxRate('0')).toEqual({ ok: true, basisPoints: 0, percent: 0 });
    expect(parseTaxRate('100')).toEqual({ ok: true, basisPoints: 10000, percent: 100 });
    expect(parseTaxRate('26.75')).toEqual({ ok: true, basisPoints: 2675, percent: 26.75 });
  });

  it('rejects blank, negative, letters, over 100 and too many decimals – never turned into 0', () => {
    expect(parseTaxRate('')).toMatchObject({ ok: false, error: expect.stringMatching(/enter your income tax rate/) });
    expect(parseTaxRate('-5')).toMatchObject({ ok: false, error: expect.stringMatching(/can’t be negative/) });
    expect(parseTaxRate('abc')).toMatchObject({ ok: false, error: expect.stringMatching(/as a number/) });
    expect(parseTaxRate('120')).toMatchObject({ ok: false, error: expect.stringMatching(/between 0 and 100/) });
    expect(parseTaxRate('12.345')).toMatchObject({ ok: false, error: expect.stringMatching(/2 decimal places/) });
  });
});

describe('required pre-tax profit = after-tax target ÷ (1 − tax rate)', () => {
  it('hand check: $1,000 after tax at 20% needs $1,250 before tax', () => {
    const r = requiredPreTaxProfit(1000, bp('20'));
    expect(r).toEqual({ status: 'ok', preTax: 1250, exact: 1250, tax: 250, afterTax: 1000, noTax: false });
  });

  it('a 0% rate needs no extra', () => {
    expect(requiredPreTaxProfit(1000, 0)).toMatchObject({ preTax: 1000, tax: 0, afterTax: 1000 });
  });

  it('rounds UP to the next cent so the after-tax target is met', () => {
    const r = requiredPreTaxProfit(1000, bp('30')); // 1,000 ÷ 0.7 = 1,428.5714…
    expect(r).toMatchObject({ status: 'ok', preTax: 1428.58, tax: 428.57, afterTax: 1000.01 });
    if (r.status === 'ok') expect(r.exact).toBeCloseTo(1428.571428, 5);
  });

  it('the after-tax amount always reaches the target (checked over many targets and rates)', () => {
    for (const rate of [1, 7.5, 13.33, 20, 26.5, 33.33, 50, 66.67, 99.99]) {
      for (const target of [0.01, 0.99, 1, 17.37, 333.33, 1000, 12345.67, 999999.99]) {
        const r = requiredPreTaxProfit(target, Math.round(rate * 100));
        if (r.status !== 'ok') throw new Error('expected ok');
        expect(Math.round(r.afterTax * 100)).toBeGreaterThanOrEqual(Math.round(target * 100));
        expect(Math.round(r.preTax * 100)).toBe(Math.round((r.tax + r.afterTax) * 100));
      }
    }
  });

  it('no tax on a loss or on $0: the pre-tax target is the same', () => {
    expect(requiredPreTaxProfit(-200, bp('20'))).toMatchObject({ status: 'ok', preTax: -200, tax: 0, noTax: true });
    expect(requiredPreTaxProfit(0, bp('20'))).toMatchObject({ status: 'ok', preTax: 0, tax: 0, noTax: true });
  });

  it('100% tax: Not Available for a positive target (no division by zero)', () => {
    const r = requiredPreTaxProfit(1000, bp('100'));
    expect(r.status).toBe('not-available');
    expect(requiredPreTaxProfit(-50, bp('100'))).toMatchObject({ status: 'ok', preTax: -50 });
  });
});

describe('estimated tax on operating profit', () => {
  it('demo café profit $975 at 20%: tax $195, after tax $780', () => {
    expect(estimateTax(975, bp('20'))).toEqual({ operatingProfit: 975, tax: 195, afterTax: 780, noTax: false });
  });

  it('rounds the tax to the nearest cent', () => {
    expect(estimateTax(100.05, bp('15'))).toMatchObject({ tax: 15.01, afterTax: 85.04 }); // 15.0075 → 15.01
    expect(estimateTax(0.01, bp('20'))).toMatchObject({ tax: 0, afterTax: 0.01 });
  });

  it('no tax on a loss', () => {
    expect(estimateTax(-525, bp('20'))).toEqual({ operatingProfit: -525, tax: 0, afterTax: -525, noTax: true });
    expect(estimateTax(0, bp('20'))).toMatchObject({ tax: 0, noTax: true });
  });
});

describe('show the math – after-tax target', () => {
  it('explains the hand check and the tax estimate with the same numbers', () => {
    const [pre, check] = preTaxMath(1000, 20, requiredPreTaxProfit(1000, 2000));
    expect(pre.withNumbers).toBe('$1,000 ÷ (1 − 20%) = $1,250');
    expect(check.withNumbers).toBe('$1,250 − $250 = $1,000');
    const [est] = taxEstimateMath(estimateTax(975, 2000), 20);
    expect(est.steps).toEqual(['Tax: $975 × 20% = $195']);
    expect(est.withNumbers).toBe('$975 − $195 = $780');
    expect(preTaxMath(1000, 30, requiredPreTaxProfit(1000, 3000))[0].withNumbers).toBe('$1,000 ÷ (1 − 30%) = $1428.5714, rounded UP to $1,428.58');
    expect(formatRate(12.5)).toBe('12.5%');
  });
});
