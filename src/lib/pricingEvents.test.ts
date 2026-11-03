import { describe, expect, it } from 'vitest';
import { CHALLENGES, EXPERT, intermediateDemand, startValues } from './challenges';
import { EVENTS, applyEvent, pickEvent } from './events';
import { buildModel } from './model';
import { extraUnitsOfProduct, goalProgress, planForTarget, requiredPrice, resolveScenario } from './pricing';
import { buildReport } from './report';
import { pdfText, renderReportPdf } from './reportPdf';
import { initialAppState } from './store';

const demo = () => buildModel(initialAppState('demo').business);

describe('what-if scenario', () => {
  it('compares the current and modified plans without changing the current one', () => {
    const m = demo();
    const coffee = m.products[0];
    const r = resolveScenario(m.products, 1500, { products: { [coffee.id]: { price: '7' } } });
    expect(r.changed).toBe(true);
    expect(r.summary!.totalRevenue).toBe(4200); // +300 coffees × $1
    expect(r.summary!.operatingProfit).toBe(1275);
    expect(m.summary!.operatingProfit).toBe(975);
  });
  it('reports invalid scenario values instead of calculating', () => {
    const m = demo();
    const r = resolveScenario(m.products, 1500, { fixedCosts: '-5', products: {} });
    expect(r.summary).toBeNull();
    expect(r.errors.fixedCosts).toMatch(/negative/);
  });
});

describe('💡 required price', () => {
  it('single product: VC + (fixed + target) ÷ units', () => {
    // $2 + ($800 + $400) ÷ 300 = $6.00
    expect(requiredPrice({ variableCost: 2, units: 300, fixedCosts: 800, targetProfit: 400, otherContribution: 0 })).toMatchObject({ status: 'ok', price: 6, profitAtPrice: 400 });
  });
  it('rounds UP to the next cent so the target is met', () => {
    // $2 + $1,000 ÷ 300 = $5.3333… → $5.34
    const r = requiredPrice({ variableCost: 2, units: 300, fixedCosts: 1000, targetProfit: 0, otherContribution: 0 });
    expect(r).toMatchObject({ status: 'ok', price: 5.34 });
    if (r.status === 'ok') expect(r.profitAtPrice).toBeGreaterThanOrEqual(0);
  });
  it('multi-product: uses contribution from the other products', () => {
    // Demo: coffee needed for $1,500 profit. Others contribute 375 + 500 + 400 = $1,275.
    // $2 + ($1,500 + $1,500 − $1,275) ÷ 300 = $7.75
    const r = requiredPrice({ variableCost: 2, units: 300, fixedCosts: 1500, targetProfit: 1500, otherContribution: 1275 });
    expect(r).toMatchObject({ status: 'ok', price: 7.75, profitAtPrice: 1500 });
  });
  it('handles zero expected sales and targets already met', () => {
    expect(requiredPrice({ variableCost: 2, units: 0, fixedCosts: 800, targetProfit: 0, otherContribution: 0 }).status).toBe('no-sales');
    expect(requiredPrice({ variableCost: 2, units: 10, fixedCosts: 100, targetProfit: 0, otherContribution: 5000 }).status).toBe('already-met');
    const below = requiredPrice({ variableCost: 2, units: 100, fixedCosts: 100, targetProfit: 0, otherContribution: 150 });
    expect(below).toMatchObject({ status: 'ok', price: 1.5, belowVariableCost: true });
  });
});

describe('🎯 profit goal tracker', () => {
  it('shows progress, the gap and extra contribution needed', () => {
    const g = goalProgress(975, 1500);
    expect(g).toMatchObject({ difference: -525, additionalCMRequired: 525, met: false });
    expect(g.progress).toBeCloseTo(0.65, 10);
    expect(goalProgress(1600, 1500)).toMatchObject({ met: true, progress: 1, additionalCMRequired: 0 });
    expect(goalProgress(-200, 0)).toMatchObject({ met: false, progress: 0 });
  });
  it('extra units of one product use THAT product’s margin (no identical-margin assumption)', () => {
    const m = demo();
    const [coffee, muffin] = m.products;
    expect(extraUnitsOfProduct(525, coffee)).toBe(132); // $525 ÷ $4 = 131.25 → 132
    expect(extraUnitsOfProduct(525, muffin)).toBe(210); // $525 ÷ $2.50
    expect(extraUnitsOfProduct(10, { ...coffee, price: 2 })).toBeNull();
  });
  it('plan at the current sales mix reaches the target', () => {
    const m = demo();
    const plan = planForTarget(m.products, 1500, 1500)!;
    const cm = plan.allocation.reduce((t, a) => {
      const p = m.products.find((x) => x.id === a.id)!;
      return t + a.units * (p.price - p.variableCost);
    }, 0);
    expect(cm).toBeGreaterThanOrEqual(3000);
  });
});

