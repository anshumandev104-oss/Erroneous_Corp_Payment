import * as fs from 'fs/promises';
import * as path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');

// ── Normalized transcript entry ───────────────────────────────────────────────
interface NormalizedEntry {
  speaker:    string;
  text:       string;
  startISO?:  string;
  endISO?:    string;
  confidence?: number;
}

// ── Timestamp normalizer ──────────────────────────────────────────────────────
function normalizeTimestamp(val: unknown): string | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val === 'number')           return `PT${val}S`;
  if (typeof val === 'string') {
    if (!isNaN(Date.parse(val)))         return val;   // valid ISO wall-clock
    return undefined;                                  // malformed string → omit
  }
  return undefined;
}

// ── Genesys Cloud JSON parser ─────────────────────────────────────────────────
function parseGenesysJSON(body: unknown): {
  entries:         NormalizedEntry[];
  sentimentSummary?: Record<string, unknown>;
  topicCount?:     number;
} {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid JSON structure');
  }

  const root = body as Record<string, unknown>;

  if (!Array.isArray(root.transcripts) || root.transcripts.length === 0) {
    throw new Error('JSON has no transcripts array');
  }

  const entries: NormalizedEntry[]       = [];
  let sentimentSummary: Record<string, unknown> | undefined;
  let topicCount: number | undefined;

  for (const transcript of root.transcripts as unknown[]) {
    if (!transcript || typeof transcript !== 'object') continue;
    const t = transcript as Record<string, unknown>;

    if (!Array.isArray(t.phrases) || t.phrases.length === 0) {
      throw new Error('Transcript has no phrases');
    }

    for (const phrase of t.phrases as unknown[]) {
      if (!phrase || typeof phrase !== 'object') continue;
      const p = phrase as Record<string, unknown>;

      const purpose = String(p.participantPurpose ?? 'external');
      const speaker = purpose === 'internal' ? 'Agent' : 'Customer';
      const text    = String(p.text ?? '').trim();
      if (!text) continue;

      entries.push({
        speaker,
        text,
        startISO:   normalizeTimestamp(p.startTime),
        endISO:     normalizeTimestamp(p.endTime),
        confidence: typeof p.confidence === 'number' ? p.confidence : undefined,
      });
    }

    // Capture the first sentiment / accumulate topic counts
    if (t.sentiment && typeof t.sentiment === 'object' && !sentimentSummary) {
      sentimentSummary = t.sentiment as Record<string, unknown>;
    }
    if (Array.isArray(t.topics)) {
      topicCount = (topicCount ?? 0) + (t.topics as unknown[]).length;
    }
  }

  if (entries.length === 0) {
    throw new Error('No phrases found in transcript');
  }

  return { entries, sentimentSummary, topicCount };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Block path traversal
  if (!id || id.includes('..') || id.includes('/')) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }

  const casePath = path.join(DATA_CASES, `${id}.json`);

  // Load case — raw Record so we can freely extend it
  let caseData: Record<string, unknown>;
  try {
    const raw = await fs.readFile(casePath, 'utf-8');
    caseData  = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const nowISO = new Date().toISOString();
  let entries: NormalizedEntry[];
  let provider: 'genesys-json' | 'manual-text';
  let sentimentSummary: Record<string, unknown> | undefined;
  let topicCount: number | undefined;

  const contentType = req.headers.get('content-type') ?? '';

  // ── Branch: multipart (file upload) ────────────────────────────────────────
  if (contentType.includes('multipart/form-data')) {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 });
    }

    const uploaded = formData.get('file');
    if (!uploaded || typeof uploaded === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let parsed: unknown;
    try {
      const raw = await (uploaded as File).text();
      parsed    = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'File is not valid JSON' }, { status: 400 });
    }

    try {
      ({ entries, sentimentSummary, topicCount } = parseGenesysJSON(parsed));
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }

    provider = 'genesys-json';

  // ── Branch: JSON body { text } ──────────────────────────────────────────────
  } else {
    let body: Record<string, unknown>;
    try {
      body = await req.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const rawText = typeof body.text === 'string' ? body.text.trim() : '';
    if (!rawText) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    entries = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => ({ speaker: 'Unknown', text: line }));

    provider = 'manual-text';
  }

  // ── Build shared metadata ───────────────────────────────────────────────────
  const speakers = [...new Set(entries.map(e => e.speaker))];
  const previewRaw = entries
    .slice(0, 3)
    .map(e => `${e.speaker}: ${e.text}`)
    .join(' / ');
  const preview = previewRaw.length > 140
    ? previewRaw.slice(0, 137) + '…'
    : previewRaw;

  // ── Append notes[] ──────────────────────────────────────────────────────────
  if (!Array.isArray(caseData.notes)) caseData.notes = [];
  (caseData.notes as unknown[]).push({
    type:       'VOICE TRANSCRIPT',
    created_at: nowISO,
    provider,
    summary: {
      total_lines:       entries.length,
      speakers_detected: speakers,
      sentiment_summary: sentimentSummary,
      topic_count:       topicCount,
    },
    transcript: entries,
  });

  // ── Append comms.comms_log[] ────────────────────────────────────────────────
  const comms = (typeof caseData.comms === 'object' && caseData.comms !== null
    ? caseData.comms
    : {}) as Record<string, unknown>;
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
    ? caseData.audit
    : {}) as Record<string, unknown>;
  if (!Array.isArray(audit.audit_log)) audit.audit_log = [];
  (audit.audit_log as unknown[]).push({
    type:      'voice_transcript_imported',
    timestamp: nowISO,
    provider,
    count:     entries.length,
  });
  caseData.audit = audit;

  // ── Persist ─────────────────────────────────────────────────────────────────
  await fs.writeFile(casePath, JSON.stringify(caseData, null, 2), 'utf-8');
  return NextResponse.json({ ok: true });
}
