import * as fs from 'fs/promises';
import * as path from 'path';
import {
  AlertOctagon, CheckCircle, Clock, Activity,
  Bell, LayoutDashboard,
} from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import StatsCard from '@/components/StatsCard';
import CaseListItem from '@/components/CaseListItem';
import type { QueueRecord } from '@/lib/case-types';

const DATA_QUEUE = path.join(process.cwd(), '..', 'data', 'queue', 'queue.json');

async function getQueue(): Promise<QueueRecord[]> {
  try {
    const raw = await fs.readFile(DATA_QUEUE, 'utf-8');
    return JSON.parse(raw) as QueueRecord[];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const queue = await getQueue();

  const critical = queue.filter(q => q.urgency === 'critical').length;
  const high     = queue.filter(q => q.urgency === 'high').length;
  const medium   = queue.filter(q => q.urgency === 'medium').length;
  const total    = queue.length;

  // Top 5 by priority (lowest priority_score = most urgent)
  const topCases = [...queue]
    .sort((a, b) => a.priority_score - b.priority_score)
    .slice(0, 5);

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="dashboard" triageBadgeCount={critical + high} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Operations Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">Real-time BECS recall triage overview</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide">AI System Online</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full refined-border refined-shadow hover:bg-slate-50 transition-all">
              <Bell size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatsCard
            icon={<LayoutDashboard size={22} className="text-blue-600" />}
            iconBgClass="bg-blue-50 text-blue-600"
            label="Total Cases"
            value={String(total)}
            badge={total > 0 ? 'Active' : 'None'}
            badgeClass="bg-blue-100 text-blue-700"
          />
          <StatsCard
            icon={<AlertOctagon size={22} className="text-red-500" />}
            iconBgClass="bg-red-50 text-red-500"
            label="Critical"
            value={String(critical)}
            badge={critical > 0 ? 'Urgent' : undefined}
            badgeClass="bg-red-100 text-red-700"
          />
          <StatsCard
            icon={<Clock size={22} className="text-orange-500" />}
            iconBgClass="bg-orange-50 text-orange-500"
            label="High Priority"
            value={String(high)}
            badge={high > 0 ? 'Review' : undefined}
            badgeClass="bg-orange-100 text-orange-700"
          />
          <StatsCard
            icon={<CheckCircle size={22} className="text-emerald-600" />}
            iconBgClass="bg-emerald-50 text-emerald-600"
            label="Medium / Low"
            value={String(medium + queue.filter(q => q.urgency === 'low').length)}
            badge="Queued"
            badgeClass="bg-slate-100 text-slate-600"
          />
        </div>

        {/* Active Recall Queue */}
        <div className="bg-white rounded-3xl refined-border refined-shadow overflow-hidden mb-10">
          <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100">
            <h2 className="font-display font-bold text-lg text-slate-900 flex items-center gap-3">
              <Activity size={20} className="text-blue-600" />
              Active Recall Queue
            </h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {total} cases
            </span>
          </div>

          {topCases.length === 0 ? (
            <div className="px-8 py-12 text-center text-slate-400 text-sm">
              No cases in queue. Submit an email to <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST /api/triage</code> to get started.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left w-8"></th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Reference</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Amount</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Client</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Confidence</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Received</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left"></th>
                </tr>
              </thead>
              <tbody>
                {topCases.map(q => (
                  <CaseListItem
                    key={q.case_id}
                    case_id={q.case_id}
                    reference_id={q.reference_id}
                    amount={q.amount}
                    client={q.client}
                    urgency={q.urgency}
                    confidence={0.75}
                    received_at={q.received_at}
                    status={q.status}
                    variant="table"
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* System Integrity */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl refined-border refined-shadow p-8">
            <h3 className="font-display font-bold text-base text-slate-900 mb-6">System Integrity</h3>
            <div className="space-y-4">
              {[
                { name: 'BECS Gateway',      latency: '12ms',  state: 'Connected', ok: true },
                { name: 'EFT Intercept',     latency: '45ms',  state: 'Connected', ok: true },
                { name: 'Triage Pipeline',   latency: '—',     state: 'Healthy',   ok: true },
                { name: 'Settlement Node',   latency: '—',     state: 'Online',    ok: true },
              ].map(s => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-slate-700 font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">{s.latency}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>{s.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl refined-border refined-shadow p-8">
            <h3 className="font-display font-bold text-base text-slate-900 mb-6">Urgency Summary</h3>
            <div className="space-y-4">
              {[
                { label: 'Critical', count: critical, color: 'bg-red-500',    text: 'text-red-700',    bg: 'bg-red-100' },
                { label: 'High',     count: high,     color: 'bg-orange-400', text: 'text-orange-700', bg: 'bg-orange-100' },
                { label: 'Medium',   count: medium,   color: 'bg-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-100' },
                { label: 'Low',      count: queue.filter(q => q.urgency === 'low').length, color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
              ].map(u => (
                <div key={u.label} className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${u.color}`} />
                  <span className="text-sm text-slate-700 font-medium flex-1">{u.label}</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${u.bg} ${u.text}`}>{u.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
