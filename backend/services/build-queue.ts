import type { CaseJson, QueueRecord } from '../types/case';
import type { SettlementWindow } from '../../adapters/settlement/static-window';

/**
 * Queue and SLA skill — TypeScript port.
 * Sets authoritative SLA timers, computes priority_score, emits queue_record.
 */
export function buildQueue(
  case_json: CaseJson,
  settlement: SettlementWindow,
  triage_sla_minutes = 2,
): { updated_case_json: CaseJson; queue_record: QueueRecord } {
  const now = Date.now();

  const triage_due = new Date(now + triage_sla_minutes * 60_000).toISOString();
  const cutoff_due = settlement.hard_settlement_iso;
  const priority_score = Math.max(
    0,
    Math.round((new Date(cutoff_due).getTime() - now) / 60_000),
  );

  const updated_case_json: CaseJson = {
    ...case_json,
    queue: 'To-Be-Resolved',
    status: 'Triaged',
    priority_score,
    sla: {
      triage_due,
      cutoff_due,
    },
  };

  const queue_record: QueueRecord = {
    case_id:        updated_case_json.case_id,
    reference_id:   updated_case_json.reference_id,
    amount:         updated_case_json.amount,
    currency:       'AUD',
    urgency:        updated_case_json.urgency,
    priority_score,
    received_at:    updated_case_json.detected_at,
    triage_due,
    cutoff_due,
    status:         'Triaged',
    client:         updated_case_json.client,
    queue:          'To-Be-Resolved',
  };

  return { updated_case_json, queue_record };
}
