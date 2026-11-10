/**
 * Display helpers. All money is shown in Canadian dollars (CAD), using the
 * current language's conventions: $1,800.50 in English, 1 800,50 $ in French.
 */
import { locale, plural } from '../i18n/i18n';

type Formatters = { cadWhole: Intl.NumberFormat; cadCents: Intl.NumberFormat; plain: Intl.NumberFormat; compact: Intl.NumberFormat; percent: Intl.NumberFormat };
const cache = new Map<string, Formatters>();

function fmt(): Formatters {
  const loc = locale();
  let f = cache.get(loc);
  if (!f) {
    f = {
      cadWhole: new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      cadCents: new Intl.NumberFormat(loc, { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      plain: new Intl.NumberFormat(loc, { maximumFractionDigits: 2 }),
      compact: new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 }),
      percent: new Intl.NumberFormat(loc, { maximumFractionDigits: 1 }),
    };
    cache.set(loc, f);
  }
  return f;
}

/** Rounds to the nearest cent and removes negative zero. */
export function roundCents(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/** $1,800 / 1 800 $ for whole dollars; $1,800.50 / 1 800,50 $ when there are cents. */
export function formatCAD(value: number): string {
  const v = roundCents(value);
  const f = fmt();
  let text = Number.isInteger(v) ? f.cadWhole.format(v) : f.cadCents.format(v);
  // Some browsers write the French currency as "CA$"/"$ CA"; keep a plain $.
  text = text.replace('CA$', '$').replace('$ CA', '$').replace('$ CA', '$');
  return text.replace('-', '−'); // typographic minus sign
}

/** A dollar amount with a set number of decimals (e.g. an unrounded formula result: $16.2857). */
export function formatCADDecimals(value: number, decimals: number): string {
  const f = new Intl.NumberFormat(locale(), { style: 'currency', currency: 'CAD', minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return f.format(value).replace('CA$', '$').replace('$ CA', '$').replace('$ CA', '$').replace('-', '−');
}

/** Like formatCAD but always shows a leading + or − sign. */
export function formatSignedCAD(value: number): string {
  const v = roundCents(value);
  if (v > 0) return `+${formatCAD(v)}`;
  if (v < 0) return `−${formatCAD(-v)}`;
  return formatCAD(0);
}

export function formatNumber(value: number): string {
  return fmt().plain.format(value);
}

export function formatPercent(value: number): string {
  const v = Math.round(value * 10) / 10;
  const text = fmt().percent.format(Object.is(v, -0) ? 0 : v);
  return locale() === 'fr-CA' ? `${text} %` : `${text}%`;
}

/** Short axis labels for charts: $1.2K / 1,2 k$ … */
export function formatCompactCAD(value: number): string {
  if (Math.abs(value) < 1000) return formatCAD(value);
  const sign = value < 0 ? '−' : '';
  const n = fmt().compact.format(Math.abs(value));
  return locale() === 'fr-CA' ? `${sign}${n} $` : `${sign}$${n}`;
}

export function formatCompactNumber(value: number): string {
  return Math.abs(value) < 1000 ? formatNumber(value) : fmt().compact.format(value);
}

/** "1 unit", "300 units" / « 1 unité », « 300 unités » */
export function unitsLabel(count: number): string {
  return plural(count, '{n} unit', '{n} units', { n: formatNumber(count) });
}

/** A date such as "November 9, 2026" / « 9 novembre 2026 ». */
export function formatLongDate(d: Date): string {
  return d.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
}
