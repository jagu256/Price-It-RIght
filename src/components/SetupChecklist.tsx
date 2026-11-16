import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { setupChecklist } from '../lib/setupChecklist';

/** ✅ Shows what is set up so far, with a link to whatever is missing. It ticks itself off as you work. */
export default function SetupChecklist() {
  const { model } = useStore();
  const c = setupChecklist(model);
  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6" aria-labelledby="checklist-title">
      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="checklist-title" className="font-display text-xl font-bold text-sage-900">✅ {t('Your setup checklist')}</h2>
          <p className="text-sm font-semibold text-sage-700">{t('{done} of {total} done', { done: c.done, total: c.total })}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-sage-100" role="progressbar" aria-label={t('Setup progress')} aria-valuemin={0} aria-valuemax={c.total} aria-valuenow={c.done}>
          <div className="h-full rounded-full bg-sage-600 transition-all" style={{ width: `${(c.done / c.total) * 100}%` }} />
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {c.items.map((i) => (
            <li key={i.id} className={`flex items-start gap-3 rounded-2xl p-3 ring-1 ${i.done ? 'bg-sage-50 ring-sage-100' : 'bg-white ring-sage-200'}`}>
              <span aria-hidden="true" className="mt-0.5 text-lg">{i.done ? '✅' : '⬜'}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${i.done ? 'text-sage-700' : 'text-sage-900'}`}>
                  <span className="sr-only">{i.done ? t('Done:') : t('To do:')} </span>
                  {t(i.label)}
                  {i.optional && <span className="ml-2 rounded-full bg-butter-100 px-2 py-0.5 text-xs font-bold text-butter-700">{t('optional')}</span>}
                </p>
                {!i.done && <p className="text-sm text-sage-600">{t(i.hint)}</p>}
              </div>
              {!i.done && (
                <a href={`#${i.section}`} className="shrink-0 text-sm font-bold text-sage-700 underline underline-offset-2 hover:text-sage-900" aria-label={t('Go to: {label}', { label: t(i.label) })}>
                  {t('Go')} →
                </a>
              )}
            </li>
          ))}
        </ul>
        {c.servicesOnly && <p className="mt-3 text-sm text-sage-700">{t('No inventory entered – that’s fine for a service business, so inventory and recipes are left out. If your products use stock, add it in the 📦 Smart Inventory Hub.')}</p>}
        {c.essentialsDone && <p className="mt-3 text-sm font-semibold text-sage-700">🎉 {t('The essentials are done – open the Profit Dashboard to see your results.')}</p>}
      </div>
    </section>
  );
}
