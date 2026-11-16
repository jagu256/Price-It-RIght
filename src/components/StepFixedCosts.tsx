import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatCAD, formatCADDecimals, formatCompactCAD, formatNumber, unitsLabel } from '../lib/format';
import { sortSteps, stepCostAnalysis, stepProfitCurve, type FixedCostStep } from '../lib/stepCosts';
import { parseMoney, parseUnits } from '../lib/validation';
import ChartContainer from './ChartContainer';
import { CellInput, ErrorList, Notice, SignedMoney, SubHeader } from './ui';

export const MAX_STEPS = 3;
interface StepText { id: number; above: string; increase: string }

/**
 * 🪜 Step fixed costs: fixed costs that jump when sales pass a level (the relevant range).
 * The steps are an experiment on this screen only – they are not saved and never change the business.
 */
export default function StepFixedCosts() {
  const { model } = useStore();
  const [steps, setSteps] = useState<StepText[]>([]);
  const [nextId, setNextId] = useState(1);
  const s = model.summary;
  if (!s || model.fixedCosts === null) return null;

  const parsed = steps.map((x) => ({ x, above: parseUnits(x.above), increase: parseMoney(x.increase, 'fixedCosts') }));
  const thresholds = parsed.flatMap((p) => (p.above.ok ? [p.above.value] : []));
  const duplicate = new Set(thresholds.filter((v, i) => thresholds.indexOf(v) !== i));
  const errors = parsed.flatMap((p, i) => [
    p.above.ok ? undefined : t('Step {n} – units: {error}', { n: i + 1, error: p.above.error }),
    p.increase.ok ? undefined : t('Step {n} – extra fixed costs: {error}', { n: i + 1, error: p.increase.error }),
    p.above.ok && duplicate.has(p.above.value) ? t('Step {n}: another step uses the same number of units. Give each step its own level.', { n: i + 1 }) : undefined,
  ]);
  const valid = parsed.every((p) => p.above.ok && p.increase.ok) && duplicate.size === 0;
  const clean: FixedCostStep[] = valid ? parsed.map((p) => ({ aboveUnits: p.above.ok ? p.above.value : 0, increase: p.increase.ok ? p.increase.value : 0 })) : [];
  const result = valid ? stepCostAnalysis(s.totalCM, s.totalUnits, model.fixedCosts, clean) : null;
  const sorted = sortSteps(clean);
  const maxUnits = Math.max(Math.ceil(s.totalUnits * 1.5), ...sorted.map((x) => Math.ceil(x.aboveUnits * 1.3)), ...(result?.ranges.map((r) => r.breakEvenUnits ?? 0) ?? []), 10);
  const curve = result ? stepProfitCurve(s.totalCM, s.totalUnits, model.fixedCosts, clean, maxUnits) : [];

  const update = (id: number, key: 'above' | 'increase', v: string) => setSteps((list) => list.map((x) => (x.id === id ? { ...x, [key]: v } : x)));

  return (
    <section aria-labelledby="stepcosts-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader
        id="stepcosts-title"
        term="relevantRange"
        emoji="🪜"
        title={t('Step fixed costs (relevant range)')}
        subtitle={t('Fixed costs are only fixed within a range. Add a step such as “above 600 units a month we need another staff member: +$500”, and see where you break even.')}
      />
      {steps.length === 0 && <p className="text-sm text-sage-700">{t('No steps yet – fixed costs stay at {fixed} at every sales level.', { fixed: formatCAD(model.fixedCosts) })}</p>}
      {steps.map((x, i) => (
        <div key={x.id} className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-sage-800">{t('Step {n}: above', { n: i + 1 })}</span>
          <CellInput id={`step-above-${x.id}`} label={t('Step {n}: above how many units per month', { n: i + 1 })} inputMode="numeric" value={x.above} invalid={!parsed[i].above.ok || (parsed[i].above.ok && duplicate.has((parsed[i].above as { value: number }).value))} width="w-24" onChange={(v) => update(x.id, 'above', v)} />
          <span className="text-sage-700">{t('units a month, fixed costs rise by')}</span>
          <CellInput id={`step-inc-${x.id}`} label={t('Step {n}: extra fixed costs per month', { n: i + 1 })} prefix="$" value={x.increase} invalid={!parsed[i].increase.ok} width="w-28" onChange={(v) => update(x.id, 'increase', v)} />
          <button type="button" className="btn-small" aria-label={t('Remove step {n}', { n: i + 1 })} onClick={() => setSteps((list) => list.filter((y) => y.id !== x.id))}>✕</button>
        </div>
      ))}
      {steps.length < MAX_STEPS && (
        <button
          type="button"
          className="btn-small"
          onClick={() => {
            setSteps((list) => [...list, { id: nextId, above: String(Math.max(1, Math.round(s.totalUnits * 0.8))), increase: '500' }]);
            setNextId((n) => n + 1);
          }}
        >
          ＋ {t('Add a step')}
        </button>
      )}
      <ErrorList messages={errors} />
      {!valid && <p className="text-sm font-semibold text-loss-700">{t('Fix the highlighted steps to see the results.')}</p>}
      {valid && !result && <Notice tone="warn">{t('Not available: break-even needs expected sales with a positive contribution margin.')}</Notice>}

      {result && (
        <>
          <div className="overflow-x-auto" aria-live="polite">
            <table className="data-table min-w-[30rem]">
              <caption className="text-left text-sm font-semibold text-sage-900">{t('Fixed costs and break-even in each range')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Total units per month')}</th>
                  <th scope="col" className="text-right">{t('Fixed costs')}</th>
                  <th scope="col" className="text-right">{t('Break-even in this range')}</th>
                </tr>
              </thead>
              <tbody>
                {result.ranges.map((r) => (
                  <tr key={r.fromUnits}>
                    <th scope="row" className="font-semibold">
                      {r.toUnits === null ? t('{from} and above', { from: formatNumber(r.fromUnits) }) : t('{from} to {to}', { from: formatNumber(r.fromUnits), to: formatNumber(r.toUnits) })}
                    </th>
                    <td className="text-right">{formatCAD(r.fixedCosts)}</td>
                    <td className="text-right">{r.breakEvenUnits === null ? t('Not reached in this range') : unitsLabel(r.breakEvenUnits)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sage-800">
            {t('At your expected {units}, fixed costs are {fixed} and operating profit is', { units: unitsLabel(result.expectedUnits), fixed: formatCAD(result.expectedFixedCosts) })}{' '}
            <strong><SignedMoney value={result.expectedProfit} text={formatCAD(result.expectedProfit)} /></strong>
            {t(' (without steps: {profit}).', { profit: formatCAD(s.operatingProfit) })}
          </p>
          {result.ranges.filter((r) => r.breakEvenUnits !== null).length > 1 && (
            <Notice tone="warn">{t('Careful: right after a step, profit can fall back below zero. You need to sell enough to break even again in the higher range.')}</Notice>
          )}
          <figure>
            <figcaption className="text-sm font-semibold text-sage-900">{t('Operating profit at different sales levels (same mix)')}</figcaption>
            <div className="mt-2 h-64" role="img" aria-label={t('Line chart of operating profit as total units grow, dropping at each fixed-cost step')}>
              <ChartContainer width="100%" height="100%">
                <LineChart data={curve} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                  <CartesianGrid stroke="#E4EDE1" strokeDasharray="3 3" />
                  <XAxis dataKey="units" type="number" domain={[0, maxUnits]} stroke="#3E5A40" tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatNumber(v)} />
                  <YAxis tickFormatter={formatCompactCAD} stroke="#3E5A40" tick={{ fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ borderRadius: 16 }} formatter={(v: number) => [formatCAD(v), t('Operating profit')]} labelFormatter={(u: number) => unitsLabel(u)} />
                  <ReferenceLine y={0} stroke="#3E5A40" />
                  <ReferenceLine x={s.totalUnits} stroke="#C9A227" strokeDasharray="4 4" label={{ value: t('Expected'), fontSize: 11, fill: '#3E5A40' }} />
                  <Line type="linear" dataKey="profit" stroke="#A8324F" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartContainer>
            </div>
          </figure>
        </>
      )}
      <Notice tone="idea" title={t('How this works')}>
        {t('Each unit earns the weighted-average contribution margin of your expected sales mix ({cm} per unit). In each range, break-even = that range’s fixed costs ÷ {cm}, rounded up, and it only counts if it falls inside the range. A fixed cost is “fixed” only within its relevant range. The steps are not saved and don’t change your business.', { cm: result ? formatCADDecimals(result.weightedCM, 2) : t('N/A') })}
      </Notice>
    </section>
  );
}
