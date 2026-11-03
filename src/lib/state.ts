/**
 * App state, managed with a reducer so every change (choosing a business,
 * typing, resetting, the what-if simulator) happens in one predictable place.
 */
import { BUSINESSES, getBusiness, type BusinessId } from './businesses';
import { parseMoney, toInputText, type FieldKey, type RawInputs } from './validation';

export interface AppState {
  businessId: BusinessId;
  /** Exactly what the user typed – never auto-corrected. */
  raw: RawInputs;
  touched: Record<FieldKey, boolean>;
  /** True after the user presses "Calculate My Profit" at least once. */
  submitted: boolean;
  /**
   * The what-if price as typed. `null` means "same as the baseline price".
   * It is kept separate so the baseline is never overwritten by accident.
   */
  whatIfRaw: string | null;
}

export type Action =
  | { type: 'select-business'; id: BusinessId }
  | { type: 'set-name'; value: string }
  | { type: 'set-field'; field: FieldKey; value: string }
  | { type: 'touch'; field: FieldKey }
  | { type: 'calculate' }
  | { type: 'reset-example' }
  | { type: 'set-what-if'; value: string }
  | { type: 'reset-what-if' }
  | { type: 'apply-what-if' };

const untouched: Record<FieldKey, boolean> = {
  sellingPrice: false,
  variableCost: false,
  fixedCosts: false,
  units: false,
};

export function rawFromBusiness(id: BusinessId): RawInputs {
  const b = getBusiness(id);
  return {
    businessName: b.id === 'custom' ? 'My Business' : b.label,
    sellingPrice: toInputText(b.defaults.sellingPrice),
    variableCost: toInputText(b.defaults.variableCost),
    fixedCosts: toInputText(b.defaults.fixedCosts),
    units: String(b.defaults.units),
  };
}

export function initialState(id: BusinessId = BUSINESSES[0].id): AppState {
  return {
    businessId: id,
    raw: rawFromBusiness(id),
    touched: { ...untouched },
    submitted: false,
    whatIfRaw: null,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'select-business':
      return {
        ...state,
        businessId: action.id,
        raw: rawFromBusiness(action.id),
        touched: { ...untouched },
        whatIfRaw: null,
      };
    case 'set-name':
      return { ...state, raw: { ...state.raw, businessName: action.value } };
    case 'set-field':
      return { ...state, raw: { ...state.raw, [action.field]: action.value } };
    case 'touch':
      return { ...state, touched: { ...state.touched, [action.field]: true } };
    case 'calculate':
      return { ...state, submitted: true };
    case 'reset-example':
      // Restores the selected business's original fictional values.
      return {
        ...state,
        raw: rawFromBusiness(state.businessId),
        touched: { ...untouched },
        whatIfRaw: null,
      };
    case 'set-what-if':
      return { ...state, whatIfRaw: action.value };
    case 'reset-what-if':
      return { ...state, whatIfRaw: null };
    case 'apply-what-if': {
      // Only an explicit "apply" changes the baseline price.
      if (state.whatIfRaw === null) return state;
      const parsed = parseMoney(state.whatIfRaw, 'sellingPrice');
      if (!parsed.ok) return state;
      return {
        ...state,
        raw: { ...state.raw, sellingPrice: toInputText(parsed.value) },
        whatIfRaw: null,
      };
    }
    default:
      return state;
  }
}
