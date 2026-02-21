'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id:      string;
  type:    ToastType;
  message: string;
}

// ── Module-level event bus — fire-and-forget from anywhere ───────────────────
const listeners = new Set<(toast: ToastItem) => void>();

function dispatch(t: Omit<ToastItem, 'id'>) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  listeners.forEach(fn => fn({ ...t, id }));
}

/** Import this and call `toast.success(...)`, `toast.error(...)`, `toast.info(...)` from any client component. */
export const toast = {
  success: (message: string) => dispatch({ type: 'success', message }),
  error:   (message: string) => dispatch({ type: 'error',   message }),
  info:    (message: string) => dispatch({ type: 'info',    message }),
};

// ── Per-type styling ─────────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />,
  error:   <AlertTriangle size={16} className="text-red-500 shrink-0" />,
  info:    <Info size={16} className="text-blue-600 shrink-0" />,
};

const BORDER: Record<ToastType, string> = {
  success: 'border-emerald-200',
  error:   'border-red-200',
  info:    'border-blue-200',
};

// ── ToastContainer (mount once in layout.tsx) ────────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (t: ToastItem) => {
      setToasts(prev => [...prev, t]);
      // Auto-dismiss after 4 s
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, 4000);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          style={{ animation: 'toast-in 0.3s ease-out both' }}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white rounded-2xl refined-shadow refined-border border ${BORDER[t.type]} min-w-[280px] max-w-sm`}
        >
          {ICONS[t.type]}
          <p className="text-sm font-medium text-slate-800 flex-1">{t.message}</p>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
