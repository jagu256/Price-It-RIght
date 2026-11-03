import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PricingResults } from '../lib/accounting';
import { chartMaxUnits, costVolumeSeries, profitSeries } from '../lib/chartData';
import { formatCAD, formatCompactCAD, formatCompactNumber, formatNumber, unitsLabel } from '../lib/format';

const COLOURS = {
  revenue: '#4F7150', // sage-600
  costs: '#9A6B12', // dark gold
  profit: '#678C66',
  loss: '#A8324F',
  grid: '#E4EDE1',
  axis: '#3E5A40',
};

const tooltipStyle = {
  borderRadius: 16,
  border: '1px solid #CBDCC7',
  boxShadow: '0 10px 28px -14px rgba(35,52,37,0.35)',
  fontFamily: 'Figtree, sans-serif',
};

export default function Charts({ results }: { results: PricingResults }) {
  const maxUnits = chartMaxUnits(results);
  const lineData = costVolumeSeries(results.inputs, maxUnits);
  const barData = profitSeries(results.inputs, maxUnits);
  const be = results.breakEven;

  return (
    <div>
      <p className="eyebrow">Visualize</p>
      <h2 className="section-title mt-1">Your numbers, charted</h2>
      <p className="mt-2 max-w-2xl text-sage-700">
        Both charts use the same formulas as your dashboard, keeping your price, variable cost and fixed costs the
        same while sales volume changes. Hover or tap a point for exact values.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <figure className="card p-4 sm:p-6">
          <figcaption>
            <h3 className="text-xl font-bold text-sage-900">Revenue vs. Total Costs</h3>
            <p className="mt-1 text-sm text-sage-700">
              {be.status === 'reachable'
                ? `The lines cross at about ${formatNumber(be.unitsExact)} units (${formatCAD(be.revenueExact)}) – the break-even point.`
                : be.status === 'no-fixed-costs'
                  ? 'With no fixed costs, both lines start at $0 and revenue stays above costs for every unit sold.'
                  : 'These lines never cross at a positive sales volume, so no break-even point is marked.'}
            </p>
          </figcaption>
          <div className="mt-4 h-72" role="img" aria-label="Line chart of revenue and total costs at different monthly sales volumes">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 16, right: 16, bottom: 20, left: 8 }}>
                <CartesianGrid stroke={COLOURS.grid} strokeDasharray="3 3" />
                <XAxis
                  dataKey="units"
                  type="number"
                  domain={[0, maxUnits]}
                  ticks={lineData.filter((_, i) => i % 2 === 0).map((p) => p.units)}
                  tickFormatter={formatCompactNumber}
                  stroke={COLOURS.axis}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Monthly sales volume (units)', position: 'insideBottom', offset: -12, fill: COLOURS.axis, fontSize: 12 }}
                />
                <YAxis tickFormatter={formatCompactCAD} stroke={COLOURS.axis} tick={{ fontSize: 12 }} width={64} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(u) => unitsLabel(Number(u))}
                  formatter={(v: number, name: string) => [formatCAD(v), name]}
                />
                <Legend verticalAlign="top" height={28} iconType="plainline" />
                <Line type="linear" dataKey="revenue" name="Revenue" stroke={COLOURS.revenue} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                <Line
                  type="linear"
                  dataKey="totalCosts"
                  name="Total costs"
                  stroke={COLOURS.costs}
                  strokeWidth={3}
                  strokeDasharray="7 5"
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <ReferenceLine
                  x={results.inputs.units}
                  stroke="#86A882"
                  strokeDasharray="2 4"
                  label={{ value: 'Your plan', position: 'insideTopRight', fill: COLOURS.axis, fontSize: 11 }}
                />
                {be.status === 'reachable' && (
                  <ReferenceDot
                    x={be.unitsExact}
                    y={be.revenueExact}
                    r={7}
                    fill="#FAEDA8"
                    stroke="#304633"
                    strokeWidth={2.5}
                    label={{ value: 'Break-even', position: 'top', fill: '#304633', fontSize: 12, fontWeight: 700 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>

        <figure className="card p-4 sm:p-6">
          <figcaption>
            <h3 className="text-xl font-bold text-sage-900">Profit at Different Sales Volumes</h3>
            <p className="mt-1 text-sm text-sage-700">
              Green bars show a profit, raspberry bars show a loss. The outlined bar is your expected volume of{' '}
              {unitsLabel(results.inputs.units)}.
            </p>
          </figcaption>
          <div className="mt-4 h-72" role="img" aria-label="Bar chart of operating profit or loss at different monthly sales volumes">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 16, right: 16, bottom: 20, left: 8 }}>
                <CartesianGrid stroke={COLOURS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="units"
                  tickFormatter={formatCompactNumber}
                  stroke={COLOURS.axis}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  label={{ value: 'Monthly sales volume (units)', position: 'insideBottom', offset: -12, fill: COLOURS.axis, fontSize: 12 }}
                />
                {/* Always include $0 so bar lengths are honest, even when every bar is a loss. */}
                <YAxis
                  tickFormatter={formatCompactCAD}
                  stroke={COLOURS.axis}
                  tick={{ fontSize: 12 }}
                  width={64}
                  domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(203,220,199,0.35)' }}
                  labelFormatter={(u) => unitsLabel(Number(u))}
                  formatter={(v: number) => [formatCAD(v), v < 0 ? 'Operating loss' : 'Operating profit']}
                />
                <ReferenceLine y={0} stroke={COLOURS.axis} />
                <Bar dataKey="profit" name="Operating profit" radius={[6, 6, 6, 6]}>
                  {barData.map((d) => (
                    <Cell
                      key={d.units}
                      fill={d.profit < 0 ? COLOURS.loss : COLOURS.profit}
                      fillOpacity={d.isPlan ? 1 : 0.72}
                      stroke={d.isPlan ? '#233425' : undefined}
                      strokeWidth={d.isPlan ? 2.5 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>
    </div>
  );
}
