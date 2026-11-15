/**
 * 🏷️ Cost-plus pricing: a starting price from your cost, by markup or by margin.
 *
 *   Markup (on cost):    price = cost × (1 + markup %)      e.g. $2 + 50 % = $3.00
 *   Margin (on price):   price = cost ÷ (1 − margin %)      e.g. $2 at a 50 % margin = $4.00
 *   Markup → margin:     margin = markup ÷ (1 + markup)     50 % markup = 33.3 % margin
 *   Margin → markup:     markup = margin ÷ (1 − margin)     50 % margin = 100 % markup
 *
 * The price is rounded UP to the next cent, so the markup/margin you asked for
 * is always reached (the actual one is shown). The cost used is the variable
 * cost per unit, so the margin here is the contribution margin ratio: fixed
 * costs still have to be covered by total contribution margin.
 */
import { t } from '../i18n/i18n';
import { toCents } from './business';
import { cleanNumberText } from './validation';

export type PricingMethod = 'markup' | 'margin';

export const MAX_MARKUP_PERCENT = 1000;

export type RateResult = { ok: true; basisPoints: number } | { ok: false; error: string };

/** Markup 0–1,000 %; margin 0 to less than 100 %. Up to 2 decimals; blank is an error (never 0). */
export function parseRate(raw: string, method: PricingMethod): RateResult {
  const trimmed = raw.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { ok: false, error: method === 'markup' ? t('Please enter a markup %, for example 50.') : t('Please enter a margin %, for example 40.') };
  const cleaned = cleanNumberText(trimmed);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;
  if (/^[-−–]/.test(text)) return { ok: false, error: t('The percentage can’t be negative.') };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, error: t('Please enter the percentage as a number, for example 40.') };
  if ((text.split('.')[1] ?? '').length > 2) return { ok: false, error: t('Please use no more than 2 decimal places.') };
  const percent = Number(text);
  if (method === 'margin' && percent >= 100) return { ok: false, error: t('A margin must be less than 100 % – the price would have to be infinite.') };
  if (method === 'markup' && percent > MAX_MARKUP_PERCENT) return { ok: false, error: t('The markup must be between 0 and {max} %.', { max: MAX_MARKUP_PERCENT }) };
  return { ok: true, basisPoints: Math.round(percent * 100) };
}

export interface CostPlusResult {
  /** Price per unit, rounded up to the cent. */
  price: number;
  /** Price − cost. */
  cmPerUnit: number;
  /** Actual markup on cost (%), or null when the cost is $0. */
  markupPercent: number | null;
  /** Actual margin on price (%), or null when the price is $0. */
  marginPercent: number | null;
  /** The other measure for the rate you entered: margin for a markup, markup for a margin (%). */
  equivalentPercent: number;
}

export function costPlusPrice(cost: number, method: PricingMethod, basisPoints: number): CostPlusResult {
  const costC = BigInt(toCents(cost));
  const priceC =
    method === 'markup'
      ? (costC * BigInt(10_000 + basisPoints) + 9_999n) / 10_000n // ceil
      : (costC * 10_000n + BigInt(10_000 - basisPoints) - 1n) / BigInt(10_000 - basisPoints); // ceil
  const p = Number(priceC);
  const c = Number(costC);
  const r = basisPoints / 10_000;
  return {
    price: p / 100,
    cmPerUnit: (p - c) / 100,
    markupPercent: c === 0 ? null : ((p - c) / c) * 100,
    marginPercent: p === 0 ? null : ((p - c) / p) * 100,
    equivalentPercent: (method === 'markup' ? r / (1 + r) : r / (1 - r)) * 100,
  };
}
