import { parseEml }           from '../../adapters/email/parse-eml';
import { lookupLedger }       from '../../adapters/ledger/mock-ledger';
import { getSettlementWindow } from '../../adapters/settlement/static-window';
import { triageEmail }        from './triage-email';
import { buildCase }          from './build-case';
import { buildQueue }         from './build-queue';
import { stageActions }       from './stage-actions';
import type { TriageJson }    from '../types/triage';
import type { CaseJson, QueueRecord } from '../types/case';

export interface PipelineResult {
  triage_json: TriageJson;
  case_json:   CaseJson;
  queue_record: QueueRecord;
}

export interface PipelineError {
  error: string;
  open_questions?: string[];
  triage_json?: TriageJson;
}

/**
 * Master pipeline orchestrator.
 * Sequences: parseEml → triageEmail → lookupLedger → buildCase →
 *            getSettlementWindow → buildQueue → stageActions
 *
 * Returns PipelineResult on success.
 * Returns PipelineError (not throws) when triage yields unknown intent
 * or ledger lookup fails — so API routes can return 200 with open_questions.
 */
export async function orchestratePipeline(
  email_path: string,
  now_iso?: string,
  triage_sla_minutes = 2,
): Promise<PipelineResult | PipelineError> {
  // Step 1 — Parse email
  const parsed = await parseEml(email_path);

  // Step 2 — Triage
  const triage_json = triageEmail(parsed, now_iso);

  if (triage_json.intent !== 'recall' || !triage_json.reference_id) {
    return {
      error: 'Recall intent not confirmed or reference_id missing.',
      open_questions: triage_json.open_questions,
      triage_json,
    };
  }

  // Step 3 — Ledger lookup
  const ledger = lookupLedger(triage_json.reference_id);
  if (!ledger) {
    return {
      error: `No ledger record found for reference ${triage_json.reference_id}.`,
      open_questions: [
        `Please verify reference ID ${triage_json.reference_id} and confirm the payment details.`,
      ],
      triage_json,
    };
  }

  // Step 4 — Settlement window
  const settlement = getSettlementWindow(triage_json.reference_id);

  // Step 5 — Assemble case (actions: [])
  const raw_case = buildCase(triage_json, ledger, settlement, triage_sla_minutes);

  // Step 6 — Queue + SLA timers
  const { updated_case_json: queued_case, queue_record } = buildQueue(
    raw_case,
    settlement,
    triage_sla_minutes,
  );

  // Step 7 — Stage actions
  const case_json = stageActions(queued_case);

  return { triage_json, case_json, queue_record };
}

export function isPipelineError(result: PipelineResult | PipelineError): result is PipelineError {
  return 'error' in result;
}
