/**
 * 📊 My Business Report.
 *
 * `buildReport` collects every number from the same calculation modules the
 * app uses (so the report can be tested on its own). `reportPdf.ts` lays it
 * out as a PDF with jsPDF, entirely in the browser.
 */
import { getBusiness } from './businesses';
import { formatCAD, formatPercent, unitsLabel } from './format';
import { formatQuantity } from './inventory';
import type { BusinessModel } from './model';
import { checkPlan, planFinancials, proportionalPlan, type PlanCheck } from './planning';
import type { ScenarioResult } from './pricing';

export interface ReportData {
  title: string;
  businessName: string;
  category: string;
  isDemo: boolean;
  generated: string;
  products: string[][];
  totals: [string, string][];
  breakEven: string[];
  inventory: string[][];
  shortages: string[];
  production: string[];
  scenario: string[][] | null;
  chart: { label: string; value: number }[];
  assumptions: string[];
}

const STATUS: Record<string, string> = { sufficient: 'Sufficient', low: 'Low stock', shortage: 'Shortage', unused: 'Not used by plan' };

export function buildReport(model: BusinessModel, scenario: ScenarioResult | null, now = new Date()): ReportData | null {
  const s = model.summary;
  if (!s || model.fixedCosts === null) return null;
  const business = getBusiness(model.data.type);

  const products = s.products.map((p) => [
    p.name,
    formatCAD(p.price),
    formatCAD(p.variableCost),
    p.units.toLocaleString('en-CA'),
    formatCAD(p.revenue),
    formatCAD(p.totalCM),
    p.cmRatio === null ? 'N/A' : formatPercent(p.cmRatio),
  ]);

  const totals: [string, string][] = [
    ['Total monthly revenue (expected)', formatCAD(s.totalRevenue)],
    ['Total variable costs', formatCAD(s.totalVariableCosts)],
    ['Total contribution margin', formatCAD(s.totalCM)],
    ['Monthly fixed costs', formatCAD(s.fixedCosts)],
    [s.operatingProfit < 0 ? 'Projected operating loss' : 'Projected operating profit', formatCAD(s.operatingProfit)],
    ['Overall contribution margin ratio', s.overallCMRatio === null ? 'N/A' : formatPercent(s.overallCMRatio)],
  ];

  const be = s.breakEven;
  const nameOf = new Map(s.products.map((p) => [p.id, p.name]));
  let breakEven: string[];
  switch (be.status) {
    case 'reachable':
      breakEven = [
        `Weighted-average contribution margin: ${formatCAD(be.weightedCM)} per unit (assumes the expected sales mix stays the same).`,
        `Break-even: ${unitsLabel(be.totalUnits)} in total (theoretical ${be.totalUnitsExact.toLocaleString('en-CA', { maximumFractionDigits: 2 })}), about ${formatCAD(be.revenueExact)} of revenue.`,
        `At this mix: ${be.allocation.map((a) => `${nameOf.get(a.id)} ${a.units.toLocaleString('en-CA')}`).join(', ')}.`,
        s.marginOfSafety !== null && s.marginOfSafetyPercent !== null
          ? `Margin of safety: ${formatCAD(s.marginOfSafety)} (${formatPercent(s.marginOfSafetyPercent)} of expected revenue).`
          : 'Margin of safety: Not available.',
      ];
      break;
    case 'no-fixed-costs':
      breakEven = ['There are no fixed costs, so the business breaks even at 0 units.'];
      break;
    case 'no-sales':
      breakEven = ['Not available – no expected sales, so there is no sales mix to analyse.'];
      break;
    default:
      breakEven = ['Not available – contribution margin is not enough to ever cover fixed costs at the expected sales mix.'];
  }

  let check: PlanCheck | null = null;
  let production: string[] = [];
  let inventory: string[][] = [];
  let shortages: string[] = [];
  const stockOk = Object.keys(model.stockErrors).length === 0;
  if (model.data.inventory.length === 0) {
    production = ['No inventory has been entered.'];
  } else if (!stockOk) {
    production = ['Inventory has errors, so inventory checks were not included.'];
  } else {
    const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
    check = checkPlan(demand, model.products, model.recipes, model.stock);
    inventory = check.items.map((i) => [
      i.name,
      formatQuantity(i.availableBase, i.dimension, 'short'),
      formatQuantity(i.requiredBase, i.dimension, 'short'),
      i.remainingBase >= 0 ? formatQuantity(i.remainingBase, i.dimension, 'short') : `-${formatQuantity(-i.remainingBase, i.dimension, 'short')}`,
      STATUS[i.status],
    ]);
    shortages = check.items
      .filter((i) => i.shortageBase > 0)
      .map((i) => `${i.name}: an additional ${formatQuantity(i.shortageBase, i.dimension)} would be required to meet expected sales.`);
    const { plan, scale } = proportionalPlan(model.products, model.recipes, model.stock);
    const constrained = planFinancials(plan, model.products, model.fixedCosts);
    production = [
      check.feasibility === 'feasible'
        ? 'Current inventory covers expected sales for all products with recipes.'
        : check.feasibility === 'infeasible'
          ? 'Current inventory does NOT cover expected sales.'
          : 'No shortages found, but some products have no recipe, so their inventory needs are unknown.',
      ...(check.unknownProducts.length ? [`Products without recipes (not checked): ${check.unknownProducts.join(', ')}.`] : []),
      `Inventory-constrained plan (keeps the sales mix, ${formatPercent(Math.min(1, scale) * 100)} of expected demand): ${model.products.map((p) => `${p.name} ${plan[p.id].toLocaleString('en-CA')}`).join(', ')}.`,
      `Inventory-constrained operating profit: ${formatCAD(constrained.summary.operatingProfit)} (expected-demand profit: ${formatCAD(s.operatingProfit)}).`,
    ];
  }

  let scenarioRows: string[][] | null = null;
  if (scenario?.changed && scenario.summary) {
    const m = scenario.summary;
    const row = (label: string, a: number, b: number) => [label, formatCAD(a), formatCAD(b), formatCAD(b - a)];
    scenarioRows = [
      row('Revenue', s.totalRevenue, m.totalRevenue),
      row('Variable costs', s.totalVariableCosts, m.totalVariableCosts),
      row('Contribution margin', s.totalCM, m.totalCM),
      row('Fixed costs', s.fixedCosts, m.fixedCosts),
      row('Operating profit', s.operatingProfit, m.operatingProfit),
    ];
  }

  return {
    title: 'Price It Right – Business Report',
    businessName: model.data.name.trim() || 'My business',
    category: business.label,
    isDemo: model.data.isDemo,
    generated: now.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
    products,
    totals,
    breakEven,
    inventory,
    shortages,
    production,
    scenario: scenarioRows,
    chart: s.products.map((p) => ({ label: p.name, value: p.totalCM })),
    assumptions: [
      'All amounts are in Canadian dollars (CAD) per month.',
      'Sales figures are expected (forecast) amounts entered by the user, not actual transactions.',
      'Operating profit = total contribution margin − fixed costs. It is not net income: taxes, interest and other expenses are not included.',
      'Selling prices and variable costs per unit are assumed constant; fixed costs are assumed constant within the relevant range.',
      'Break-even uses a constant sales-mix assumption. A different mix has a different break-even point.',
      'Inventory figures are a snapshot entered or imported by the user, not a live inventory feed.',
      'Inventory purchases are not treated as expenses here; material costs are recognised through variable cost per unit when products are sold.',
      'This is an educational decision-support tool. Results depend entirely on the user’s assumptions and are not financial advice.',
    ],
  };
}
