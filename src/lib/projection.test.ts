import { describe, expect, it } from 'vitest';
import { toCents } from './business';
import { MONTHS, parseMultiplier, projectYear, unitsForMonth, type MonthInput } from './projection';

/** The demo café: revenue $3,900, CM $2,475, fixed $1,500, profit $975 per normal month. */
const demo = [
  { id: 'c', name: 'Coffee', price: 6, variableCost: 2, units: 300 },
  { id: 'm', name: 'Muffin', price: 4, variableCost: 1.5, units: 150 },
  { id: 's', name: 'Sandwich', price: 9, variableCost: 4, units: 100 },
  { id: 'k', name: 'Cookie', price: 3, variableCost: 1, units: 200 },
];
const flat = (pct = 100, fixed = 1500): MonthInput[] => MONTHS.map(() => ({ multiplierBasisPoints: pct * 100, fixedCosts: fixed }));

describe('12-month projection – default (100 % every month)', () => {
  const r = projectYear(demo, flat());

  it('every month equals the normal month: revenue $3,900, CM $2,475, profit $975', () => {
    for (const m of r.months) expect([m.revenue, m.contributionMargin, m.fixedCosts, m.operatingProfit]).toEqual([3900, 2475, 1500, 975]);
  });

  it('annual totals are 12 × the month: $46,800 revenue, $29,700 CM, $18,000 fixed, $11,700 profit', () => {
    expect(r.annual).toEqual({ totalUnits: 9000, revenue: 46800, variableCosts: 17100, contributionMargin: 29700, fixedCosts: 18000, operatingProfit: 11700 });
  });

  it('with every month equal, best and worst are the first month and none are below break-even', () => {
    expect(r.best.month).toBe('January');
    expect(r.worst.month).toBe('January');
    expect(r.monthsBelowBreakEven).toEqual([]);
  });
});

describe('12-month projection – with seasonality', () => {
  // Quiet Jan–Feb (60 %), busy July (130 %) and December (150 %), higher December fixed costs (seasonal staff).
  const pcts = [60, 60, 90, 100, 100, 110, 130, 110, 100, 100, 90, 150];
  const months: MonthInput[] = pcts.map((p, i) => ({ multiplierBasisPoints: p * 100, fixedCosts: i === 11 ? 2000 : 1500 }));
  const r = projectYear(demo, months);

  it('January at 60 %: 180/90/60/120 units → revenue $2,340, CM $1,485, profit −$15 (below break-even)', () => {
    const jan = r.months[0];
    expect(jan.units.map((u) => u.units)).toEqual([180, 90, 60, 120]);
    expect([jan.revenue, jan.contributionMargin, jan.operatingProfit]).toEqual([2340, 1485, -15]);
    expect(jan.belowBreakEven).toBe(true);
  });

  it('December at 150 % with $2,000 fixed: revenue $5,850, CM $3,712.50, profit $1,712.50', () => {
    const dec = r.months[11];
    expect([dec.revenue, dec.contributionMargin, dec.operatingProfit]).toEqual([5850, 3712.5, 1712.5]);
  });

  it('best month is July, not December: $3,217.50 − $1,500 = $1,717.50 beats December’s $1,712.50 (extra $500 fixed costs)', () => {
    const jul = r.months[6];
    expect([jul.contributionMargin, jul.operatingProfit]).toEqual([3217.5, 1717.5]);
    expect(r.best.month).toBe('July');
  });

  it('worst month is January (tied with February – the earlier one is shown); both are below break-even', () => {
    expect(r.worst.month).toBe('January');
    expect(r.monthsBelowBreakEven).toEqual(['January', 'February']);
  });

  it('annual totals equal the sum of the 12 months, for every figure', () => {
    const sum = (k: 'revenue' | 'variableCosts' | 'contributionMargin' | 'fixedCosts' | 'operatingProfit') => r.months.reduce((t, m) => t + toCents(m[k]), 0) / 100;
    expect(r.annual.revenue).toBe(sum('revenue'));
    expect(r.annual.variableCosts).toBe(sum('variableCosts'));
    expect(r.annual.contributionMargin).toBe(sum('contributionMargin'));
    expect(r.annual.fixedCosts).toBe(sum('fixedCosts'));
    expect(r.annual.operatingProfit).toBe(sum('operatingProfit'));
    expect(r.annual.totalUnits).toBe(r.months.reduce((t, m) => t + m.totalUnits, 0));
    // …and the profit identity holds for the year: CM − fixed costs.
    expect(toCents(r.annual.operatingProfit)).toBe(toCents(r.annual.contributionMargin) - toCents(r.annual.fixedCosts));
  });

  it('annual totals equal the sum of the months for many random seasonal patterns (no rounding drift)', () => {
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let trial = 0; trial < 200; trial++) {
      const ms: MonthInput[] = MONTHS.map(() => ({ multiplierBasisPoints: Math.floor(rand() * 30_000), fixedCosts: Math.floor(rand() * 300_000) / 100 }));
      const p = projectYear(
        [
          { id: 'a', name: 'A', price: Math.floor(rand() * 5000) / 100, variableCost: Math.floor(rand() * 3000) / 100, units: Math.floor(rand() * 500) },
          { id: 'b', name: 'B', price: 4.99, variableCost: 1.37, units: 155 },
        ],
        ms,
      );
      const total = p.months.reduce((t, m) => t + toCents(m.operatingProfit), 0);
      expect(toCents(p.annual.operatingProfit)).toBe(total);
      expect(JSON.stringify(p)).not.toMatch(/NaN|Infinity/);
    }
  });
});

describe('12-month projection – units and inputs', () => {
  it('rounds units DOWN to whole units', () => {
    expect(unitsForMonth(155, 11_000)).toBe(170); // 170.5 → 170
    expect(unitsForMonth(300, 10_000)).toBe(300);
    expect(unitsForMonth(300, 0)).toBe(0);
    expect(unitsForMonth(3, 3_333)).toBe(0); // 0.9999 → 0
  });

  it('a month with no sales loses exactly its fixed costs', () => {
    const r = projectYear(demo, flat(0));
    expect(r.months[0].operatingProfit).toBe(-1500);
    expect(r.monthsBelowBreakEven).toHaveLength(12);
  });

  it('validates the sales level – invalid input is never turned into 0', () => {
    expect(parseMultiplier('100')).toEqual({ ok: true, basisPoints: 10000, percent: 100 });
    expect(parseMultiplier('112.5%')).toEqual({ ok: true, basisPoints: 11250, percent: 112.5 });
    expect(parseMultiplier('0')).toMatchObject({ ok: true, basisPoints: 0 });
    expect(parseMultiplier('')).toMatchObject({ ok: false });
    expect(parseMultiplier('-10')).toMatchObject({ ok: false, error: expect.stringMatching(/can’t be negative/) });
    expect(parseMultiplier('abc')).toMatchObject({ ok: false });
    expect(parseMultiplier('1001')).toMatchObject({ ok: false, error: expect.stringMatching(/between 0 and 1000/) });
    expect(parseMultiplier('1.234')).toMatchObject({ ok: false });
  });

  it('needs exactly 12 months', () => {
    expect(() => projectYear(demo, flat().slice(0, 11))).toThrow();
  });
});
