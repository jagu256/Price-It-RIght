/**
 * 📊 "Download my business as Excel".
 *
 * `buildExcelSheets` collects every figure from the same calculation modules
 * the app uses, as NUMBER cells with Canadian-dollar, percentage or unit
 * formats (never text that looks like a number), so the file can be checked
 * and summed in Excel. `businessExcelBlob` turns them into an .xlsx file; the
 * spreadsheet library is loaded only when that function is called.
 */
import { getBusiness } from './businesses';
import type { BusinessModel } from './model';
import { checkPlan, planFinancials, proportionalPlan } from './planning';

/** Canadian dollars with cents (1009 is the Excel locale code for English – Canada). */
export const CAD_FORMAT = '[$$-1009]#,##0.00';
export const PERCENT_FORMAT = '0.0%';
export const UNITS_FORMAT = '#,##0';
export const QUANTITY_FORMAT = '#,##0.###';
export const DECIMAL_FORMAT = '#,##0.00';

export interface ExcelCell {
  value?: string | number;
  type?: StringConstructor | NumberConstructor;
  format?: string;
  fontWeight?: 'bold';
  backgroundColor?: string;
  wrap?: boolean;
}
export type ExcelRow = (ExcelCell | null)[];
export interface ExcelSheet {
  sheet: string;
  data: ExcelRow[];
  columns: { width: number }[];
}

const head = (value: string): ExcelCell => ({ value, type: String, fontWeight: 'bold', backgroundColor: '#E4EDE1' });
const text = (value: string): ExcelCell => ({ value, type: String });
const bold = (value: string): ExcelCell => ({ value, type: String, fontWeight: 'bold' });
const money = (value: number): ExcelCell => ({ value, type: Number, format: CAD_FORMAT });
const units = (value: number): ExcelCell => ({ value, type: Number, format: UNITS_FORMAT });
const qty = (value: number): ExcelCell => ({ value, type: Number, format: QUANTITY_FORMAT });
const decimal = (value: number): ExcelCell => ({ value, type: Number, format: DECIMAL_FORMAT });
/** `percent` is e.g. 63.46 → stored as 0.6346 and shown as 63.5 %. */
const pct = (percent: number | null): ExcelCell => (percent === null ? text('N/A') : { value: percent / 100, type: Number, format: PERCENT_FORMAT });
const note = (value: string): ExcelRow => [{ value, type: String, wrap: false }];

const BASE_UNIT = { mass: 'g', volume: 'mL', count: 'pcs' } as const;
const STATUS: Record<string, string> = { sufficient: 'Sufficient', low: 'Low stock', shortage: 'Shortage', unused: 'Not used' };

