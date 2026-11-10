/**
 * PDF layout for the business report (jsPDF, entirely in the browser).
 * Kept separate so the PDF library only loads when a report is downloaded.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { t } from '../i18n/i18n';
import { formatCAD } from './format';
import type { ReportData } from './report';

/* ------------------------------------------------------------------ */
/* PDF layout                                                          */
/* ------------------------------------------------------------------ */

/** jsPDF's built-in fonts only cover basic Latin characters (including French accents). */
export const pdfText = (s: string) =>
  s
    .replace(/[\u202F\u2009]/g, ' ') // narrow spaces some browsers use in French numbers
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/[−–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');

const GREEN: [number, number, number] = [62, 90, 64];
const SAGE: [number, number, number] = [228, 237, 225];
const INK: [number, number, number] = [31, 46, 34];

export function renderReportPdf(r: ReportData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;

  const ensure = (needed: number) => {
    if (y + needed > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const heading = (t: string) => {
    ensure(60);
    doc.setFont('helvetica', 'bold').setFontSize(13).setTextColor(...GREEN);
    doc.text(pdfText(t), M, y);
    y += 8;
    doc.setDrawColor(...SAGE).setLineWidth(1.2).line(M, y, W - M, y);
    y += 16;
  };
  const paragraph = (t: string, size = 10) => {
    doc.setFont('helvetica', 'normal').setFontSize(size).setTextColor(...INK);
    const lines = doc.splitTextToSize(pdfText(t), W - 2 * M);
    ensure(lines.length * (size + 4));
    doc.text(lines, M, y);
    y += lines.length * (size + 4) + 4;
  };
  const table = (head: string[], body: string[][], rightCols: number[] = []) => {
    ensure(40 + Math.min(body.length, 3) * 18);
    autoTable(doc, {
      startY: y,
      head: [head.map(pdfText)],
      body: body.map((row) => row.map(pdfText)),
      margin: { left: M, right: M },
      styles: { font: 'helvetica', fontSize: 9, textColor: INK, cellPadding: 4 },
      headStyles: { fillColor: GREEN, textColor: [251, 247, 236], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 250, 245] },
      columnStyles: Object.fromEntries(rightCols.map((c) => [c, { halign: 'right' }])),
      rowPageBreak: 'avoid',
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
  };

  // Title block
  doc.setFillColor(...GREEN).rect(0, 0, W, 86, 'F');
  doc.setFont('helvetica', 'bold').setFontSize(20).setTextColor(251, 247, 236).text('Price It Right', M, 40);
  doc.setFont('helvetica', 'normal').setFontSize(11).text(pdfText(`${t('Business Report')} - ${t('Set your price. Know your costs. Maximize your profit.')}`), M, 62);
  y = 116;
  doc.setTextColor(...INK).setFont('helvetica', 'bold').setFontSize(14).text(pdfText(r.businessName), M, y);
  y += 18;
  paragraph(t('Category: {category}   |   Generated: {date}   |   All amounts in CAD', { category: r.category, date: r.generated }));
  if (r.isDemo) paragraph(t('This report uses fictional demo data.'), 9);

  heading(t('Products (expected monthly sales)'));
  table([t('Product'), t('Price'), t('Variable cost'), t('Expected units'), t('Revenue'), t('Contribution'), t('CM ratio')], r.products, [1, 2, 3, 4, 5, 6]);

  heading(t('Business at a glance'));
  table([t('Measure'), t('Amount (CAD)')], r.totals, [1]);

  // Simple bar chart of contribution margin by product
  if (r.chart.length > 0) {
    heading(t('Contribution margin by product'));
    const barH = 16;
    const gap = 8;
    const labelW = 130;
    const chartW = W - 2 * M - labelW - 80;
    const max = Math.max(1, ...r.chart.map((c) => Math.abs(c.value)));
    ensure(r.chart.length * (barH + gap) + 10);
    for (const c of r.chart) {
      doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(...INK);
      doc.text(pdfText(c.label).slice(0, 26), M, y + barH - 4);
      const w = (Math.abs(c.value) / max) * chartW;
      if (c.value >= 0) doc.setFillColor(103, 140, 102);
      else doc.setFillColor(168, 50, 79);
      doc.rect(M + labelW, y, Math.max(w, 1), barH, 'F');
      doc.text(pdfText(formatCAD(c.value)), M + labelW + w + 6, y + barH - 4);
      y += barH + gap;
    }
    y += 8;
  }

  heading(t('Break-even analysis'));
  r.breakEven.forEach((line) => paragraph(line));

  heading(t('Inventory summary (expected sales)'));
  if (r.inventory.length > 0) table([t('Item'), t('Available'), t('Required'), t('Remaining'), t('Status')], r.inventory, [1, 2, 3]);
  if (r.shortages.length > 0) {
    paragraph(t('Inventory shortages:'), 10);
    r.shortages.forEach((line) => paragraph(`- ${line}`, 9));
  }

  heading(t('Production planning'));
  r.production.forEach((line) => paragraph(line));

  if (r.scenario) {
    heading(t('Scenario comparison'));
    table([t('Metric'), t('Current plan'), t('Modified plan'), t('Difference')], r.scenario, [1, 2, 3]);
  }

  heading(t('Accounting assumptions and limitations'));
  r.assumptions.forEach((line) => paragraph(`- ${line}`, 9));

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(120, 130, 120);
    doc.text(pdfText(t('Price It Right - educational decision-support tool - page {page} of {pages}', { page: i, pages })), M, H - 24);
  }
  return doc;
}
