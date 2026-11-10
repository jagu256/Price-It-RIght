import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceDot, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import ChartContainer from '../components/ChartContainer';
import { useStore } from '../app/StoreContext';
import { CoinsIcon, PieIcon, ShieldIcon, TagIcon, TrendDownIcon, TrendIcon } from '../components/Icons';
import PriceSlider from '../components/PriceSlider';
import ProfitLenses from '../components/ProfitLenses';
import ResultCard from '../components/ResultCard';
import SeasonalProjection from '../components/SeasonalProjection';
import Sensitivity from '../components/Sensitivity';
import ShowMath from '../components/ShowMath';
import { NeedsValidBusiness, Notice, SectionHeader, SubHeader } from '../components/ui';
import { calculate } from '../lib/accounting';
import { scaledTotals, type BusinessSummary } from '../lib/business';
import { sliderMax } from '../lib/chartData';
import { breakEvenSummary, breakEvenValue, marginOfSafetySummary } from '../lib/explain';
import { formatCAD, formatCompactCAD, formatNumber, formatPercent, roundCents, unitsLabel } from '../lib/format';
import type { ParsedProduct } from '../lib/model';
import { breakEvenMath, marginOfSafetyMath, singleBreakEvenMath, summaryMath } from '../lib/showMath';
import { parseMoney, toInputText } from '../lib/validation';

export const CHART_COLOURS = ['#3E5A40', '#C9A227', '#86A882', '#A8324F', '#5B7DA8', '#8C6D1F', '#6B5B95', '#D08C60'];
const AXIS = '#3E5A40';
const GRID = '#E4EDE1';
const tooltipStyle = { borderRadius: 16, border: '1px solid #CBDCC7', fontFamily: 'Figtree, sans-serif' };

export default function ProfitDashboard() {
  const { model } = useStore();
  const s = model.summary;
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
      <SectionHeader emoji="💰" title="Your Business at a Glance" subtitle="Expected monthly results across all your products, based on the expected sales you entered." />
      <NeedsValidBusiness ready={!!s}>{s && <Dashboard s={s} products={model.products} />}</NeedsValidBusiness>
    </div>
  );
}

