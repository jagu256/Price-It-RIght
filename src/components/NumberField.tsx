import type { ReactNode } from 'react';

interface Props {
  id: string;
  label: string;
  help: ReactNode;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  prefix?: string;
  suffix?: string;
  wholeNumber?: boolean;
  children?: ReactNode;
}

/**
 * A text box for numbers. It uses type="text" (with a numeric keyboard on
 * phones) so that whatever the user types stays visible – including mistakes,
 * which are explained instead of being silently changed.
 */
export default function NumberField({
  id,
  label,
  help,
  value,
  onChange,
  onBlur,
  error,
  prefix,
  suffix,
  wholeNumber,
  children,
}: Props) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-sage-900">
        {label}
      </label>
      <p id={helpId} className="mt-0.5 text-sm leading-snug text-sage-600">
        {help}
      </p>
      <div
        className={`mt-2 flex items-center rounded-2xl border-2 bg-white transition focus-within:ring-2 focus-within:ring-offset-1 ${
          error
            ? 'border-loss-600 focus-within:ring-loss-600/40'
            : 'border-sage-200 focus-within:border-sage-500 focus-within:ring-sage-400/40'
        }`}
      >
        {prefix && <span className="pl-4 font-semibold text-sage-500" aria-hidden="true">{prefix}</span>}
        <input
          id={id}
          type="text"
          inputMode={wholeNumber ? 'numeric' : 'decimal'}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          className="w-full min-w-0 rounded-2xl bg-transparent px-3 py-3 text-lg font-semibold tabular-nums text-ink outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {suffix && <span className="whitespace-nowrap pr-4 text-sm font-semibold text-sage-500">{suffix}</span>}
      </div>
      <p id={errorId} aria-live="polite" className="min-h-0 text-sm font-semibold text-loss-700">
        {error && (
          <span className="mt-1.5 flex items-start gap-1.5">
            <span aria-hidden="true">⚠</span>
            {error}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}
