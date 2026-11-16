import { useEffect, useRef, useState } from 'react';
import { SECTIONS, type SectionId } from '../app/routes';
import { t, tx } from '../i18n/i18n';
import { useTour } from './GuidedTour';

/** The four sections reachable in one tap on a phone; the rest are under "More". */
const MAIN: { id: SectionId; emoji: string; label: string }[] = [
  { id: 'home', emoji: '🏡', label: tx('Home') },
  { id: 'my-business', emoji: '🏠', label: tx('Business') },
  { id: 'dashboard', emoji: '💰', label: tx('Profit') },
  { id: 'pricing', emoji: '🎯', label: tx('Pricing') },
];
const MORE = SECTIONS.filter((s) => !MAIN.some((m) => m.id === s.id));

/**
 * 📱 Phone-only tab bar at the bottom of the screen (hidden from the small-screen
 * breakpoint up, where the top tabs are shown instead).
 */
export default function BottomNav({ route }: { route: SectionId }) {
  const [open, setOpen] = useState(false);
  const { highlight } = useTour();
  const ref = useRef<HTMLElement>(null);
  const inMore = MORE.some((s) => s.id === route);
  const moreHighlighted = MORE.some((s) => s.id === highlight);

  useEffect(() => setOpen(false), [route]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const item = 'flex flex-col items-center justify-center gap-0.5 rounded-2xl px-1 py-1.5 text-[11px] font-semibold leading-tight transition';
  return (
    <nav ref={ref} aria-label={t('Main sections')} className="fixed inset-x-0 bottom-0 z-40 border-t border-sage-200 bg-cream-50/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-md sm:hidden">
      {open && (
        <ul id="more-sections" className="absolute bottom-full right-2 mb-2 w-60 space-y-1 rounded-2xl bg-white p-2 shadow-lift ring-1 ring-sage-200">
          {MORE.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={route === s.id ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${route === s.id ? 'bg-sage-700 text-cream-50' : 'text-sage-800 hover:bg-sage-50'}${highlight === s.id ? ' tour-highlight' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span aria-hidden="true">{s.emoji}</span>
                {t(s.label)}
              </a>
            </li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-5 gap-1">
        {MAIN.map((m) => (
          <li key={m.id}>
            <a
              href={`#${m.id}`}
              aria-current={route === m.id ? 'page' : undefined}
              className={`${item} ${route === m.id ? 'bg-sage-700 text-cream-50' : 'text-sage-700'}${highlight === m.id ? ' tour-highlight' : ''}`}
            >
              <span aria-hidden="true" className="text-lg">{m.emoji}</span>
              {t(m.label)}
            </a>
          </li>
        ))}
        <li>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="more-sections"
            onClick={() => setOpen((o) => !o)}
            className={`${item} w-full ${inMore ? 'bg-sage-700 text-cream-50' : 'text-sage-700'}${moreHighlighted ? ' tour-highlight' : ''}`}
          >
            <span aria-hidden="true" className="text-lg">☰</span>
            {t('More')}
          </button>
        </li>
      </ul>
    </nav>
  );
}
