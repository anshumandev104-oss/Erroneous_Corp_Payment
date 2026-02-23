'use client';
import { useState } from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/Toast';

interface SeedTranscriptButtonProps { caseId: string; }

export default function SeedTranscriptButton({ caseId }: SeedTranscriptButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSeed() {
    setLoading(true);
    try {
      const res  = await fetch(`/api/case/${caseId}/transcript/seed`, { method: 'POST' });
      const json = await res.json() as { error?: string };
      if (!res.ok) { toast.error(json.error ?? 'Seed failed.'); return; }
      toast.success('Sample transcript seeded');
      router.refresh();
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-1 pt-1">
      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
        Dev only
      </p>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <FlaskConical size={14} />}
        Seed Sample Genesys Transcript
      </button>
    </div>
  );
}
