import type { PricingResults } from '../lib/accounting';
import { breakEvenSummary, breakEvenValue, marginOfSafetySummary, profitSummary } from '../lib/explain';
import { formatCAD, formatNumber, formatPercent, roundCents, unitsLabel } from '../lib/format';
import { CoinsIcon, PieIcon, ScaleIcon, ShieldIcon, TagIcon, TrendDownIcon, TrendIcon } from './Icons';
import ResultCard from './ResultCard';

interface Props {
  /** `null` when the current inputs are invalid. */
  results: PricingResults | null;
  businessName: string;
}

export default function ResultsDashboard({ results, businessName }: Props) {
  if (!results) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-loss-100 bg-loss-50/60 px-6 py-10 text-center" role="status">
        <p className="eyebrow !text-loss-700">Results paused</p>
        <h2 className="mt-2 text-2xl font-bold text-sage-900">Some inputs need attention</h2>
        <p className="mx-auto mt-2 max-w-lg text-sage-700">
          Fix the highlighted fields above and your dashboard will update automatically. We don’t show numbers
          built on incomplete or invalid inputs.
        </p>
      </div>
    );
  }

  const r = results;
  const { sellingPrice, units, fixedCosts } = r.inputs;
  const profit = roundCents(r.operatingProfit);
  const profitTone = profit > 0 ? 'profit' : profit < 0 ? 'loss' : 'neutral';
  const be = r.breakEven;
  const cm = roundCents(r.contributionMarginPerUnit);

  let beDetail: string;
  if (be.status === 'reachable') {
    beDetail =
      be.unitsExact === be.unitsRounded
        ? `Break-even revenue: ${formatCAD(be.revenueExact)}.`
        : `Theoretical: ${formatNumber(be.unitsExact)} units (${formatCAD(be.revenueExact)}). Rounded up to whole units: ${formatCAD(be.revenueAtRounded)}.`;
  } else if (be.status === 'no-fixed-costs') {
    beDetail = 'No fixed costs to cover – every unit sold adds profit.';
  } else if (be.status === 'unreachable') {
    beDetail = 'Selling price does not exceed variable cost per unit, so fixed costs are never covered.';
  } else {
    beDetail = 'Each unit contributes $0 or less, so profit never rises above $0.';
  }

  let mosValue = 'N/A';
  let mosBadge: string | undefined;
  let mosDetail: string;
  if (r.marginOfSafety === null) {
    mosDetail = 'Not available – there is no finite break-even point.';
  } else {
    mosValue = formatCAD(r.marginOfSafety);
    if (r.marginOfSafetyPercent !== null) {
      mosBadge = `${formatPercent(r.marginOfSafetyPercent)} of projected revenue`;
      mosDetail =
        roundCents(r.marginOfSafety) >= 0
          ? 'How far revenue could drop before reaching break-even.'
          : 'Projected revenue is below break-even revenue.';
    } else {
      mosDetail = 'Percentage can’t be calculated when projected revenue is $0.';
    }
  }
  const mosTone =
    r.marginOfSafety === null ? 'neutral' : roundCents(r.marginOfSafety) > 0 ? 'profit' : roundCents(r.marginOfSafety) < 0 ? 'loss' : 'neutral';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Step 3 · Your results</p>
          <h2 className="section-title mt-1">{businessName}’s monthly snapshot</h2>
        </div>
        <p className="text-sm font-semibold text-sage-600">
          {formatCAD(sellingPrice)} per unit · {unitsLabel(units)} · {formatCAD(fixedCosts)} fixed
        </p>
      </div>

      <div
        className={`mt-6 rounded-3xl p-5 sm:p-6 ${
          profit < 0 ? 'bg-loss-50 ring-1 ring-loss-100' : 'bg-sage-700 text-cream-50'
        }`}
        aria-live="polite"
      >
        <p className={`text-lg font-semibold leading-relaxed ${profit < 0 ? 'text-loss-700' : ''}`}>{profitSummary(r)}</p>
        <p className={`mt-2 leading-relaxed ${profit < 0 ? 'text-sage-800' : 'text-cream-100/90'}`}>{breakEvenSummary(r)}</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ResultCard
          title="Monthly Revenue"
          value={formatCAD(r.revenue)}
          detail={`${formatCAD(sellingPrice)} × ${unitsLabel(units)}`}
          icon={<CoinsIcon />}
        />
        <ResultCard
          title={profit < 0 ? 'Monthly Operating Loss' : 'Monthly Operating Profit'}
          value={formatCAD(profit)}
          badge={profit > 0 ? 'Profit' : profit < 0 ? 'Loss' : 'Exactly break-even'}
          detail={`Revenue ${formatCAD(r.revenue)} − total costs ${formatCAD(r.totalCosts)}`}
          icon={profit < 0 ? <TrendDownIcon /> : <TrendIcon />}
          tone={profitTone}
        />
        <ResultCard
          title="Break-Even Units"
          value={breakEvenValue(r)}
          detail={beDetail}
          icon={<ScaleIcon />}
          tone={be.status === 'unreachable' ? 'loss' : 'neutral'}
        />
        <ResultCard
          title="Contribution Margin / Unit"
          value={formatCAD(cm)}
          detail={`${formatCAD(sellingPrice)} price − ${formatCAD(r.inputs.variableCost)} variable cost. Each unit contributes this toward fixed costs.`}
          icon={<TagIcon />}
          tone={cm < 0 ? 'loss' : 'neutral'}
        />
        <ResultCard
          title="Contribution Margin Ratio"
          value={r.contributionMarginRatio === null ? 'N/A' : formatPercent(r.contributionMarginRatio)}
          detail={
            r.contributionMarginRatio === null
              ? 'Can’t be calculated when the selling price is $0.'
              : 'Share of each sales dollar left after variable costs.'
          }
          icon={<PieIcon />}
          tone={r.contributionMarginRatio !== null && r.contributionMarginRatio < 0 ? 'loss' : 'neutral'}
        />
        <ResultCard
          title="Margin of Safety"
          value={mosValue}
          badge={mosBadge}
          detail={mosDetail}
          icon={<ShieldIcon />}
          tone={mosTone}
        />
      </div>

      <p className="mt-4 text-sm text-sage-700">{marginOfSafetySummary(r)}</p>

      <IncomeStatement r={r} />
    </div>
  );
}

