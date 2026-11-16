import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { operatingProfitOf, profitChange } from '../lib/changeSummary';
import { formatCAD } from '../lib/format';

/** How long the Undo message stays on screen (the change can no longer be undone after it closes). */
export const UNDO_SECONDS = 15;
/** How long the "Undone" confirmation stays. */
const UNDONE_SECONDS = 5;

/**
 * ↩ After a big change (delete, import, apply…) a small message says what
 * happened and how operating profit moved, and offers to undo it. It closes by
 * itself after UNDO_SECONDS, or when anything else in the business changes.
 * After an undo, a short note confirms where profit is now.
 */
export default function UndoToast() {
  const { state, dispatch } = useStore();
  const undo = state.undo;
  const [undone, setUndone] = useState<{ profit: number | null; id: number } | null>(null);
  // What changed: profit before (the remembered business) and after (now). Same model as the dashboard.
  const change = useMemo(() => (undo ? profitChange(undo.business, state.business) : null), [undo, state.business]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => dispatch({ type: 'undo-dismiss' }), UNDO_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [undo?.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!undone) return;
    const timer = window.setTimeout(() => setUndone(null), UNDONE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [undone]);

  const box = 'fixed right-3 top-28 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-2xl bg-sage-900 py-2.5 pl-4 pr-2 text-sm text-cream-50 shadow-lift sm:right-6';

  if (!undo && undone) {
    return (
      <div role="status" className={box}>
        <span>
          ↩ {undone.profit === null ? t('Undone.') : t('Undone – operating profit is back to {profit}.', { profit: formatCAD(undone.profit) })}
        </span>
        <button type="button" aria-label={t('Close')} className="rounded-full px-2 py-1 text-cream-50/80 hover:text-cream-50" onClick={() => setUndone(null)}>
          ✕
        </button>
      </div>
    );
  }
  if (!undo) return null;
  return (
    <div role="status" className={box}>
      <span>
        {t(undo.message, undo.vars)}
        {change && change.before !== change.after && (
          <span className="block text-xs text-cream-100/90">
            {t('Operating profit: {before} → {after}', { before: formatCAD(change.before), after: formatCAD(change.after) })}
          </span>
        )}
      </span>
      <button
        type="button"
        className="rounded-full bg-butter-200 px-3 py-1 font-bold text-sage-900 hover:bg-butter-300"
        onClick={() => {
          setUndone({ profit: operatingProfitOf(undo.business), id: undo.id });
          dispatch({ type: 'undo' });
        }}
      >
        ↩ {t('Undo')}
      </button>
      <button type="button" aria-label={t('Close')} className="rounded-full px-2 py-1 text-cream-50/80 hover:text-cream-50" onClick={() => dispatch({ type: 'undo-dismiss' })}>
        ✕
      </button>
    </div>
  );
}
