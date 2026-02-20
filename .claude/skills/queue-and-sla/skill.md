name: Queue and SLA
description: >
  Route a case to the "To-Be-Resolved" queue, compute SLA timers (triage_due in 2 minutes,
  cutoff_due from settlement window), and emit a queue record for dashboards.

allowed_tools:
  - read

inputs:
  - case_json
  - settlement_window:
      hard_settlement_iso: ISO   # required for cutoff_due derivation
  - triage_sla_minutes: 2

process:
  - Ensure case_json.sla exists; set:
      triage_due := now + triage_sla_minutes
      cutoff_due := settlement_window.hard_settlement_iso
  - Attach queue metadata:
      queue: "To-Be-Resolved"
      priority: derive by (cutoff_due - now)
  - Return updated case_json + a lightweight `queue_record` used by UI tables.

outputs:
  - updated_case_json
  - queue_record:
      reference_id
      amount
      urgency
      priority_score
      received_at
      status: "In Review"|"Pending"|"Triaged"

verification:
  - Use subagent `qa` to re-assert "queue must be To-Be-Resolved" and SLA fields present.