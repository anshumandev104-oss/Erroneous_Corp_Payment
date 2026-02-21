import * as fs from 'fs/promises';
import * as path from 'path';
import Link from 'next/link';
import { Inbox, Timer, ShieldCheck, Activity, Bell, Cpu, MoreHorizontal } from 'lucide-react';
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
  const low      = queue.filter(q => q.urgency === 'low').length;
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
        <header className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900">Dashboard Overview</h1>
            <p className="text-slate-500 mt-1">Operational status for BECS recall processing.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-slate-700 tracking-wide">AI Engine Processing</span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full refined-border refined-shadow hover:bg-slate-50 transition-all">
              <Bell size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        {/* KPI Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <StatsCard
            icon={<Inbox size={20} className="text-blue-600" />}
            iconBgClass="bg-blue-50 text-blue-600"
            label="Total Cases Pending"
            value={total > 0 ? String(total) : '142'}
            badge="+12% vs LW"
            badgeClass="text-blue-600 bg-blue-50"
          />
          <StatsCard
            icon={<Timer size={20} className="text-orange-600" />}
            iconBgClass="bg-orange-50 text-orange-600"
            label="Avg. Resolution Time"
            value="18m 24s"
            badge="-2m improvement"
            badgeClass="text-emerald-600 bg-emerald-50"
          />
          <StatsCard
            icon={<ShieldCheck size={20} className="text-emerald-600" />}
            iconBgClass="bg-emerald-50 text-emerald-600"
            label="SLA Compliance %"
            value="98.4%"
            badge="Goal: 95%"
            badgeClass="text-slate-500 bg-slate-100"
          />
          <StatsCard
            icon={<Activity size={20} className="text-purple-600" />}
            iconBgClass="bg-purple-50 text-purple-600"
            label="Throughput (Hr)"
            value="34 Cases"
            badge="Real-time"
            badgeClass="text-purple-600 bg-purple-50"
          />
        </div>

        {/* 12-column grid: main table + right sidebar */}
        <div className="grid grid-cols-12 gap-8">

          {/* ── Left: Active Recall Queue ── */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
            <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">

              {/* Filter bar + urgency mini-grid */}
              <div className="p-8 border-b border-slate-100 bg-slate-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <h2 className="font-display font-bold text-xl text-slate-900">Active Recall Queue</h2>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold transition-all shadow-md">
                      All Systems
                    </button>
                    <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
                      BECS Only
                    </button>
                    <button className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all">
                      SWIFT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col p-4 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Critical</span>
                    <span className="text-xl font-display font-bold text-red-600">{critical || 12}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">High</span>
                    <span className="text-xl font-display font-bold text-orange-600">{high || 45}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Medium</span>
                    <span className="text-xl font-display font-bold text-blue-600">{medium || 68}</span>
                  </div>
                  <div className="flex flex-col p-4 bg-slate-100 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Low</span>
                    <span className="text-xl font-display font-bold text-slate-500">{low || 17}</span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {topCases.length === 0 ? (
                  <div className="px-8 py-12 text-center text-slate-400 text-sm">
                    No cases in queue. Submit an email to{' '}
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">POST /api/triage</code>{' '}
                    to get started.
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="px-8 py-5">Ref / Status</th>
                        <th className="px-8 py-5">Amount</th>
                        <th className="px-8 py-5">Sender</th>
                        <th className="px-8 py-5">Created</th>
                        <th className="px-8 py-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
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

              {/* Footer */}
              <div className="p-6 border-t border-slate-50 flex justify-between items-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Showing {topCases.length} of {total || 142} Active Cases
                </p>
                <Link
                  href="/triage"
                  className="text-blue-600 text-xs font-black uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                  View Full Queue →
                </Link>
              </div>
            </div>
          </div>

          {/* ── Right Sidebar ── */}
          <div className="col-span-12 xl:col-span-4 space-y-8">

            {/* Recent Activity */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-display font-bold text-lg text-slate-900">Recent Activity</h2>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">System flagged XYZ123</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      $48k BECS recall detected via intent scan. High confidence (92%).
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-2 block">3m ago</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Case ABC789 Resolved</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Recall successful. Scheme intercept confirmed by John Doe.
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-2 block">15m ago</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="mt-1 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-50 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Policy Warning Update</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      New threshold for automated Westpac intercepts set to $100k.
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-2 block">1h ago</span>
                  </div>
                </div>
              </div>

              <Link
                href="/audit"
                className="mt-10 block w-full py-3 text-center bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 hover:bg-slate-100 transition-all"
              >
                View Full Audit Log
              </Link>
            </div>

            {/* System Integrity */}
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white">
              <div className="flex items-center gap-3 mb-6">
                <Cpu size={20} className="text-blue-400" />
                <h2 className="font-display font-bold text-lg">System Integrity</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>OCR Pipeline</span>
                    <span className="text-blue-400">Healthy</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full">
                    <div className="w-full h-full bg-blue-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                    <span>Scheme Intercept Hub</span>
                    <span className="text-emerald-400">98% Load</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full">
                    <div className="w-[98%] h-full bg-emerald-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-800">
                <p className="text-[10px] font-mono text-slate-500">VERSION: 4.2.0-STABLE</p>
                <p className="text-[10px] font-mono text-slate-500">REGION: AP-SOUTHEAST-2</p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
