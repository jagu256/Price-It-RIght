/**
 * 📊 My Business Report.
 *
 * `buildReport` collects every number from the same calculation modules the
 * app uses (so the report can be tested on its own). `reportPdf.ts` lays it
 * out as a PDF with jsPDF, entirely in the browser.
 */
import { t, tx } from '../i18n/i18n';
import { getBusiness } from './businesses';
import { formatCAD, formatLongDate, formatNumber, formatPercent, unitsLabel } from './format';
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

const STATUS: Record<string, string> = { sufficient: tx('Sufficient'), low: tx('Low stock'), shortage: tx('Shortage'), unused: tx('Not used by plan') };

export function buildReport(model: BusinessModel, scenario: ScenarioResult | null, now = new Date()): ReportData | null {
  const s = model.summary;
  if (!s || model.fixedCosts === null) return null;
  const business = getBusiness(model.data.type);

  const products = s.products.map((p) => [
    p.name,
    formatCAD(p.price),
    formatCAD(p.variableCost),
    formatNumber(p.units),
    formatCAD(p.revenue),
    formatCAD(p.totalCM),
    p.cmRatio === null ? t('N/A') : formatPercent(p.cmRatio),
  ]);

  const totals: [string, string][] = [
    [t('Total monthly revenue (expected)'), formatCAD(s.totalRevenue)],
    [t('Total variable costs'), formatCAD(s.totalVariableCosts)],
    [t('Total contribution margin'), formatCAD(s.totalCM)],
    [t('Monthly fixed costs'), formatCAD(s.fixedCosts)],
    [s.operatingProfit < 0 ? t('Projected operating loss') : t('Projected operating profit'), formatCAD(s.operatingProfit)],
    [t('Overall contribution margin ratio'), s.overallCMRatio === null ? t('N/A') : formatPercent(s.overallCMRatio)],
  ];

  const be = s.breakEven;
  const nameOf = new Map(s.products.map((p) => [p.id, p.name]));
  let breakEven: string[];
  switch (be.status) {
    case 'reachable':
      breakEven = [
        t('Weighted-average contribution margin: {cm} per unit (assumes the expected sales mix stays the same).', { cm: formatCAD(be.weightedCM) }),
        t('Break-even: {units} in total (theoretical {exact}), about {revenue} of revenue.', { units: unitsLabel(be.totalUnits), exact: formatNumber(be.totalUnitsExact), revenue: formatCAD(be.revenueExact) }),
        t('At this mix: {list}.', { list: be.allocation.map((a) => `${nameOf.get(a.id)} ${formatNumber(a.units)}`).join(', ') }),
        s.marginOfSafety !== null && s.marginOfSafetyPercent !== null
          ? t('Margin of safety: {amount} ({percent} of expected revenue).', { amount: formatCAD(s.marginOfSafety), percent: formatPercent(s.marginOfSafetyPercent) })
          : t('Margin of safety: Not available.'),
      ];
      break;
    case 'no-fixed-costs':
      breakEven = [t('There are no fixed costs, so the business breaks even at 0 units.')];
      break;
    case 'no-sales':
      breakEven = [t('Not available – no expected sales, so there is no sales mix to analyse.')];
      break;
    default:
      breakEven = [t('Not available – contribution margin is not enough to ever cover fixed costs at the expected sales mix.')];
  }

  let check: PlanCheck | null = null;
  let production: string[] = [];
  let inventory: string[][] = [];
  let shortages: string[] = [];
  const stockOk = Object.keys(model.stockErrors).length === 0;
  if (model.data.inventory.length === 0) {
    production = [t('No inventory has been entered.')];
  } else if (!stockOk) {
    production = [t('Inventory has errors, so inventory checks were not included.')];
  } else {
    const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
    check = checkPlan(demand, model.products, model.recipes, model.stock);
    inventory = check.items.map((i) => [
      i.name,
      formatQuantity(i.availableBase, i.dimension, 'short'),
      formatQuantity(i.requiredBase, i.dimension, 'short'),
      i.remainingBase >= 0 ? formatQuantity(i.remainingBase, i.dimension, 'short') : `-${formatQuantity(-i.remainingBase, i.dimension, 'short')}`,
      t(STATUS[i.status]),
    ]);
    shortages = check.items
      .filter((i) => i.shortageBase > 0)
      .map((i) => t('{name}: an additional {amount} would be required to meet expected sales.', { name: i.name, amount: formatQuantity(i.shortageBase, i.dimension) }));
    const { plan, scale } = proportionalPlan(model.products, model.recipes, model.stock);
    const constrained = planFinancials(plan, model.products, model.fixedCosts);
    production = [
      check.feasibility === 'feasible'
        ? t('Current inventory covers expected sales for all products with recipes.')
        : check.feasibility === 'infeasible'
          ? t('Current inventory does NOT cover expected sales.')
          : t('No shortages found, but some products have no recipe, so their inventory needs are unknown.'),
      ...(check.unknownProducts.length ? [t('Products without recipes (not checked): {list}.', { list: check.unknownProducts.join(', ') })] : []),
      t('Inventory-constrained plan (keeps the sales mix, {percent} of expected demand): {list}.', {
        percent: formatPercent(Math.min(1, scale) * 100),
        list: model.products.map((p) => `${p.name} ${formatNumber(plan[p.id])}`).join(', '),
      }),
      t('Inventory-constrained operating profit: {profit} (expected-demand profit: {expected}).', { profit: formatCAD(constrained.summary.operatingProfit), expected: formatCAD(s.operatingProfit) }),
    ];
  }

  let scenarioRows: string[][] | null = null;
  if (scenario?.changed && scenario.summary) {
    const m = scenario.summary;
    const row = (label: string, a: number, b: number) => [label, formatCAD(a), formatCAD(b), formatCAD(b - a)];
    scenarioRows = [
      row(t('Revenue'), s.totalRevenue, m.totalRevenue),
      row(t('Variable costs'), s.totalVariableCosts, m.totalVariableCosts),
      row(t('Contribution margin'), s.totalCM, m.totalCM),
      row(t('Fixed costs'), s.fixedCosts, m.fixedCosts),
      row(t('Operating profit'), s.operatingProfit, m.operatingProfit),
    ];
  }

  return {
    title: `Price It Right – ${t('Business Report')}`,
    businessName: model.data.name.trim() || t('My business'),
    category: t(business.label),
    isDemo: model.data.isDemo,
    generated: formatLongDate(now),
    products,
    totals,
    breakEven,
    inventory,
    shortages,
    production,
    scenario: scenarioRows,
    chart: s.products.map((p) => ({ label: p.name, value: p.totalCM })),
    assumptions: [
      t('All amounts are in Canadian dollars (CAD) per month.'),
      t('Sales figures are expected (forecast) amounts entered by the user, not actual transactions.'),
      t('Operating profit = total contribution margin − fixed costs. It is not net income: taxes, interest and other expenses are not included.'),
      t('Selling prices and variable costs per unit are assumed constant; fixed costs are assumed constant within the relevant range.'),
      t('Break-even uses a constant sales-mix assumption. A different mix has a different break-even point.'),
      t('Inventory figures are a snapshot entered or imported by the user, not a live inventory feed.'),
      t('Inventory purchases are not treated as expenses here; material costs are recognised through variable cost per unit when products are sold.'),
      t('This is an educational decision-support tool. Results depend entirely on the user’s assumptions and are not financial advice.'),
    ],
  };
}
