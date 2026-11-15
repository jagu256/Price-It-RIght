import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n/i18n';
import { GLOSSARY, type TermId } from '../lib/glossary';

/**
 * ⓘ A small button next to an accounting term. Tap, click or press Enter to
 * show a one-line definition; tap again, press Esc or click elsewhere to close.
 * (A button rather than a hover tooltip, so it works on phones and keyboards.)
 */
const TIP_WIDTH = 256;

export default function TermTip({ id }: { id: TermId }) {
  const [open, setOpen] = useState(false);
  // Where the box goes on screen: under the button, kept inside the screen edges.
  const [pos, setPos] = useState({ left: 8, top: 0 });
  const box = useRef<HTMLSpanElement>(null);
  const popId = useId();
  const g = GLOSSARY[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (box.current?.contains(target) || document.getElementById(popId)?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, popId]);

  return (
    <span ref={box} className="relative inline-flex align-middle">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={t('What is “{term}”?', { term: t(g.term) })}
        onClick={(e) => {
          // Place the box under the button but never past the screen edges (it closes on scroll).
          const r = e.currentTarget.getBoundingClientRect();
          const width = Math.min(TIP_WIDTH, window.innerWidth - 16);
          setPos({ left: Math.max(8, Math.min(r.left - 12, window.innerWidth - width - 8)), top: r.bottom + 6 });
          setOpen((o) => !o);
        }}
        className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-sage-300 bg-white text-[11px] font-bold normal-case leading-none tracking-normal text-sage-600 transition hover:border-sage-500 hover:text-sage-900"
      >
        i
      </button>
      {open &&
        // Drawn at the top of the page, so card animations can't move it.
        createPortal(
        <span
          id={popId}
          role="note"
          style={{ left: pos.left, top: pos.top, width: `min(${TIP_WIDTH}px, calc(100vw - 16px))` }}
          className="fixed z-50 rounded-2xl bg-sage-900 p-3 text-left text-sm font-normal normal-case leading-snug tracking-normal text-cream-50 shadow-lift"
        >
          <strong>{t(g.term)}{t(':')}</strong> {t(g.definition)}
        </span>,
        document.body,
        )}
    </span>
  );
}
