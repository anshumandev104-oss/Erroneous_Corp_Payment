name: Scheme Stop or Alternative
description: >
  Given a case, stage the appropriate recall action(s) depending on payment_status.
  NEVER execute. All actions require HITL approval, and >$25k requires a second approver.

allowed_tools:
  - read

env:
  - THRESHOLD_SECOND_APPROVER  # default 25000

inputs:
  - case_json

process:
  - If payment_status in ("submitted", "pre_settlement"):
      add staged action:
        type: "SCHEME_STOP"
        status: "staged"
        requires_approval: true
        requires_second_approver: case_json.amount > THRESHOLD_SECOND_APPROVER
        justification: "Recall intent detected; pre-settlement intercept"
  - Else (settled):
      add staged actions:
        1) type: "RETURN_REQUEST", status: "staged", requires_approval: true
        2) type: "BENEFICIARY_OUTREACH", status: "staged", requires_approval: true
      and add "outcome_probabilities" note based on timing/amount (estimate)
  - Draft comms templates (client update; optional beneficiary outreach draft)
    clearly marked as **AUTO-GENERATED**.

outputs:
  - updated_case_json (actions[] populated; comms drafts present)

verification:
  - Use subagent `qa` to ensure actions are "staged" only and approval flags are set properly.
  - Use subagent `reviewer` for minimal diffs to wording templates if needed.

failure_handling:
  - If case_json missing payment_status or amount, return failure with suggestions.