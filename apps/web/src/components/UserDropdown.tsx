'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface UserDropdownProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    role?: string;
    companyName?: string;
    companyLogo?: string;
  };
  logout: () => void;
}

export function UserDropdown({ user, logout }: UserDropdownProps) {
  const t = useTranslations('Navbar');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isEmployer = user.role === 'EMPLOYER' || user.role === 'ADMIN';
  const displayImageUrl = isEmployer && user.companyLogo ? user.companyLogo : user.avatarUrl;
  const initialChar = isEmployer && user.companyName ? user.companyName.charAt(0) : user.firstName.charAt(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger: User Info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
      >
        <span className="text-gray-700 font-medium hidden md:block">
          {t('hello')} <span className="text-(--color-primary)">{isEmployer && user.companyName ? user.companyName : user.firstName}</span>
        </span>
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-blue-100 transition-all"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-100 text-(--color-primary) flex items-center justify-center font-bold border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-blue-100 transition-all">
            {initialChar}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* User Header in Dropdown (Mobile friendly) */}
          <div className="px-4 py-3 border-b border-gray-100 md:hidden">
            <p className="text-sm font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          {user.role === 'ADMIN' && (
            <div className="py-1">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-bold"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                จัดการหลังบ้าน (Admin)
              </Link>
              <div className="border-t border-gray-100 my-1"></div>
            </div>
          )}

          {/* Jobseeker-only menu items */}
          {!isEmployer && (
            <>
              <div className="py-1">
                <Link
                  href="/profilefull"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-(--color-primary) transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('profile')}
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-(--color-primary) transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('editProfile')}
                </Link>

                <Link
                  href="/saved-jobs"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-(--color-primary) transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('savedJobs')}
                </Link>
                <Link
                  href="/applications"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-(--color-primary) transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {t('applications')}
                </Link>
              </div>

              <div className="border-t border-gray-100 my-1"></div>
            </>
          )}

          <div className="py-1">
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              {t('logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
