'use client';

import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import SidebarNavigation from '@/components/SidebarNavigation';
import CaseListItem from '@/components/CaseListItem';
import type { QueueRecord, CaseUrgency } from '@/lib/case-types';

type UrgencyFilter = 'all' | CaseUrgency;

export default function TriagePage() {
  const [queue, setQueue]         = useState<QueueRecord[]>([]);
  const [search, setSearch]       = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>('all');
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/case')
      .then(r => r.json())
      .then((data: { queue?: QueueRecord[] }) => {
        setQueue(data.queue ?? []);
      })
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

  const URGENCY_TABS: { id: UrgencyFilter; label: string }[] = [
    { id: 'all',      label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'high',     label: 'High' },
    { id: 'medium',   label: 'Medium' },
    { id: 'low',      label: 'Low' },
  ];

  return (
    <div className="flex min-h-screen">
      <SidebarNavigation activeItem="triage" triageBadgeCount={critical} />

      <main className="flex-1 ml-64 p-10" style={{ viewTransitionName: 'main-content' }}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="font-display font-bold text-3xl text-slate-900 tracking-tight">
              Triage Queue
            </h1>
            <p className="text-sm text-slate-500 mt-1">Review and action incoming recall requests</p>
          </div>
          <button className="w-10 h-10 flex items-center justify-center bg-white rounded-full refined-border refined-shadow hover:bg-slate-50 transition-all">
            <Bell size={18} className="text-slate-600" />
          </button>
        </header>

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Items',     value: queue.length,  sub: 'in queue'         },
            { label: 'Pending Review',  value: pending,       sub: 'awaiting action'  },
            { label: 'Urgent',          value: critical,      sub: 'critical priority' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-3xl refined-border refined-shadow px-8 py-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-4xl font-display font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by reference or client…"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {URGENCY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setUrgencyFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  urgencyFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <span className="ml-auto text-xs font-bold text-blue-600">
              {selected.size} selected
            </span>
          )}
        </div>

        {/* Case cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl refined-border h-64 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg font-bold">No cases match your filters</p>
            <p className="text-sm mt-2">Try adjusting the urgency filter or search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
