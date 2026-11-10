import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import { buildModel, type BusinessModel } from '../lib/model';
import { useLanguage } from './language';
import { browserStorage, clearStorage, loadFromStorage, saveToStorage, type LoadResult } from '../lib/saveWork';
import { hasUnsavedWork, initialAppState, reducer, savedAppState, type Action, type AppState } from '../lib/store';

/** What the "Save my work" card needs to know. */
export interface SaveStatus {
  /** False when the browser's storage is blocked or full – the app still works, but nothing is kept. */
  available: boolean;
  /** True when the current business is saved on this device (false for an untouched example). */
  saved: boolean;
  /** What happened when the app opened: a saved business was restored, was unreadable, etc. */
  startup: LoadResult['status'] | 'not-checked';
}

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
  /** Validated numbers for the current business – shared by every section. */
  model: BusinessModel;
  save: SaveStatus;
}

const StoreContext = createContext<Store | null>(null);

/** Opens with the business saved on this device, or the Coffee Shop example when there is none. */
function startUp(initial?: AppState): { state: AppState; startup: SaveStatus['startup'] } {
  if (initial) return { state: initial, startup: 'not-checked' };
  const loaded = loadFromStorage(browserStorage());
  if (loaded.status === 'restored') return { state: savedAppState(loaded.business, loaded.nextId), startup: 'restored' };
  return { state: initialAppState('coffee'), startup: loaded.status };
}

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [boot] = useState(() => startUp(initial));
  const [state, dispatch] = useReducer(reducer, boot.state);
  const [available, setAvailable] = useState(boot.startup !== 'unavailable');
  const [saved, setSaved] = useState(boot.startup === 'restored');
  // The model holds validation messages, so it is rebuilt when the language changes too.
  const { lang } = useLanguage();
  const model = useMemo(() => buildModel(state.business), [state.business, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save: keep the user's own work on this device. An untouched example is
  // not saved (and removes any older copy, which the user agreed to replace).
  // Only the business is stored – never experiments or challenge progress.
  // The two flags only change when the status changes, so typing doesn't
  // make the whole app draw itself twice.
  useEffect(() => {
    const storage = browserStorage();
    if (hasUnsavedWork(state)) {
      const ok = saveToStorage(storage, state.business, new Date().toISOString());
      setAvailable(ok);
      setSaved(ok);
    } else {
      setAvailable(clearStorage(storage));
      setSaved(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.business, state.baseline]);

  const value = useMemo(() => ({ state, dispatch, model, save: { available, saved, startup: boot.startup } }), [state, model, available, saved, boot.startup]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
