import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent, { PointerEventsCheckLevel } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { STORAGE_KEY, parseSavedBusiness, serializeBusiness } from './lib/saveWork';
import { initialAppState } from './lib/store';

// Wrap the PDF renderer so the test can see the save call without a real download.
const pdfSaves: string[] = [];
vi.mock('./lib/reportPdf', async (importOriginal) => {
  const real = await importOriginal<typeof import('./lib/reportPdf')>();
  return {
    ...real,
    renderReportPdf: (r: Parameters<typeof real.renderReportPdf>[0]) => {
      const doc = real.renderReportPdf(r);
      const bytes = doc.output('arraybuffer').byteLength;
      doc.save = ((name: string) => {
        pdfSaves.push(`${name}:${bytes > 3000 ? 'ok' : 'tiny'}`);
        return doc;
      }) as never;
      return doc;
    },
  };
});

// Capture downloads (the test browser can't save files) so tests can read them back.
const downloads: { name: string; blob: Blob }[] = [];
vi.mock('./lib/templates', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/templates')>()),
  downloadBlob: (blob: Blob, name: string) => void downloads.push({ name, blob }),
}));

// The page is large (every section stays mounted), so skip user-event's per-keystroke CSS
// pointer-events check and the pause between keys. Assertions are unchanged.
const FAST_USER = { pointerEventsCheck: PointerEventsCheckLevel.Never, delay: null } as const;

function setup(hash = 'my-business', business: Parameters<typeof initialAppState>[0] = 'coffee', options: Parameters<typeof userEvent.setup>[0] = {}) {
  window.location.hash = hash;
  const user = userEvent.setup({ ...FAST_USER, ...options });
  const view = render(<App initial={initialAppState(business)} />);
  return { user, unmount: view.unmount };
}
const panel = (id: string) => document.getElementById(`panel-${id}`)! as HTMLElement;
const go = async (id: string) => {
  await act(async () => {
    window.location.hash = id;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};
/** The confirmation dialog. Found directly: role searches over the whole (large) page are slow in the test browser. */
const confirmDialog = () => {
  const d = document.querySelector<HTMLElement>('[role="alertdialog"]');
  if (!d) throw new Error('No confirmation dialog is open.');
  return d;
};

afterEach(() => {
  window.location.hash = '';
  window.localStorage.clear();
  downloads.length = 0;
  vi.restoreAllMocks();
});

describe('home page', () => {
  it('shows the name, tagline, description and both buttons', () => {
    setup('home');
    expect(screen.getByRole('heading', { level: 1, name: 'Price It Right' })).toBeInTheDocument();
    expect(screen.getAllByText('Set your price. Know your costs. Maximize your profit.').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Start My Business/ })).toHaveAttribute('href', '#my-business');
    expect(screen.getByRole('button', { name: /Try a Demo Business/ })).toBeInTheDocument();
  });

  it('“Try a Demo Business” loads the fictional demo and its verified totals', async () => {
    const { user } = setup('home');
    await user.click(screen.getByRole('button', { name: /Try a Demo Business/ }));
    await go('dashboard');
    const dash = within(panel('dashboard'));
    expect(dash.getByRole('heading', { name: 'Total Monthly Revenue' }).closest('article')).toHaveTextContent('$3,900');
    expect(dash.getByRole('heading', { name: 'Total Variable Costs' }).closest('article')).toHaveTextContent('$1,425');
    expect(dash.getByRole('heading', { name: 'Total Contribution Margin' }).closest('article')).toHaveTextContent('$2,475');
    expect(dash.getByRole('heading', { name: 'Projected Operating Profit' }).closest('article')).toHaveTextContent('$975');
    expect(screen.getAllByText('Fictional demo').length).toBeGreaterThan(0);
  });
});

describe('show the math', () => {
  it('reveals the formula with the demo café’s numbers, matching the card, and hides again', async () => {
    const { user } = setup('dashboard', 'demo');
    const dash = within(panel('dashboard'));
    const card = dash.getByRole('heading', { name: 'Projected Operating Profit' }).closest('article')!;
    expect(within(card).queryByRole('region')).not.toBeInTheDocument();

    await user.click(dash.getByRole('button', { name: 'Show the math for Projected Operating Profit' }));
    const math = within(card).getByRole('region', { name: 'The math for Projected Operating Profit' });
    expect(math).toHaveTextContent('Operating profit = total contribution margin − fixed costs');
    expect(math).toHaveTextContent('$2,475 − $1,500 = $975');
    // The explanation ends in the same figure the card displays.
    const displayed = card.querySelector('p.font-display')!.textContent!;
    expect(displayed).toBe('$975');
    expect(math.textContent).toContain(`= ${displayed}`);

    await user.click(dash.getByRole('button', { name: 'Hide the math for Projected Operating Profit' }));
    expect(within(card).queryByRole('region')).not.toBeInTheDocument();
  });

  it('explains break-even on the dashboard and the required price in the Pricing Lab', async () => {
    const { user } = setup('dashboard', 'demo');
    const dash = within(panel('dashboard'));
    await user.click(dash.getByRole('button', { name: 'Show the math for break-even' }));
    expect(dash.getByRole('region', { name: 'The math for break-even' })).toHaveTextContent('$1,500 ÷ ($2,475 ÷ 750) = 454.55, rounded UP to 455 units');

    await go('pricing');
    const lab = within(panel('pricing'));
    const target = lab.getByLabelText('Desired monthly operating profit');
    await user.clear(target);
    await user.type(target, '1500');
    await user.click(lab.getByRole('button', { name: 'Show the math for the minimum calculated price' }));
    expect(lab.getByRole('region', { name: 'The math for the minimum calculated price' })).toHaveTextContent('$2 + ($1,500 + $1,500 − $1,275) ÷ 300 = $7.75');
  });
});

