import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SectionId } from '../app/routes';
import { t } from '../i18n/i18n';
import { markTourDone, TOUR_STEPS, tourDone } from '../lib/tour';

/** `highlight`: the section tab the tour is talking about (the Header draws the highlight). */
const TourContext = createContext<{ start: () => void; highlight: SectionId | null }>({ start: () => {}, highlight: null });

/** Lets any screen (e.g. Home) restart the tour. */
export const useTour = () => useContext(TourContext);

/**
 * 🧭 A small card that walks through the sections, highlighting each tab.
 * It opens by itself on a first visit when `auto` is true (the real app);
 * tests render the app without it unless they ask for it.
 */
export function TourProvider({ auto, children }: { auto: boolean; children: ReactNode }) {
  const [step, setStep] = useState<number | null>(() => (auto && !tourDone() ? 0 : null));
  const start = useCallback(() => setStep(0), []);
  const close = useCallback(() => {
    markTourDone();
    setStep(null);
  }, []);
  return (
    <TourContext.Provider value={{ start, highlight: step === null ? null : TOUR_STEPS[step].section }}>
      {children}
      {step !== null && <TourCard step={step} onStep={setStep} onClose={close} />}
    </TourContext.Provider>
  );
}

function TourCard({ step, onStep, onClose }: { step: number; onStep: (n: number) => void; onClose: () => void }) {
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;
  const heading = useRef<HTMLHeadingElement>(null);

  // Go to the step's section, bring its tab into view, and move keyboard focus to the card.
  useEffect(() => {
    if (window.location.hash !== `#${s.section}`) window.location.hash = s.section;
    document.querySelector(`nav a[href="#${s.section}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
    heading.current?.focus();
  }, [s.section]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-text"
      className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md rounded-3xl bg-white p-5 shadow-2xl ring-2 ring-sage-300 sm:bottom-6"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Tour – step {n} of {total}', { n: step + 1, total: TOUR_STEPS.length })}</p>
      <h2 id="tour-title" ref={heading} tabIndex={-1} className="mt-1 font-display text-xl font-bold text-sage-900 outline-none">{t(s.title)}</h2>
      <p id="tour-text" className="mt-2 text-sage-700">{t(s.text)}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-small" onClick={onClose}>{t('Skip tour')}</button>
        <div className="flex gap-2">
          {step > 0 && <button type="button" className="btn-secondary" onClick={() => onStep(step - 1)}>← {t('Back')}</button>}
          <button type="button" className="btn-primary" onClick={() => (last ? onClose() : onStep(step + 1))}>{last ? t('Finish') : `${t('Next')} →`}</button>
        </div>
      </div>
    </div>
  );
}
