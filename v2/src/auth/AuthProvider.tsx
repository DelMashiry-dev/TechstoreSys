import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { loginRequest, postAudit } from '@/api/client';
import { SESSION_KEY } from '@/config/branding';
import { canAccessModule, canEditRole, getRolePermissions, ROLE_LABELS } from '@/config/permissions';
import type { SessionData, User } from '@/types/appState';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  canAccess: (moduleId: string) => boolean;
  canEdit: boolean;
  roleLabel: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionData) : null;
  } catch {
    return null;
  }
}

function writeSession(session: SessionData | null) {
  if (!session) sessionStorage.removeItem(SESSION_KEY);
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function AuthProvider({
  children,
  users,
}: {
  children: ReactNode;
  users: User[];
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = readSession();
    if (session && users.length) {
      const match = users.find((u) => u.id === session.userId || u.username === session.username);
      if (match) setUser(match);
    }
    setLoading(false);
  }, [users]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const data = await loginRequest(username, password);
      if (!data.ok || !data.user) {
        setError(data.error || 'Invalid username or password');
        return false;
      }
      setUser(data.user);
      writeSession({
        userId: data.user.id,
        username: data.user.username,
        loggedInAt: new Date().toISOString(),
      });
      void postAudit('login', 'React V2 sign-in', data.user.username);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    if (user) void postAudit('logout', 'React V2 sign-out', user.username);
    setUser(null);
    writeSession(null);
  }, [user]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    error,
    login,
    logout,
    canAccess: (moduleId) => (user ? canAccessModule(user.role, moduleId) : false),
    canEdit: user ? canEditRole(user.role) : false,
    roleLabel: user ? (ROLE_LABELS[user.role] ?? user.role) : '',
  }), [user, loading, error, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function usePermissions() {
  const { user } = useAuth();
  return user ? getRolePermissions(user.role) : getRolePermissions('viewer');
}
