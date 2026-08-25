import type { ReactNode } from 'react';
import { AppStateProvider, useAppState } from '@/store/AppStateProvider';
import { AuthProvider } from '@/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';

function AppProviders({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  const users = state?.users ?? [];
  return <AuthProvider users={users}>{children}</AuthProvider>;
}

export default function App() {
  return (
    <AppStateProvider>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </AppStateProvider>
  );
}
