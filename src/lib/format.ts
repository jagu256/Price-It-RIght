/** Display helpers. All money is shown in Canadian dollars (CAD). */

const cadWhole = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const cadCents = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const plainNumber = new Intl.NumberFormat('en-CA', { maximumFractionDigits: 2 });
const compactNumber = new Intl.NumberFormat('en-CA', { notation: 'compact', maximumFractionDigits: 1 });

/** Rounds to the nearest cent and removes negative zero. */
export function roundCents(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** $1,800 for whole dollars, $1,800.50 when there are cents. */
export function formatCAD(value: number): string {
  const v = roundCents(value);
  const text = Number.isInteger(v) ? cadWhole.format(v) : cadCents.format(v);
  return text.replace('-', '−'); // typographic minus sign
}

/** Like formatCAD but always shows a leading + or − sign. */
export function formatSignedCAD(value: number): string {
  const v = roundCents(value);
  if (v > 0) return `+${formatCAD(v)}`;
  if (v < 0) return `−${formatCAD(-v)}`;
  return formatCAD(0);
}

export function formatNumber(value: number): string {
  return plainNumber.format(value);
}

export function formatPercent(value: number): string {
  const v = Math.round(value * 10) / 10;
  return `${Object.is(v, -0) ? 0 : v.toLocaleString('en-CA', { maximumFractionDigits: 1 })}%`;
}

/** Short axis labels for charts: $1.2K, $3M … */
export function formatCompactCAD(value: number): string {
  if (Math.abs(value) < 1000) return formatCAD(value);
  const sign = value < 0 ? '−' : '';
  return `${sign}$${compactNumber.format(Math.abs(value))}`;
}

export function formatCompactNumber(value: number): string {
  return Math.abs(value) < 1000 ? formatNumber(value) : compactNumber.format(value);
}

export function unitsLabel(count: number): string {
  return `${formatNumber(count)} ${count === 1 ? 'unit' : 'units'}`;
}
