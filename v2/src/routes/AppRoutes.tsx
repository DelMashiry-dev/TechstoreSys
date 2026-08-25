import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { AppShell } from '@/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ModulePlaceholder } from '@/pages/ModulePlaceholder';
import { IctAccountabilityPage } from '@/pages/ict/IctAccountabilityPage';

function PlaceholderRoute({ moduleId, description }: { moduleId: string; description?: string }) {
  return <ModulePlaceholder moduleId={moduleId} description={description} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="stores/voucher" element={<PlaceholderRoute moduleId="voucher-module" description="Stock issues, receipts, and Q 1033 / IV movements." />} />
          <Route path="stores/stock-take" element={<PlaceholderRoute moduleId="stock-take" />} />
          <Route path="stores/delivery-note" element={<PlaceholderRoute moduleId="delivery-note" />} />
          <Route path="stores/temporary-loans" element={<PlaceholderRoute moduleId="temporary-loans" />} />
          <Route path="stores/undelivered" element={<PlaceholderRoute moduleId="undelivered-orders" />} />
          <Route path="stores/requisitions" element={<PlaceholderRoute moduleId="unit-requisitions" />} />

          <Route path="gl/:code" element={<PlaceholderRoute moduleId="gl-dynamic" description="GL ledger view — maps to gl-* module IDs from route param." />} />
          <Route path="procurement/dp" element={<PlaceholderRoute moduleId="dp-procurement" />} />
          <Route path="procurement/spec-eval" element={<PlaceholderRoute moduleId="spec-evaluation" />} />
          <Route path="procurement/cost-comparative" element={<PlaceholderRoute moduleId="cost-comparative-schedule" />} />

          <Route path="ict/accountability" element={<IctAccountabilityPage />} />
          <Route path="ict/distribution" element={<PlaceholderRoute moduleId="ict-distribution" />} />
          <Route path="workshop/receipt-cert" element={<PlaceholderRoute moduleId="workshop-receipt-cert" description="Workshop receipt certification before MLG engraving." />} />

          <Route path="forms" element={<PlaceholderRoute moduleId="zna-q-forms-index" />} />
          <Route path="forms/q-1033" element={<PlaceholderRoute moduleId="zna-q-1033" />} />
          <Route path="forms/svcs-1045" element={<PlaceholderRoute moduleId="zna-svcs-1045" />} />

          <Route path="reports" element={<PlaceholderRoute moduleId="reports-module" />} />
          <Route path="comms" element={<PlaceholderRoute moduleId="it-dir-comms" />} />
          <Route path="admin/users" element={<PlaceholderRoute moduleId="user-management" />} />
          <Route path="help" element={<PlaceholderRoute moduleId="system-help" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
