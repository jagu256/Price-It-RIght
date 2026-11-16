import { useStore } from '../app/StoreContext';
import { t, tx } from '../i18n/i18n';
import { rankProducts, type ProductRank } from '../lib/productRanking';

const BADGE: Record<ProductRank, { emoji: string; label: string; tip: string; style: string }> = {
  star: { emoji: '⭐', label: tx('Star'), tip: tx('High margin and high sales – protect it.'), style: 'bg-sage-100 text-sage-800 ring-sage-300' },
  popular: { emoji: '🐴', label: tx('Popular'), tip: tx('Sells well but earns less per unit – try a small price rise or a lower cost.'), style: 'bg-butter-100 text-butter-700 ring-butter-300' },
  gem: { emoji: '💎', label: tx('Hidden gem'), tip: tx('Earns well per unit but sells less – promote it.'), style: 'bg-sage-50 text-sage-800 ring-sage-200' },
  review: { emoji: '⚠️', label: tx('Review'), tip: tx('Low margin and low sales – rethink its price, cost or place on the menu.'), style: 'bg-cream-100 text-sage-800 ring-sage-200' },
  'loss-maker': { emoji: '❗', label: tx('Loss on each sale'), tip: tx('Its price is below its variable cost, so every sale lowers profit.'), style: 'bg-loss-50 text-loss-700 ring-loss-100' },
};

/** 🏅 Quick badges comparing each product with the business averages (a guide, not a verdict). */
export default function ProductRanking() {
  const { model } = useStore();
  const ranked = model.summary ? rankProducts(model.products) : null;
  if (!ranked) return null;
  return (
    <div className="card space-y-3 p-5" aria-labelledby="ranking-title">
      <h4 id="ranking-title" className="font-display text-lg font-bold text-sage-900">🏅 {t('How each product compares')}</h4>
      <ul className="grid gap-2 sm:grid-cols-2">
        {ranked.map((p) => {
          const b = BADGE[p.rank];
          return (
            <li key={p.id} className={`flex items-start gap-3 rounded-2xl p-3 ring-1 ${b.style}`}>
              <span aria-hidden="true" className="text-xl">{b.emoji}</span>
              <div>
                <p className="font-semibold">{p.name} – {t(b.label)}</p>
                <p className="text-sm opacity-90">{t(b.tip)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-sage-600">
        {t('Compared with your business averages: contribution margin per unit vs the weighted average, and expected units vs the average per product. A quick guide only – it ignores shared inventory and what customers want.')}
      </p>
    </div>
  );
}