describe('sensitivity analysis', () => {
  it('shows ±10% results and DOL for the demo café, and “Not meaningful” for a loss', async () => {
    const { user } = setup('dashboard', 'demo');
    const dash = within(panel('dashboard'));
    const section = within(dash.getByRole('heading', { name: /Sensitivity analysis/ }).closest('section')!);
    const rowOf = (name: string) => section.getByRole('rowheader', { name }).closest('tr')!;
    expect(rowOf('Selling prices')).toHaveTextContent('$1,365');
    expect(rowOf('Selling prices')).toHaveTextContent('+$390');
    expect(rowOf('Variable costs')).toHaveTextContent('$832.50');
    expect(rowOf('Sales volume (same mix)')).toHaveTextContent('$1,222.50');
    expect(rowOf('Sales volume (same mix)')).toHaveTextContent('+25.4%');
    expect(rowOf('Fixed costs')).toHaveTextContent('$825');
    expect(section.getByText('Degree of operating leverage (DOL)').parentElement).toHaveTextContent('2.54');

    await user.click(section.getByRole('button', { name: 'Show the math for degree of operating leverage' }));
    expect(section.getByRole('region', { name: 'The math for degree of operating leverage' })).toHaveTextContent('$2,475 ÷ $975 = 2.54');

    await go('my-business');
    const fixed = within(panel('my-business')).getByLabelText('Monthly fixed costs (whole business)');
    await user.clear(fixed);
    await user.type(fixed, '3000');
    await go('dashboard');
    // The dashboard redrew (it pauses while a field is blank), so look the section up again.
    const after = within(dash.getByRole('heading', { name: /Sensitivity analysis/ }).closest('section')!);
    expect(after.getByText('Not meaningful')).toBeInTheDocument();
    expect(after.getByText(/The business has an operating loss/)).toBeInTheDocument();
  });
});

describe('after-tax target profit', () => {
  it('turns an after-tax target into a pre-tax target and feeds it to the price and goal tools', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    expect(lab.queryByLabelText('Income tax rate (%)')).not.toBeInTheDocument(); // off by default
    await user.click(lab.getByRole('checkbox', { name: /after-tax target/ }));
    const target = lab.getByLabelText('Target monthly profit AFTER tax');
    await user.clear(target);
    await user.type(target, '1000');
    await user.type(lab.getByLabelText('Income tax rate (%)'), '20');

    const box = lab.getByText('Required pre-tax operating profit').parentElement!;
    expect(box).toHaveTextContent('$1,250');
    expect(lab.getByText('Estimated tax on current profit').parentElement).toHaveTextContent('$195');
    expect(lab.getByText('After-tax operating profit (current plan)').parentElement).toHaveTextContent('$780');
    expect(lab.getByText(/Simplified estimate – not tax advice/)).toBeInTheDocument();

    // Both tools now use $1,250 (pre-tax). Coffee: $2 + ($1,500 + $1,250 − $1,275) ÷ 300 = $6.9167 → $6.92
    expect(lab.getByLabelText('Desired monthly operating profit (pre-tax)')).toHaveValue('1250');
    expect(lab.getByText('Minimum calculated price').parentElement).toHaveTextContent('$6.92');
    expect(lab.getByLabelText('Target monthly operating profit (pre-tax)')).toHaveValue('1250');
    expect(lab.getByText('Difference from target').parentElement).toHaveTextContent('−$275');

    // An invalid rate is shown, not turned into 0, and the tools go back to their own targets.
    const rate = lab.getByLabelText('Income tax rate (%)');
    await user.clear(rate);
    await user.type(rate, '120');
    expect(lab.getByText('The tax rate must be between 0 and 100 %.')).toBeInTheDocument();
    expect(lab.getByLabelText('Desired monthly operating profit')).toHaveValue('500');
  });
});

describe('price-sensitive demand (optional)', () => {
  it('is off by default, finds the best price by checking every cent, and can try it in the What-If plan', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    const whatIf = within(lab.getByRole('heading', { name: /What-If Pricing Simulator/ }).closest('section')!);
    expect(whatIf.queryByText('Best price under this assumption only')).not.toBeInTheDocument();
    expect(whatIf.queryByLabelText(/For every \$1 change in price/)).not.toBeInTheDocument();

    await user.click(whatIf.getByRole('checkbox', { name: /customers react to the price of Coffee/ }));
    await user.type(whatIf.getByLabelText(/For every \$1 change in price/), '20');
    const best = whatIf.getByTestId('whatif-demand-best');
    // 300 coffees at $6, 20 fewer per $1: $11.50 sells 190 → (11.50 − 2) × 190 + $1,275 − $1,500 = $1,580
    expect(best).toHaveTextContent('$11.50');
    expect(best).toHaveTextContent('190 units');
    expect(best).toHaveTextContent('$1,580');
    expect(best).toHaveTextContent('checking every cent from $0 to $21');
    expect(whatIf.getByRole('img', { name: /operating profit against the price of Coffee/ })).toBeInTheDocument();

    await user.click(whatIf.getByRole('button', { name: /Try \$11\.50 \(190 units\) in the modified plan/ }));
    expect(lab.getByLabelText('Modified price for Coffee')).toHaveValue('11.50');
    expect(lab.getByLabelText('Modified expected sales for Coffee')).toHaveValue('190');
    expect(lab.getByRole('rowheader', { name: 'Operating profit' }).closest('tr')).toHaveTextContent('$1,580');
    // The business itself is unchanged until Apply Changes is confirmed.
    expect(within(panel('my-business')).getByLabelText('Selling price per unit for Coffee')).toHaveValue('6');
  });

  it('can also be switched on in the price assistant, and rejects a negative number', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    const assistant = within(lab.getByRole('heading', { name: /What Price Should I Charge/ }).closest('section')!);
    await user.click(assistant.getByRole('checkbox', { name: /customers react to the price of Coffee/ }));
    const x = assistant.getByLabelText(/For every \$1 change in price/);
    await user.type(x, '-5');
    expect(assistant.getByText(/the direction is always opposite to the price/)).toBeInTheDocument();
    await user.clear(x);
    await user.type(x, '20');
    expect(assistant.getByTestId('sp-demand-best')).toHaveTextContent('$11.50');
    expect(assistant.getByText(/Prices that reach your \$500 target under this assumption/)).toBeInTheDocument();
  });
});

