name: Assemble Recall Case
description: >
  Take a triage_json and a payment status lookup to build a canonical case object  (fields, SLA seeds, audit), ready for queueing and action staging.

allowed_tools:
  - read
  - grep

inputs:
  - triage_json: JSON from Triage Email
  - ledger_record:
      reference_id: string
      status: "submitted"|"pre_settlement"|"settled"
      value_date: ISO
      amount_posted: number
      currency: "AUD"
      channel: "BECS"
      created_at: ISO

process:
  - Validate triage_json minimums (intent=recall, reference_id present).
  - Merge ledger_record and triage_json; prefer verified ledger status for payment_status.
  - Derive:
      payment_status := ledger_record.status
      urgency := triage_json.urgency
      confidence := triage_json.confidence
  - Construct case object (see OUTPUT SHAPE). Populate `audit` with triage features.

outputs:
  - case_json:
      case_id: "auto"
      detected_at: ISO
      reference_id: string
      client: string|null
      amount: number
      currency: "AUD"
      channel: "BECS"
      payment_status: "submitted"|"pre_settlement"|"settled"
      urgency: "critical"|"high"|"medium"|"low"
      confidence: float
      triage_notes: string|null
      sla:
        triage_due: ISO
        cutoff_due: ISO
      actions: []   # empty here; filled by scheme-stop-or-alternative
      comms:
        client_update_draft: string|null
        beneficiary_outreach_draft: string|null
      audit:
        source_email: string
        triage_timestamp: ISO
        model_confidence: float
        fields_extracted: [string]
        actions_staged: []

verification:
  - Hand `case_json` to subagent `qa` to assert required fields and invariant "no action is executed".
  - If fail, fix fields and re-run QA.

failure_handling:
  - If triage intent is unknown or reference missing, return an error object    with `open_questions` prompting RM clarification.