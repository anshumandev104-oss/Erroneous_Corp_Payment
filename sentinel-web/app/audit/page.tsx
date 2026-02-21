import { Download, Search, Calendar, Filter, ShieldOff, Sparkles, Mail, StickyNote, AlertTriangle, ShieldAlert } from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';

interface AuditRow {
  timestamp: string;
  user:       string;
  initials:   string;
  avatarClass: string;
  actionIcon: React.ReactNode;
  actionLabel: string;
  actionClass: string;
  details:    string;
  caseRef:    string;
  caseHref:   string;
  outcome:    'Success' | 'Pending' | 'Failed';
}

const AUDIT_ROWS: AuditRow[] = [
  {
    timestamp:   '2023-10-24T09:44:12Z',
    user:        'John Doe',
    initials:    'JD',
    avatarClass: 'bg-blue-100 text-blue-700',
    actionIcon:  <ShieldOff size={14} />,
    actionLabel: 'Scheme Stop Initiated',
    actionClass: 'text-blue-600',
    details:     'Triggered manual BECS scheme stop for batch 882190 after client confirmation.',
    caseRef:     'XYZ123-BECS',
    caseHref:    '/case/CASE-XYZ123-20260220-0001',
    outcome:     'Success',
  },
  {
    timestamp:   '2023-10-24T09:42:08Z',
    user:        'System AI',
    initials:    '✦',
    avatarClass: 'bg-indigo-100 text-indigo-700',
    actionIcon:  <Sparkles size={14} />,
    actionLabel: 'Triage Completed',
    actionClass: 'text-indigo-600',
    details:     'Sentiment: Urgent. Confidence: 92%. Reason: Fat finger error detected in OCR.',
    caseRef:     'XYZ123-BECS',
    caseHref:    '/case/CASE-XYZ123-20260220-0001',
    outcome:     'Success',
  },
  {
    timestamp:   '2023-10-24T09:40:15Z',
    user:        'Sarah Jenkins',
    initials:    'SJ',
    avatarClass: 'bg-slate-100 text-slate-700',
    actionIcon:  <Mail size={14} />,
    actionLabel: 'Communication Sent',
    actionClass: 'text-slate-600',
    details:     'Sent recall status update to client.ops@globaltrade.com.',
    caseRef:     'XYZ123-BECS',
    caseHref:    '/case/CASE-XYZ123-20260220-0001',
    outcome:     'Success',
  },
  {
    timestamp:   '2023-10-24T09:35:00Z',
    user:        'John Doe',
    initials:    'JD',
    avatarClass: 'bg-blue-100 text-blue-700',
    actionIcon:  <StickyNote size={14} />,
    actionLabel: 'Note Added',
    actionClass: 'text-slate-600',
    details:     '"Waiting for secondary VP approval for final settlement reversal."',
    caseRef:     'ABC991-BECS',
    caseHref:    '#',
    outcome:     'Pending',
  },
  {
    timestamp:   '2023-10-24T09:30:45Z',
    user:        'System AI',
    initials:    '!',
    avatarClass: 'bg-red-100 text-red-700',
    actionIcon:  <AlertTriangle size={14} />,
    actionLabel: 'Scheme Stop Failed',
    actionClass: 'text-red-600',
    details:     'API Timeout Error while communicating with Clearing House. Auto-retry initiated.',
    caseRef:     'ERR881-BECS',
    caseHref:    '#',
    outcome:     'Failed',
  },
];

function outcomeBadge(outcome: AuditRow['outcome']) {
  switch (outcome) {
    case 'Success': return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
    case 'Pending': return 'bg-amber-50 text-amber-700 border border-amber-100';
    case 'Failed':  return 'bg-red-50 text-red-700 border border-red-100';
  }
}

export default function AuditPage() {
  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="audit" triageBadgeCount={0} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900">Audit Log</h1>
            <p className="text-sm text-slate-500 mt-1">
              Comprehensive historical trail of all operational actions and system events.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all refined-shadow">
              <Download size={18} /> Export to CSV
            </button>
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-slate-700">Logging Active</span>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white p-5 rounded-2xl refined-border refined-shadow mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Case ID, User, or Keyword..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>All Actions</option>
                <option>Case Created</option>
                <option>Triage Completed</option>
                <option>Scheme Stop Initiated</option>
                <option>Communication Sent</option>
                <option>Note Added</option>
              </select>
              <select className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>All Users</option>
                <option>John Doe</option>
                <option>Sarah Jenkins</option>
                <option>System AI</option>
                <option>Admin Console</option>
              </select>
              <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl">
                <Calendar size={15} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-600 w-44">2023-10-20 to 2023-10-24</span>
              </div>
              <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Audit table */}
        <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp (ISO 8601)</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Affected Case</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {AUDIT_ROWS.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 text-xs font-mono font-medium text-slate-500">{row.timestamp}</td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold ${row.avatarClass}`}>
                          {row.initials}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{row.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`flex items-center gap-2 ${row.actionClass}`}>
                        {row.actionIcon}
                        <span className="text-xs font-black uppercase tracking-wide">{row.actionLabel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-xs text-slate-600 max-w-xs leading-relaxed">{row.details}</p>
                    </td>
                    <td className="px-6 py-6">
                      <a href={row.caseHref} className="text-xs font-bold text-blue-600 hover:underline">{row.caseRef}</a>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${outcomeBadge(row.outcome)}`}>
                        {row.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Showing 1 to 5 of 1,248 entries</p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed">Previous</button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-xs font-bold">1</button>
                <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">2</button>
                <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">3</button>
                <span className="px-1 text-slate-400">…</span>
                <button className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">250</button>
              </div>
              <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
