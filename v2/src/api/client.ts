import type { HealthResponse, LoginResponse, StateResponse } from '@/types/appState';

const API_BASE = '';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status,
    );
  }
  return data as T;
}

export function fetchHealth() {
  return apiRequest<HealthResponse>('/api/health');
}

export function loginRequest(username: string, password: string) {
  return apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function fetchState() {
  return apiRequest<StateResponse>('/api/state');
}

export function saveState(state: unknown, revision?: number) {
  return apiRequest<StateResponse>('/api/state', {
    method: 'PUT',
    body: JSON.stringify({ state, revision }),
  });
}

export function postAudit(action: string, detail: string, username = '') {
  return apiRequest<{ ok: boolean }>('/api/audit', {
    method: 'POST',
    body: JSON.stringify({ action, username, detail }),
  }).catch(() => ({ ok: false }));
}

export function fetchAiStatus() {
  return apiRequest<{ ok: boolean; aiEnabled?: boolean; hint?: string }>('/api/ai/status').catch(
    () => ({ ok: false, aiEnabled: false, hint: 'Server offline' }),
  );
}
