/**
 * Downloadable Excel templates. Their column headings match what the
 * importer recognises, so a filled-in template uploads without remapping.
 */

type Cell = { value: string | number; type?: StringConstructor | NumberConstructor; fontWeight?: 'bold'; backgroundColor?: string };

const head = (value: string): Cell => ({ value, fontWeight: 'bold', backgroundColor: '#E4EDE1' });
const text = (value: string): Cell => ({ value, type: String });
const num = (value: number): Cell => ({ value, type: Number });

export const INVENTORY_TEMPLATE_ROWS: [string, number, string, number][] = [
  ['Coffee Beans', 5000, 'g', 0.03],
  ['Milk', 10000, 'mL', 0.002],
  ['Coffee Cups', 200, 'pieces', 0.15],
  ['Flour', 3000, 'g', 0.004],
];

export const RECIPE_TEMPLATE_ROWS: [string, string, number, string][] = [
  ['Coffee', 'Coffee Beans', 20, 'g'],
  ['Coffee', 'Milk', 200, 'mL'],
  ['Coffee', 'Coffee Cups', 1, 'pieces'],
  ['Latte', 'Milk', 300, 'mL'],
];

const NOTES = [
  'Price It Right template – example data is fictional.',
  'Units: g, kg, mL, L or pieces. Cost per unit is per ONE unit in the Unit column (e.g. per g). Leave it blank if unknown.',
  'Each item should appear only once. Duplicates are flagged, not merged.',
];

export async function inventoryTemplateBlob(): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal');
  return writeXlsxFile(
    [
      {
        sheet: 'Inventory',
        data: [
          ['Item Name', 'Available Quantity', 'Unit', 'Cost Per Unit'].map(head),
          ...INVENTORY_TEMPLATE_ROWS.map(([a, b, c, d]) => [text(a), num(b), text(c), num(d)]),
        ],
        columns: [{ width: 22 }, { width: 20 }, { width: 10 }, { width: 16 }],
      },
      { sheet: 'Instructions', data: NOTES.map((n) => [text(n)]), columns: [{ width: 110 }] },
    ],
  ).toBlob();
}

export async function recipeTemplateBlob(): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal');
  return writeXlsxFile(
    [
      {
        sheet: 'Recipes',
        data: [
          ['Product', 'Inventory Item', 'Quantity Required', 'Unit'].map(head),
          ...RECIPE_TEMPLATE_ROWS.map(([a, b, c, d]) => [text(a), text(b), num(c), text(d)]),
        ],
        columns: [{ width: 18 }, { width: 20 }, { width: 18 }, { width: 10 }],
      },
      {
        sheet: 'Instructions',
        data: [
          'One row per ingredient per product. Quantity Required is the amount used to make ONE product.',
          'Product and Inventory Item names must match your products and inventory (you can match unknown names during import).',
          'Example data is fictional.',
        ].map((n) => [text(n)]),
        columns: [{ width: 110 }],
      },
    ],
  ).toBlob();
}

/** Saves a file to the user's computer. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
