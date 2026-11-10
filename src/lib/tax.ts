/**
 * After-tax target profit – a SIMPLIFIED estimate, not tax advice.
 *
 * Operating profit is treated as the taxable amount and one flat rate, entered
 * by the user, is applied. Interest, deductions, losses carried forward,
 * instalments and sales taxes (GST/HST/PST) are ignored.
 *
 *   Required pre-tax profit = target after-tax profit ÷ (1 − tax rate)
 *   Estimated tax           = operating profit × tax rate   (never on a loss)
 *   After-tax profit        = operating profit − estimated tax
 *
 * The rate is stored in basis points (20 % = 2,000) so all arithmetic stays in
 * whole numbers of cents.
 */
import { toCents } from './business';
import { cleanNumberText } from './validation';

export type TaxRateResult = { ok: true; basisPoints: number; percent: number } | { ok: false; error: string };

/** Accepts 0–100, up to 2 decimals, with or without a % sign: "20", "12.5%", "0". */
export function parseTaxRate(raw: string): TaxRateResult {
  const trimmed = raw.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { ok: false, error: 'Please enter your income tax rate (0 to 100 %).' };
  const cleaned = cleanNumberText(trimmed);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;
  if (/^[-−–]/.test(text)) return { ok: false, error: 'The tax rate can’t be negative. Please enter 0 to 100 %.' };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, error: 'Please enter the tax rate as a number, for example 20 or 12.5.' };
  const decimals = text.includes('.') ? text.split('.')[1].length : 0;
  if (decimals > 2) return { ok: false, error: 'Please use no more than 2 decimal places for the tax rate.' };
  const percent = Number(text);
  if (percent > 100) return { ok: false, error: 'The tax rate must be between 0 and 100 %.' };
  return { ok: true, basisPoints: Math.round(percent * 100), percent };
}

/** a × b ÷ c rounded to the nearest whole number (halves away from zero); c > 0. */
function mulDivRound(a: number, b: number, c: number): number {
  const n = a * b;
  const sign = n < 0 ? -1 : 1;
  const abs = Math.abs(n);
  const q = Math.floor(abs / c);
  return sign * (2 * (abs - q * c) >= c ? q + 1 : q);
}

export type PreTaxResult =
  | {
      status: 'ok';
      /** Required pre-tax operating profit, rounded UP to the next cent. */
      preTax: number;
      /** The unrounded formula result. */
      exact: number;
      /** Estimated tax at that pre-tax profit. */
      tax: number;
      /** What is left after tax – always at least the target. */
      afterTax: number;
      /** True when the target is $0 or a loss, so no tax applies. */
      noTax: boolean;
    }
  | { status: 'not-available'; reason: string };

export function requiredPreTaxProfit(afterTaxTarget: number, basisPoints: number): PreTaxResult {
  const targetC = toCents(afterTaxTarget);
  if (targetC <= 0) {
    // There is no tax on a loss (or on $0), so the pre-tax target is the same.
    return { status: 'ok', preTax: targetC / 100, exact: targetC / 100, tax: 0, afterTax: targetC / 100, noTax: true };
  }
  if (basisPoints >= 10_000) {
    return { status: 'not-available', reason: 'At a 100 % tax rate every dollar of profit goes to tax, so no pre-tax profit can leave a positive amount after tax.' };
  }
  const keep = 10_000 - basisPoints; // share kept after tax, in basis points
  // Round UP so the after-tax target is met, not just missed.
  const preTaxC = Math.ceil((targetC * 10_000) / keep);
  const exactC = (targetC * 10_000) / keep;
  const taxC = mulDivRound(preTaxC, basisPoints, 10_000);
  return { status: 'ok', preTax: preTaxC / 100, exact: exactC / 100, tax: taxC / 100, afterTax: (preTaxC - taxC) / 100, noTax: false };
}

export interface TaxEstimate {
  operatingProfit: number;
  tax: number;
  afterTax: number;
  /** True when operating profit is $0 or a loss – no tax is charged. */
  noTax: boolean;
}

/** Estimated tax on an operating profit. No tax on a loss. */
export function estimateTax(operatingProfit: number, basisPoints: number): TaxEstimate {
  const profitC = toCents(operatingProfit);
  if (profitC <= 0) return { operatingProfit: profitC / 100, tax: 0, afterTax: profitC / 100, noTax: true };
  const taxC = mulDivRound(profitC, basisPoints, 10_000);
  return { operatingProfit: profitC / 100, tax: taxC / 100, afterTax: (profitC - taxC) / 100, noTax: false };
}

/** "20%", "12.5%" */
export function formatRate(percent: number): string {
  return `${percent.toLocaleString('en-CA', { maximumFractionDigits: 2 })}%`;
}
