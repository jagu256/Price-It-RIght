/**
 * 🛒 What should I buy? A purchase plan from the expected-sales inventory check.
 *
 *   Target quantity = required for expected sales × (1 + safety buffer %)   (rounded UP)
 *   To buy          = target − available   (never below 0)
 *   With a pack size, you buy whole packs: packs = to buy ÷ pack size, rounded UP.
 *   Purchase cost   = quantity bought × purchase cost per unit   (nearest cent)
 *
 * Quantities are whole thousandths of g / mL / piece. A missing purchase cost
 * is UNKNOWN (null), never $0. Buying inventory is a cash payment, not an
 * expense: its cost reaches profit through variable cost when products are sold.
 */
import { t } from '../i18n/i18n';
import type { Dimension } from './inventory';
import { UNITS, type UnitId } from './inventory';
import type { PlanCheck } from './planning';
import type { ParsedStockItem } from './stock';
import { cleanNumberText } from './validation';

export const MAX_BUFFER_PERCENT = 100;

export type BufferResult = { ok: true; basisPoints: number } | { ok: false; error: string };

/** Safety buffer: 0 to 100 %, up to 2 decimals, with or without a % sign. Blank is an error (never 0). */
export function parseBuffer(raw: string): BufferResult {
  const trimmed = raw.trim().replace(/%$/, '').trim();
  if (trimmed === '') return { ok: false, error: t('Please enter a safety buffer, for example 0 or 10.') };
  const cleaned = cleanNumberText(trimmed);
  if ('error' in cleaned) return { ok: false, error: cleaned.error };
  const text = cleaned.text;
  if (/^[-−–]/.test(text)) return { ok: false, error: t('The safety buffer can’t be negative.') };
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return { ok: false, error: t('Please enter the safety buffer as a number, for example 10.') };
  if ((text.split('.')[1] ?? '').length > 2) return { ok: false, error: t('Please use no more than 2 decimal places.') };
  const percent = Number(text);
  if (percent > MAX_BUFFER_PERCENT) return { ok: false, error: t('The safety buffer must be between 0 and {max} %.', { max: MAX_BUFFER_PERCENT }) };
  return { ok: true, basisPoints: Math.round(percent * 100) };
}

export interface PurchaseLine {
  itemId: string;
  name: string;
  dimension: Dimension;
  unit: UnitId;
  availableBase: number;
  requiredBase: number;
  targetBase: number;
  /** Quantity to buy (whole packs when a pack size is set). */
  buyBase: number;
  /** Number of packs, or null when no pack size was given. */
  packs: number | null;
  /** Purchase cost in dollars, or null when the item's purchase cost is unknown. */
  cost: number | null;
}

export interface PurchasePlan {
  /** Only items you need to buy (buyBase > 0). */
  lines: PurchaseLine[];
  /** Sum of the known costs. */
  knownCost: number;
  /** Names of items to buy whose purchase cost is unknown. */
  unknownCost: string[];
}

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b;

/** Cost of `base` thousandths of a base unit, rounded to the nearest cent. */
export function purchaseCostCents(item: ParsedStockItem, base: number): number | null {
  if (item.costPerBaseUnit === null) return null;
  const factor = UNITS[item.unit].factor;
  // Purchase cost per ONE of the item's own units, in millionths of a dollar (costs have ≤ 6 decimals).
  const micro = BigInt(Math.round(item.costPerBaseUnit * factor * 1_000_000));
  // units bought = base ÷ (factor × 1000); cents = units × micro ÷ 10,000
  const den = BigInt(factor) * 1000n * 10_000n;
  return Number((2n * BigInt(base) * micro + den) / (2n * den));
}

/**
 * @param check  the inventory check for expected sales (checkPlan on expected demand)
 * @param packBase  optional pack size per item id, in thousandths of the base unit (> 0)
 */
export function purchasePlan(check: PlanCheck, stock: ParsedStockItem[], bufferBasisPoints: number, packBase: Record<string, number | undefined> = {}): PurchasePlan {
  const byId = new Map(stock.map((s) => [s.id, s]));
  const lines: PurchaseLine[] = [];
  for (const i of check.items) {
    const item = byId.get(i.itemId);
    if (!item || i.requiredBase === 0) continue;
    const target = ceilDiv(BigInt(i.requiredBase) * BigInt(10_000 + bufferBasisPoints), 10_000n);
    const need = target - BigInt(i.availableBase);
    if (need <= 0n) continue;
    const pack = packBase[i.itemId];
    const packs = pack ? ceilDiv(need, BigInt(pack)) : null;
    const buyBase = Number(packs === null ? need : packs * BigInt(pack!));
    const cents = purchaseCostCents(item, buyBase);
    lines.push({
      itemId: i.itemId,
      name: i.name,
      dimension: i.dimension,
      unit: item.unit,
      availableBase: i.availableBase,
      requiredBase: i.requiredBase,
      targetBase: Number(target),
      buyBase,
      packs: packs === null ? null : Number(packs),
      cost: cents === null ? null : cents / 100,
    });
  }
  const knownCents = lines.reduce((s, l) => s + (l.cost === null ? 0 : Math.round(l.cost * 100)), 0);
  return { lines, knownCost: knownCents / 100, unknownCost: lines.filter((l) => l.cost === null).map((l) => l.name) };
}
