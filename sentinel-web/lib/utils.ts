import type { CaseUrgency } from './case-types';

export function generateCaseId(reference_id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const hex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `CASE-${reference_id}-${date}-${hex}`;
}

export function generateActionId(): string {
  return `ACTION-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
}

export function formatAUD(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Returns minutes between now and the given ISO cutoff. */
export function computePriorityScore(cutoff_due: string): number {
  const ms = new Date(cutoff_due).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 60000));
}

/** Returns HH:MM:SS countdown string. */
export function computeSLACountdown(cutoff_due: string): string {
  const ms = new Date(cutoff_due).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/** Strips PII patterns for audit-safe source_email strings. */
export function sanitizeEmailBody(body: string): string {
  return body
    .replace(/\b\d{6,16}\b/g, '[REDACTED]')               // account/reference numbers
    .replace(/\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b/gi, '[EMAIL]') // emails in body
    .slice(0, 200);
}

export function getUrgencyColor(urgency: CaseUrgency): string {
  switch (urgency) {
    case 'critical': return 'bg-red-500';
    case 'high':     return 'bg-orange-400';
    case 'medium':   return 'bg-blue-400';
    case 'low':      return 'bg-slate-400';
  }
}

export function getUrgencyBadgeClass(urgency: CaseUrgency): string {
  switch (urgency) {
    case 'critical': return 'bg-red-100 text-red-700 border border-red-200';
    case 'high':     return 'bg-orange-100 text-orange-700 border border-orange-200';
    case 'medium':   return 'bg-blue-100 text-blue-700 border border-blue-200';
    case 'low':      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'In Review': return 'bg-amber-100 text-amber-700';
    case 'Pending':   return 'bg-slate-100 text-slate-600';
    case 'Triaged':   return 'bg-green-100 text-green-700';
    case 'Resolved':  return 'bg-emerald-100 text-emerald-700';
    default:          return 'bg-slate-100 text-slate-600';
  }
}

export function formatRelativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

