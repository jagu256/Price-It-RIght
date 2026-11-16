import { t } from '../i18n/i18n';

/**
 * "On this page" – quick links to the tools on a long page. They scroll to the
 * tool instead of changing the address, because the address (#dashboard…)
 * decides which section is shown. A tool that isn't on screen (e.g. needs valid
 * numbers) is simply skipped.
 */
export default function JumpMenu({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label={t('On this page')} className="print-hidden rounded-2xl bg-white/70 p-3 ring-1 ring-sage-100">
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-sage-600">{t('On this page')}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              className="btn-small"
              onClick={() => {
                const el = document.getElementById(i.id);
                el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                (el as HTMLElement | null)?.focus?.({ preventScroll: true });
              }}
            >
              {i.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
