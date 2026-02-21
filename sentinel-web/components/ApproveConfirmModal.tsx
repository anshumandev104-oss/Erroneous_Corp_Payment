'use client';

import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import type { CaseJson } from '@/lib/case-types';
import type { StagedAction, ApproveActionPayload } from '@/lib/action-types';

interface ApproveConfirmModalProps {
  action: StagedAction;
  case_json: CaseJson;
  onConfirm: (updated_case: CaseJson) => void;
  onCancel: () => void;
}

type ModalState = 'idle' | 'validating' | 'approved';

const THRESHOLD = parseInt(process.env.NEXT_PUBLIC_THRESHOLD_SECOND_APPROVER ?? '25000', 10);

/**
 * HITL Confirmation Modal.
 * This is the ONLY component in the codebase that calls POST /api/actions/approve.
 * It is always opened by RecallActionsPanel — never bypassed.
 */
export default function ApproveConfirmModal({
  action,
  case_json,
  onConfirm,
  onCancel,
}: ApproveConfirmModalProps) {
  const needsSecondApprover = case_json.amount > THRESHOLD;

  const [approverId, setApproverId]       = useState('');
  const [approverRole, setApproverRole]   = useState('');
  const [justification, setJustification] = useState('');
  const [secondId, setSecondId]           = useState('');
  const [secondRole, setSecondRole]       = useState('');
  const [modalState, setModalState]       = useState<ModalState>('idle');
  const [fieldErrors, setFieldErrors]     = useState<Record<string, string>>({});
  const [apiError, setApiError]           = useState<string | null>(null);
  const [approvedCase, setApprovedCase]   = useState<CaseJson | null>(null);

  // Keep stable ref to onConfirm so the auto-close effect never restarts
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);

  // Auto-close 2.2 s after showing the success toast
  useEffect(() => {
    if (modalState === 'approved' && approvedCase) {
      const t = setTimeout(() => onConfirmRef.current(approvedCase), 2200);
      return () => clearTimeout(t);
    }
  }, [modalState, approvedCase]);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!approverId.trim())    errors.approverId    = 'Approver ID is required.';
    if (!approverRole.trim())  errors.approverRole  = 'Role is required.';
    if (!justification.trim()) errors.justification = 'Justification is required.';
    if (needsSecondApprover) {
      if (!secondId.trim())   errors.secondId   = 'Required for high-value transactions.';
      if (!secondRole.trim()) errors.secondRole = 'Must be Senior Manager or above.';
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setModalState('validating');
    setApiError(null);

    const payload: ApproveActionPayload = {
      case_id:       case_json.case_id,
      action_id:     action.action_id,
      approver_id:   approverId.trim(),
      approver_role: approverRole.trim(),
      justification: justification.trim(),
      ...(needsSecondApprover ? {
        second_approver: {
          approver_id:   secondId.trim(),
          approver_role: secondRole.trim(),
        },
      } : {}),
    };

    try {
      const res  = await fetch('/api/actions/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json() as { case_json?: CaseJson; error?: string };

      if (!res.ok || !data.case_json) {
        setApiError(data.error ?? 'Approval failed. Please try again.');
        setModalState('idle');
        return;
      }

      setApprovedCase(data.case_json);
      setModalState('approved');
    } catch {
      setApiError('Network error. Please check your connection and try again.');
      setModalState('idle');
    }
  }

  // ── Success toast view ────────────────────────────────────────────────────
  if (modalState === 'approved') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-[2rem] refined-shadow w-full max-w-lg overflow-hidden">
          <div className="p-12 flex flex-col items-center gap-4 text-center">
            <span className="w-16 h-16 flex items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </span>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Action approved and recorded to Audit
            </h2>
            <p className="text-sm text-slate-500 max-w-xs">
              Awaiting human execution — no automated action has been taken.
            </p>
            <p className="text-xs text-slate-400 mt-2 animate-pulse">Closing…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main modal ────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] refined-shadow w-full max-w-lg overflow-hidden">

        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} />
            <div>
              <h2 className="font-display font-bold text-lg">Human approval required</h2>
              <p className="text-blue-200 text-xs">Action: {action.type.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={modalState === 'validating'}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* High-value notice */}
        {needsSecondApprover && (
          <div className="mx-8 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              <span className="font-black">High-value: second approval required by policy.</span>{' '}
              Amount ${case_json.amount.toLocaleString()} exceeds the $
              {THRESHOLD.toLocaleString()} threshold. Both approvers must be identified.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-5">

          {/* Primary approver */}
          <fieldset className="space-y-4">
            <legend className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {needsSecondApprover ? 'Primary Approver' : 'Approver'}
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Approver ID
                </label>
                <input
                  type="text"
                  value={approverId}
                  onChange={e => { setApproverId(e.target.value); setFieldErrors(fe => ({ ...fe, approverId: '' })); }}
                  placeholder="e.g. JD001"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${fieldErrors.approverId ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.approverId && (
                  <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.approverId}</p>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={approverRole}
                  onChange={e => { setApproverRole(e.target.value); setFieldErrors(fe => ({ ...fe, approverRole: '' })); }}
                  placeholder="e.g. Ops II"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${fieldErrors.approverRole ? 'border-red-400' : 'border-slate-200'}`}
                />
                {fieldErrors.approverRole && (
                  <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.approverRole}</p>
                )}
              </div>
            </div>
          </fieldset>

          {/* Secondary approver — only shown for >$25k */}
          {needsSecondApprover && (
            <fieldset className="space-y-4">
              <legend className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Secondary Approver <span className="text-red-500">*</span>
              </legend>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Approver ID
                  </label>
                  <input
                    type="text"
                    value={secondId}
                    onChange={e => { setSecondId(e.target.value); setFieldErrors(fe => ({ ...fe, secondId: '' })); }}
                    placeholder="e.g. SM099"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${fieldErrors.secondId ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {fieldErrors.secondId && (
                    <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.secondId}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={secondRole}
                    onChange={e => { setSecondRole(e.target.value); setFieldErrors(fe => ({ ...fe, secondRole: '' })); }}
                    placeholder="e.g. Senior Manager"
                    className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${fieldErrors.secondRole ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {fieldErrors.secondRole && (
                    <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.secondRole}</p>
                  )}
                </div>
              </div>
            </fieldset>
          )}

          {/* Justification */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Justification
            </label>
            <textarea
              value={justification}
              onChange={e => { setJustification(e.target.value); setFieldErrors(fe => ({ ...fe, justification: '' })); }}
              placeholder="Describe the basis for approving this action..."
              rows={3}
              className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none ${fieldErrors.justification ? 'border-red-400' : 'border-slate-200'}`}
            />
            {fieldErrors.justification && (
              <p className="mt-1 text-[10px] text-red-600 font-medium">{fieldErrors.justification}</p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 items-start">
              <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 font-medium">{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={modalState === 'validating'}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 disabled:opacity-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalState === 'validating'}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {modalState === 'validating' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Approving…
                </>
              ) : 'Approve & record'}
            </button>
          </div>

          <p className="text-[10px] text-slate-400 text-center font-medium">
            Approval stages the action for human execution. It is <strong>never</strong> auto-executed.
          </p>
        </form>
      </div>
    </div>
  );
}
