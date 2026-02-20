'use client';

import Link from 'next/link';
import {
  LayoutDashboard, ListTodo, Briefcase, Landmark,
  Wrench, ClipboardList, Settings, ShieldCheck,
} from 'lucide-react';

export type SidebarActiveItem = 'dashboard' | 'triage' | 'cases' | 'schemes' | 'ops' | 'audit';

interface SidebarNavigationProps {
  activeItem: SidebarActiveItem;
  triageBadgeCount?: number;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

interface NavItem {
  id: SidebarActiveItem;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function SidebarNavigation({
  activeItem,
  triageBadgeCount = 0,
  userName = 'John Doe',
  userRole = 'Payment Ops II',
  userInitials = 'JD',
}: SidebarNavigationProps) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard',    href: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'triage',    label: 'Triage Queue', href: '/triage',    icon: <ListTodo size={18} /> },
    { id: 'cases',     label: 'Cases',        href: '/cases',     icon: <Briefcase size={18} /> },
    { id: 'schemes',   label: 'Schemes',      href: '/schemes',   icon: <Landmark size={18} /> },
    { id: 'ops',       label: 'Ops Tools',    href: '/ops',       icon: <Wrench size={18} /> },
    { id: 'audit',     label: 'Audit Log',    href: '/audit',     icon: <ClipboardList size={18} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-50">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-2xl tracking-tight">SENTINEL</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => {
          const isActive = activeItem === item.id;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.id === 'triage' && triageBadgeCount > 0 && (
                <span className="ml-auto bg-red-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {triageBadgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-all text-sm group"
        >
          <Settings size={16} className="group-hover:rotate-45 transition-transform" />
          <span>Settings</span>
        </Link>
        <div className="mt-6 flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-slate-600">
            {userInitials}
          </div>
          <div>
            <p className="text-sm font-semibold">{userName}</p>
            <p className="text-[11px] text-slate-500">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
