import { describe, expect, it } from 'vitest';
import writeXlsxFile from 'write-excel-file/universal';
import {
  INVENTORY_FIELDS,
  RECIPE_FIELDS,
  buildRecipeImport,
  columnHeaders,
  dataRows,
  guessMapping,
  mappingErrors,
  readRecipeRows,
  readSpreadsheet,
  validateInventoryRows,
} from './importer';
import { inventoryTemplateBlob, recipeTemplateBlob } from './templates';

const csv = (text: string, name = 'inventory.csv') => new File([text], name, { type: 'text/csv' });

async function xlsx(sheets: { sheet: string; data: (string | number)[][] }[], name = 'inventory.xlsx') {
  const blob = await writeXlsxFile(sheets.map((s) => ({ sheet: s.sheet, data: s.data.map((r) => r.map((value) => ({ value }))) }))).toBlob();
  return new File([blob], name);
}

describe('reading files', () => {
  it('reads a CSV file', async () => {
    const r = await readSpreadsheet(csv('Item Name,Available Quantity,Unit,Cost Per Unit\nMilk,10000,mL,0.002\n\n'));
    expect(r).toEqual({ ok: true, sheets: [{ name: 'CSV', rows: [['Item Name', 'Available Quantity', 'Unit', 'Cost Per Unit'], ['Milk', '10000', 'mL', '0.002']] }] });
  });

  it('reads every worksheet of an Excel file', async () => {
    const file = await xlsx([
      { sheet: 'Notes', data: [['hello']] },
      { sheet: 'Stock', data: [['Item', 'Qty', 'UOM'], ['Flour', 3000, 'g']] },
    ]);
    const r = await readSpreadsheet(file);
    if (!r.ok) throw new Error(r.error);
    expect(r.sheets.map((s) => s.name)).toEqual(['Notes', 'Stock']);
    expect(r.sheets[1].rows).toEqual([['Item', 'Qty', 'UOM'], ['Flour', '3000', 'g']]);
  });

  it('rejects unsupported formats, empty files and oversized files', async () => {
    expect(await readSpreadsheet(new File(['x'], 'stock.xls'))).toMatchObject({ ok: false, error: expect.stringMatching(/save as \.xlsx/) });
    expect(await readSpreadsheet(new File(['x'], 'stock.pdf'))).toMatchObject({ ok: false, error: expect.stringMatching(/Unsupported file type/) });
    expect(await readSpreadsheet(csv(''))).toMatchObject({ ok: false, error: 'This file is empty.' });
    expect(await readSpreadsheet(csv('\n\n , ,\n'))).toMatchObject({ ok: false, error: 'This file has no data in it.' });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.csv');
    expect(await readSpreadsheet(big)).toMatchObject({ ok: false, error: expect.stringMatching(/larger than 5 MB/) });
  });

  it('reports a damaged Excel file instead of crashing', async () => {
    expect(await readSpreadsheet(new File(['not really a zip'], 'broken.xlsx'))).toMatchObject({ ok: false });
  });
});

describe('column mapping', () => {
  it('recognises the common column names', () => {
    expect(guessMapping(['Item Name', 'Available Quantity', 'Unit', 'Cost Per Unit'], INVENTORY_FIELDS)).toEqual({ name: 0, quantity: 1, unit: 2, cost: 3 });
    expect(guessMapping(['UOM', 'Description', 'Qty on hand'], INVENTORY_FIELDS)).toEqual({ name: 1, quantity: 2, unit: 0, cost: null });
  });
  it('requires the mandatory fields and one column per field', () => {
    expect(mappingErrors({ name: 0, quantity: null, unit: 2, cost: null }, INVENTORY_FIELDS)).toEqual(['Choose which column holds “Available quantity”.']);
    expect(mappingErrors({ name: 0, quantity: 0, unit: 2, cost: null }, INVENTORY_FIELDS)).toEqual(['Each column can only be used for one field.']);
  });
  it('uses generic headers when the file has no heading row', () => {
    const sheet = { name: 'S', rows: [['Milk', '5', 'L']] };
    expect(columnHeaders(sheet, false)).toEqual(['Column A', 'Column B', 'Column C']);
    expect(dataRows(sheet, false)[0].rowNumber).toBe(1);
  });
});

