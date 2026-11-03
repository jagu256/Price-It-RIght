import { useMemo, useReducer, type ReactNode } from 'react';
import type { PricingInputs } from '../lib/accounting';
import { getBusiness, type BusinessId } from '../lib/businesses';
import { formatCAD, roundCents, unitsLabel } from '../lib/format';
import {
  BUSINESS_NOTES,
  PRODUCT_NOUNS,
  calculateProduction,
  countNoun,
  estimateSales,
  findShortages,
  formatQuantity,
  joinNames,
  midSentence,
  validateInventory,
  type ProductionResult,
  type ProductNoun,
  type SalesEstimate,
  type Shortage,
} from '../lib/inventory';
import { initialInventory, inventoryReducer } from '../lib/inventoryState';
import InfoTip from './InfoTip';
import InventoryRow, { COLUMN_TIPS } from './InventoryRow';
import ResultCard from './ResultCard';

interface Props {
  businessId: BusinessId;
  /** The current valid Step 2 inputs, or `null` if any are invalid. */
  pricing: PricingInputs | null;
}

const Emoji = ({ children }: { children: string }) => <span className="text-lg leading-none">{children}</span>;

export default function InventoryEstimator({ businessId, pricing }: Props) {
  const [state, dispatch] = useReducer(inventoryReducer, businessId, initialInventory);
  const business = getBusiness(businessId);
  const noun = PRODUCT_NOUNS[businessId];
  const note = BUSINESS_NOTES[businessId];

  const validation = useMemo(() => validateInventory(state.items), [state.items]);
  const production = useMemo(
    () => (validation.parsed ? calculateProduction(validation.parsed) : null),
    [validation.parsed],
  );
  const sales = production && pricing ? estimateSales(production.maxProduction, pricing) : null;
  const shortages = validation.parsed && pricing ? findShortages(validation.parsed, pricing.units) : null;
  const capacityById = new Map(production?.items.map((i) => [i.id, i]));

  const invalidNames = state.items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => validation.errors[item.id])
    .map(({ item, i }) => item.name.trim() || `item ${i + 1}`);

  return (
    <section
      id="inventory"
      aria-labelledby="inventory-title"
      className="scroll-mt-20 overflow-x-clip bg-white/60 py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="eyebrow">Plan your stock</p>
        <h2 id="inventory-title" className="section-title mt-1">
          <span aria-hidden="true">📦 </span>Inventory &amp; Sales Estimator
        </h2>
        <p className="mt-2 max-w-2xl text-lg text-sage-700">
          Find out how many products you can sell with the inventory you have!
        </p>

        {/* Inventory inputs */}
        <div className="card mt-6 p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-sage-900">Your inventory</h3>
              <p className="mt-1 text-sm text-sage-700">
                List each ingredient, supply or finished product used to make one {noun.one}. Units convert
                automatically (kg ↔ g, L ↔ mL).
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-butter-100 px-3 py-1.5 text-xs font-bold text-butter-700 ring-1 ring-butter-300">
              <span aria-hidden="true">{business.emoji}</span>
              Fictional example inventory – not benchmarks
            </span>
          </div>

          {note && (
            <p className="mt-4 flex gap-2 rounded-2xl bg-sage-50 px-4 py-3 text-sm text-sage-800 ring-1 ring-sage-100" role="note">
              <span aria-hidden="true">ℹ️</span>
              {note}
            </p>
          )}

          {/* Column headers (laptop/tablet) */}
          <div
            className="mt-6 hidden gap-4 pb-2 text-xs font-bold uppercase tracking-wider text-sage-600 md:grid md:grid-cols-[1.25fr_1.15fr_1.15fr_0.9fr_auto]"
          >
            <span className="flex items-center gap-1.5">Item name <InfoTip label="Item name">{COLUMN_TIPS.name}</InfoTip></span>
            <span className="flex items-center gap-1.5">Quantity available <InfoTip label="Quantity available">{COLUMN_TIPS.available}</InfoTip></span>
            <span className="flex items-center gap-1.5">Quantity per {noun.one} <InfoTip label={`Quantity per ${noun.one}`}>{COLUMN_TIPS.required}</InfoTip></span>
            <span className="flex items-center gap-1.5">Can make <InfoTip label="Can make" align="right">{COLUMN_TIPS.capacity}</InfoTip></span>
            <span className="w-10" />
          </div>

          {state.items.length > 0 ? (
            <ul className="mt-4 space-y-3 md:mt-0 md:space-y-0">
              {state.items.map((item, i) => (
                <InventoryRow
                  key={item.id}
                  index={i}
                  item={item}
                  errors={validation.errors[item.id] ?? {}}
                  touched={state.touched[item.id] ?? {}}
                  capacity={capacityById.get(item.id)}
                  noun={noun}
                  dispatch={dispatch}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-2xl border-2 border-dashed border-sage-200 px-4 py-6 text-center text-sage-700">
              No inventory items yet. Add at least one item to estimate how many {noun.many} you can make.
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-sage-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="btn-primary" onClick={() => dispatch({ type: 'add' })}>
              <span aria-hidden="true">+</span> Add Inventory Item
            </button>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'clear' })}>
                Clear all items
              </button>
              <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'reset' })}>
                <span aria-hidden="true">↺</span> Reset Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8" aria-live="polite">
          {validation.issue === 'no-items' && (
            <Paused title="No inventory items entered">
              Add at least one inventory item with a quantity per {noun.one} to calculate your maximum production.
            </Paused>
          )}
          {validation.issue === 'invalid' && (
            <Paused title="Estimate paused – some items need attention">
              We don’t calculate production until every item is complete, because skipping an item could overstate
              what you can make. Check: <strong>{joinNames(invalidNames)}</strong>.{' '}
              <button
                type="button"
                className="font-semibold text-sage-800 underline underline-offset-2"
                onClick={() => dispatch({ type: 'touch-all' })}
              >
                Show what’s missing
              </button>
            </Paused>
          )}
          {production && (
            <Results production={production} sales={sales} shortages={shortages} noun={noun} pricing={pricing} />
          )}
        </div>
      </div>
    </section>
  );
}

