import { strFromU8, unzipSync } from 'fflate';
import readXlsxFile from 'read-excel-file/universal';
import { describe, expect, it } from 'vitest';
import { buildExcelSheets, businessExcelBlob, CAD_FORMAT, excelFileName, PERCENT_FORMAT, type ExcelSheet } from './excelExport';
import { buildModel } from './model';
import { sampleBusiness } from './samples';

let n = 0;
const demoModel = () => buildModel(sampleBusiness('demo', (p) => `${p}${++n}`));
const WHEN = new Date(2026, 10, 9);

/** Reads the generated file back exactly as a user's Excel would store it. */
async function readBack(sheets: ExcelSheet[]) {
  const blob = await businessExcelBlob(sheets);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const workbook = (await readXlsxFile(blob)) as { sheet: string; data: unknown[][] }[];
  const files = unzipSync(bytes);
  return { workbook, styles: strFromU8(files['xl/styles.xml']), bytes };
}
const rowStarting = (data: unknown[][], first: string) => data.find((r) => r[0] === first)!;

describe('Excel export – built from the same calculations', () => {
  const sheets = buildExcelSheets(demoModel(), WHEN)!;

  it('has the five sheets in order', () => {
    expect(sheets.map((s) => s.sheet)).toEqual(['Products', 'Summary', 'Break-even', 'Inventory & shortages', 'Production plan']);
  });

  it('stores money, units and percentages as NUMBER cells with CAD / % formats, never as text', () => {
    const summary = sheets.find((s) => s.sheet === 'Summary')!.data;
    const profitRow = summary.find((r) => r[0]?.value === 'Projected operating profit')!;
    expect(profitRow[1]).toEqual({ value: 975, type: Number, format: CAD_FORMAT });
    const ratioRow = summary.find((r) => r[0]?.value === 'Overall contribution margin ratio')!;
    expect(ratioRow[1]).toMatchObject({ type: Number, format: PERCENT_FORMAT });
    expect(ratioRow[1]!.value).toBeCloseTo(2475 / 3900, 12);
  });

  it('labels the demo as fictional and the amounts as CAD', () => {
    expect(sheets[0].data[0][0]!.value).toMatch(/FICTIONAL DEMO DATA/);
    expect(sheets[0].data[1][0]!.value).toMatch(/Canadian dollars \(CAD\)/);
  });

  it('returns nothing for a business with invalid numbers', () => {
    const m = demoModel();
    const broken = buildModel({ ...m.data, fixedCosts: 'abc' });
    expect(buildExcelSheets(broken)).toBeNull();
  });

  it('says so when there is no inventory', () => {
    const m = demoModel();
    const none = buildExcelSheets(buildModel({ ...m.data, inventory: [], recipes: {} }))!;
    expect(none[3].data.some((r) => r[0]?.value === 'No inventory has been entered.')).toBe(true);
  });

  it('makes a safe file name', () => {
    expect(excelFileName('Maple Leaf Café (demo)')).toBe('price-it-right-maple-leaf-cafe-demo.xlsx');
  });
});

describe('Excel export – reading the generated file back', () => {
  it('the .xlsx file opens, with numbers that are numbers and match the verified results', async () => {
    const { workbook, styles } = await readBack(buildExcelSheets(demoModel(), WHEN)!);
    expect(workbook.map((s) => s.sheet)).toEqual(['Products', 'Summary', 'Break-even', 'Inventory & shortages', 'Production plan']);
    const sheet = (name: string) => workbook.find((s) => s.sheet === name)!.data;

    // Products: Coffee $6 / $2 / 300 → revenue $1,800, CM $1,200; totals $3,900 and $2,475.
    expect(rowStarting(sheet('Products'), 'Coffee').slice(2, 9)).toEqual([6, 2, 300, 1800, 600, 4, 1200]);
    const total = rowStarting(sheet('Products'), 'Total');
    expect([total[4], total[5], total[6], total[8]]).toEqual([750, 3900, 1425, 2475]);

    // Summary – the required verification example.
    const summary = sheet('Summary');
    expect(rowStarting(summary, 'Total monthly revenue (expected)')[1]).toBe(3900);
    expect(rowStarting(summary, 'Total variable costs')[1]).toBe(1425);
    expect(rowStarting(summary, 'Total contribution margin')[1]).toBe(2475);
    expect(rowStarting(summary, 'Monthly fixed costs (whole business, subtracted once)')[1]).toBe(1500);
    expect(rowStarting(summary, 'Projected operating profit')[1]).toBe(975);

    // Break-even: 455 units (182 / 91 / 61 / 121), revenue $2,363.64.
    const be = sheet('Break-even');
    expect(rowStarting(be, 'Break-even units – whole units (rounded up)')[1]).toBe(455);
    expect(rowStarting(be, 'Break-even revenue (theoretical)')[1] as number).toBeCloseTo(2363.636, 2);
    expect(['Coffee', 'Muffin', 'Sandwich', 'Cookie'].map((p) => rowStarting(be, p)[2])).toEqual([182, 91, 61, 121]);

    // Inventory: milk 10 L and butter 1.25 kg short for expected sales.
    const inv = sheet('Inventory & shortages');
    expect(rowStarting(inv, 'Milk').slice(1, 7)).toEqual(['mL', expect.any(Number), expect.any(Number), expect.any(Number), 10000, 'Shortage']);
    expect(rowStarting(inv, 'Butter')[5]).toBe(1250);

    // Production plan: keep-my-mix 211 / 105 / 70 / 141, constrained profit $238.50.
    const plan = sheet('Production plan');
    expect(['Coffee', 'Muffin', 'Sandwich', 'Cookie'].map((p) => rowStarting(plan, p)[2])).toEqual([211, 105, 70, 141]);
    expect(rowStarting(plan, 'Inventory-constrained operating profit')[1]).toBe(238.5);

    // Every figure that should be a number is a number (not text).
    for (const v of [total[5], rowStarting(summary, 'Projected operating profit')[1], rowStarting(be, 'Coffee')[2], rowStarting(inv, 'Milk')[5]]) expect(typeof v).toBe('number');

    // The CAD and percentage formats are stored in the file.
    expect(styles).toContain('[$$-1009]#,##0.00');
    expect(styles).toContain('0.0%');
  });
});
