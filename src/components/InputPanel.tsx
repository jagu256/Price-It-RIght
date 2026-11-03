import type { Dispatch } from 'react';
import { getBusiness } from '../lib/businesses';
import { sliderMax } from '../lib/chartData';
import { formatCAD } from '../lib/format';
import type { Action, AppState } from '../lib/state';
import { parseMoney, toInputText, type FieldKey } from '../lib/validation';
import NumberField from './NumberField';
import PriceSlider from './PriceSlider';

interface Props {
  state: AppState;
  errors: Partial<Record<FieldKey, string>>;
  dispatch: Dispatch<Action>;
  onCalculate: () => void;
}

export default function InputPanel({ state, errors, dispatch, onCalculate }: Props) {
  const business = getBusiness(state.businessId);
  const { raw } = state;

  // Only show an error once the user has left the field or pressed Calculate.
  const visibleError = (field: FieldKey) =>
    state.touched[field] || state.submitted ? errors[field] : undefined;

  const set = (field: FieldKey) => (value: string) => dispatch({ type: 'set-field', field, value });
  const touch = (field: FieldKey) => () => dispatch({ type: 'touch', field });

  const price = parseMoney(raw.sellingPrice, 'sellingPrice');
  const varCost = parseMoney(raw.variableCost, 'variableCost');
  const priceValue = price.ok ? price.value : 0;
  const max = sliderMax(
    business.defaults.sellingPrice * 3,
    (varCost.ok ? varCost.value : 0) * 2,
    priceValue,
  );

  const errorCount = Object.keys(errors).length;

  return (
    <form
      className="card mt-8 p-5 sm:p-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onCalculate();
      }}
      aria-labelledby="inputs-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2 id="inputs-title" className="section-title mt-1">
            Enter your numbers
          </h2>
          <p className="mt-2 text-sage-700">All amounts are in Canadian dollars (CAD) per month.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-butter-100 px-3 py-1.5 text-xs font-bold text-butter-700 ring-1 ring-butter-300">
          <span aria-hidden="true">{business.emoji}</span>
          Fictional example values – not benchmarks
        </span>
      </div>

      <div className="mt-6">
        <label htmlFor="field-businessName" className="block font-semibold text-sage-900">
          Business name or category
        </label>
        <p id="field-businessName-help" className="mt-0.5 text-sm text-sage-600">
          Optional – used to personalise your results.
        </p>
        <input
          id="field-businessName"
          type="text"
          maxLength={60}
          value={raw.businessName}
          onChange={(e) => dispatch({ type: 'set-name', value: e.target.value })}
          aria-describedby="field-businessName-help"
          className="mt-2 w-full rounded-2xl border-2 border-sage-200 bg-white px-4 py-3 text-lg font-semibold outline-none transition focus:border-sage-500 focus:ring-2 focus:ring-sage-400/40 sm:max-w-md"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <NumberField
          id="field-sellingPrice"
          label="Selling price per unit"
          help="What a customer pays for one unit, such as one coffee or one appointment."
          prefix="$"
          suffix="per unit"
          value={raw.sellingPrice}
          onChange={set('sellingPrice')}
          onBlur={touch('sellingPrice')}
          error={visibleError('sellingPrice')}
        >
          <PriceSlider
            id="price-slider"
            label="Adjust selling price with a slider"
            value={priceValue}
            max={max}
            onChange={(v) => dispatch({ type: 'set-field', field: 'sellingPrice', value: toInputText(v) })}
          />
        </NumberField>

        <NumberField
          id="field-variableCost"
          label="Variable cost per unit"
          help="The cost that changes with each product sold, such as materials or packaging."
          prefix="$"
          suffix="per unit"
          value={raw.variableCost}
          onChange={set('variableCost')}
          onBlur={touch('variableCost')}
          error={visibleError('variableCost')}
        />

        <NumberField
          id="field-fixedCosts"
          label="Monthly fixed costs"
          help="Expenses that generally stay the same within the relevant activity range, such as monthly rent."
          prefix="$"
          suffix="per month"
          value={raw.fixedCosts}
          onChange={set('fixedCosts')}
          onBlur={touch('fixedCosts')}
          error={visibleError('fixedCosts')}
        />

        <NumberField
          id="field-units"
          label="Expected monthly sales volume"
          help={`How many units you expect to sell in a typical month (for this business: ${business.unitExample}).`}
          suffix="units / month"
          wholeNumber
          value={raw.units}
          onChange={set('units')}
          onBlur={touch('units')}
          error={visibleError('units')}
        />
      </div>

      {price.ok && varCost.ok && price.value <= varCost.value && (
        <p className="mt-6 rounded-2xl bg-loss-50 px-4 py-3 text-sm font-semibold text-loss-700 ring-1 ring-loss-100" role="status">
          Heads up: your selling price ({formatCAD(price.value)}) is{' '}
          {price.value === varCost.value ? 'equal to' : 'below'} your variable cost per unit ({formatCAD(varCost.value)}),
          so each sale {price.value === varCost.value ? 'contributes nothing' : 'loses money'} before fixed costs.
        </p>
      )}

      {state.submitted && errorCount > 0 && (
        <p className="mt-6 rounded-2xl bg-loss-50 px-4 py-3 text-sm font-semibold text-loss-700 ring-1 ring-loss-100" role="alert">
          Please fix {errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} so we can
          calculate your results.
        </p>
      )}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-sage-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'reset-example' })}>
          <span aria-hidden="true">↺</span> Reset to {business.label} example values
        </button>
        <button type="submit" className="btn-primary px-8 py-4 text-lg">
          Calculate My Profit
        </button>
      </div>
    </form>
  );
}
