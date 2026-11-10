/**
 * The report, PDF text and Excel export in French. The NUMBERS must be exactly
 * the same as in English – only the words and number formats change.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildExcelSheets } from '../lib/excelExport';
import { formatCAD } from '../lib/format';
import { buildModel } from '../lib/model';
import { buildReport } from '../lib/report';
import { pdfText } from '../lib/reportPdf';
import { sampleBusiness } from '../lib/samples';
import { parseTaxRate, requiredPreTaxProfit } from '../lib/tax';
import { missingFrench, setLanguage } from './i18n';

let n = 0;
const demoModel = () => buildModel(sampleBusiness('demo', (p) => `${p}${++n}`));
const WHEN = new Date(2026, 10, 9);
/** fr-CA uses non-breaking spaces (U+00A0 / U+202F); compare with plain spaces. */
const plain = (s: string) => s.replace(/[  ]/g, ' ');

beforeEach(() => {
  setLanguage('fr');
  missingFrench.clear();
});
afterEach(() => setLanguage('en'));

describe('French report and exports (same numbers, French words)', () => {
  it('builds the business report in French with fr-CA amounts', () => {
    const r = buildReport(demoModel(), null, WHEN)!;
    expect(r.generated).toBe('9 novembre 2026');
    expect(r.totals.map(([label, amount]) => [label, plain(amount)])).toEqual([
      ['Chiffre d’affaires mensuel total (prévu)', '3 900 $'],
      ['Coûts variables totaux', '1 425 $'],
      ['Marge sur coûts variables totale', '2 475 $'],
      ['Coûts fixes mensuels', '1 500 $'],
      ['Bénéfice d’exploitation prévu', '975 $'],
      ['Ratio global de marge sur coûts variables', '63,5 %'],
    ]);
    const breakEven = plain(r.breakEven.join(' '));
    expect(breakEven).toContain('455 unités au total');
    expect(breakEven).toContain('2 363,64 $');
    expect(r.assumptions[0]).toBe('Tous les montants sont en dollars canadiens (CAD) par mois.');
    expect([...missingFrench]).toEqual([]);
  });

  it('report figures match the English report exactly', () => {
    const fr = buildReport(demoModel(), null, WHEN)!;
    setLanguage('en');
    const en = buildReport(demoModel(), null, WHEN)!;
    expect(en.totals.map((r) => r[1])).toEqual(['$3,900', '$1,425', '$2,475', '$1,500', '$975', '63.5%']);
    expect(fr.chart.map((c) => c.value)).toEqual(en.chart.map((c) => c.value));
  });

  it('PDF text keeps French accents but swaps characters the PDF font lacks', () => {
    expect(plain(pdfText(formatCAD(3900)))).toBe('3 900 $');
    expect(pdfText('1 500 $ − cœur')).toBe('1 500 $ - coeur');
    expect(pdfText('Coûts fixes évitables')).toBe('Coûts fixes évitables');
  });

  it('names the Excel sheets in French but stores the same numbers', () => {
    const sheets = buildExcelSheets(demoModel(), WHEN)!;
    expect(sheets.map((s) => s.sheet)).toEqual(['Produits', 'Sommaire', 'Seuil de rentabilité', 'Stocks et pénuries', 'Plan de production']);
    sheets.forEach((s) => expect(s.sheet.length).toBeLessThanOrEqual(31)); // Excel's limit
    const summary = sheets[1].data;
    const row = summary.find((r) => r[0]?.value === 'Bénéfice d’exploitation prévu')!;
    expect(row[1]).toMatchObject({ value: 975, type: Number });
    expect([...missingFrench]).toEqual([]);
  });

  it('after-tax target in French: 1 000 $ at 20 % needs 1 250 $ before tax; accepts a decimal comma', () => {
    const rate = parseTaxRate('20');
    expect(rate.ok).toBe(true);
    if (!rate.ok) return;
    const r = requiredPreTaxProfit(1000, rate.basisPoints);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    expect(plain(formatCAD(r.preTax))).toBe('1 250 $');
    const comma = parseTaxRate('12,5 %');
    expect(comma).toMatchObject({ ok: true, basisPoints: 1250 });
  });
});
