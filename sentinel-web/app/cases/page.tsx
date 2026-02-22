'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RefreshCw, Search, Filter, Flag, Download,
  Layers, Clock, ShieldAlert, CheckCircle, Inbox,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import type { QueueRecord } from '@/lib/case-types';
import { formatAUD } from '@/lib/utils';

const SLA_T = '2023-10-24T17:00:00+11:00'; // shared cutoff for demo rows

// Static demo data shown when queue.json is empty
const DEMO_ROWS: QueueRecord[] = [
  { case_id: 'CASE-XYZ123-20231024-a1b2', reference_id: 'XYZ123', urgency: 'critical', status: 'In Review', amount: 48250,  client: 'Global Trade Corp',  currency: 'AUD', queue: 'To-Be-Resolved', received_at: '2023-10-24T09:12:00+11:00', triage_due: '2023-10-24T09:14:00+11:00', cutoff_due: SLA_T, priority_score: 18  },
  { case_id: 'CASE-ABC994-20231024-c3d4', reference_id: 'ABC994', urgency: 'high',     status: 'Pending',   amount: 2140,   client: 'Westside Logistics', currency: 'AUD', queue: 'To-Be-Resolved', received_at: '2023-10-24T08:45:00+11:00', triage_due: '2023-10-24T08:47:00+11:00', cutoff_due: SLA_T, priority_score: 164 },
  { case_id: 'CASE-KLM002-20231024-e5f6', reference_id: 'KLM002', urgency: 'critical', status: 'In Review', amount: 12000,  client: 'Apex Ventures',      currency: 'AUD', queue: 'To-Be-Resolved', received_at: '2023-10-24T07:12:00+11:00', triage_due: '2023-10-24T07:14:00+11:00', cutoff_due: SLA_T, priority_score: 0   },
  { case_id: 'CASE-TRX881-20231023-g7h8', reference_id: 'TRX881', urgency: 'low',      status: 'Resolved',  amount: 1420,   client: 'Oceanic Tech',       currency: 'AUD', queue: 'To-Be-Resolved', received_at: '2023-10-23T16:22:00+11:00', triage_due: '2023-10-23T16:24:00+11:00', cutoff_due: SLA_T, priority_score: 999 },
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'In Review':  return 'bg-orange-50 text-orange-600 border border-orange-100';
    case 'Pending':    return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'Triaged':    return 'bg-blue-50 text-blue-600 border border-blue-100';
    case 'Escalated':  return 'bg-red-50 text-red-600 border border-red-100';
    case 'Resolved':   return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    default:           return 'bg-slate-50 text-slate-600 border border-slate-100';
  }
}

function SlaCell({ score }: { score: number }) {
  if (score <= 0)  return <div className="flex items-center gap-1.5 text-xs font-black text-red-600 animate-pulse"><ShieldAlert size={13} />EXPIRED</div>;
  if (score >= 999) return <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600"><CheckCircle size={13} />RESOLVED</div>;
  const h = Math.floor(score / 60);
  const m = score % 60;
  const label = h > 0 ? `${h.toString().padStart(2,'0')}h ${m.toString().padStart(2,'0')}m` : `${m}m`;
  return <div className={`flex items-center gap-1.5 text-xs font-black ${score < 30 ? 'text-orange-500' : 'text-slate-400'}`}><Clock size={13} />{label}</div>;
}

