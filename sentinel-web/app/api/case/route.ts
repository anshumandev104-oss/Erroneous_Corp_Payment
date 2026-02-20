import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { lookupLedger } from '@adapters/ledger/mock-ledger';
import { getSettlementWindow } from '@adapters/settlement/static-window';
import { buildCase } from '@backend/services/build-case';
import { buildQueue } from '@backend/services/build-queue';
import { stageActions } from '@backend/services/stage-actions';
import type { TriageJson } from '@backend/types/triage';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');
const DATA_QUEUE = path.join(process.cwd(), '..', 'data', 'queue', 'queue.json');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { triage_json?: TriageJson };
    const triage_json = body.triage_json;

    if (!triage_json) {
      return NextResponse.json({ error: 'triage_json is required' }, { status: 400 });
    }
    if (triage_json.intent !== 'recall' || !triage_json.reference_id) {
      return NextResponse.json({
        error: 'Cannot assemble case: recall intent not confirmed or reference_id missing.',
        open_questions: triage_json.open_questions ?? [],
      }, { status: 422 });
    }

    const ledger = lookupLedger(triage_json.reference_id);
    if (!ledger) {
      return NextResponse.json({
        error: `No ledger record found for reference ${triage_json.reference_id}.`,
      }, { status: 422 });
    }

    const settlement = getSettlementWindow(triage_json.reference_id);
    const raw_case = buildCase(triage_json, ledger, settlement);
    const { updated_case_json: queued_case, queue_record } = buildQueue(raw_case, settlement);
    const case_json = stageActions(queued_case);

    // Persist case
    await fs.mkdir(DATA_CASES, { recursive: true });
    await fs.writeFile(
      path.join(DATA_CASES, `${case_json.case_id}.json`),
      JSON.stringify(case_json, null, 2),
    );

    // Append to queue.json
    let queue: unknown[] = [];
    try {
      const raw = await fs.readFile(DATA_QUEUE, 'utf-8');
      queue = JSON.parse(raw) as unknown[];
    } catch { /* first run */ }
    queue.push(queue_record);
    await fs.writeFile(DATA_QUEUE, JSON.stringify(queue, null, 2));

    return NextResponse.json({ case_json, queue_record });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const raw = await fs.readFile(DATA_QUEUE, 'utf-8');
    const queue = JSON.parse(raw);
    return NextResponse.json({ queue });
  } catch {
    return NextResponse.json({ queue: [] });
  }
}
