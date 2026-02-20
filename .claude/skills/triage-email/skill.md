name: Triage Email
description: >
  Parse inbound recall-related emails (EML or raw text), detect recall intent,
  extract key fields (reference, amounts, time, reason, sender/RM), classify
  urgency, and compute a calibrated confidence score. Emit a normalized triage object.

allowed_tools:
  - read
  - grep
  - glob

inputs:
  - email_path: path to .eml or .txt file under samples/emails
  - now_iso: ISO timestamp "now" (optional; default = current)
  - calibration:
      thresholds:
        light: 0.75
        auto: 0.90
      urgency_keywords:
        critical: ["urgent", "immediate", "asap", "intercept", "stop before settlement"]
        medium:   ["please recall", "please stop", "wrong amount"]
  - constraints:
      locale: "en-AU"   # affects date parsing and currency
      channel_hint: "BECS" # used when email lacks channel

process:
  - Step 1: Load email file (EML or TXT). If EML, parse headers, From, To/Cc, Subject, and text body.
  - Step 2: Detect recall intent and urgency (keyword+pattern + header cues).
  - Step 3: Extract entities with patterns:
      - reference_id (alnum, e.g., XYZ123)
      - amount(s) and currency (AUD)
      - timestamps (send time, mentioned times)
      - reason (e.g., "incorrect amount", "extra zero", "wrong decimal")
      - rm_name (from CC or body mentions)
  - Step 4: Resolve ambiguity:
      - If multiple references, pick the one also present in today’s ledger (if provided later) or ask for clarification.
      - If amounts conflict, prefer the pair (actual vs intended) when present.
  - Step 5: Compute confidence in [0,1] using observed features (explicit ref, explicit time, explicit request verb, urgency terms, matching channel).
  - Step 6: Decide urgency bucket (Critical/High/Medium/Low) using calibration. Never reduce urgency if terms indicate escalation.
  - Step 7: Produce triage JSON and write it to `./data/triage/{reference_id or hash}.json` (if write is allowed; otherwise return JSON directly).

outputs:
  - triage_json:
      reference_id: string|null
      intent: "recall" | "unknown"
      urgency: "critical"|"high"|"medium"|"low"
      confidence: float
      extracted:
        amount_reported: number|null
        amount_intended_hint: number|null
        currency: "AUD"
        sent_time: ISO|null
        reason: string|null
        rm_name: string|null
        sender_org: string|null
        channel: "BECS"
      audit:
        source_email: redacted-string
        triage_timestamp: ISO
        features_used: [string]
        ambiguity_notes: string|null

verification:
  - Use subagent `reviewer` to check clarity and missing fields; request minimal diffs if needed.
  - Use subagent `qa` when composed into the case object downstream.

failure_handling:
  - If no recall intent, return intent=unknown, confidence<0.5, and a clarifying question.

example_invocation:
  - "Run Triage Email on samples/emails/01-urgent-ref-xyz123.eml with default calibration and locale."