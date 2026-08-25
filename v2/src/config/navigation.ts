export interface NavItem {
  id: string;
  label: string;
  path: string;
  group?: string;
  badge?: string;
}

export const NAV_GROUPS: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: 'core',
    label: 'Core',
    items: [
      { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    id: 'stores',
    label: 'Stores & GL',
    items: [
      { id: 'voucher-module', label: 'Voucher / Inventory', path: '/stores/voucher' },
      { id: 'stock-take', label: 'Stock Take', path: '/stores/stock-take' },
      { id: 'delivery-note', label: 'Delivery Note', path: '/stores/delivery-note' },
      { id: 'temporary-loans', label: 'Temporary Loans', path: '/stores/temporary-loans' },
      { id: 'undelivered-orders', label: 'Undelivered Items', path: '/stores/undelivered' },
      { id: 'unit-requisitions', label: 'Unit Requisitions', path: '/stores/requisitions' },
    ],
  },
  {
    id: 'gl',
    label: 'GL Accounts',
    items: [
      { id: 'gl-3112210001', label: '3112210001 — ICT Equipment', path: '/gl/3112210001' },
      { id: 'gl-2200600003', label: '2200600003 — Software', path: '/gl/2200600003' },
      { id: 'gl-2201900002', label: '2201900002 — Spares', path: '/gl/2201900002' },
      { id: 'gl-220200002', label: '220200002 — Maintenance', path: '/gl/220200002' },
      { id: 'gl-2200600002', label: '2200600002 — Consumables', path: '/gl/2200600002' },
    ],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    items: [
      { id: 'dp-procurement', label: 'DP Procurement', path: '/procurement/dp' },
      { id: 'spec-evaluation', label: 'Spec Evaluation', path: '/procurement/spec-eval' },
      { id: 'cost-comparative-schedule', label: 'Cost Comparative', path: '/procurement/cost-comparative' },
    ],
  },
  {
    id: 'ict',
    label: 'ICT',
    items: [
      { id: 'ict-accountability', label: 'ICT Asset Register', path: '/ict/accountability' },
      { id: 'ict-distribution', label: 'ICT Distribution', path: '/ict/distribution' },
      { id: 'workshop-receipt-cert', label: 'Workshop Receipt Cert', path: '/workshop/receipt-cert' },
    ],
  },
  {
    id: 'forms',
    label: 'ZNA Q Forms',
    items: [
      { id: 'zna-q-forms-index', label: 'Q Forms Index', path: '/forms' },
      { id: 'zna-q-1033', label: 'Q 1033', path: '/forms/q-1033' },
      { id: 'zna-svcs-1045', label: 'SVCS 1045', path: '/forms/svcs-1045' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin & Reports',
    items: [
      { id: 'reports-module', label: 'Reports', path: '/reports' },
      { id: 'it-dir-comms', label: 'IT Dir Comms', path: '/comms' },
      { id: 'user-management', label: 'User Management', path: '/admin/users' },
      { id: 'system-help', label: 'System Help', path: '/help' },
    ],
  },
];

export function flattenNavItems() {
  return NAV_GROUPS.flatMap((g) => g.items);
}

export function navItemById(id: string): NavItem | undefined {
  return flattenNavItems().find((i) => i.id === id);
}
