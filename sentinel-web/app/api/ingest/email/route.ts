import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generateSafeFileName } from '@/lib/utils';

const INBOUND_DIR = path.join(process.cwd(), '..', 'inbound_emails');
const MAX_BYTES   = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    await fs.mkdir(INBOUND_DIR, { recursive: true });

    const contentType = req.headers.get('content-type') ?? '';
    let savedPath: string;

    if (contentType.includes('multipart/form-data')) {
      // ── File upload ──────────────────────────────────────────────────────
      const formData = await req.formData();
      const file = formData.get('email');

      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'No email file provided' }, { status: 400 });
      }

      const buffer = Buffer.from(await (file as File).arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) {
        return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
      }

      const ts       = Date.now();
      const safeName = generateSafeFileName((file as File).name || 'upload.eml');
      savedPath      = path.join(INBOUND_DIR, `${ts}-${safeName}`);
      await fs.writeFile(savedPath, buffer);

    } else {
      // ── Paste / raw_text ─────────────────────────────────────────────────
      const body = await req.json() as { raw_text?: string };
      if (!body.raw_text?.trim()) {
        return NextResponse.json({ error: 'No email content provided' }, { status: 400 });
      }
      if (Buffer.byteLength(body.raw_text, 'utf-8') > MAX_BYTES) {
        return NextResponse.json({ error: 'Content too large (max 5 MB)' }, { status: 413 });
      }

      savedPath = path.join(INBOUND_DIR, `${Date.now()}.txt`);
      await fs.writeFile(savedPath, body.raw_text, 'utf-8');
    }

    // ── Pipeline: triage → case (stageActions runs inside /api/case) ─────
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
    const caseData = await caseRes.json() as { case_json?: { case_id: string }; error?: string };
    if (!caseRes.ok || !caseData.case_json) {
      return NextResponse.json(
        { error: 'Pipeline error', details: caseData.error ?? 'Case assembly failed' },
        { status: 500 },
      );
    }

    return NextResponse.json({ case_id: caseData.case_json.case_id });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: 'Pipeline error', details: message }, { status: 500 });
  }
}
