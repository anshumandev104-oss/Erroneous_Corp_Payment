export type ActionType =
  | 'SCHEME_STOP'
  | 'RETURN_REQUEST'
  | 'BENEFICIARY_OUTREACH';

// HITL invariant: 'executed' is deliberately NOT a valid status.
// This type union is the compile-time enforcement of the HITL principle.
export type ActionStatus = 'staged' | 'approved';

export interface StagedAction {
  action_id: string;
  type: ActionType;
  status: ActionStatus;
  executed: false;                // literal type — TypeScript blocks executed:true at compile time
  requires_approval: true;
  requires_second_approver: boolean;
  justification: string;
  created_at: string;             // ISO
  approved_at: string | null;
  approver_id: string | null;
  approver_role: string | null;
  second_approver_id: string | null;
  second_approver_role: string | null;
}

export interface ApproveActionPayload {
  case_id: string;
  action_id: string;
  approver_id: string;
  approver_role: string;
  justification: string;
  second_approver?: {
    approver_id: string;
    approver_role: string;
  };
}
