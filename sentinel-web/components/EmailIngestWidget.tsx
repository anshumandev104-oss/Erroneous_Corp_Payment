'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, ClipboardPaste, Loader2, X } from 'lucide-react';

type Tab         = 'upload' | 'paste';
type WidgetState = 'idle' | 'processing' | 'error';

export default function EmailIngestWidget() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open,        setOpen]        = useState(false);
  const [tab,         setTab]         = useState<Tab>('upload');
  const [file,        setFile]        = useState<File | null>(null);
  const [pasteText,   setPasteText]   = useState('');
  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [toast,       setToast]       = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPasteText('');
    setWidgetState('idle');
    setErrorMsg(null);
  }

  async function handleSubmit() {
    setWidgetState('processing');
    setErrorMsg(null);

    try {
      let res: Response;

      if (tab === 'upload') {
        if (!file) {
          setErrorMsg('Please select a .eml or .txt file.');
          setWidgetState('error');
          return;
        }
        const formData = new FormData();
        formData.append('email', file);
        res = await fetch('/api/ingest/email', { method: 'POST', body: formData });
      } else {
        if (!pasteText.trim()) {
          setErrorMsg('Please paste email content before processing.');
          setWidgetState('error');
          return;
        }
        res = await fetch('/api/ingest/email', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ raw_text: pasteText }),
        });
      }

      const data = await res.json() as { case_id?: string; error?: string; details?: string };
      if (!res.ok || !data.case_id) {
        setErrorMsg(data.details ?? data.error ?? 'Processing failed. Please try again.');
        setWidgetState('error');
        return;
      }

      setToast('Case created from email. Redirecting\u2026');
      router.refresh();
      setTimeout(() => {
        setToast(null);
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
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3 bg-slate-900 text-white text-sm font-medium rounded-2xl shadow-xl pointer-events-none">
          <Loader2 size={14} className="animate-spin shrink-0" />
          {toast}
        </div>
      )}
      <button
        onClick={() => { setOpen(o => !o); reset(); }}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors refined-shadow"
      >
        <Upload size={15} />
        Ingest Email
      </button>

      {open && (
        <>
          {/* Backdrop — click outside to close */}
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); reset(); }} />

          {/* Dropdown panel */}
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-2xl refined-border refined-shadow p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900">Process Email</h3>
              <button
                onClick={() => { setOpen(false); reset(); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl" role="tablist">
              <button
                role="tab"
                aria-selected={tab === 'upload'}
                onClick={() => { setTab('upload'); reset(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === 'upload'
                    ? 'bg-white text-slate-900 refined-shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Upload size={13} />
                Upload .eml/.txt
              </button>
              <button
                role="tab"
                aria-selected={tab === 'paste'}
                onClick={() => { setTab('paste'); reset(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  tab === 'paste'
                    ? 'bg-white text-slate-900 refined-shadow'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ClipboardPaste size={13} />
                Paste Email
              </button>
            </div>

            {/* Tab content */}
            {tab === 'upload' ? (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition-all"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".eml,.txt"
                  className="hidden"
                  onChange={e => { setFile(e.target.files?.[0] ?? null); setErrorMsg(null); setWidgetState('idle'); }}
                />
                {file ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={22} className="mx-auto text-slate-300" />
                    <p className="text-xs text-slate-500">
                      Click to select <span className="font-bold">.eml</span> or <span className="font-bold">.txt</span>
                    </p>
                    <p className="text-[10px] text-slate-400">Max 5 MB</p>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                rows={6}
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setErrorMsg(null); setWidgetState('idle'); }}
                placeholder={"Subject: URGENT: BECS Recall — Ref XYZ123\nFrom: ops@example.com\nTo: bank@example.com\n\nPlease recall the erroneous payment…"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
              />
            )}

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
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all refined-shadow"
            >
              {widgetState === 'processing' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processing…
                </>
              ) : (
                'Process Email'
              )}
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Email is triaged, a case assembled, and actions staged for human review.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
