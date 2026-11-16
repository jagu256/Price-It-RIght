/**
 * 💵 3-month cash budget: profit is not cash.
 *
 *   Sales in a month       = expected units × sales level (rounded down), same mix and prices
 *   Cash from sales        = this month’s sales × % collected now
 *                            + last month’s sales not collected then (month 1: amount still to collect at the start)
 *   Cash paid              = variable costs of the month + fixed costs + extra stock bought + other cash payments
 *   Closing cash           = opening cash + cash from sales − cash paid
 *
 * Operating profit is shown beside it: extra stock bought and other payments
 * (e.g. paying back a loan) use cash but are not expenses, and sales on credit
 * are revenue before they are cash. Whole cents; only "% collected" needs rounding (nearest cent).
 */
import { t } from '../i18n/i18n';
import { businessSummary, toCents, type ProductNumbers } from './business';
import { unitsForMonth } from './projection';
import { cleanNumberText } from './validation';

export const CASH_MONTHS = 3;

export interface CashMonthInput {
  /** Sales level in basis points (100 % = 10,000). */
  levelBasisPoints: number;
  extraPurchases: number;
  otherPayments: number;
}

export interface CashBudgetInput {
  openingCash: number;
  /** Sales from before month 1 that customers still have to pay. */
  openingReceivables: number;
  /** Share of a month’s sales collected in the same month, in basis points; the rest is collected next month. */
  collectedNowBasisPoints: number;
  months: CashMonthInput[];
}

export interface CashMonth {
  month: number;
  sales: number;
  cashFromSales: number;
  variableCosts: number;
  fixedCosts: number;
  extraPurchases: number;
  otherPayments: number;
  cashPaid: number;
  netCashFlow: number;
  openingCash: number;
  closingCash: number;
  operatingProfit: number;
}

export interface CashBudgetResult {
  months: CashMonth[];
  /** Months whose closing cash is below $0. */
  shortfallMonths: number[];
  lowestClosingCash: number;
  /** Sales of the last month still to be collected after month 3. */
  closingReceivables: number;
  totalOperatingProfit: number;
  totalNetCashFlow: number;
}

/** Nearest cent of amount × bp ÷ 10,000 (halves round up; amounts here are ≥ 0). */
const share = (cents: number, bp: number) => Number((BigInt(cents) * BigInt(bp) * 2n + 10_000n) / 20_000n);

export function cashBudget(products: ProductNumbers[], fixedCosts: number, input: CashBudgetInput): CashBudgetResult {
  let opening = toCents(input.openingCash);
  let owedFromLastMonth = toCents(input.openingReceivables);
  const fixedC = toCents(fixedCosts);
  const months: CashMonth[] = input.months.map((m, i) => {
    const s = businessSummary(products.map((p) => ({ ...p, units: unitsForMonth(p.units, m.levelBasisPoints) })), fixedCosts);
    const salesC = toCents(s.totalRevenue);
    const nowC = share(salesC, input.collectedNowBasisPoints);
    const inC = nowC + owedFromLastMonth;
    owedFromLastMonth = salesC - nowC;
    const vcC = toCents(s.totalVariableCosts);
    const extraC = toCents(m.extraPurchases);
    const otherC = toCents(m.otherPayments);
    const outC = vcC + fixedC + extraC + otherC;
    const closing = opening + inC - outC;
    const row: CashMonth = {
      month: i + 1,
      sales: salesC / 100,
      cashFromSales: inC / 100,
      variableCosts: vcC / 100,
      fixedCosts: fixedC / 100,
      extraPurchases: extraC / 100,
      otherPayments: otherC / 100,
      cashPaid: outC / 100,
      netCashFlow: (inC - outC) / 100,
      openingCash: opening / 100,
      closingCash: closing / 100,
      operatingProfit: s.operatingProfit,
    };
    opening = closing;
    return row;
  });
  return {
    months,
    shortfallMonths: months.filter((m) => m.closingCash < 0).map((m) => m.month),
    lowestClosingCash: Math.min(...months.map((m) => m.closingCash)),
    closingReceivables: owedFromLastMonth / 100,
    totalOperatingProfit: months.reduce((s, m) => s + toCents(m.operatingProfit), 0) / 100,
    totalNetCashFlow: months.reduce((s, m) => s + toCents(m.netCashFlow), 0) / 100,
  };
}

/** "% of sales collected in the same month": 0–100 %, up to 2 decimals. Blank is an error (never 0). */
export function parseCollectedPercent(raw: string): { ok: true; basisPoints: number } | { ok: false; error: string } {
  const trimmed = raw.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { ok: false, error: t('Please enter the % of sales collected in the same month, for example 100.') };
  const c = cleanNumberText(trimmed);
  if ('error' in c) return { ok: false, error: c.error };
  if (/^[-−–]/.test(c.text)) return { ok: false, error: t('The percentage can’t be negative.') };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(c.text)) return { ok: false, error: t('Please enter the percentage as a number, for example 40.') };
  if ((c.text.split('.')[1] ?? '').length > 2) return { ok: false, error: t('Please use no more than 2 decimal places.') };
  const pct = Number(c.text);
  if (pct > 100) return { ok: false, error: t('The % collected must be between 0 and 100.') };
  return { ok: true, basisPoints: Math.round(pct * 100) };
}
