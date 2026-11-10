import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import ShowMath from '../components/ShowMath';
import { Field } from '../components/SmartPricing';
import { ErrorList, NeedsValidBusiness, Notice, SectionHeader, SignedMoney, SubHeader } from '../components/ui';
import { t } from '../i18n/i18n';
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
        title={t('Decisions')}
        subtitle={t('Should you take a special order? Make it yourself or buy it in? Compare only the costs and revenues that change. Nothing here changes your business.')}
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
    units.ok && units.value === 0 ? t('Please enter an order of at least 1 unit.') : undefined,
    priceText.trim() === '' ? undefined : errorOf(price),
    errorOf(extra),
    errorOf(lost),
    lost.ok && lost.value > product.units ? t('You can’t lose more regular sales than the {units} of {name} you expect to sell.', { units: unitsLabel(product.units), name: product.name }) : undefined,
  ];
  const ready = units.ok && units.value > 0 && price.ok && extra.ok && lost.ok && lost.value <= product.units;
  const input = ready ? { orderUnits: units.value, offeredPrice: price.value, extraCosts: extra.value, lostRegularUnits: lost.value } : null;
  const result = input ? specialOrder(product, input) : null;
  const stock = input ? specialOrderInventory(model, product.id, input.orderUnits, input.lostRegularUnits) : null;
  const infeasible = stock?.status === 'infeasible';

  return (
    <section aria-labelledby="special-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="special-title" emoji="📨" title={t('Special order')} subtitle={t('A customer offers to buy a one-off batch at a special price. Does it add to profit, and can your stock cover it?')} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="so-product" className="block text-sm font-semibold text-sage-900">{t('Product')}</label>
          <select id="so-product" className="select mt-1 w-full" value={product.id} onChange={(e) => setProductId(e.target.value)}>
            {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-sage-600">{t('Regular price {price} · variable cost {cost} · expected {units}', { price: formatCAD(product.price), cost: formatCAD(product.variableCost), units: unitsLabel(product.units) })}</p>
        </div>
        <Field id="so-units" label={t('Order quantity (units)')} value={unitsText} onChange={setUnitsText} invalid={!units.ok} />
        <Field id="so-price" label={t('Offered price per unit')} value={priceText} onChange={setPriceText} invalid={priceText.trim() !== '' && !price.ok} prefix="$" />
        <Field id="so-extra" label={t('Extra one-time costs')} value={extraText} onChange={setExtraText} invalid={!extra.ok} prefix="$" help={t('e.g. special packaging or delivery for this order. Enter 0 if none.')} />
      </div>
      <label className="flex items-start gap-2 text-sm font-semibold text-sage-900">
        <input type="checkbox" className="mt-1" checked={displaces} onChange={(e) => setDisplaces(e.target.checked)} />
        <span>
          {t('Taking this order means losing some regular sales')}
          <span className="block text-xs font-normal text-sage-600">{t('For example, if you don’t have the time or capacity to serve both.')}</span>
        </span>
      </label>
      {displaces && (
        <div className="max-w-xs pl-6">
          <Field id="so-lost" label={t('Regular sales of {name} lost (units)', { name: product.name })} value={lostText} onChange={setLostText} invalid={!lost.ok || (lost.ok && lost.value > product.units)} />
        </div>
      )}
      <ErrorList messages={errors} />
      {priceText.trim() === '' && <p className="text-sm text-sage-700">{t('Enter the offered price to see the result.')}</p>}

      {result && input && stock && (
        <div className="space-y-3" aria-live="polite">
          {infeasible ? (
            <Notice tone="error" title={t('Not achievable with your current inventory')} role="alert">
              <p>{t('Your stock can’t cover regular demand plus this order of {units} {name}:', { units: unitsLabel(input.orderUnits), name: product.name })}</p>
              <ul className="mt-1 list-disc pl-5">
                {stock.shortages.map((s) => <li key={s.name}>{shortageText(s)}</li>)}
              </ul>
              <p className="mt-1">
                {t('The order would only add {amount} if you could get the extra inventory first. As things stand, don’t accept it.', { amount: formatSignedCAD(result.incrementalProfit) })}
              </p>
            </Notice>
          ) : (
            <div className={`rounded-2xl px-5 py-4 ${result.decision === 'reject' ? 'bg-loss-50 ring-1 ring-loss-100' : 'bg-sage-700 text-cream-50'}`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('Incremental profit from this order')}</p>
              <p className={`font-display text-3xl font-extrabold tabular-nums ${result.decision === 'reject' ? 'text-loss-700' : ''}`}>{formatSignedCAD(result.incrementalProfit)}</p>
              <p className={`text-sm ${result.decision === 'reject' ? 'text-loss-700' : 'opacity-95'}`}>
                {result.decision === 'accept'
                  ? t('On the numbers alone, accepting adds to operating profit.')
                  : result.decision === 'reject'
                    ? t('On the numbers alone, accepting would reduce operating profit.')
                    : t('Accepting leaves operating profit unchanged – decide on the qualitative factors.')}
              </p>
            </div>
          )}
          <dl className="grid gap-3 sm:grid-cols-3">
            <Stat label={t('Order contribution')} value={formatCAD(result.orderCM)} note={`(${formatCAD(input.offeredPrice)} − ${formatCAD(product.variableCost)}) × ${unitsLabel(input.orderUnits)}`} />
            <Stat label={t('Extra one-time costs')} value={formatCAD(result.extraCosts)} />
            <Stat label={t('Contribution lost on regular sales')} value={formatCAD(result.lostCM)} note={`${unitsLabel(input.lostRegularUnits)} × ${formatCAD(result.regularCMPerUnit)}`} />
          </dl>
          <ShowMath label={t('the special order')} items={specialOrderMath(product, input, result)} />

          {stock.status === 'feasible' && (
            <Notice tone="success" title={t('Inventory check: covered')}>
              {t('Your stock covers regular demand plus this order for every item {name} uses.', { name: product.name })}
              {stock.unknownProducts.length > 0 && ' ' + t('Products without a recipe ({names}) weren’t counted.', { names: stock.unknownProducts.join(', ') })}
            </Notice>
          )}
          {stock.status === 'no-recipe' && (
            <Notice tone="warn" title={t('Inventory not checked')}>
              {t('{name} has no complete recipe, so its inventory needs are unknown. Check your stock before accepting.', { name: product.name })}
            </Notice>
          )}
          {stock.status === 'not-checked' && <Notice tone="warn" title={t('Inventory not checked')}>{stock.reason}</Notice>}
          {(stock.status === 'feasible' || stock.status === 'infeasible') && stock.otherShortages.length > 0 && (
            <p className="text-sm text-sage-700">
              {t('Already short for regular sales (items {name} doesn’t use, so not caused by this order): {list}.', { name: product.name, list: stock.otherShortages.map(shortageText).join('; ') })}
            </p>
          )}
          <Qualitative
            items={[
              t('Will regular customers find out and expect the same lower price?'),
              t('Is there really spare capacity (staff time, equipment) – or will quality or service slip?'),
              t('Could this lead to more business with this customer later?'),
              t('Is the customer reliable – will they pay on time?'),
            ]}
          />
        </div>
      )}
    </section>
  );
}

