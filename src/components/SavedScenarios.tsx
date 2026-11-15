import { useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { t } from '../i18n/i18n';
import { businessSummary, type BusinessSummary } from '../lib/business';
import { formatCAD, formatSignedCAD, unitsLabel } from '../lib/format';
import { compareScenarios, resolveScenario, type SavedScenario } from '../lib/pricing';
import { copyScenario } from '../lib/store';
import { Notice, SignedMoney, SubHeader } from './ui';

export const MAX_SAVED_SCENARIOS = 6;

const breakEven = (s: BusinessSummary) =>
  s.breakEven.status === 'reachable' ? unitsLabel(s.breakEven.totalUnits) : s.breakEven.status === 'no-fixed-costs' ? unitsLabel(0) : t('Not Available');

/**
 * 📸 Save the What-If plan under a name and compare several side by side.
 * Saved scenarios live only while the app is open – they are never written to the
 * device or the save file, and they never change the business.
 */
export default function SavedScenarios() {
  const { state, model, dispatch } = useStore();
  const confirm = useConfirm();
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [name, setName] = useState('');
  const [counter, setCounter] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  if (!model.summary || model.fixedCosts === null) return null;

  const fixed = model.fixedCosts;
  const current = businessSummary(model.products, fixed);
  const what = resolveScenario(model.products, fixed, state.scenario);
  const canSave = what.changed && !!what.summary && saved.length < MAX_SAVED_SCENARIOS;
  const rows = compareScenarios(model.products, fixed, saved);

  const save = () => {
    if (!canSave) return;
    const finalName = name.trim() || t('Scenario {n}', { n: counter });
    setSaved((s) => [...s, { id: `sc${Date.now()}-${counter}`, name: finalName, overrides: copyScenario(state.scenario) }]);
    setCounter((c) => c + 1);
    setName('');
    setMessage(t('Saved “{name}”.', { name: finalName }));
  };
  const remove = async (s: SavedScenario) => {
    const ok = await confirm({ title: t('Delete the scenario “{name}”?', { name: s.name }), message: <p>{t('This removes it from the comparison. Your business is not affected.')}</p>, confirmLabel: t('Delete scenario') });
    if (ok) setSaved((list) => list.filter((x) => x.id !== s.id));
  };
  const load = (s: SavedScenario) => {
    dispatch({ type: 'scenario-load', overrides: s.overrides });
    setMessage(t('“{name}” is now in the What-If simulator above.', { name: s.name }));
  };

  const metric = (label: string, get: (s: BusinessSummary) => string, strong = false) => (
    <tr className={strong ? 'font-bold' : ''}>
      <th scope="row">{label}</th>
      <td className="text-right">{get(current)}</td>
      {rows.map((r) => <td key={r.id} className="text-right">{r.summary ? get(r.summary) : '—'}</td>)}
    </tr>
  );

  return (
    <section aria-labelledby="saved-scenarios-title" className="space-y-5">
      <SubHeader id="saved-scenarios-title" emoji="📸" title={t('Save and compare scenarios')} subtitle={t('Save the What-If plan above under a name, try something else, and compare up to {max} scenarios side by side.', { max: MAX_SAVED_SCENARIOS })} />
      <div className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-semibold text-sage-800">
            {t('Scenario name')}
            <input className="text-input w-56" value={name} maxLength={40} placeholder={t('Scenario {n}', { n: counter })} onChange={(e) => setName(e.target.value)} />
          </label>
          <button type="button" className="btn-primary" disabled={!canSave} onClick={save}>📸 {t('Save this scenario')}</button>
        </div>
        {!what.changed && <p className="text-sm text-sage-600">{t('Change something in the What-If simulator first – then save it here.')}</p>}
        {what.changed && !what.summary && <p className="text-sm font-semibold text-loss-700">{t('Fix the highlighted values in the What-If simulator before saving.')}</p>}
        {saved.length >= MAX_SAVED_SCENARIOS && <p className="text-sm text-sage-600">{t('You can compare up to {max} scenarios. Delete one to save another.', { max: MAX_SAVED_SCENARIOS })}</p>}
        {message && <p role="status" className="text-sm font-semibold text-sage-700">{message}</p>}

        {rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[36rem]">
              <caption className="sr-only">{t('Saved scenarios compared with the current plan')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('Measure')}</th>
                  <th scope="col" className="text-right">{t('Current plan')}</th>
                  {rows.map((r) => (
                    <th key={r.id} scope="col" className="text-right">
                      {r.name}
                      {r.highest && <span className="block text-xs font-bold text-sage-700">★ {t('Highest profit of these')}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metric(t('Revenue'), (s) => formatCAD(s.totalRevenue))}
                {metric(t('Variable costs'), (s) => formatCAD(s.totalVariableCosts))}
                {metric(t('Contribution margin'), (s) => formatCAD(s.totalCM))}
                {metric(t('Fixed costs'), (s) => formatCAD(s.fixedCosts))}
                <tr className="font-bold">
                  <th scope="row">{t('Operating profit')}</th>
                  <td className="text-right"><SignedMoney value={current.operatingProfit} text={formatCAD(current.operatingProfit)} /></td>
                  {rows.map((r) => <td key={r.id} className="text-right">{r.summary ? <SignedMoney value={r.summary.operatingProfit} text={formatCAD(r.summary.operatingProfit)} /> : '—'}</td>)}
                </tr>
                <tr>
                  <th scope="row">{t('Change vs current plan')}</th>
                  <td className="text-right">—</td>
                  {rows.map((r) => <td key={r.id} className="text-right">{r.profitChange === null ? t('Check its values') : formatSignedCAD(r.profitChange)}</td>)}
                </tr>
                {metric(t('Break-even (sales mix)'), breakEven)}
                <tr>
                  <th scope="row"><span className="sr-only">{t('Actions')}</span></th>
                  <td />
                  {rows.map((r) => (
                    <td key={r.id} className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button type="button" className="btn-small" onClick={() => load(saved.find((s) => s.id === r.id)!)} aria-label={t('Load “{name}” into the What-If simulator', { name: r.name })}>↩ {t('Load')}</button>
                        <button type="button" className="btn-small" onClick={() => remove(saved.find((s) => s.id === r.id)!)} aria-label={t('Delete “{name}”', { name: r.name })}>🗑</button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <Notice tone="info">
          {t('Saved scenarios are kept only while the app is open – they are not saved on this device or in your backup file, and they never change your business. Each one is recalculated from your current business, so if you edit a product later the scenario uses the new numbers plus its own changes. “Highest profit of these” only compares the scenarios you saved.')}
        </Notice>
      </div>
    </section>
  );
}
