import { BUSINESSES, type BusinessId } from '../lib/businesses';

interface Props {
  selected: BusinessId;
  onSelect: (id: BusinessId) => void;
}

export default function BusinessPicker({ selected, onSelect }: Props) {
  return (
    <div>
      <p className="eyebrow">Step 1</p>
      <h2 id="choose-business" className="section-title mt-1">Choose your business</h2>
      <p className="mt-2 max-w-2xl text-sage-700">
        Each category fills in <strong>fictional example values</strong> to get you started. They are not
        industry benchmarks – change every number to match your own business.
      </p>

      <div
        role="radiogroup"
        aria-labelledby="choose-business"
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {BUSINESSES.map((b) => {
          const active = b.id === selected;
          return (
            <button
              key={b.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(b.id)}
              className={`group flex flex-col items-start rounded-3xl border-2 p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-lift ${
                active
                  ? 'border-sage-600 bg-sage-50 shadow-lift'
                  : 'border-transparent bg-white shadow-soft hover:border-sage-200'
              } ${b.id === 'custom' ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition group-hover:scale-110 ${
                  active ? 'bg-butter-200' : 'bg-cream-100'
                }`}
                aria-hidden="true"
              >
                {b.emoji}
              </span>
              <span className="mt-3 font-display text-base font-bold text-sage-900">{b.label}</span>
              <span className="mt-0.5 text-xs leading-snug text-sage-600">{b.blurb}</span>
              {active && (
                <span className="mt-2 rounded-full bg-sage-700 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cream-50">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
