import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import LearnSection from '../components/LearnSection';
import { Rich } from '../components/ui';
import { t, tx } from '../i18n/i18n';
import { formatCAD } from '../lib/format';
import { hasUnsavedWork } from '../lib/store';

const STEPS = [
  { title: tx('Choose your business'), text: tx('Coffee shop, bakery, nail salon, clothing store or your own idea.') },
  { title: tx('Add your products'), text: tx('Prices, variable costs and how many you expect to sell each month.') },
  { title: tx('Enter costs or upload inventory'), text: tx('Type your stock in, or upload an Excel or CSV file.') },
  { title: tx('Discover your profit potential'), text: tx('Profit, break-even, pricing scenarios and production plans.') },
];

export default function Home() {
  const { state, dispatch } = useStore();
  const confirm = useConfirm();

  const tryDemo = async () => {
    if (
      hasUnsavedWork(state) &&
      !(await confirm({
        title: t('Load the demo business?'),
        message: t('This replaces your current products, costs and inventory with fictional demo data. Your changes will be lost.'),
        confirmLabel: t('Load demo'),
        danger: true,
      }))
    )
      return;
    dispatch({ type: 'load-sample', business: 'demo' });
    window.location.hash = 'dashboard';
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-12 pt-12 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pt-16">
          <div className="animate-rise">
            <p className="inline-flex rounded-full bg-butter-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-butter-700">
              {t('Small Business Pricing, Inventory & Profit Simulator')}
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] text-sage-900 sm:text-6xl lg:text-7xl">Price It Right</h1>
            <p className="mt-4 font-display text-xl font-semibold text-sage-700 sm:text-2xl">{t('Set your price. Know your costs. Maximize your profit.')}</p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sage-800/90">
              {t('Make smarter business decisions with an interactive tool that helps you price products, track inventory, calculate profits, and plan production.')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#my-business" className="btn-primary px-7 py-4 text-lg">
                <span aria-hidden="true">🚀</span> {t('Start My Business')}
              </a>
              <button type="button" onClick={tryDemo} className="btn-secondary px-6 py-4 text-lg">
                <span aria-hidden="true">✨</span> {t('Try a Demo Business')}
              </button>
            </div>
            <p className="mt-3 text-sm text-sage-600">
              <Rich text={t('The demo loads a complete **fictional** café with products, costs, inventory and recipes. No account needed.')} />
            </p>
          </div>
          <HeroCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6" aria-labelledby="steps-title">
        <h2 id="steps-title" className="sr-only">{t('How it works')}</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card animate-rise p-5" style={{ animationDelay: `${100 + i * 80}ms` }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 font-display font-bold text-sage-800">{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold text-sage-900">{t(s.title)}</h3>
              <p className="mt-1 text-sm leading-relaxed text-sage-700">{t(s.text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <LearnSection />
    </div>
  );
}

/** A decorative preview of the fictional demo café (its numbers match the demo). */
function HeroCard() {
  const rows: [string, number][] = [
    [`☕ ${t('Coffee')}`, 1800],
    [`🧁 ${t('Muffin')}`, 600],
    [`🥪 ${t('Sandwich')}`, 900],
    [`🍪 ${t('Cookie')}`, 600],
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="rotate-[-2deg] rounded-3xl border border-sage-100 bg-white p-5 shadow-lift">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-sage-500">{t('This month · fictional café')}</p>
        <dl className="mt-3 space-y-1.5 text-sm tabular-nums">
          {rows.map(([a, b]) => (
            <div key={a} className="flex justify-between">
              <dt className="text-sage-700">{a}</dt>
              <dd>{formatCAD(b)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-dashed border-sage-200 pt-1.5">
            <dt className="text-sage-700">{t('Contribution margin')}</dt>
            <dd>{formatCAD(2475)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sage-700">{t('Fixed costs')}</dt>
            <dd>({formatCAD(1500)})</dd>
          </div>
          <div className="flex justify-between font-bold text-sage-700">
            <dt>{t('Operating profit')}</dt>
            <dd>{formatCAD(975)}</dd>
          </div>
        </dl>
      </div>
      <div className="absolute -bottom-6 -left-4 rotate-[4deg] rounded-2xl bg-butter-200 px-4 py-3 text-sm font-bold text-butter-700 shadow-soft">
        📦 {t('Milk is your limiting item')}
      </div>
    </div>
  );
}
