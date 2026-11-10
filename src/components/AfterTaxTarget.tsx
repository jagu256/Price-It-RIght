import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatCAD } from '../lib/format';
import { preTaxMath, taxEstimateMath } from '../lib/showMath';
import { estimateTax, formatRate, parseTaxRate, requiredPreTaxProfit } from '../lib/tax';
import ShowMath from './ShowMath';
import { Field, parseSignedAmount } from './SmartPricing';
import { ErrorList, Notice, SignedMoney, SubHeader } from './ui';

export interface TaxPlanInput {
  on: boolean;
  target: string;
  rate: string;
}

/** The pre-tax target handed to "What price should I charge?" and the Profit Goal Tracker. */
export interface LinkedTarget {
  preTax: number;
  afterTax: number;
  ratePercent: number;
}

export const EMPTY_TAX_PLAN: TaxPlanInput = { on: false, target: '1000', rate: '' };

/** Works out the linked target from what was typed, or null when switched off or invalid. */
export function linkedTargetFrom(plan: TaxPlanInput): LinkedTarget | null {
  if (!plan.on) return null;
  const target = parseSignedAmount(plan.target);
  const rate = parseTaxRate(plan.rate);
  if (!target.ok || !rate.ok) return null;
  const r = requiredPreTaxProfit(target.value, rate.basisPoints);
  return r.status === 'ok' ? { preTax: r.preTax, afterTax: target.value, ratePercent: rate.percent } : null;
}

/** 🧾 Optional after-tax target profit (simplified estimate, not tax advice). */
export default function AfterTaxTarget({ plan, onChange }: { plan: TaxPlanInput; onChange: (p: TaxPlanInput) => void }) {
  const { model } = useStore();
  const s = model.summary!;
  const target = parseSignedAmount(plan.target);
  const rate = parseTaxRate(plan.rate);
  const required = target.ok && rate.ok ? requiredPreTaxProfit(target.value, rate.basisPoints) : null;
  const current = rate.ok ? estimateTax(s.operatingProfit, rate.basisPoints) : null;

  return (
    <section aria-labelledby="tax-title" className="card space-y-5 p-5 sm:p-8">
      <SubHeader
        id="tax-title"
        emoji="🧾"
        title={t('After-tax target profit (optional)')}
        subtitle={t('Plan for the profit you want to keep after income tax. The tools below then aim for the pre-tax profit needed.')}
      />
      <label className="flex items-start gap-2 text-sm font-semibold text-sage-900">
        <input type="checkbox" className="mt-1" checked={plan.on} onChange={(e) => onChange({ ...plan, on: e.target.checked })} />
        <span>{t('Plan with an after-tax target and my own income tax rate')}</span>
      </label>

      {plan.on && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="tax-target" label={t('Target monthly profit AFTER tax')} value={plan.target} onChange={(v) => onChange({ ...plan, target: v })} invalid={!target.ok} prefix="$" />
            <Field
              id="tax-rate"
              label={t('Income tax rate (%)')}
              value={plan.rate}
              onChange={(v) => onChange({ ...plan, rate: v })}
              invalid={plan.rate.trim() !== '' && !rate.ok}
              help={t('Enter your own rate, 0 to 100. No rate is built in.')}
            />
          </div>
          <ErrorList messages={[target.ok ? undefined : target.error, rate.ok || plan.rate.trim() === '' ? undefined : rate.error]} />
          {plan.rate.trim() === '' && <p className="text-sm text-sage-700">{t('Enter a tax rate to see the results.')}</p>}

          {required && required.status === 'not-available' && (
            <Notice tone="error" title={t('Not Available')}>{required.reason}</Notice>
          )}
          {required && required.status === 'ok' && current && rate.ok && target.ok && (
            <div aria-live="polite" className="space-y-3">
              <dl className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-sage-700 p-4 text-cream-50">
                  <dt className="text-xs font-bold uppercase tracking-wider opacity-90">{t('Required pre-tax operating profit')}</dt>
                  <dd className="mt-1 font-display text-3xl font-extrabold tabular-nums">{formatCAD(required.preTax)}</dd>
                </div>
                <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-sage-100">
                  <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Estimated tax on current profit')}</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums">{formatCAD(current.tax)}</dd>
                  <dd className="text-xs text-sage-600">
                    {current.noTax ? t('No tax on a loss or on $0.') : t('{rate} of {profit}', { rate: formatRate(rate.percent), profit: formatCAD(current.operatingProfit) })}
                  </dd>
                </div>
                <div className="rounded-2xl bg-cream-50 p-4 ring-1 ring-sage-100">
                  <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('After-tax operating profit (current plan)')}</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums"><SignedMoney value={current.afterTax} text={formatCAD(current.afterTax)} /></dd>
                </div>
              </dl>
              <ShowMath label={t('the after-tax target')} items={[...preTaxMath(target.value, rate.percent, required), ...taxEstimateMath(current, rate.percent)]} />
              <p className="text-sm font-semibold text-sage-800">
                ✅ {t('“What Price Should I Charge?” and the Profit Goal Tracker below now aim for {amount} of operating profit (before tax).', { amount: formatCAD(required.preTax) })}
              </p>
            </div>
          )}
          <Notice tone="warn" title={t('Simplified estimate – not tax advice')}>
            {t(
              'Operating profit is treated as taxable income at one flat rate. Interest, deductions, losses carried forward, instalments and sales taxes (GST/HST/PST) are ignored. Check real tax figures with an accountant or the CRA.',
            )}
          </Notice>
        </>
      )}
    </section>
  );
}
