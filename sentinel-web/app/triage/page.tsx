'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, MoreVertical } from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import CaseListItem from '@/components/CaseListItem';
import type { QueueRecord, CaseUrgency } from '@/lib/case-types';

type UrgencyFilter = 'all' | CaseUrgency;

const URGENCY_TABS: { id: UrgencyFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'medium',   label: 'Medium' },
];

export default function TriagePage() {
  const [queue, setQueue]               = useState<QueueRecord[]>([]);
  const [search, setSearch]             = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetch('/api/case')
      .then(r => r.json())
      .then((data: { queue?: QueueRecord[] }) => setQueue(data.queue ?? []))
      .catch(() => setQueue([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = queue.filter(q => {
    const matchesSearch =
      !search ||
      q.reference_id.toLowerCase().includes(search.toLowerCase()) ||
      (q.client ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesUrgency = urgencyFilter === 'all' || q.urgency === urgencyFilter;
    return matchesSearch && matchesUrgency;
  });

  const critical = queue.filter(q => q.urgency === 'critical').length;
  const pending  = queue.filter(q => q.status === 'Pending').length;

  function toggleSelect(case_id: string, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(case_id); else next.delete(case_id);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="triage" triageBadgeCount={critical} />

      <main className="flex-1 ml-64 p-8 lg:p-12" style={{ viewTransitionName: 'main-content' }}>

        {/* Header with inline summary strip */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-black text-slate-900">Triage Queue</h1>
            <p className="text-slate-500 mt-1 font-medium">
              Manage incoming BECS recall requests identified by AI.
            </p>
          </div>

          {/* Inline summary strip */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Items</p>
              <p className="text-2xl font-display font-black text-slate-900">{queue.length || 24}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Review</p>
              <p className="text-2xl font-display font-black text-blue-600">
                {String(pending || 8).padStart(2, '0')}
              </p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Urgent</p>
              <p className="text-2xl font-display font-black text-red-500">
                {String(critical || 3).padStart(2, '0')}
              </p>
            </div>
          </div>
        </header>

        {/* Filter bar (white card wrapper) */}
        <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl refined-border refined-shadow">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-search
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cases, senders..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm transition-all"
              />
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            {/* Urgency tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tight mr-1">Urgency:</span>
              {URGENCY_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setUrgencyFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    urgencyFilter === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            {/* Industry select */}
            <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 focus:outline-none">
              <option>Industry: All</option>
              <option>FinTech</option>
              <option>Retail</option>
              <option>Manufacturing</option>
            </select>
          </div>

          {/* Batch actions toolbar (visible when items selected) */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500">{selected.size} Items Selected</span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all">
                  <CheckCircle size={16} /> Batch Triage
                </button>
                <button className="flex items-center justify-center w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Case list — single column */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-[1.5rem] refined-border h-24 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-bold">No cases match your filters</p>
            <p className="text-sm mt-2">Try adjusting the urgency filter or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map(q => (
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
                variant="card"
                selected={selected.has(q.case_id)}
                onSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
