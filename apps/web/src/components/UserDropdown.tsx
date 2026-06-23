'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface UserDropdownProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    role: string;
    companyName?: string;
    companyLogo?: string;
    companySlug?: string;
  };
  logout: () => void;
}

export function UserDropdown({ user, logout }: UserDropdownProps) {
  const t = useTranslations('Navbar');
  const [isOpen, setIsOpen] = useState(false);
  const [companySlug, setCompanySlug] = useState(user.companySlug || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEmployer = user.role === 'EMPLOYER';
  const displayImageUrl = isEmployer && user.companyLogo ? user.companyLogo : user.avatarUrl;
  const initialChar =
    isEmployer && user.companyName ? user.companyName.charAt(0) : user.firstName.charAt(0);

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

  useEffect(() => {
    if (!isEmployer || companySlug) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${API_URL}/companies/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.slug) {
          setCompanySlug(data.slug);
        }
      })
      .catch(() => {});
  }, [isEmployer, companySlug]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
      >
        <span className="text-gray-700 font-medium hidden md:block">
          {t('hello')}{' '}
          <span className="text-(--color-primary)">
            {isEmployer && user.companyName ? user.companyName : user.firstName}
          </span>
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

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-3 border-b border-gray-100 md:hidden">
            <p className="text-sm font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

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

          {isEmployer && (
            <>
              <div className="py-1">
                <Link
                  href={`/Companyprofile?slug=${companySlug}`}
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-(--color-primary) transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  ดูโปรไฟล์บริษัท
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

