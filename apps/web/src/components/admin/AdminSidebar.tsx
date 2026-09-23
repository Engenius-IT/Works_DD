'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  BarChart3,
  Briefcase,
  Building2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuGroups: MenuGroup[] = [
    {
      label: 'ภาพรวม',
      items: [{ label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> }],
    },
    {
      label: 'จัดการระบบ',
      items: [
        { label: 'จัดการผู้ใช้', href: '/admin/users', icon: <Users className="h-[18px] w-[18px]" /> },
        { label: 'ตรวจสอบเอกสารบริษัท', href: '/admin/companies/verify', icon: <Building2 className="h-[18px] w-[18px]" />, badge: 12 },
        { label: 'จัดการงาน', href: '/admin/jobs', icon: <Briefcase className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: 'รายงานและการเงิน',
      items: [
        { label: 'สถิติและรายงาน', href: '/admin/reports', icon: <BarChart3 className="h-[18px] w-[18px]" /> },
        { label: 'ตรวจสอบการชำระเงิน', href: '/admin/payments', icon: <Receipt className="h-[18px] w-[18px]" /> },
        { label: 'บันทึกกิจกรรม', href: '/admin/activity-logs', icon: <History className="h-[18px] w-[18px]" /> },
      ],
    },
    {
      label: 'ระบบ',
      items: [{ label: 'ตั้งค่า', href: '/admin/settings', icon: <Settings className="h-[18px] w-[18px]" /> }],
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Admin User';
  const email = user?.email || 'admin@worksdd.com';
  const initials = displayName.slice(0, 2).toUpperCase();

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="เปิดเมนูแอดมิน"
        onClick={() => setIsOpen((open) => !open)}
        className="fixed left-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg lg:hidden"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isOpen && <button type="button" aria-label="ปิดเมนู" onClick={closeMenu} className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col overflow-hidden bg-[#0b152b] text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative border-b border-white/10 px-5 pb-5 pt-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-sm font-black shadow-lg shadow-indigo-900/40">WD<span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b152b] bg-emerald-400" /></div>
            <div className="min-w-0"><p className="truncate text-[17px] font-black tracking-tight">WorksDD Admin</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Management Panel</p></div>
          </div>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-indigo-300/10 bg-indigo-400/10 px-3 py-2 text-[11px] font-bold text-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />ระบบแอดมินออนไลน์</div>
        </div>

        <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {menuGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return <Link key={item.href} href={item.href} onClick={closeMenu} className={`group relative flex items-center justify-between rounded-xl px-3 py-3 transition-all duration-200 ${active ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-950/30' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'}`}>
                    {active && <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-cyan-300" />}
                    <span className="flex min-w-0 items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${active ? 'bg-white/15 text-white' : 'bg-white/[0.04] text-slate-400 group-hover:bg-white/10 group-hover:text-slate-200'}`}>{item.icon}</span><span className="truncate text-sm font-bold">{item.label}</span></span>
                    {item.badge && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">{item.badge}</span>}
                  </Link>;
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xs font-black text-slate-200">{initials}</div>
            <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Logged in as</p><p className="truncate text-sm font-black text-white">{displayName}</p><p className="truncate text-[11px] text-slate-400">{email}</p></div>
          </div>
          <button type="button" onClick={() => { logout(); closeMenu(); }} className="flex w-full items-center gap-3 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-3 text-sm font-black text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200"><LogOut className="h-[18px] w-[18px]" />ออกจากระบบ</button>
        </div>
      </aside>

      <div className="hidden w-[280px] shrink-0 lg:block" />
    </>
  );
}
