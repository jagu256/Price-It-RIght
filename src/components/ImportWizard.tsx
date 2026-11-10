import { useMemo, useRef, useState } from 'react';
import { useConfirm } from '../app/Confirm';
import { useStore } from '../app/StoreContext';
import { plural, t, tx } from '../i18n/i18n';
import { formatNumber } from '../lib/format';
import {
  INVENTORY_FIELDS,
  MAX_ROWS,
  RECIPE_FIELDS,
  buildRecipeImport,
  columnHeaders,
  dataRows,
  guessMapping,
  mappingErrors,
  readRecipeRows,
  readSpreadsheet,
  validateInventoryRows,
  type FieldSpec,
  type Mapping,
  type NameResolution,
  type RawSheet,
  type RowProblem,
} from '../lib/importer';
import { normaliseName } from '../lib/stock';
import { downloadBlob, inventoryTemplateBlob, recipeTemplateBlob } from '../lib/templates';
import { Notice } from './ui';

type Kind = 'inventory' | 'recipes';
type Step = 'choose' | 'map' | 'resolve' | 'review' | 'done';

const STEP_LABELS: Record<Step, string> = { choose: tx('Choose file'), map: tx('Match columns'), resolve: tx('Match names'), review: tx('Review'), done: tx('Done') };

export default function ImportWizard({ kind }: { kind: Kind }) {
  const { state, dispatch, model } = useStore();
  const confirm = useConfirm();
  const fields = (kind === 'inventory' ? INVENTORY_FIELDS : RECIPE_FIELDS) as FieldSpec<string>[];
  const [step, setStep] = useState<Step>('choose');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sheets, setSheets] = useState<RawSheet[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<Mapping<string>>({});
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [productRes, setProductRes] = useState<NameResolution>({});
  const [itemRes, setItemRes] = useState<NameResolution>({});
  const [doneMessage, setDoneMessage] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sheet = sheets[sheetIndex];
  const headers = sheet ? columnHeaders(sheet, hasHeader) : [];
  const rows = sheet ? dataRows(sheet, hasHeader) : [];
  const mapErrors = mappingErrors(mapping, fields);
  const prefix = `import-${kind}`;

  const products = state.business.products.map((p) => ({ id: p.id, name: p.name.trim() }));
  const items = state.business.inventory.map((i) => ({ id: i.id, name: i.name.trim(), unit: i.unit }));

  const inventoryResult = useMemo(
    () => (kind === 'inventory' && step === 'review' ? validateInventoryRows(rows, mapping as never, mode === 'append' ? state.business.inventory.map((i) => i.name) : []) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, step, sheetIndex, hasHeader, mapping, mode, sheets],
  );
  const recipeRead = useMemo(
    () => (kind === 'recipes' && (step === 'resolve' || step === 'review') ? readRecipeRows(rows, mapping as never, products, items) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, step, sheetIndex, hasHeader, mapping, sheets],
  );
  const recipeResult = recipeRead && step === 'review' ? buildRecipeImport(recipeRead.drafts, products, items, productRes, itemRes) : null;

  const reset = () => {
    setStep('choose');
    setSheets([]);
    setError(null);
    setFileName('');
    setProductRes({});
    setItemRes({});
    if (inputRef.current) inputRef.current.value = '';
  };

  const pickSheet = (all: RawSheet[], index: number, header: boolean) => {
    setSheetIndex(index);
    setMapping(guessMapping(columnHeaders(all[index], header), fields));
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setFileName(file.name);
    const r = await readSpreadsheet(file);
    setBusy(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setSheets(r.sheets);
    const first = Math.max(0, r.sheets.findIndex((s) => s.rows.length > 0));
    pickSheet(r.sheets, first, hasHeader);
    setStep('map');
  };

  const afterMapping = () => {
    if (mapErrors.length) return;
    if (kind === 'recipes') {
      const read = readRecipeRows(rows, mapping as never, products, items);
      setStep(read.unknownProducts.length || read.unknownItems.length ? 'resolve' : 'review');
    } else setStep('review');
  };

  const importInventory = async () => {
    if (!inventoryResult || inventoryResult.valid.length === 0) return;
    if (mode === 'replace' && state.business.inventory.length > 0) {
      const ok = await confirm({
        title: t('Replace your inventory?'),
        message: t('Your {current} will be replaced by {imported}. Recipe lines that used removed items will be flagged for you to fix.', {
          current: plural(state.business.inventory.length, '{n} current inventory item', '{n} current inventory items'),
          imported: plural(inventoryResult.valid.length, '{n} imported item', '{n} imported items'),
        }),
        confirmLabel: t('Replace inventory'),
        danger: true,
      });
      if (!ok) return;
    }
    dispatch({ type: 'import-stock', mode, items: inventoryResult.valid.map((v) => v.record) });
    const imported = plural(inventoryResult.valid.length, 'Imported {n} inventory item', 'Imported {n} inventory items');
    setDoneMessage(
      inventoryResult.problems.length
        ? `${imported} ${plural(inventoryResult.problems.length, '({n} row with problems skipped).', '({n} rows with problems skipped).')}`
        : `${imported}.`,
    );
    setStep('done');
  };

  const importRecipes = async () => {
    if (!recipeResult) return;
    const names = Object.keys(recipeResult.recipes).map((id) => products.find((p) => p.id === id)?.name ?? id);
    if (names.length === 0) return;
    const replacing = Object.keys(recipeResult.recipes).filter((id) => state.business.recipes[id]?.length);
    const ok = await confirm({
      title: t('Import these recipes?'),
      message: [
        t('Recipes will be saved for {names}.', { names: names.join(', ') }),
        replacing.length ? t('Existing recipes for these products will be replaced.') : '',
        t('Products not in the file keep their current recipes.'),
      ]
        .filter(Boolean)
        .join(' '),
      confirmLabel: t('Import recipes'),
    });
    if (!ok) return;
    dispatch({ type: 'import-recipes', recipes: recipeResult.recipes });
    setDoneMessage(t('Imported recipes for {names}.', { names: names.join(', ') }));
    setStep('done');
  };

  const template = async () => {
    const blob = kind === 'inventory' ? await inventoryTemplateBlob() : await recipeTemplateBlob();
    downloadBlob(blob, kind === 'inventory' ? 'price-it-right-inventory-template.xlsx' : 'price-it-right-recipe-template.xlsx');
  };

  const title = kind === 'inventory' ? t('Upload inventory') : t('Upload recipes (optional)');
  const recipeCount = recipeResult ? Object.keys(recipeResult.recipes).length : 0;

  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-xl font-bold text-sage-900">{title}</h4>
          <p className="text-sm text-sage-700">
            {t('Excel (.xlsx) or CSV, up to 5 MB and {rows} rows. Files are read in your browser and never uploaded anywhere.', { rows: formatNumber(MAX_ROWS) })}
          </p>
        </div>
        <button type="button" className="btn-small" onClick={template}>
          📥 {kind === 'inventory' ? t('Download Inventory Template') : t('Download Recipe Template')}
        </button>
      </div>

      <ol className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider" aria-label={t('Import steps')}>
        {((kind === 'inventory' ? ['choose', 'map', 'review', 'done'] : ['choose', 'map', 'resolve', 'review', 'done']) as Step[]).map((s, i) => (
          <li key={s} className={`rounded-full px-2.5 py-1 ${step === s ? 'bg-sage-700 text-cream-50' : 'bg-sage-50 text-sage-600'}`} aria-current={step === s ? 'step' : undefined}>
            {i + 1}. {t(STEP_LABELS[s])}
          </li>
        ))}
      </ol>

      {step === 'choose' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files[0]);
          }}
          className={`rounded-3xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-sage-600 bg-sage-50' : 'border-sage-200 bg-cream-50/60'}`}
        >
          <p className="text-3xl" aria-hidden="true">📄</p>
          <p className="mt-2 font-semibold text-sage-900">{t('Drag and drop a file here, or')}</p>
          <label htmlFor={`${prefix}-file`} className="btn-secondary mt-3 cursor-pointer">{t('Choose a file')}</label>
          <input id={`${prefix}-file`} ref={inputRef} type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => void handleFile(e.target.files?.[0])} />
          {busy && <p className="mt-3 text-sm text-sage-700" role="status">{t('Reading {file}…', { file: fileName })}</p>}
          {error && <p className="mt-3 text-sm font-semibold text-loss-700" role="alert">⚠ {error}</p>}
        </div>
      )}

      {step === 'map' && sheet && (
        <div className="space-y-4">
          <p className="text-sm text-sage-700">
            {t('File:')} <strong>{fileName}</strong>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {sheets.length > 1 && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                {t('Worksheet')}
                <select className="select" value={sheetIndex} onChange={(e) => pickSheet(sheets, Number(e.target.value), hasHeader)}>
                  {sheets.map((s, i) => (
                    <option key={s.name + i} value={i}>
                      {s.name} ({plural(s.rows.length, '{n} row', '{n} rows')})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={hasHeader} onChange={(e) => { setHasHeader(e.target.checked); setMapping(guessMapping(columnHeaders(sheet, e.target.checked), fields)); }} />
              {t('First row contains column headings')}
            </label>
          </div>

          <div className="overflow-x-auto rounded-2xl ring-1 ring-sage-100">
            <table className="data-table">
              <caption className="sr-only">{t('Preview of the first rows')}</caption>
              <thead><tr>{headers.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0, 5).map((r) => (
                  <tr key={r.rowNumber}>{headers.map((_, i) => <td key={i}>{r.cells[i] ?? ''}</td>)}</tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && <p className="px-3 py-2 text-xs text-sage-600">{plural(rows.length - 5, '…and {n} more row', '…and {n} more rows')}</p>}
            {rows.length === 0 && <p className="px-3 py-2 text-sm text-loss-700">{t('This worksheet has no data rows.')}</p>}
          </div>

          <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <legend className="mb-2 text-sm font-semibold text-sage-900">{t('Which column holds each field? Check these before importing.')}</legend>
            {fields.map((f) => (
              <label key={f.key} className="text-sm font-semibold text-sage-900">
                {t(f.label)}{f.required && <span className="text-loss-700"> *</span>}
                <select
                  className="select mt-1 w-full"
                  value={mapping[f.key] ?? ''}
                  onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value === '' ? null : Number(e.target.value) })}
                >
                  <option value="">{t('— Not in this file —')}</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </label>
            ))}
          </fieldset>
          {mapErrors.map((m) => <p key={m} className="text-sm font-semibold text-loss-700">⚠ {m}</p>)}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={mapErrors.length > 0 || rows.length === 0} onClick={afterMapping}>{t('Confirm columns & check rows')}</button>
            <button type="button" className="btn-secondary" onClick={reset}>{t('Cancel')}</button>
          </div>
        </div>
      )}

      {step === 'resolve' && recipeRead && (
        <div className="space-y-4">
          <Notice tone="warn" title={t('Some names don’t match')}>{t('Choose what each unknown name refers to, or skip those rows. Missing recipes are never invented.')}</Notice>
          {[
            { names: recipeRead.unknownProducts, options: products, res: productRes, set: setProductRes, key: 'product', heading: t('Unknown products') },
            { names: recipeRead.unknownItems, options: items, res: itemRes, set: setItemRes, key: 'item', heading: t('Unknown inventory items') },
          ].map((g) =>
            g.names.length ? (
              <div key={g.key} className="space-y-2">
                <p className="text-sm font-semibold text-sage-900">{g.heading}</p>
                {g.names.map((n) => {
                  const key = normaliseName(n);
                  return (
                    <label key={key} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="min-w-[8rem] font-semibold">“{n}”</span>→
                      <select className="select" value={g.res[key] === undefined ? '' : g.res[key] ?? '__skip'} onChange={(e) => g.set({ ...g.res, [key]: e.target.value === '__skip' ? null : e.target.value })}>
                        <option value="" disabled>{t('Choose…')}</option>
                        <option value="__skip">{t('Skip these rows')}</option>
                        {g.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </label>
                  );
                })}
              </div>
            ) : null,
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={[...recipeRead.unknownProducts.map((n) => productRes[normaliseName(n)]), ...recipeRead.unknownItems.map((n) => itemRes[normaliseName(n)])].some((v) => v === undefined)}
              onClick={() => setStep('review')}
            >
              {t('Continue')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep('map')}>{t('Back')}</button>
          </div>
        </div>
      )}

      {step === 'review' && inventoryResult && (
        <div className="space-y-4">
          {inventoryResult.tooManyRows ? (
            <Notice tone="error">{t('This sheet has more than {max} rows. Please split it into smaller files.', { max: formatNumber(MAX_ROWS) })}</Notice>
          ) : (
            <>
              <p className="font-semibold text-sage-900">
                ✅ {plural(inventoryResult.valid.length, '{n} row ready to import', '{n} rows ready to import')} ·{' '}
                {inventoryResult.problems.length ? `⚠ ${t('{n} with problems (will be skipped)', { n: inventoryResult.problems.length })}` : t('no problems found')}
              </p>
              {inventoryResult.mappingLooksWrong && <Notice tone="error" title={t('Check your column mapping')}>{t('Most rows have an invalid quantity – the wrong column may be selected.')}</Notice>}
              <Problems problems={inventoryResult.problems} />
              <fieldset className="flex flex-wrap gap-4 text-sm">
                <legend className="mb-1 font-semibold text-sage-900">
                  {t('What should happen to your current inventory ({items})?', { items: plural(state.business.inventory.length, '{n} item', '{n} items') })}
                </legend>
                <label className="flex items-center gap-2"><input type="radio" name={`${prefix}-mode`} checked={mode === 'replace'} onChange={() => setMode('replace')} /> {t('Replace it with this file')}</label>
                <label className="flex items-center gap-2"><input type="radio" name={`${prefix}-mode`} checked={mode === 'append'} onChange={() => setMode('append')} /> {t('Add these items to it')}</label>
              </fieldset>
              <ValidPreview rows={inventoryResult.valid.map((v) => [v.record.name, v.record.quantity, v.record.unit, v.record.cost || t('unknown')])} head={[t('Item'), t('Quantity'), t('Unit'), t('Cost per unit')]} />
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={!inventoryResult.valid.length} onClick={importInventory}>
              {plural(inventoryResult.valid.length, 'Import {n} item', 'Import {n} items')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setStep('map')}>{t('Back')}</button>
            <button type="button" className="btn-secondary" onClick={reset}>{t('Cancel')}</button>
          </div>
        </div>
      )}

      {step === 'review' && recipeResult && recipeRead && (
        <div className="space-y-4">
          {recipeRead.tooManyRows ? (
            <Notice tone="error">{t('This sheet has more than {max} rows.', { max: formatNumber(MAX_ROWS) })}</Notice>
          ) : (
            <>
              <p className="font-semibold text-sage-900">
                ✅ {plural(recipeCount, 'Recipes for {n} product ready', 'Recipes for {n} products ready')} · {plural(recipeResult.skipped, '{n} row skipped', '{n} rows skipped')} ·{' '}
                {t('{n} with problems', { n: recipeResult.problems.length })}
              </p>
              <Problems problems={recipeResult.problems} />
              <ValidPreview
                head={[t('Product'), t('Inventory item'), t('Quantity'), t('Unit')]}
                rows={Object.entries(recipeResult.recipes).flatMap(([pid, lines]) => lines.map((l) => [products.find((p) => p.id === pid)?.name ?? '', items.find((i) => i.id === l.itemId)?.name ?? '', l.quantity, l.unit]))}
              />
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" disabled={!recipeCount} onClick={importRecipes}>{t('Import recipes')}</button>
            <button type="button" className="btn-secondary" onClick={() => setStep(recipeRead.unknownProducts.length || recipeRead.unknownItems.length ? 'resolve' : 'map')}>{t('Back')}</button>
            <button type="button" className="btn-secondary" onClick={reset}>{t('Cancel')}</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3" role="status">
          <Notice tone="success" title={t('Import complete')}>
            {doneMessage} {t('You can edit any record below.')}
          </Notice>
          {kind === 'inventory' && Object.keys(model.stockErrors).length > 0 && <Notice tone="warn">{t('Some inventory records need attention – see the table below.')}</Notice>}
          <button type="button" className="btn-secondary" onClick={reset}>{t('Import another file')}</button>
        </div>
      )}
    </div>
  );
}

function Problems({ problems }: { problems: RowProblem[] }) {
  if (!problems.length) return null;
  return (
    <div className="max-h-56 overflow-y-auto rounded-2xl bg-loss-50 p-3 ring-1 ring-loss-100">
      <ul className="space-y-1 text-sm text-loss-700">
        {problems.map((p) => (
          <li key={p.rowNumber}>
            <strong>{t('Row {n}:', { n: p.rowNumber })}</strong> {p.messages.join(' ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ValidPreview({ head, rows }: { head: string[]; rows: string[][] }) {
  if (!rows.length) return null;
  return (
    <details className="rounded-2xl ring-1 ring-sage-100">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-sage-800">{t('Preview rows to import ({n})', { n: rows.length })}</summary>
      <div className="max-h-64 overflow-auto">
        <table className="data-table">
          <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}
