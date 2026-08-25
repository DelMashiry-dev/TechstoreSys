import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" aria-hidden="true" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
