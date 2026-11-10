import { useState } from 'react';
import { CellInput, Notice, SectionHeader, SignedMoney } from '../components/ui';
import { CHALLENGES, startValues, type Challenge, type Level } from '../lib/challenges';
import { t, tx } from '../i18n/i18n';
import { formatCAD, formatNumber } from '../lib/format';
import { cleanNumberText } from '../lib/validation';

const LEVELS: { level: Level; label: string; emoji: string }[] = [
  { level: 'beginner', label: tx('Beginner'), emoji: '🌱' },
  { level: 'intermediate', label: tx('Intermediate'), emoji: '🌿' },
  { level: 'expert', label: tx('Expert'), emoji: '🌳' },
];

/** Reads a typed number, accepting a French decimal comma (6,50). Blank or invalid → NaN (never 0). */
const readNumber = (text: string) => {
  const c = cleanNumberText(text);
  return 'error' in c || c.text.trim() === '' ? NaN : Number(c.text);
};

/** Challenge data is fictional and kept completely separate from your business. */
export default function BusinessChallenge() {
  const [level, setLevel] = useState<Level>('beginner');
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <SectionHeader emoji="🎮" title={t('Can You Save Your Business?')} subtitle={t('Practise business decisions with fictional scenarios. Nothing here changes your own business.')} />
      <div role="tablist" aria-label={t('Challenge level')} className="flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button key={l.level} role="tab" type="button" aria-selected={level === l.level} onClick={() => setLevel(l.level)} className={`rounded-full px-4 py-2 font-semibold transition ${level === l.level ? 'bg-sage-700 text-cream-50 shadow-soft' : 'bg-white text-sage-800 ring-1 ring-sage-200 hover:bg-sage-50'}`}>
            <span aria-hidden="true">{l.emoji} </span>{t(l.label)}
          </button>
        ))}
      </div>
      {CHALLENGES.map((c) => (
        <div key={c.level} hidden={c.level !== level} role="tabpanel" aria-label={c.title}>
          <ChallengeCard challenge={c} />
        </div>
      ))}
    </div>
  );
}

function ChallengeCard({ challenge: c }: { challenge: Challenge }) {
  const [text, setText] = useState<Record<string, string>>(() => Object.fromEntries(c.inputs.map((i) => [i.key, String(i.start)])));
  const values = Object.fromEntries(c.inputs.map((i) => [i.key, readNumber(text[i.key])]));
  const start = c.evaluate(startValues(c));
  const now = c.evaluate(values);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="card space-y-4 p-5 sm:p-6">
        <p className="eyebrow">{c.business}</p>
        <h3 className="text-2xl font-bold text-sage-900">{c.title}</h3>
        <div>
          <h4 className="font-bold text-sage-900">{t('Business background')}</h4>
          <p className="text-sage-700">{c.background}</p>
        </div>
        <div className="rounded-2xl bg-butter-100 p-4 ring-1 ring-butter-300">
          <h4 className="font-bold text-butter-700">🎯 {t('Objective')}</h4>
          <p className="text-sage-800">{c.objective}</p>
          <p className="mt-2 text-sm text-sage-700"><strong>{t('Success condition:')}</strong> {c.successCondition}</p>
        </div>
        <div>
          <h4 className="font-bold text-sage-900">{t('Starting financial information')}</h4>
          <p className="text-sage-700">
            {t('Starting operating profit:')} <strong><SignedMoney value={start.profit ?? 0} text={formatCAD(start.profit ?? 0)} /></strong> {t('per month.')}
          </p>
        </div>
      </div>

      <div className="card space-y-5 p-5 sm:p-6">
        <h4 className="text-xl font-bold text-sage-900">{t('Your decisions')}</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {c.inputs.map((i) => (
            <div key={i.key}>
              <label htmlFor={`ch-${c.level}-${i.key}`} className="block text-sm font-semibold text-sage-900">{i.label}</label>
              <div className="mt-1">
                <CellInput id={`ch-${c.level}-${i.key}`} label={i.label} prefix={i.prefix} width="w-full" value={text[i.key]} inputMode={i.step < 1 ? 'decimal' : 'numeric'} onChange={(v) => setText({ ...text, [i.key]: v })} invalid={!Number.isFinite(values[i.key]) || values[i.key] < i.min || values[i.key] > i.max} />
              </div>
              <input type="range" className="slider mt-2" min={i.min} max={i.max} step={i.step} aria-label={t('{label} slider', { label: i.label })} value={Number.isFinite(values[i.key]) ? Math.min(i.max, Math.max(i.min, values[i.key])) : i.min} onChange={(e) => setText({ ...text, [i.key]: e.target.value })} style={{ ['--pct' as string]: `${((Math.min(i.max, Math.max(i.min, Number.isFinite(values[i.key]) ? values[i.key] : i.min)) - i.min) / (i.max - i.min)) * 100}%` }} />
              <p className="mt-1 text-xs text-sage-600">{i.help}</p>
            </div>
          ))}
        </div>

        <div aria-live="polite" className="space-y-3">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
              <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Current results (start)')}</dt>
              <dd className="font-display text-2xl font-extrabold"><SignedMoney value={start.profit ?? 0} text={formatCAD(start.profit ?? 0)} /></dd>
            </div>
            <div className="rounded-2xl bg-cream-50 p-3 ring-1 ring-sage-100">
              <dt className="text-xs font-bold uppercase tracking-wider text-sage-600">{t('Updated results')}</dt>
              <dd className="font-display text-2xl font-extrabold">{now.profit === null ? '—' : <SignedMoney value={now.profit} text={formatCAD(now.profit)} />}</dd>
            </div>
          </dl>
          {now.facts.length > 0 && (
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-sage-700">
              {now.facts.map((f) => <li key={f.label}>{f.label}: <strong>{f.kind === 'money' ? formatCAD(f.value) : formatNumber(f.value)}</strong></li>)}
            </ul>
          )}
          {now.errors.length > 0 && (
            <Notice tone="error" title={now.profit === null ? t('Check your inputs') : t('This plan is not allowed')}>
              <ul className="list-disc pl-4">{now.errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </Notice>
          )}
          {now.success ? (
            <div className="animate-rise rounded-2xl bg-sage-700 p-4 text-cream-50" role="status">
              <p className="text-lg font-bold">🎉 {t('Challenge complete!')}</p>
              <p className="text-sm opacity-95">{t('You met the success condition with a valid plan. Great business thinking – try another level.')}</p>
            </div>
          ) : (
            now.valid && <p className="text-sm font-semibold text-sage-700">{t('Not there yet – keep adjusting your decisions.')}</p>
          )}
          <button type="button" className="btn-secondary" onClick={() => setText(Object.fromEntries(c.inputs.map((i) => [i.key, String(i.start)])))}>↺ {t('Restart challenge')}</button>
        </div>
      </div>
    </div>
  );
}
