import { useRef, useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { plural, t } from '../i18n/i18n';
import { MAX_FILE_BYTES, parseSavedBusiness, saveFileName, serializeBusiness } from '../lib/saveWork';
import { downloadBlob } from '../lib/templates';
import { Notice, Rich, SubHeader } from './ui';

/** 💾 Save my work: auto-save status, export, import, start fresh and the privacy note. */
export default function SaveMyWork() {
  const { state, dispatch, save } = useStore();
  const confirm = useConfirm();
  const fileInput = useRef<HTMLInputElement>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const b = state.business;

  const exportFile = () => {
    setProblems([]);
    const name = saveFileName(b.name);
    downloadBlob(new Blob([serializeBusiness(b, new Date().toISOString())], { type: 'application/json' }), name);
    setMessage(t('Saved a copy as {name}. Keep the file somewhere safe – you can import it later on any device.', { name }));
  };

  const importFile = async (file: File | undefined) => {
    setMessage('');
    setProblems([]);
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) return setProblems([t('This file is too large to be a Price It Right save file (limit 1 MB).')]);
      const result = parseSavedBusiness(await file.text());
      if (!result.ok) return setProblems(result.errors);
      const found = result.business;
      const name = found.name.trim() || t('Unnamed business');
      const ok = await confirm({
        title: t('Replace your current business with “{name}”?', { name }),
        message: (
          <>
            <p>
              {t('The file contains {products}, {items} and {recipes}.', {
                products: plural(found.products.length, '{n} product', '{n} products'),
                items: plural(found.inventory.length, '{n} inventory item', '{n} inventory items'),
                recipes: plural(Object.keys(found.recipes).length, '{n} recipe', '{n} recipes'),
              })}
            </p>
            <p className="mt-2">{t('This replaces the products, fixed costs, inventory and recipes you have now. Export your current business first if you want to keep it.')}</p>
          </>
        ),
        confirmLabel: t('Replace my work'),
        danger: true,
      });
      if (!ok) return;
      dispatch({ type: 'load-business', business: found, nextId: result.nextId });
      setMessage(t('Imported “{name}” from {file}.', { name, file: file.name }));
    } catch {
      setProblems([t('This file could not be read. Please choose a file made with “Export my business”.')]);
    } finally {
      if (fileInput.current) fileInput.current.value = ''; // lets the same file be chosen again
    }
  };

  const startFresh = async () => {
    const ok = await confirm({
      title: t('Start fresh?'),
      message: t('This removes the business saved on this device and loads the fictional Coffee Shop example again. Your products, fixed costs, inventory and recipes will be lost unless you export them first.'),
      confirmLabel: t('Start fresh'),
      danger: true,
    });
    if (!ok) return;
    dispatch({ type: 'load-sample', business: 'coffee' });
    setProblems([]);
    setMessage(t('Started fresh with the fictional Coffee Shop example.'));
  };

  return (
    <section aria-labelledby="save-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader id="save-title" emoji="💾" title={t('Save my work')} subtitle={t('Your business is saved automatically in this browser, and you can keep a copy as a file.')} />

      {!save.available ? (
        <Notice tone="warn" title={t('Saving is off')} role="status">
          {t('This browser is blocking storage (this can happen in private browsing), so your work will be lost when you close or refresh the page. Everything else still works. Use “Export my business” to keep a copy.')}
        </Notice>
      ) : save.saved ? (
        <Notice tone="success" title={t('Auto-save is on')} role="status">
          {t('Saved on this device. Every change is saved as you type, and your business will be here when you come back.')}
        </Notice>
      ) : (
        <Notice tone="info" title={t('Auto-save is on')} role="status">
          {t('You are looking at an unchanged fictional example, so there is nothing to save yet. Your work is saved as soon as you change something.')}
        </Notice>
      )}
      {save.startup === 'restored' && <p className="text-sm text-sage-700">{t('Welcome back – the business you saved on this device was restored.')}</p>}
      {save.startup === 'unreadable' && (
        <Notice tone="warn">{t('A saved business was found on this device but it could not be read, so the Coffee Shop example was loaded instead.')}</Notice>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={exportFile}>📤 {t('Export my business (backup file)')}</button>
        <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>📥 {t('Import a saved business')}</button>
        <button type="button" className="btn-secondary" onClick={startFresh}>🧹 {t('Start fresh')}</button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label={t('Choose a saved business file')}
          tabIndex={-1}
          onChange={(e) => importFile(e.target.files?.[0])}
        />
      </div>

      <p className="text-xs text-sage-600">
        {t('The backup is a Price It Right file (.json) for “Import a saved business” – it isn’t meant to be opened, and your computer may show it as a code file. It is not a spreadsheet – for that, use')}{' '}
        <a className="font-semibold underline" href="#report">📊 {t('Business Report → Download my business as Excel')}</a>.
      </p>
      {message && <p className="text-sm font-semibold text-sage-800" role="status">{message}</p>}
      {problems.length > 0 && (
        <Notice tone="error" title={t('This file was not imported – your current business is unchanged')} role="alert">
          <ul className="list-disc space-y-0.5 pl-4">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Notice>
      )}

      <p className="text-sm text-sage-700">
        <Rich
          text={t(
            '**🔒 Privacy:** your data stays on this device only. It is stored in this browser and in any file you export – nothing is sent to a server, and there are no accounts. Anyone who uses this browser on this device can see it, so use “Start fresh” on a shared computer. Clearing your browser data also removes it. Pricing Lab and Production Planner experiments and challenge progress are not saved.',
          )}
        />
      </p>
    </section>
  );
}
