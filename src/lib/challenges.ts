/**
 * 🎮 Business Challenge Mode – fictional practice scenarios, kept completely
 * separate from the user's own business. Success is only awarded for valid
 * inputs within the allowed ranges and (for Expert) feasible production plans.
 */
import { t } from '../i18n/i18n';
import { calculate } from './accounting';
import { businessSummary, toCents } from './business';
import { formatCAD, formatNumber } from './format';
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
    const show = (x: number) => (i.prefix === '$' ? formatCAD(x) : `${formatNumber(x)}${i.suffix ?? ''}`);
    if (v === undefined || !Number.isFinite(v)) errors.push(t('{label}: please enter a number.', { label: i.label }));
    else if (v < i.min || v > i.max) errors.push(t('{label} must be between {min} and {max}.', { label: i.label, min: show(i.min), max: show(i.max) }));
  }
  return errors;
}

/* Beginner ----------------------------------------------------------- */
const beginnerInputs: RangeInput[] = [
  { key: 'price', get label() { return t('Selling price per coffee'); }, min: 3, max: 8, step: 0.05, start: 4.5, prefix: '$', get help() { return t('You can charge between $3 and $8.'); } },
  { key: 'variableCost', get label() { return t('Variable cost per coffee'); }, min: 2, max: 2.5, step: 0.05, start: 2.5, prefix: '$', get help() { return t('A new supplier could cut costs by up to $0.50.'); } },
  { key: 'units', get label() { return t('Coffees sold per month'); }, min: 300, max: 450, step: 1, start: 400, get help() { return t('Marketing could bring up to 50 more customers.'); } },
];

/* Intermediate ------------------------------------------------------- */
/** Fictional demand rule: every $1 above $5 loses 20 customers (and every $1 below gains 20). */
export const intermediateDemand = (price: number) => Math.max(0, Math.floor(400 - 20 * price + 1e-9));

const intermediateInputs: RangeInput[] = [
  { key: 'price', get label() { return t('Selling price per coffee'); }, min: 3, max: 12, step: 0.05, start: 5, prefix: '$', get help() { return t('Customers react to price: every $1 above $5 loses 20 customers per month.'); } },
  { key: 'variableCost', get label() { return t('Variable cost per coffee'); }, min: 1.8, max: 2, step: 0.05, start: 2, prefix: '$', get help() { return t('Switching to a bulk supplier could save up to $0.20 per coffee.'); } },
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
  get label() {
    return t('{name}s to bake', { name: t(p.name) });
  },
  min: 0,
  max: p.demand,
  step: 1,
  start: p.start,
  get help() {
    return t('Demand: up to {demand}. Uses {flour} g flour and {butter} g butter each. CM {cm} each.', {
      demand: formatNumber(p.demand),
      flour: formatNumber(p.flour),
      butter: formatNumber(p.butter),
      cm: formatCAD(Math.round((p.price - p.variableCost) * 100) / 100),
    });
  },
}));

export const CHALLENGES: Challenge[] = [
  {
    level: 'beginner',
    get title() { return t('Stop the Losses'); },
    get business() { return t('Bean There Coffee (fictional)'); },
    get background() { return t('Bean There sells 400 coffees a month at $4.50. Each coffee costs $2.50 to make and fixed costs are $1,000 a month.'); },
    get objective() { return t('Change price, costs or sales to reach break-even.'); },
    get successCondition() { return t('Monthly operating profit of $0 or more, using values within the allowed ranges.'); },
    inputs: beginnerInputs,
    evaluate: (v) => {
      const errors = rangeErrors(beginnerInputs, v);
      if (!Number.isInteger(v.units)) errors.push(t('Coffees sold must be a whole number.'));
      if (errors.length) return { valid: false, errors, profit: null, success: false, facts: [] };
      const r = calculate({ sellingPrice: v.price, variableCost: v.variableCost, fixedCosts: 1000, units: v.units });
      return {
        valid: true,
        errors: [],
        profit: r.operatingProfit,
        success: toCents(r.operatingProfit) >= 0,
        facts: [
          { get label() { return t('Revenue'); }, value: r.revenue, kind: 'money' },
          { get label() { return t('Total costs'); }, value: r.totalCosts, kind: 'money' },
        ],
      };
    },
  },
  {
    level: 'intermediate',
    get title() { return t('Hit the Profit Target'); },
    get business() { return t('Daily Grind Café (fictional)'); },
    get background() { return t('Daily Grind sells 300 coffees a month at $5. Each costs $2 and fixed costs are $1,300, so the café is losing $400 per month. Customers are price-sensitive.'); },
    get objective() { return t('Your coffee shop is losing $400 per month. Can you reach a monthly operating profit of $200?'); },
    get successCondition() { return t('Monthly operating profit of at least $200. Sales follow the demand rule, so a higher price means fewer customers.'); },
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
          { get label() { return t('Customers (from demand rule)'); }, value: units, kind: 'units' },
          { get label() { return t('Revenue'); }, value: r.revenue, kind: 'money' },
        ],
      };
    },
  },
  {
    level: 'expert',
    get title() { return t('Bake Within Your Limits'); },
    get business() { return t('Maple & Moss Bakery (fictional)'); },
    get background() {
      return t('The bakery has only {flour} kg of flour and {butter} kg of butter this month, and fixed costs of {fixed}. The current plan is losing money.', {
        flour: formatNumber(EXPERT.flourAvailable / 1000),
        butter: formatNumber(EXPERT.butterAvailable / 1000),
        fixed: formatCAD(EXPERT.fixedCosts),
      });
    },
    get objective() { return t('Choose how many of each product to bake so the plan fits your inventory and at least breaks even.'); },
    get successCondition() { return t('Uses no more flour or butter than available, bakes no more than demand, and earns an operating profit of $0 or more.'); },
    inputs: expertInputs,
    evaluate: (v) => {
      const errors = rangeErrors(expertInputs, v);
      for (const i of expertInputs) if (Number.isFinite(v[i.key]) && !Number.isInteger(v[i.key])) errors.push(t('{label} must be a whole number.', { label: i.label }));
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
        ...(flourOk ? [] : [t('Not enough flour: this plan needs {need} g but only {have} g is available.', { need: formatNumber(flour / 1000), have: formatNumber(EXPERT.flourAvailable) })]),
        ...(butterOk ? [] : [t('Not enough butter: this plan needs {need} g but only {have} g is available.', { need: formatNumber(butter / 1000), have: formatNumber(EXPERT.butterAvailable) })]),
      ];
      return {
        valid: feasibilityErrors.length === 0,
        errors: feasibilityErrors,
        profit: s.operatingProfit,
        // An infeasible plan never counts as success.
        success: feasibilityErrors.length === 0 && toCents(s.operatingProfit) >= 0,
        facts: [
          { get label() { return t('Flour used (g)'); }, value: flour / 1000, kind: 'units' },
          { get label() { return t('Butter used (g)'); }, value: butter / 1000, kind: 'units' },
          { get label() { return t('Total contribution margin'); }, value: s.totalCM, kind: 'money' },
        ],
      };
    },
  },
];

export const startValues = (c: Challenge) => Object.fromEntries(c.inputs.map((i) => [i.key, i.start]));
