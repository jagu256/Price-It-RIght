import { describe, expect, it } from 'vitest';
import { SECTIONS } from '../app/routes';
import { markTourDone, TOUR_KEY, TOUR_STEPS, tourDone } from './tour';

describe('guided tour', () => {
  it('every step points at a real section, starting at Home', () => {
    const ids = SECTIONS.map((s) => s.id as string).concat('home');
    for (const s of TOUR_STEPS) expect(ids).toContain(s.section);
    expect(TOUR_STEPS[0].section).toBe('home');
  });

  it('remembers that the tour was done', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(tourDone(storage)).toBe(false);
    markTourDone(storage);
    expect(store.get(TOUR_KEY)).toBe('yes');
    expect(tourDone(storage)).toBe(true);
  });

  it('never throws when storage is blocked or missing (the tour just shows again)', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(tourDone(blocked)).toBe(false);
    expect(() => markTourDone(blocked)).not.toThrow();
    expect(tourDone(undefined)).toBe(false);
  });
});
