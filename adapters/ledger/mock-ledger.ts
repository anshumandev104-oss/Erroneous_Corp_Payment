export interface LedgerRecord {
  reference_id: string;
  status: 'submitted' | 'pre_settlement' | 'settled';
  value_date: string;
  amount_posted: number;
  currency: 'AUD';
  channel: 'BECS';
  created_at: string;
  beneficiary_name: string | null;
  beneficiary_bsb: string | null;
}

const MOCK_LEDGER: Record<string, LedgerRecord> = {
  XYZ123: {
    reference_id: 'XYZ123',
    status: 'pre_settlement',
    value_date: '2026-02-20T00:00:00+11:00',
    amount_posted: 500000,
    currency: 'AUD',
    channel: 'BECS',
    created_at: '2026-02-20T10:02:00+11:00',
    beneficiary_name: 'Globex Corp Pty Ltd',
    beneficiary_bsb: '062-000',
  },
  ABC456: {
    reference_id: 'ABC456',
    status: 'pre_settlement',
    value_date: '2026-02-20T00:00:00+11:00',
    amount_posted: 2100,
    currency: 'AUD',
    channel: 'BECS',
    created_at: '2026-02-20T09:45:00+11:00',
    beneficiary_name: 'TechPay Solutions',
    beneficiary_bsb: '063-100',
  },
  KLY654: {
    reference_id: 'KLY654',
    status: 'settled',
    value_date: '2026-02-20T00:00:00+11:00',
    amount_posted: 3210.50,
    currency: 'AUD',
    channel: 'BECS',
    created_at: '2026-02-20T08:30:00+11:00',
    beneficiary_name: 'Riverside Holdings',
    beneficiary_bsb: '064-200',
  },
  DEF789: {
    reference_id: 'DEF789',
    status: 'pre_settlement',
    value_date: '2026-02-20T00:00:00+11:00',
    amount_posted: 15000,
    currency: 'AUD',
    channel: 'BECS',
    created_at: '2026-02-20T09:55:00+11:00',
    beneficiary_name: null,
    beneficiary_bsb: null,
  },
};

export function lookupLedger(reference_id: string): LedgerRecord | null {
  return MOCK_LEDGER[reference_id.toUpperCase()] ?? null;
}

export function listLedgerRefs(): string[] {
  return Object.keys(MOCK_LEDGER);
}
