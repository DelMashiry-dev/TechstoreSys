export interface User {
  id: string;
  username: string;
  role: string;
  fullName?: string;
  unit?: string;
  active?: boolean;
}

export interface GlBudgets {
  [glCode: string]: number;
}

export interface StoresInventory {
  openings?: Record<string, number>;
  transactions?: InventoryTransaction[];
  daySession?: unknown;
  dayHistory?: unknown[];
}

export interface InventoryTransaction {
  id?: string;
  type: 'issue' | 'receipt';
  date?: string;
  item?: string;
  qty?: number;
  party?: string;
  voucherNo?: string;
  category?: string;
}

export interface IctRecord {
  id?: string;
  designation?: string;
  zaNumber?: string;
  status?: string;
  holderName?: string;
  unit?: string;
  boardRef?: string;
}

export interface AppState {
  version?: number;
  theme?: string;
  glBudgets?: GlBudgets;
  glMonthlyTargets?: Record<string, unknown>;
  storesInventory?: StoresInventory;
  ictAccountability?: IctRecord[];
  requisitions?: unknown[];
  modules?: Record<string, unknown>;
  users?: User[];
  saveRevision?: number;
  savedAt?: string;
  savedBy?: string;
  [key: string]: unknown;
}

export interface SessionData {
  userId: string;
  username: string;
  loggedInAt: string;
}

export interface LoginResponse {
  ok: boolean;
  user?: User;
  error?: string;
}

export interface StateResponse {
  ok: boolean;
  state?: AppState;
  stats?: Record<string, unknown>;
  error?: string;
  revision?: number;
}

export interface HealthResponse {
  ok: boolean;
  db?: boolean;
  mode?: string;
}
