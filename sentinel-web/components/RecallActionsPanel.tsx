'use client';

import { useState } from 'react';
import { StopCircle, Undo2, PhoneForwarded, ChevronRight, Edit3 } from 'lucide-react';
import type { CaseJson } from '@/lib/case-types';
import type { StagedAction } from '@/lib/action-types';
import ApproveConfirmModal from './ApproveConfirmModal';

interface RecallActionsPanelProps {
  case_json: CaseJson;
  onApproveSuccess: (updated_case: CaseJson) => void;
  onEditTemplate?: () => void;
}

const ACTION_CONFIG = {
  SCHEME_STOP: {
    icon: <StopCircle size={24} />,
    label: 'Initiate Scheme Stop',
    primary: true,
  },
  RETURN_REQUEST: {
    icon: <Undo2 size={20} />,
    label: 'Return Request',
    primary: false,
  },
  BENEFICIARY_OUTREACH: {
    icon: <PhoneForwarded size={20} />,
    label: 'Beneficiary Outreach',
    primary: false,
  },
} as const;

export default function RecallActionsPanel({
  case_json: initialCase,
  onApproveSuccess,
  onEditTemplate,
}: RecallActionsPanelProps) {
  const [caseJson, setCaseJson] = useState<CaseJson>(initialCase);
  const [pendingAction, setPendingAction] = useState<StagedAction | null>(null);
  const [showModal, setShowModal] = useState(false);

  // HITL gate: clicking an action button NEVER directly calls approve.
  // It sets pendingAction to open the confirmation modal.
  function handleActionClick(action: StagedAction) {
    setPendingAction(action);
    setShowModal(true);
  }

  function handleModalConfirm(updated_case: CaseJson) {
    setCaseJson(updated_case);
    setShowModal(false);
    setPendingAction(null);
    onApproveSuccess(updated_case);
  }

  function handleModalCancel() {
    setShowModal(false);
    setPendingAction(null);
  }

  const commDraft = caseJson.comms.client_update_draft;
  const commPreview = commDraft
    ? commDraft.replace('AUTO-GENERATED — REVIEW BEFORE SENDING\n\n', '').slice(0, 120) + '…'
    : null;

  return (
    <>
      <div className="bg-white rounded-[2.5rem] refined-border refined-shadow p-10 space-y-10">
        <div className="space-y-2">
          <h2 className="font-display font-bold text-xl text-slate-900">Recall Actions</h2>
          <p className="text-xs text-slate-400 font-medium italic">AI-recommended next steps — human approval required</p>
        </div>

        {caseJson.actions.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No actions staged yet.</p>
        ) : (
          <div className="space-y-4">
            {caseJson.actions.map(action => {
              const config = ACTION_CONFIG[action.type];
              const isApproved = action.status === 'approved';

              if (config.primary) {
                return (
                  <button
                    key={action.action_id}
                    onClick={() => !isApproved && handleActionClick(action)}
                    disabled={isApproved}
                    className={`w-full flex items-center justify-between pl-6 pr-5 py-5 rounded-2xl transition-all shadow-xl group ${
                      isApproved
                        ? 'bg-emerald-600 text-white shadow-emerald-500/20 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        {config.icon}
                      </div>
                      <div className="text-left">
                        <span className="font-black text-sm tracking-wide block">{config.label}</span>
                        {isApproved && (
                          <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                            Approved — awaiting execution
                          </span>
                        )}
                      </div>
                    </div>
                    {!isApproved && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                );
              }

              return (
                <button
                  key={action.action_id}
                  onClick={() => !isApproved && handleActionClick(action)}
                  disabled={isApproved}
                  className={`w-full flex items-center justify-between pl-6 pr-5 py-5 rounded-2xl transition-all font-bold text-sm group ${
                    isApproved
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="group-hover:scale-110 transition-transform">{config.icon}</span>
                    <div className="text-left">
                      <span className="block">{config.label}</span>
                      {isApproved && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                          Approved — awaiting execution
                        </span>
                      )}
                    </div>
                  </div>
                  {!isApproved && <ChevronRight size={16} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Draft Comms */}
        {commDraft && (
          <div className="pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Draft Comms</h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                AUTO-GENERATED
              </span>
            </div>
            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-3 shadow-inner">
              <div className="flex gap-2">
                <span className="font-black text-slate-900">To:</span>
                <span>{initialCase.client ?? 'Client'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-black text-slate-900">Sub:</span>
                <span>Recall Update: Case {initialCase.reference_id}</span>
              </div>
              <p className="italic leading-relaxed border-t border-slate-100 pt-3">{commPreview}</p>
            </div>
            {onEditTemplate && (
              <button
                onClick={onEditTemplate}
                className="w-full mt-4 text-[11px] font-black text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 group transition-colors uppercase tracking-widest"
              >
                <Edit3 size={13} className="group-hover:-translate-y-0.5 transition-transform" />
                Modify Template
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && pendingAction && (
        <ApproveConfirmModal
          action={pendingAction}
          case_json={caseJson}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
}
