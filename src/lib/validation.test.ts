import { describe, expect, it } from 'vitest';
import { parseMoney, parseUnits, toInputText, validateInputs } from './validation';

const valid = { businessName: 'Test', sellingPrice: '6', variableCost: '2', fixedCosts: '800', units: '300' };

describe('parseMoney', () => {
  it('accepts plain numbers, cents, a $ sign and thousands commas', () => {
    expect(parseMoney('6', 'sellingPrice')).toEqual({ ok: true, value: 6 });
    expect(parseMoney('6.50', 'sellingPrice')).toEqual({ ok: true, value: 6.5 });
    expect(parseMoney('$800', 'fixedCosts')).toEqual({ ok: true, value: 800 });
    expect(parseMoney('1,250.75', 'fixedCosts')).toEqual({ ok: true, value: 1250.75 });
    expect(parseMoney(' 0 ', 'variableCost')).toEqual({ ok: true, value: 0 });
  });

  it('rejects empty input instead of treating it as zero', () => {
    const r = parseMoney('', 'sellingPrice');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/enter the selling price/i);
    expect(parseMoney('   ', 'fixedCosts').ok).toBe(false);
  });

  it('rejects negative values', () => {
    for (const s of ['-5', '−5', '$-5']) {
      const r = parseMoney(s, 'variableCost');
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toMatch(/can't be negative/);
    }
  });

  it('rejects letters and other non-numeric text', () => {
    for (const s of ['abc', '6a', 'five', '6..5', '1e5', '.', '$']) {
      const r = parseMoney(s, 'sellingPrice');
      expect(r.ok, s).toBe(false);
    }
  });

  it('rejects more than two decimal places', () => {
    const r = parseMoney('6.555', 'sellingPrice');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/2 decimal places/);
  });

  it('rejects badly placed commas', () => {
    expect(parseMoney('1,00', 'fixedCosts').ok).toBe(false);
  });

  it('rejects numbers above the supported maximum without crashing', () => {
    const r = parseMoney('99999999999999999999999', 'fixedCosts');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/larger than this simulator supports/);
  });
});

describe('parseUnits', () => {
  it('accepts whole numbers including zero', () => {
    expect(parseUnits('300')).toEqual({ ok: true, value: 300 });
    expect(parseUnits('1,200')).toEqual({ ok: true, value: 1200 });
    expect(parseUnits('0')).toEqual({ ok: true, value: 0 });
  });

  it('rejects fractions of a unit', () => {
    const r = parseUnits('12.5');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/whole number/);
  });

  it('rejects empty, negative and non-numeric values', () => {
    expect(parseUnits('').ok).toBe(false);
    expect(parseUnits('-3').ok).toBe(false);
    expect(parseUnits('ten').ok).toBe(false);
    expect(parseUnits('$10').ok).toBe(false);
  });
});

describe('validateInputs', () => {
  it('returns numbers when every field is valid', () => {
    expect(validateInputs(valid)).toEqual({
      values: { sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 },
      errors: {},
    });
  });

  it('returns no values (not zeros) when any field is empty or invalid', () => {
    const r = validateInputs({ ...valid, sellingPrice: '', units: 'lots' });
    expect(r.values).toBeNull();
    expect(Object.keys(r.errors).sort()).toEqual(['sellingPrice', 'units']);
  });

  it('allows a selling price below variable cost (handled by the calculations)', () => {
    expect(validateInputs({ ...valid, sellingPrice: '1' }).values).not.toBeNull();
  });
});

describe('toInputText', () => {
  it('formats numbers for input boxes', () => {
    expect(toInputText(6)).toBe('6');
    expect(toInputText(6.5)).toBe('6.50');
    expect(toInputText(6.050000000001)).toBe('6.05');
  });
});