export default function CasesPage() {
  const [queue, setQueue]           = useState<QueueRecord[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [reallyEmpty, setReallyEmpty] = useState(false);

  useEffect(() => {
    function fetchQueue() {
      fetch('/api/queue')
        .then(r => r.json())
        .then((data: QueueRecord[]) => {
          if (data.length === 0) {
            setReallyEmpty(true);
            setQueue(DEMO_ROWS); // show demo so UI isn't blank
          } else {
            setReallyEmpty(false);
            setQueue(data);
          }
        })
        .catch(() => setQueue(DEMO_ROWS))
        .finally(() => setLoading(false));
    }
    fetchQueue();
    const pollId = setInterval(fetchQueue, 10_000);
    return () => clearInterval(pollId);
  }, []);

  const critical  = queue.filter(q => q.urgency === 'critical').length;
  const slaAtRisk = queue.filter(q => q.priority_score > 0 && q.priority_score < 30).length;

  const filtered = search
    ? queue.filter(q =>
        q.reference_id.toLowerCase().includes(search.toLowerCase()) ||
        (q.client ?? '').toLowerCase().includes(search.toLowerCase()) ||
        String(q.amount).includes(search))
    : queue;

  const stats = [
    { icon: <Layers size={20} className="text-blue-600" />,    bg: 'bg-blue-50',    label: 'Total Active',    value: queue.length || 1284, sub: <span className="text-emerald-600 text-xs font-medium">+12% from yesterday</span> },
    { icon: <Clock size={20} className="text-orange-600" />,   bg: 'bg-orange-50',  label: 'SLA At Risk',     value: slaAtRisk || 42,      sub: <span className="text-orange-600 text-xs font-medium">Requires immediate action</span> },
    { icon: <ShieldAlert size={20} className="text-red-600" />,bg: 'bg-red-50',     label: 'Escalated',       value: critical || 8,        sub: <span className="text-slate-500 text-xs font-medium">Compliance review pending</span> },
    { icon: <CheckCircle size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Resolved (24h)', value: 156, sub: <span className="text-emerald-600 text-xs font-medium">Avg. 14m resolution</span> },
  ];

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="cases" triageBadgeCount={critical} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">BECS Case Management</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor and action recall requests across all payment schemes</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide">Real-time Processing Active</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full refined-border refined-shadow hover:bg-slate-50 transition-all">
              <RefreshCw size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-6 rounded-3xl refined-border refined-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label}</span>
              </div>
              <div className="text-3xl font-display font-black text-slate-900">{s.value.toLocaleString()}</div>
              <div className="mt-1">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">
          {/* Filter bar */}
          <div className="p-6 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/30">
            <div className="flex gap-4 flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  data-search
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search ref, sender, or amount..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none text-sm transition-all"
                />
              </div>
              <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                <Filter size={15} /> Status
              </button>
              <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                <Flag size={15} /> Urgency
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                Bulk Action
              </button>
              <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                <Download size={15} /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="px-6 py-4">Case Ref</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">SLA Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-6 py-4">
                        <div className="h-5 bg-slate-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="py-20 flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <Inbox size={28} className="text-slate-300" />
                        </div>
                        {reallyEmpty && !search ? (
                          <>
                            <p className="font-bold text-slate-500 text-lg">No active recalls</p>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                              Drop an email into{' '}
                              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">inbound_emails/</code>
                              {' '}or click &apos;Seed&apos; in Ops Tools to populate the queue.
                            </p>
                            <Link
                              href="/ops-tools"
                              className="mt-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                              Go to Ops Tools →
                            </Link>
                          </>
                        ) : (
                          <>
                            <p className="font-bold text-slate-500">No cases match your search</p>
                            <p className="text-sm text-slate-400">Try a different reference, sender, or amount.</p>
                            <button
                              onClick={() => setSearch('')}
                              className="mt-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                              Clear search
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(q => (
                  <tr key={q.case_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="px-6 py-4">
                      <Link href={`/case/${q.case_id}`} className="font-bold text-blue-600 hover:underline">
                        {q.reference_id}-BECS
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{formatAUD(q.amount)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{q.client ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(q.received_at).toLocaleDateString('en-AU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${statusBadgeClass(q.status)}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-slate-400">Unassigned</span>
                    </td>
                    <td className="px-6 py-4">
                      <SlaCell score={q.priority_score} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/case/${q.case_id}`}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Showing {filtered.length} of {queue.length.toLocaleString()} cases
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white">
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold">1</button>
              <button className="px-3 py-1 text-slate-600 rounded-lg text-xs font-bold hover:bg-white">2</button>
              <button className="px-3 py-1 text-slate-600 rounded-lg text-xs font-bold hover:bg-white">3</button>
              <span className="text-slate-400 px-1">…</span>
              <button className="px-3 py-1 text-slate-600 rounded-lg text-xs font-bold hover:bg-white">42</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
