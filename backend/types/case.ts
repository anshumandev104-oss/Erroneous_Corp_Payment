import type { ActionType, StagedAction } from './actions';

export type PaymentStatus = 'submitted' | 'pre_settlement' | 'settled';
export type QueueName = 'To-Be-Resolved';
export type CaseUrgency = 'critical' | 'high' | 'medium' | 'low';
export type CaseStatus = 'In Review' | 'Pending' | 'Triaged' | 'Resolved';

export interface CaseSLA {
  triage_due: string;   // ISO = detected_at + triage_sla_minutes
  cutoff_due: string;   // ISO = hard_settlement_iso
}

export interface CaseComms {
  client_update_draft: string | null;
  beneficiary_outreach_draft: string | null;
  beneficiary_outreach_not_applicable_reason?: string;
}

export interface CaseAudit {
  source_email: string;           // sanitized
  triage_timestamp: string;       // ISO
  model_confidence: number;       // 0–1
  fields_extracted: string[];
  actions_staged: ActionType[];
  actions_executed: never[];      // always empty — HITL invariant
}

export interface CaseJson {
  case_id: string;
  detected_at: string;            // ISO
  reference_id: string;
  client: string | null;
  amount: number;
  currency: 'AUD';
  channel: 'BECS';
  payment_status: PaymentStatus;
  urgency: CaseUrgency;
  confidence: number;             // 0–1
  triage_notes: string | null;
  ledger_verified: boolean;
  queue: QueueName;
  status: CaseStatus;
  priority_score: number;         // minutes to cutoff_due
  sla: CaseSLA;
  actions: StagedAction[];
  comms: CaseComms;
  audit: CaseAudit;
}

export interface QueueRecord {
  case_id: string;
  reference_id: string;
  amount: number;
  currency: 'AUD';
  urgency: CaseUrgency;
  priority_score: number;
  received_at: string;            // ISO
  triage_due: string;             // ISO
  cutoff_due: string;             // ISO
  status: CaseStatus;
  client: string | null;
  queue: QueueName;
}
