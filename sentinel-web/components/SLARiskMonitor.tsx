'use client';

import { useEffect, useState } from 'react';
import { TriangleAlert, ShieldAlert, Info } from 'lucide-react';
import { computeSLACountdown } from '@/lib/utils';

interface SLARiskMonitorProps {
  cutoff_due: string;
  riskTitle1?: string;
  riskMessage1?: string;
  riskTitle2?: string;
  riskMessage2?: string;
  onHelpClick?: () => void;
}

export default function SLARiskMonitor({
  cutoff_due,
  riskTitle1 = 'Operational Risk:',
  riskMessage1 = 'The recall window is closing. If batch lock fails, trigger client self-service portal immediately.',
  riskTitle2 = 'Policy Notice:',
  riskMessage2 = 'High-value transaction detected. Secondary approval required before execution.',
  onHelpClick,
}: SLARiskMonitorProps) {
  const [countdown, setCountdown] = useState(() => computeSLACountdown(cutoff_due));

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(computeSLACountdown(cutoff_due));
    }, 1000);
    return () => clearInterval(timer);
  }, [cutoff_due]);

  return (
    <div className="bg-slate-900 rounded-[2rem] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
      {/* Background icon */}
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <ShieldAlert size={96} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-10 relative z-10">
        <h2 className="font-display font-bold text-xl tracking-tight">SLA &amp; Risk Monitor</h2>
        <button
          onClick={onHelpClick}
          className="text-slate-500 hover:text-white transition-colors cursor-help"
          aria-label="Help"
        >
          <Info size={18} />
        </button>
      </div>

      {/* Countdown */}
      <div className="text-center mb-10 relative z-10">
        <div className="text-5xl font-mono font-black text-orange-400 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]">
          {countdown}
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-3">
          Time to Hard Settlement
        </div>
      </div>

      {/* Risk messages */}
      <div className="space-y-4 relative z-10">
        <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 flex gap-4 transition-all hover:bg-slate-800/60 group">
          <TriangleAlert size={20} className="text-orange-400 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
            <span className="text-white font-black block mb-1">{riskTitle1}</span>
            {riskMessage1}
          </p>
        </div>
        <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20 flex gap-4 transition-all hover:bg-red-500/10 group">
          <ShieldAlert size={20} className="text-red-400 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
            <span className="text-white font-black block mb-1">{riskTitle2}</span>
            {riskMessage2}
          </p>
        </div>
      </div>
    </div>
  );
}
