import { describe, expect, it } from 'vitest';
import { calculate } from './accounting';
import { breakEvenSummary, marginOfSafetySummary, profitSummary } from './explain';

describe('plain-language explanations', () => {
  it('describes a profit', () => {
    const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 300 });
    expect(profitSummary(r)).toBe(
      'At your current price and expected sales volume, your business is projected to earn $400 in monthly operating profit.',
    );
    expect(breakEvenSummary(r)).toBe('Your business must sell at least 200 units per month to break even.');
  });

  it('describes a loss and the shortfall without recommending a price', () => {
    const r = calculate({ sellingPrice: 10, variableCost: 6, fixedCosts: 1000, units: 100 });
    expect(profitSummary(r)).toMatch(/operating loss of \$600/);
    expect(breakEvenSummary(r)).toMatch(/150 units short/);
    expect(profitSummary(r) + breakEvenSummary(r)).not.toMatch(/should|raise your price|ideal/i);
  });

  it('explains when no finite break-even point exists', () => {
    const r = calculate({ sellingPrice: 5, variableCost: 7, fixedCosts: 500, units: 100 });
    expect(breakEvenSummary(r)).toMatch(/finite break-even point cannot be achieved/);
    expect(marginOfSafetySummary(r)).toMatch(/not available/);
  });

  it('explains rounded-up break-even units', () => {
    const r = calculate({ sellingPrice: 5, variableCost: 2, fixedCosts: 1000, units: 400 });
    expect(breakEvenSummary(r)).toMatch(/at least 334 units/);
    expect(breakEvenSummary(r)).toMatch(/theoretical break-even point is 333.33 units/);
  });

  it('explains zero sales without undefined percentages', () => {
    const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 800, units: 0 });
    expect(profitSummary(r)).toMatch(/0 expected sales/);
    expect(marginOfSafetySummary(r)).toMatch(/can’t be calculated when projected revenue is \$0/);
  });

  it('explains zero fixed costs', () => {
    const r = calculate({ sellingPrice: 6, variableCost: 2, fixedCosts: 0, units: 10 });
    expect(breakEvenSummary(r)).toMatch(/breaks even at 0 units/);
  });
});
