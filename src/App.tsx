import { type ReactNode } from 'react';
import { ConfirmProvider } from './app/Confirm';
import { useRoute, type SectionId } from './app/routes';
import { StoreProvider } from './app/StoreContext';
import Footer from './components/Footer';
import Header from './components/Header';
import type { AppState } from './lib/store';
import BusinessChallenge from './sections/BusinessChallenge';
import BusinessReport from './sections/BusinessReport';
import Home from './sections/Home';
import InventoryHub from './sections/InventoryHub';
import MyBusiness from './sections/MyBusiness';
import PricingLab from './sections/PricingLab';
import ProductionPlanner from './sections/ProductionPlanner';
import ProfitDashboard from './sections/ProfitDashboard';

/**
 * Every section stays mounted (just hidden), so moving between sections never
 * loses anything typed – and all sections share one store.
 */
function Panel({ id, route, children }: { id: SectionId; route: SectionId; children: ReactNode }) {
  return (
    <div id={`panel-${id}`} hidden={route !== id}>
      {children}
    </div>
  );
}

export default function App({ initial }: { initial?: AppState }) {
  const [route] = useRoute();
  return (
    <StoreProvider initial={initial}>
      <ConfirmProvider>
        <div className="flex min-h-screen flex-col">
          <button
            type="button"
            onClick={() => document.getElementById('main')?.focus()}
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
          >
            Skip to content
          </button>
          <Header route={route} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            <Panel id="home" route={route}><Home /></Panel>
            <Panel id="my-business" route={route}><MyBusiness /></Panel>
            <Panel id="dashboard" route={route}><ProfitDashboard /></Panel>
            <Panel id="pricing" route={route}><PricingLab /></Panel>
            <Panel id="inventory" route={route}><InventoryHub /></Panel>
            <Panel id="planner" route={route}><ProductionPlanner /></Panel>
            <Panel id="challenge" route={route}><BusinessChallenge /></Panel>
            <Panel id="report" route={route}><BusinessReport /></Panel>
          </main>
          <Footer />
        </div>
      </ConfirmProvider>
    </StoreProvider>
  );
}
