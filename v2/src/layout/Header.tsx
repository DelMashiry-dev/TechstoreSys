import { useAppState } from '@/store/AppStateProvider';
import { useAuth } from '@/auth/AuthProvider';
import { APP_VERSION } from '@/config/branding';

export function Header() {
  const { user, logout, roleLabel } = useAuth();
  const { dbConnected, syncing } = useAppState();

  return (
    <header className="app-header">
      <div className="header-left">
        <span className={`status-dot ${dbConnected ? 'online' : 'offline'}`} />
        <span className="header-status">
          {dbConnected ? 'techstores.db' : 'Offline'}
          {syncing ? ' · saving…' : ''}
        </span>
      </div>
      <div className="header-right">
        <span className="header-user">
          {user?.username}
          <small>{roleLabel}</small>
        </span>
        <span className="header-version">V{APP_VERSION}</span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
