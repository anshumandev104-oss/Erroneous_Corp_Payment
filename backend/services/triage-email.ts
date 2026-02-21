import type { ParsedEmail } from '../../adapters/email/parse-eml';
import type { TriageJson, TriageUrgency, TriageIntent } from '../types/triage';

// ── Calibration thresholds (from skill.md) ────────────────────────────────
const CONFIDENCE_LIGHT = 0.75;
const CONFIDENCE_AUTO  = 0.90;

const CRITICAL_KEYWORDS = [
  'urgent', 'immediate', 'asap', 'intercept', 'stop before settlement',
  'stop now', 'before settlement', 'time-sensitive',
];
const RECALL_KEYWORDS = [
  'recall', 'intercept', 'stop', 'return', 'reverse', 'cancel payment',
  'cancel transaction', 'incorrect', 'wrong amount', 'wrong decimal',
  'extra zero', 'overpayment',
];
const MEDIUM_KEYWORDS = ['please recall', 'please stop', 'wrong amount', 'recall requested'];

// Regex to extract BECS-style reference IDs (e.g. XYZ123, ABC456, KLY654)
const REF_REGEX = /\b([A-Z]{2,4}\d{3,6})\b/g;
// Regex to extract monetary amounts — handles "500,000" and "$48,250" etc.
const AMOUNT_REGEX = /(?:AUD\s*)?\$?([\d]{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d{4,}(?:\.\d{1,2})?)/g;

function normalizeAmount(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

function detectLanguage(text: string): 'en' | 'other' {
  const nonAsciiRatio = (text.match(/[^\x00-\x7F]/g) ?? []).length / Math.max(text.length, 1);
  // Only flag unambiguously non-English words; common English banking terms
  // (settlement, del) are intentionally excluded to avoid false positives.
  const spanishHints = /\b(solicitud|transferencia|detener|monto)\b/i.test(text);
  if (spanishHints || nonAsciiRatio > 0.1) return 'other';
  return 'en';
}

export function triageEmail(parsed: ParsedEmail, now_iso?: string): TriageJson {
  const now = now_iso ? new Date(now_iso).toISOString() : new Date().toISOString();
  const fullText = `${parsed.subject} ${parsed.body}`.toLowerCase();
  const rawText  = `${parsed.subject} ${parsed.body}`;
  const features_used: string[] = [];
  const ambiguity_notes_parts: string[] = [];

  // ── Language check ────────────────────────────────────────────────────
  if (detectLanguage(rawText) === 'other') {
    return {
      reference_id: null,
      intent: 'unknown',
      urgency: 'low',
      confidence: 0.2,
      extracted: {
        amount_reported: null,
        amount_intended_hint: null,
        currency: 'AUD',
        sent_time: null,
        reason: null,
        rm_name: null,
        sender_org: null,
        channel: 'BECS',
      },
      audit: {
        source_email: `${parsed.from} → ${parsed.to}`,
        triage_timestamp: now,
        features_used: ['language_detection'],
        ambiguity_notes: 'Email appears to be in a non-English language. Manual review required.',
      },
      open_questions: ['Please re-send this request in English or contact your Relationship Manager directly.'],
    };
  }

  // ── Recall intent detection ───────────────────────────────────────────
  const hasRecallIntent = RECALL_KEYWORDS.some(kw => fullText.includes(kw));
  if (!hasRecallIntent) {
    return {
      reference_id: null,
      intent: 'unknown',
      urgency: 'low',
      confidence: 0.2,
      extracted: {
        amount_reported: null, amount_intended_hint: null,
        currency: 'AUD', sent_time: null, reason: null,
        rm_name: null, sender_org: null, channel: 'BECS',
      },
      audit: {
        source_email: `${parsed.from} → ${parsed.to}`,
        triage_timestamp: now,
        features_used: ['recall_intent_check'],
        ambiguity_notes: 'No recall intent detected.',
      },
      open_questions: ['Please clarify if this is a payment recall request.'],
    };
  }
  features_used.push('recall_intent');

  // ── Reference ID extraction ───────────────────────────────────────────
  const refMatches = [...rawText.matchAll(REF_REGEX)].map(m => m[1]);
  const uniqueRefs = [...new Set(refMatches)];
  let reference_id: string | null = null;

  if (uniqueRefs.length === 1) {
    reference_id = uniqueRefs[0];
    features_used.push('reference_id');
  } else if (uniqueRefs.length > 1) {
    // Multi-ref: flag ambiguity, try to pick the one marked as incorrect
    ambiguity_notes_parts.push(`Multiple references detected: ${uniqueRefs.join(', ')}`);
    // Heuristic: look for "only X is wrong" or "X is incorrect"
    const wrongMatch = rawText.match(new RegExp(`(${uniqueRefs.join('|')})\\s+(?:is wrong|is incorrect|has wrong)`,'i'));
    reference_id = wrongMatch ? wrongMatch[1] : null;
    if (!reference_id) {
      ambiguity_notes_parts.push('Unable to determine which reference is incorrect. Human review required.');
    } else {
      features_used.push('reference_id_disambiguated');
    }
  } else {
    ambiguity_notes_parts.push('No reference ID found in email.');
  }

  // ── Amount extraction ─────────────────────────────────────────────────
  const amountMatches = [...rawText.matchAll(AMOUNT_REGEX)]
    .map(m => normalizeAmount(m[1]))
    .filter(n => !isNaN(n) && n > 0);

  let amount_reported: number | null = null;
  let amount_intended_hint: number | null = null;

  if (amountMatches.length >= 2) {
    // "sent X instead of Y" — larger is the erroneous amount
    const sorted = [...amountMatches].sort((a, b) => b - a);
    amount_reported     = sorted[0];
    amount_intended_hint = sorted[1];
    features_used.push('amount_pair');
  } else if (amountMatches.length === 1) {
    amount_reported = amountMatches[0];
    features_used.push('amount_single');
  }

  // ── Reason extraction ─────────────────────────────────────────────────
  let reason: string | null = null;
  if (/wrong decimal|decimal place/.test(fullText))  reason = 'wrong_decimal_place';
  else if (/extra zero|additional zero/.test(fullText)) reason = 'extra_zero';
  else if (/incorrect amount|wrong amount/.test(fullText)) reason = 'incorrect_amount';
  else if (/incorrect|wrong|error/.test(fullText))   reason = 'incorrect_amount';
  if (reason) features_used.push('reason');

  // ── RM name extraction ────────────────────────────────────────────────
  let rm_name: string | null = null;
  const ccHeader = parsed.cc;
  if (ccHeader) {
    const nameMatch = ccHeader.match(/^([^<@,]+?)(?:\s*<|@)/);
    if (nameMatch) rm_name = nameMatch[1].trim();
  }
  if (!rm_name) {
    const rmBodyMatch = rawText.match(/\b(?:RM|Relationship Manager)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/);
    if (rmBodyMatch) rm_name = rmBodyMatch[1];
  }
  if (rm_name) features_used.push('rm_name');

  // ── Sender org ───────────────────────────────────────────────────────
  const senderOrg = (() => {
    const sig = parsed.body.trim().split('\n').slice(-3).join(' ');
    const orgMatch = sig.match(/([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+){0,3})\s*$/);
    if (orgMatch) return orgMatch[1];
    const domainMatch = parsed.from.match(/@([^.]+)\./);
    return domainMatch ? domainMatch[1] : null;
  })();
  if (senderOrg) features_used.push('sender_org');

  // ── Sent time extraction ─────────────────────────────────────────────
  let sent_time: string | null = null;
  const timeMatch = rawText.match(/\b(?:sent|submitted|at)\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)/i);
  if (timeMatch) {
    sent_time = timeMatch[1];
    features_used.push('sent_time');
  }

  // ── Urgency classification ────────────────────────────────────────────
  const isCritical = CRITICAL_KEYWORDS.some(kw => fullText.includes(kw));
  const isMedium   = MEDIUM_KEYWORDS.some(kw => fullText.includes(kw));
  let urgency: TriageUrgency = 'low';
  if (isCritical) { urgency = 'critical'; features_used.push('urgency_critical'); }
  else if (hasRecallIntent) { urgency = isMedium ? 'medium' : 'high'; }

  // ── Confidence scoring ────────────────────────────────────────────────
  let confidence = 0;
  if (reference_id)          confidence += 0.25;
  if (amount_reported)       confidence += 0.20;
  if (hasRecallIntent)       confidence += 0.20;
  if (isCritical || urgency !== 'low') confidence += 0.15;
  if (fullText.includes('becs')) { confidence += 0.10; features_used.push('channel_hint'); }
  if (sent_time)             confidence += 0.10;

  // Cap at 1.0
  confidence = Math.min(1, Math.round(confidence * 100) / 100);

  // If no reference_id and low confidence, emit unknown with question
  if (!reference_id && confidence < CONFIDENCE_LIGHT) {
    ambiguity_notes_parts.push('No clear reference ID — confidence too low to proceed.');
  }

  const intent: TriageIntent = confidence >= 0.40 && hasRecallIntent ? 'recall' : 'unknown';
  const open_questions: string[] = [];
  if (!reference_id) open_questions.push('Please provide the payment reference ID for the transaction to recall.');
  if (!amount_reported) open_questions.push('Please confirm the amount that was sent and the intended amount.');

  return {
    reference_id,
    intent,
    urgency,
    confidence,
    extracted: {
      amount_reported,
      amount_intended_hint,
      currency: 'AUD',
      sent_time,
      reason,
      rm_name,
      sender_org: senderOrg,
      channel: 'BECS',
    },
    audit: {
      source_email: `${parsed.from} → ${parsed.to}`,
      triage_timestamp: now,
      features_used,
      ambiguity_notes: ambiguity_notes_parts.length ? ambiguity_notes_parts.join(' | ') : null,
    },
    ...(open_questions.length ? { open_questions } : {}),
  };
}

export { CONFIDENCE_LIGHT, CONFIDENCE_AUTO };
