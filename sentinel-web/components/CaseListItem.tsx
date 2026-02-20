import Link from 'next/link';
import type { CaseUrgency, CaseStatus } from '@/lib/case-types';
import { formatAUD, getUrgencyColor, getUrgencyBadgeClass, getStatusBadgeClass, formatRelativeTime } from '@/lib/utils';

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

  if (variant === 'table') {
    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
        <td className="px-6 py-4">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={e => onSelect(case_id, e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
          )}
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-1 h-8 rounded-full ${getUrgencyColor(urgency)}`} />
            <div>
              <p className="font-bold text-slate-900 text-sm">{reference_id}-BECS</p>
              <p className="text-[10px] text-slate-400">{case_id}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 font-bold text-slate-900">{formatAUD(amount)}</td>
        <td className="px-6 py-4 text-sm text-slate-600">{client ?? '—'}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 w-24">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">{confidencePct}%</span>
          </div>
        </td>
        <td className="px-6 py-4 text-xs text-slate-500">{formatRelativeTime(received_at)}</td>
        <td className="px-6 py-4">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusBadgeClass(status)}`}>
            {status}
          </span>
        </td>
        <td className="px-6 py-4">
          <Link
            href={`/case/${case_id}`}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            View →
          </Link>
        </td>
      </tr>
    );
  }

  // Card variant
  return (
    <div className="case-card bg-white rounded-3xl refined-border refined-shadow p-6 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={e => onSelect(case_id, e.target.checked)}
              className="rounded border-slate-300 text-blue-600"
            />
          )}
          <div className={`w-1.5 h-10 rounded-full ${getUrgencyColor(urgency)}`} />
          <div>
            <p className="font-bold text-slate-900">{reference_id}-BECS</p>
            <p className="text-xs text-slate-400">{formatRelativeTime(received_at)}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getUrgencyBadgeClass(urgency)}`}>
          {urgency.toUpperCase()}
        </span>
      </div>

      <div className="mb-5">
        <p className="text-3xl font-display font-black text-slate-900">{formatAUD(amount)}</p>
        <p className="text-xs text-slate-500 mt-1">{client ?? 'Unknown sender'}</p>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
          <span>AI Confidence</span>
          <span>{confidencePct}%</span>
        </div>
        <div className="bg-slate-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${confidencePct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusBadgeClass(status)}`}>
          {status}
        </span>
        <Link
          href={`/case/${case_id}`}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
