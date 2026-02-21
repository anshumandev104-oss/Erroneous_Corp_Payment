import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CaseUrgency, CaseStatus } from '@/lib/case-types';
import { formatAUD, getUrgencyColor, formatRelativeTime } from '@/lib/utils';

interface CaseListItemProps {
  case_id: string;
  reference_id: string;
  amount: number;
  client: string | null;
  urgency: CaseUrgency;
  confidence: number;
  received_at: string;
  status: CaseStatus;
  variant: 'table' | 'card';
  selected?: boolean;
  onSelect?: (case_id: string, checked: boolean) => void;
}

function cardStatusBadgeClass(status: CaseStatus): string {
  switch (status) {
    case 'In Review': return 'bg-orange-50 text-orange-600 border border-orange-100';
    case 'Pending':   return 'bg-slate-100 text-slate-500';
    case 'Triaged':   return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    case 'Resolved':  return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    default:          return 'bg-slate-100 text-slate-500';
  }
}

function tableStatusMeta(status: CaseStatus, urgency: CaseUrgency) {
  if (status === 'In Review')                           return { dotClass: 'bg-blue-500',    pulse: false, textClass: 'text-blue-600',    label: 'In Review' };
  if (status === 'Pending' && urgency === 'critical')   return { dotClass: 'bg-red-500',     pulse: true,  textClass: 'text-red-600',     label: 'Urgent Triage' };
  if (status === 'Pending')                             return { dotClass: 'bg-slate-400',   pulse: false, textClass: 'text-slate-500',   label: 'Pending' };
  if (status === 'Triaged')                             return { dotClass: 'bg-green-500',   pulse: false, textClass: 'text-green-600',   label: 'Triaged' };
  if (status === 'Resolved')                            return { dotClass: 'bg-emerald-500', pulse: false, textClass: 'text-emerald-600', label: 'Resolved' };
  return { dotClass: 'bg-slate-400', pulse: false, textClass: 'text-slate-500', label: status };
}

export default function CaseListItem({
  case_id,
  reference_id,
  amount,
  client,
  urgency,
  confidence,
  received_at,
  status,
  variant,
  selected = false,
  onSelect,
}: CaseListItemProps) {
  const confidencePct = Math.round(confidence * 100);
  const receivedTime  = new Date(received_at).toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

  /* ── Table row (dashboard, cases) ── */
  if (variant === 'table') {
    const meta = tableStatusMeta(status, urgency);
    return (
      <tr className="hover:bg-slate-50/50 transition-colors group">
        <td className="px-8 py-6">
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-900">{reference_id}-BECS</span>
            <span className={`text-[10px] flex items-center gap-1.5 font-bold uppercase mt-1 ${meta.textClass}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}${meta.pulse ? ' animate-pulse' : ''}`} />
              {meta.label}
            </span>
          </div>
        </td>

        <td className="px-8 py-6">
          <span className="text-sm font-bold text-slate-900">{formatAUD(amount)}</span>
        </td>

        <td className="px-8 py-6">
          <span className="text-sm font-medium text-slate-600">{client ?? '—'}</span>
        </td>

        <td className="px-8 py-6">
          <span className="text-xs font-mono text-slate-500">
            {new Date(received_at).toLocaleTimeString('en-AU', {
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            })}
          </span>
        </td>

        <td className="px-8 py-6 text-right">
          <Link
            href={`/case/${case_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-blue-500/20 opacity-0 group-hover:opacity-100 transition-all"
          >
            Review <ArrowRight size={14} />
          </Link>
        </td>
      </tr>
    );
  }

  /* ── Card row (triage) ── */
  return (
    <div className="case-card group bg-white p-6 rounded-[1.5rem] refined-border refined-shadow transition-all hover:shadow-xl hover:shadow-blue-500/5 flex flex-col lg:flex-row items-start lg:items-center gap-6 cursor-pointer">
      {/* Left: checkbox + urgency rail */}
      <div className="flex items-center gap-4 lg:w-12">
        {onSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={e => onSelect(case_id, e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        )}
        <div className={`w-2 h-12 rounded-full ${getUrgencyColor(urgency)}`} />
      </div>

      {/* Content grid: 6 columns */}
      <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 items-center gap-8 w-full">
        {/* Col 1: Case ID / Amount */}
        <Link href={`/case/${case_id}`} className="block">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Case ID / Amount</p>
          <p className="font-display font-black text-slate-900 text-lg">{formatAUD(amount)}</p>
          <p className="text-xs font-bold text-blue-600">REF: {reference_id}</p>
        </Link>

        {/* Col 2: Sender */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sender</p>
          <p className="font-bold text-slate-800 truncate">{client ?? '—'}</p>
          <p className="text-xs text-slate-500">BECS</p>
        </div>

        {/* Col 3: AI Confidence */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Confidence</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${confidencePct >= 75 ? 'bg-blue-600' : 'bg-slate-400'}`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-xs font-black text-slate-900">{confidencePct}%</span>
          </div>
        </div>

        {/* Col 4: Received */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Received</p>
          <p className="font-bold text-slate-800">{formatRelativeTime(received_at)}</p>
          <p className="text-xs text-slate-500">{receivedTime}</p>
        </div>

        {/* Col 5: Status */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${cardStatusBadgeClass(status)}`}>
            {status}
          </span>
        </div>

        {/* Col 6: View Details */}
        <div className="flex justify-end">
          <Link
            href={`/case/${case_id}`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-xs font-bold text-slate-600 transition-colors"
          >
            View Details <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
