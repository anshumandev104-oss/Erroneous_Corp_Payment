'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneCall, Upload, Loader2, X } from 'lucide-react';

type WidgetState = 'idle' | 'processing' | 'error';

export default function IngestCallScriptWidget() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open,        setOpen]        = useState(false);
  const [text,        setText]        = useState('');
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [toastMsg,    setToastMsg]    = useState<string | null>(null);

  function reset() {
    setText('');
    setWidgetState('idle');
    setErrorMsg(null);
  }

  function handleFileRead(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setText((ev.target?.result as string) ?? '');
      setErrorMsg(null);
      setWidgetState('idle');
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-loaded if needed
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!text.trim()) {
      setErrorMsg('Please paste or upload a call transcript before processing.');
      setWidgetState('error');
      return;
    }

    setWidgetState('processing');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ingest/call', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ raw_text: text.trim(), source: 'transcript' }),
      });

      const data = await res.json() as { case_id?: string; error?: string; details?: string };

      if (!res.ok || !data.case_id) {
        setErrorMsg(data.details ?? data.error ?? 'Processing failed. Please try again.');
        setWidgetState('error');
        return;
      }

      setToastMsg('Call script ingested. Redirecting\u2026');
      router.refresh();
      setTimeout(() => {
        setToastMsg(null);
        setOpen(false);
        reset();
        router.push(`/case/${data.case_id}`);
      }, 1400);
    } catch {
      setErrorMsg('Network error. Check your connection and try again.');
      setWidgetState('error');
    }
  }

  return (
    <div className="relative">
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-xl pointer-events-none">
          <Loader2 size={14} className="animate-spin shrink-0" />
          {toastMsg}
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); reset(); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors refined-shadow"
      >
        <PhoneCall size={15} />
        Ingest Call Script
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); reset(); }} />

          {/* Dropdown panel */}
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-2xl refined-border refined-shadow p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900">Ingest Call Script</h3>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Raw Call Transcript
              </label>
              <textarea
                rows={10}
                value={text}
                onChange={e => { setText(e.target.value); setErrorMsg(null); setWidgetState('idle'); }}
                placeholder={"Agent: Good morning, how can I help you today?\nCustomer: I need to recall a payment sent in error.\nAgent: Understood. Can I get the reference number?"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none transition-all leading-relaxed"
              />
            </div>

            {/* .txt upload — populates textarea */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleFileRead}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <Upload size={12} />
                Upload .txt file
              </button>
            </div>

            {/* Inline error */}
            {errorMsg && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                <X size={13} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={widgetState === 'processing'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all refined-shadow"
            >
              {widgetState === 'processing' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing…
                </>
              ) : (
                'Process Call Script'
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Transcript is triaged, a case assembled, and actions staged for human review.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
