import { SECTIONS, type SectionId } from '../app/routes';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { formatLongDate } from '../lib/format';

/** Shown only on paper: which business, which page, when – so a printout makes sense on its own. */
export default function PrintHeader({ route }: { route: SectionId }) {
  const { state } = useStore();
  const section = SECTIONS.find((s) => s.id === route);
  const b = state.business;
  return (
    <div className="print-only mb-4 border-b border-sage-300 pb-2" data-testid="print-header">
      <p className="font-display text-xl font-bold">
        Price It Right – {b.name.trim() || t('My business')}
        {section ? ` – ${t(section.label)}` : ''}
      </p>
      <p className="text-sm">
        {t('Printed {date}', { date: formatLongDate(new Date()) })} · {t('All amounts in CAD')}
        {b.isDemo ? ` · ${t('Fictional demo data')}` : ''}
      </p>
    </div>
  );
}
