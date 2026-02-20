'use client';

import { useState } from 'react';
import { ShieldCheck, X, AlertTriangle } from 'lucide-react';
import type { CaseJson } from '@/lib/case-types';
import type { StagedAction, ApproveActionPayload } from '@/lib/action-types';

interface ApproveConfirmModalProps {
  action: StagedAction;
  case_json: CaseJson;
  onConfirm: (updated_case: CaseJson) => void;
  onCancel: () => void;
}

const THRESHOLD = 25_000;

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
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const isValid =
    approverId.trim() &&
    approverRole.trim() &&
    justification.trim() &&
    (!needsSecondApprover || (secondId.trim() && secondRole.trim()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError(null);

    const payload: ApproveActionPayload = {
      case_id:      case_json.case_id,
      action_id:    action.action_id,
      approver_id:  approverId.trim(),
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
      const res = await fetch('/api/actions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { case_json?: CaseJson; error?: string };

      if (!res.ok || !data.case_json) {
        setError(data.error ?? 'Approval failed. Please try again.');
        return;
      }

      onConfirm(data.case_json);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2rem] refined-shadow w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-8 py-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} />
            <div>
              <h2 className="font-display font-bold text-lg">Approval Required</h2>
              <p className="text-blue-200 text-xs">Action: {action.type.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* $25k notice */}
        {needsSecondApprover && (
          <div className="mx-8 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              <span className="font-black">Secondary approval required.</span>{' '}
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
                  onChange={e => setApproverId(e.target.value)}
                  placeholder="e.g. JD001"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={approverRole}
                  onChange={e => setApproverRole(e.target.value)}
                  placeholder="e.g. Ops II"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
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
                    onChange={e => setSecondId(e.target.value)}
                    placeholder="e.g. SM099"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={secondRole}
                    onChange={e => setSecondRole(e.target.value)}
                    placeholder="e.g. Senior Manager"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
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
              onChange={e => setJustification(e.target.value)}
              placeholder="Describe the basis for approving this action..."
              required
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || loading}
              className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Approving…' : 'Confirm Approval'}
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
