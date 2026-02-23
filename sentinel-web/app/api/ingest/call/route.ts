import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { hashBuffer } from '@/lib/utils';

const INBOUND_DIR = path.join(process.cwd(), '..', 'inbound_emails');
const DATA_INGEST  = path.join(process.cwd(), '..', 'data', 'ingest');
const INDEX_FILE   = path.join(DATA_INGEST, 'index.json');
const DATA_AUDIT   = path.join(process.cwd(), '..', 'data', 'audit', 'log.json');
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB

interface IngestRecord {
  hash:         string;
  case_id:      string;
  reference_id: string | null;
  created_at:   string;
  email_path:   string;
}

interface IngestIndex {
  items: IngestRecord[];
}

async function readIndex(): Promise<IngestRecord[]> {
  try {
    const raw = await fs.readFile(INDEX_FILE, 'utf-8');
    return (JSON.parse(raw) as IngestIndex).items ?? [];
  } catch {
    return [];
  }
}

async function writeIndex(items: IngestRecord[]): Promise<void> {
  await fs.mkdir(DATA_INGEST, { recursive: true });
  await fs.writeFile(INDEX_FILE, JSON.stringify({ items }, null, 2));
}

async function appendAudit(entry: object): Promise<void> {
  let log: object[] = [];
  try {
    const raw = await fs.readFile(DATA_AUDIT, 'utf-8');
    log = JSON.parse(raw) as object[];
  } catch { /* first run — start fresh */ }
  log.push(entry);
  await fs.mkdir(path.dirname(DATA_AUDIT), { recursive: true });
  await fs.writeFile(DATA_AUDIT, JSON.stringify(log, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    await fs.mkdir(INBOUND_DIR, { recursive: true });

    const body = await req.json() as { raw_text?: string; source?: string };
    if (!body.raw_text?.trim()) {
      return NextResponse.json({ error: 'No transcript content provided' }, { status: 400 });
    }

    const buffer = Buffer.from(body.raw_text, 'utf-8');
    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: 'Content too large (max 5 MB)' }, { status: 413 });
    }

    // ── Deduplication (24 h window) ────────────────────────────────────────
    const hash    = await hashBuffer(buffer);
    const index   = await readIndex();
    const cutoff  = Date.now() - 24 * 60 * 60 * 1000;
    const existing = index.find(
      r => r.hash === hash && new Date(r.created_at).getTime() > cutoff,
    );
    if (existing) {
      return NextResponse.json({
        case_id:      existing.case_id,
        reference_id: existing.reference_id,
        deduplicated: true,
      });
    }

    // ── Save transcript as .txt so triage pipeline can parse it ───────────
    const ts        = Date.now();
    const savedPath = path.join(INBOUND_DIR, `${ts}-call.txt`);
    await fs.writeFile(savedPath, buffer);

    // ── Pipeline: triage → case ────────────────────────────────────────────
    const base = req.nextUrl.origin;

    const triageRes  = await fetch(`${base}/api/triage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email_path: savedPath }),
    });
    const triageData = await triageRes.json() as { triage_json?: unknown; error?: string };
    if (!triageRes.ok || !triageData.triage_json) {
      return NextResponse.json(
        { error: 'Pipeline error', details: triageData.error ?? 'Triage failed' },
        { status: 500 },
      );
    }

    const caseRes  = await fetch(`${base}/api/case`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ triage_json: triageData.triage_json }),
    });
    const caseData = await caseRes.json() as {
      case_json?: { case_id: string; reference_id: string };
      error?: string;
    };
    if (!caseRes.ok || !caseData.case_json) {
      return NextResponse.json(
        { error: 'Pipeline error', details: caseData.error ?? 'Case assembly failed' },
        { status: 500 },
      );
    }

    const { case_id, reference_id } = caseData.case_json;

    // ── Stage actions (idempotent re-stage guard in route) ─────────────────
    await fetch(`${base}/api/actions/stage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ case_id }),
    });

    // ── Audit write-through ────────────────────────────────────────────────
    await appendAudit({
      timestampISO: new Date().toISOString(),
      user:         'System Ingest',
      action:       'Case Created',
      details:      'Created from call transcript ingest',
      case_ref:     reference_id,
      case_id,
      outcome:      'Success',
    });

    // ── Update dedup index ─────────────────────────────────────────────────
    index.push({ hash, case_id, reference_id, created_at: new Date().toISOString(), email_path: savedPath });
    await writeIndex(index);

    return NextResponse.json({ case_id, reference_id });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: 'Pipeline error', details: message }, { status: 500 });
  }
}
