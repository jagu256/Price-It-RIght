/**
 * 🎮 Business Challenge Mode – fictional practice scenarios, kept completely
 * separate from the user's own business. Success is only awarded for valid
 * inputs within the allowed ranges and (for Expert) feasible production plans.
 */
import { calculate } from './accounting';
import { businessSummary, toCents } from './business';
import { toBase } from './inventory';

export type Level = 'beginner' | 'intermediate' | 'expert';

export interface RangeInput {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  start: number;
  prefix?: string;
  suffix?: string;
  help: string;
}

export interface ChallengeOutcome {
  valid: boolean;
  errors: string[];
  profit: number | null;
  success: boolean;
  /** Short facts shown under "Updated results". */
  facts: { label: string; value: number; kind: 'money' | 'units' }[];
}

export interface Challenge {
  level: Level;
  title: string;
  business: string;
  background: string;
  objective: string;
  successCondition: string;
  inputs: RangeInput[];
  evaluate: (values: Record<string, number>) => ChallengeOutcome;
}

function rangeErrors(inputs: RangeInput[], values: Record<string, number>): string[] {
  const errors: string[] = [];
  for (const i of inputs) {
    const v = values[i.key];
    if (v === undefined || !Number.isFinite(v)) errors.push(`${i.label}: please enter a number.`);
    else if (v < i.min || v > i.max) errors.push(`${i.label} must be between ${i.prefix ?? ''}${i.min}${i.suffix ?? ''} and ${i.prefix ?? ''}${i.max}${i.suffix ?? ''}.`);
  }
  return errors;
}

/* Beginner ----------------------------------------------------------- */
const beginnerInputs: RangeInput[] = [
  { key: 'price', label: 'Selling price per coffee', min: 3, max: 8, step: 0.05, start: 4.5, prefix: '$', help: 'You can charge between $3 and $8.' },
  { key: 'variableCost', label: 'Variable cost per coffee', min: 2, max: 2.5, step: 0.05, start: 2.5, prefix: '$', help: 'A new supplier could cut costs by up to $0.50.' },
  { key: 'units', label: 'Coffees sold per month', min: 300, max: 450, step: 1, start: 400, help: 'Marketing could bring up to 50 more customers.' },
];

/* Intermediate ------------------------------------------------------- */
/** Fictional demand rule: every $1 above $5 loses 20 customers (and every $1 below gains 20). */
export const intermediateDemand = (price: number) => Math.max(0, Math.floor(400 - 20 * price + 1e-9));

const intermediateInputs: RangeInput[] = [
  { key: 'price', label: 'Selling price per coffee', min: 3, max: 12, step: 0.05, start: 5, prefix: '$', help: 'Customers react to price: every $1 above $5 loses 20 customers per month.' },
  { key: 'variableCost', label: 'Variable cost per coffee', min: 1.8, max: 2, step: 0.05, start: 2, prefix: '$', help: 'Switching to a bulk supplier could save up to $0.20 per coffee.' },
];

/* Expert ------------------------------------------------------------- */
export const EXPERT = {
  fixedCosts: 550,
  products: [
    { key: 'muffin', name: 'Muffin', price: 4, variableCost: 1.5, demand: 150, flour: 100, butter: 20, start: 50 },
    { key: 'croissant', name: 'Croissant', price: 5, variableCost: 2, demand: 120, flour: 80, butter: 40, start: 60 },
    { key: 'cookie', name: 'Cookie', price: 3, variableCost: 1, demand: 200, flour: 50, butter: 10, start: 40 },
  ],
  flourAvailable: 20_000, // grams
  butterAvailable: 4_000, // grams
};

const expertInputs: RangeInput[] = EXPERT.products.map((p) => ({
  key: p.key,
  label: `${p.name}s to bake`,
  min: 0,
  max: p.demand,
  step: 1,
  start: p.start,
  help: `Demand: up to ${p.demand}. Uses ${p.flour} g flour and ${p.butter} g butter each. CM $${(p.price - p.variableCost).toFixed(2)} each.`,
}));