describe('🎲 surprise events', () => {
  const data = initialAppState('demo').business;
  it('supplier increase raises variable costs by 15 %', () => {
    const m = buildModel(applyEvent(data, 'supplier-increase', 15));
    expect(m.products.map((p) => p.variableCost)).toEqual([2.3, 1.73, 4.6, 1.15]);
  });
  it('rent increase adds $300 to fixed costs', () => {
    expect(buildModel(applyEvent(data, 'rent-increase', 300)).summary!.operatingProfit).toBe(675);
  });
  it('demand changes scale expected sales to whole units', () => {
    expect(buildModel(applyEvent(data, 'demand-up', 20)).products.map((p) => p.units)).toEqual([360, 180, 120, 240]);
    expect(buildModel(applyEvent(data, 'demand-down', 20)).products.map((p) => p.units)).toEqual([240, 120, 80, 160]);
  });
  it('inventory shortage cuts one item by 25 %', () => {
    const milk = data.inventory.find((i) => i.name === 'Milk')!;
    const after = applyEvent(data, 'inventory-shortage', 25, milk.id);
    expect(after.inventory.find((i) => i.id === milk.id)!.quantity).toBe('37.5');
    expect(after.inventory.filter((i) => i.id !== milk.id)).toEqual(data.inventory.filter((i) => i.id !== milk.id));
  });
  it('does not change the original data', () => {
    const before = JSON.stringify(data);
    applyEvent(data, 'supplier-increase', 15);
    expect(JSON.stringify(data)).toBe(before);
  });
  it('picks events from the list, skipping inventory events when there is no inventory', () => {
    expect(EVENTS.map((e) => e.id)).toContain(pickEvent(data, () => 0.5).event.id);
    expect(pickEvent({ ...data, inventory: [] }, () => 0.99).event.id).not.toBe('inventory-shortage');
  });
});

describe('🎮 challenges', () => {
  const [beginner, intermediate, expert] = CHALLENGES;
  it('beginner starts at a loss and can reach break-even', () => {
    expect(beginner.evaluate(startValues(beginner))).toMatchObject({ profit: -200, success: false });
    expect(beginner.evaluate({ price: 5, variableCost: 2.5, units: 400 })).toMatchObject({ profit: 0, success: true });
  });
  it('intermediate: losing $400, target $200 with price-sensitive demand', () => {
    expect(intermediate.evaluate(startValues(intermediate))).toMatchObject({ profit: -400, success: false });
    expect(intermediateDemand(9)).toBe(220);
    expect(intermediate.evaluate({ price: 9, variableCost: 2, units: 0 })).toMatchObject({ profit: 240, success: true }); // 7 × 220 − 1,300
    expect(intermediate.evaluate({ price: 8, variableCost: 2 }).success).toBe(false); // 6 × 240 − 1,300 = $140
  });
  it('expert: an achievable feasible plan succeeds; infeasible and invalid plans never do', () => {
    expect(expert.evaluate(startValues(expert))).toMatchObject({ profit: -165, success: false });
    // 200 cookies + 60 muffins: flour 16,000 g, butter 3,200 g, CM $550 → $0
    expect(expert.evaluate({ muffin: 60, croissant: 0, cookie: 200 })).toMatchObject({ valid: true, profit: 0, success: true });
    // Very profitable on paper but needs too much butter.
    const greedy = expert.evaluate({ muffin: 150, croissant: 120, cookie: 200 });
    expect(greedy.success).toBe(false);
    expect(greedy.errors.join(' ')).toMatch(/Not enough butter/);
    expect(expert.evaluate({ muffin: 60.5, croissant: 0, cookie: 200 }).success).toBe(false);
    expect(expert.evaluate({ muffin: 60, croissant: 0, cookie: 999 }).success).toBe(false);
    expect(EXPERT.products).toHaveLength(3);
  });
});

describe('📊 report', () => {
  it('contains the business numbers, inventory and assumptions', () => {
    const m = demo();
    const r = buildReport(m, null, new Date(2026, 10, 2))!;
    expect(r.totals).toContainEqual(['Total monthly revenue (expected)', '$3,900']);
    expect(r.totals).toContainEqual(['Projected operating profit', '$975']);
    expect(r.generated).toBe('November 2, 2026');
    expect(r.isDemo).toBe(true);
    expect(r.shortages.join(' ')).toMatch(/Milk: an additional 10 litres/);
    expect(r.assumptions.join(' ')).toMatch(/not net income/);
    expect(r.scenario).toBeNull();
  });
  it('renders a PDF', () => {
    const r = buildReport(demo(), null)!;
    const bytes = new Uint8Array(renderReportPdf(r).output('arraybuffer'));
    expect(String.fromCharCode(...bytes.slice(0, 5))).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(3000);
  });
  it('removes characters the PDF fonts cannot show', () => {
    expect(pdfText('−$600 – “ok” ☕')).toBe('-$600 - "ok" ');
  });
});
