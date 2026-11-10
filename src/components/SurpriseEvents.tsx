import { t } from '../i18n/i18n';
import { useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { EVENTS, applyEvent, pickEvent, type EventId } from '../lib/events';
import { formatCAD, formatSignedCAD } from '../lib/format';
import { buildModel } from '../lib/model';
import { checkPlan } from '../lib/planning';
import { Notice, SignedMoney, SubHeader } from './ui';

/** 🎲 Surprise Me! – fictional what-if events. Nothing changes until "Accept". */
export default function SurpriseEvents() {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const [active, setActive] = useState<{ id: EventId; itemId?: string; amount: string } | null>(null);

  const spec = active ? EVENTS.find((e) => e.id === active.id)! : null;
  const amount = active ? Number(active.amount) : NaN;
  const amountOk = active !== null && active.amount.trim() !== '' && Number.isFinite(amount) && amount >= 0 && (spec?.kind === '$' || amount <= 100);
  const after = active && amountOk ? buildModel(applyEvent(state.business, active.id, amount, active.itemId)) : null;
  const itemName = active?.itemId ? state.business.inventory.find((i) => i.id === active.itemId)?.name : undefined;

  const before = model.summary!;
  const afterProfit = after?.summary?.operatingProfit ?? null;

  let shortageNote: string | null = null;
  let shortageWarn = false;
  if (after && active?.id && ['inventory-shortage', 'demand-up'].includes(active.id) && Object.keys(after.stockErrors).length === 0 && after.stock.length > 0) {
    const demand = Object.fromEntries(after.products.map((p) => [p.id, p.units]));
    const short = checkPlan(demand, after.products, after.recipes, after.stock).items.filter((i) => i.status === 'shortage').map((i) => i.name);
    shortageNote = short.length ? t('After this event, expected sales would need more {items} than you have.', { items: short.join(', ') }) : t('Your inventory would still cover expected sales.');
    shortageWarn = short.length > 0;
  }

  const accept = async () => {
    if (!active || !amountOk) return;
    const ok = await confirm({
      title: t('Apply this event to your business plan?'),
      message: t('Your products, costs or inventory will be updated with the event’s changes. You can edit them again afterwards.'),
      confirmLabel: t('Accept event'),
    });
    if (ok) {
      dispatch({ type: 'replace-business', business: applyEvent(state.business, active.id, amount, active.itemId) });
      setActive(null);
    }
  };

  return (
    <section aria-labelledby="events-title" className="card space-y-4 p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SubHeader id="events-title" emoji="🎲" title={t('Surprise Business Events')} subtitle={t('Practise reacting to the unexpected. These are hypothetical scenarios, not forecasts.')} />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            const pick = pickEvent(state.business);
            setActive({ id: pick.event.id, itemId: pick.itemId, amount: String(pick.event.defaultAmount) });
          }}
        >
          🎲 {t('Surprise Me!')}
        </button>
      </div>

      {active && spec && (
        <div className="animate-rise space-y-4 rounded-3xl bg-butter-100 p-5 ring-1 ring-butter-300" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-butter-700">{t('Hypothetical event')}</p>
          <h4 className="text-2xl font-bold text-sage-900">
            <span aria-hidden="true">{spec.emoji} </span>
            {t(spec.title)}
          </h4>
          <p className="text-sage-800">{spec.describe(amountOk ? amount : spec.defaultAmount, itemName)}</p>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="event-amount" className="text-sm font-semibold text-sage-900">{t('Modify the size of the change:')}</label>
            {spec.kind === '$' && <span aria-hidden="true">$</span>}
            <input id="event-amount" className="select w-24" inputMode="decimal" value={active.amount} onChange={(e) => setActive({ ...active, amount: e.target.value })} aria-invalid={!amountOk || undefined} />
            {spec.kind === '%' && <span>%</span>}
            {!amountOk && <span className="text-sm font-semibold text-loss-700">⚠ {spec.kind === '%' ? t('Enter a percentage from 0 to 100.') : t('Enter an amount of $0 or more.')}</span>}
          </div>

          {after && (
            <dl className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Profit before')}</dt>
                <dd className="font-display text-xl font-extrabold"><SignedMoney value={before.operatingProfit} text={formatCAD(before.operatingProfit)} /></dd>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Updated profit projection')}</dt>
                <dd className="font-display text-xl font-extrabold">{afterProfit === null ? t('Not Available') : <SignedMoney value={afterProfit} text={formatCAD(afterProfit)} />}</dd>
              </div>
              <div className="rounded-2xl bg-white p-3">
                <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Financial impact')}</dt>
                <dd className="font-display text-xl font-extrabold">{afterProfit === null ? '—' : <SignedMoney value={afterProfit - before.operatingProfit} text={formatSignedCAD(afterProfit - before.operatingProfit)} />}</dd>
              </div>
            </dl>
          )}
          {shortageNote && <Notice tone={shortageWarn ? 'warn' : 'success'}>{shortageNote}</Notice>}

          <div>
            <p className="text-sm font-semibold text-sage-900">{t('How you could respond:')}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-sage-800">
              {spec.responses.map((r) => <li key={r}>{t(r)}</li>)}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={accept} disabled={!amountOk}>{t('Accept event')}</button>
            <button type="button" className="btn-secondary" onClick={() => setActive(null)}>↺ {t('Reset (ignore event)')}</button>
          </div>
        </div>
      )}
    </section>
  );
}
