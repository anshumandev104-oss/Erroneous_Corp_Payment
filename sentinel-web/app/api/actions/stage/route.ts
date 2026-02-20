import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { stageActions } from '@backend/services/stage-actions';
import type { CaseJson } from '@backend/types/case';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { case_id?: string };
    const { case_id } = body;

    if (!case_id || typeof case_id !== 'string') {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 });
    }

    const casePath = path.join(DATA_CASES, `${case_id}.json`);
    let case_json: CaseJson;
    try {
      const raw = await fs.readFile(casePath, 'utf-8');
      case_json = JSON.parse(raw) as CaseJson;
    } catch {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Idempotent — skip if already staged
    if (case_json.actions.length > 0) {
      return NextResponse.json({ case_json, note: 'Actions already staged' });
    }

    const updated = stageActions(case_json);
    await fs.writeFile(casePath, JSON.stringify(updated, null, 2));
    return NextResponse.json({ case_json: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