function Paused({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-loss-100 bg-loss-50/60 px-6 py-8 text-center" role="status">
      <h3 className="text-xl font-bold text-sage-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sage-700">{children}</p>
    </div>
  );
}

interface ResultsProps {
  production: ProductionResult;
  sales: SalesEstimate | null;
  shortages: Shortage[] | null;
  noun: ProductNoun;
  pricing: PricingInputs | null;
}

function Results({ production, sales, shortages, noun, pricing }: ResultsProps) {
  const limitingNames = production.limiting.map((i) => i.name);
  const tied = limitingNames.length > 1;
  const limitingSentence = tied
    ? `${joinNames(limitingNames)} are tied as your limiting inventory items.`
    : `${limitingNames[0]} is your limiting inventory item.`;
  const summary = `Based on your current inventory, you can produce a maximum of ${countNoun(production.maxProduction, noun)}. ${limitingSentence}`;

  const profit = sales ? roundCents(sales.estimatedOperatingProfit) : 0;
  const gap = sales ? roundCents(sales.dashboardProfit - sales.estimatedOperatingProfit) : 0;
  const short = shortages?.filter((s) => s.shortageBase > 0) ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-sage-700 p-5 text-cream-50 sm:p-6">
        <p className="text-lg font-semibold leading-relaxed">{summary}</p>
        {sales && (
          <p className="mt-2 font-semibold text-butter-200">
            {sales.inventorySufficient
              ? 'Great! Your current inventory is sufficient to meet your expected sales volume.'
              : 'Your inventory may limit your sales. Consider replenishing your limiting inventory item – after checking that expected demand and the cost of extra inventory make it worthwhile.'}
          </p>
        )}
        {sales && <CapacityDemand sales={sales} noun={noun} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          title="Maximum Production"
          value={countNoun(production.maxProduction, noun)}
          detail="Production capacity based on materials only – not a sales forecast."
          icon={<Emoji>📦</Emoji>}
        />
        <ResultCard
          title="Limiting Inventory"
          value={joinNames(limitingNames)}
          badge={tied ? 'Tied limiting items' : undefined}
          detail={`Runs out first – it can only cover ${countNoun(production.maxProduction, noun)}.`}
          icon={<Emoji>⚠️</Emoji>}
          tone={sales && !sales.inventorySufficient ? 'loss' : 'neutral'}
        />
        {sales && pricing ? (
          <>
            <ResultCard
              title="Estimated Sales"
              value={countNoun(sales.estimatedSales, noun)}
              detail={`The smaller of production capacity (${sales.maxProduction.toLocaleString('en-CA')}) and expected demand (${sales.expectedDemand.toLocaleString('en-CA')}).`}
              icon={<Emoji>🛒</Emoji>}
            />
            <ResultCard
              title="Estimated Revenue"
              value={formatCAD(sales.estimatedRevenue)}
              detail={`${unitsLabel(sales.estimatedSales)} × ${formatCAD(pricing.sellingPrice)} selling price.`}
              icon={<Emoji>💰</Emoji>}
            />
            <ResultCard
              title="Maximum Potential Revenue"
              value={formatCAD(sales.maxPotentialRevenue)}
              detail={`Assumes all ${countNoun(sales.maxProduction, noun)} you can produce are sold.`}
              icon={<Emoji>💵</Emoji>}
            />
            <ResultCard
              title={profit < 0 ? 'Estimated Operating Loss' : 'Estimated Operating Profit'}
              value={formatCAD(profit)}
              badge={
                gap > 0
                  ? `${formatCAD(gap)} below your dashboard projection`
                  : profit > 0
                    ? 'Profit'
                    : profit < 0
                      ? 'Loss'
                      : 'Exactly break-even'
              }
              detail={`${unitsLabel(sales.estimatedSales)} × (${formatCAD(pricing.sellingPrice)} − ${formatCAD(pricing.variableCost)}) − ${formatCAD(pricing.fixedCosts)} fixed costs.`}
              icon={<Emoji>📊</Emoji>}
              tone={profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral'}
            />
          </>
        ) : (
          <div className="flex items-center rounded-3xl border-2 border-dashed border-sage-200 p-5 text-sm text-sage-700 sm:col-span-2 lg:col-span-1">
            Fix the pricing inputs in Step 2 to see estimated sales, revenue and profit.
          </div>
        )}
      </div>

      {shortages && pricing && (
        <ShortageTable shortages={shortages} short={short} expected={pricing.units} noun={noun} />
      )}

      <div className="flex gap-3 rounded-2xl border border-butter-300 bg-butter-100 px-4 py-3 text-sm text-butter-700" role="note">
        <span className="text-lg leading-none" aria-hidden="true">💡</span>
        <div className="space-y-1">
          <p>
            <strong>Assumptions:</strong> production capacity is not the same as sales. Estimated sales are capped at
            your expected demand, because not everything you can make will automatically sell.
          </p>
          <p>
            Maximum potential revenue assumes every product you can make is sold. Estimated profit assumes your
            variable cost per unit applies to each unit sold and your monthly fixed costs stay the same. Inventory
            costs are not added separately – they are assumed to be part of your variable cost per unit.
          </p>
          {pricing && (
            <p>
              Uses your Step 2 numbers: {formatCAD(pricing.sellingPrice)} price · {formatCAD(pricing.variableCost)} variable
              cost · {formatCAD(pricing.fixedCosts)} fixed costs · {unitsLabel(pricing.units)} expected.{' '}
              <a href="#simulator" className="font-semibold underline underline-offset-2">Edit them</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Three bars that keep capacity, demand and estimated sales visibly separate. */
function CapacityDemand({ sales, noun }: { sales: SalesEstimate; noun: ProductNoun }) {
  const max = Math.max(sales.maxProduction, sales.expectedDemand, 1);
  const rows = [
    { label: 'Production capacity (materials)', value: sales.maxProduction, colour: 'bg-cream-50' },
    { label: 'Expected customer demand', value: sales.expectedDemand, colour: 'bg-butter-300' },
    { label: 'Estimated actual sales', value: sales.estimatedSales, colour: 'bg-sage-300' },
  ];
  return (
    <dl className="mt-5 space-y-2.5">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-1 gap-1 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-3">
          <dt className="text-sm text-cream-100/90">{r.label}</dt>
          <dd className="flex min-w-0 items-center gap-3">
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-sage-800/70">
              <span
                className={`block h-full rounded-full ${r.colour} transition-all duration-500`}
                style={{ width: `${Math.max((r.value / max) * 100, r.value > 0 ? 2 : 0)}%` }}
              />
            </span>
            <span className="w-36 shrink-0 text-right text-sm font-bold tabular-nums sm:w-40">{countNoun(r.value, noun)}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ShortageTable({
  shortages,
  short,
  expected,
  noun,
}: {
  shortages: Shortage[];
  short: Shortage[];
  expected: number;
  noun: ProductNoun;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <h3 className="text-xl font-bold text-sage-900">Inventory Shortage Calculator</h3>
      <p className="mt-1 text-sm text-sage-700">
        How much of each item you would need to meet your expected sales of {countNoun(expected, noun)}.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[18rem] text-left text-sm tabular-nums">
          <caption className="sr-only">Inventory needed for expected sales</caption>
          <thead>
            <tr className="border-b-2 border-sage-200 text-xs uppercase tracking-wider text-sage-600">
              <th scope="col" className="py-2 pr-4 font-bold">Item</th>
              <th scope="col" className="py-2 pr-3 text-right font-bold sm:pr-4">Needed</th>
              <th scope="col" className="py-2 pr-4 text-right font-bold">Available</th>
              <th scope="col" className="py-2 text-right font-bold">Shortage</th>
            </tr>
          </thead>
          <tbody>
            {shortages.map((s) => (
              <tr key={s.id} className="border-b border-sage-100">
                <th scope="row" className="py-2 pr-4 font-semibold text-sage-900">{s.name}</th>
                <td className="py-2 pr-4 text-right">{formatQuantity(s.requiredTotalBase, s.dimension, 'short')}</td>
                <td className="py-2 pr-4 text-right">{formatQuantity(s.availableBase, s.dimension, 'short')}</td>
                <td className={`py-2 text-right font-bold ${s.shortageBase > 0 ? 'text-loss-700' : 'text-sage-700'}`}>
                  {s.shortageBase > 0 ? formatQuantity(s.shortageBase, s.dimension, 'short') : 'None'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {short.length === 0 ? (
        <p className="mt-4 font-semibold text-sage-700">
          No shortage – you have enough of every item for {countNoun(expected, noun)}.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5 text-sage-800">
          {short.map((s) => (
            <li key={s.id} className="flex gap-2">
              <span aria-hidden="true" className="text-loss-600">●</span>
              <span>
                To meet your expected sales of {countNoun(expected, noun)}, you would need an additional{' '}
                <strong>{formatQuantity(s.shortageBase, s.dimension)}</strong> of {midSentence(s.name)}.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
