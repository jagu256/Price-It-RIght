import { useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { CASH_MONTHS, cashBudget, parseCollectedPercent } from '../lib/cashBudget';
import { formatCAD } from '../lib/format';
import { parseMultiplier } from '../lib/projection';
import { parseAmount } from '../lib/validation';
import { CellInput, ErrorList, Notice, SignedMoney, SubHeader } from './ui';

type MonthText = { level: string; extra: string; other: string };
const blank = (): MonthText[] => Array.from({ length: CASH_MONTHS }, () => ({ level: '100', extra: '0', other: '0' }));

/** 💵 3-month cash budget. Its inputs are an experiment – kept on this screen only and never saved. */
export default function CashBudget() {
  const { model } = useStore();
  const [openingText, setOpeningText] = useState('500');
  const [owedText, setOwedText] = useState('0');
  const [collectedText, setCollectedText] = useState('100');
  const [months, setMonths] = useState<MonthText[]>(blank);
  if (!model.summary || model.fixedCosts === null) return null;

  const opening = parseAmount(openingText, 'opening cash');
  const owed = parseAmount(owedText, 'amount still to collect');
  const collected = parseCollectedPercent(collectedText);
  const parsed = months.map((m) => ({ level: parseMultiplier(m.level), extra: parseAmount(m.extra, 'extra stock bought'), other: parseAmount(m.other, 'other cash payments') }));
  const errors = [
    opening.ok ? undefined : opening.error,
    owed.ok ? undefined : owed.error,
    collected.ok ? undefined : collected.error,
    ...parsed.flatMap((p, i) => [
      p.level.ok ? undefined : t('Month {n} sales level: {error}', { n: i + 1, error: p.level.error }),
      p.extra.ok ? undefined : t('Month {n}: {error}', { n: i + 1, error: p.extra.error }),
      p.other.ok ? undefined : t('Month {n}: {error}', { n: i + 1, error: p.other.error }),
    ]),
  ];
  const valid = opening.ok && owed.ok && collected.ok && parsed.every((p) => p.level.ok && p.extra.ok && p.other.ok);
  const r =
    valid && opening.ok && owed.ok && collected.ok
      ? cashBudget(model.products, model.fixedCosts, {
          openingCash: opening.value,
          openingReceivables: owed.value,
          collectedNowBasisPoints: collected.basisPoints,
          months: parsed.map((p) => ({ levelBasisPoints: p.level.ok ? p.level.basisPoints : 0, extraPurchases: p.extra.ok ? p.extra.value : 0, otherPayments: p.other.ok ? p.other.value : 0 })),
        })
      : null;
  const setMonth = (i: number, key: keyof MonthText, v: string) => setMonths((list) => list.map((m, j) => (j === i ? { ...m, [key]: v } : m)));
  const row = (label: string, get: (m: NonNullable<typeof r>['months'][number]) => number, opts: { strong?: boolean; signed?: boolean } = {}) =>
    r && (
      <tr className={opts.strong ? 'font-bold' : ''}>
        <th scope="row">{label}</th>
        {r.months.map((m) => (
          <td key={m.month} className="text-right">{opts.signed ? <SignedMoney value={get(m)} text={formatCAD(get(m))} /> : formatCAD(get(m))}</td>
        ))}
      </tr>
    );

  return (
    <section aria-labelledby="cash-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader id="cash-title" emoji="💵" title={t('3-month cash budget')} subtitle={t('Profit is not cash. See the cash you would have at the end of each month when customers pay later or you buy extra stock. Nothing here changes your business.')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Labelled id="cash-opening" label={t('Cash at the start')} prefix="$" value={openingText} invalid={!opening.ok} onChange={setOpeningText} />
        <Labelled id="cash-collected" label={t('% of sales paid in the same month')} suffix="%" value={collectedText} invalid={!collected.ok} onChange={setCollectedText} help={t('The rest is paid the following month (e.g. invoices to businesses).')} />
        <Labelled id="cash-owed" label={t('Still to collect from earlier sales')} prefix="$" value={owedText} invalid={!owed.ok} onChange={setOwedText} />
      </div>

      <div className="overflow-x-auto">
        <table className="data-table min-w-[34rem]">
          <caption className="sr-only">{t('Monthly inputs and cash results')}</caption>
          <thead>
            <tr>
              <th scope="col"><span className="sr-only">{t('Measure')}</span></th>
              {months.map((_, i) => <th key={i} scope="col" className="text-right">{t('Month {n}', { n: i + 1 })}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{t('Sales level (%)')}</th>
              {months.map((m, i) => <td key={i}><div className="flex justify-end"><CellInput id={`cash-level-${i}`} label={t('Month {n} sales level (%)', { n: i + 1 })} value={m.level} invalid={!parsed[i].level.ok} width="w-20" onChange={(v) => setMonth(i, 'level', v)} /></div></td>)}
            </tr>
            <tr>
              <th scope="row">{t('Extra stock bought')}</th>
              {months.map((m, i) => <td key={i}><div className="flex justify-end"><CellInput id={`cash-extra-${i}`} label={t('Month {n} extra stock bought', { n: i + 1 })} prefix="$" value={m.extra} invalid={!parsed[i].extra.ok} width="w-24" onChange={(v) => setMonth(i, 'extra', v)} /></div></td>)}
            </tr>
            <tr>
              <th scope="row">{t('Other cash payments')}</th>
              {months.map((m, i) => <td key={i}><div className="flex justify-end"><CellInput id={`cash-other-${i}`} label={t('Month {n} other cash payments', { n: i + 1 })} prefix="$" value={m.other} invalid={!parsed[i].other.ok} width="w-24" onChange={(v) => setMonth(i, 'other', v)} /></div></td>)}
            </tr>
            {row(t('Sales'), (m) => m.sales)}
            {row(t('Cash from sales'), (m) => m.cashFromSales)}
            {row(t('Cash paid out'), (m) => m.cashPaid)}
            {row(t('Net cash flow'), (m) => m.netCashFlow, { signed: true })}
            {row(t('Cash at the end of the month'), (m) => m.closingCash, { strong: true, signed: true })}
            {row(t('Operating profit (for comparison)'), (m) => m.operatingProfit, { signed: true })}
          </tbody>
        </table>
      </div>
      <ErrorList messages={errors} />
      {!valid && <p className="text-sm font-semibold text-loss-700">{t('Fix the highlighted values to see the cash budget.')}</p>}
      {r && r.shortfallMonths.length > 0 && (
        <Notice tone="warn" title={t('Cash shortfall')}>
          {t('Cash runs below $0 in month {months} (lowest {amount}), even though the business may be profitable. You would need savings, a loan or faster customer payments to cover it.', { months: r.shortfallMonths.join(', '), amount: formatCAD(r.lowestClosingCash) })}
        </Notice>
      )}
      {r && r.closingReceivables > 0 && <p className="text-sm text-sage-700">{t('After month 3, customers still owe {amount}.', { amount: formatCAD(r.closingReceivables) })}</p>}
      <Notice tone="idea" title={t('Why cash and profit differ')}>
        {t('Cash paid out = the month’s variable costs + fixed costs + extra stock bought + other cash payments (like repaying a loan). Extra stock and loan repayments use cash but are not expenses, and a sale paid later is revenue before it is cash. That is why a profitable month can still run short of cash. Taxes, GST/HST and owner withdrawals are not included.')}
      </Notice>
    </section>
  );
}

function Labelled({ id, label, value, onChange, invalid, prefix, suffix, help }: { id: string; label: string; value: string; onChange: (v: string) => void; invalid: boolean; prefix?: string; suffix?: string; help?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-sage-900">{label}</label>
      <div className="mt-1 flex items-center gap-1">
        <CellInput id={id} label={label} value={value} onChange={onChange} invalid={invalid} prefix={prefix} width="w-full" />
        {suffix && <span className="text-sm text-sage-600">{suffix}</span>}
      </div>
      {help && <p className="mt-1 text-xs text-sage-600">{help}</p>}
    </div>
  );
}
