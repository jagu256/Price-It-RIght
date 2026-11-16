import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatCAD, formatPercent, unitsLabel } from '../lib/format';
import { joinNames } from '../lib/inventory';
import { checkPlan } from '../lib/planning';

/**
 * 🎬 Presentation mode: the business's key results as large slides, for an
 * oral demo or a projector. ← / → (or the buttons) move between slides, Esc
 * closes. Every figure comes from the same model as the rest of the app.
 */
export function PresentButton() {
  const { model } = useStore();
  const [open, setOpen] = useState(false);
  if (!model.summary) return null;
  return (
    <>
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>🎬 {t('Presentation mode')}</button>
      {open && <Presentation onClose={() => setOpen(false)} />}
    </>
  );
}

function Presentation({ onClose }: { onClose: () => void }) {
  const { model } = useStore();
  const s = model.summary!;
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const name = model.data.name.trim() || t('My business');

  const be = s.breakEven;
  const maxCM = Math.max(1, ...s.products.map((p) => Math.abs(p.totalCM)));
  const stockReady = model.data.inventory.length > 0 && Object.keys(model.stockErrors).length === 0;
  const check = stockReady ? checkPlan(Object.fromEntries(model.products.map((p) => [p.id, p.units])), model.products, model.recipes, model.stock) : null;
  const short = check ? check.items.filter((x) => x.shortageBase > 0).map((x) => x.name) : [];

  const slides: { title: string; body: ReactNode }[] = [
    {
      title: name,
      body: (
        <div className="space-y-4 text-center">
          <p className="font-display text-3xl font-bold sm:text-5xl">Price It Right</p>
          <p className="text-xl opacity-90 sm:text-2xl">{t('Set your price. Know your costs. Maximize your profit.')}</p>
          {model.data.isDemo && <p className="text-lg opacity-80">{t('Fictional demo data')} · CAD</p>}
        </div>
      ),
    },
    {
      title: t('Each month'),
      body: (
        <dl className="grid gap-6 text-center sm:grid-cols-3">
          <Big label={t('Revenue')} value={formatCAD(s.totalRevenue)} />
          <Big label={t('Contribution margin')} value={formatCAD(s.totalCM)} note={s.overallCMRatio === null ? undefined : t('{pct} of revenue', { pct: formatPercent(s.overallCMRatio) })} />
          <Big label={s.operatingProfit < 0 ? t('Operating loss') : t('Operating profit')} value={formatCAD(s.operatingProfit)} note={t('after {fixed} of fixed costs', { fixed: formatCAD(s.fixedCosts) })} />
        </dl>
      ),
    },
    {
      title: t('Contribution by product'),
      body: (
        <ul className="mx-auto max-w-3xl space-y-3">
          {s.products.map((p) => (
            <li key={p.id} className="grid grid-cols-[8rem_1fr_7rem] items-center gap-3 text-lg sm:text-xl">
              <span className="truncate font-semibold">{p.name}</span>
              <span className="h-6 overflow-hidden rounded-full bg-cream-50/20">
                <span className={`block h-full rounded-full ${p.totalCM < 0 ? 'bg-loss-100' : 'bg-butter-300'}`} style={{ width: `${(Math.abs(p.totalCM) / maxCM) * 100}%` }} />
              </span>
              <span className="text-right tabular-nums">{formatCAD(p.totalCM)}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: t('Break-even'),
      body:
        be.status === 'reachable' ? (
          <dl className="grid gap-6 text-center sm:grid-cols-3">
            <Big label={t('Units to break even')} value={unitsLabel(be.totalUnits)} note={t('at the expected sales mix')} />
            <Big label={t('Break-even revenue')} value={formatCAD(be.revenueExact)} />
            <Big label={t('Margin of safety')} value={s.marginOfSafety === null ? t('N/A') : formatCAD(s.marginOfSafety)} note={s.marginOfSafetyPercent === null ? undefined : t('{pct} of revenue', { pct: formatPercent(s.marginOfSafetyPercent) })} />
          </dl>
        ) : (
          <p className="text-center text-2xl">{t('Not available for the current numbers – see the Profit Dashboard for why.')}</p>
        ),
    },
    {
      title: t('Inventory'),
      body: (
        <p className="mx-auto max-w-3xl text-center text-2xl leading-relaxed">
          {!check
            ? t('No valid inventory has been entered yet.')
            : short.length > 0
              ? t('Expected sales need more {items} than you have – the {profit} profit is not achievable until you buy more.', { items: joinNames(short), profit: formatCAD(s.operatingProfit) })
              : check.feasibility === 'feasible'
                ? t('Current inventory covers expected sales for every product with a recipe.')
                : t('No shortages found, but some products have no recipe, so their inventory needs are unknown.')}
        </p>
      ),
    },
    {
      title: t('Keep in mind'),
      body: (
        <ul className="mx-auto max-w-3xl list-disc space-y-2 pl-6 text-xl">
          <li>{t('Fixed costs are subtracted once for the whole business, never per product.')}</li>
          <li>{t('Break-even assumes the sales mix stays the same.')}</li>
          <li>{t('Operating profit is not net income: taxes and interest are not included.')}</li>
          <li>{t('All results depend on the numbers entered – an educational tool, not financial advice.')}</li>
        </ul>
      ),
    },
  ];
  const last = slides.length - 1;

  useEffect(() => {
    box.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') setI((n) => Math.min(last, n + 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [last, onClose]);

  return createPortal(
    <div ref={box} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t('Presentation mode')} className="fixed inset-0 z-[60] flex flex-col bg-sage-900 p-6 text-cream-50 outline-none sm:p-12">
      <div className="flex items-center justify-between text-sm opacity-80">
        <span>Price It Right · {name}</span>
        <span>{t('Slide {n} of {total}', { n: i + 1, total: slides.length })}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-8 overflow-y-auto py-6" aria-live="polite">
        <h2 className="text-center font-display text-4xl font-extrabold sm:text-6xl">{slides[i].title}</h2>
        {slides[i].body}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="rounded-full px-4 py-2 font-semibold ring-1 ring-cream-50/40 hover:bg-cream-50/10" onClick={onClose}>✕ {t('Exit')}</button>
        <p className="hidden text-sm opacity-70 sm:block">{t('Use ← → to move, Esc to exit')}</p>
        <div className="flex gap-2">
          <button type="button" disabled={i === 0} className="rounded-full px-4 py-2 font-semibold ring-1 ring-cream-50/40 hover:bg-cream-50/10 disabled:opacity-40" onClick={() => setI(i - 1)}>← {t('Back')}</button>
          <button type="button" disabled={i === last} className="rounded-full bg-butter-200 px-5 py-2 font-bold text-sage-900 hover:bg-butter-300 disabled:opacity-40" onClick={() => setI(i + 1)}>{t('Next')} →</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Big({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm font-bold uppercase tracking-wider opacity-80 sm:text-base">{label}</dt>
      <dd className="mt-2 font-display text-4xl font-extrabold tabular-nums sm:text-6xl">{value}</dd>
      {note && <dd className="mt-1 text-base opacity-80">{note}</dd>}
    </div>
  );
}
