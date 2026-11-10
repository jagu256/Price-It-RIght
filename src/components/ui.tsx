/** Small shared building blocks so every section looks and behaves the same. */
import type { ReactNode } from 'react';
import { t, tx } from '../i18n/i18n';
import type { StockStatus } from '../lib/planning';

export function SectionHeader({ emoji, title, subtitle, eyebrow, id }: { emoji?: string; title: string; subtitle?: string; eyebrow?: string; id?: string }) {
  return (
    <div>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="section-title mt-1">
        {emoji && <span aria-hidden="true">{emoji} </span>}
        {title}
      </h2>
      {subtitle && <p className="mt-2 max-w-2xl text-lg text-sage-700">{subtitle}</p>}
    </div>
  );
}

export function SubHeader({ emoji, title, subtitle, id }: { emoji?: string; title: string; subtitle?: ReactNode; id?: string }) {
  return (
    <div>
      <h3 id={id} className="text-2xl font-bold text-sage-900">
        {emoji && <span aria-hidden="true">{emoji} </span>}
        {title}
      </h3>
      {subtitle && <p className="mt-1 max-w-3xl text-sage-700">{subtitle}</p>}
    </div>
  );
}

type Tone = 'info' | 'warn' | 'error' | 'success' | 'idea';
const toneStyles: Record<Tone, string> = {
  info: 'bg-sage-50 text-sage-800 ring-sage-100',
  warn: 'bg-butter-100 text-butter-700 ring-butter-300',
  idea: 'bg-butter-100 text-butter-700 ring-butter-300',
  error: 'bg-loss-50 text-loss-700 ring-loss-100',
  success: 'bg-sage-100 text-sage-800 ring-sage-300',
};
const toneIcon: Record<Tone, string> = { info: 'ℹ️', warn: '⚠️', error: '⚠️', success: '✅', idea: '💡' };

export function Notice({ tone = 'info', children, title, role }: { tone?: Tone; children: ReactNode; title?: string; role?: 'status' | 'alert' | 'note' }) {
  return (
    <div className={`flex gap-3 rounded-2xl px-4 py-3 text-sm ring-1 ${toneStyles[tone]}`} role={role}>
      <span className="text-base leading-5" aria-hidden="true">{toneIcon[tone]}</span>
      <div className="min-w-0 space-y-1">
        {title && <p className="font-bold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-sage-200 bg-cream-50/70 px-6 py-8 text-center" role="status">
      <h3 className="text-xl font-bold text-sage-900">{title}</h3>
      <div className="mx-auto mt-2 max-w-xl text-sage-700">{children}</div>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

const statusInfo: Record<StockStatus, { label: string; dot: string; cls: string }> = {
  sufficient: { label: tx('Sufficient Stock'), dot: '🟢', cls: 'bg-sage-100 text-sage-800' },
  low: { label: tx('Low Stock'), dot: '🟡', cls: 'bg-butter-200 text-butter-700' },
  shortage: { label: tx('Inventory Shortage'), dot: '🔴', cls: 'bg-loss-100 text-loss-700' },
  unused: { label: tx('Not used by plan'), dot: '⚪', cls: 'bg-cream-200 text-sage-700' },
};

export function StatusPill({ status }: { status: StockStatus }) {
  const s = statusInfo[status];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>
      <span aria-hidden="true">{s.dot}</span>
      {t(s.label)}
    </span>
  );
}

/** Compact text input for tables. Keeps exactly what was typed and shows a red border when invalid. */
export function CellInput({
  id,
  label,
  value,
  onChange,
  invalid,
  prefix,
  inputMode = 'decimal',
  width = 'w-24',
  describedBy,
  placeholder,
  readOnly,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  prefix?: string;
  inputMode?: 'decimal' | 'numeric' | 'text';
  width?: string;
  describedBy?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div
      className={`flex items-center rounded-xl border-2 bg-white transition focus-within:ring-2 focus-within:ring-offset-1 ${
        invalid ? 'border-loss-600 focus-within:ring-loss-600/40' : 'border-sage-200 focus-within:border-sage-500 focus-within:ring-sage-400/40'
      } ${width}`}
    >
      {prefix && <span className="pl-2.5 text-sm font-semibold text-sage-500" aria-hidden="true">{prefix}</span>}
      <input
        id={id}
        aria-label={label}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        className="w-full min-w-0 rounded-xl bg-transparent px-2.5 py-2 text-sm font-semibold tabular-nums text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
    </div>
  );
}

export function ErrorList({ id, messages }: { id?: string; messages: (string | undefined)[] }) {
  const list = messages.filter(Boolean) as string[];
  if (list.length === 0) return null;
  return (
    <ul id={id} className="mt-1 space-y-0.5 text-xs font-semibold text-loss-700" aria-live="polite">
      {list.map((m) => (
        <li key={m} className="flex gap-1">
          <span aria-hidden="true">⚠</span>
          {m}
        </li>
      ))}
    </ul>
  );
}

/**
 * Shows a translated sentence where **double asterisks** mark bold words, so a
 * whole sentence stays together in the dictionary even when one word is bold.
 */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : p))}</>;
}

/** Money value coloured by sign (green profit / raspberry loss). */
export function SignedMoney({ value, text }: { value: number; text: string }) {
  const v = Math.round(value * 100);
  return <span className={v > 0 ? 'text-sage-700' : v < 0 ? 'text-loss-700' : ''}>{text}</span>;
}

/** Wraps a section that needs valid business numbers. */
export function NeedsValidBusiness({ ready, children }: { ready: boolean; children: ReactNode }) {
  if (ready) return <>{children}</>;
  return (
    <EmptyState title={t('Some business numbers need attention')} action={<a className="btn-primary" href="#my-business">{t('Go to My Business')}</a>}>
      {t('Fix the highlighted products or fixed costs in 🏠 My Business. We don’t show results built on incomplete or invalid numbers.')}
    </EmptyState>
  );
}
