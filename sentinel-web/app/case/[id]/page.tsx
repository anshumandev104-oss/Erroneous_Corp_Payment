import * as fs from 'fs/promises';
import * as path from 'path';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import {
  ChevronRight, Bell, Sparkles, CheckCircle, AlertTriangle,
  Clock4, AlertOctagon, UserCheck, Send, Mail, ChevronDown,
} from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import SLARiskMonitor from '@/components/SLARiskMonitor';
import type { CaseJson } from '@/lib/case-types';
import { formatAUD, getUrgencyBadgeClass } from '@/lib/utils';

// Lazy-load the client component — defers its JS bundle until needed
const RecallActionsPanel = dynamic(
  () => import('@/components/RecallActionsPanel'),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-[2.5rem] refined-border refined-shadow p-10 space-y-4 animate-pulse">
        <div className="h-6 w-44 bg-slate-100 rounded" />
        <div className="h-4 w-64 bg-slate-50 rounded" />
        <div className="h-16 bg-slate-100 rounded-2xl" />
        <div className="h-16 bg-slate-100 rounded-2xl" />
      </div>
    ),
  }
);

const DATA_CASES = path.join(process.cwd(), '..', 'data', 'cases');

async function getCase(id: string): Promise<CaseJson | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_CASES, `${id}.json`), 'utf-8');
    return JSON.parse(raw) as CaseJson;
  } catch {
    return null;
  }
}

