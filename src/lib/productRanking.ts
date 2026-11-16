/**
 * 🏅 Product ranking badges (a simple "menu engineering" view).
 *
 *   High margin  = CM per unit ≥ the business's weighted-average CM per unit (total CM ÷ total units)
 *   High volume  = expected units ≥ the average units per product (total units ÷ number of products)
 *
 *   ⭐ star        high margin, high volume
 *   🐴 popular     low margin,  high volume   (sells well – try to raise its margin)
 *   💎 gem         high margin, low volume    (earns well – try to sell more)
 *   ⚠ review      low margin,  low volume
 *   ❗ loss-maker  CM per unit below $0        (every sale lowers profit)
 *
 * Compared with whole-cent integers (no rounding), so ties go to "high".
 * It is a quick guide, not a verdict: it ignores shared inventory and demand.
 */
import { toCents, type ProductNumbers } from './business';

export type ProductRank = 'star' | 'popular' | 'gem' | 'review' | 'loss-maker';

export interface RankedProduct {
  id: string;
  name: string;
  rank: ProductRank;
  highMargin: boolean;
  highVolume: boolean;
}

/** null when there are no expected sales (no average to compare with). */
export function rankProducts(products: ProductNumbers[]): RankedProduct[] | null {
  const n = BigInt(products.length);
  const totalUnits = products.reduce((s, p) => s + BigInt(p.units), 0n);
  if (n === 0n || totalUnits === 0n) return null;
  const cm = (p: ProductNumbers) => BigInt(toCents(p.price) - toCents(p.variableCost));
  const totalCM = products.reduce((s, p) => s + cm(p) * BigInt(p.units), 0n);
  return products.map((p) => {
    const c = cm(p);
    // cm ≥ totalCM ÷ totalUnits  ⇔  cm × totalUnits ≥ totalCM   (no division, no rounding)
    const highMargin = c * totalUnits >= totalCM;
    // units ≥ totalUnits ÷ n  ⇔  units × n ≥ totalUnits
    const highVolume = BigInt(p.units) * n >= totalUnits;
    const rank: ProductRank = c < 0n ? 'loss-maker' : highMargin ? (highVolume ? 'star' : 'gem') : highVolume ? 'popular' : 'review';
    return { id: p.id, name: p.name, rank, highMargin, highVolume };
  });
}
