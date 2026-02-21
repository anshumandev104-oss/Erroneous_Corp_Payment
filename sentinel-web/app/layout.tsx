import type { Metadata } from 'next';
import '../styles/globals.css';
import { ToastContainer } from '@/components/Toast';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';

export const metadata: Metadata = {
  title: 'SENTINEL — Payment Recall Ops',
  description: 'BECS payment recall triage and case management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Global non-blocking toast notifications */}
        <ToastContainer />
        {/* Global keyboard shortcuts: / search, g→d/t/c/a/s/o navigate */}
        <KeyboardShortcuts />
      </body>
    </html>
  );
}
