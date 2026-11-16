import { describe, expect, it } from 'vitest';
import { cashBudget, parseCollectedPercent, type CashMonthInput } from './cashBudget';

const demo = [
  { id: 'c', name: 'Coffee', price: 6, variableCost: 2, units: 300 },
  { id: 'm', name: 'Muffin', price: 4, variableCost: 1.5, units: 150 },
  { id: 's', name: 'Sandwich', price: 9, variableCost: 4, units: 100 },
  { id: 'k', name: 'Cookie', price: 3, variableCost: 1, units: 200 },
];
const normal = (): CashMonthInput[] => [0, 1, 2].map(() => ({ levelBasisPoints: 10_000, extraPurchases: 0, otherPayments: 0 }));

describe('3-month cash budget – demo café, worked by hand (sales $3,900, VC $1,425, fixed $1,500)', () => {
  it('all sales paid at once, $500 opening cash → +$975 each month: $1,475, $2,450, $3,425 (cash = profit here)', () => {
    const r = cashBudget(demo, 1500, { openingCash: 500, openingReceivables: 0, collectedNowBasisPoints: 10_000, months: normal() });
    expect(r.months.map((m) => [m.cashFromSales, m.cashPaid, m.netCashFlow, m.closingCash, m.operatingProfit])).toEqual([
      [3900, 2925, 975, 1475, 975],
      [3900, 2925, 975, 2450, 975],
      [3900, 2925, 975, 3425, 975],
    ]);
    expect(r.shortfallMonths).toEqual([]);
    expect(r.closingReceivables).toBe(0);
  });

  it('only 60 % paid in the same month: month 1 brings in $2,340 → −$585 → cash −$85 (a shortfall although profit is $975); then $890, $1,865', () => {
    const r = cashBudget(demo, 1500, { openingCash: 500, openingReceivables: 0, collectedNowBasisPoints: 6000, months: normal() });
    expect(r.months.map((m) => [m.cashFromSales, m.netCashFlow, m.closingCash])).toEqual([
      [2340, -585, -85],
      [3900, 975, 890],
      [3900, 975, 1865],
    ]);
    expect(r.shortfallMonths).toEqual([1]);
    expect(r.lowestClosingCash).toBe(-85);
    expect(r.closingReceivables).toBe(1560); // 40 % of month 3 still to collect
    expect(r.totalOperatingProfit).toBe(2925);
    expect(r.totalNetCashFlow).toBe(1365); // 2,925 − 1,560 still owed
  });

  it('buying $500 of extra stock and repaying $200 of a loan use cash but are not expenses (profit stays $975)', () => {
    const months = normal();
    months[0] = { levelBasisPoints: 10_000, extraPurchases: 500, otherPayments: 200 };
    const r = cashBudget(demo, 1500, { openingCash: 500, openingReceivables: 0, collectedNowBasisPoints: 10_000, months });
    expect([r.months[0].cashPaid, r.months[0].closingCash, r.months[0].operatingProfit]).toEqual([3625, 775, 975]);
  });

  it('money still owed from before month 1 is collected in month 1; a quiet month (60 %) has lower sales and costs', () => {
    const months = normal();
    months[1] = { levelBasisPoints: 6000, extraPurchases: 0, otherPayments: 0 };
    const r = cashBudget(demo, 1500, { openingCash: 0, openingReceivables: 1000, collectedNowBasisPoints: 10_000, months });
    expect(r.months[0].cashFromSales).toBe(4900);
    expect([r.months[1].sales, r.months[1].variableCosts, r.months[1].operatingProfit]).toEqual([2340, 855, -15]);
  });

  it('rounds the collected share to the nearest cent and still adds up (no cent lost)', () => {
    const one = [{ id: 'x', name: 'X', price: 0.01, variableCost: 0, units: 1 }];
    const r = cashBudget(one, 0, { openingCash: 0, openingReceivables: 0, collectedNowBasisPoints: 5000, months: normal() });
    // 1 cent × 50 % = 0.5 → 1 cent now, 0 later
    expect(r.months[0].cashFromSales).toBe(0.01);
    expect(r.months[2].closingCash + r.closingReceivables).toBe(0.03);
  });
});

describe('% collected input', () => {
  it('accepts 0–100 with up to 2 decimals; rejects blank, negative, letters, too many decimals and over 100', () => {
    expect(parseCollectedPercent('60')).toEqual({ ok: true, basisPoints: 6000 });
    expect(parseCollectedPercent('100 %')).toEqual({ ok: true, basisPoints: 10_000 });
    for (const bad of ['', '-1', 'abc', '1.234', '101']) expect(parseCollectedPercent(bad).ok).toBe(false);
  });
});
