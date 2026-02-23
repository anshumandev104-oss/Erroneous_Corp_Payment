import * as fs from 'fs/promises';
import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');

const SEED_ENTRIES = [
  { speaker: 'Customer', text: 'Hi, I called because the payment was sent with the wrong amount.', startISO: 'PT1S' },
  { speaker: 'Agent',    text: 'Sure, I can open a recall case for you.',                          startISO: 'PT4S' },
  { speaker: 'Customer', text: 'Thank you, we need this corrected today.',                         startISO: 'PT7S' },
] as const;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Block path traversal
  if (!id || id.includes('..') || id.includes('/')) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  const casePath = path.join(DATA_CASES, `${id}.json`);

  let caseData: Record<string, unknown>;
  try {
    const raw = await fs.readFile(casePath, 'utf-8');
    caseData  = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const nowISO  = new Date().toISOString();
  const entries = [...SEED_ENTRIES];

  const speakers   = [...new Set(entries.map(e => e.speaker))];
  const previewRaw = entries
    .slice(0, 3)
    .map(e => `${e.speaker}: ${e.text}`)
    .join(' / ');
  const preview = previewRaw.length > 140 ? previewRaw.slice(0, 137) + '…' : previewRaw;

  // ── Append notes[] ──────────────────────────────────────────────────────────
  if (!Array.isArray(caseData.notes)) caseData.notes = [];
  (caseData.notes as unknown[]).push({
    type:       'VOICE TRANSCRIPT',
    created_at: nowISO,
    provider:   'seed',
    summary: {
      total_lines:       entries.length,
      speakers_detected: speakers,
    },
    transcript: entries,
  });

  // ── Append comms.comms_log[] ────────────────────────────────────────────────
  const comms = (typeof caseData.comms === 'object' && caseData.comms !== null
    ? caseData.comms : {}) as Record<string, unknown>;
  if (!Array.isArray(comms.comms_log)) comms.comms_log = [];
  (comms.comms_log as unknown[]).push({
    kind:      'voice_transcript',
    title:     'Voice Transcript Imported',
    timestamp: nowISO,
    preview,
  });
  caseData.comms = comms;

  // ── Append audit.audit_log[] ────────────────────────────────────────────────
  const audit = (typeof caseData.audit === 'object' && caseData.audit !== null
    ? caseData.audit : {}) as Record<string, unknown>;
  if (!Array.isArray(audit.audit_log)) audit.audit_log = [];
  (audit.audit_log as unknown[]).push({
    type:      'voice_transcript_seeded',
    timestamp: nowISO,
    provider:  'seed',
    count:     entries.length,
  });
  caseData.audit = audit;

  // ── Persist ─────────────────────────────────────────────────────────────────
  await fs.writeFile(casePath, JSON.stringify(caseData, null, 2), 'utf-8');
  return NextResponse.json({ ok: true });
}
