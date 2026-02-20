import type { TriageJson } from '../types/triage';
import type { CaseJson, CaseUrgency } from '../types/case';
import type { LedgerRecord } from '../../adapters/ledger/mock-ledger';
import type { SettlementWindow } from '../../adapters/settlement/static-window';

export class CaseAssemblyError extends Error {
  constructor(
    message: string,
    public readonly open_questions: string[],
  ) {
    super(message);
    this.name = 'CaseAssemblyError';
  }
}

function generateCaseId(reference_id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hex  = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `CASE-${reference_id}-${date}-${hex}`;
}

/**
 * Assemble Recall Case skill — TypeScript port.
 * Merges triage_json + ledger_record → case_json with empty actions[].
 * Payment status is ALWAYS taken from the ledger — never from the email.
 */
export function buildCase(
  triage: TriageJson,
  ledger: LedgerRecord,
  settlement: SettlementWindow,
  triage_sla_minutes = 2,
): CaseJson {
  // ── Validate triage minimums ───────────────────────────────────────────
  if (triage.intent !== 'recall') {
    throw new CaseAssemblyError('Cannot assemble case: recall intent not confirmed.', [
      'Please confirm whether this is a payment recall request.',
      ...(triage.open_questions ?? []),
    ]);
  }
  if (!triage.reference_id) {
    throw new CaseAssemblyError('Cannot assemble case: reference_id missing from triage.', [
      'Please provide the payment reference ID.',
    ]);
  }

  const now = new Date().toISOString();
  const triage_due = new Date(Date.now() + triage_sla_minutes * 60_000).toISOString();
  const case_id = generateCaseId(triage.reference_id);

  // ── Derive client name ─────────────────────────────────────────────────
  const client = triage.extracted.sender_org ?? null;

  // ── Triage notes ───────────────────────────────────────────────────────
  const overpay = triage.extracted.amount_reported && triage.extracted.amount_intended_hint
    ? triage.extracted.amount_reported - triage.extracted.amount_intended_hint
    : null;
  const triage_notes = [
    overpay !== null
      ? `Overpayment: $${overpay.toLocaleString()} sent ($${triage.extracted.amount_reported?.toLocaleString()} posted vs $${triage.extracted.amount_intended_hint?.toLocaleString()} intended).`
      : triage.extracted.amount_reported
        ? `Amount reported: $${triage.extracted.amount_reported.toLocaleString()}.`
        : null,
    `${ledger.status === 'pre_settlement' || ledger.status === 'submitted' ? 'Pre-settlement intercept requested.' : 'Payment already settled.'} Ledger confirms ${ledger.status} status.`,
  ].filter(Boolean).join(' ');

  return {
    case_id,
    detected_at: now,
    reference_id: triage.reference_id,
    client,
    amount: ledger.amount_posted,         // authoritative — from ledger
    currency: 'AUD',
    channel: 'BECS',
    payment_status: ledger.status,         // authoritative — from ledger
    urgency: triage.urgency as CaseUrgency,
    confidence: triage.confidence,
    triage_notes,
    ledger_verified: true,
    queue: 'To-Be-Resolved',
    status: 'Pending',
    priority_score: 0,                    // computed by buildQueue
    sla: {
      triage_due,
      cutoff_due: settlement.hard_settlement_iso,
    },
    actions: [],
    comms: {
      client_update_draft: null,
      beneficiary_outreach_draft: null,
    },
    audit: {
      source_email: triage.audit.source_email,
      triage_timestamp: triage.audit.triage_timestamp,
      model_confidence: triage.confidence,
      fields_extracted: triage.audit.features_used,
      actions_staged: [],
      actions_executed: [],
    },
  };
}
