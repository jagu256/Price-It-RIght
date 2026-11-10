import { useState, type ReactNode } from 'react';
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import ChartContainer from './ChartContainer';
import { useStore } from '../app/StoreContext';
import { formatCAD, formatCompactCAD, formatNumber } from '../lib/format';
import { MONTHS, parseMultiplier, projectYear } from '../lib/projection';
import { parseMoney, toInputText } from '../lib/validation';
import { CellInput, ErrorList, Notice, SignedMoney, SubHeader } from './ui';

const blankMonths = () => MONTHS.map(() => null as string | null);

/**
 * 📅 12-month projection. Sales levels and monthly fixed costs are an
 * experiment: they are kept on this screen only and never change (or save) the business.
 */
export default function SeasonalProjection() {
  const { model } = useStore();
  const [levels, setLevels] = useState<(string | null)[]>(blankMonths);
  const [fixed, setFixed] = useState<(string | null)[]>(blankMonths);
  if (!model.summary || model.fixedCosts === null) return null;

  const businessFixed = toInputText(model.fixedCosts);
  const levelText = (i: number) => levels[i] ?? '100';
  const fixedText = (i: number) => fixed[i] ?? businessFixed;
  const parsed = MONTHS.map((_, i) => ({ level: parseMultiplier(levelText(i)), fixed: parseMoney(fixedText(i), 'fixedCosts') }));
  const errors = parsed.flatMap((p, i) => [
    p.level.ok ? undefined : `${MONTHS[i]} sales level: ${p.level.error}`,
    p.fixed.ok ? undefined : `${MONTHS[i]} fixed costs: ${p.fixed.error}`,
  ]);
  const valid = parsed.every((p) => p.level.ok && p.fixed.ok);
  const result = valid
    ? projectYear(
        model.products,
        parsed.map((p) => ({ multiplierBasisPoints: p.level.ok ? p.level.basisPoints : 0, fixedCosts: p.fixed.ok ? p.fixed.value : 0 })),
      )
    : null;
  const set = (list: (string | null)[], i: number, v: string) => list.map((x, j) => (j === i ? v : x));

  return (
    <section aria-labelledby="projection-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader
        id="projection-title"
        emoji="📅"
        title="12-month projection"
        subtitle="Set a sales level for each month (100 % = your expected monthly sales, same product mix) and each month’s fixed costs. Nothing here changes your business."
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-small" onClick={() => { setLevels(blankMonths()); setFixed(blankMonths()); }}>↺ Every month normal (100 %, {formatCAD(model.fixedCosts)})</button>
      </div>

      {result && (
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          <Stat label="Annual operating profit" value={<SignedMoney value={result.annual.operatingProfit} text={formatCAD(result.annual.operatingProfit)} />} note={`Revenue ${formatCAD(result.annual.revenue)} · CM ${formatCAD(result.annual.contributionMargin)}`} />
          <Stat label="Best month" value={result.best.month} note={formatCAD(result.best.operatingProfit)} />
          <Stat label="Worst month" value={result.worst.month} note={formatCAD(result.worst.operatingProfit)} />
          <Stat
            label="Months below break-even"
            value={result.monthsBelowBreakEven.length === 0 ? 'None' : String(result.monthsBelowBreakEven.length)}
            note={result.monthsBelowBreakEven.length ? result.monthsBelowBreakEven.join(', ') : 'Every month covers its fixed costs.'}
          />
        </dl>
      )}

      {result && (
        <figure>
          <figcaption className="text-sm font-semibold text-sage-900">Monthly revenue, contribution margin and operating profit</figcaption>
          <div className="mt-2 h-72" role="img" aria-label="Chart of monthly revenue, contribution margin and operating profit for 12 months">
            <ChartContainer width="100%" height="100%">
              <ComposedChart data={result.months.map((m) => ({ name: m.month.slice(0, 3), revenue: m.revenue, cm: m.contributionMargin, profit: m.operatingProfit }))} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#3E5A40" tick={{ fontSize: 11 }} interval={0} />
                <YAxis tickFormatter={formatCompactCAD} stroke="#3E5A40" tick={{ fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ borderRadius: 16 }} formatter={(v: number, n: string) => [formatCAD(v), n]} />
                <Legend verticalAlign="top" height={28} />
                <ReferenceLine y={0} stroke="#3E5A40" />
                <Bar dataKey="revenue" name="Revenue" fill="#CBDCC7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cm" name="Contribution margin" fill="#86A882" radius={[4, 4, 0, 0]} />
                <Line type="linear" dataKey="profit" name="Operating profit" stroke="#A8324F" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ChartContainer>
          </div>
        </figure>
      )}

      <div className="overflow-x-auto">
        <table className="data-table min-w-[46rem]">
          <caption className="sr-only">Monthly sales levels, fixed costs and results</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              <th scope="col">Sales level</th>
              <th scope="col">Fixed costs</th>
              <th scope="col" className="text-right">Revenue</th>
              <th scope="col" className="text-right">Contribution margin</th>
              <th scope="col" className="text-right">Operating profit</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, i) => {
              const m = result?.months[i];
              return (
                <tr key={month}>
                  <th scope="row" className="font-semibold">
                    {month}
                    {m?.belowBreakEven && <span className="block text-xs font-bold text-loss-700">Below break-even</span>}
                  </th>
                  <td>
                    <div className="flex items-center gap-1">
                      <CellInput id={`proj-level-${i}`} label={`Sales level for ${month} (%)`} value={levelText(i)} invalid={!parsed[i].level.ok} width="w-20" onChange={(v) => setLevels(set(levels, i, v))} />
                      <span className="text-sm text-sage-600">%</span>
                    </div>
                  </td>
                  <td>
                    <CellInput id={`proj-fixed-${i}`} label={`Fixed costs for ${month}`} prefix="$" value={fixedText(i)} invalid={!parsed[i].fixed.ok} width="w-28" onChange={(v) => setFixed(set(fixed, i, v))} />
                  </td>
                  <td className="text-right">{m ? formatCAD(m.revenue) : '—'}</td>
                  <td className="text-right">{m ? formatCAD(m.contributionMargin) : '—'}</td>
                  <td className="text-right font-semibold">{m ? <SignedMoney value={m.operatingProfit} text={formatCAD(m.operatingProfit)} /> : '—'}</td>
                </tr>
              );
            })}
            {result && (
              <tr className="font-bold">
                <th scope="row">Year (sum of the 12 months)</th>
                <td colSpan={2} className="text-sm font-normal text-sage-600">{formatNumber(result.annual.totalUnits)} units · fixed costs {formatCAD(result.annual.fixedCosts)}</td>
                <td className="text-right">{formatCAD(result.annual.revenue)}</td>
                <td className="text-right">{formatCAD(result.annual.contributionMargin)}</td>
                <td className="text-right"><SignedMoney value={result.annual.operatingProfit} text={formatCAD(result.annual.operatingProfit)} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ErrorList messages={errors} />
      {!valid && <p className="text-sm font-semibold text-loss-700">Fix the highlighted months to see the projection.</p>}

      <Notice tone="idea" title="How this works">
        Each month’s units = expected units × the sales level, rounded down to whole units, keeping your sales mix. A month is below break-even when its contribution
        margin doesn’t cover that month’s fixed costs. Annual totals are the sum of the 12 months. Prices and variable costs stay the same all year. These monthly
        settings are not saved.
      </Notice>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
      <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{label}</dt>
      <dd className="mt-1 font-display text-xl font-extrabold tabular-nums text-sage-900">{value}</dd>
      {note && <dd className="text-xs text-sage-600">{note}</dd>}
    </div>
  );
}
