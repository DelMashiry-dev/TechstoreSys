import { navItemById } from '@/config/navigation';

interface ModulePlaceholderProps {
  moduleId: string;
  description?: string;
}

export function ModulePlaceholder({ moduleId, description }: ModulePlaceholderProps) {
  const nav = navItemById(moduleId);
  const title = nav?.label ?? moduleId;

  return (
    <div className="page module-placeholder">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p className="muted">Module ID: <code>{moduleId}</code></p>
        </div>
        <span className="badge">V2 placeholder</span>
      </header>

      <section className="panel">
        <h2>Coming in V2</h2>
        <p>
          {description
            ?? `This screen will port functionality from V1 app/modules and app/js. The route and permissions are wired; UI and forms are next.`}
        </p>
        <ul className="placeholder-list">
          <li>Shared state via <code>GET/PUT /api/state</code></li>
          <li>Role-based access from V2 permissions config</li>
          <li>Module data under <code>appState.modules['{moduleId}']</code></li>
        </ul>
        <p className="muted">
          Classic V1 module:{' '}
          <a href={`http://127.0.0.1:8080/app/#${moduleId}`} target="_blank" rel="noreferrer">
            Open in V1 →
          </a>
        </p>
      </section>
    </div>
  );
}
