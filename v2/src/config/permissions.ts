export type RoleId =
  | 'admin'
  | 'army_commander'
  | 'director'
  | 'rq'
  | 'store_officer'
  | 'storeman'
  | 'viewer'
  | string;

export interface RolePermissions {
  modules: string[];
  canEdit: boolean;
  canReleaseCut?: boolean;
  canManageUsers?: boolean;
  canBackup?: boolean;
  canReports?: boolean;
  accessMode?: string;
}

/** Simplified RBAC — full matrix lives in v1 app/js/config.js; expand as modules port. */
export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    modules: ['*'],
    canEdit: true,
    canReleaseCut: true,
    canManageUsers: true,
    canBackup: true,
    canReports: true,
    accessMode: 'admin',
  },
  director: {
    modules: ['*'],
    canEdit: false,
    canReports: true,
    accessMode: 'oversight_view',
  },
  rq: {
    modules: [
      'dashboard', 'it-dir-comms', 'voucher-module', 'stock-take', 'ict-accountability',
      'ict-distribution', 'temporary-loans', 'unit-requisitions', 'dp-procurement',
      'reports-module', 'system-help',
    ],
    canEdit: true,
    canReports: true,
    accessMode: 'stores_edit',
  },
  store_officer: {
    modules: [
      'dashboard', 'it-dir-comms', 'voucher-module', 'stock-take', 'ict-accountability',
      'ict-distribution', 'temporary-loans', 'unit-requisitions', 'dp-procurement',
      'workshop-receipt-cert', 'delivery-note', 'reports-module', 'system-help',
    ],
    canEdit: true,
    canReports: true,
    accessMode: 'stores_edit',
  },
  storeman: {
    modules: [
      'dashboard', 'voucher-module', 'delivery-note', 'stock-take', 'temporary-loans',
      'zna-q-forms-index', 'zna-q-1033', 'system-help',
    ],
    canEdit: true,
    accessMode: 'stores_edit',
  },
  viewer: {
    modules: ['dashboard', 'system-help'],
    canEdit: false,
    accessMode: 'oversight_view',
  },
};

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  director: 'Director IT Dir (Col)',
  rq: 'Regimental Quartermaster (RQ)',
  store_officer: 'Store Officer',
  storeman: 'Storeman (Cpl)',
  viewer: 'Viewer',
};

export function getRolePermissions(role: string): RolePermissions {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.viewer;
}

export function canAccessModule(role: string, moduleId: string): boolean {
  const perms = getRolePermissions(role);
  if (perms.modules.includes('*')) return true;
  if (moduleId === 'user-management') return !!perms.canManageUsers;
  if (moduleId === 'release-cut') return !!perms.canReleaseCut;
  return perms.modules.includes(moduleId);
}

export function canEditRole(role: string): boolean {
  return getRolePermissions(role).canEdit;
}
