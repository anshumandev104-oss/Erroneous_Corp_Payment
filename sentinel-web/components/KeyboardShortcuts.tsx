'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const NAV_MAP: Record<string, string> = {
  d: '/dashboard',
  t: '/triage',
  c: '/cases',
  a: '/audit',
  s: '/schemes',
  o: '/ops-tools',
};

/**
 * Global keyboard shortcuts — mount once in layout.tsx. Renders nothing.
 *
 * Shortcuts:
 *   /         → focus the [data-search] input on the current page
 *   g → d     → navigate to /dashboard
 *   g → t     → navigate to /triage
 *   g → c     → navigate to /cases
 *   g → a     → navigate to /audit
 *   g → s     → navigate to /schemes
 *   g → o     → navigate to /ops-tools
 *
 * Chords time out after 800 ms. Shortcuts are ignored when the user is
 * typing in an input, textarea, select, or contenteditable element.
 */
export default function KeyboardShortcuts() {
  const router   = useRouter();
  const pendingG = useRef(false);
  const timer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function isTyping(e: KeyboardEvent): boolean {
      const el = e.target as HTMLElement;
      return (
        el.tagName === 'INPUT'    ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT'   ||
        el.isContentEditable
      );
    }

    function handler(e: KeyboardEvent) {
      // "/" → focus search input (even when not typing)
      if (e.key === '/') {
        if (!isTyping(e)) {
          e.preventDefault();
          const el = document.querySelector<HTMLInputElement>('[data-search]');
          el?.focus();
        }
        return;
      }

      if (isTyping(e)) return;

      // "g" starts a navigation chord
      if (e.key === 'g') {
        pendingG.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { pendingG.current = false; }, 800);
        return;
      }

      // "g" + letter → push route
      if (pendingG.current && NAV_MAP[e.key]) {
        pendingG.current = false;
        if (timer.current) clearTimeout(timer.current);
        router.push(NAV_MAP[e.key]);
      }
    }

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [router]);

  return null;
}
