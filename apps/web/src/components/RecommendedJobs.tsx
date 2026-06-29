'use client';

import React, { useEffect, useState } from 'react';
import { Link } from '@/i18n/routing';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CheckCircle2, Bookmark } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Job {
  id: string;
  title: string;
  slug: string;
  locationProvince: string;
  locationDistrict?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible: boolean;
  jobType: string;
  workModel: string;
  createdAt: string;
  category?: string;
  positions?: number;
  isQuickApply?: boolean;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isVerified?: boolean;
    verificationStatus?: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  };
}

function timeAgo(dateStr: string, t: any) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('justPosted');
  if (mins < 60) return t('minsAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('hrsAgo', { count: hrs });
  return t('daysAgo', { count: Math.floor(hrs / 24) });
}

function getJobTypeText(type: string, t: any) {
  try {
    return t(`jobTypes.${type}`);
  } catch {
    return type;
  }
}

function salaryText(job: Job, t: any) {
  if (!job.salaryVisible || (!job.salaryMin && !job.salaryMax)) return t('salaryHidden');
  const currency = t('currency');
  if (job.salaryMin && job.salaryMax)
    return `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} ${currency}`;
  if (job.salaryMin) return `${job.salaryMin.toLocaleString()}+ ${currency}`;
  return `${t('upTo')} ${job.salaryMax!.toLocaleString()} ${currency}`;
}

function isVerifiedCompany(company: Job['company']) {
  return company.isVerified || company.verificationStatus === 'VERIFIED';
}

// Imported CompanyLogo at top of file

export function RecommendedJobs() {
  const locale = useLocale();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [toastSlug, setToastSlug] = useState<string | null>(null);
  const t = useTranslations('RecommendedJobs');

  // Load saved slugs from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    setSavedSlugs(saved);
  }, []);

  const toggleSave = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    let updated: string[];
    if (saved.includes(slug)) {
      updated = saved.filter((s) => s !== slug);
      setSavedSlugs(updated);
    } else {
      updated = [...saved, slug];
      setSavedSlugs(updated);
    }
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setToastSlug(slug);
    setTimeout(() => setToastSlug(null), 2000);
  };

  useEffect(() => {
    fetch(`${API_URL}/jobs/recommended/today?limit=6`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        // Deduplicate by id to prevent duplicate React keys
        const unique = Array.from(
          new Map((list as Job[]).map((j) => [j.id, j])).values(),
        );
        setJobs(unique);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-(--container-max) mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black uppercase mb-2">
              {t('title')}
            </h2>
            <p className="text-gray-500 text-lg">
              {t('subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-3xl p-6 animate-pulse bg-white"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-4 bg-gray-100 rounded w-full mb-6" />
                <div className="flex justify-end">
                  <div className="h-9 bg-gray-200 rounded-full w-36" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/jobs"
              className="bg-[#020263] hover:opacity-90 text-white text-lg font-medium py-3 px-10 rounded-full transition-opacity shadow-md"
            >
              {t('viewAll')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (jobs.length === 0) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-(--container-max) mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-black uppercase mb-2">
              {t('title')}
            </h2>
            <p className="text-gray-500 text-lg">
              {t('subtitle')}
            </p>
          </div>
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p>{t('noJobs')}</p>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/jobs"
              className="bg-[#020263] hover:opacity-90 text-white text-lg font-medium py-3 px-10 rounded-full transition-opacity shadow-md"
            >
              {t('viewAll')}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      {/* Toast */}
      {toastSlug && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold bg-[#020263] text-white transition-all duration-300 animate-fade-in">
          <Bookmark
            className={`w-4 h-4 ${savedSlugs.includes(toastSlug) ? 'fill-white' : 'fill-none'}`}
          />
          {savedSlugs.includes(toastSlug) ? 'บันทึกงานแล้ว!' : 'ยกเลิกการบันทึกแล้ว'}
        </div>
      )}

      <div className="max-w-(--container-max) mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black uppercase mb-2">
            {t('title')}
          </h2>
          <p className="text-gray-500 text-lg">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => {
            const isSaved = savedSlugs.includes(job.slug);
            return (
              <div key={job.id} className="relative group">
                <Link
                  href={`/jobs/${job.slug}`}
                  className="border border-gray-300 rounded-3xl p-6 relative hover:shadow-lg transition-shadow bg-white flex flex-col cursor-pointer z-10 group-hover:z-20"
                >
                  {/* Urgent Badge - Corner Ribbon Style */}
                  {job.isQuickApply && (
                    <div className="absolute -top-[1px] -right-[1px] w-[96px] h-[96px] overflow-hidden pointer-events-none z-30">
                      <div 
                        className="absolute top-[20px] right-[-30px] w-[140px] bg-[#E00016] text-white text-[13px] sm:text-[14px] font-black py-2 text-center rotate-45 shadow-md leading-none"
                        style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.4)' }}
                      >
                        <span className={locale === 'en' ? 'tracking-widest' : 'tracking-wider'}>
                          {locale === 'en' ? 'URGENT' : 'รับด่วน'}
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Header: Logo, Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <CompanyLogo company={job.company} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1 truncate group-hover:text-red-700 transition-colors pr-10">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isVerifiedCompany(job.company) && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <p className="text-gray-500 text-sm truncate">{job.company.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details: Badges (Job Type, Category) */}
                  <div className="flex w-full flex-wrap items-center gap-2 mb-4">
                    <span className="bg-[#202263] text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100">
                      {getJobTypeText(job.jobType, t)}
                    </span>
                    {job.category && (
                      <span className="bg-[#A80010] text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-100">
                        {job.category}
                      </span>
                    )}
                  </div>

                  {/* Details: Location, Salary, Positions */}
                  <div className="flex flex-col gap-2 text-sm text-gray-600 mb-6 border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-red-600 shrink-0"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-lg">
                        {' '}
                        {t('location')} : {job.locationProvince}
                        {job.locationDistrict ? ` เขต${job.locationDistrict}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5 text-red-600 shrink-0"
                      >
                        <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                        <path
                          fillRule="evenodd"
                          d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z"
                          clipRule="evenodd"
                        />
                        <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                      </svg>
                      <span className="text-lg">{t('salary')} : {salaryText(job, t)}</span>
                    </div>
                    {job.positions && job.positions > 0 && (
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-red-600 shrink-0"
                        >
                          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                        </svg>
                        <span className="text-lg"> {t('positions')} : {t('vacancy', { count: job.positions })}</span>
                      </div>
                    )}
                  </div>

                  {/* Time — bottom-right */}
                  <div className="flex items-center justify-end gap-1 text-gray-400 text-xs mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-3.5 h-3.5 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    {timeAgo(job.createdAt, t)}
                  </div>
                </Link>

                {/* Save button — positioned absolute top-right of card */}
                <button
                  onClick={(e) => toggleSave(e, job.slug)}
                  title={isSaved ? 'ยกเลิกบันทึก' : 'บันทึกงาน'}
                  className={`absolute top-5 right-5 z-10 flex flex-col items-center gap-0.5 p-2 rounded-xl transition-all  ${
                    isSaved
                      ? 'text-[#E00016] bg-red-50 hover:bg-red-100'
                      : 'text-gray-300 hover:text-[#E00016] hover:bg-red-50'
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 transition-all ${
                      isSaved ? 'fill-[#E00016] stroke-[#E00016]' : 'fill-none stroke-current'
                    }`}
                  />
                  <span className="text-[9px] font-semibold leading-none">
                    {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/jobs"
            className="bg-[#020263] hover:opacity-90 text-white text-lg font-medium py-3 px-10 rounded-full transition-opacity shadow-md"
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
