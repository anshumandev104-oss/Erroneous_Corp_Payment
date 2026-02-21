'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Layers, FileEdit, Settings2, BarChart3,
  RefreshCw, Zap, Download, Info, ChevronRight,
} from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import SLARiskMonitor from '@/components/SLARiskMonitor';

interface ToolCard {
  icon:    React.ReactNode;
  iconBg:  string;
  title:   string;
  desc:    string;
  status:  string;
  statusClass: string;
  meta:    string;
  href:    string;
  linkLabel: string;
}

const TOOLS: ToolCard[] = [
  {
    icon:       <Layers size={24} className="text-blue-600" />,
    iconBg:     'bg-blue-50',
    title:      'Batch Recall Manager',
    desc:       'Initiate and track multiple recall requests simultaneously. Supports bulk CSV uploads for high-volume operational incidents.',
    status:     'Active',
    statusClass:'text-green-600 bg-green-50',
    meta:       '4 Batches Processing',
    href:       '#batch-manager',
    linkLabel:  'Open Manager →',
  },
  {
    icon:       <FileEdit size={24} className="text-purple-600" />,
    iconBg:     'bg-purple-50',
    title:      'Communication Templates',
    desc:       'Customize outbound email and SMS templates for beneficiary outreach. Dynamic variables mapped to scheme data.',
    status:     'Optimal',
    statusClass:'text-green-600 bg-green-50',
    meta:       '12 Managed Templates',
    href:       '#templates',
    linkLabel:  'Edit Templates →',
  },
  {
    icon:       <Settings2 size={24} className="text-amber-600" />,
    iconBg:     'bg-amber-50',
    title:      'Scheme Configuration',
    desc:       'Fine-tune intercept behavior, timeouts, and risk thresholds for BECS, EFT, and international payment schemes.',
    status:     'Config Drift',
    statusClass:'text-yellow-600 bg-yellow-50',
    meta:       'Last updated 2d ago',
    href:       '/schemes',
    linkLabel:  'Manage Schemes →',
  },
  {
    icon:       <BarChart3 size={24} className="text-emerald-600" />,
    iconBg:     'bg-emerald-50',
    title:      'Reconciliation & Audit',
    desc:       'Generate settlement reports for finance. Export audit logs for compliance reviews and regulatory reporting.',
    status:     'Active',
    statusClass:'text-green-600 bg-green-50',
    meta:       'Daily automated exports',
    href:       '/audit',
    linkLabel:  'View Audit Logs →',
  },
];

const INTEGRATIONS = [
  { name: 'BECS Gateway',    latency: '12ms',  status: 'CONNECTED', dotClass: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]',  textClass: 'text-green-400'  },
  { name: 'EFT Intercept',   latency: '45ms',  status: 'CONNECTED', dotClass: 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]',  textClass: 'text-green-400'  },
  { name: 'SWIFT Direct',    latency: '182ms', status: 'DEGRADED',  dotClass: 'bg-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.6)]', textClass: 'text-yellow-400' },
  { name: 'Settlement Node', latency: 'ERR',   status: 'OFFLINE',   dotClass: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]',    textClass: 'text-red-400'    },
];

const SESSION_STATS = [
  { label: 'Recall Success Rate',     value: '98.4%',    valueClass: 'text-slate-900' },
  { label: 'Mean Time to Intercept',  value: '4.2m',     valueClass: 'text-slate-900' },
  { label: 'High-Value Intercepts',   value: '14 Today', valueClass: 'text-blue-600'  },
];

export default function OpsToolsPage() {
  // SLA window: 90 minutes from page mount (approximates "01:45:22" from the HTML design)
  const cutoffDue = useMemo(() => new Date(Date.now() + 90 * 60 * 1000).toISOString(), []);

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="ops" triageBadgeCount={0} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-900 font-semibold">Operations Tools</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-slate-700 tracking-wide">Infrastructure Healthy</span>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Left — tools + integrations */}
          <section className="col-span-12 lg:col-span-8 space-y-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-display font-bold text-slate-900">Operational Toolkit</h1>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  <Zap size={16} /> Initiate Bulk Recalls
                </button>
                <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
                  <Download size={16} /> Download Settlement Report
                </button>
              </div>
            </div>

            {/* Tool cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TOOLS.map(t => (
                <div
                  key={t.title}
                  className="bg-white p-8 rounded-[2rem] refined-border refined-shadow space-y-6 hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 ${t.iconBg} rounded-2xl flex items-center justify-center`}>{t.icon}</div>
                    <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${t.statusClass}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-display font-bold text-slate-900">{t.title}</h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.meta}</div>
                    <Link href={t.href} className="text-blue-600 text-sm font-black hover:underline">{t.linkLabel}</Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Integration health */}
            <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl shadow-slate-900/40">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-display font-bold">Integration Connectivity</h2>
                  <p className="text-slate-400 text-sm mt-1">Live monitoring of scheme API endpoints and bank nodes.</p>
                </div>
                <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  <RefreshCw size={18} className="text-white" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {INTEGRATIONS.map(n => (
                  <div key={n.name} className="p-5 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.name}</span>
                      <div className={`w-2 h-2 rounded-full ${n.dotClass}`} />
                    </div>
                    <div className="text-2xl font-mono font-bold">{n.latency}</div>
                    <div className={`text-[10px] mt-1 font-bold ${n.textClass}`}>{n.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right — SLA monitor + session summary */}
          <section className="col-span-12 lg:col-span-4 space-y-8">
            <SLARiskMonitor
              cutoff_due={cutoffDue}
              riskTitle1="Operational Risk:"
              riskMessage1="Operational tools are running in limited capacity due to SWIFT direct degradation."
              riskTitle2="Policy Notice:"
              riskMessage2="Ensure manual oversight for all international recall batches during current downtime."
            />

            {/* Session summary */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-8 space-y-6">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Current Session Summary</h3>
              <div className="space-y-4">
                {SESSION_STATS.map(s => (
                  <div key={s.label} className="flex justify-between p-4 bg-slate-50 rounded-xl">
                    <span className="text-sm font-medium text-slate-600">{s.label}</span>
                    <span className={`text-sm font-bold ${s.valueClass}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info size={15} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-900">Policy Enforcement</span>
                </div>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Recall overrides require dual-token authentication for any transaction exceeding $100k USD equivalent.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
