import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './state';

describe('choosing a business', () => {
  it('fills in that business’s fictional example values', () => {
    const s = reducer(initialState(), { type: 'select-business', id: 'nails' });
    expect(s.raw).toEqual({
      businessName: 'Nail Salon',
      sellingPrice: '45',
      variableCost: '12',
      fixedCosts: '2500',
      units: '150',
    });
  });
});

describe('reset to example values', () => {
  it('restores the selected business’s original values after edits', () => {
    let s = reducer(initialState(), { type: 'select-business', id: 'bakery' });
    s = reducer(s, { type: 'set-field', field: 'sellingPrice', value: 'oops' });
    s = reducer(s, { type: 'set-field', field: 'units', value: '9' });
    s = reducer(s, { type: 'set-what-if', value: '8' });
    s = reducer(s, { type: 'reset-example' });
    expect(s.raw.sellingPrice).toBe('5');
    expect(s.raw.units).toBe('500');
    expect(s.businessId).toBe('bakery');
    expect(s.whatIfRaw).toBeNull();
  });
});

describe('what-if scenario', () => {
  it('does not change the baseline price while experimenting', () => {
    const s = reducer(initialState(), { type: 'set-what-if', value: '7.25' });
    expect(s.raw.sellingPrice).toBe('6');
    expect(s.whatIfRaw).toBe('7.25');
  });

  it('Reset Scenario returns to the baseline price', () => {
    let s = reducer(initialState(), { type: 'set-what-if', value: '9' });
    s = reducer(s, { type: 'reset-what-if' });
    expect(s.whatIfRaw).toBeNull();
    expect(s.raw.sellingPrice).toBe('6');
  });

  it('only changes the baseline when the user applies the new price', () => {
    let s = reducer(initialState(), { type: 'set-what-if', value: '7.5' });
    s = reducer(s, { type: 'apply-what-if' });
    expect(s.raw.sellingPrice).toBe('7.50');
    expect(s.whatIfRaw).toBeNull();
  });

  it('ignores apply when the what-if price is invalid', () => {
    let s = reducer(initialState(), { type: 'set-what-if', value: 'abc' });
    s = reducer(s, { type: 'apply-what-if' });
    expect(s.raw.sellingPrice).toBe('6');
  });
});