function Dashboard({ s, products }: { s: BusinessSummary; products: ParsedProduct[] }) {
  const profit = roundCents(s.operatingProfit);
  const math = summaryMath(s);
  return (
    <>
      <div className={`rounded-3xl p-5 sm:p-6 ${profit < 0 ? 'bg-loss-50 ring-1 ring-loss-100' : 'bg-sage-700 text-cream-50'}`} aria-live="polite">
        <p className={`text-lg font-semibold leading-relaxed ${profit < 0 ? 'text-loss-700' : ''}`}>
          {profit > 0
            ? `Your products are expected to bring in ${formatCAD(s.totalRevenue)} and earn ${formatCAD(s.totalCM)} of contribution margin. After ${formatCAD(s.fixedCosts)} of fixed costs, that leaves a projected operating profit of ${formatCAD(profit)} per month.`
            : profit < 0
              ? `Your products are expected to earn ${formatCAD(s.totalCM)} of contribution margin, which is ${formatCAD(-profit)} short of your ${formatCAD(s.fixedCosts)} of fixed costs – a projected operating loss of ${formatCAD(-profit)} per month.`
              : 'Your contribution margin exactly covers your fixed costs: a projected operating profit of $0.'}
        </p>
        <p className={`mt-2 text-sm ${profit < 0 ? 'text-sage-800' : 'text-cream-100/90'}`}>
          Operating profit is not net income – taxes, interest and other expenses are not included.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard title="Total Monthly Revenue" value={formatCAD(s.totalRevenue)} detail="Sum of every product’s price × expected units." icon={<CoinsIcon />} math={math.revenue} />
        <ResultCard title="Total Variable Costs" value={formatCAD(s.totalVariableCosts)} detail="Costs that grow with each unit sold." icon={<TagIcon />} math={math.variableCosts} />
        <ResultCard title="Total Contribution Margin" value={formatCAD(s.totalCM)} detail="Revenue − variable costs. What’s left to cover fixed costs." icon={<PieIcon />} tone={s.totalCM < 0 ? 'loss' : 'neutral'} math={math.contributionMargin} />
        <ResultCard title="Monthly Fixed Costs" value={formatCAD(s.fixedCosts)} detail="Entered once for the whole business." icon={<ShieldIcon />} math={math.fixedCosts} />
        <ResultCard
          title={profit < 0 ? 'Projected Operating Loss' : 'Projected Operating Profit'}
          value={formatCAD(profit)}
          badge={profit > 0 ? 'Profit' : profit < 0 ? 'Loss' : 'Break-even'}
          detail="Total contribution margin − fixed costs."
          icon={profit < 0 ? <TrendDownIcon /> : <TrendIcon />}
          tone={profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral'}
          math={math.operatingProfit}
        />
        <ResultCard
          title="Overall CM Ratio"
          value={s.overallCMRatio === null ? 'N/A' : formatPercent(s.overallCMRatio)}
          detail={s.overallCMRatio === null ? 'Not available when expected revenue is $0.' : 'Share of each sales dollar left after variable costs.'}
          icon={<PieIcon />}
          math={math.cmRatio}
        />
      </div>

      <ProfitLenses />
      <Charts s={s} products={products} />
      <BreakEven s={s} products={products} />
      <Sensitivity s={s} />
      <SeasonalProjection />
      <SingleProductBreakEven products={products} fixedCosts={s.fixedCosts} />
    </>
  );
}

function Charts({ s, products }: { s: BusinessSummary; products: ParsedProduct[] }) {
  const be = s.breakEven;
  const beFactor = be.status === 'reachable' && s.totalUnits > 0 ? be.totalUnitsExact / s.totalUnits : null;
  const maxPct = Math.max(200, beFactor ? Math.ceil((beFactor * 150) / 50) * 50 : 0);
  const steps = 10;
  const line = Array.from({ length: steps + 1 }, (_, i) => {
    const pct = (maxPct / steps) * i;
    return { pct, ...scaledTotals(products, s.fixedCosts, pct / 100) };
  });
  const bars = s.products.map((p, i) => ({ name: p.name, value: p.totalCM, colour: CHART_COLOURS[i % CHART_COLOURS.length] }));
  const pie = s.products.filter((p) => p.revenue > 0).map((p) => ({ name: p.name, value: p.revenue }));

  return (
    <section aria-labelledby="charts-title" className="space-y-4">
      <SubHeader id="charts-title" title="Financial charts" subtitle="Every chart uses the same calculations as the cards above. Hover or tap for exact values." />
      <div className="grid gap-6 lg:grid-cols-2">
        <figure className="card p-4 sm:p-6 lg:col-span-2">
          <figcaption>
            <h4 className="text-xl font-bold text-sage-900">A · Revenue vs. Total Costs</h4>
            <p className="mt-1 text-sm text-sage-700">
              Sales activity on the bottom axis: 100 % = your expected monthly sales, keeping the same product mix.{' '}
              {beFactor !== null ? `The lines cross at about ${formatPercent(beFactor * 100)} – the break-even point.` : 'No break-even point is marked because the lines never cross at positive sales.'}
            </p>
          </figcaption>
          <div className="mt-4 h-72" role="img" aria-label="Line chart of revenue and total costs at different levels of sales activity">
            <ChartContainer width="100%" height="100%">
              <LineChart data={line} margin={{ top: 16, right: 16, bottom: 20, left: 8 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
                <XAxis dataKey="pct" type="number" domain={[0, maxPct]} ticks={line.filter((_, i) => i % 2 === 0).map((d) => d.pct)} tickFormatter={(v) => `${v}%`} stroke={AXIS} tick={{ fontSize: 12 }} label={{ value: 'Sales activity (% of expected sales)', position: 'insideBottom', offset: -12, fill: AXIS, fontSize: 12 }} />
                <YAxis tickFormatter={formatCompactCAD} stroke={AXIS} tick={{ fontSize: 12 }} width={64} />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${formatNumber(Number(v))}% of expected sales`} formatter={(v: number, n: string) => [formatCAD(v), n]} />
                <Legend verticalAlign="top" height={28} iconType="plainline" />
                <Line type="linear" dataKey="revenue" name="Revenue" stroke="#4F7150" strokeWidth={3} dot={false} />
                <Line type="linear" dataKey="totalCosts" name="Total costs" stroke="#9A6B12" strokeWidth={3} strokeDasharray="7 5" dot={false} />
                <ReferenceLine x={100} stroke="#86A882" strokeDasharray="2 4" label={{ value: 'Expected', position: 'insideTopRight', fill: AXIS, fontSize: 11 }} />
                {be.status === 'reachable' && beFactor !== null && (
                  <ReferenceDot x={beFactor * 100} y={be.revenueExact} r={7} fill="#FAEDA8" stroke="#304633" strokeWidth={2.5} label={{ value: 'Break-even', position: 'top', fill: '#304633', fontSize: 12, fontWeight: 700 }} />
                )}
              </LineChart>
            </ChartContainer>
          </div>
        </figure>

        <figure className="card p-4 sm:p-6">
          <figcaption>
            <h4 className="text-xl font-bold text-sage-900">B · Product Contribution Comparison</h4>
            <p className="mt-1 text-sm text-sage-700">Total contribution margin each product is expected to earn (before fixed costs).</p>
          </figcaption>
          <div className="mt-4 h-72" role="img" aria-label="Bar chart of total contribution margin by product">
            <ChartContainer width="100%" height="100%">
              <BarChart data={bars} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={formatCompactCAD} stroke={AXIS} tick={{ fontSize: 12 }} domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
                <YAxis type="category" dataKey="name" width={96} stroke={AXIS} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(203,220,199,0.35)' }} formatter={(v: number) => [formatCAD(v), 'Total contribution margin']} />
                <ReferenceLine x={0} stroke={AXIS} />
                <Bar dataKey="value" radius={[6, 6, 6, 6]}>
                  {bars.map((b) => (
                    <Cell key={b.name} fill={b.value < 0 ? '#A8324F' : '#678C66'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </figure>

        <figure className="card p-4 sm:p-6">
          <figcaption>
            <h4 className="text-xl font-bold text-sage-900">C · Revenue Breakdown</h4>
            <p className="mt-1 text-sm text-sage-700">Each product’s share of expected revenue.</p>
          </figcaption>
          {pie.length === 0 ? (
            <p className="mt-6 text-sage-700">No expected revenue yet.</p>
          ) : (
            <div className="mt-4 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
              <div className="h-56" role="img" aria-label="Donut chart of revenue share by product">
                <ChartContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pie} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="#fff">
                      {pie.map((d, i) => (
                        <Cell key={d.name} fill={CHART_COLOURS[i % CHART_COLOURS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [`${formatCAD(v)} (${formatPercent((v / s.totalRevenue) * 100)})`, n]} />
                  </PieChart>
                </ChartContainer>
              </div>
              <ul className="space-y-1.5 text-sm">
                {pie.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: CHART_COLOURS[i % CHART_COLOURS.length] }} aria-hidden="true" />
                    <span className="font-semibold text-sage-900">{d.name}</span>
                    <span className="tabular-nums text-sage-700">{formatPercent((d.value / s.totalRevenue) * 100)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </figure>
      </div>
    </section>
  );
}

function BreakEven({ s, products }: { s: BusinessSummary; products: ParsedProduct[] }) {
  const be = s.breakEven;
  const name = new Map(products.map((p) => [p.id, p.name]));
  return (
    <section aria-labelledby="breakeven-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader id="breakeven-title" emoji="⚖️" title="Break-even analysis (whole business)" subtitle="How much you need to sell to cover all fixed costs – assuming your expected sales mix stays the same." />
      <Notice tone="idea" title="Constant sales-mix assumption">
        With several products, break-even depends on the mix. This uses your expected mix
        {s.salesMix && `: ${s.salesMix.map((m) => `${name.get(m.id)} ${formatPercent(m.share * 100)}`).join(', ')}`}. A different mix has a different break-even point.
      </Notice>
      {be.status === 'reachable' ? (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="Weighted-average CM per unit" value={formatCAD(be.weightedCM)} note="Σ (mix share × CM per unit)" />
            <Stat label="Break-even units (total)" value={unitsLabel(be.totalUnits)} note={`Theoretical: ${formatNumber(be.totalUnitsExact)} = fixed costs ÷ weighted CM, rounded up`} />
            <Stat label="Break-even revenue" value={formatCAD(be.revenueExact)} note={`Whole-unit plan below: ${formatCAD(be.revenueAtAllocation)}`} />
          </dl>
          <ShowMath label="break-even" items={breakEvenMath(s)} />
          <div className="overflow-x-auto">
            <table className="data-table min-w-[24rem]">
              <caption className="sr-only">Break-even units by product at the expected sales mix</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="text-right">Expected units</th>
                  <th scope="col" className="text-right">Break-even units</th>
                </tr>
              </thead>
              <tbody>
                {be.allocation.map((a) => (
                  <tr key={a.id}>
                    <th scope="row" className="font-semibold">{name.get(a.id)}</th>
                    <td className="text-right">{formatNumber(products.find((p) => p.id === a.id)?.units ?? 0)}</td>
                    <td className="text-right font-bold">{formatNumber(a.units)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-sage-700">
            Whole units are split with the largest-remainder method so the mix is kept as closely as possible; if rounding leaves the
            plan a few cents short, one more unit is added until fixed costs are covered.
          </p>
          <p className="font-semibold text-sage-800">
            {s.marginOfSafety !== null && s.marginOfSafetyPercent !== null
              ? `Margin of safety: ${formatCAD(s.marginOfSafety)} (${formatPercent(s.marginOfSafetyPercent)} of expected revenue, measured against the theoretical break-even revenue of ${formatCAD(be.revenueExact)}). ${s.marginOfSafety >= 0 ? 'Sales could fall this much before reaching break-even.' : 'Expected revenue is below break-even.'}`
              : 'Margin of safety: Not Available.'}
          </p>
          <ShowMath label="margin of safety" items={marginOfSafetyMath(s)} />
        </>
      ) : (
        <Notice tone={be.status === 'no-fixed-costs' ? 'success' : 'error'} title={be.status === 'no-fixed-costs' ? 'Break-even at 0 units' : 'Break-even: Not Available'}>
          {be.status === 'no-fixed-costs'
            ? 'There are no fixed costs, so every unit with a positive contribution margin adds profit.'
            : be.status === 'no-sales'
              ? 'No expected sales are entered, so there is no sales mix to calculate a break-even point from.'
              : 'At the expected mix, products don’t earn a positive contribution margin overall, so fixed costs can never be covered. Review prices or variable costs.'}
        </Notice>
      )}
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-sage-100">
      <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums text-sage-900">{value}</dd>
      {note && <dd className="mt-1 text-xs text-sage-600">{note}</dd>}
    </div>
  );
}

/** Interactive single-product break-even: reuses the original Price It Right calculator. */
function SingleProductBreakEven({ products, fixedCosts }: { products: ParsedProduct[]; fixedCosts: number }) {
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const [priceText, setPriceText] = useState<string | null>(null);
  const [fixedText, setFixedText] = useState<string | null>(null);
  const product = products.find((p) => p.id === productId) ?? products[0];
  if (!product) return null;
  const price = parseMoney(priceText ?? toInputText(product.price), 'sellingPrice');
  const fixed = parseMoney(fixedText ?? toInputText(fixedCosts), 'fixedCosts');
  const r = price.ok && fixed.ok ? calculate({ sellingPrice: price.value, variableCost: product.variableCost, fixedCosts: fixed.value, units: product.units }) : null;

  return (
    <section aria-labelledby="single-be-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader
        id="single-be-title"
        emoji="🧮"
        title="Interactive break-even calculator (one product)"
        subtitle="See how many units ONE product would need to sell to cover a chosen amount of fixed costs on its own. Changes here are for exploring only."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor="sbe-product" className="block text-sm font-semibold text-sage-900">Product</label>
          <select
            id="sbe-product"
            className="select mt-1 w-full"
            value={product.id}
            onChange={(e) => {
              setProductId(e.target.value);
              setPriceText(null);
            }}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-sage-600">Variable cost {formatCAD(product.variableCost)} · expected {unitsLabel(product.units)}</p>
        </div>
        <div>
          <label htmlFor="sbe-price" className="block text-sm font-semibold text-sage-900">Selling price to test</label>
          <input id="sbe-price" className="select mt-1 w-full" inputMode="decimal" value={priceText ?? toInputText(product.price)} onChange={(e) => setPriceText(e.target.value)} aria-invalid={!price.ok || undefined} />
          <PriceSlider id="sbe-slider" label="Selling price slider" value={price.ok ? price.value : 0} max={sliderMax(product.price * 3, product.variableCost * 2)} onChange={(v) => setPriceText(toInputText(v))} />
        </div>
        <div>
          <label htmlFor="sbe-fixed" className="block text-sm font-semibold text-sage-900">Fixed costs this product must cover</label>
          <input id="sbe-fixed" className="select mt-1 w-full" inputMode="decimal" value={fixedText ?? toInputText(fixedCosts)} onChange={(e) => setFixedText(e.target.value)} aria-invalid={!fixed.ok || undefined} />
          <p className="mt-1 text-xs text-sage-600">Defaults to all business fixed costs.</p>
        </div>
      </div>
      {!price.ok && <p className="text-sm font-semibold text-loss-700">⚠ {price.error}</p>}
      {!fixed.ok && <p className="text-sm font-semibold text-loss-700">⚠ {fixed.error}</p>}
      {r && (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="rounded-2xl bg-sage-700 px-5 py-4 text-cream-50">
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">Break-even units</p>
            <p className="font-display text-3xl font-extrabold tabular-nums">{breakEvenValue(r)}</p>
          </div>
          <div className="space-y-1 text-sage-800">
            <p>{breakEvenSummary(r)}</p>
            <p className="text-sm text-sage-600">{marginOfSafetySummary(r)}</p>
            <ShowMath label="one-product break-even" items={singleBreakEvenMath(r)} />
          </div>
        </div>
      )}
    </section>
  );
}
