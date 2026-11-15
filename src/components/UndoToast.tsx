import { useEffect } from 'react';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';

/** How long the Undo message stays on screen (the change can no longer be undone after it closes). */
export const UNDO_SECONDS = 15;

/**
 * ↩ After a big change (delete, import, apply…) a small message offers to undo it.
 * It closes by itself after UNDO_SECONDS, or when anything else in the business changes.
 */
export default function UndoToast() {
  const { state, dispatch } = useStore();
  const undo = state.undo;

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => dispatch({ type: 'undo-dismiss' }), UNDO_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [undo?.id, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!undo) return null;
  return (
    <div role="status" className="fixed right-3 top-28 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-2xl bg-sage-900 py-2.5 pl-4 pr-2 text-sm text-cream-50 shadow-lift sm:right-6">
      <span>{t(undo.message, undo.vars)}</span>
      <button type="button" className="rounded-full bg-butter-200 px-3 py-1 font-bold text-sage-900 hover:bg-butter-300" onClick={() => dispatch({ type: 'undo' })}>
        ↩ {t('Undo')}
      </button>
      <button type="button" aria-label={t('Close')} className="rounded-full px-2 py-1 text-cream-50/80 hover:text-cream-50" onClick={() => dispatch({ type: 'undo-dismiss' })}>
        ✕
      </button>
    </div>
  );
}
