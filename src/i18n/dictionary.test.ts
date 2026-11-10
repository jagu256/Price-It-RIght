import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FR } from './fr';
import { getLanguage, plural, setLanguage, t } from './i18n';
import { findTranslationKeys } from './scanKeys';

const keys = findTranslationKeys(join(__dirname, '..'));

describe('French dictionary', () => {
  it('finds the marked texts in the code', () => {
    expect(keys.size).toBeGreaterThan(50);
  });

  it('has a French translation for EVERY text marked in the code', () => {
    const missing = [...keys.entries()].filter(([k]) => FR[k] === undefined).map(([k, file]) => `${file.split(/[\\/]src[\\/]/)[1]}: ${k}`);
    expect(missing).toEqual([]);
  });

  it('every translation keeps the same {placeholders}', () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const wrong = Object.entries(FR).filter(([en, fr]) => names(en) !== names(fr)).map(([en]) => en);
    expect(wrong).toEqual([]);
  });

  it('has no empty translations', () => {
    expect(Object.entries(FR).filter(([, fr]) => fr.trim() === '').map(([en]) => en)).toEqual([]);
  });

  it('t() inserts values and falls back to English for unknown text', () => {
    const before = getLanguage();
    setLanguage('fr');
    expect(t('{n} units', { n: 5 })).toBe('5 unités');
    expect(plural(1, '{n} unit', '{n} units', { n: '1' })).toBe('1 unité');
    expect(plural(0, '{n} unit', '{n} units', { n: '0' })).toBe('0 unité'); // French: 0 is singular
    expect(t('Not in the dictionary')).toBe('Not in the dictionary');
    setLanguage('en');
    expect(plural(0, '{n} unit', '{n} units', { n: '0' })).toBe('0 units');
    setLanguage(before);
  });
});
