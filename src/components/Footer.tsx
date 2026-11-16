import { t } from '../i18n/i18n';
import Logo from './Logo';

/** Opens the browser’s print dialog (print styles in index.css hide menus and buttons). */
export function printPage() {
  try {
    window.print();
  } catch {
    /* some embedded previews block printing – nothing else to do */
  }
}

export default function Footer() {
  return (
    <footer className="border-t border-sage-100 bg-sage-900 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-[1fr_1.4fr] sm:px-6">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <Logo className="h-7 w-7" /> Price It Right
          </p>
          <p className="mt-2 text-sm text-cream-200/80">{t('Set your price. Know your costs. Maximize your profit.')}</p>
          <button type="button" onClick={printPage} className="mt-4 rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-cream-100/40 hover:bg-cream-50/10">
            🖨 {t('Print this page')}
          </button>
        </div>
        <div className="space-y-2 text-sm text-cream-200/80">
          <p>
            {t(
              'An educational decision-support tool for an ACCT 4500 group project. Results depend entirely on the assumptions you enter. Example and demo data are fictional and are not industry benchmarks. Not financial advice.',
            )}
          </p>
          <p>{t('Everything runs in your browser. Your business is saved on this device only and is never sent anywhere – please don’t enter confidential information.')}</p>
          <p>{t('Built with AI assistance (Claude by Anthropic) and reviewed by the project team.')}</p>
        </div>
      </div>
    </footer>
  );
}
