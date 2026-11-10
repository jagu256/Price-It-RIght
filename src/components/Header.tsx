import { useLanguage } from '../app/language';
import { SECTIONS, type SectionId } from '../app/routes';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { getBusiness } from '../lib/businesses';
import Logo from './Logo';

export default function Header({ route }: { route: SectionId }) {
  const { state } = useStore();
  const { lang, change } = useLanguage();
  const b = state.business;
  const business = getBusiness(b.type);
  return (
    <header className="sticky top-0 z-40 border-b border-sage-100/80 bg-cream-100/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-3 sm:px-6">
        <a href="#home" className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-lg font-bold text-sage-900">
          <Logo className="h-8 w-8" />
          Price It Right
        </a>
        <div className="flex min-w-0 items-center gap-2">
          <p className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold text-sage-700">
            <span aria-hidden="true">{business.emoji}</span>
            <span className="truncate">{b.name.trim() || t('My business')}</span>
            {b.isDemo && <span className="shrink-0 rounded-full bg-butter-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-butter-700">{t('Fictional demo')}</span>}
          </p>
          <div role="group" aria-label={t('Language')} className="flex shrink-0 overflow-hidden rounded-full ring-1 ring-sage-200">
            {(['en', 'fr'] as const).map((l) => (
              <button
                key={l}
                type="button"
                lang={l === 'fr' ? 'fr-CA' : 'en-CA'}
                aria-pressed={lang === l}
                aria-label={l === 'fr' ? 'Français' : 'English'}
                onClick={() => change(l)}
                className={`px-2 py-0.5 text-xs font-bold transition ${lang === l ? 'bg-sage-700 text-cream-50' : 'bg-white text-sage-700 hover:bg-sage-100'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
      <nav aria-label={t('Sections')} className="mx-auto max-w-6xl px-2 sm:px-4">
        <ul className="flex gap-1 overflow-x-auto py-2 text-sm font-semibold [scrollbar-width:thin]">
          {SECTIONS.map((s) => {
            const active = route === s.id;
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                    active ? 'bg-sage-700 text-cream-50 shadow-soft' : 'text-sage-700 hover:bg-sage-100'
                  }`}
                >
                  <span aria-hidden="true">{s.emoji}</span>
                  {t(s.label)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
