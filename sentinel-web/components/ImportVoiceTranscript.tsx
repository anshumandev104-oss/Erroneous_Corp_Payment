'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';

interface ImportVoiceTranscriptProps {
  caseId: string;
}

type Tab = 'file' | 'text';

export default function ImportVoiceTranscript({ caseId }: ImportVoiceTranscriptProps) {
  const [tab, setTab]       = useState<Tab>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [file, setFile]     = useState<File | null>(null);
  const [text, setText]     = useState('');
  const fileRef             = useRef<HTMLInputElement>(null);
  const router              = useRouter();

  async function handleSubmit() {
    setError(null);

    if (tab === 'file') {
      if (!file) { setError('Please select a JSON file.'); return; }
      setLoading(true);
      try {
        const form = new FormData();
        form.append('file', file);
        const res  = await fetch(`/api/case/${caseId}/transcript/import`, { method: 'POST', body: form });
        const json = await res.json() as { error?: string };
        if (!res.ok) { setError(json.error ?? 'Upload failed.'); return; }
        toast.success('Transcript imported');
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
        router.refresh();
      } catch {
        setError('Network error. Please retry.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!text.trim()) { setError('Please paste some text.'); return; }
      setLoading(true);
      try {
        const res  = await fetch(`/api/case/${caseId}/transcript/import`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ text: text.trim() }),
        });
        const json = await res.json() as { error?: string };
        if (!res.ok) { setError(json.error ?? 'Import failed.'); return; }
        toast.success('Transcript imported');
        setText('');
        router.refresh();
      } catch {
        setError('Network error. Please retry.');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="bg-white rounded-[2rem] refined-border refined-shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
          <Mic size={14} />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Import Voice Transcript</h3>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {(['file', 'text'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === t
                ? 'bg-white text-slate-900 refined-shadow'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'file' ? <Upload size={12} /> : <FileText size={12} />}
            {t === 'file' ? 'Upload JSON' : 'Paste Text'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'file' ? (
        <div className="space-y-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Genesys Cloud Transcript (.json)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={e => { setFile(e.target.files?.[0] ?? null); setError(null); }}
            className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
          />
          {file && (
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {file.name} · {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
            Plain Text (one line per utterance)
          </label>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(null); }}
            placeholder={"Customer: I need to recall a payment sent in error.\nAgent: Understood, I'll open a case for you."}
            rows={5}
            className="w-full text-xs text-slate-700 p-3 bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-mono leading-relaxed"
          />
        </div>
      )}

      {/* Inline error */}
      {error && (
        <p className="text-[11px] text-red-500 font-medium" role="alert">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 rounded-xl text-xs font-bold transition-all bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={13} className="animate-spin" />
            Importing…
          </>
        ) : (
          <>
            <Upload size={13} />
            Import Transcript
          </>
        )}
      </button>
    </div>
  );
}