describe('validating inventory rows', () => {
  const sheet = {
    name: 'S',
    rows: [
      ['Item Name', 'Available Quantity', 'Unit', 'Cost Per Unit'],
      ['Coffee Beans', '5000', 'g', '0.03'],
      ['Milk', '10000', 'mL', '0.002'],
      ['', '5', 'g', ''],
      ['Sugar', '', 'g', ''],
      ['Butter', '-2', 'kg', ''],
      ['Salt', 'lots', 'g', ''],
      ['Cream', '2', 'oz', ''],
      ['Cups', '200', 'pieces', 'free'],
      ['milk', '500', 'mL', ''],
    ],
  };
  const result = validateInventoryRows(dataRows(sheet, true), { name: 0, quantity: 1, unit: 2, cost: 3 });
  const msg = (row: number) => result.problems.find((p) => p.rowNumber === row)?.messages.join(' ') ?? '';

  it('accepts valid rows only', () => {
    expect(result.valid.map((v) => v.record.name)).toEqual(['Coffee Beans']);
  });
  it('reports each problem with its row number', () => {
    expect(msg(4)).toMatch(/Missing item name/);
    expect(msg(5)).toMatch(/Missing quantity/);
    expect(msg(6)).toMatch(/can't be negative/);
    expect(msg(7)).toMatch(/numbers only/);
    expect(msg(8)).toMatch(/Unsupported unit “oz”/);
    expect(msg(9)).toMatch(/Cost:/);
  });
  it('flags duplicates on both rows instead of merging them', () => {
    expect(msg(3)).toMatch(/Duplicate item “Milk” \(also on row 10\)/);
    expect(msg(10)).toMatch(/Duplicate item “milk” \(also on row 3\)/);
  });
  it('flags items already in the inventory when adding', () => {
    const r = validateInventoryRows(dataRows(sheet, true).slice(0, 1), { name: 0, quantity: 1, unit: 2, cost: 3 }, ['coffee beans']);
    expect(r.problems[0].messages[0]).toMatch(/already in your inventory/);
  });
  it('warns when the column mapping looks wrong', () => {
    const wrong = validateInventoryRows(dataRows(sheet, true), { name: 1, quantity: 0, unit: 2, cost: null });
    expect(wrong.mappingLooksWrong).toBe(true);
    expect(wrong.valid).toHaveLength(0);
  });
  it('limits the number of rows', () => {
    const rows = Array.from({ length: 2001 }, (_, i) => ({ rowNumber: i + 2, cells: [`Item ${i}`, '1', 'g'] }));
    expect(validateInventoryRows(rows, { name: 0, quantity: 1, unit: 2, cost: null }).tooManyRows).toBe(true);
  });
});

describe('templates work with the importer', () => {
  it('the inventory template imports cleanly', async () => {
    const r = await readSpreadsheet(new File([await inventoryTemplateBlob()], 'template.xlsx'));
    if (!r.ok) throw new Error(r.error);
    const sheet = r.sheets[0];
    const mapping = guessMapping(columnHeaders(sheet, true), INVENTORY_FIELDS);
    expect(mappingErrors(mapping, INVENTORY_FIELDS)).toEqual([]);
    const v = validateInventoryRows(dataRows(sheet, true), mapping);
    expect(v.problems).toEqual([]);
    expect(v.valid.map((x) => x.record)).toEqual([
      { name: 'Coffee Beans', quantity: '5000', unit: 'g', cost: '0.03' },
      { name: 'Milk', quantity: '10000', unit: 'mL', cost: '0.002' },
      { name: 'Coffee Cups', quantity: '200', unit: 'pcs', cost: '0.15' },
      { name: 'Flour', quantity: '3000', unit: 'g', cost: '0.004' },
    ]);
  });

  it('the recipe template imports, asking about unknown names', async () => {
    const r = await readSpreadsheet(new File([await recipeTemplateBlob()], 'recipes.xlsx'));
    if (!r.ok) throw new Error(r.error);
    const sheet = r.sheets[0];
    const mapping = guessMapping(columnHeaders(sheet, true), RECIPE_FIELDS);
    expect(mapping).toEqual({ product: 0, item: 1, quantity: 2, unit: 3 });
    const products = [{ id: 'p1', name: 'Coffee' }];
    const items = [
      { id: 'i1', name: 'Coffee beans', unit: 'g' as const },
      { id: 'i2', name: 'Milk', unit: 'L' as const },
    ];
    const read = readRecipeRows(dataRows(sheet, true), mapping, products, items);
    expect(read.unknownProducts).toEqual(['Latte']);
    expect(read.unknownItems).toEqual(['Coffee Cups']);

    // Until resolved, unknown names are reported and nothing is invented.
    const unresolved = buildRecipeImport(read.drafts, products, items, {}, {});
    expect(unresolved.unresolved.sort()).toEqual(['Coffee Cups', 'Latte']);

    // The user skips Latte and Coffee Cups.
    const imp = buildRecipeImport(read.drafts, products, items, { latte: null }, { 'coffee cups': null });
    expect(imp.skipped).toBe(2);
    expect(imp.recipes).toEqual({
      p1: [
        { itemId: 'i1', quantity: '20', unit: 'g' },
        { itemId: 'i2', quantity: '200', unit: 'mL' }, // mL works for an item stored in L
      ],
    });
  });

  it('recipe rows: incompatible units and duplicates are rejected', () => {
    const rows = [
      { rowNumber: 2, cells: ['Coffee', 'Milk', '200', 'g'] },
      { rowNumber: 3, cells: ['Coffee', 'Beans', '20', 'g'] },
      { rowNumber: 4, cells: ['Coffee', 'Beans', '25', 'g'] },
    ];
    const products = [{ id: 'p1', name: 'Coffee' }];
    const items = [
      { id: 'i1', name: 'Milk', unit: 'mL' as const },
      { id: 'i2', name: 'Beans', unit: 'g' as const },
    ];
    const read = readRecipeRows(rows, { product: 0, item: 1, quantity: 2, unit: 3 }, products, items);
    const imp = buildRecipeImport(read.drafts, products, items, {}, {});
    expect(imp.problems.map((p) => p.rowNumber)).toEqual([2, 4]);
    expect(imp.recipes.p1).toEqual([{ itemId: 'i2', quantity: '20', unit: 'g' }]);
  });
});
