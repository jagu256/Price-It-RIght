import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
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

function setup(hash = 'my-business', business: Parameters<typeof initialAppState>[0] = 'coffee', options: Parameters<typeof userEvent.setup>[0] = {}) {
  window.location.hash = hash;
  const user = userEvent.setup(options);
  render(<App initial={initialAppState(business)} />);
  return { user };
}
const panel = (id: string) => document.getElementById(`panel-${id}`)! as HTMLElement;
const go = async (id: string) => {
  await act(async () => {
    window.location.hash = id;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
};
const confirmDialog = () => screen.getByRole('alertdialog');

afterEach(() => {
  window.location.hash = '';
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
    await user.selectOptions(screen.getByLabelText('Sort by'), 'cmPerUnit');
    const names = within(panel('my-business')).getAllByLabelText(/^Product name/).map((i) => (i as HTMLInputElement).value);
    // Latte and Sandwich both earn $5 per unit (tie keeps order), then Coffee $4, Muffin $2.50.
    expect(names).toEqual(['Latte', 'Sandwich', 'Coffee', 'Muffin']);
  });

  it('invalid input shows a message and pauses results instead of using zero', async () => {
    const { user } = setup();
    const price = screen.getByLabelText('Selling price per unit for Coffee');
    await user.clear(price);
    await user.type(price, 'abc');
    expect(screen.getByText('Please use numbers only, for example 6 or 6.50.')).toBeInTheDocument();
    expect(price).toHaveValue('abc');
    await go('dashboard');
    expect(within(panel('dashboard')).getByText('Some business numbers need attention')).toBeInTheDocument();
  });

  it('asks before switching business when there is unsaved work', async () => {
    const { user } = setup();
    await user.clear(screen.getByLabelText('Expected monthly sales for Coffee'));
    await user.type(screen.getByLabelText('Expected monthly sales for Coffee'), '999');
    await user.click(screen.getByRole('radio', { name: /Bakery/ }));
    await user.click(within(confirmDialog()).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByLabelText('Expected monthly sales for Coffee')).toHaveValue('999');
    await user.click(screen.getByRole('radio', { name: /Bakery/ }));
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
    expect(screen.getByLabelText('Selling price per unit for Coffee')).toHaveValue('7');
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
});

describe('business challenge', () => {
  it('awards success only for a valid plan that meets the goal', async () => {
    const { user } = setup('challenge');
    const ch = within(screen.getByRole('tabpanel', { name: 'Stop the Losses' }));
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
});