const shortageText = (s: Shortage) =>
  s.alreadyShort
    ? t('{name}: {qty} short (already short for regular sales)', { name: s.name, qty: formatQuantity(s.shortageBase, s.dimension) })
    : t('{name}: {qty} short', { name: s.name, qty: formatQuantity(s.shortageBase, s.dimension) });

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
    units.ok && units.value === 0 ? t('Please enter at least 1 unit.') : undefined,
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
      <SubHeader id="mob-title" emoji="⚖️" title={t('Make or buy')} subtitle={t('Should you make an item yourself or buy it from a supplier? Compare only the costs that would change.')} />
      {first && (
        <label className="flex flex-wrap items-center gap-2 text-sm font-semibold text-sage-900">
          {t('Start from a product')}
          <select
            className="select"
            aria-label={t('Start from a product')}
            defaultValue=""
            onChange={(e) => {
              const p = model.products.find((x) => x.id === e.target.value);
              if (!p) return;
              setUnitsText(String(p.units));
              setVcText(toInputText(p.variableCost));
            }}
          >
            <option value="" disabled>{t('Choose…')}</option>
            {model.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="text-xs font-normal text-sage-600">{t('Copies its expected units and variable cost below.')}</span>
        </label>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <Field id="mob-units" label={t('Units needed')} value={unitsText} onChange={setUnitsText} invalid={!units.ok} />
        <Field id="mob-buy" label={t('Supplier’s price per unit (buy)')} value={buyText} onChange={setBuyText} invalid={buyText.trim() !== '' && !buy.ok} prefix="$" />
        <Field id="mob-vc" label={t('Variable cost to make one unit')} value={vcText} onChange={setVcText} invalid={!vc.ok} prefix="$" />
        <Field id="mob-avoid" label={t('Avoidable fixed costs')} value={avoidText} onChange={setAvoidText} invalid={!avoid.ok} prefix="$" help={t('Fixed costs that would stop if you bought instead (e.g. renting a special oven).')} />
        <Field id="mob-unavoid" label={t('Unavoidable fixed costs')} value={unavoidText} onChange={setUnavoidText} invalid={!unavoid.ok} prefix="$" help={t('Paid either way (e.g. your shop rent) – shown, but not part of the decision.')} />
        <Field id="mob-opp" label={t('Opportunity cost (optional)')} value={oppText} onChange={setOppText} invalid={!opp.ok} prefix="$" help={t('Contribution you’d give up by using your space or time to make it. 0 if none.')} />
      </div>
      <ErrorList messages={errors} />
      {buyText.trim() === '' && <p className="text-sm text-sage-700">{t('Enter the supplier’s price to compare.')}</p>}

      {r && input && (
        <div className="space-y-3" aria-live="polite">
          <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">{t('On the numbers')}</p>
            <p className="font-display text-3xl font-extrabold">
              {r.decision === 'make' ? t('Make it') : r.decision === 'buy' ? t('Buy it') : t('No difference')}
            </p>
            <p className="text-sm opacity-95">
              {r.decision === 'make'
                ? t('Making costs {amount} less than buying.', { amount: formatCAD(r.savingFromMaking) })
                : r.decision === 'buy'
                  ? t('Buying costs {amount} less than making.', { amount: formatCAD(-r.savingFromMaking) })
                  : t('Making and buying cost the same – decide on the qualitative factors.')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table min-w-[26rem]">
              <caption className="sr-only">{t('Relevant costs of making compared with buying')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Cost')}</th>
                  <th scope="col" className="text-right">{t('Make')}</th>
                  <th scope="col" className="text-right">{t('Buy')}</th>
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row" className="font-semibold">{t('Variable cost ({units})', { units: unitsLabel(input.units) })}</th><td className="text-right">{formatCAD(r.makeVariableCost)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">{t('Avoidable fixed costs')}</th><td className="text-right">{formatCAD(input.avoidableFixedCosts)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">{t('Opportunity cost')}</th><td className="text-right">{formatCAD(input.opportunityCost)}</td><td className="text-right">—</td></tr>
                <tr><th scope="row" className="font-semibold">{t('Purchase price ({units})', { units: unitsLabel(input.units) })}</th><td className="text-right">—</td><td className="text-right">{formatCAD(r.costToBuy)}</td></tr>
                <tr className="font-bold"><th scope="row">{t('Total relevant cost')}</th><td className="text-right">{formatCAD(r.relevantCostToMake)}</td><td className="text-right">{formatCAD(r.costToBuy)}</td></tr>
                <tr className="text-sage-500">
                  <th scope="row" className="font-semibold">{t('Unavoidable fixed costs')} – <em>{t('irrelevant')}</em></th>
                  <td className="text-right line-through">{formatCAD(r.unavoidableFixedCosts)}</td>
                  <td className="text-right line-through">{formatCAD(r.unavoidableFixedCosts)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-sage-700">
            {t('Difference:')} <SignedMoney value={r.savingFromMaking} text={formatSignedCAD(r.savingFromMaking)} />{' '}
            {r.savingFromMaking >= 0 ? t('in favour of making.') : t('in favour of buying.')}{' '}
            {t('Unavoidable fixed costs are paid either way, so they appear in both columns and cancel out.')}
          </p>
          <ShowMath label={t('make or buy')} items={makeOrBuyMath(input, r)} />
          <Notice tone="idea" title={t('Decision rule')}>
            {t('Make it if the relevant cost to make (variable cost + avoidable fixed costs + opportunity cost) is lower than the cost to buy; buy it if it is higher.')}
          </Notice>
          <Qualitative
            items={[
              t('Quality: can the supplier match your standard?'),
              t('Reliability: will deliveries arrive on time, every time?'),
              t('Control and know-how: do you lose skills or flexibility by buying?'),
              t('Will the supplier’s price stay the same next year?'),
              t('What will happen to staff or space you no longer need?'),
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
    <Notice tone="info" title={t('The numbers aren’t the whole answer')}>
      <p>{t('The result depends on qualitative factors too. Ask yourself:')}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </Notice>
  );
}
