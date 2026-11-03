const CONCEPTS = [
  {
    term: 'Revenue',
    formula: 'Selling price × units sold',
    text: 'All the money that comes in from customers before any costs are taken out.',
  },
  {
    term: 'Variable Costs',
    formula: 'Variable cost per unit × units sold',
    text: 'Costs that rise and fall with each sale – like coffee beans, flour, nail polish or packaging.',
  },
  {
    term: 'Fixed Costs',
    formula: 'Same total each month',
    text: 'Costs that generally stay the same within the relevant activity range, like rent, insurance or software.',
  },
  {
    term: 'Contribution Margin',
    formula: 'Selling price − variable cost per unit',
    text: 'What each sale has left over to “contribute” toward paying fixed costs – and then to profit.',
  },
  {
    term: 'Break-Even Point',
    formula: 'Fixed costs ÷ contribution margin per unit',
    text: 'The sales level where total revenue equals total costs: no profit, no loss. Rounded up to whole units.',
  },
  {
    term: 'Operating Profit',
    formula: 'Revenue − variable costs − fixed costs',
    text: 'What is left after paying for everything it takes to run the business for the month. Negative means a loss.',
  },
  {
    term: 'Margin of Safety',
    formula: 'Projected revenue − break-even revenue',
    text: 'How much sales could fall before the business starts losing money. Bigger is a larger cushion.',
  },
];

export default function LearnSection() {
  return (
    <section id="learn" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
      <p className="eyebrow">Learn</p>
      <h2 className="section-title mt-1">Understand Your Numbers</h2>
      <p className="mt-2 max-w-2xl text-sage-700">Seven ideas behind every result in this app, in plain language.</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c, i) => (
          <div
            key={c.term}
            className={`card p-5 ${i === CONCEPTS.length - 1 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
          >
            <dt className="font-display text-xl font-bold text-sage-900">{c.term}</dt>
            <dd>
              <p className="mt-2 inline-block rounded-lg bg-butter-100 px-2 py-1 font-mono text-xs font-semibold text-butter-700">
                {c.formula}
              </p>
              <p className="mt-2 leading-relaxed text-sage-700">{c.text}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
