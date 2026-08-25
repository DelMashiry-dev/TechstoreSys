import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppState } from '@/store/AppStateProvider';
import { useAuth } from '@/auth/AuthProvider';
import {
  computeIctStats,
  filterIctRows,
  formatZa,
  statusMeta,
  type IctFilterKey,
  type IctRecordRow,
} from '@/config/ictAccountability';

const STAT_FILTERS: { key: IctFilterKey; label: string; statKey: keyof ReturnType<typeof computeIctStats> }[] = [
  { key: 'all', label: 'Total', statKey: 'total' },
  { key: 'equipment', label: 'ZA Eqpt', statKey: 'equipment' },
  { key: 'issued', label: 'Issued / S', statKey: 'issued' },
  { key: 'unserviceable', label: 'U/S', statKey: 'unserviceable' },
  { key: 'backloaded', label: 'Backload / Board', statKey: 'backloaded' },
  { key: 'losses', label: 'Stolen / Loss', statKey: 'losses' },
  { key: 'renewals', label: 'Renew ≤90d', statKey: 'renewals' },
];

export function IctAccountabilityPage() {
  const { state, loading } = useAppState();
  const { canEdit } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [filter, setFilter] = useState<IctFilterKey>('all');
  const [search, setSearch] = useState(initialQ);
  const [selected, setSelected] = useState<IctRecordRow | null>(null);

  const rows = (state?.ictAccountability ?? []) as IctRecordRow[];
  const stats = useMemo(() => computeIctStats(rows), [rows]);
  const filtered = useMemo(() => filterIctRows(rows, filter, search), [rows, filter, search]);

  function onTrack(e: FormEvent) {
    e.preventDefault();
    setParams(search ? { q: search } : {});
  }

  if (loading && !state) {
    return <div className="page-loading"><div className="spinner" /><p>Loading ICT register…</p></div>;
  }

  return (
    <div className="page ict-page">
      <header className="page-header">
        <div>
          <div className="ict-title-row">
            <span className="ict-za-badge">ZA</span>
            <div>
              <h1>ZNA ICT Asset Register</h1>
              <p className="muted">Engraved equipment · Traceable expendables · Software renewals</p>
            </div>
          </div>
        </div>
        <span className="badge badge-green">{filtered.length} shown</span>
      </header>

      <p className="ict-intro muted">
        ZNA ICT accounted by IT Dir. <strong>ZA numbers</strong> engraved at MLG.
        U/S items: backload → board → destruction. Board schedule items show as <strong>Condemned</strong>.
      </p>

      <div className="ict-stat-strip" role="group" aria-label="Filter by summary">
        {STAT_FILTERS.map(({ key, label, statKey }) => (
          <button
            key={key}
            type="button"
            className={`ict-stat${filter === key ? ' is-active' : ''}${['unserviceable', 'losses', 'renewals'].includes(key) ? ' is-warn' : ''}`}
            onClick={() => setFilter(key)}
          >
            <span>{label}</span>
            <strong>{stats[statKey]}</strong>
          </button>
        ))}
      </div>

      <section className="panel ict-track-panel">
        <h2>Track by ZA / S/N / status</h2>
        <form className="ict-track-bar" onSubmit={onTrack}>
          <input
            type="search"
            className="ict-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ZA662, boarded, Mashiri, IT Directorate…"
            aria-label="Search ICT register"
          />
          <button type="submit" className="btn btn-primary">Track</button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setSearch(''); setParams({}); setFilter('all'); }}
          >
            Clear
          </button>
        </form>
      </section>

      <section className="panel ict-table-panel">
        <div className="ict-table-toolbar">
          <h2>Register</h2>
          {!canEdit && <span className="badge">View only</span>}
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ZA / Trace</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Holder / Unit</th>
                <th>Board ref</th>
                <th>Q 1033</th>
                <th>Issue / received</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No records match. Try <strong>boarded</strong>, a ZA number, or clear filters.
                  </td>
                </tr>
              ) : filtered.map((rec, i) => {
                const sm = statusMeta(rec.status);
                return (
                  <tr
                    key={rec.id || `${rec.zaNumber}-${i}`}
                    className={selected?.id === rec.id ? 'is-selected' : ''}
                    onClick={() => setSelected(rec)}
                  >
                    <td>{i + 1}</td>
                    <td>
                      <strong>{formatZa(rec.zaNumber)}</strong>
                      {rec.serialNo && <small className="block muted">{rec.serialNo}</small>}
                      {!rec.zaNumber && rec.traceRef && <span>{rec.traceRef}</span>}
                    </td>
                    <td>
                      {rec.designation || '—'}
                      {rec.description && <small className="block muted">{rec.description}</small>}
                    </td>
                    <td>
                      <span className={`status-pill tone-${sm.tone}`}>{sm.label}</span>
                    </td>
                    <td>
                      {rec.holderName || rec.unit || '—'}
                      {rec.holderName && rec.unit && <small className="block muted">{rec.unit}</small>}
                    </td>
                    <td>{rec.boardRef || '—'}</td>
                    <td>{rec.form1033Ref || '—'}</td>
                    <td>{rec.issueDate || rec.receivedDate || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="panel ict-detail-panel">
          <div className="ict-detail-head">
            <h2>{formatZa(selected.zaNumber)} — {selected.designation || 'Detail'}</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          <dl className="detail-grid">
            <div><dt>Status</dt><dd>{statusMeta(selected.status).label}</dd></div>
            <div><dt>Class</dt><dd>{selected.assetClass || '—'}</dd></div>
            <div><dt>Unit</dt><dd>{selected.unit || '—'}</dd></div>
            <div><dt>Holder</dt><dd>{selected.holderName || '—'}</dd></div>
            <div><dt>S/N</dt><dd>{selected.serialNo || '—'}</dd></div>
            <div><dt>Board ref</dt><dd>{selected.boardRef || '—'}</dd></div>
            <div><dt>Q 1045</dt><dd>{selected.form1045Ref || '—'}</dd></div>
            <div><dt>Source</dt><dd>{selected.source || '—'}</dd></div>
          </dl>
          {selected.remarks && (
            <p className="ict-remarks"><strong>Remarks:</strong> {selected.remarks}</p>
          )}
        </section>
      )}
    </div>
  );
}
