import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import ChartContainer from './ChartContainer';
import type { BusinessSummary } from '../lib/business';
import { formatCAD, formatCompactCAD, formatPercent, formatSignedCAD } from '../lib/format';
import { formatLeverage, operatingLeverage, sensitivity, tornadoOrder } from '../lib/sensitivity';
import { leverageMath, sensitivityMath } from '../lib/showMath';
import ShowMath from './ShowMath';
import { Notice, SignedMoney, SubHeader } from './ui';

const PERCENT = 10;
const signedPercent = (v: number | null) => (v === null ? 'N/A' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${formatPercent(Math.abs(v))}`);

/** 🌪️ Sensitivity analysis (±10 %, one input at a time) and degree of operating leverage. */
export default function Sensitivity({ s }: { s: BusinessSummary }) {
  const r = sensitivity(s, PERCENT);
  const dol = operatingLeverage(s);
  const chart = tornadoOrder(r.rows).map((row) => ({ name: row.label, down: row.downChange, up: row.upChange }));

  return (
    <section aria-labelledby="sensitivity-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader
        id="sensitivity-title"
        emoji="🌪️"
        title="Sensitivity analysis"
        subtitle={`How much operating profit (now ${formatCAD(r.baseProfit)}) changes if ONE input moves by ${PERCENT}% and everything else stays the same.`}
      />

      <div className="overflow-x-auto">
        <table className="data-table min-w-[36rem]">
          <caption className="sr-only">Operating profit when each input changes by plus or minus {PERCENT} percent</caption>
          <thead>
            <tr>
              <th scope="col">Input (on its own)</th>
              <th scope="col" className="text-right">−{PERCENT}%: profit</th>
              <th scope="col" className="text-right">Change</th>
              <th scope="col" className="text-right">+{PERCENT}%: profit</th>
              <th scope="col" className="text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {r.rows.map((row) => (
              <tr key={row.factor}>
                <th scope="row" className="font-semibold">{row.label}</th>
                <td className="text-right">{formatCAD(row.downProfit)}</td>
                <td className="text-right">
                  <SignedMoney value={row.downChange} text={formatSignedCAD(row.downChange)} />
                  <span className="block text-xs text-sage-600">{signedPercent(row.downPercent)}</span>
                </td>
                <td className="text-right">{formatCAD(row.upProfit)}</td>
                <td className="text-right">
                  <SignedMoney value={row.upChange} text={formatSignedCAD(row.upChange)} />
                  <span className="block text-xs text-sage-600">{signedPercent(row.upPercent)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ShowMath label="the sensitivity analysis" items={sensitivityMath(r)} />

      <figure>
        <figcaption>
          <h4 className="text-xl font-bold text-sage-900">Tornado chart</h4>
          <p className="mt-1 text-sm text-sage-700">
            Change in operating profit for each input. The longest bars are at the top: those are the inputs your profit is most sensitive to.
          </p>
        </figcaption>
        <div className="mt-3 h-64" role="img" aria-label={`Tornado chart of the change in operating profit when each input moves by ${PERCENT} percent`}>
          <ChartContainer width="100%" height="100%">
            <BarChart data={chart} layout="vertical" stackOffset="sign" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={formatCompactCAD} stroke="#3E5A40" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={110} stroke="#3E5A40" tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number, n: string) => [formatSignedCAD(v), n]} contentStyle={{ borderRadius: 16 }} />
              <Legend verticalAlign="top" height={28} />
              <ReferenceLine x={0} stroke="#3E5A40" />
              <Bar dataKey="down" name={`Input −${PERCENT}%`} stackId="t" fill="#C9A227" radius={[4, 4, 4, 4]} />
              <Bar dataKey="up" name={`Input +${PERCENT}%`} stackId="t" fill="#4F7150" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ChartContainer>
        </div>
      </figure>

      <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-sage-100" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wider text-sage-600">Degree of operating leverage (DOL)</p>
        {dol.status === 'ok' ? (
          <>
            <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-sage-900">{formatLeverage(dol.value)}</p>
            <p className="mt-1 text-sm text-sage-700">
              Total contribution margin ÷ operating profit. Each 1% change in sales volume (same mix) changes operating profit by about {formatLeverage(dol.value)}%,
              because fixed costs don’t change.
            </p>
            <ShowMath label="degree of operating leverage" items={leverageMath(dol, r)} />
          </>
        ) : (
          <>
            <p className="mt-1 font-display text-3xl font-extrabold text-sage-900">Not meaningful</p>
            <p className="mt-1 text-sm text-sage-700">{dol.reason}</p>
          </>
        )}
      </div>

      <Notice tone="idea" title="How to read this">
        Each row changes one input by exactly {PERCENT}% of its current total and holds everything else constant. “Sales volume” keeps your sales mix, so revenue and
        variable costs move together. Real changes often happen together (for example, a higher price usually means fewer sales), and fractions of units are allowed
        here, so treat these as quick “what if” estimates.
      </Notice>
    </section>
  );
}
