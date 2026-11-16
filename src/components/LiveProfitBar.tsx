import { useStore } from '../app/StoreContext';
import { plural, t } from '../i18n/i18n';
import { formatCAD } from '../lib/format';

/**
 * 📈 A small bar that stays at the bottom of My Business while you type, so
 * you see the effect of every change straight away. It shows the same
 * figures as the Profit Dashboard (model.summary) – it does no maths itself.
 */
export default function LiveProfitBar() {
  const { model } = useStore();
  const s = model.summary;
  // Number of fields with a message (each product can have several).
  const problems = Object.values(model.productErrors).reduce((n, e) => n + Object.keys(e).length, 0) + (model.fixedError ? 1 : 0);

  return (
    <aside aria-label={t('Live results')} className="sticky bottom-20 sm:bottom-3 z-20 mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl bg-sage-800 px-4 py-2.5 text-sm text-cream-50 shadow-lift ring-1 ring-sage-900/20">
        {s ? (
          <>
            <span>
              {t('Revenue')} <strong className="tabular-nums">{formatCAD(s.totalRevenue)}</strong>
            </span>
            <span>
              {t('CM')} <strong className="tabular-nums">{formatCAD(s.totalCM)}</strong>
            </span>
            <span className={s.operatingProfit < 0 ? 'font-bold text-butter-200' : 'font-bold'}>
              {s.operatingProfit < 0 ? t('Operating loss') : t('Operating profit')}{' '}
              <span className="tabular-nums">{formatCAD(s.operatingProfit)}</span>
            </span>
          </>
        ) : (
          <span className="font-semibold text-butter-200">
            {model.data.products.length === 0
              ? t('Add a product to see your results.')
              : problems > 0
                ? plural(problems, 'Fix {n} highlighted field to see your results.', 'Fix {n} highlighted fields to see your results.', { n: problems })
                : t('Results are paused until every value is valid.')}
          </span>
        )}
        <a href="#dashboard" className="font-semibold underline decoration-cream-50/50 underline-offset-2 hover:decoration-cream-50">
          {t('See the dashboard')} →
        </a>
      </div>
    </aside>
  );
}
