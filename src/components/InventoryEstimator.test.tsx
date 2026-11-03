import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../App';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  const section = () => screen.getByRole('region', { name: 'Inventory & Sales Estimator' });
  const card = (title: string) => within(section()).getByRole('heading', { name: title }).closest('article')!;
  return { user, section, card };
}

describe('Inventory & Sales Estimator', () => {
  it('shows the coffee shop example: 25 coffees, milk limiting, $150 revenue', () => {
    const { section, card } = setup();
    expect(
      within(section()).getByText(
        'Based on your current inventory, you can produce a maximum of 25 coffees. Milk is your limiting inventory item.',
      ),
    ).toBeInTheDocument();
    expect(within(section()).getByText(/Your inventory may limit your sales/)).toBeInTheDocument();
    expect(within(card('Maximum Production')).getByText('25 coffees')).toBeInTheDocument();
    expect(within(card('Estimated Sales')).getByText('25 coffees')).toBeInTheDocument();
    expect(within(card('Estimated Revenue')).getByText('$150')).toBeInTheDocument();
    expect(within(card('Estimated Operating Loss')).getByText('−$700')).toBeInTheDocument();
    expect(within(card('Limiting Inventory')).getByText('Milk')).toBeInTheDocument();
    // Expected sales are 300, so: 300 × 200 mL = 60 L needed − 5 L available = 55 L short.
    expect(within(section()).getByText('55 litres')).toBeInTheDocument();
  });

  it('updates when the selling price, variable cost, fixed costs and expected sales change', async () => {
    const { user, section, card } = setup();
    const price = screen.getByLabelText('Selling price per unit');
    await user.clear(price);
    await user.type(price, '8');
    expect(within(card('Estimated Revenue')).getByText('$200')).toBeInTheDocument();

    const fixed = screen.getByLabelText('Monthly fixed costs');
    await user.clear(fixed);
    await user.type(fixed, '50');
    expect(within(card('Estimated Operating Profit')).getByText('$100')).toBeInTheDocument(); // 25 × $6 − $50

    const units = screen.getByLabelText('Expected monthly sales volume');
    await user.clear(units);
    await user.type(units, '20');
    expect(within(section()).getByText(/Great! Your current inventory is sufficient/)).toBeInTheDocument();
    expect(within(card('Estimated Sales')).getByText('20 coffees')).toBeInTheDocument();
    expect(within(section()).getByText(/No shortage/)).toBeInTheDocument();
  });

  it('adds a new inventory item that becomes the limiting item', async () => {
    const { user, section } = setup();
    await user.click(within(section()).getByRole('button', { name: /Add Inventory Item/ }));
    const names = within(section()).getAllByLabelText('Item name');
    await user.type(names[3], 'Lids');
    await user.type(within(section()).getAllByLabelText('Quantity available')[3], '10');
    // Results are paused while the new row is incomplete.
    expect(within(section()).getByText(/Estimate paused/)).toBeInTheDocument();
    await user.type(within(section()).getAllByLabelText('Quantity per coffee')[3], '1');
    expect(within(section()).getByText(/maximum of 10 coffees. Lids is your limiting inventory item/)).toBeInTheDocument();
  });

  it('removing an item can create a tie between limiting items', async () => {
    const { user, section } = setup();
    await user.click(within(section()).getByRole('button', { name: 'Remove Milk' }));
    expect(
      within(section()).getByText(/maximum of 100 coffees. Coffee beans and Coffee cups are tied as your limiting inventory items/),
    ).toBeInTheDocument();
  });

  it('shows clear errors for invalid quantities and incompatible units', async () => {
    const { user, section } = setup();
    const required = within(section()).getAllByLabelText('Quantity per coffee')[1];
    await user.clear(required);
    await user.type(required, '0');
    expect(within(section()).getByText(/Quantity per product must be more than 0/)).toBeInTheDocument();
    expect(within(section()).queryByRole('heading', { name: 'Maximum Production' })).not.toBeInTheDocument();

    await user.clear(required);
    await user.type(required, '200');
    await user.selectOptions(within(section()).getAllByLabelText('Unit for quantity available')[1], 'kg');
    expect(within(section()).getByText(/Kilograms and millilitres can’t be converted/)).toBeInTheDocument();

    await user.selectOptions(within(section()).getAllByLabelText('Unit for quantity available')[1], 'L');
    // 5000 L ÷ 200 mL = 25,000, so beans and cups (100 each) are now the limiting items.
    expect(within(section()).getByText(/maximum of 100 coffees/)).toBeInTheDocument();
  });

  it('Clear all shows the no-items message and Reset Inventory restores the sample', async () => {
    const { user, section } = setup();
    await user.click(within(section()).getByRole('button', { name: 'Clear all items' }));
    expect(within(section()).getByText('No inventory items entered')).toBeInTheDocument();
    await user.click(within(section()).getByRole('button', { name: /Reset Inventory/ }));
    expect(within(section()).getAllByLabelText('Item name').map((i) => (i as HTMLInputElement).value)).toEqual([
      'Coffee beans',
      'Milk',
      'Coffee cups',
    ]);
  });

  it('loads the nail salon sample with the service-business note', async () => {
    const { user, section } = setup();
    await user.click(screen.getByRole('radio', { name: /Nail Salon/ }));
    expect(within(section()).getByText(/does not account for staff availability or appointment capacity/)).toBeInTheDocument();
    expect(within(section()).getByText(/Great! Your current inventory is sufficient/)).toBeInTheDocument();
    expect(within(section()).getByText(/maximum of 200 services/)).toBeInTheDocument();
  });

  it('shows tooltips on focus', async () => {
    const { user, section } = setup();
    await user.click(within(section()).getAllByRole('button', { name: 'What is “Quantity available”?' })[0]);
    expect(screen.getByRole('tooltip')).toHaveTextContent(/How much of this item you have on hand/);
  });
});
