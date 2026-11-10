import type { ReactNode } from 'react';
import type { MathExplanation } from '../lib/showMath';
import ShowMath from './ShowMath';

export type Tone = 'neutral' | 'profit' | 'loss';

interface Props {
  title: string;
  value: string;
  detail: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  badge?: string;
  /** Optional “Show the math” explanation for this card’s value. */
  math?: MathExplanation;
}

const toneStyles: Record<Tone, { card: string; value: string; icon: string }> = {
  neutral: { card: 'border-sage-100 bg-white', value: 'text-sage-900', icon: 'bg-sage-100 text-sage-700' },
  profit: { card: 'border-sage-300 bg-sage-50', value: 'text-sage-700', icon: 'bg-sage-600 text-white' },
  loss: { card: 'border-loss-100 bg-loss-50', value: 'text-loss-700', icon: 'bg-loss-600 text-white' },
};

export default function ResultCard({ title, value, detail, icon, tone = 'neutral', badge, math }: Props) {
  const s = toneStyles[tone];
  return (
    <article className={`animate-rise rounded-3xl border p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift ${s.card}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-sans text-sm font-bold uppercase tracking-wider text-sage-700">{title}</h3>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.icon}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className={`mt-3 break-words font-display text-3xl font-extrabold tabular-nums sm:text-4xl ${s.value}`}>
        {value}
      </p>
      {badge && (
        <p className={`mt-1 text-sm font-bold ${s.value}`}>{badge}</p>
      )}
      <p className="mt-2 text-sm leading-snug text-sage-700">{detail}</p>
      {math && <ShowMath label={title} items={[math]} />}
    </article>
  );
}
