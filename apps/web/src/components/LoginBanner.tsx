'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LoginBanner() {
  const t = useTranslations('LoginBanner');

  return (
    <section className="relative z-0 w-full bg-linear-to-r from-[#eef9fb] to-white py-12 md:py-20 overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10 lg:gap-20">
          {/* Left Column: Form */}
          <div className="w-full md:w-1/2 flex flex-col items-start pt-4 lg:pt-0">
            <h2 className="text-3xl md:text-4xl lg:text-[40px] font-semibold text-neutral-900 mb-8 tracking-tight">
              {t('title')}
            </h2>

            <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-6 md:p-8 border border-gray-100">
              <p className="text-gray-500 mb-6 text-[15px]">
                {t('subtitle')}
              </p>

              {/* Google Login Button */}
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'}/api/v1/auth/google`}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/0o/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t('googleLogin')}
              </a>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="grow border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-400">{t('or')}</span>
                <div className="grow border-t border-gray-200"></div>
              </div>

              {/* Login Button */}
              <Link href="/th/login" className="flex w-full">
                <button className="w-full bg-[#020263] hover:bg-[#00003D] text-white rounded-lg py-3 px-4 font-medium transition-colors shadow-sm">
                  {t('login')}
                </button>
              </Link>

              {/* Register Link */}
              <div className="mt-6 flex items-center gap-2 text-[15px] text-gray-500">
                <User size={18} className="text-gray-400" />
                <span>{t('noAccount')}</span>
                <Link href="/th/register" className="text-gray-900 font-medium hover:underline">
                  {t('register')}
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-end relative">
            <div className="relative w-full max-w-[600px] aspect-4/3 lg:aspect-auto lg:h-[550px]">
              <Image
                src="/images/Hero1.png"
                alt="Job Seeker"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
