/**
 * Downloadable Excel templates. Their column headings match what the
 * importer recognises, so a filled-in template uploads without remapping.
 */

import { t, tx } from '../i18n/i18n';

type Cell = { value: string | number; type?: StringConstructor | NumberConstructor; fontWeight?: 'bold'; backgroundColor?: string };

const head = (value: string): Cell => ({ value, fontWeight: 'bold', backgroundColor: '#E4EDE1' });
const text = (value: string): Cell => ({ value, type: String });
const num = (value: number): Cell => ({ value, type: Number });

export const INVENTORY_TEMPLATE_ROWS: [string, number, string, number][] = [
  [tx('Coffee Beans'), 5000, 'g', 0.03],
  [tx('Milk'), 10000, 'mL', 0.002],
  [tx('Coffee Cups'), 200, 'pieces', 0.15],
  [tx('Flour'), 3000, 'g', 0.004],
];

export const RECIPE_TEMPLATE_ROWS: [string, string, number, string][] = [
  [tx('Coffee'), tx('Coffee Beans'), 20, 'g'],
  [tx('Coffee'), tx('Milk'), 200, 'mL'],
  [tx('Coffee'), tx('Coffee Cups'), 1, 'pieces'],
  [tx('Latte'), tx('Milk'), 300, 'mL'],
];

const NOTES = [
  tx('Price It Right template – example data is fictional.'),
  tx('Units: g, kg, mL, L or pieces. Cost per unit is per ONE unit in the Unit column (e.g. per g). Leave it blank if unknown.'),
  tx('Each item should appear only once. Duplicates are flagged, not merged.'),
];

/** Templates follow the chosen language; the importer recognises both English and French headings and units. */
const unitText = (u: string) => (u === 'pieces' ? t('pieces') : u);

export async function inventoryTemplateBlob(): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal');
  return writeXlsxFile(
    [
      {
        sheet: t('Inventory'),
        data: [
          [t('Item Name'), t('Available Quantity'), t('Unit'), t('Cost Per Unit')].map(head),
          ...INVENTORY_TEMPLATE_ROWS.map(([a, b, c, d]) => [text(t(a)), num(b), text(unitText(c)), num(d)]),
        ],
        columns: [{ width: 22 }, { width: 20 }, { width: 10 }, { width: 16 }],
      },
      { sheet: t('Instructions'), data: NOTES.map((n) => [text(t(n))]), columns: [{ width: 110 }] },
    ],
  ).toBlob();
}

export async function recipeTemplateBlob(): Promise<Blob> {
  const { default: writeXlsxFile } = await import('write-excel-file/universal');
  return writeXlsxFile(
    [
      {
        sheet: t('Recipes'),
        data: [
          [t('Product'), t('Inventory Item'), t('Quantity Required'), t('Unit')].map(head),
          ...RECIPE_TEMPLATE_ROWS.map(([a, b, c, d]) => [text(t(a)), text(t(b)), num(c), text(unitText(d))]),
        ],
        columns: [{ width: 18 }, { width: 20 }, { width: 18 }, { width: 10 }],
      },
      {
        sheet: t('Instructions'),
        data: [
          t('One row per ingredient per product. Quantity Required is the amount used to make ONE product.'),
          t('Product and Inventory Item names must match your products and inventory (you can match unknown names during import).'),
          t('Example data is fictional.'),
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
