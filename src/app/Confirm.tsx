import { t } from '../i18n/i18n';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
}

type Ask = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Ask | null>(null);

/** In-page confirmation dialog (used before replacing or deleting important data). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const ask = useCallback<Ask>(
    (options) =>
      new Promise<boolean>((resolve) => {
        returnFocus.current = document.activeElement as HTMLElement | null;
        setPending({ ...options, resolve });
      }),
    [],
  );

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
    returnFocus.current?.focus?.();
  };

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
  }, [pending]);

  return (
    <ConfirmContext.Provider value={ask}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-sage-900/40 p-4 backdrop-blur-sm sm:items-center"
          onMouseDown={(e) => e.target === e.currentTarget && close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="w-full max-w-md animate-rise rounded-3xl bg-white p-6 shadow-lift"
            onKeyDown={(e) => e.key === 'Escape' && close(false)}
          >
            <h2 id="confirm-title" className="text-xl font-bold text-sage-900">{pending.title}</h2>
            <div id="confirm-message" className="mt-2 text-sage-700">{pending.message}</div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => close(false)}>
                {pending.cancelLabel ?? t('Cancel')}
              </button>
              <button
                ref={confirmRef}
                type="button"
                className={pending.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => close(true)}
              >
                {pending.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Ask {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ask;
}