// Confidence gauge SVG math: circumference = 2π × 88 ≈ 552.6
function confidenceDashOffset(confidence: number): number {
  return 552.6 * (1 - confidence);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const case_json = await getCase(id);

  if (!case_json) notFound();

  const confidencePct = Math.round(case_json.confidence * 100);
  const dashOffset    = confidenceDashOffset(case_json.confidence);
  const isPreSettlement = case_json.payment_status !== 'settled';
  const isCritical = case_json.urgency === 'critical';

  const bannerBg = isCritical ? 'banner-pulse' : 'bg-amber-500';
  const BannerIcon = isCritical ? AlertOctagon : Clock4;
  const urgencyLabel = isCritical
    ? 'High Urgency • BECS Recall Request'
    : 'In Review • Active Operational Investigation';

  // Derive comms data for Communication History
  const triage_ts = new Date(case_json.audit.triage_timestamp);
  const commsDate = triage_ts.toLocaleDateString('en-AU', {
    month: 'short', day: 'numeric',
  });
  const commsTime = triage_ts.toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const replyTime = new Date(triage_ts.getTime() + 2 * 60000).toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
  const sourceFrom = case_json.audit.source_email.replace('[EMAIL]', 'sender@example.com');

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="triage" triageBadgeCount={0} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Link href="/triage" className="hover:text-blue-600 transition-colors">
              Triage Queue
            </Link>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-900 font-semibold">Case {case_json.reference_id}-BECS</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Status chip with UserCheck */}
            <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full refined-shadow refined-border">
              <UserCheck size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-slate-700 tracking-wide">
                In Review by John Doe
              </span>
            </div>
            <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full refined-border refined-shadow hover:bg-slate-50 transition-all">
              <Bell size={18} className="text-slate-600" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Left column */}
          <section className="col-span-12 lg:col-span-8 space-y-8">
            {/* Hero Case Summary */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow overflow-hidden">
              {/* Banner with icon */}
              <div className={`${bannerBg} px-8 py-4 flex items-center justify-between text-white`}>
                <div className="flex items-center gap-3">
                  <BannerIcon size={22} />
                  <span className="text-sm font-extrabold uppercase tracking-[0.1em]">{urgencyLabel}</span>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 ${getUrgencyBadgeClass(case_json.urgency)}`}>
                  {case_json.urgency.toUpperCase()}
                </span>
              </div>

              <div className="p-10 flex flex-col md:flex-row gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <div className="flex items-baseline gap-4">
                    <h1 className="text-5xl font-display font-extrabold text-slate-900 tracking-tight">
                      {formatAUD(case_json.amount)}
                    </h1>
                    <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100 tracking-wider">
                      REF: {case_json.reference_id}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-5 gap-x-8 text-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sender</p>
                      <p className="font-bold text-slate-800">{case_json.client ?? '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Channel</p>
                      <p className="font-bold text-slate-800">{case_json.channel}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Status</p>
                      <p className="font-bold text-slate-800">{case_json.payment_status.replace('_', ' ')}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recall Type</p>
                      <p className="font-bold text-blue-600">
                        {isPreSettlement ? 'Pre-Settlement Intercept' : 'Post-Settlement Return'}
                      </p>
                    </div>
                  </div>

                  {/* Chips: Incorrect Amount, Verified Intent, High Probability */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-extrabold tracking-wide uppercase">
                      Incorrect Amount
                    </span>
                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-extrabold tracking-wide border border-emerald-100 uppercase">
                      Verified Intent
                    </span>
                    {case_json.confidence >= 0.75 && (
                      <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-[11px] font-extrabold tracking-wide border border-purple-100 uppercase">
                        High Probability
                      </span>
                    )}
                  </div>
                </div>

                {/* Confidence gauge */}
                <div className="flex flex-col items-center gap-4 relative">
                  <div className="relative flex items-center justify-center p-8 bg-blue-50/40 rounded-full border border-blue-100 shadow-[0_0_40px_rgba(0,82,255,0.12)]">
                    <svg className="w-48 h-48 transform -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200/50" />
                      <circle
                        cx="96" cy="96" r="88"
                        stroke="currentColor" strokeWidth="12" fill="transparent"
                        strokeDasharray="552.6"
                        strokeDashoffset={dashOffset}
                        className="text-blue-600 drop-shadow-[0_0_8px_rgba(0,82,255,0.4)] transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-6xl font-display font-black text-slate-900">
                        {confidencePct}<span className="text-3xl">%</span>
                      </span>
                      <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-widest mt-1">Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Triage Intelligence */}
            <div className="bg-slate-50/50 rounded-[2rem] refined-border refined-shadow p-10 space-y-8">
              <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Sparkles size={16} />
                </div>
                AI Triage Intelligence
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Detected intent */}
                <div className="space-y-5">
                  <div className="p-6 bg-white rounded-2xl refined-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Triage Notes</h3>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold">AUTO-TRIAGED</span>
                    </div>
                    <p className="text-xs leading-[1.8] font-mono p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 italic">
                      &quot;{case_json.triage_notes ?? 'No triage notes available.'}&quot;
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-600 rounded-2xl text-center shadow-lg shadow-blue-600/10">
                      <div className="text-[10px] text-blue-100 uppercase font-bold tracking-widest mb-1">Priority</div>
                      <div className="text-sm font-black text-white">{case_json.urgency.toUpperCase()}</div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status</div>
                      <div className="text-sm font-black text-slate-900">{case_json.payment_status.replace('_', ' ').toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-5">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Action Recommendations</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 text-xs font-bold text-emerald-800">
                      <CheckCircle size={16} />
                      <span>
                        {isPreSettlement
                          ? `Approve Scheme Stop: ${confidencePct}% confidence in recall intent.`
                          : `Stage Return Request: payment settled, voluntary return required.`}
                      </span>
                    </div>
                    {case_json.amount > 25000 && (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-3 text-xs font-bold text-amber-800">
                        <AlertTriangle size={16} />
                        <span>Secondary approval required: amount ${case_json.amount.toLocaleString()} exceeds $25,000 threshold.</span>
                      </div>
                    )}
                  </div>

                  {/* Fields extracted */}
                  <div className="p-5 bg-white rounded-2xl refined-border">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Extracted Fields</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {case_json.audit.fields_extracted.map(f => (
                        <span key={f} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ops Internal Notes */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-10">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-6">Ops Internal Notes</h2>
              <div className="space-y-4">
                {/* Static note from JD */}
                <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-600 text-sm">
                    JD
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-900">John Doe (Ops II)</span>
                      <span className="text-[10px] text-slate-400">{commsTime}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {case_json.triage_notes
                        ? `AI triage confirmed: ${case_json.triage_notes.slice(0, 120)}${case_json.triage_notes.length > 120 ? '…' : ''}`
                        : 'Case reviewed. Proceeding per standard recall protocol. Secondary approval required if amount exceeds threshold.'}
                    </p>
                  </div>
                </div>

                {/* Note input */}
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Add internal note..."
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <button className="absolute right-2 w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Communication History */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-10">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl text-slate-900">Communication History</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {case_json.comms.client_update_draft ? '2' : '1'} Messages
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {/* Inbound: Recall Request */}
                <details className="group py-4">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Mail size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Recall Request Received</p>
                        <p className="text-[10px] text-slate-400">
                          {commsDate}, {commsTime} • From: {sourceFrom}
                        </p>
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-slate-600 leading-relaxed">
                    <p className="font-bold text-slate-800 mb-2">Subject: URGENT: BECS Recall — Ref {case_json.reference_id}</p>
                    <p className="whitespace-pre-wrap">{case_json.triage_notes ?? 'Recall request submitted. Please action urgently.'}</p>
                  </div>
                </details>

                {/* Outbound: Auto-receipt (if comms draft exists) */}
                {case_json.comms.client_update_draft && (
                  <details className="group py-4">
                    <summary className="flex items-center justify-between cursor-pointer list-none">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Send size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Recall Initialized Notification</p>
                          <p className="text-[10px] text-slate-400">
                            {commsDate}, {replyTime} • To: {sourceFrom}
                          </p>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-slate-600">
                      {case_json.comms.client_update_draft}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {/* Audit Trail */}
            <div className="bg-white rounded-[2rem] refined-border refined-shadow p-10">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-6">Audit Trail</h2>
              <div className="space-y-1">
                {[
                  { label: 'Email Received',  time: case_json.audit.triage_timestamp, note: `From: ${case_json.audit.source_email}` },
                  { label: 'AI Triaged',       time: case_json.detected_at,            note: `Confidence: ${confidencePct}%` },
                  { label: 'Case Assembled',   time: case_json.detected_at,            note: `Case ID: ${case_json.case_id}` },
                  { label: 'Actions Staged',   time: case_json.detected_at,            note: case_json.audit.actions_staged.join(', ') || 'None' },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900">{step.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(step.time).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-xs text-slate-500">{step.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Right column */}
          <section className="col-span-12 lg:col-span-4 space-y-8">
            <SLARiskMonitor
              cutoff_due={case_json.sla.cutoff_due}
              riskTitle1="Operational Risk:"
              riskMessage1="The recall window is closing. Ensure action is approved and submitted before hard settlement."
              riskTitle2="Policy Notice:"
              riskMessage2={
                case_json.amount > 25000
                  ? `High-value transaction ($${case_json.amount.toLocaleString()}). Secondary Senior Manager approval required.`
                  : 'Standard single-approver threshold applies for this transaction amount.'
              }
            />

            <RecallActionsPanel
              case_json={case_json}
              onApproveSuccess={() => { /* In a full SPA this would update state — page will reflect on next load */ }}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