describe('decisions', () => {
  it('special order: shows incremental profit when stock covers it, and “not achievable” when it doesn’t', async () => {
    const { user } = setup('decisions'); // fictional Coffee Shop example
    const dec = within(panel('decisions'));
    const productSelect = dec.getByLabelText('Product');
    await user.selectOptions(productSelect, within(productSelect).getByRole('option', { name: 'Muffin' }));
    const units = dec.getByLabelText('Order quantity (units)');
    await user.clear(units);
    await user.type(units, '10');
    await user.type(dec.getByLabelText('Offered price per unit'), '3');
    // (3 − 1.50) × 10 = $15; 160 muffins use 16 kg of 20 kg flour and 4.8 kg of 5 kg sugar.
    expect(dec.getByText('Incremental profit from this order').parentElement).toHaveTextContent('+$15');
    expect(dec.getByText('Inventory check: covered')).toBeInTheDocument();

    await user.clear(units);
    await user.type(units, '20');
    // 170 muffins × 30 g = 5,100 g sugar, only 5,000 g available.
    const alert = dec.getByRole('alert');
    expect(alert).toHaveTextContent('Not achievable with your current inventory');
    expect(alert).toHaveTextContent('Sugar: 100 grams short');
    expect(dec.queryByText('Incremental profit from this order')).not.toBeInTheDocument();

    // Losing 10 regular muffin sales frees enough sugar: (3 − 1.50) × 20 − (4 − 1.50) × 10 = $30 − $25 = +$5.
    await user.click(dec.getByRole('checkbox', { name: /losing some regular sales/ }));
    const lost = dec.getByLabelText('Regular sales of Muffin lost (units)');
    await user.clear(lost);
    await user.type(lost, '10');
    expect(dec.getByText('Incremental profit from this order').parentElement).toHaveTextContent('+$5');
  });

  it('make or buy: compares relevant costs and shows unavoidable fixed costs as irrelevant', async () => {
    const { user } = setup('decisions');
    const dec = within(panel('decisions'));
    const fill = async (label: string, value: string) => {
      const f = dec.getByLabelText(label);
      await user.clear(f);
      await user.type(f, value);
    };
    await fill('Units needed', '1000');
    await fill('Supplier’s price per unit (buy)', '5');
    await fill('Variable cost to make one unit', '3.50');
    await fill('Avoidable fixed costs', '1000');
    await fill('Unavoidable fixed costs', '2000');
    await fill('Opportunity cost (optional)', '300');
    expect(dec.getByText('Make it')).toBeInTheDocument();
    expect(dec.getByText('Making costs $200 less than buying.')).toBeInTheDocument();
    const totals = dec.getByRole('rowheader', { name: 'Total relevant cost' }).closest('tr')!;
    expect(totals).toHaveTextContent('$4,800');
    expect(totals).toHaveTextContent('$5,000');
    expect(dec.getByRole('rowheader', { name: /Unavoidable fixed costs – irrelevant/ })).toBeInTheDocument();
    expect(dec.getByText(/depends on qualitative factors too/)).toBeInTheDocument();
  });
});

describe('Live profit bar', () => {
  it('updates as you type in My Business, and pauses (never shows 0) when a value is invalid', async () => {
    const { user } = setup('my-business', 'demo');
    const mb = within(panel('my-business'));
    const bar = () => mb.getByRole('complementary', { name: 'Live results' });
    expect(bar()).toHaveTextContent('Revenue $3,900');
    expect(bar()).toHaveTextContent('Operating profit $975');

    const price = mb.getByLabelText('Selling price per unit for Coffee');
    await user.clear(price);
    await user.type(price, '7'); // +$1 × 300
    expect(bar()).toHaveTextContent('Revenue $4,200');
    expect(bar()).toHaveTextContent('Operating profit $1,275');

    await user.clear(price);
    await user.type(price, 'abc');
    expect(bar()).toHaveTextContent('Fix 1 highlighted field to see your results.');
    expect(bar()).not.toHaveTextContent('$');

    const fixed = document.getElementById('fixed-costs') as HTMLInputElement;
    await user.clear(fixed);
    await user.type(fixed, '-5');
    expect(bar()).toHaveTextContent('Fix 2 highlighted fields to see your results.');

    await user.clear(price);
    await user.type(price, '1');
    await user.clear(fixed);
    await user.type(fixed, '1500'); // Coffee CM now −$1 × 300 → profit $975 − $1,500 = −$525
    expect(bar()).toHaveTextContent('Operating loss −$525');
    expect(bar().querySelector('a')).toHaveAttribute('href', '#dashboard');
  });
});

describe('Term tooltips', () => {
  it('shows a one-line definition when the ⓘ next to a term is tapped, and closes on a second tap, Escape or a click elsewhere', async () => {
    const { user } = setup('dashboard', 'demo');
    const dash = within(panel('dashboard'));
    const tip = dash.getByRole('button', { name: 'What is “Contribution margin”?' });
    expect(tip).toHaveAttribute('aria-expanded', 'false');
    await user.click(tip);
    expect(tip).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('note')).toHaveTextContent('Contribution margin: Selling price − variable cost.');
    await user.click(tip);
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await user.click(dash.getByRole('button', { name: 'What is “Operating profit”?' }));
    expect(screen.getByRole('note')).toHaveTextContent('It is not net income');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('note')).not.toBeInTheDocument();

    await user.click(dash.getByRole('button', { name: 'What is “Margin of safety”?' }));
    expect(screen.getByRole('note')).toBeInTheDocument();
    await user.click(dash.getByRole('heading', { name: /Your Business at a Glance/ }));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
    // Headings keep their own names (the ⓘ sits next to them, not inside).
    expect(dash.getByRole('heading', { name: 'Projected Operating Profit' })).toBeInTheDocument();
  });
});

