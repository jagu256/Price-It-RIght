import { t, tx } from '../i18n/i18n';

const CONCEPTS = [
  { term: tx('Revenue'), formula: tx('Selling price × units sold'), text: tx('All the money that comes in from customers before any costs are taken out.') },
  { term: tx('Fixed Costs'), formula: tx('Same total each month'), text: tx('Costs that generally stay the same within the relevant activity range, like rent, insurance or software.') },
  { term: tx('Variable Costs'), formula: tx('Variable cost per unit × units sold'), text: tx('Costs that rise and fall with each sale – ingredients, packaging, payment fees.') },
  { term: tx('Contribution Margin'), formula: tx('Selling price − variable cost per unit'), text: tx('What each sale has left to “contribute” toward fixed costs. It is not profit until fixed costs are covered.') },
  { term: tx('Break-Even Point'), formula: tx('Fixed costs ÷ contribution margin per unit'), text: tx('The sales level where revenue equals total costs. With several products it depends on the sales mix.') },
  { term: tx('Margin of Safety'), formula: tx('Expected revenue − break-even revenue'), text: tx('How much sales could fall before the business starts losing money.') },
  { term: tx('Operating Profit'), formula: tx('Total contribution margin − fixed costs'), text: tx('Profit from running the business. Not net income: taxes, interest and other items are not included.') },
  { term: tx('Inventory Turnover'), formula: tx('Cost of goods sold ÷ average inventory'), text: tx('How many times stock is used and replaced in a period. This app does not calculate it, because it needs beginning and ending inventory values and cost-of-goods-sold records.') },
  { term: tx('Limiting Factors'), formula: tx('The resource that runs out first'), text: tx('A scarce input – like milk or butter – that caps how much you can produce, no matter the demand.') },
  { term: tx('CM per Constrained Resource'), formula: tx('CM per unit ÷ scarce resource used'), text: tx('When one input is scarce, products that earn more contribution per unit of that input use it best.') },
];

export default function LearnSection() {
  return (
    <section id="learn" className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="learn-title">
      <p className="eyebrow">{t('Learn')}</p>
      <h2 id="learn-title" className="section-title mt-1">
        <span aria-hidden="true">📚 </span>{t('Understand Your Numbers')}
      </h2>
      <p className="mt-2 max-w-2xl text-sage-700">{t('The ideas behind every result in this app, in plain language.')}</p>
      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CONCEPTS.map((c, i) => (
          <div key={c.term} className={`card p-5 ${i === CONCEPTS.length - 1 ? 'lg:col-span-2' : ''}`}>
            <dt className="font-display text-xl font-bold text-sage-900">{t(c.term)}</dt>
            <dd>
              <p className="mt-2 inline-block rounded-lg bg-butter-100 px-2 py-1 font-mono text-xs font-semibold text-butter-700">{t(c.formula)}</p>
              <p className="mt-2 leading-relaxed text-sage-700">{t(c.text)}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
