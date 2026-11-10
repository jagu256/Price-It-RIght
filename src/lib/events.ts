/**
 * 🎲 Surprise business events – fictional, hypothetical scenarios (not forecasts).
 * Each event is a pure transformation of the business data, so its preview and
 * the "accept" step use exactly the same numbers.
 */
import { t, tx } from '../i18n/i18n';
import { formatCAD, formatPercent } from './format';
import { parseQuantity } from './inventory';
import { parseCost } from './stock';
import type { BusinessData } from './types';
import { parseMoney, parseUnits } from './validation';

export type EventId = 'supplier-increase' | 'rent-increase' | 'demand-up' | 'demand-down' | 'inventory-shortage';

export interface EventSpec {
  id: EventId;
  emoji: string;
  title: string;
  /** Default size of the change. */
  defaultAmount: number;
  /** '%' or '$' – how `amount` is interpreted. */
  kind: '%' | '$';
  describe: (amount: number, itemName?: string) => string;
  responses: string[];
}

export const EVENTS: EventSpec[] = [
  {
    id: 'supplier-increase',
    emoji: '🚚',
    title: tx('Supplier Price Increase'),
    defaultAmount: 15,
    kind: '%',
    describe: (a) => t('Your suppliers raise prices: variable costs increase by {pct}.', { pct: formatPercent(a) }),
    responses: [tx('Compare prices from other suppliers.'), tx('Test a small price increase in the What-If Simulator.'), tx('Look for ways to use less of the most expensive ingredients.')],
  },
  {
    id: 'rent-increase',
    emoji: '🏢',
    title: tx('Rent Increase'),
    defaultAmount: 300,
    kind: '$',
    describe: (a) => t('Your landlord raises the rent: monthly fixed costs increase by {amount}.', { amount: formatCAD(a) }),
    responses: [tx('Check how many more units you need to break even.'), tx('Review other fixed costs you could reduce.'), tx('Use the Profit Goal Tracker to plan extra sales.')],
  },
  {
    id: 'demand-up',
    emoji: '📈',
    title: tx('Higher Customer Demand'),
    defaultAmount: 20,
    kind: '%',
    describe: (a) => t('A local article brings new customers: expected sales increase by {pct}.', { pct: formatPercent(a) }),
    responses: [tx('Check the Smart Inventory Hub – do you have enough stock?'), tx('Use the Production Planner to see which products to prioritise.')],
  },
  {
    id: 'demand-down',
    emoji: '📉',
    title: tx('Lower Customer Demand'),
    defaultAmount: 20,
    kind: '%',
    describe: (a) => t('A new competitor opens nearby: expected sales decrease by {pct}.', { pct: formatPercent(a) }),
    responses: [tx('Check your margin of safety on the Profit Dashboard.'), tx('Consider promotions for your highest-margin products.')],
  },
  {
    id: 'inventory-shortage',
    emoji: '📦',
    title: tx('Inventory Shortage'),
    defaultAmount: 25,
    kind: '%',
    describe: (a, item) => t('A delivery goes missing: available {item} decreases by {pct}.', { item: item ?? t('inventory'), pct: formatPercent(a) }),
    responses: [tx('See which products are affected in the Production Planner.'), tx('Prioritise products that make the best use of the scarce item.')],
  },
];

const money = (cents: number) => (Math.round(cents) / 100).toFixed(2).replace(/\.00$/, '');
const trim = (n: number, d: number) => String(Number(n.toFixed(d)));

/** Applies an event. Values that can't be parsed are left exactly as they are. */
export function applyEvent(data: BusinessData, id: EventId, amount: number, itemId?: string): BusinessData {
  const factor = (sign: 1 | -1) => 1 + (sign * amount) / 100;
  switch (id) {
    case 'supplier-increase': {
      const f = factor(1);
      const products = data.products.map((p) => {
        const next = { ...p, otherCosts: { ...p.otherCosts } };
        const vc = parseMoney(p.variableCost, 'variableCost');
        if (vc.ok) next.variableCost = money(vc.value * 100 * f);
        for (const k of Object.keys(next.otherCosts) as (keyof typeof next.otherCosts)[]) {
          const c = parseMoney(next.otherCosts[k], 'variableCost');
          if (c.ok && next.otherCosts[k].trim() !== '') next.otherCosts[k] = money(c.value * 100 * f);
        }
        return next;
      });
      // Itemized products get their higher cost through inventory purchase costs.
      const inventory = data.inventory.map((r) => {
        const c = parseCost(r.cost);
        return c.ok && c.value !== null ? { ...r, cost: trim(c.value * f, 6) } : r;
      });
      return { ...data, products, inventory };
    }
    case 'rent-increase': {
      const fc = parseMoney(data.fixedCosts, 'fixedCosts');
      return fc.ok ? { ...data, fixedCosts: money((fc.value + amount) * 100) } : data;
    }
    case 'demand-up':
    case 'demand-down': {
      const f = factor(id === 'demand-up' ? 1 : -1);
      return {
        ...data,
        products: data.products.map((p) => {
          const u = parseUnits(p.units);
          return u.ok ? { ...p, units: String(Math.max(0, Math.round(u.value * f))) } : p;
        }),
      };
    }
    case 'inventory-shortage': {
      const f = factor(-1);
      return {
        ...data,
        inventory: data.inventory.map((r) => {
          if (r.id !== itemId) return r;
          const q = parseQuantity(r.quantity, 'available');
          return q.ok ? { ...r, quantity: trim(Math.max(0, q.value * f), 3) } : r;
        }),
      };
    }
  }
}

/** Picks an event at random. `rand` is injectable so tests are repeatable. */
export function pickEvent(data: BusinessData, rand: () => number = Math.random): { event: EventSpec; itemId?: string } {
  const pool = EVENTS.filter((e) => e.id !== 'inventory-shortage' || data.inventory.length > 0);
  const event = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  if (event.id !== 'inventory-shortage') return { event };
  const item = data.inventory[Math.min(data.inventory.length - 1, Math.floor(rand() * data.inventory.length))];
  return { event, itemId: item.id };
}