describe('Guided tour', () => {
  const tourCard = () => screen.queryByRole('dialog', { name: /Welcome to Price It Right|\d\. / });
  const navLink = (id: string) => document.querySelector(`nav a[href="#${id}"]`)!;

  it('opens on a first visit, walks through the sections highlighting each tab, and can be skipped', async () => {
    window.location.hash = 'home';
    const user = userEvent.setup(FAST_USER);
    const view = render(<App initial={initialAppState('demo')} autoTour />);
    const card = within(tourCard()!);
    expect(card.getByText('Tour – step 1 of 8')).toBeInTheDocument();

    await user.click(card.getByRole('button', { name: /Next/ }));
    expect(card.getByRole('heading', { name: '1. Start with your business' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#my-business');
    expect(navLink('my-business')).toHaveClass('tour-highlight');

    await user.click(card.getByRole('button', { name: /Next/ }));
    expect(window.location.hash).toBe('#dashboard');
    expect(navLink('my-business')).not.toHaveClass('tour-highlight');
    await user.click(card.getByRole('button', { name: /Back/ }));
    expect(window.location.hash).toBe('#my-business');

    await user.click(card.getByRole('button', { name: 'Skip tour' }));
    expect(tourCard()).not.toBeInTheDocument();
    expect(navLink('my-business')).not.toHaveClass('tour-highlight');
    expect(window.localStorage.getItem('price-it-right:tour-done')).toBe('yes');

    // Not shown again on the next visit…
    view.unmount();
    render(<App initial={initialAppState('demo')} autoTour />);
    expect(tourCard()).not.toBeInTheDocument();
    // …but Home can restart it, and Escape closes it.
    await go('home');
    await user.click(within(panel('home')).getByRole('button', { name: /Take the tour/ }));
    expect(tourCard()).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(tourCard()).not.toBeInTheDocument();
  });

  it('goes through all 8 steps and finishes', async () => {
    window.location.hash = 'home';
    const user = userEvent.setup(FAST_USER);
    render(<App initial={initialAppState('demo')} autoTour />);
    for (let i = 0; i < 7; i++) await user.click(within(tourCard()!).getByRole('button', { name: /Next/ }));
    expect(window.location.hash).toBe('#report');
    await user.click(within(tourCard()!).getByRole('button', { name: 'Finish' }));
    expect(tourCard()).not.toBeInTheDocument();
  });
});

describe('Step fixed costs', () => {
  it('adds a +$500 step above 600 units: break-even 455, again at 607, expected profit $475', async () => {
    const { user } = setup('dashboard', 'demo');
    const sec = within(within(panel('dashboard')).getByRole('heading', { name: 'Step fixed costs (relevant range)' }).closest('section')!);
    await user.click(sec.getByRole('button', { name: /Add a step/ }));
    const above = sec.getByLabelText('Step 1: above how many units per month');
    await user.clear(above);
    await user.type(above, '600');
    const inc = sec.getByLabelText('Step 1: extra fixed costs per month');
    await user.clear(inc);
    await user.type(inc, '500');
    expect(sec.getByRole('rowheader', { name: '0 to 600' }).closest('tr')).toHaveTextContent('455 units');
    const upper = sec.getByRole('rowheader', { name: '601 and above' }).closest('tr')!;
    expect(upper).toHaveTextContent('$2,000');
    expect(upper).toHaveTextContent('607 units');
    expect(sec.getByText(/At your expected 750 units/).parentElement).toHaveTextContent('$475');
    expect(sec.getByText(/profit can fall back below zero/)).toBeInTheDocument();

    // Invalid → results pause (never 0); removing the step brings back one range.
    await user.clear(inc);
    await user.type(inc, 'abc');
    expect(sec.getByText('Fix the highlighted steps to see the results.')).toBeInTheDocument();
    await user.click(sec.getByRole('button', { name: 'Remove step 1' }));
    expect(sec.getByText(/No steps yet/)).toBeInTheDocument();
    expect(sec.getByRole('rowheader', { name: '0 and above' }).closest('tr')).toHaveTextContent('455 units');
  });
});

describe('Save and compare scenarios', () => {
  it('saves two What-If plans, compares them, loads one back and deletes one after confirming', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    const sec = within(lab.getByRole('heading', { name: 'Save and compare scenarios' }).closest('section')!);
    expect(sec.getByRole('button', { name: /Save this scenario/ })).toBeDisabled();

    const price = lab.getByLabelText('Modified price for Coffee');
    await user.clear(price);
    await user.type(price, '7'); // +$1 × 300 = +$300 → $1,275
    await user.type(sec.getByLabelText('Scenario name'), 'Coffee $7');
    await user.click(sec.getByRole('button', { name: /Save this scenario/ }));

    await user.click(lab.getByRole('button', { name: /Reset Scenario/ }));
    const fixed = lab.getByLabelText('Modified monthly fixed costs');
    await user.clear(fixed);
    await user.type(fixed, '1300'); // → $1,175
    await user.click(sec.getByRole('button', { name: /Save this scenario/ })); // no name → "Scenario 2"

    const header = sec.getByRole('columnheader', { name: /Coffee \$7/ });
    expect(header).toHaveTextContent('Highest profit of these');
    expect(sec.getByRole('columnheader', { name: /Scenario 2/ })).not.toHaveTextContent('Highest');
    const profitRow = sec.getByRole('rowheader', { name: 'Operating profit' }).closest('tr')!;
    expect(profitRow).toHaveTextContent('$975');
    expect(profitRow).toHaveTextContent('$1,275');
    expect(profitRow).toHaveTextContent('$1,175');
    expect(sec.getByRole('rowheader', { name: 'Change vs current plan' }).closest('tr')).toHaveTextContent('+$300');

    await user.click(sec.getByRole('button', { name: 'Load “Coffee $7” into the What-If simulator' }));
    expect(lab.getByLabelText('Modified price for Coffee')).toHaveValue('7');
    expect(lab.getByLabelText('Modified monthly fixed costs')).toHaveValue('1500');

    await user.click(sec.getByRole('button', { name: 'Delete “Scenario 2”' }));
    const dialog = document.querySelector('[role="dialog"], [role="alertdialog"]') as HTMLElement;
    await user.click(within(dialog).getByRole('button', { name: 'Delete scenario' }));
    expect(sec.queryByRole('columnheader', { name: /Scenario 2/ })).not.toBeInTheDocument();
    // The business itself never changed.
    expect(within(panel('dashboard')).getByRole('heading', { name: 'Projected Operating Profit', hidden: true }).closest('article')).toHaveTextContent('$975');
  });
});

describe('Cost-plus pricing helper', () => {
  it('prices Coffee ($2 cost) by markup and margin and can try the price in the What-If plan', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    const sec = within(lab.getByRole('heading', { name: 'Cost-plus pricing helper' }).closest('section')!);
    // Default: 50 % markup → $3.00, a 33.3 % margin; profit 975 − (6 − 3) × 300 = $75.
    expect(sec.getByText('Cost-plus price').parentElement).toHaveTextContent('$3.00');
    expect(sec.getByText('A 50% markup on cost is the same as a 33.3% margin on price.')).toBeInTheDocument();
    expect(sec.getByText('Operating profit at this price').parentElement).toHaveTextContent('$75');

    await user.click(sec.getByRole('radio', { name: 'Margin on price' }));
    expect(sec.getByText('Cost-plus price').parentElement).toHaveTextContent('$4.00');
    expect(sec.getByText('Operating profit at this price').parentElement).toHaveTextContent('−$600 vs now');

    await user.click(sec.getByRole('button', { name: 'Try $4.00 in the What-If simulator' }));
    expect(lab.getByLabelText('Modified price for Coffee')).toHaveValue('4');
    // Only an experiment: the business (dashboard, a hidden tab here) still shows $975.
    expect(within(panel('dashboard')).getByRole('heading', { name: 'Projected Operating Profit', hidden: true }).closest('article')).toHaveTextContent('$975');

    const rate = sec.getByLabelText('Target margin %');
    await user.clear(rate);
    await user.type(rate, '100');
    expect(sec.getByText(/A margin must be less than 100 %/)).toBeInTheDocument();
    expect(sec.queryByText('Cost-plus price')).not.toBeInTheDocument();
  });
});

describe('What should I buy?', () => {
  it('lists milk $20 + butter $11.25 = $31.25 for the demo, then adds a buffer and pack sizes', async () => {
    const { user } = setup('inventory', 'demo');
    const sec = within(within(panel('inventory')).getByRole('heading', { name: 'What should I buy?' }).closest('section')!);
    const row = (name: string) => sec.getByRole('rowheader', { name }).closest('tr')!;
    expect(row('Milk')).toHaveTextContent('$20');
    expect(row('Butter')).toHaveTextContent('$11.25');
    expect(row('Total estimated purchase cost')).toHaveTextContent('$31.25');
    expect(sec.queryByRole('rowheader', { name: 'Flour' })).not.toBeInTheDocument();

    const buffer = sec.getByLabelText('Safety buffer (extra % above expected needs)');
    await user.clear(buffer);
    await user.type(buffer, '10');
    expect(row('Total estimated purchase cost')).toHaveTextContent('$51.88');
    expect(row('Flour')).toHaveTextContent('$1.20');

    await user.clear(buffer);
    await user.type(buffer, '0');
    await user.type(sec.getByLabelText('Pack size for Milk in L'), '4');
    expect(row('Milk')).toHaveTextContent('3 packs');
    expect(row('Milk')).toHaveTextContent('$24');

    // Invalid input pauses the list (never treated as 0).
    await user.clear(buffer);
    await user.type(buffer, 'abc');
    expect(sec.getByText('Fix the highlighted values to see the shopping list.')).toBeInTheDocument();
    expect(sec.queryByRole('rowheader', { name: 'Milk' })).not.toBeInTheDocument();
  });
});

describe('Budget vs actual', () => {
  it('explains the hand-worked month: budget $975 → actual $943, with every variance', async () => {
    const { user } = setup('dashboard', 'demo');
    const sec = within(within(panel('dashboard')).getByRole('heading', { name: 'Budget vs actual' }).closest('section')!);
    const row = (name: string) => sec.getByRole('rowheader', { name }).closest('tr')!;
    // Starts from the budget: no variance.
    expect(row('Total variance')).toHaveTextContent('$0');
    const type = async (label: string, value: string) => {
      const f = sec.getByLabelText(label);
      await user.clear(f);
      await user.type(f, value);
    };
    await type('Actual units sold of Coffee', '320');
    await type('Actual variable cost per unit of Coffee', '2.10');
    await type('Actual units sold of Muffin', '140');
    await type('Actual units sold of Sandwich', '90');
    await type('Actual price of Sandwich', '9.50');
    await type('Actual fixed costs for the month', '1550');
    expect(row('+ Sales volume variance')).toHaveTextContent('$5 F');
    expect(row('of which sales quantity variance')).toHaveTextContent('$0');
    expect(row('of which sales mix variance')).toHaveTextContent('$5 F');
    expect(row('+ Selling price variance')).toHaveTextContent('$45 F');
    expect(row('+ Variable cost variance')).toHaveTextContent('$32 U');
    expect(row('+ Fixed cost variance')).toHaveTextContent('$50 U');
    expect(row('= Actual operating profit')).toHaveTextContent('$943');
    expect(row('Total variance')).toHaveTextContent('$32 U');

    // Invalid input pauses the results instead of becoming 0; the business itself is unchanged.
    await type('Actual units sold of Cookie', 'abc');
    expect(sec.getByText('Fix the highlighted values to see the variances.')).toBeInTheDocument();
    expect(sec.queryByRole('rowheader', { name: 'Total variance' })).not.toBeInTheDocument();
    expect(within(panel('dashboard')).getByRole('heading', { name: 'Projected Operating Profit' }).closest('article')).toHaveTextContent('$975');
  });
});

describe('12-month projection', () => {
  it('starts at 12 normal months, then shows seasonal results, best/worst and loss months', async () => {
    const { user } = setup('dashboard', 'demo');
    const dash = within(panel('dashboard'));
    const proj = within(dash.getByRole('heading', { name: /12-month projection/ }).closest('section')!);
    // Default: 12 × $975 = $11,700.
    expect(proj.getByText('Annual operating profit').parentElement).toHaveTextContent('$11,700');
    expect(proj.getByText('Months below break-even').parentElement).toHaveTextContent('None');

    const setLevel = async (month: string, value: string) => {
      const f = proj.getByLabelText(`Sales level for ${month} (%)`);
      await user.clear(f);
      await user.type(f, value);
    };
    await setLevel('January', '60'); // revenue $2,340, CM $1,485 → −$15
    await setLevel('July', '130'); // CM $3,217.50 → $1,717.50
    const janRow = proj.getByRole('rowheader', { name: /January/ }).closest('tr')!;
    expect(janRow).toHaveTextContent('$2,340');
    expect(janRow).toHaveTextContent('−$15');
    expect(janRow).toHaveTextContent('Below break-even');
    expect(proj.getByText('Best month').parentElement).toHaveTextContent('July');
    expect(proj.getByText('Worst month').parentElement).toHaveTextContent('January');
    // Year = 10 × $975 − $15 + $1,717.50 = $11,452.50
    expect(proj.getByRole('rowheader', { name: /Year \(sum of the 12 months\)/ }).closest('tr')).toHaveTextContent('$11,452.50');

    // Invalid input pauses the projection instead of using 0.
    await setLevel('March', 'abc');
    expect(proj.getByText(/March sales level: Please enter the sales level as a number/)).toBeInTheDocument();
    expect(proj.queryByText('Annual operating profit')).not.toBeInTheDocument();
  });
});

describe('save my work', () => {
  const jsonFile = (text: string, name = 'saved.json') => new File([text], name, { type: 'application/json' });
  const coffeeSales = () => within(panel('my-business')).getByLabelText('Expected monthly sales for Coffee');
  const demoFileText = () => serializeBusiness(initialAppState('demo').business, '2026-11-09T18:00:00.000Z');

  it('auto-saves changes on this device and restores them when the app is opened again', async () => {
    const { user, unmount } = setup();
    const mb = within(panel('my-business'));
    expect(mb.getByText(/nothing to save yet/)).toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    await user.clear(coffeeSales());
    await user.type(coffeeSales(), '9');
    expect(mb.getByText(/Saved on this device\. Every change is saved/)).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.schemaVersion).toBe(1);
    expect(Object.keys(stored)).toEqual(['app', 'schemaVersion', 'savedAt', 'business']); // no experiments or challenge progress

    unmount(); // "close the tab"
    window.location.hash = 'my-business';
    render(<App />); // "open it again" – no starting data given
    expect(coffeeSales()).toHaveValue('9');
    expect(within(panel('my-business')).getByText(/the business you saved on this device was restored/)).toBeInTheDocument();
  });

  it('still works, and says saving is off, when the browser blocks storage', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    window.location.hash = 'my-business';
    const user = userEvent.setup(FAST_USER);
    render(<App />);
    expect(within(panel('my-business')).getByText('Saving is off')).toBeInTheDocument();
    await user.clear(coffeeSales());
    await user.type(coffeeSales(), '10');
    expect(coffeeSales()).toHaveValue('10');
    expect(within(panel('my-business')).getByText('Saving is off')).toBeInTheDocument();
  });

  it('opens with the example, and says so, when the saved copy is damaged', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"app":"price-it-right","schemaVersion":1,"business":{"oops"');
    window.location.hash = 'my-business';
    render(<App />);
    expect(within(panel('my-business')).getByText(/could not be read, so the Coffee Shop example was loaded/)).toBeInTheDocument();
    expect(coffeeSales()).toHaveValue('300');
  });

  it('exports a file that can be read back', async () => {
    const { user } = setup('my-business', 'demo');
    await user.click(within(panel('my-business')).getByRole('button', { name: /Export my business/ }));
    expect(downloads).toHaveLength(1);
    expect(downloads[0].name).toBe('price-it-right-maple-leaf-cafe-demo.json');
    const back = parseSavedBusiness(await downloads[0].blob.text());
    expect(back.ok && back.business.products.map((p) => p.name)).toEqual(['Coffee', 'Muffin', 'Sandwich', 'Cookie']);
  });

  it('shows friendly errors for a bad file and leaves the business unchanged', async () => {
    const { user } = setup();
    const mb = within(panel('my-business'));
    const input = mb.getByLabelText('Choose a saved business file');
    await user.upload(input, jsonFile('this is not json'));
    await waitFor(() => expect(mb.getByRole('alert')).toHaveTextContent(/could not be read/));
    expect(mb.getByRole('alert')).toHaveTextContent('your current business is unchanged');

    const broken = JSON.parse(demoFileText());
    broken.business.inventory[0].unit = 'cups';
    delete broken.business.products[1].price;
    await user.upload(input, jsonFile(JSON.stringify(broken)));
    await waitFor(() => expect(mb.getByRole('alert')).toHaveTextContent('Inventory item 1 has an unknown unit'));
    expect(mb.getByRole('alert')).toHaveTextContent('Product 2 is missing: price');
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(mb.getByDisplayValue('Latte')).toBeInTheDocument(); // still the coffee shop sample
  });

  it('asks before an imported business replaces the current one', async () => {
    const { user } = setup();
    const mb = within(panel('my-business'));
    const input = mb.getByLabelText('Choose a saved business file');
    const good = jsonFile(demoFileText(), 'cafe.json');

    await user.upload(input, good);
    await waitFor(() => expect(confirmDialog()).toHaveTextContent(/4 products, \d+ inventory items and \d+ recipes/));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Cancel' }));
    expect(mb.getByDisplayValue('Latte')).toBeInTheDocument();

    await user.upload(input, good);
    await waitFor(() => expect(confirmDialog()).toBeInTheDocument());
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Replace my work' }));
    expect(mb.getByDisplayValue('Cookie')).toBeInTheDocument();
    expect(mb.queryByDisplayValue('Latte')).not.toBeInTheDocument();
    expect(mb.getByText(/Imported “Maple Leaf Café \(demo\)” from cafe\.json/)).toBeInTheDocument();
    await go('dashboard');
    expect(within(panel('dashboard')).getByRole('heading', { name: 'Projected Operating Profit' }).closest('article')).toHaveTextContent('$975');
    // The imported business is now the one saved on this device.
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).business.name).toBe('Maple Leaf Café (demo)');
  });

  /** Opens the app with a changed business that is already saved on this device. */
  const setupWithSavedWork = () => {
    const state = initialAppState('coffee');
    state.business.fixedCosts = '999';
    window.localStorage.setItem(STORAGE_KEY, serializeBusiness(state.business, '2026-11-09T18:00:00.000Z'));
    window.location.hash = 'my-business';
    const user = userEvent.setup(FAST_USER);
    render(<App initial={state} />);
    return { user, mb: within(panel('my-business')), fixed: () => within(panel('my-business')).getByLabelText('Monthly fixed costs (whole business)') };
  };

  it('“Start fresh” keeps everything when cancelled', async () => {
    const { user, mb, fixed } = setupWithSavedWork();
    await user.click(mb.getByRole('button', { name: /Start fresh/ }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Cancel' }));
    expect(fixed()).toHaveValue('999');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it('“Start fresh” loads the example and removes the saved copy once confirmed', async () => {
    const { user, mb, fixed } = setupWithSavedWork();
    await user.click(mb.getByRole('button', { name: /Start fresh/ }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Start fresh' }));
    expect(fixed()).toHaveValue('1500'); // the fictional Coffee Shop example
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('shows the privacy note', () => {
    setup();
    expect(within(panel('my-business')).getByText(/your data stays on this device only/)).toBeInTheDocument();
  });
});

describe('products', () => {
  it('adds, duplicates and deletes products (with confirmation)', async () => {
    const { user } = setup();
    const mb = within(panel('my-business'));
    await user.click(mb.getByRole('button', { name: /Add a product/ }));
    expect(mb.getByDisplayValue('New product')).toBeInTheDocument();

    await user.click(mb.getByRole('button', { name: 'Duplicate Coffee' }));
    expect(mb.getByDisplayValue('Coffee (copy)')).toBeInTheDocument();

    await user.click(mb.getByRole('button', { name: 'Delete Coffee (copy)' }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Cancel' }));
    expect(mb.getByDisplayValue('Coffee (copy)')).toBeInTheDocument();

    await user.click(mb.getByRole('button', { name: 'Delete Coffee (copy)' }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Delete product' }));
    expect(mb.queryByDisplayValue('Coffee (copy)')).not.toBeInTheDocument();
  });

  it('sorts by highest contribution margin per unit', async () => {
    const { user } = setup();
    await user.selectOptions(within(panel('my-business')).getByLabelText('Sort by'), 'cmPerUnit');
    const names = within(panel('my-business')).getAllByLabelText(/^Product name/).map((i) => (i as HTMLInputElement).value);
    // Latte and Sandwich both earn $5 per unit (tie keeps order), then Coffee $4, Muffin $2.50.
    expect(names).toEqual(['Latte', 'Sandwich', 'Coffee', 'Muffin']);
  });

  it('invalid input shows a message and pauses results instead of using zero', async () => {
    const { user } = setup();
    const price = within(panel('my-business')).getByLabelText('Selling price per unit for Coffee');
    await user.clear(price);
    await user.type(price, 'abc');
    expect(within(panel('my-business')).getByText('Please use numbers only, for example 6 or 6.50.')).toBeInTheDocument();
    expect(price).toHaveValue('abc');
    await go('dashboard');
    expect(within(panel('dashboard')).getByText('Some business numbers need attention')).toBeInTheDocument();
  });

  it('asks before switching business when there is unsaved work', async () => {
    const { user } = setup();
    await user.clear(within(panel('my-business')).getByLabelText('Expected monthly sales for Coffee'));
    await user.type(within(panel('my-business')).getByLabelText('Expected monthly sales for Coffee'), '999');
    await user.click(within(panel('my-business')).getByRole('radio', { name: /Bakery/ }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Cancel' }));
    expect(within(panel('my-business')).getByLabelText('Expected monthly sales for Coffee')).toHaveValue('999');
    await user.click(within(panel('my-business')).getByRole('radio', { name: /Bakery/ }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Replace my work' }));
    expect(within(panel('my-business')).getByDisplayValue('Sourdough loaf')).toBeInTheDocument();
  });
});

describe('pricing lab', () => {
  it('compares a modified plan, resets it, and only applies it after confirmation', async () => {
    const { user } = setup('pricing');
    const lab = within(panel('pricing'));
    const field = () => lab.getByLabelText('Modified price for Coffee');
    await user.clear(field());
    await user.type(field(), '7');
    // Coffee sample: profit $1,575; +$1 × 300 coffees = $1,875.
    const row = lab.getByRole('rowheader', { name: 'Operating profit' }).closest('tr')!;
    expect(row).toHaveTextContent('$1,575');
    expect(row).toHaveTextContent('$1,875');
    expect(row).toHaveTextContent('+$300');

    await user.click(lab.getByRole('button', { name: /Reset Scenario/ }));
    expect(field()).toHaveValue('6');

    await user.clear(field());
    await user.type(field(), '7');
    await user.click(lab.getByRole('button', { name: 'Apply Changes' }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Apply changes' }));
    expect(within(panel('my-business')).getByLabelText('Selling price per unit for Coffee')).toHaveValue('7');
  });

  it('calculates the minimum price for a target profit', async () => {
    const { user } = setup('pricing', 'demo');
    const lab = within(panel('pricing'));
    const target = lab.getByLabelText('Desired monthly operating profit');
    await user.clear(target);
    await user.type(target, '1500');
    // $2 + ($1,500 + $1,500 − $1,275 from other products) ÷ 300 = $7.75
    expect(lab.getByText('Minimum calculated price').parentElement).toHaveTextContent('$7.75');
  });
});

describe('inventory', () => {
  it('uploads a CSV, confirms the mapping, reports problems and allows editing after import', async () => {
    const { user } = setup('inventory');
    const hub = within(panel('inventory'));
    const csv = new File(['Item Name,Available Quantity,Unit,Cost Per Unit\nOat milk,4000,mL,0.003\nHoney,-2,kg,\nOat milk,10,mL,\nLids,300,pieces,0.05\n'], 'stock.csv', { type: 'text/csv' });
    await user.upload(hub.getAllByLabelText('Choose a file')[0], csv);
    await waitFor(() => expect(hub.getByRole('button', { name: /Confirm columns/ })).toBeInTheDocument());
    await user.click(hub.getByRole('button', { name: /Confirm columns/ }));
    expect(hub.getByText(/1 row ready to import/)).toBeInTheDocument();
    expect(hub.getByText(/can't be negative/)).toBeInTheDocument();
    expect(hub.getAllByText(/Duplicates are not merged/)).toHaveLength(2);

    await user.click(hub.getByRole('button', { name: 'Import 1 item' }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Replace inventory' }));
    expect(hub.getByText(/Imported 1 inventory item/)).toBeInTheDocument();
    const qty = hub.getByLabelText('Available quantity of Lids');
    await user.clear(qty);
    await user.type(qty, '250');
    expect(qty).toHaveValue('250');
  });

  it('rejects unsupported files with a clear message', async () => {
    // Simulates a file dropped on the page, which bypasses the file picker's filter.
    const { user } = setup('inventory', 'coffee', { applyAccept: false });
    const hub = within(panel('inventory'));
    await user.upload(hub.getAllByLabelText('Choose a file')[0], new File(['x'], 'stock.pdf'));
    await waitFor(() => expect(hub.getByRole('alert')).toHaveTextContent(/Unsupported file type/));
  });

  it('saves a recipe for a product that had none', async () => {
    const { user } = setup('inventory');
    const hub = within(panel('inventory'));
    await user.selectOptions(hub.getByLabelText('Recipe for'), hub.getByRole('option', { name: 'Sandwich' }));
    expect(hub.getByText(/No recipe yet\. Add the inventory items/)).toBeInTheDocument();
    await user.click(hub.getByRole('button', { name: '+ Add ingredient' }));
    await user.type(hub.getByLabelText(/^Quantity of .* per product$/), '50');
    await user.click(hub.getByRole('button', { name: 'Save recipe' }));
    expect(hub.getByText(/Saved: Complete recipe/)).toBeInTheDocument();
  });

  it('shows the shared-inventory shortage for expected sales', () => {
    setup('inventory', 'demo');
    const hub = within(panel('inventory'));
    const lines = hub.getAllByText(/additional/, { selector: 'li' }).map((l) => l.textContent);
    expect(lines).toEqual([
      '🔴 To meet expected sales, an additional 10 litres of Milk would be required.',
      '🔴 To meet expected sales, an additional 1.25 kilograms of Butter would be required.',
    ]);
  });
});

describe('production planner', () => {
  it('ranks products by contribution per unit of the scarce item and checks a modified plan', async () => {
    const { user } = setup('planner', 'demo');
    const pl = within(panel('planner'));
    expect(pl.getByText(/Cookie generates more contribution margin per kg of Butter than Muffin/)).toBeInTheDocument();
    expect(pl.getAllByText('🔴 Not feasible – inventory short').length).toBe(2);

    await user.click(pl.getByRole('button', { name: /Keep my mix, fit inventory/ }));
    expect(pl.getAllByText('✅ Feasible').length).toBe(1);
    expect(pl.getByLabelText('Planned production of Coffee')).toHaveValue('211');

    await user.click(pl.getByRole('button', { name: /Expected demand/ }));
    expect(pl.getByLabelText('Planned production of Coffee')).toHaveValue('300');
  });

  it('“Best mix” finds a proven-optimal feasible plan, and it earns at least as much as the other plans', async () => {
    const { user } = setup('planner', 'demo');
    const pl = within(panel('planner'));
    const modifiedProfit = () => Number(pl.getByRole('rowheader', { name: 'Operating profit' }).closest('tr')!.children[2].textContent!.replace(/[^0-9.−-]/g, '').replace('−', '-'));

    await user.click(pl.getByRole('button', { name: /Keep my mix, fit inventory/ }));
    const keepMix = modifiedProfit();
    await user.click(pl.getByRole('button', { name: /Suggested plan/ }));
    const suggested = modifiedProfit();

    await user.click(pl.getByRole('button', { name: /Best mix \(exact search\)/ }));
    expect(pl.getByText('Best mix – proven optimal for these numbers')).toBeInTheDocument();
    expect(pl.getAllByText('✅ Feasible').length).toBe(1); // the modified plan fits the inventory
    const best = modifiedProfit();
    expect(best).toBeGreaterThanOrEqual(keepMix);
    expect(best).toBeGreaterThanOrEqual(suggested);
    // The heuristic keeps its honest label.
    expect(pl.getByText(/a rule of thumb,/).textContent).toMatch(/not proven optimal/);
  });
});

describe('business challenge', () => {
  it('awards success only for a valid plan that meets the goal', async () => {
    const { user } = setup('challenge');
    const ch = within(within(panel('challenge')).getByRole('tabpanel', { name: 'Stop the Losses' }));
    const price = ch.getByLabelText('Selling price per coffee', { selector: 'input[type="text"]' });
    await user.clear(price);
    await user.type(price, '9'); // outside the allowed $3–$8 range
    expect(ch.queryByText('🎉 Challenge complete!')).not.toBeInTheDocument();
    expect(ch.getByText(/must be between/)).toBeInTheDocument();
    await user.clear(price);
    await user.type(price, '5');
    expect(ch.getByText('🎉 Challenge complete!')).toBeInTheDocument();
  });
});

describe('business report', () => {
  it('generates a PDF report', async () => {
    const { user } = setup('report', 'demo');
    const rep = within(panel('report'));
    expect(rep.getByText('Total monthly revenue (expected)')).toBeInTheDocument();
    await user.click(rep.getByRole('button', { name: /Download My Business Report/ }));
    await waitFor(() => expect(pdfSaves).toEqual(['price-it-right-report-maple-leaf-cafe-demo.pdf:ok']));
    expect(rep.getByRole('status')).toHaveTextContent(/report was created/);
  });

  it('downloads the business as an Excel file that reads back with the verified numbers', async () => {
    const { user } = setup('report', 'demo');
    const rep = within(panel('report'));
    await user.click(rep.getByRole('button', { name: /Download my business as Excel/ }));
    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(downloads[0].name).toBe('price-it-right-maple-leaf-cafe-demo.xlsx');
    expect(rep.getByRole('status')).toHaveTextContent(/Excel file was created/);
    const { default: readXlsxFile } = await import('read-excel-file/universal');
    const book = (await readXlsxFile(downloads[0].blob)) as { sheet: string; data: unknown[][] }[];
    expect(book.map((s) => s.sheet)).toEqual(['Products', 'Summary', 'Break-even', 'Inventory & shortages', 'Production plan']);
    const profit = book[1].data.find((r) => r[0] === 'Projected operating profit')!;
    expect(profit[1]).toBe(975);
  });
});
