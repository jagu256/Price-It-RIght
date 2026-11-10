import { describe, expect, it } from 'vitest';
import { businessSummary } from './business';
import { formatPercent } from './format';
import { formatLeverage, operatingLeverage, percentOfCents, sensitivity, tornadoOrder } from './sensitivity';
import { leverageMath, sensitivityMath } from './showMath';

/** The required demo café: revenue $3,900, VC $1,425, CM $2,475, fixed $1,500, profit $975. */
const demo = businessSummary(
  [
    { id: 'c', name: 'Coffee', price: 6, variableCost: 2, units: 300 },
    { id: 'm', name: 'Muffin', price: 4, variableCost: 1.5, units: 150 },
    { id: 's', name: 'Sandwich', price: 9, variableCost: 4, units: 100 },
    { id: 'k', name: 'Cookie', price: 3, variableCost: 1, units: 200 },
  ],
  1500,
);
const row = (r: ReturnType<typeof sensitivity>, f: string) => r.rows.find((x) => x.factor === f)!;

describe('sensitivity – hand-checked demo café (profit $975, CM $2,475)', () => {
  const r = sensitivity(demo, 10);

  it('prices +10% → +$390 → $1,365', () => {
    expect(row(r, 'prices').upChange).toBe(390);
    expect(row(r, 'prices').upProfit).toBe(1365);
    expect(row(r, 'prices').downProfit).toBe(585);
  });

  it('variable costs +10% → −$142.50 → $832.50', () => {
    expect(row(r, 'variableCosts').upChange).toBe(-142.5);
    expect(row(r, 'variableCosts').upProfit).toBe(832.5);
    expect(row(r, 'variableCosts').downProfit).toBe(1117.5);
  });

  it('volume +10% → +$247.50 → $1,222.50, a 25.4% change = DOL × 10%', () => {
    const v = row(r, 'volume');
    expect(v.upChange).toBe(247.5);
    expect(v.upProfit).toBe(1222.5);
    expect(formatPercent(v.upPercent!)).toBe('25.4%');
    const dol = operatingLeverage(demo);
    if (dol.status !== 'ok') throw new Error('expected a DOL');
    expect(v.upPercent!).toBeCloseTo(dol.value * 10, 10);
  });

  it('fixed costs +10% → −$150 → $825', () => {
    expect(row(r, 'fixedCosts').upChange).toBe(-150);
    expect(row(r, 'fixedCosts').upProfit).toBe(825);
  });

  it('DOL = 2,475 ÷ 975 = 2.54', () => {
    const dol = operatingLeverage(demo);
    expect(dol.status).toBe('ok');
    if (dol.status === 'ok') {
      expect(dol.value).toBeCloseTo(2475 / 975, 12);
      expect(formatLeverage(dol.value)).toBe('2.54');
    }
  });

  it('every −10% is the exact opposite of +10%', () => {
    for (const x of r.rows) expect(x.downChange).toBe(-x.upChange);
  });

  it('orders the tornado by size of swing: prices, volume, fixed costs, variable costs', () => {
    expect(tornadoOrder(r.rows).map((x) => x.factor)).toEqual(['prices', 'volume', 'fixedCosts', 'variableCosts']);
  });

  it('explains each row with the same numbers', () => {
    const math = sensitivityMath(r);
    expect(math[0].withNumbers).toBe('10% × $3,900 = +$390, so $975 + $390 = $1,365');
    expect(math[1].withNumbers).toBe('10% × $1,425 = −$142.50, so $975 − $142.50 = $832.50');
    expect(math[2].withNumbers).toBe('10% × $2,475 = +$247.50, so $975 + $247.50 = $1,222.50');
    expect(math[3].withNumbers).toBe('10% × $1,500 = −$150, so $975 − $150 = $825');
    const dol = operatingLeverage(demo);
    const [lev] = leverageMath(dol, r);
    expect(lev.withNumbers).toBe('$2,475 ÷ $975 = 2.54');
    expect(lev.note).toBe('Check: sales volume +10% changes profit by 25.4%, which is 2.54 × 10%.');
  });
});

describe('sensitivity – edge cases', () => {
  it('rounds each change to the nearest cent once (halves away from zero)', () => {
    expect(percentOfCents(5, 10)).toBe(1); // 10% of $0.05 = 0.5¢ → 1¢
    expect(percentOfCents(4, 10)).toBe(0); // 0.4¢ → 0¢
    expect(percentOfCents(-5, 10)).toBe(-1);
    expect(percentOfCents(14_250_000, 10)).toBe(1_425_000);
  });

  it('a loss: percentages use the size of the loss, DOL is not meaningful', () => {
    const loss = businessSummary([{ id: 'a', name: 'Tea', price: 5, variableCost: 3, units: 100 }], 400); // CM $200, loss −$200
    const r = sensitivity(loss);
    expect(row(r, 'prices').upChange).toBe(50);
    expect(row(r, 'prices').upProfit).toBe(-150);
    expect(row(r, 'prices').upPercent).toBe(25); // $50 better than a $200 loss
    const dol = operatingLeverage(loss);
    expect(dol.status).toBe('not-meaningful');
    if (dol.status === 'not-meaningful') expect(dol.reason).toMatch(/operating loss/);
    expect(leverageMath(dol, r)).toEqual([]);
  });

  it('zero profit: no percentages and DOL not meaningful (no division by zero)', () => {
    const even = businessSummary([{ id: 'a', name: 'Tea', price: 5, variableCost: 3, units: 100 }], 200);
    const r = sensitivity(even);
    expect(r.rows.every((x) => x.upPercent === null && x.downPercent === null)).toBe(true);
    const dol = operatingLeverage(even);
    expect(dol.status).toBe('not-meaningful');
    if (dol.status === 'not-meaningful') expect(dol.reason).toMatch(/exactly \$0/);
  });

  it('no sales and no fixed costs: every change is $0, never NaN', () => {
    const none = businessSummary([{ id: 'a', name: 'Tea', price: 5, variableCost: 3, units: 0 }], 0);
    const r = sensitivity(none);
    expect(JSON.stringify(r)).not.toMatch(/NaN|Infinity/);
    expect(r.rows.every((x) => x.upChange === 0)).toBe(true);
  });

  it('works with other percentages', () => {
    expect(row(sensitivity(demo, 20), 'prices').upChange).toBe(780);
  });
});