/** Contribution-format income statement – the classic managerial accounting layout. */
function IncomeStatement({ r }: { r: PricingResults }) {
  const rows: { label: string; value: number; strong?: boolean; minus?: boolean }[] = [
    { label: 'Revenue', value: r.revenue },
    { label: 'Less: Total variable costs', value: r.totalVariableCosts, minus: true },
    { label: 'Contribution margin', value: r.totalContributionMargin, strong: true },
    { label: 'Less: Fixed costs', value: r.inputs.fixedCosts, minus: true },
    { label: 'Operating profit (loss)', value: r.operatingProfit, strong: true },
  ];
  return (
    <details className="card mt-6 p-5 open:pb-6">
      <summary className="cursor-pointer font-display text-lg font-bold text-sage-900">
        Contribution margin income statement
      </summary>
      <table className="mt-4 w-full max-w-xl text-left tabular-nums">
        <caption className="sr-only">Monthly contribution margin income statement</caption>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className={row.strong ? 'border-t-2 border-sage-200 font-bold' : ''}>
              <th scope="row" className={`py-1.5 pr-4 font-normal ${row.strong ? 'font-bold text-sage-900' : 'text-sage-700'}`}>
                {row.label}
              </th>
              <td
                className={`py-1.5 text-right ${
                  row.strong && roundCents(row.value) < 0 ? 'text-loss-700' : ''
                }`}
              >
                {row.minus ? `(${formatCAD(row.value)})` : formatCAD(row.value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
