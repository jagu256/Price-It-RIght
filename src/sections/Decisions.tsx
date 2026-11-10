import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import ShowMath from '../components/ShowMath';
import { Field } from '../components/SmartPricing';
import { ErrorList, NeedsValidBusiness, Notice, SectionHeader, SignedMoney, SubHeader } from '../components/ui';
import { makeOrBuy, specialOrder, specialOrderInventory, type Shortage } from '../lib/decisions';
import { formatCAD, formatSignedCAD, unitsLabel } from '../lib/format';
import { formatQuantity } from '../lib/inventory';
import { makeOrBuyMath, specialOrderMath } from '../lib/showMath';
import { parseAmount, parseUnits, toInputText, type ParseResult } from '../lib/validation';

const errorOf = (r: ParseResult) => (r.ok ? undefined : r.error);

export default function Decisions() {
  const { model } = useStore();
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <SectionHeader
        emoji="🧭"
        title="Decisions"
        subtitle="Should you take a special order? Make it yourself or buy it in? Compare only the costs and revenues that change. Nothing here changes your business."
      />
      <NeedsValidBusiness ready={!!model.summary}>
        <SpecialOrder />
        <MakeOrBuy />
      </NeedsValidBusiness>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SpecialOrder() {
  const { model } = useStore();
  const [productId, setProductId] = useState(model.products[0]?.id ?? '');
  const [unitsText, setUnitsText] = useState('100');
  const [priceText, setPriceText] = useState('');
  const [extraText, setExtraText] = useState('0');
  const [displaces, setDisplaces] = useState(false);
  const [lostText, setLostText] = useState('0');
  const product = model.products.find((p) => p.id === productId) ?? model.products[0];
  if (!product) return null;

  const units = parseUnits(unitsText);
  const price = parseAmount(priceText, 'offered price per unit');
  const extra = parseAmount(extraText, 'extra one-time costs');
  const lost = displaces ? parseUnits(lostText) : ({ ok: true, value: 0 } as const);
  const errors = [
    errorOf(units),
    units.ok && units.value === 0 ? 'Please enter an order of at least 1 unit.' : undefined,
    priceText.trim() === '' ? undefined : errorOf(price),
    errorOf(extra),
    errorOf(lost),
    lost.ok && lost.value > product.units ? `You can’t lose more regular sales than the ${unitsLabel(product.units)} of ${product.name} you expect to sell.` : undefined,
  ];
  const ready = units.ok && units.value > 0 && price.ok && extra.ok && lost.ok && lost.value <= product.units;
  const input = ready ? { orderUnits: units.value, offeredPrice: price.value, extraCosts: extra.value, lostRegularUnits: lost.value } : null;
  const result = input ? specialOrder(product, input) : null;
  const stock = input ? specialOrderInventory(model, product.id, input.orderUnits, input.lostRegularUnits) : null;
  const infeasible = stock?.status === 'infeasible';

  return (
    <section aria-labelledby="special-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="special-title" emoji="📨" title="Special order" subtitle="A customer offers to buy a one-off batch at a special price. Does it add to profit, and can your stock cover it?" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="so-product" className="block text-sm font-semibold text-sage-900">Product</label>
          <select id="so-product" className="select mt-1 w-full" value={product.id} onChange={(e) => setProductId(e.target.value)}>
            {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-sage-600">Regular price {formatCAD(product.price)} · variable cost {formatCAD(product.variableCost)} · expected {unitsLabel(product.units)}</p>
        </div>
        <Field id="so-units" label="Order quantity (units)" value={unitsText} onChange={setUnitsText} invalid={!units.ok} />
        <Field id="so-price" label="Offered price per unit" value={priceText} onChange={setPriceText} invalid={priceText.trim() !== '' && !price.ok} prefix="$" />
        <Field id="so-extra" label="Extra one-time costs" value={extraText} onChange={setExtraText} invalid={!extra.ok} prefix="$" help="e.g. special packaging or delivery for this order. Enter 0 if none." />
      </div>
      <label className="flex items-start gap-2 text-sm font-semibold text-sage-900">
        <input type="checkbox" className="mt-1" checked={displaces} onChange={(e) => setDisplaces(e.target.checked)} />
        <span>
          Taking this order means losing some regular sales
          <span className="block text-xs font-normal text-sage-600">For example, if you don’t have the time or capacity to serve both.</span>
        </span>
      </label>
      {displaces && (
        <div className="max-w-xs pl-6">
          <Field id="so-lost" label={`Regular sales of ${product.name} lost (units)`} value={lostText} onChange={setLostText} invalid={!lost.ok || (lost.ok && lost.value > product.units)} />
        </div>
      )}
      <ErrorList messages={errors} />
      {priceText.trim() === '' && <p className="text-sm text-sage-700">Enter the offered price to see the result.</p>}

      {result && input && stock && (
        <div className="space-y-3" aria-live="polite">
          {infeasible ? (
            <Notice tone="error" title="Not achievable with your current inventory" role="alert">
              <p>Your stock can’t cover regular demand plus this order of {unitsLabel(input.orderUnits)} {product.name}:</p>
              <ul className="mt-1 list-disc pl-5">
                {stock.shortages.map((s) => <li key={s.name}>{shortageText(s)}</li>)}
              </ul>
              <p className="mt-1">
                The order would only add {formatSignedCAD(result.incrementalProfit)} if you could get the extra inventory first. As things stand, don’t accept it.
              </p>
            </Notice>
          ) : (
            <div className={`rounded-2xl px-5 py-4 ${result.decision === 'reject' ? 'bg-loss-50 ring-1 ring-loss-100' : 'bg-sage-700 text-cream-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">Incremental profit from this order</p>
              <p className={`font-display text-3xl font-extrabold tabular-nums ${result.decision === 'reject' ? 'text-loss-700' : ''}`}>{formatSignedCAD(result.incrementalProfit)}</p>
              <p className={`text-sm ${result.decision === 'reject' ? 'text-loss-700' : 'opacity-95'}`}>
                {result.decision === 'accept'
                  ? 'On the numbers alone, accepting adds to operating profit.'
                  : result.decision === 'reject'
                    ? 'On the numbers alone, accepting would reduce operating profit.'
                    : 'Accepting leaves operating profit unchanged – decide on the qualitative factors.'}
              </p>
            </div>
          )}
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label="Order contribution" value={formatCAD(result.orderCM)} note={`(${formatCAD(input.offeredPrice)} − ${formatCAD(product.variableCost)}) × ${unitsLabel(input.orderUnits)}`} />
            <Stat label="Extra one-time costs" value={formatCAD(result.extraCosts)} />
            <Stat label="Contribution lost on regular sales" value={formatCAD(result.lostCM)} note={`${unitsLabel(input.lostRegularUnits)} × ${formatCAD(result.regularCMPerUnit)}`} />
          </dl>
          <ShowMath label="the special order" items={specialOrderMath(product, input, result)} />

          {stock.status === 'feasible' && (
            <Notice tone="success" title="Inventory check: covered">
              Your stock covers regular demand plus this order for every item {product.name} uses.
              {stock.unknownProducts.length > 0 && ` Products without a recipe (${stock.unknownProducts.join(', ')}) weren’t counted.`}
            </Notice>
          )}
          {stock.status === 'no-recipe' && (
            <Notice tone="warn" title="Inventory not checked">
              {product.name} has no complete recipe, so its inventory needs are unknown. Check your stock before accepting.
            </Notice>
          )}
          {stock.status === 'not-checked' && <Notice tone="warn" title="Inventory not checked">{stock.reason}</Notice>}
          {(stock.status === 'feasible' || stock.status === 'infeasible') && stock.otherShortages.length > 0 && (
            <p className="text-sm text-sage-700">
              Already short for regular sales (items {product.name} doesn’t use, so not caused by this order): {stock.otherShortages.map(shortageText).join('; ')}.
            </p>
          )}
          <Qualitative
            items={[
              'Will regular customers find out and expect the same lower price?',
              'Is there really spare capacity (staff time, equipment) – or will quality or service slip?',
              'Could this lead to more business with this customer later?',
              'Is the customer reliable – will they pay on time?',
            ]}
          />
        </div>
      )}
    </section>
  );
}

const shortageText = (s: Shortage) => `${s.name}: ${formatQuantity(s.shortageBase, s.dimension)} short${s.alreadyShort ? ' (already short for regular sales)' : ''}`;

/* ------------------------------------------------------------------ */

function MakeOrBuy() {
  const { model } = useStore();
  const first = model.products[0];
  const [unitsText, setUnitsText] = useState(first ? String(first.units) : '');
  const [buyText, setBuyText] = useState('');
  const [vcText, setVcText] = useState(first ? toInputText(first.variableCost) : '');
  const [avoidText, setAvoidText] = useState('0');
  const [unavoidText, setUnavoidText] = useState('0');
  const [oppText, setOppText] = useState('0');

  const units = parseUnits(unitsText);
  const buy = parseAmount(buyText, 'purchase price per unit');
  const vc = parseAmount(vcText, 'variable cost to make one unit');
  const avoid = parseAmount(avoidText, 'avoidable fixed costs');
  const unavoid = parseAmount(unavoidText, 'unavoidable fixed costs');
  const opp = parseAmount(oppText, 'opportunity cost');
  const errors = [
    errorOf(units),
    units.ok && units.value === 0 ? 'Please enter at least 1 unit.' : undefined,
    buyText.trim() === '' ? undefined : errorOf(buy),
    errorOf(vc),
    errorOf(avoid),
    errorOf(unavoid),
    errorOf(opp),
  ];
  const input =
    units.ok && units.value > 0 && buy.ok && vc.ok && avoid.ok && unavoid.ok && opp.ok
      ? { units: units.value, purchasePrice: buy.value, variableCostPerUnit: vc.value, avoidableFixedCosts: avoid.value, unavoidableFixedCosts: unavoid.value, opportunityCost: opp.value }
      : null;
  const r = input ? makeOrBuy(input) : null;

  return (
    <section aria-labelledby="mob-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="mob-title" emoji="⚖️" title="Make or buy" subtitle="Should you make an item yourself or buy it from a supplier? Compare only the costs that would change." />
      {first && (
        <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sage-900">
          Start from a product
          <select
            className="select"
            aria-label="Start from a product"
            defaultValue=""
            onChange={(e) => {
              const p = model.products.find((x) => x.id === e.target.value);
              if (!p) return;
              setUnitsText(String(p.units));
              setVcText(toInputText(p.variableCost));
            }}
          >
            <option value="" disabled>Choose…</option>
            {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-xs font-normal text-sage-600">Copies its expected units and variable cost below.</span>
        </label>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="mob-units" label="Units needed" value={unitsText} onChange={setUnitsText} invalid={!units.ok} />
        <Field id="mob-buy" label="Supplier’s price per unit (buy)" value={buyText} onChange={setBuyText} invalid={buyText.trim() !== '' && !buy.ok} prefix="$" />
        <Field id="mob-vc" label="Variable cost to make one unit" value={vcText} onChange={setVcText} invalid={!vc.ok} prefix="$" />
        <Field id="mob-avoid" label="Avoidable fixed costs" value={avoidText} onChange={setAvoidText} invalid={!avoid.ok} prefix="$" help="Fixed costs that would stop if you bought instead (e.g. renting a special oven)." />
        <Field id="mob-unavoid" label="Unavoidable fixed costs" value={unavoidText} onChange={setUnavoidText} invalid={!unavoid.ok} prefix="$" help="Paid either way (e.g. your shop rent) – shown, but not part of the decision." />
        <Field id="mob-opp" label="Opportunity cost (optional)" value={oppText} onChange={setOppText} invalid={!opp.ok} prefix="$" help="Contribution you’d give up by using your space or time to make it. 0 if none." />
      </div>
      <ErrorList messages={errors} />
      {buyText.trim() === '' && <p className="text-sm text-sage-700">Enter the supplier’s price to compare.</p>}

      {r && input && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">On the numbers</p>
            <p className="font-display text-3xl font-extrabold">
              {r.decision === 'make' ? 'Make it' : r.decision === 'buy' ? 'Buy it' : 'No difference'}
            </p>
            <p className="text-sm opacity-95">
              {r.decision === 'make'
                ? `Making costs ${formatCAD(r.savingFromMaking)} less than buying.`
                : r.decision === 'buy'
                  ? `Buying costs ${formatCAD(-r.savingFromMaking)} less than making.`
                  : 'Making and buying cost the same – decide on the qualitative factors.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[26rem]">
              <caption className="sr-only">Relevant costs of making compared with buying</caption>
              <thead>
                <tr>
                  <th scope="col">Cost</th>
                  <th scope="col" className="text-right">Make</th>
                  <th scope="col" className="text-right">Buy</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row" className="font-semibold">Variable cost ({unitsLabel(input.units)})</th><td className="text-right">{formatCAD(r.makeVariableCost)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">Avoidable fixed costs</th><td className="text-right">{formatCAD(input.avoidableFixedCosts)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">Opportunity cost</th><td className="text-right">{formatCAD(input.opportunityCost)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">Purchase price ({unitsLabel(input.units)})</th><td className="text-right">—</td><td className="text-right">{formatCAD(r.costToBuy)}</td></tr>
                <tr className="font-bold"><th scope="row">Total relevant cost</th><td className="text-right">{formatCAD(r.relevantCostToMake)}</td><td className="text-right">{formatCAD(r.costToBuy)}</td></tr>
                <tr className="text-sage-500">
                  <th scope="row" className="font-semibold">Unavoidable fixed costs – <em>irrelevant</em></th>
                  <td className="text-right line-through">{formatCAD(r.unavoidableFixedCosts)}</td>
                  <td className="text-right line-through">{formatCAD(r.unavoidableFixedCosts)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-sage-700">
            Difference: <SignedMoney value={r.savingFromMaking} text={formatSignedCAD(r.savingFromMaking)} /> in favour of {r.savingFromMaking >= 0 ? 'making' : 'buying'}. Unavoidable fixed
            costs are paid either way, so they appear in both columns and cancel out.
          </p>
          <ShowMath label="make or buy" items={makeOrBuyMath(input, r)} />
          <Notice tone="idea" title="Decision rule">
            Make it if the relevant cost to make (variable cost + avoidable fixed costs + opportunity cost) is lower than the cost to buy; buy it if it is higher.
          </Notice>
          <Qualitative
            items={[
              'Quality: can the supplier match your standard?',
              'Reliability: will deliveries arrive on time, every time?',
              'Control and know-how: do you lose skills or flexibility by buying?',
              'Will the supplier’s price stay the same next year?',
              'What will happen to staff or space you no longer need?',
            ]}
          />
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
      <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{label}</dt>
      <dd className="mt-1 font-display text-xl font-extrabold tabular-nums text-sage-900">{value}</dd>
      {note && <dd className="text-xs text-sage-600">{note}</dd>}
    </div>
  );
}

function Qualitative({ items }: { items: string[] }) {
  return (
    <Notice tone="info" title="The numbers aren’t the whole answer">
      <p>The result depends on qualitative factors too. Ask yourself:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Notice>
  );
}
