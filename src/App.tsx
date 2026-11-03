import { useMemo, useReducer } from 'react';
import { calculate } from './lib/accounting';
import { initialState, reducer } from './lib/state';
import { FIELD_KEYS, validateInputs } from './lib/validation';
import Header from './components/Header';
import Welcome from './components/Welcome';
import BusinessPicker from './components/BusinessPicker';
import InputPanel from './components/InputPanel';
import ResultsDashboard from './components/ResultsDashboard';
import WhatIfSimulator from './components/WhatIfSimulator';
import Charts from './components/Charts';
import LearnSection from './components/LearnSection';
import Footer from './components/Footer';
import Locked from './components/Locked';
import InventoryEstimator from './components/InventoryEstimator';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState());

  // Inputs are validated on every change; results are recalculated from the
  // current valid inputs, so every section always shows the same numbers.
  const validation = useMemo(() => validateInputs(state.raw), [state.raw]);
  const results = useMemo(
    () => (validation.values ? calculate(validation.values) : null),
    [validation.values],
  );

  const handleCalculate = () => {
    dispatch({ type: 'calculate' });
    const firstError = FIELD_KEYS.find((k) => validation.errors[k]);
    if (firstError) {
      document.getElementById(`field-${firstError}`)?.focus();
    } else {
      requestAnimationFrame(() =>
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  };

  const showResults = state.submitted;
  const businessName = state.raw.businessName.trim() || 'Your business';

  return (
    <div className="min-h-screen">
      <a
        href="#simulator"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to the simulator
      </a>
      <Header />
      <main>
        <Welcome />

        <section id="simulator" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          <BusinessPicker
            selected={state.businessId}
            onSelect={(id) => dispatch({ type: 'select-business', id })}
          />
          <InputPanel
            state={state}
            errors={validation.errors}
            dispatch={dispatch}
            onCalculate={handleCalculate}
          />
        </section>

        <section id="results" className="scroll-mt-20 bg-white/60 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {showResults ? (
              <ResultsDashboard results={results} businessName={businessName} />
            ) : (
              <Locked
                eyebrow="Step 3 · Discover"
                title="Your profit dashboard"
                text="Press “Calculate My Profit” above to see your revenue, profit, break-even point and margin of safety."
              />
            )}
          </div>
        </section>

        <section id="what-if" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14 sm:px-6">
          {showResults && results ? (
            <WhatIfSimulator base={results} whatIfRaw={state.whatIfRaw} dispatch={dispatch} />
          ) : (
            <Locked
              eyebrow="Signature feature"
              title="What If You Changed Your Price?"
              text={
                showResults
                  ? 'Fix the highlighted inputs above to use the what-if simulator.'
                  : 'Calculate your profit first, then test a different price here without changing your original numbers.'
              }
            />
          )}
        </section>

        <section id="charts" className="scroll-mt-20 bg-white/60 py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {showResults && results ? (
              <Charts results={results} />
            ) : (
              <Locked
                eyebrow="Visualize"
                title="See your numbers on a chart"
                text={
                  showResults
                    ? 'Fix the highlighted inputs above to see the charts.'
                    : 'Charts of revenue, costs and profit at different sales volumes appear after you calculate.'
                }
              />
            )}
          </div>
        </section>

        <LearnSection />

        {/* Inventory & Sales Estimator. `key` reloads the sample inventory when the business changes. */}
        <InventoryEstimator key={state.businessId} businessId={state.businessId} pricing={validation.values} />
      </main>
      <Footer />
    </div>
  );
}
