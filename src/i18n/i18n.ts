/**
 * English / Français.
 *
 * Every piece of on-screen text is written in English and passed through
 * `t()`. In French, `t()` looks the English text up in the ONE dictionary file
 * (`fr.ts`) and returns the translation. Values are inserted with {name}
 * placeholders, e.g. t + an English text containing {units}, with { units: '25' }.
 *
 * The current language is a simple module setting so the calculation and
 * formatting helpers (which are plain functions) can use it too. The app sets
 * it from the language switch and redraws.
 */
import { FR } from './fr';

export type Language = 'en' | 'fr';

let current: Language = 'en';
/** English texts asked for in French that have no translation (used by the tests). */
export const missingFrench = new Set<string>();

export function setLanguage(lang: Language) {
  current = lang;
}
export function getLanguage(): Language {
  return current;
}
/** 'en-CA' or 'fr-CA', for number and date formatting. */
export function locale(): 'en-CA' | 'fr-CA' {
  return current === 'fr' ? 'fr-CA' : 'en-CA';
}

export type Vars = Record<string, string | number>;

export function t(english: string, vars?: Vars): string {
  let text = english;
  if (current === 'fr') {
    const fr = FR[english];
    if (fr === undefined) missingFrench.add(english);
    else text = fr;
  }
  if (vars) text = text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
  return text;
}

/**
 * Marks English text kept in a data list (menu labels, glossary…) as needing a
 * translation. It returns the text unchanged; the screen calls t() on it when
 * showing it. The marker lets the dictionary test find every such text.
 */
export const tx = (english: string): string => english;

/**
 * Singular or plural. English: 1 → singular. French: 0 and 1 → singular
 * (« 0 unité », « 1 unité », « 2 unités »).
 */
export function plural(n: number, one: string, other: string, vars?: Vars): string {
  const singular = current === 'fr' ? Math.abs(n) < 2 : n === 1;
  return t(singular ? one : other, { n, ...vars });
}

/* ------------------------------------------------------------------ */
/* Remembering the choice (browser storage may be unavailable)         */
/* ------------------------------------------------------------------ */

export const LANGUAGE_KEY = 'price-it-right:language';

export function loadLanguage(): Language {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY) === 'fr' ? 'fr' : 'en';
  } catch {
    return 'en';
  }
}

export function saveLanguage(lang: Language): void {
  try {
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Storage blocked: the choice simply isn't remembered.
  }
}
