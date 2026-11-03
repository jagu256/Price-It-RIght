import { useState, type ReactNode } from 'react';
import { useStore } from '../app/StoreContext';
import { NeedsValidBusiness, Notice, SectionHeader } from '../components/ui';
import { resolveScenario } from '../lib/pricing';
import { buildReport, type ReportData } from '../lib/report';

export default function BusinessReport() {
  const { state, model } = useStore();
  const [status, setStatus] = useState<string | null>(null);
  const scenario = model.summary && model.fixedCosts !== null ? resolveScenario(model.products, model.fixedCosts, state.scenario) : null;
  const report = model.summary ? buildReport(model, scenario) : null;

  const download = async () => {
    if (!report) return;
    try {
      setStatus('Creating your report…');
      const { renderReportPdf } = await import('../lib/reportPdf');
      const doc = renderReportPdf(report);
      const safe = report.businessName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'business';
      doc.save(`price-it-right-report-${safe}.pdf`);
      setStatus('Your report was created. Check your downloads folder.');
    } catch {
      setStatus('Sorry – the report could not be created in this browser.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
      <SectionHeader emoji="📊" title="My Business Report" subtitle="A printable PDF summary of your business, created in your browser. All amounts in CAD." />
      <NeedsValidBusiness ready={!!report}>
        {report && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary px-7 py-4 text-lg" onClick={download}>📥 Download My Business Report</button>
              {status && <p className="text-sm font-semibold text-sage-700" role="status">{status}</p>}
            </div>
            <Notice tone="info">Sales figures in the report are expected (forecast) amounts you entered – not actual transactions.</Notice>
            <Preview r={report} />
          </>
        )}
      </NeedsValidBusiness>
    </div>
  );
}

function Preview({ r }: { r: ReportData }) {
  return (
    <article className="card space-y-6 p-5 sm:p-8" aria-label="Report preview">
      <header className="rounded-2xl bg-sage-700 p-5 text-cream-50">
        <p className="text-xs font-bold uppercase tracking-wider opacity-90">Price It Right · Business Report</p>
        <h3 className="mt-1 text-2xl font-bold">{r.businessName}</h3>
        <p className="text-sm opacity-90">{r.category} · Generated {r.generated} · CAD{r.isDemo ? ' · Fictional demo data' : ''}</p>
      </header>
      <Block title="Products">
        <Table head={['Product', 'Price', 'Variable cost', 'Expected units', 'Revenue', 'Contribution', 'CM ratio']} rows={r.products} />
      </Block>
      <Block title="Business at a glance">
        <Table head={['Measure', 'Amount']} rows={r.totals} />
      </Block>
      <Block title="Break-even analysis">{r.breakEven.map((t) => <p key={t}>{t}</p>)}</Block>
      <Block title="Inventory summary">
        {r.inventory.length ? <Table head={['Item', 'Available', 'Required', 'Remaining', 'Status']} rows={r.inventory} /> : null}
        {r.shortages.map((t) => <p key={t} className="text-loss-700">• {t}</p>)}
      </Block>
      <Block title="Production planning">{r.production.map((t) => <p key={t}>{t}</p>)}</Block>
      {r.scenario && (
        <Block title="Scenario comparison">
          <Table head={['Metric', 'Current', 'Modified', 'Difference']} rows={r.scenario} />
        </Block>
      )}
      <Block title="Assumptions and limitations">
        <ul className="list-disc space-y-1 pl-5 text-sm">{r.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
      </Block>
    </article>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 text-sage-800">
      <h4 className="border-b-2 border-sage-100 pb-1 font-display text-lg font-bold text-sage-900">{title}</h4>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead><tr>{head.map((h, i) => <th key={h} scope="col" className={i ? 'text-right' : ''}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((c, i) => <td key={i} className={i ? 'text-right' : 'font-semibold'}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
