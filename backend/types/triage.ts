export type TriageIntent = 'recall' | 'unknown';
export type TriageUrgency = 'critical' | 'high' | 'medium' | 'low';

export interface TriageExtracted {
  amount_reported: number | null;
  amount_intended_hint: number | null;
  currency: 'AUD';
  sent_time: string | null;       // ISO or raw time string from email
  reason: string | null;
  rm_name: string | null;
  sender_org: string | null;
  channel: 'BECS';
}

export interface TriageAudit {
  source_email: string;           // sanitized — no PII beyond org domain
  triage_timestamp: string;       // ISO
  features_used: string[];
  ambiguity_notes: string | null;
}

export interface TriageJson {
  reference_id: string | null;
  intent: TriageIntent;
  urgency: TriageUrgency;
  confidence: number;             // 0–1
  extracted: TriageExtracted;
  audit: TriageAudit;
  open_questions?: string[];      // populated when intent === 'unknown' or confidence < 0.5
}
