import { describe, expect, it } from 'vitest';
import { applyDisplay, DEFAULT_DISPLAY, DISPLAY_KEY, lightWhilePrinting, loadDisplay, saveDisplay } from './display';

const memory = () => {
  const m = new Map<string, string>();
  return { m, getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe('display settings (larger text, high contrast)', () => {
  it('starts normal, then remembers the choice', () => {
    const s = memory();
    expect(loadDisplay(s)).toEqual(DEFAULT_DISPLAY);
    saveDisplay({ largeText: true, highContrast: false, darkMode: false }, s);
    expect(s.m.get(DISPLAY_KEY)).toBe('{"largeText":true,"highContrast":false,"darkMode":false}');
    expect(loadDisplay(s)).toEqual({ largeText: true, highContrast: false, darkMode: false });
  });

  it('a damaged or odd saved value falls back to normal (never throws)', () => {
    for (const bad of ['not json', '{"largeText":"yes"}', 'null', '[]']) {
      const s = memory();
      s.m.set(DISPLAY_KEY, bad);
      expect(loadDisplay(s)).toEqual(DEFAULT_DISPLAY);
    }
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(loadDisplay(blocked)).toEqual(DEFAULT_DISPLAY);
    expect(() => saveDisplay({ largeText: true, highContrast: true, darkMode: true }, blocked)).not.toThrow();
  });

  it('applies and removes the page attributes', () => {
    const root = document.createElement('html');
    applyDisplay({ largeText: true, highContrast: true, darkMode: true }, root);
    expect([root.getAttribute('data-text'), root.getAttribute('data-contrast'), root.getAttribute('data-theme')]).toEqual(['large', 'high', 'dark']);
    applyDisplay(DEFAULT_DISPLAY, root);
    expect([root.hasAttribute('data-text'), root.hasAttribute('data-contrast'), root.hasAttribute('data-theme')]).toEqual([false, false, false]);
  });

  it('prints in light colours and goes back to dark afterwards', () => {
    const root = document.createElement('html');
    root.setAttribute('data-theme', 'dark');
    const stop = lightWhilePrinting(root);
    window.dispatchEvent(new Event('beforeprint'));
    expect(root.hasAttribute('data-theme')).toBe(false);
    window.dispatchEvent(new Event('afterprint'));
    expect(root.getAttribute('data-theme')).toBe('dark');
    stop();
  });
});