export const CHALLENGES: Challenge[] = [
  {
    level: 'beginner',
    title: 'Stop the Losses',
    business: 'Bean There Coffee (fictional)',
    background: 'Bean There sells 400 coffees a month at $4.50. Each coffee costs $2.50 to make and fixed costs are $1,000 a month.',
    objective: 'Change price, costs or sales to reach break-even.',
    successCondition: 'Monthly operating profit of $0 or more, using values within the allowed ranges.',
    inputs: beginnerInputs,
    evaluate: (v) => {
      const errors = rangeErrors(beginnerInputs, v);
      if (!Number.isInteger(v.units)) errors.push('Coffees sold must be a whole number.');
      if (errors.length) return { valid: false, errors, profit: null, success: false, facts: [] };
      const r = calculate({ sellingPrice: v.price, variableCost: v.variableCost, fixedCosts: 1000, units: v.units });
      return {
        valid: true,
        errors: [],
        profit: r.operatingProfit,
        success: toCents(r.operatingProfit) >= 0,
        facts: [
          { label: 'Revenue', value: r.revenue, kind: 'money' },
          { label: 'Total costs', value: r.totalCosts, kind: 'money' },
        ],
      };
    },
  },
  {
    level: 'intermediate',
    title: 'Hit the Profit Target',
    business: 'Daily Grind Café (fictional)',
    background: 'Daily Grind sells 300 coffees a month at $5. Each costs $2 and fixed costs are $1,300, so the café is losing $400 per month. Customers are price-sensitive.',
    objective: 'Your coffee shop is losing $400 per month. Can you reach a monthly operating profit of $200?',
    successCondition: 'Monthly operating profit of at least $200. Sales follow the demand rule, so a higher price means fewer customers.',
    inputs: intermediateInputs,
    evaluate: (v) => {
      const errors = rangeErrors(intermediateInputs, v);
      if (errors.length) return { valid: false, errors, profit: null, success: false, facts: [] };
      const units = intermediateDemand(v.price);
      const r = calculate({ sellingPrice: v.price, variableCost: v.variableCost, fixedCosts: 1300, units });
      return {
        valid: true,
        errors: [],
        profit: r.operatingProfit,
        success: toCents(r.operatingProfit) >= 20_000,
        facts: [
          { label: 'Customers (from demand rule)', value: units, kind: 'units' },
          { label: 'Revenue', value: r.revenue, kind: 'money' },
        ],
      };
    },
  },
  {
    level: 'expert',
    title: 'Bake Within Your Limits',
    business: 'Maple & Moss Bakery (fictional)',
    background: `The bakery has only ${EXPERT.flourAvailable / 1000} kg of flour and ${EXPERT.butterAvailable / 1000} kg of butter this month, and fixed costs of $${EXPERT.fixedCosts}. The current plan is losing money.`,
    objective: 'Choose how many of each product to bake so the plan fits your inventory and at least breaks even.',
    successCondition: 'Uses no more flour or butter than available, bakes no more than demand, and earns an operating profit of $0 or more.',
    inputs: expertInputs,
    evaluate: (v) => {
      const errors = rangeErrors(expertInputs, v);
      for (const i of expertInputs) if (Number.isFinite(v[i.key]) && !Number.isInteger(v[i.key])) errors.push(`${i.label} must be a whole number.`);
      if (errors.length) return { valid: false, errors, profit: null, success: false, facts: [] };
      const flour = EXPERT.products.reduce((s, p) => s + v[p.key] * toBase(p.flour, 'g'), 0);
      const butter = EXPERT.products.reduce((s, p) => s + v[p.key] * toBase(p.butter, 'g'), 0);
      const flourOk = flour <= toBase(EXPERT.flourAvailable, 'g');
      const butterOk = butter <= toBase(EXPERT.butterAvailable, 'g');
      const s = businessSummary(
        EXPERT.products.map((p) => ({ id: p.key, name: p.name, price: p.price, variableCost: p.variableCost, units: v[p.key] })),
        EXPERT.fixedCosts,
      );
      const feasibilityErrors = [
        ...(flourOk ? [] : [`Not enough flour: this plan needs ${flour / 1000} g but only ${EXPERT.flourAvailable} g is available.`]),
        ...(butterOk ? [] : [`Not enough butter: this plan needs ${butter / 1000} g but only ${EXPERT.butterAvailable} g is available.`]),
      ];
      return {
        valid: feasibilityErrors.length === 0,
        errors: feasibilityErrors,
        profit: s.operatingProfit,
        // An infeasible plan never counts as success.
        success: feasibilityErrors.length === 0 && toCents(s.operatingProfit) >= 0,
        facts: [
          { label: 'Flour used (g)', value: flour / 1000, kind: 'units' },
          { label: 'Butter used (g)', value: butter / 1000, kind: 'units' },
          { label: 'Total contribution margin', value: s.totalCM, kind: 'money' },
        ],
      };
    },
  },
];

export const startValues = (c: Challenge) => Object.fromEntries(c.inputs.map((i) => [i.key, i.start]));
