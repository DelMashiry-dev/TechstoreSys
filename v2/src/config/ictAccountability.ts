export const ICT_ACC_CLASSES = [
  { value: 'equipment', label: 'ICT Equipment (ZA engraved)' },
  { value: 'expendable', label: 'Expendable / Consumable (traceable)' },
  { value: 'software', label: 'Software Licence' },
  { value: 'spare', label: 'Spare / Part' },
] as const;

export const ICT_ACC_STATUSES = [
  { value: 'in_stores', label: 'In stores (MLG / IT Dir)', group: 'Custody', tone: 'ok' },
  { value: 'issued', label: 'Issued to holding unit', group: 'Custody', tone: 'issued' },
  { value: 'on_loan', label: 'On temporary loan', group: 'Custody', tone: 'monitor' },
  { value: 'returned', label: 'Returned', group: 'Custody', tone: 'ok' },
  { value: 'serviceable', label: 'Serviceable (S)', group: 'Serviceability', tone: 'ok' },
  { value: 'unserviceable', label: 'Unserviceable (U/S)', group: 'Serviceability', tone: 'warn' },
  { value: 'backloaded', label: 'Backloaded — struck off ledger', group: 'Disposal / strike-off', tone: 'monitor' },
  { value: 'boarded', label: 'Boarded / surveyed', group: 'Disposal / strike-off', tone: 'warn' },
  { value: 'condemned', label: 'Condemned / for destruction', group: 'Disposal / strike-off', tone: 'critical' },
  { value: 'stolen', label: 'Stolen (accounted)', group: 'Losses', tone: 'critical' },
  { value: 'destroyed_natural', label: 'Destroyed by natural causes', group: 'Losses', tone: 'critical' },
  { value: 'written_off', label: 'Written off (legacy)', group: 'Losses', tone: 'neutral' },
  { value: 'expired', label: 'Licence expired', group: 'Software', tone: 'critical' },
] as const;

export type IctFilterKey =
  | 'all'
  | 'equipment'
  | 'expendable'
  | 'software'
  | 'spare'
  | 'issued'
  | 'unserviceable'
  | 'backloaded'
  | 'losses'
  | 'renewals';

export function statusMeta(status?: string) {
  const key = status === 'written_off' ? 'condemned' : (status || 'in_stores');
  return ICT_ACC_STATUSES.find((s) => s.value === key)
    ?? { value: key, label: key, group: 'Other', tone: 'neutral' as const };
}

export function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(String(dateStr).slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export interface IctRecordRow {
  id?: string;
  assetClass?: string;
  designation?: string;
  description?: string;
  zaNumber?: string;
  serialNo?: string;
  traceRef?: string;
  status?: string;
  holderName?: string;
  forceNo?: string;
  unit?: string;
  issueDate?: string;
  receivedDate?: string;
  form1033Ref?: string;
  boardRef?: string;
  form1045Ref?: string;
  remarks?: string;
  expiryDate?: string;
  engraved?: boolean;
  source?: string;
}

export function computeIctStats(rows: IctRecordRow[]) {
  return {
    total: rows.length,
    equipment: rows.filter((r) => r.assetClass === 'equipment').length,
    issued: rows.filter((r) => ['issued', 'on_loan', 'serviceable'].includes(r.status || '')).length,
    unserviceable: rows.filter((r) => r.status === 'unserviceable').length,
    backloaded: rows.filter((r) => ['backloaded', 'boarded', 'condemned'].includes(r.status || '')).length,
    losses: rows.filter((r) => ['stolen', 'destroyed_natural'].includes(r.status || '')).length,
    renewals: rows.filter((r) => {
      if (r.assetClass !== 'software') return false;
      const d = daysUntil(r.expiryDate);
      return d != null && d <= 90;
    }).length,
  };
}

export function filterIctRows(
  rows: IctRecordRow[],
  filter: IctFilterKey,
  search: string,
): IctRecordRow[] {
  const q = search.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter === 'equipment' && r.assetClass !== 'equipment') return false;
    if (filter === 'expendable' && r.assetClass !== 'expendable') return false;
    if (filter === 'software' && r.assetClass !== 'software') return false;
    if (filter === 'spare' && r.assetClass !== 'spare') return false;
    if (filter === 'issued' && !['issued', 'on_loan', 'serviceable'].includes(r.status || '')) return false;
    if (filter === 'unserviceable' && r.status !== 'unserviceable') return false;
    if (filter === 'backloaded' && !['backloaded', 'boarded', 'condemned'].includes(r.status || '')) return false;
    if (filter === 'losses' && !['stolen', 'destroyed_natural'].includes(r.status || '')) return false;
    if (filter === 'renewals') {
      if (r.assetClass !== 'software') return false;
      const d = daysUntil(r.expiryDate);
      if (d == null || d > 90) return false;
    }
    if (!q) return true;
    const blob = [
      r.designation, r.description, r.zaNumber, r.traceRef, r.serialNo,
      r.holderName, r.forceNo, r.unit, r.form1033Ref, r.boardRef, r.remarks,
      statusMeta(r.status).label,
    ].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

export function formatZa(za?: string) {
  const n = String(za || '').replace(/\D/g, '');
  return n ? `ZA ${n}` : '—';
}
