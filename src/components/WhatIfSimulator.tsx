import type { Dispatch } from 'react';
import { compareNewPrice, type PricingResults } from '../lib/accounting';
import { sliderMax } from '../lib/chartData';
import { breakEvenValue } from '../lib/explain';
import { formatCAD, formatSignedCAD, roundCents, unitsLabel } from '../lib/format';
import type { Action } from '../lib/state';
import { parseMoney, toInputText } from '../lib/validation';
import NumberField from './NumberField';
import PriceSlider from './PriceSlider';

interface Props {
  /** Results for the user's original (baseline) inputs. */
  base: PricingResults;
  whatIfRaw: string | null;
  dispatch: Dispatch<Action>;
}

export default function WhatIfSimulator({ base, whatIfRaw, dispatch }: Props) {
  const basePrice = base.inputs.sellingPrice;
  const text = whatIfRaw ?? toInputText(basePrice);
  const parsed = parseMoney(text, 'sellingPrice');
  const newPrice = parsed.ok ? parsed.value : null;
  const comparison = newPrice !== null ? compareNewPrice(base.inputs, newPrice) : null;
  const changed = newPrice !== null && roundCents(newPrice) !== roundCents(basePrice);

  const max = sliderMax(basePrice * 2, base.inputs.variableCost * 2, newPrice ?? 0);
  const diff = comparison ? roundCents(comparison.profitDifference) : 0;

  return (
    <div>
      <p className="eyebrow">Signature feature</p>
      <h2 className="section-title mt-1">What If You Changed Your Price?</h2>
      <p className="mt-2 max-w-2xl text-sage-700">
        Try a different selling price and compare it side by side with your original numbers. Your original
        scenario stays the same unless you choose to apply the new price.
      </p>

      <div className="mt-5 flex gap-3 rounded-2xl border border-butter-300 bg-butter-100 px-4 py-3 text-sm text-butter-700" role="note">
        <span className="text-lg leading-none" aria-hidden="true">💡</span>
        <p>
          <strong>Assumption:</strong> sales volume stays at {unitsLabel(base.inputs.units)} per month, whatever the
          price. In real life, changing your price can change how many customers buy – so a higher price does not
          automatically mean higher real-world profit.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-butter-200/70 p-5 shadow-soft ring-1 ring-butter-300 sm:p-6">
          <NumberField
            id="what-if-price"
            label="Try a new selling price"
            help={`Your original price is ${formatCAD(basePrice)} per unit.`}
            prefix="$"
            suffix="per unit"
            value={text}
            onChange={(value) => dispatch({ type: 'set-what-if', value })}
            error={parsed.ok ? undefined : parsed.error}
          >
            <PriceSlider
              id="what-if-slider"
              label="Adjust the what-if selling price"
              value={newPrice ?? basePrice}
              max={max}
              colour="#7A6012"
              onChange={(v) => dispatch({ type: 'set-what-if', value: toInputText(v) })}
            />
          </NumberField>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={!changed}
              onClick={() => dispatch({ type: 'apply-what-if' })}
            >
              Apply new price
            </button>
            <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'reset-what-if' })}>
              <span aria-hidden="true">↺</span> Reset Scenario
            </button>
          </div>
          <p className="mt-3 text-xs text-butter-700">
            “Apply new price” copies this price into your main inputs. “Reset Scenario” goes back to your original price.
          </p>
        </div>

        {comparison ? (
          <div>
            <div className="grid grid-cols-2 gap-3" aria-live="polite">
              <ScenarioColumn title="Original Scenario" r={comparison.original} />
              <ScenarioColumn title="New Scenario" r={comparison.updated} highlight />
            </div>
            <div
              className={`mt-4 rounded-3xl p-5 text-center ${
                diff > 0
                  ? 'bg-sage-700 text-cream-50'
                  : diff < 0
                    ? 'bg-loss-600 text-white'
                    : 'bg-white text-sage-800 ring-1 ring-sage-100'
              }`}
              data-testid="profit-difference"
            >
              <p className="text-sm font-bold uppercase tracking-wider opacity-90">Change in monthly operating profit</p>
              <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{formatSignedCAD(diff)}</p>
              <p className="mt-1 text-sm opacity-90">
                {diff === 0
                  ? 'Same projected profit as your original scenario.'
                  : `${diff > 0 ? 'Higher' : 'Lower'} than your original scenario, assuming you still sell ${unitsLabel(base.inputs.units)}.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-3xl border-2 border-dashed border-loss-100 p-6 text-center text-sage-700">
            Enter a valid what-if price to see the comparison.
          </div>
        )}
      </div>
    </div>
  );
}

function ScenarioColumn({ title, r, highlight }: { title: string; r: PricingResults; highlight?: boolean }) {
  const profit = roundCents(r.operatingProfit);
  const rows = [
    { label: 'Selling price', value: formatCAD(r.inputs.sellingPrice) },
    { label: 'Revenue', value: formatCAD(r.revenue) },
    {
      label: profit < 0 ? 'Operating loss' : 'Operating profit',
      value: formatCAD(profit),
      tone: profit > 0 ? 'text-sage-700' : profit < 0 ? 'text-loss-700' : '',
    },
    { label: 'Break-even units', value: breakEvenValue(r) },
  ];
  return (
    <section
      aria-label={title}
      className={`rounded-3xl p-4 shadow-soft sm:p-5 ${highlight ? 'bg-white ring-2 ring-butter-500' : 'bg-white ring-1 ring-sage-100'}`}
    >
      <h3 className="font-display text-base font-bold text-sage-900 sm:text-lg">{title}</h3>
      <dl className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-bold uppercase tracking-wider text-sage-500">{row.label}</dt>
            <dd className={`break-words font-display text-xl font-bold tabular-nums sm:text-2xl ${row.tone ?? 'text-sage-900'}`}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
