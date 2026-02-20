import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { CaseJson } from '@backend/types/case';
import type { ApproveActionPayload } from '@backend/types/actions';

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');
const THRESHOLD  = parseInt(process.env.THRESHOLD_SECOND_APPROVER ?? '25000', 10);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ApproveActionPayload;
    const { case_id, action_id, approver_id, approver_role, justification, second_approver } = body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!case_id)      return NextResponse.json({ error: 'case_id is required' }, { status: 400 });
    if (!action_id)    return NextResponse.json({ error: 'action_id is required' }, { status: 400 });
    if (!approver_id)  return NextResponse.json({ error: 'approver_id is required' }, { status: 400 });
    if (!approver_role) return NextResponse.json({ error: 'approver_role is required' }, { status: 400 });
    if (!justification) return NextResponse.json({ error: 'justification is required' }, { status: 400 });

    // ── Load case ─────────────────────────────────────────────────────────
    const casePath = path.join(DATA_CASES, `${case_id}.json`);
    let case_json: CaseJson;
    try {
      const raw = await fs.readFile(casePath, 'utf-8');
      case_json = JSON.parse(raw) as CaseJson;
    } catch {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // ── Find action ───────────────────────────────────────────────────────
    const actionIdx = case_json.actions.findIndex(a => a.action_id === action_id);
    if (actionIdx === -1) {
      return NextResponse.json({ error: `Action ${action_id} not found in case` }, { status: 404 });
    }

    const action = case_json.actions[actionIdx];

    // ── HITL guards (in order) ────────────────────────────────────────────
    if (action.status !== 'staged') {
      return NextResponse.json({
        error: `Action ${action_id} is not in staged status (current: ${action.status})`,
      }, { status: 400 });
    }
    if (action.executed !== false) {
      return NextResponse.json({ error: 'HITL violation: action is already executed' }, { status: 400 });
    }

    // ── $25k threshold: require second approver ───────────────────────────
    if (case_json.amount > THRESHOLD) {
      if (!second_approver?.approver_id || !second_approver?.approver_role) {
        return NextResponse.json({
          error: `second_approver is required for amounts over $${THRESHOLD.toLocaleString()} (case amount: $${case_json.amount.toLocaleString()})`,
        }, { status: 400 });
      }
    }

    // ── Apply approval — NEVER set executed: true ─────────────────────────
    const approved_action = {
      ...action,
      status: 'approved' as const,
      executed: false as const,           // literal type — stays false always
      approved_at: new Date().toISOString(),
      approver_id,
      approver_role,
      ...(second_approver ? {
        second_approver_id:   second_approver.approver_id,
        second_approver_role: second_approver.approver_role,
      } : {}),
    };

    const updated_actions = [...case_json.actions];
    updated_actions[actionIdx] = approved_action;

    const updated_case: CaseJson = {
      ...case_json,
      actions: updated_actions,
      status: 'In Review',
      audit: {
        ...case_json.audit,
        actions_staged: case_json.audit.actions_staged,   // unchanged — action remains staged in audit
      },
    };

    await fs.writeFile(casePath, JSON.stringify(updated_case, null, 2));

    return NextResponse.json({
      case_json: updated_case,
      ops_note: `Action ${action_id} (${action.type}) approved by ${approver_id} (${approver_role}) at ${approved_action.approved_at}. Executed: false — awaiting human execution.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
