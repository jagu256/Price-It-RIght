import { useId, useState } from 'react';
import { t } from '../i18n/i18n';
import type { MathExplanation } from '../lib/showMath';

interface Props {
  /** What the button explains – used for its accessible name, e.g. "Total Monthly Revenue". */
  label: string;
  /** One or more explanations from src/lib/showMath.ts. Nothing is calculated here. */
  items: MathExplanation[];
}

/** A small "Show the math" button that reveals the formula in words, then with the user's numbers. */
export default function ShowMath({ label, items }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (items.length === 0) return null;
  return (
    <div className="mt-3 min-w-0 text-left">
      <button
        type="button"
        className="rounded-full bg-sage-100 px-3 py-1 text-xs font-bold text-sage-800 transition hover:bg-sage-200"
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? t('Hide the math for {label}', { label }) : t('Show the math for {label}', { label })}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">🧮 </span>
        {open ? t('Hide the math') : t('Show the math')}
      </button>
      {open && (
        <div id={id} role="region" aria-label={t('The math for {label}', { label })} className="mt-2 space-y-3 rounded-2xl bg-cream-50 p-3 text-sm font-normal normal-case tracking-normal text-sage-800 ring-1 ring-sage-100">
          {items.map((x) => (
            <div key={x.title} className="space-y-1 break-words">
              {items.length > 1 && <p className="text-xs font-bold uppercase tracking-wider text-sage-600">{x.title}</p>}
              <p>{x.formula}</p>
              {x.steps.length > 0 && (
                <ul className="space-y-0.5 text-xs tabular-nums text-sage-700">
                  {x.steps.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              <p className="font-bold tabular-nums text-sage-900">{x.withNumbers}</p>
              {x.note && <p className="text-xs text-sage-600">{x.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
