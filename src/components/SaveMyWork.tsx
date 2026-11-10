import { useRef, useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { MAX_FILE_BYTES, parseSavedBusiness, saveFileName, serializeBusiness } from '../lib/saveWork';
import { downloadBlob } from '../lib/templates';
import { Notice, SubHeader } from './ui';

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
    setMessage(`Saved a copy as ${name}. Keep the file somewhere safe – you can import it later on any device.`);
  };

  const importFile = async (file: File | undefined) => {
    setMessage('');
    setProblems([]);
    if (!file) return;
    try {
      if (file.size > MAX_FILE_BYTES) return setProblems(['This file is too large to be a Price It Right save file (limit 1 MB).']);
      const result = parseSavedBusiness(await file.text());
      if (!result.ok) return setProblems(result.errors);
      const found = result.business;
      const ok = await confirm({
        title: `Replace your current business with “${found.name.trim() || 'Unnamed business'}”?`,
        message: (
          <>
            <p>
              The file contains {count(found.products.length, 'product')}, {count(found.inventory.length, 'inventory item')} and{' '}
              {count(Object.keys(found.recipes).length, 'recipe')}.
            </p>
            <p className="mt-2">This replaces the products, fixed costs, inventory and recipes you have now. Export your current business first if you want to keep it.</p>
          </>
        ),
        confirmLabel: 'Replace my work',
        danger: true,
      });
      if (!ok) return;
      dispatch({ type: 'load-business', business: found, nextId: result.nextId });
      setMessage(`Imported “${found.name.trim() || 'Unnamed business'}” from ${file.name}.`);
    } catch {
      setProblems(['This file could not be read. Please choose a file made with “Export my business”.']);
    } finally {
      if (fileInput.current) fileInput.current.value = ''; // lets the same file be chosen again
    }
  };

  const startFresh = async () => {
    const ok = await confirm({
      title: 'Start fresh?',
      message: 'This removes the business saved on this device and loads the fictional Coffee Shop example again. Your products, fixed costs, inventory and recipes will be lost unless you export them first.',
      confirmLabel: 'Start fresh',
      danger: true,
    });
    if (!ok) return;
    dispatch({ type: 'load-sample', business: 'coffee' });
    setProblems([]);
    setMessage('Started fresh with the fictional Coffee Shop example.');
  };

  return (
    <section aria-labelledby="save-title" className="card space-y-4 p-5 sm:p-8">
      <SubHeader id="save-title" emoji="💾" title="Save my work" subtitle="Your business is saved automatically in this browser, and you can keep a copy as a file." />

      {!save.available ? (
        <Notice tone="warn" title="Saving is off" role="status">
          This browser is blocking storage (this can happen in private browsing), so your work will be lost when you close or refresh the page. Everything else
          still works. Use “Export my business” to keep a copy.
        </Notice>
      ) : save.saved ? (
        <Notice tone="success" title="Auto-save is on" role="status">
          Saved on this device. Every change is saved as you type, and your business will be here when you come back.
        </Notice>
      ) : (
        <Notice tone="info" title="Auto-save is on" role="status">
          You are looking at an unchanged fictional example, so there is nothing to save yet. Your work is saved as soon as you change something.
        </Notice>
      )}
      {save.startup === 'restored' && <p className="text-sm text-sage-700">Welcome back – the business you saved on this device was restored.</p>}
      {save.startup === 'unreadable' && (
        <Notice tone="warn">A saved business was found on this device but it could not be read, so the Coffee Shop example was loaded instead.</Notice>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={exportFile}>📤 Export my business (backup file)</button>
        <button type="button" className="btn-secondary" onClick={() => fileInput.current?.click()}>📥 Import a saved business</button>
        <button type="button" className="btn-secondary" onClick={startFresh}>🧹 Start fresh</button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Choose a saved business file"
          tabIndex={-1}
          onChange={(e) => importFile(e.target.files?.[0])}
        />
      </div>

      <p className="text-xs text-sage-600">
        The backup is a Price It Right file (.json) for “Import a saved business” – it isn’t meant to be opened, and your computer may show it as a code file. It is not a spreadsheet.
      </p>
      {message && <p className="text-sm font-semibold text-sage-800" role="status">{message}</p>}
      {problems.length > 0 && (
        <Notice tone="error" title="This file was not imported – your current business is unchanged" role="alert">
          <ul className="list-disc space-y-0.5 pl-4">
            {problems.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Notice>
      )}

      <p className="text-sm text-sage-700">
        <strong>🔒 Privacy:</strong> your data stays on this device only. It is stored in this browser and in any file you export – nothing is sent to a server,
        and there are no accounts. Anyone who uses this browser on this device can see it, so use “Start fresh” on a shared computer. Clearing your browser data
        also removes it. Pricing Lab and Production Planner experiments and challenge progress are not saved.
      </p>
    </section>
  );
}

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
