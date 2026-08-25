import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  APP_TAGLINE,
  APP_TITLE,
  APP_VERSION,
  BRAND,
  COST_CENTRE,
  ORG,
} from '@/config/branding';
import { useAuth } from '@/auth/AuthProvider';
import { useAppState } from '@/store/AppStateProvider';

export function LoginPage() {
  const { user, login, error, loading: authLoading } = useAuth();
  const { dbConnected, loading: stateLoading } = useAppState();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await login(username.trim(), password);
    setBusy(false);
    if (!ok) return;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <img
            className="login-logo"
            src="/assets/login-logo.png"
            alt="TechStores ZNA logo"
          />
          <p className="login-org">{ORG}</p>
          <h1>{APP_TITLE}</h1>
          <p>{APP_TAGLINE}</p>
          <p className="login-version">TechStoreSys V{APP_VERSION}</p>
          <p className="login-cost-centre">Cost Centre {COST_CENTRE}</p>
        </div>

        <div className={`login-db-badge ${dbConnected ? 'is-online' : 'is-offline'}`}>
          {stateLoading
            ? 'Connecting to techstores.db…'
            : dbConnected
              ? 'Database connected — techstores.db'
              : 'Database offline — start START-SYSTEM.bat'}
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              placeholder="admin"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="login-hint muted">
          Demo: <strong>admin</strong> / <strong>admin123</strong>
          {' · '}
          Uses the same <code>techstores.db</code> as V1 via <code>/api</code>.
        </p>

        <a className="login-v1-link" href="http://127.0.0.1:8080/app/" style={{ color: BRAND.primaryGreen }}>
          Open classic V1 app →
        </a>
      </div>
    </div>
  );
}
