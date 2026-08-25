import { NavLink } from 'react-router-dom';
import { APP_TITLE, APP_VERSION } from '@/config/branding';
import { NAV_GROUPS } from '@/config/navigation';
import { useAuth } from '@/auth/AuthProvider';

export function Sidebar() {
  const { canAccess } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/assets/login-logo.png" alt="" className="sidebar-logo" />
        <div>
          <strong>{APP_TITLE}</strong>
          <small>V{APP_VERSION}</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => canAccess(item.id));
          if (!items.length) return null;
          return (
            <div key={group.id} className="nav-group">
              <div className="nav-group-label">{group.label}</div>
              {items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
