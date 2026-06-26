'use client';

import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useTransition } from 'react';
import { UserDropdown } from './UserDropdown';
import { NotificationBell } from './NotificationBell';
import { SubNavbar } from './SubNavbar';

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
      router.replace(pathname, { locale: nextLocale });
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
        router.replace(pathname, { locale: preferred });
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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-(--container-max) mx-auto px-4 py-2 flex items-center justify-between">
        {/* Left Side: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {!logoError ? (
              <img
                src="/images/logo_jobdd_main.png"
                alt="JobDD Logo"
                className="h-16 md:h-18 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#A80010] flex items-center justify-center text-white font-bold text-xl shadow-sm">
                  J
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Job<span className="text-[#A80010]">Sabuy</span>
                </h1>
              </div>
            )}
          </Link>
        </div>

        {/* Right Side: Auth & Language */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            {user?.role !== 'EMPLOYER' && (
              <Link
                href="/ai-job-matcher"
                className="group inline-flex items-center gap-2 rounded-full bg-purple-50 px-5 py-2.5 text-sm font-semibold text-purple-600 transition-all hover:-translate-y-0.5 hover:bg-purple-100 active:scale-95"
              >
                <svg
                  className="w-4 h-4"
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
                {user.role === 'EMPLOYER' && (
                  <Link
                    href="/employer/dashboard"
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-gray-900 font-semibold text-sm px-5 py-2.5 rounded-full shadow-sm transition-all hover:-translate-y-0.5 active:scale-95"
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
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-gray-600 font-medium hover:text-gray-900 transition-colors"
                >
                  {t('login')}
                </Link>
                <div className="w-px h-5 bg-gray-200"></div>
                <Link
                  href="/register"
                  className="px-6 py-2 rounded-full bg-red-50 hover:bg-red-100 text-[#A80010] font-medium transition-all hover:-translate-y-0.5"
                >
                  {t('register')}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            {user && (
              <div className="flex items-center">
                <NotificationBell />
              </div>
            )}

            {/* Desktop Language Switcher */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => switchLanguage('th')}
                disabled={isPending}
                className={`text-xs font-bold transition-colors ${locale === 'th' ? 'text-[#A80010]' : 'text-gray-400 hover:text-gray-700'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                TH
              </button>
              <span className="text-gray-300 text-xs mx-1">|</span>
              <button
                onClick={() => switchLanguage('en')}
                disabled={isPending}
                className={`text-xs font-bold transition-colors ${locale === 'en' ? 'text-[#A80010]' : 'text-gray-400 hover:text-gray-700'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                EN
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors"
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
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[85vh] border-t border-gray-100 bg-white shadow-xl' : 'max-h-0'}`}
      >
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Mobile Language Switcher */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">{t('languageSwitcher')}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => switchLanguage('th')}
                disabled={isPending}
                className={`text-sm font-bold transition-colors ${locale === 'th' ? 'text-[#A80010]' : 'text-gray-400'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                TH
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => switchLanguage('en')}
                disabled={isPending}
                className={`text-sm font-bold transition-colors ${locale === 'en' ? 'text-[#A80010]' : 'text-gray-400'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                EN
              </button>
            </div>
          </div>

          {user?.role !== 'EMPLOYER' && (
            <Link
              href="/ai-job-matcher"
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple-50 text-purple-600 rounded-full font-semibold active:scale-95 transition-all hover:bg-purple-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg
                className="w-5 h-5"
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
          <div className="space-y-1">
            {user?.role === 'EMPLOYER' ? (
              <>
                <Link
                  href="/"
                  className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('home')}
                </Link>
                <Link
                  href="/resumes"
                  className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('searchResumes')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('home')}
                </Link>
                <Link
                  href="/jobs"
                  className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('quickSearch')}
                </Link>
                <Link
                  href="/jobs"
                  className="block py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {tSub('findJobs')}
                </Link>

                <div className="pt-4 pb-2">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {tSub('regionalJobs')}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['central', 'east', 'north', 'northeast', 'south', 'west'].map((region) => (
                      <Link
                        key={region}
                        href={`/all_group_job/${region}`}
                        className="py-2 text-sm text-gray-600 bg-gray-50 rounded-lg text-center font-medium transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {tSub(`regionalJobsSub.${region}`)}
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-100">
              <Link
                href="/contact-us"
                className="block py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {tSub('aboutSub.contact')}
              </Link>
            </div>
          </div>

          {user ? (
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">
                  {(user.role === 'EMPLOYER' && user.companyName ? user.companyName : user.firstName).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">{t('hello')}</div>
                  <div className="font-medium text-gray-900">{user.role === 'EMPLOYER' && user.companyName ? user.companyName : user.firstName}</div>
                </div>
              </div>
              
              {user.role === 'EMPLOYER' && (
                <Link
                  href="/employer/dashboard"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-amber-400 text-gray-900 font-bold rounded-full shadow-sm active:scale-95 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileSubmenuOpen(!isProfileSubmenuOpen)}
                    className="w-full flex items-center justify-between py-2 text-gray-700 font-medium transition-colors"
                  >
                    <span>{t('profile')}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isProfileSubmenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`overflow-hidden transition-all duration-300 ${isProfileSubmenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="pl-4 space-y-3 py-2 border-l-2 border-gray-100 ml-2">
                      <Link
                        href="/profilefull"
                        className="block text-sm text-gray-600 hover:text-[#A80010] font-medium"
                        onClick={() => { setIsMenuOpen(false); setIsProfileSubmenuOpen(false); }}
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        href="/profile"
                        className="block text-sm text-gray-600 hover:text-[#A80010] font-medium"
                        onClick={() => { setIsMenuOpen(false); setIsProfileSubmenuOpen(false); }}
                      >
                        {t('editProfile')}
                      </Link>
                      <Link
                        href="/saved-jobs"
                        className="block text-sm text-gray-600 hover:text-[#A80010] font-medium"
                        onClick={() => { setIsMenuOpen(false); setIsProfileSubmenuOpen(false); }}
                      >
                        {t('savedJobs')}
                      </Link>
                      <Link
                        href="/applications"
                        className="block text-sm text-gray-600 hover:text-[#A80010] font-medium"
                        onClick={() => { setIsMenuOpen(false); setIsProfileSubmenuOpen(false); }}
                      >
                        {t('applications')}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                  setIsProfileSubmenuOpen(false);
                }}
                className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-semibold transition-colors mt-4"
              >
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <Link
                href="/login"
                className="flex items-center justify-center py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="flex items-center justify-center py-3 bg-red-50 text-[#A80010] hover:bg-red-100 rounded-full font-semibold transition-all active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <SubNavbar userRole={user?.role} />
    </header>
  );
}