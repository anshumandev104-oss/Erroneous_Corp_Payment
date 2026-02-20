# Workflow Rules — Recall Triage & Case Assembly

## HITL Enforcement (Core)
- ALL final actions must be staged only. Execution is ALWAYS done by a human.  
- Staged actions require approver metadata:
    - `approver_id`
    - `approver_role`
    - `timestamp`
    - `justification`  
- Transactions > $25k require secondary approval (role: Senior Manager+).  
- AI confidence (Light/Moderate/Severe) changes **review burden**, never authorization level.

## Case Assembly Pipeline1. 
1. **Triage Email**
   - Detect recall intent, urgency, and entities (`ref`, `amount`, `time`, `reason`, `sender`, `RM`).
   - Assign confidence score.   - If ambiguous: ask clarifying question before proceeding.

2. **Classify Urgency**
   - Critical → delivery within 2 minutes to queue.
   - High/Medium → deterministic queueing.
   - Never suppress urgency indicators.

3. **Case Creation**
   - Build a structured case object with SLA timers.
   - Compute `cutoff_due` based on provided settlement window.

4. **Staged Action Preparation**
   - Pre‑settlement → Stage Scheme Stop.
   - Post‑settlement → Stage Return Request + Beneficiary Outreach templates.
   - All action packets MUST be staged, never executed.

5. **Communication Drafts**
   - Draft internal + client communications.
   - Mark drafts clearly as “auto‑generated” until approved.

6. **Audit Rules** 
  - Every model output must include a short audit block:
     - `source_email` (sanitized)
     - `triage_timestamp`
     - `model_confidence`
     - `fields_extracted`
     - `actions_staged`