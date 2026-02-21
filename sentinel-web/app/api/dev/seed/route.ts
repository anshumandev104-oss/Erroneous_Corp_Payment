/**
 * DEV-ONLY seed endpoint.
 * POST /api/dev/seed
 *
 * Runs the full triage → assemble → queue → stage pipeline for three
 * sample emails (01 XYZ123, 02 ABC456, 03 KLY654) and persists:
 *   data/cases/{case_id}.json    — one file per case
 *   data/queue/queue.json        — full queue replaced with seed rows
 *
 * Returns the case_id of the high-value case (XYZ123, $500k) so the
 * caller can navigate straight to /case/{id} for the HITL demo.
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { orchestratePipeline, isPipelineError } from '@backend/services/orchestrate-pipeline';
import type { QueueRecord } from '@backend/types/case';

// next build sets cwd to sentinel-web/; the samples dir is one level up
const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const DATA_CASES   = path.join(PROJECT_ROOT, 'data', 'cases');
const DATA_QUEUE   = path.join(PROJECT_ROOT, 'data', 'queue', 'queue.json');

const SEED_FILES = [
  '01-urgent-ref-xyz123.eml',    // XYZ123 — $500k critical, pre-settlement  → SCHEME_STOP + 2nd approver
  '02-intercept-alt-terms.eml',  // ABC456 — $2,100 high,   pre-settlement  → SCHEME_STOP
  '03-attachment-mention.eml',   // KLY654 — $3,210 medium, settled         → RETURN_REQUEST + OUTREACH
];

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint disabled in production.' }, { status: 403 });
  }

  await fs.mkdir(DATA_CASES, { recursive: true });
  await fs.mkdir(path.dirname(DATA_QUEUE), { recursive: true });

  const now_iso    = new Date().toISOString();
  const queue: QueueRecord[] = [];
  const report: Record<string, unknown> = {};
  let   hitl_case_id: string | null = null;
  let   hitl_url: string | null     = null;

  for (const filename of SEED_FILES) {
    // Pass absolute path so getEmailPath never needs __dirname resolution
    const abs_path = path.join(PROJECT_ROOT, 'samples', 'emails', filename);

    const result = await orchestratePipeline(abs_path, now_iso);

    if (isPipelineError(result)) {
      report[filename] = { ok: false, error: result.error, open_questions: result.open_questions ?? [] };
      continue;
    }

    const { case_json, queue_record } = result;

    // Persist case file
    await fs.writeFile(
      path.join(DATA_CASES, `${case_json.case_id}.json`),
      JSON.stringify(case_json, null, 2),
    );
    queue.push(queue_record);

    const needsSecond = case_json.actions.some(a => a.requires_second_approver);

    report[filename] = {
      ok:                      true,
      case_id:                 case_json.case_id,
      reference_id:            case_json.reference_id,
      amount:                  case_json.amount,
      urgency:                 case_json.urgency,
      payment_status:          case_json.payment_status,
      actions_staged:          case_json.actions.map(a => a.type),
      requires_second_approver: needsSecond,
    };

    // Pick the highest-value case for the HITL demo URL
    if (!hitl_case_id || case_json.amount > (report[hitl_case_id!] as { amount: number } | undefined)?.amount!) {
      if (needsSecond) {
        hitl_case_id = case_json.case_id;
        hitl_url     = `/case/${case_json.case_id}`;
      }
    }
  }

  // Replace queue.json wholesale
  await fs.writeFile(DATA_QUEUE, JSON.stringify(queue, null, 2));

  return NextResponse.json({
    seeded:        report,
    queue_length:  queue.length,
    hitl_case_id,
    hitl_url,
    note:          hitl_case_id
      ? `Navigate to ${hitl_url} — amount exceeds $25k, secondary approver required.`
      : 'No high-value case found; check pipeline errors above.',
  });
}
