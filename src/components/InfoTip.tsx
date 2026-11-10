import { t } from '../i18n/i18n';
import { useId, useState, type ReactNode } from 'react';

interface Props {
  /** What the tip explains – used for the button's accessible name. */
  label: string;
  children: ReactNode;
  align?: 'left' | 'right';
}

/** A small "?" button that shows a tip on hover, keyboard focus or tap. */
export default function InfoTip({ label, children, align = 'left' }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={t('What is “{label}”?', { label })}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        // Hover and focus already open the tip, so a click/tap only ever opens it
        // (toggling here would close it immediately on touch screens).
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-100 text-[11px] font-bold text-sage-700 transition hover:bg-sage-200"
      >
        ?
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className={`absolute top-full z-30 mt-2 w-56 max-w-[calc(100vw-3rem)] animate-rise rounded-2xl bg-sage-900 px-3 py-2 text-left text-xs font-medium normal-case leading-snug tracking-normal text-cream-50 shadow-lift ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
