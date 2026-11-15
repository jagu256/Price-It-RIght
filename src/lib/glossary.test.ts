import { describe, expect, it } from 'vitest';
import { GLOSSARY } from './glossary';

describe('glossary', () => {
  it('every entry has a term and a one-line definition', () => {
    for (const g of Object.values(GLOSSARY)) {
      expect(g.term.trim()).not.toBe('');
      expect(g.definition.trim().length).toBeGreaterThan(20);
      expect(g.definition).not.toContain('\n');
    }
  });

  it('no term is listed twice', () => {
    const terms = Object.values(GLOSSARY).map((g) => g.term.toLowerCase());
    expect(new Set(terms).size).toBe(terms.length);
  });
});
