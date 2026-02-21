'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Landmark, Zap, ArrowRightLeft, History, ShieldAlert, FileText, CheckCircle } from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';

interface SchemeRow {
  id:           string;
  icon:         React.ReactNode;
  iconBg:       string;
  name:         string;
  description:  string;
  interceptHrs: number;
  recoveryHrs:  number;
  approvals:    string;
  threshold:    string;
}

const SCHEMES: SchemeRow[] = [
  {
    id:           'becs',
    icon:         <Landmark size={22} className="text-blue-600" />,
    iconBg:       'bg-blue-50',
    name:         'BECS',
    description:  'Bulk Electronic Clearing',
    interceptHrs: 4,
    recoveryHrs:  48,
    approvals:    '2 Required',
    threshold:    '50,000',
  },
  {
    id:           'eft',
    icon:         <Zap size={22} className="text-purple-600" />,
    iconBg:       'bg-purple-50',
    name:         'EFT',
    description:  'Fast Payment Network',
    interceptHrs: 1,
    recoveryHrs:  24,
    approvals:    '1 Required',
    threshold:    '10,000',
  },
  {
    id:           'de',
    icon:         <ArrowRightLeft size={22} className="text-emerald-600" />,
    iconBg:       'bg-emerald-50',
    name:         'Direct Entry',
    description:  'Standard Credit Transfer',
    interceptHrs: 2,
    recoveryHrs:  72,
    approvals:    '2 Required',
    threshold:    '25,000',
  },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
      aria-checked={checked}
      role="switch"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function SchemesPage() {
  const [autoStop, setAutoStop] = useState({ becs: true, eft: false, de: true });

  function setStop(id: string, val: boolean) {
    setAutoStop(prev => ({ ...prev, [id]: val }));
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="schemes" triageBadgeCount={0} />

      <main className="flex-1 ml-64 p-10 bg-[#F8FAFC]" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-end mb-10">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Scheme Configuration</h1>
            <p className="text-slate-500 text-sm">Define recall parameters and automation triggers for clearing networks.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-6 bg-white px-6 py-4 rounded-2xl refined-border refined-shadow">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gateway Status</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">API Live</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Sync</span>
                <span className="text-sm font-bold text-slate-700 mt-1 font-mono">Oct 25, 09:42:11</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
              <History size={18} /> Rollback Changes
            </button>
          </div>
        </header>

        <div className="space-y-8">
          {/* Scheme rows table */}
          <section>
            <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">
              {/* Column headers */}
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="col-span-3">Network Scheme</div>
                <div className="col-span-2">Recall Windows</div>
                <div className="col-span-2">Approvals</div>
                <div className="col-span-2">Risk Threshold</div>
                <div className="col-span-3 text-right">Automation / Actions</div>
              </div>

              <div className="divide-y divide-slate-50">
                {SCHEMES.map(s => (
                  <div key={s.id} className="grid grid-cols-12 px-8 py-10 items-center">
                    {/* Name */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center`}>{s.icon}</div>
                        <div>
                          <h3 className="font-bold text-slate-900">{s.name}</h3>
                          <p className="text-xs text-slate-500 font-medium">{s.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Recall Windows */}
                    <div className="col-span-2 space-y-3">
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Intercept</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={String(s.interceptHrs)}
                            className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] font-medium text-slate-500 uppercase">Hours</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Recovery</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={String(s.recoveryHrs)}
                            className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] font-medium text-slate-500 uppercase">Hours</span>
                        </div>
                      </div>
                    </div>

                    {/* Approvals */}
                    <div className="col-span-2">
                      <select
                        defaultValue={s.approvals}
                        className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option>1 Required</option>
                        <option>2 Required</option>
                        <option>3 Required</option>
                      </select>
                    </div>

                    {/* Risk Threshold */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 w-32 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800">
                        <span className="text-slate-400">$</span>
                        <input
                          type="text"
                          defaultValue={s.threshold}
                          className="bg-transparent w-full outline-none text-xs font-bold"
                        />
                      </div>
                    </div>

                    {/* Auto-Stop + Test */}
                    <div className="col-span-3 flex items-center justify-end gap-6">
                      <div className="flex flex-col items-center gap-1">
                        <Toggle
                          checked={autoStop[s.id as keyof typeof autoStop]}
                          onChange={v => setStop(s.id, v)}
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Auto-Stop</span>
                      </div>
                      <button className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                        Test Connection
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottom info cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Universal Risk Protocol */}
            <div className="p-8 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <ShieldAlert size={22} className="text-blue-200" />
                  <h2 className="text-lg font-bold font-display">Universal Risk Protocol</h2>
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed">
                  Any transaction exceeding $250k across any scheme requires immediate escalation to the Head of Payments, bypassing standard operational logic.
                </p>
              </div>
              <div className="flex justify-end">
                <button className="text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all">
                  Modify Global Caps
                </button>
              </div>
            </div>

            {/* Audit Requirements */}
            <div className="p-8 bg-white rounded-[2rem] refined-border refined-shadow flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <FileText size={18} />
                  </div>
                  <h2 className="text-lg font-bold font-display text-slate-900">Audit Requirements</h2>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Configuration changes are logged and require an independent witness for production environment deployments. Last audit completed 14 days ago.
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1.5">
                  <CheckCircle size={13} /> Compliant
                </span>
                <Link href="/audit" className="text-xs font-bold text-blue-600 hover:underline">View History</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
