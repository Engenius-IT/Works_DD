'use client';

import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useTransition } from 'react';
import { UserDropdown } from './UserDropdown';
import { NotificationBell } from './NotificationBell';
import { SubNavbar } from './SubNavbar';
import { useSearchParams } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isProfileSubmenuOpen, setIsProfileSubmenuOpen] = useState(false);

  const t = useTranslations('Navbar');
  const tSub = useTranslations('NavbarSub');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
const searchParams = useSearchParams();

const currentUrl =
  searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  
  const [isPending, startTransition] = useTransition();

  const LOCALE_COOKIE = 'NEXT_LOCALE';
  const LOCALE_STORAGE_KEY = 'jobdd_locale';
  const SUPPORTED_LOCALES = ['th', 'en'] as const;

  const isSupportedLocale = (value: string): value is (typeof SUPPORTED_LOCALES)[number] =>
    (SUPPORTED_LOCALES as readonly string[]).includes(value);

  const getCookie = (name: string) => {
    const parts = document.cookie.split(';').map((p) => p.trim());
    const found = parts.find((p) => p.startsWith(`${name}=`));
    if (!found) return null;
    return decodeURIComponent(found.slice(name.length + 1));
  };

  const persistLocale = (nextLocale: string) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // ignore
    }

    const maxAge = 60 * 60 * 24 * 365;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  };

  const switchLanguage = (nextLocale: string) => {
    if (nextLocale === locale) {
      setIsMenuOpen(false);
      return;
    }

    persistLocale(nextLocale);

    startTransition(() => {
      window.location.href = `/${nextLocale}${currentUrl}`;
    });

    setIsMenuOpen(false);
  };

  useEffect(() => {
    let preferred: string | null = null;

    try {
      preferred = localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      // ignore
    }

    if (!preferred) {
      preferred = getCookie(LOCALE_COOKIE);
    }

    if (!preferred) {
      const browser = (navigator.languages?.[0] || navigator.language || '').toLowerCase();
      preferred = browser.startsWith('en') ? 'en' : null;
    }

    if (preferred && isSupportedLocale(preferred) && preferred !== locale) {
      persistLocale(preferred);
      startTransition(() => {
        window.location.href = `/${preferred}${currentUrl}`;
      });
    }
  }, [locale, pathname, router, startTransition]);

  useEffect(() => {
    const origin = window.location.origin;
    const path = pathname;

    const urlFor = (l: 'th' | 'en') => `${origin}/${l}${path === '/' ? '' : path}`;

    const existing = document.head.querySelectorAll('link[data-jobdd-hreflang="1"]');
    existing.forEach((el) => el.remove());

    const entries: Array<{ hreflang: string; href: string }> = [
      { hreflang: 'th', href: urlFor('th') },
      { hreflang: 'en', href: urlFor('en') },
      { hreflang: 'x-default', href: urlFor('th') },
    ];

    entries.forEach(({ hreflang, href }) => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      link.setAttribute('href', href);
      link.setAttribute('data-jobdd-hreflang', '1');
      document.head.appendChild(link);
    });

    return () => {
      const current = document.head.querySelectorAll('link[data-jobdd-hreflang="1"]');
      current.forEach((el) => el.remove());
    };
  }, [pathname]);

  return (
    <header className=" bg-[#ffffff] sticky top-0 z-50 drop-shadow-xl">
      <div className="max-w-(--container-max) mx-auto px-4 py-0 flex items-center justify-between">
        {/* Left Side: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {!logoError ? (
              <img
                src="/images/logo_jobdd_main.png"
                alt="JobDD Logo"
                className="h-20 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--color-primary) to-(--color-secondary) flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-all">
                  J
                </div>
                <h1 className="text-2xl font-bold text-(--color-primary) tracking-tight">
                  Job<span className="text-(--color-secondary)">Sabuy</span>
                </h1>
              </div>
            )}
          </Link>
        </div>

        {/* Right Side: Auth & Language */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            {user?.role !== 'EMPLOYER' && user?.role !== 'ADMIN' && (
              <Link
                href="/ai-job-matcher"
                className="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 hover:from-violet-500 hover:to-fuchsia-500 active:scale-95"
              >
                <svg
                  className="w-4 h-4 animate-pulse"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
                {t('aiJobMatcher')}
              </Link>
            )}
            {user ? (
              // Logged In State
              <>
                {(user.role === 'EMPLOYER' || user.role === 'ADMIN') && (
                  <Link
                    href="/employer/dashboard"
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-sm px-4 py-2 rounded-xl shadow shadow-amber-300/40 transition-all hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    {t('employerBackend')}
                  </Link>
                )}
                <UserDropdown user={{ ...user, role: user.role }} logout={logout} />
              </>
            ) : (
              // Guest State
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-lg text-[#000000] font-medium hover:text-[#E00016] transition-all"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 rounded-lg bg-[#A80010] text-white font-medium shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {t('register')}
                </Link>
                <div className="h-6 w-px bg-gray-200 mx-1"></div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {user && (
              <div className="flex items-center">
                <NotificationBell />
              </div>
            )}

            {/* Desktop Language Switcher */}
            <div className="hidden md:flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button
                onClick={() => switchLanguage('th')}
                disabled={isPending}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${locale === 'th' ? 'bg-white text-(--color-primary) shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                TH
              </button>
              <button
                onClick={() => switchLanguage('en')}
                disabled={isPending}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${locale === 'en' ? 'bg-white text-(--color-primary) shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                EN
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-600 focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 p-4 space-y-2 bg-white shadow-lg max-h-[80vh] overflow-y-auto">
          {/* Mobile Language Switcher */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('languageSwitcher')}</span>
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
              <button
                onClick={() => switchLanguage('th')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${locale === 'th' ? 'bg-white text-(--color-primary) shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                TH
              </button>
              <button
                onClick={() => switchLanguage('en')}
                disabled={isPending}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${locale === 'en' ? 'bg-white text-(--color-primary) shadow-sm ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                EN
              </button>
            </div>
          </div>
          {user?.role !== 'EMPLOYER' && user?.role !== 'ADMIN' && (
            <Link
              href="/ai-job-matcher"
              className="flex items-center justify-center gap-2 mx-4 py-3 bg-linear-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/30 active:scale-95 transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg
                className="w-5 h-5 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              {t('aiJobMatcher')}
            </Link>
          )}

          {/* Mobile Main Navigation Links */}
          <div className="py-2 space-y-1">
            {user?.role === 'EMPLOYER' || user?.role === 'ADMIN' ? (
              <>
                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('home')}
                </Link>
                <Link
                  href="/resumes"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('searchResumes')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('home')}
                </Link>
                <Link
                  href="/jobs"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('quickSearch')}
                </Link>
                <Link
                  href="/jobs"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('findJobs')}
                </Link>

                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {tSub('regionalJobs')}
                </div>
                <div className="grid grid-cols-2 gap-1 px-2">
                  {['central', 'east', 'north', 'northeast', 'south', 'west'].map((region) => (
                    <Link
                      key={region}
                      href={`/all_group_job/${region}`}
                      className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {tSub(`regionalJobsSub.${region}`)}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="px-2 pt-2 border-t border-gray-50 mt-2">
              <Link
                href="/contact-us"
                className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {tSub('aboutSub.contact')}
              </Link>
            </div>
          </div>

          <hr className="border-gray-100 my-2" />
          {user ? (
            <>
              <div className="px-4 py-2 text-gray-500 text-sm">
                {t('hello')}{' '}
                {user.role === 'EMPLOYER' && user.companyName ? user.companyName : user.firstName}
              </div>
              {(user.role === 'EMPLOYER' || user.role === 'ADMIN') && (
                <Link
                  href="/employer/dashboard"
                  className="flex items-center gap-2 mx-2 px-4 py-2 bg-amber-400 text-gray-900 font-bold text-sm rounded-xl"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {t('employerBackend')}
                </Link>
              )}

              {user.role === 'JOBSEEKER' && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsProfileSubmenuOpen(!isProfileSubmenuOpen)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    <span>{t('profile')}</span>
                    <svg
                      className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileSubmenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileSubmenuOpen && (
                    <div className="pl-6 pr-2 py-1 space-y-1 bg-gray-50/60 rounded-lg border-l-2 border-[#A80010]/30">
                      <Link
                        href="/profilefull"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsProfileSubmenuOpen(false);
                        }}
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsProfileSubmenuOpen(false);
                        }}
                      >
                        {t('editProfile')}
                      </Link>
                      <Link
                        href="/saved-jobs"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsProfileSubmenuOpen(false);
                        }}
                      >
                        {t('savedJobs')}
                      </Link>
                      <Link
                        href="/applications"
                        className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsProfileSubmenuOpen(false);
                        }}
                      >
                        {t('applications')}
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                  setIsProfileSubmenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="block px-4 py-2 text-(--color-primary) font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>
      )}

      {/* Sub Navigation Bar */}
      <SubNavbar userRole={user?.role} />
    </header>
  );
}