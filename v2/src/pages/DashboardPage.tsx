import { Link } from 'react-router-dom';
import { useAppState } from '@/store/AppStateProvider';

function money(n: number) {
  return new Intl.NumberFormat('en-ZW', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function DashboardPage() {
  const { state, loading, dbConnected, syncing } = useAppState();

  if (loading || !state) {
    return <div className="page-loading"><div className="spinner" /><p>Loading dashboard…</p></div>;
  }

  const gl = state.glBudgets ?? {};
  const target = Object.values(gl).reduce((s, v) => s + (Number(v) || 0), 0);
  const txns = state.storesInventory?.transactions ?? [];
  const ict = state.ictAccountability ?? [];
  const reqs = state.requisitions ?? [];
  const condemned = ict.filter((r) => r.status === 'condemned' || r.status === 'boarded');

  const cards = [
    { label: 'GL target (sum)', value: money(target), hint: 'From glBudgets' },
    { label: 'Stock movements', value: String(txns.length), hint: 'storesInventory.transactions' },
    { label: 'ICT register', value: String(ict.length), hint: 'ictAccountability' },
    { label: 'Boarded / condemned', value: String(condemned.length), hint: 'Disposal chain' },
    { label: 'Requisitions', value: String(Array.isArray(reqs) ? reqs.length : 0), hint: 'Open pipeline' },
    { label: 'Storage', value: dbConnected ? 'Database' : 'Offline', hint: syncing ? 'Syncing…' : 'Live' },
  ];

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">TechStoreSys V2 overview — same data as V1 via shared API.</p>
        </div>
        <span className="badge badge-green">React V2.0.0.0</span>
      </header>

      <div className="kpi-grid">
        {cards.map((c) => (
          <article key={c.label} className="kpi-card">
            <span className="kpi-label">{c.label}</span>
            <strong className="kpi-value">{c.value}</strong>
            <small className="muted">{c.hint}</small>
          </article>
        ))}
      </div>

      <section className="panel">
        <h2>Quick links</h2>
        <div className="quick-links">
          <Link to="/ict/accountability" className="quick-link">ICT Asset Register</Link>
          <Link to="/stores/voucher" className="quick-link">Voucher / Inventory</Link>
          <Link to="/gl/3112210001" className="quick-link">GL 3112210001 — ICT</Link>
          <Link to="/workshop/receipt-cert" className="quick-link">Workshop Receipt Cert</Link>
          <Link to="/reports" className="quick-link">Reports</Link>
        </div>
      </section>

      <section className="panel panel-info">
        <h2>V2 migration status</h2>
        <p>
          This React shell connects to the existing Python backend (<code>server.py</code>).
          Module pages show placeholders until ported from V1. Use the sidebar to browse the planned route map.
        </p>
      </section>
    </div>
  );
}
