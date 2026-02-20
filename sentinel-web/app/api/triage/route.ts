import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parseEml } from '@adapters/email/parse-eml';
import { triageEmail } from '@backend/services/triage-email';

const DATA_TRIAGE = path.join(process.cwd(), '..', 'data', 'triage');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email_path?: string };
    const email_path = body.email_path;

    if (!email_path || typeof email_path !== 'string') {
      return NextResponse.json({ error: 'email_path is required' }, { status: 400 });
    }

    // Security: block path traversal attempts
    const resolved = path.resolve(email_path);
    const projectRoot = path.resolve(process.cwd(), '..');
    if (!resolved.startsWith(projectRoot)) {
      return NextResponse.json({ error: 'Invalid email_path' }, { status: 400 });
    }

    const parsed = await parseEml(resolved);
    const triage_json = triageEmail(parsed, new Date().toISOString());

    // Persist to data/triage/
    const fileName = `${triage_json.reference_id ?? `unknown-${Date.now()}`}.json`;
    await fs.mkdir(DATA_TRIAGE, { recursive: true });
    await fs.writeFile(
      path.join(DATA_TRIAGE, fileName),
      JSON.stringify(triage_json, null, 2),
    );

    return NextResponse.json({ triage_json });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
