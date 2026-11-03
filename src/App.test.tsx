import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

function setup() {
  const user = userEvent.setup();
  render(<App />);
  return { user };
}

const priceInput = () => screen.getByLabelText('Selling price per unit');
const unitsInput = () => screen.getByLabelText('Expected monthly sales volume');

describe('key user workflows', () => {
  it('shows the welcome section with the Start Pricing button', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1, name: 'Price It Right' })).toBeInTheDocument();
    // The tagline appears in the hero and again in the footer.
    expect(screen.getAllByText('Set your price. Know your costs. Maximize your profit.')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Start Pricing/ })).toHaveAttribute('href', '#simulator');
  });

  it('selecting a business fills in its example values', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /Bakery/ }));
    expect(priceInput()).toHaveValue('5');
    expect(screen.getByLabelText('Variable cost per unit')).toHaveValue('2');
    expect(screen.getByLabelText('Monthly fixed costs')).toHaveValue('1000');
    expect(unitsInput()).toHaveValue('500');
  });

  it('calculates the coffee shop example: $400 profit, 200 break-even units', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));
    expect(
      screen.getByText(
        'At your current price and expected sales volume, your business is projected to earn $400 in monthly operating profit.',
      ),
    ).toBeInTheDocument();
    const profitCard = screen.getByRole('heading', { name: 'Monthly Operating Profit' }).closest('article')!;
    expect(within(profitCard).getByText('$400')).toBeInTheDocument();
    const beCard = screen.getByRole('heading', { name: 'Break-Even Units' }).closest('article')!;
    expect(within(beCard).getByText('200 units')).toBeInTheDocument();
  });

  it('updates results when inputs change after calculating', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));
    await user.clear(unitsInput());
    await user.type(unitsInput(), '100');
    expect(screen.getByRole('heading', { name: 'Monthly Operating Loss' })).toBeInTheDocument();
    expect(screen.getByText(/operating loss of \$400/)).toBeInTheDocument();
  });

  it('shows a friendly error for letters and pauses results instead of using zero', async () => {
    const { user } = setup();
    await user.clear(priceInput());
    await user.type(priceInput(), 'abc');
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));
    expect(screen.getByText('Please use numbers only, for example 6 or 6.50.')).toBeInTheDocument();
    expect(priceInput()).toHaveValue('abc');
    expect(priceInput()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Some inputs need attention')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Monthly Revenue' })).not.toBeInTheDocument();
  });

  it('shows an error for an empty required field', async () => {
    const { user } = setup();
    await user.clear(unitsInput());
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));
    expect(screen.getByText('Please enter your expected monthly sales volume.')).toBeInTheDocument();
  });

  it('reset restores the selected business’s example values', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('radio', { name: /Nail Salon/ }));
    await user.clear(priceInput());
    await user.type(priceInput(), '-4');
    await user.click(screen.getByRole('button', { name: /Reset to Nail Salon example values/ }));
    expect(priceInput()).toHaveValue('45');
  });

  it('what-if changes do not overwrite the baseline until applied', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));

    const whatIf = screen.getByLabelText('Try a new selling price');
    await user.clear(whatIf);
    await user.type(whatIf, '7');

    expect(screen.getByTestId('profit-difference')).toHaveTextContent('+$300');
    const original = screen.getByRole('region', { name: 'Original Scenario' });
    const updated = screen.getByRole('region', { name: 'New Scenario' });
    expect(within(original).getByText('$400')).toBeInTheDocument();
    expect(within(updated).getByText('$700')).toBeInTheDocument();
    expect(within(updated).getByText('160 units')).toBeInTheDocument();
    expect(priceInput()).toHaveValue('6'); // baseline unchanged

    await user.click(screen.getByRole('button', { name: 'Reset Scenario' }));
    expect(screen.getByLabelText('Try a new selling price')).toHaveValue('6');
    expect(screen.getByTestId('profit-difference')).toHaveTextContent('$0');

    await user.clear(screen.getByLabelText('Try a new selling price'));
    await user.type(screen.getByLabelText('Try a new selling price'), '7');
    await user.click(screen.getByRole('button', { name: 'Apply new price' }));
    expect(priceInput()).toHaveValue('7');
  });

  it('explains when no finite break-even point exists', async () => {
    const { user } = setup();
    await user.clear(priceInput());
    await user.type(priceInput(), '1');
    await user.click(screen.getByRole('button', { name: 'Calculate My Profit' }));
    expect(screen.getAllByText(/finite break-even point cannot be achieved/).length).toBeGreaterThan(0);
    const beCard = screen.getByRole('heading', { name: 'Break-Even Units' }).closest('article')!;
    expect(within(beCard).getByText('Not reachable')).toBeInTheDocument();
  });
});
