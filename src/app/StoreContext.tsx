import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { buildModel, type BusinessModel } from '../lib/model';
import { initialAppState, reducer, type Action, type AppState } from '../lib/store';

interface Store {
  state: AppState;
  dispatch: Dispatch<Action>;
  /** Validated numbers for the current business – shared by every section. */
  model: BusinessModel;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, initial }: { children: ReactNode; initial?: AppState }) {
  const [state, dispatch] = useReducer(reducer, initial, (init) => init ?? initialAppState('coffee'));
  const model = useMemo(() => buildModel(state.business), [state.business]);
  const value = useMemo(() => ({ state, dispatch, model }), [state, model]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}
