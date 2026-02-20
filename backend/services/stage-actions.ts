import type { CaseJson } from '../types/case';
import type { StagedAction, ActionType } from '../types/actions';

const DEFAULT_THRESHOLD = 25_000;

function generateActionId(): string {
  return `ACTION-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
}

function buildStagedAction(
  type: ActionType,
  requiresSecondApprover: boolean,
): StagedAction {
  return {
    action_id:                generateActionId(),
    type,
    status:                   'staged',
    executed:                 false,
    requires_approval:        true,
    requires_second_approver: requiresSecondApprover,
    justification:            'Recall intent detected; pre-settlement intercept',
    created_at:               new Date().toISOString(),
    approved_at:              null,
    approver_id:              null,
    approver_role:            null,
    second_approver_id:       null,
    second_approver_role:     null,
  };
}

/**
 * Scheme Stop or Alternative skill — TypeScript port.
 *
 * - pre_settlement / submitted  → stage SCHEME_STOP
 * - settled                     → stage RETURN_REQUEST + BENEFICIARY_OUTREACH
 * - amount > threshold          → requires_second_approver = true
 * - All comms drafts marked AUTO-GENERATED
 * - HITL invariant: executed is always false — never changes here
 */
export function stageActions(case_json: CaseJson): CaseJson {
  const threshold = parseInt(process.env.THRESHOLD_SECOND_APPROVER ?? `${DEFAULT_THRESHOLD}`, 10);
  const requiresSecondApprover = case_json.amount > threshold;
  const actions: StagedAction[] = [];
  const stagedTypes: ActionType[] = [];

  if (case_json.payment_status === 'pre_settlement' || case_json.payment_status === 'submitted') {
    const action = buildStagedAction('SCHEME_STOP', requiresSecondApprover);
    actions.push(action);
    stagedTypes.push('SCHEME_STOP');
  } else {
    // settled — stage return request and beneficiary outreach
    const returnAction = buildStagedAction('RETURN_REQUEST', requiresSecondApprover);
    returnAction.justification = 'Payment settled; return request required';
    const outreachAction = buildStagedAction('BENEFICIARY_OUTREACH', requiresSecondApprover);
    outreachAction.justification = 'Payment settled; beneficiary outreach required for voluntary return';
    actions.push(returnAction, outreachAction);
    stagedTypes.push('RETURN_REQUEST', 'BENEFICIARY_OUTREACH');
  }

  // ── Draft communications ───────────────────────────────────────────────
  const isPreSettlement = case_json.payment_status !== 'settled';
  const ref   = case_json.reference_id;
  const amt   = `AUD $${case_json.amount.toLocaleString()}`;
  const client = case_json.client ?? 'Valued Client';

  const client_update_draft = [
    'AUTO-GENERATED — REVIEW BEFORE SENDING',
    '',
    `Dear ${client},`,
    '',
    `We acknowledge your recall request for BECS transaction Ref ${ref} (${amt}).`,
    '',
    isPreSettlement
      ? `A Scheme Stop has been staged and is pending approval by your Relationship Manager. You will be notified of the outcome as soon as the action has been reviewed and authorised.`
      : `As the payment has already settled, a Return Request has been staged. We will contact the beneficiary to request voluntary return of funds. You will be kept informed of progress.`,
    '',
    'Regards,',
    'Bank Operations — Payment Recall Team',
  ].join('\n');

  const beneficiary_outreach_draft = isPreSettlement
    ? null
    : [
        'AUTO-GENERATED — REVIEW BEFORE SENDING',
        '',
        `Dear Beneficiary,`,
        '',
        `We are reaching out regarding a BECS credit of ${amt} (Ref: ${ref}) received in your account.`,
        `The originating party has advised this was sent in error and has requested its return.`,
        '',
        `Please contact us at your earliest convenience to arrange the voluntary return of these funds.`,
        '',
        'Regards,',
        'Bank Operations',
      ].join('\n');

  return {
    ...case_json,
    status: 'In Review',
    actions,
    comms: {
      ...case_json.comms,
      client_update_draft,
      beneficiary_outreach_draft,
      ...(isPreSettlement
        ? { beneficiary_outreach_not_applicable_reason: 'pre_settlement_intercept_only — scheme stop staged; beneficiary not yet reached' }
        : {}),
    },
    audit: {
      ...case_json.audit,
      actions_staged: stagedTypes,
    },
  };
}
