import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ApiError, fetchHealth, fetchState, saveState } from '@/api/client';
import type { AppState } from '@/types/appState';

interface AppStateContextValue {
  state: AppState | null;
  loading: boolean;
  syncing: boolean;
  dbConnected: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  patchState: (updater: (prev: AppState) => AppState) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const health = await fetchHealth();
      setDbConnected(!!health.ok && !!health.db);
      const data = await fetchState();
      if (data.state) setState(data.state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load state');
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scheduleSave = useCallback((next: AppState) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      setSyncing(true);
      try {
        await saveState(next, next.saveRevision);
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          await refresh();
        }
      } finally {
        setSyncing(false);
      }
    }, 600);
  }, [refresh]);

  const patchState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      if (dbConnected) scheduleSave(next);
      return next;
    });
  }, [dbConnected, scheduleSave]);

  const value = useMemo(
    () => ({ state, loading, syncing, dbConnected, error, refresh, patchState }),
    [state, loading, syncing, dbConnected, error, refresh, patchState],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