/** All five sheets, or null when the business has invalid numbers (nothing is exported then). */
export function buildExcelSheets(model: BusinessModel, now = new Date()): ExcelSheet[] | null {
  const s = model.summary;
  if (!s || model.fixedCosts === null) return null;
  const business = getBusiness(model.data.type);
  const name = model.data.name.trim() || 'My business';
  const banner = [
    note(`${name} – ${business.label}${model.data.isDemo ? ' – FICTIONAL DEMO DATA' : ''}`),
    note(`Price It Right export, ${now.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}. All amounts in Canadian dollars (CAD) per month. Sales are expected (forecast) figures.`),
    [],
  ];

  /* Products ---------------------------------------------------------- */
  const products: ExcelSheet = {
    sheet: 'Products',
    columns: [{ width: 24 }, { width: 14 }, { width: 14 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 14 }, { width: 18 }, { width: 12 }],
    data: [
      ...banner,
      ['Product', 'Category', 'Price (CAD)', 'Variable cost (CAD)', 'Expected units', 'Revenue (CAD)', 'Total variable costs (CAD)', 'CM per unit (CAD)', 'Total contribution margin (CAD)', 'CM ratio'].map(head),
      ...s.products.map((p) => {
        const category = model.products.find((x) => x.id === p.id)?.category ?? '';
        return [text(p.name), text(category), money(p.price), money(p.variableCost), units(p.units), money(p.revenue), money(p.totalVariableCosts), money(p.cmPerUnit), money(p.totalCM), pct(p.cmRatio)];
      }),
      [bold('Total'), null, null, null, units(s.totalUnits), money(s.totalRevenue), money(s.totalVariableCosts), null, money(s.totalCM), pct(s.overallCMRatio)],
    ],
  };

  /* Summary ----------------------------------------------------------- */
  const summary: ExcelSheet = {
    sheet: 'Summary',
    columns: [{ width: 40 }, { width: 18 }],
    data: [
      ...banner,
      ['Measure', 'Amount'].map(head),
      [text('Total monthly revenue (expected)'), money(s.totalRevenue)],
      [text('Total variable costs'), money(s.totalVariableCosts)],
      [text('Total contribution margin'), money(s.totalCM)],
      [text('Monthly fixed costs (whole business, subtracted once)'), money(s.fixedCosts)],
      [bold(s.operatingProfit < 0 ? 'Projected operating loss' : 'Projected operating profit'), money(s.operatingProfit)],
      [text('Overall contribution margin ratio'), pct(s.overallCMRatio)],
      [],
      note('Operating profit = total contribution margin − fixed costs. It is not net income: taxes, interest and other expenses are not included.'),
    ],
  };

  /* Break-even -------------------------------------------------------- */
  const be = s.breakEven;
  const nameOf = new Map(s.products.map((p) => [p.id, p.name]));
  const breakEven: ExcelSheet = {
    sheet: 'Break-even',
    columns: [{ width: 44 }, { width: 18 }, { width: 18 }],
    data: [...banner, note('Assumes the expected sales mix stays the same. A different mix has a different break-even point.'), []],
  };
  if (be.status === 'reachable') {
    breakEven.data.push(
      ['Measure', 'Amount'].map(head),
      [text('Weighted-average contribution margin per unit'), money(be.weightedCM)],
      [text('Break-even units – theoretical'), decimal(be.totalUnitsExact)],
      [text('Break-even units – whole units (rounded up)'), units(be.totalUnits)],
      [text('Break-even revenue (theoretical)'), money(be.revenueExact)],
      [text('Margin of safety'), s.marginOfSafety === null ? text('N/A') : money(s.marginOfSafety)],
      [text('Margin of safety (% of expected revenue)'), pct(s.marginOfSafetyPercent)],
      [],
      ['Product', 'Expected units', 'Break-even units'].map(head),
      ...be.allocation.map((a) => [text(nameOf.get(a.id) ?? ''), units(s.products.find((p) => p.id === a.id)?.units ?? 0), units(a.units)]),
    );
  } else if (be.status === 'no-fixed-costs') {
    breakEven.data.push(note('There are no fixed costs, so the business breaks even at 0 units.'));
  } else if (be.status === 'no-sales') {
    breakEven.data.push(note('Not available – no expected sales, so there is no sales mix to analyse.'));
  } else {
    breakEven.data.push(note('Not available – at the expected mix, contribution margin can never cover fixed costs.'));
  }

  /* Inventory & shortages, Production plan ----------------------------- */
  const inventory: ExcelSheet = {
    sheet: 'Inventory & shortages',
    columns: [{ width: 24 }, { width: 8 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 28 }],
    data: [...banner],
  };
  const production: ExcelSheet = {
    sheet: 'Production plan',
    columns: [{ width: 24 }, { width: 16 }, { width: 14 }, { width: 26 }],
    data: [...banner],
  };
  const stockOk = Object.keys(model.stockErrors).length === 0;
  if (model.data.inventory.length === 0 || !stockOk) {
    const why = model.data.inventory.length === 0 ? 'No inventory has been entered.' : 'Some inventory records have errors, so inventory checks were not included.';
    inventory.data.push(note(why));
    production.data.push(note(why));
  } else {
    const demand = Object.fromEntries(model.products.map((p) => [p.id, p.units]));
    const check = checkPlan(demand, model.products, model.recipes, model.stock);
    inventory.data.push(
      note('Quantities in grams (g), millilitres (mL) or pieces (pcs). "Required" is for expected sales of all products sharing the item.'),
      [],
      ['Item', 'Unit', 'Available', 'Required for expected sales', 'Remaining', 'Shortage', 'Status', 'Used by'].map(head),
      ...check.items.map((i) => [
        text(i.name),
        text(BASE_UNIT[i.dimension]),
        qty(i.availableBase / 1000),
        qty(i.requiredBase / 1000),
        qty(i.remainingBase / 1000),
        qty(i.shortageBase / 1000),
        text(STATUS[i.status]),
        text(i.usedBy.join(', ')),
      ]),
    );
    if (check.unknownProducts.length) inventory.data.push([], note(`Products without a recipe (not checked): ${check.unknownProducts.join(', ')}.`));

    const { plan, scale } = proportionalPlan(model.products, model.recipes, model.stock);
    const constrained = planFinancials(plan, model.products, model.fixedCosts);
    production.data.push(
      note(
        check.feasibility === 'feasible'
          ? 'Current inventory covers expected sales for all products with recipes.'
          : check.feasibility === 'infeasible'
            ? 'Current inventory does NOT cover expected sales. The plan below keeps the sales mix and scales down to what stock allows.'
            : 'No shortages found, but some products have no recipe, so their inventory needs are unknown.',
      ),
      note('This "keep my mix" plan is one feasible plan – it is not proven to be the most profitable one.'),
      [],
      ['Product', 'Expected demand', 'Planned units', 'Recipe'].map(head),
      ...model.products.map((p) => [text(p.name), units(p.units), units(plan[p.id]), text(model.recipes[p.id]?.status === 'complete' ? 'Complete' : 'None – not checked')]),
      [],
      ['Inventory-constrained results', 'Amount'].map(head),
      [text('Share of expected demand produced'), pct(Math.min(1, scale) * 100)],
      [text('Revenue (units sold)'), money(constrained.summary.totalRevenue)],
      [text('Total contribution margin'), money(constrained.summary.totalCM)],
      [text('Fixed costs'), money(constrained.summary.fixedCosts)],
      [bold('Inventory-constrained operating profit'), money(constrained.summary.operatingProfit)],
      [text('Expected-demand operating profit (for comparison)'), money(s.operatingProfit)],
    );
  }

  return [products, summary, breakEven, inventory, production];
}

/** price-it-right-maple-leaf-cafe-demo.xlsx */
export function excelFileName(businessName: string): string {
  const safe =
    businessName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'business';
  return `price-it-right-${safe}.xlsx`;
}

/** Builds the .xlsx file. The spreadsheet library is downloaded only now. */
export async function businessExcelBlob(sheets: ExcelSheet[]): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal');
  return writeXlsxFile(sheets as never).toBlob();
}
