import { type ReactNode } from 'react';
import { ConfirmProvider } from './app/Confirm';
import { useRoute, type SectionId } from './app/routes';
import { StoreProvider } from './app/StoreContext';
import { SectionVisibleContext } from './app/visibility';
import { LanguageProvider, useLanguage } from './app/language';
import { t } from './i18n/i18n';
import Footer from './components/Footer';
import { TourProvider } from './components/GuidedTour';
import BottomNav from './components/BottomNav';
import Header from './components/Header';
import PrintHeader from './components/PrintHeader';
import UndoToast from './components/UndoToast';
import type { AppState } from './lib/store';
import BusinessChallenge from './sections/BusinessChallenge';
import BusinessReport from './sections/BusinessReport';
import Decisions from './sections/Decisions';
import Home from './sections/Home';
import InventoryHub from './sections/InventoryHub';
import MyBusiness from './sections/MyBusiness';
import PricingLab from './sections/PricingLab';
import ProductionPlanner from './sections/ProductionPlanner';
import ProfitDashboard from './sections/ProfitDashboard';

/**
 * Every section stays mounted (just hidden), so moving between sections never
 * loses anything typed – and all sections share one store. Hidden sections
 * skip drawing their charts (see app/visibility.tsx).
 */
function Panel({ id, route, children }: { id: SectionId; route: SectionId; children: ReactNode }) {
  return (
    <div id={`panel-${id}`} hidden={route !== id}>
      <SectionVisibleContext.Provider value={route === id}>{children}</SectionVisibleContext.Provider>
    </div>
  );
}

/** `autoTour`: open the guided tour on a first visit (the real app turns it on; tests leave it off unless testing the tour). */
export default function App({ initial, autoTour = false }: { initial?: AppState; autoTour?: boolean }) {
  return (
    <LanguageProvider>
      <AppInner initial={initial} autoTour={autoTour} />
    </LanguageProvider>
  );
}

function AppInner({ initial, autoTour }: { initial?: AppState; autoTour: boolean }) {
  const [route] = useRoute();
  // Reading the language here means the whole app redraws when it changes.
  useLanguage();
  return (
    <StoreProvider initial={initial}>
      <ConfirmProvider>
        <TourProvider auto={autoTour}>
        {/* pb-20: room for the phone tab bar at the bottom (none from the sm breakpoint up). */}
        <div className="flex min-h-screen flex-col pb-20 sm:pb-0">
          <button
            type="button"
            onClick={() => document.getElementById('main')?.focus()}
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
          >
            {t('Skip to content')}
          </button>
          <Header route={route} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            <PrintHeader route={route} />
            <Panel id="home" route={route}><Home /></Panel>
            <Panel id="my-business" route={route}><MyBusiness /></Panel>
            <Panel id="dashboard" route={route}><ProfitDashboard /></Panel>
            <Panel id="pricing" route={route}><PricingLab /></Panel>
            <Panel id="inventory" route={route}><InventoryHub /></Panel>
            <Panel id="planner" route={route}><ProductionPlanner /></Panel>
            <Panel id="decisions" route={route}><Decisions /></Panel>
            <Panel id="challenge" route={route}><BusinessChallenge /></Panel>
            <Panel id="report" route={route}><BusinessReport /></Panel>
          </main>
          <Footer />
          <UndoToast />
          <BottomNav route={route} />
        </div>
        </TourProvider>
      </ConfirmProvider>
    </StoreProvider>
  );
}
