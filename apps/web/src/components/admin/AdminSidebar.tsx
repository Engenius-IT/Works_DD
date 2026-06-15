'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  History,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'จัดการผู้ใช้',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'จัดการบริษัท',
      href: '/admin/companies',
      icon: <Building2 className="w-5 h-5" />,
      badge: 12,
    },
    {
      label: 'จัดการงาน',
      href: '/admin/jobs',
      icon: <Briefcase className="w-5 h-5" />,
    },
    {
      label: 'สถิติและรายงาน',
      href: '/admin/reports',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'ตั้งค่า',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
    },
    {
      label: 'บันทึกกิจกรรม',
      href: '/admin/activity-logs',
      icon: <History className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for Mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white z-40 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#020263] to-[#4c4cf1] rounded-lg flex items-center justify-center font-bold text-lg text-white">
              WD
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">WorksDD Admin</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Management Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive(item.href)
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="transition-transform group-hover:scale-110">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-700 p-4 space-y-3">
          <div className="px-4 py-3 bg-slate-700/50 rounded-lg">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Logged in as</p>
            <p className="font-semibold text-sm truncate">HR Engenius</p>
            <p className="text-[10px] text-slate-400 truncate">hr@engenius.co.th</p>
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white transition-all duration-200 font-medium border border-red-600/20"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Offset */}
      <div className="lg:ml-64" />
    </>
  );
}
