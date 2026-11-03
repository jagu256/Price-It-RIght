import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import LearnSection from '../components/LearnSection';
import { hasUnsavedWork } from '../lib/store';

const STEPS = [
  { title: 'Choose your business', text: 'Coffee shop, bakery, nail salon, clothing store or your own idea.' },
  { title: 'Add your products', text: 'Prices, variable costs and how many you expect to sell each month.' },
  { title: 'Enter costs or upload inventory', text: 'Type your stock in, or upload an Excel or CSV file.' },
  { title: 'Discover your profit potential', text: 'Profit, break-even, pricing scenarios and production plans.' },
];

export default function Home() {
  const { state, dispatch } = useStore();
  const confirm = useConfirm();

  const tryDemo = async () => {
    if (
      hasUnsavedWork(state) &&
      !(await confirm({
        title: 'Load the demo business?',
        message: 'This replaces your current products, costs and inventory with fictional demo data. Your changes will be lost.',
        confirmLabel: 'Load demo',
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
              Small Business Pricing, Inventory &amp; Profit Simulator
            </p>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] text-sage-900 sm:text-6xl lg:text-7xl">Price It Right</h1>
            <p className="mt-4 font-display text-xl font-semibold text-sage-700 sm:text-2xl">Set your price. Know your costs. Maximize your profit.</p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-sage-800/90">
              Make smarter business decisions with an interactive tool that helps you price products, track inventory, calculate
              profits, and plan production.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#my-business" className="btn-primary px-7 py-4 text-lg">
                <span aria-hidden="true">🚀</span> Start My Business
              </a>
              <button type="button" onClick={tryDemo} className="btn-secondary px-6 py-4 text-lg">
                <span aria-hidden="true">✨</span> Try a Demo Business
              </button>
            </div>
            <p className="mt-3 text-sm text-sage-600">
              The demo loads a complete <strong>fictional</strong> café with products, costs, inventory and recipes. No account needed.
            </p>
          </div>
          <HeroCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6" aria-labelledby="steps-title">
        <h2 id="steps-title" className="sr-only">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card animate-rise p-5" style={{ animationDelay: `${100 + i * 80}ms` }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 font-display font-bold text-sage-800">{i + 1}</span>
              <h3 className="mt-3 text-lg font-bold text-sage-900">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-sage-700">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <LearnSection />
    </div>
  );
}

function HeroCard() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="rotate-[-2deg] rounded-3xl border border-sage-100 bg-white p-5 shadow-lift">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-sage-500">This month · fictional café</p>
        <dl className="mt-3 space-y-1.5 text-sm tabular-nums">
          {[
            ['☕ Coffee', '$1,800'],
            ['🧁 Muffin', '$600'],
            ['🥪 Sandwich', '$900'],
            ['🍪 Cookie', '$600'],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between">
              <dt className="text-sage-700">{a}</dt>
              <dd>{b}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-dashed border-sage-200 pt-1.5">
            <dt className="text-sage-700">Contribution margin</dt>
            <dd>$2,475</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sage-700">Fixed costs</dt>
            <dd>($1,500)</dd>
          </div>
          <div className="flex justify-between font-bold text-sage-700">
            <dt>Operating profit</dt>
            <dd>$975</dd>
          </div>
        </dl>
      </div>
      <div className="absolute -bottom-6 -left-4 rotate-[4deg] rounded-2xl bg-butter-200 px-4 py-3 text-sm font-bold text-butter-700 shadow-soft">
        📦 Milk is your limiting item
      </div>
    </div>
  );
}
