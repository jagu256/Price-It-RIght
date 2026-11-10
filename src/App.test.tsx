import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function setup(hash = 'my-business', business: Parameters<typeof initialAppState>[0] = 'coffee', options: Parameters<typeof userEvent.setup>[0] = {}) {
  window.location.hash = hash;
  const user = userEvent.setup(options);
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
const confirmDialog = () => screen.getByRole('alertdialog');

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

describe('save my work', () => {
  const jsonFile = (text: string, name = 'saved.json') => new File([text], name, { type: 'application/json' });
  const coffeeSales = () => screen.getByLabelText('Expected monthly sales for Coffee');
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
    expect(screen.getByText(/the business you saved on this device was restored/)).toBeInTheDocument();
  });

  it('still works, and says saving is off, when the browser blocks storage', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    window.location.hash = 'my-business';
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText('Saving is off')).toBeInTheDocument();
    await user.clear(coffeeSales());
    await user.type(coffeeSales(), '10');
    expect(coffeeSales()).toHaveValue('10');
    expect(screen.getByText('Saving is off')).toBeInTheDocument();
  });

  it('opens with the example, and says so, when the saved copy is damaged', () => {
    window.localStorage.setItem(STORAGE_KEY, '{"app":"price-it-right","schemaVersion":1,"business":{"oops"');
    window.location.hash = 'my-business';
    render(<App />);
    expect(screen.getByText(/could not be read, so the Coffee Shop example was loaded/)).toBeInTheDocument();
    expect(coffeeSales()).toHaveValue('300');
  });

  it('exports a file that can be read back', async () => {
    const { user } = setup('my-business', 'demo');
    await user.click(screen.getByRole('button', { name: /Export my business/ }));
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
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
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
    const user = userEvent.setup();
    render(<App initial={state} />);
    return { user, mb: within(panel('my-business')), fixed: () => screen.getByLabelText('Monthly fixed costs (whole business)') };
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
