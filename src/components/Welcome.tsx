const STEPS = [
  { n: 1, title: 'Choose your business', text: 'Pick a coffee shop, bakery, nail salon, clothing store or your own idea.' },
  { n: 2, title: 'Enter your numbers', text: 'Your price, the cost of each unit, monthly fixed costs and expected sales.' },
  { n: 3, title: 'Discover your profit potential', text: 'See profit, break-even and margin of safety – then test a new price.' },
];

export default function Welcome() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="dot-grid absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pt-20">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-butter-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-butter-700">
            Small Business Pricing Simulator
          </p>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] text-sage-900 sm:text-6xl lg:text-7xl">
            Price It Right
          </h1>
          <p className="mt-4 font-display text-xl font-semibold text-sage-700 sm:text-2xl">
            Set your price. Know your costs. Maximize your profit.
          </p>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-sage-800/90">
            A friendly simulator for small-business owners and student entrepreneurs. See how your selling
            price, the cost of each sale, your monthly fixed costs and your sales volume work together to
            create – or erase – profit. No account needed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#simulator" className="btn-primary px-8 py-4 text-lg">
              Start Pricing
              <span aria-hidden="true">→</span>
            </a>
            <a href="#learn" className="font-semibold text-sage-700 underline decoration-sage-300 underline-offset-4 hover:decoration-sage-600">
              New to accounting terms?
            </a>
          </div>
        </div>

        <HeroTag />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="card animate-rise p-5"
              style={{ animationDelay: `${120 + i * 90}ms` }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 font-display font-bold text-sage-800">
                {s.n}
              </span>
              <h2 className="mt-3 text-lg font-bold text-sage-900">{s.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-sage-700">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** Decorative swinging price tag + mini receipt. */
function HeroTag() {
  return (
    <div className="relative mx-auto h-[300px] w-full max-w-[340px] sm:h-[340px]" aria-hidden="true">
      {/* the "hook" the tag hangs from */}
      <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-sage-700" />
      <div className="absolute left-1/2 top-1 origin-top animate-swing" style={{ transformOrigin: '0 0' }}>
        <svg width="190" height="250" viewBox="0 0 190 250" className="-translate-x-[18px] drop-shadow-[0_18px_22px_rgba(35,52,37,0.25)]">
          <path d="M18 0 C 30 30, 40 50, 62 70" stroke="#3E5A40" strokeWidth="2.5" fill="none" />
          <g transform="translate(30 62) rotate(-8)">
            <path
              d="M38 0h96a12 12 0 0 1 12 12v140a12 12 0 0 1-12 12H38a12 12 0 0 1-9-4L4 128a12 12 0 0 1 0-16l0 0V54a12 12 0 0 1 3-8L29 4a12 12 0 0 1 9-4z"
              fill="#FAEDA8"
            />
            <circle cx="34" cy="26" r="7" fill="#FBF7EC" stroke="#C9A227" strokeWidth="2" />
            <text x="88" y="78" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="15" fontWeight="700" fill="#7A6012">
              YOUR PRICE
            </text>
            <text x="88" y="118" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="40" fontWeight="800" fill="#304633">
              $6.00
            </text>
            <line x1="44" y1="136" x2="132" y2="136" stroke="#C9A227" strokeWidth="2" strokeDasharray="4 5" />
          </g>
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-48 rotate-3 rounded-2xl border border-sage-100 bg-white p-4 text-sm shadow-lift">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-sage-500">This month</p>
        <dl className="mt-2 space-y-1 tabular-nums">
          <div className="flex justify-between"><dt className="text-sage-700">Revenue</dt><dd>$1,800</dd></div>
          <div className="flex justify-between"><dt className="text-sage-700">Costs</dt><dd>$1,400</dd></div>
          <div className="mt-1 flex justify-between border-t border-dashed border-sage-200 pt-1 font-bold text-sage-700">
            <dt>Profit</dt><dd>$400</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
