'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface SubNavbarProps {
  userRole?: 'JOBSEEKER' | 'EMPLOYER' | string;
}

export function SubNavbar({ userRole }: SubNavbarProps) {
  const t = useTranslations('NavbarSub');

  return (
    <div className="hidden md:block bg-[#020263] text-white">
      <div className="max-w-(--container-max) mx-auto px-4 flex items-center gap-8 text-sm font-medium">

        {/* Home */}
        <Link
          href="/"
          className="py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap"
        >
          {t('home')}
        </Link>

        {/* ---  Separate Role --- */}
        {userRole === 'EMPLOYER' ? (
          /* EMPLOYER) */
          <>
            <Link
              href="/resumes"
              className="py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap"
            >
              {t('searchResumes')}
            </Link>

            {/* Regional Candidates Dropdown */}
            <div className="group relative">
              <Link
                href="/all_group_job/group-by-region"
                className="flex items-center gap-1 py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap cursor-pointer"
              >
                {t('regionalCandidates')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-b-lg min-w-48 py-2 z-50 border border-t-0 border-gray-100">
                {['central', 'east', 'north', 'northeast', 'south', 'west'].map((region) => (
                  <Link
                    key={region}
                    href={`/resumes?region=${region}`}
                    className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm"
                  >
                    {t(`regionalCandidatesSub.${region}`)}
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* (JOBSEEKER) | (Guest) */
          <>
            <Link
              href="/jobs"
              className="py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap"
            >
              {t('quickSearch')}
            </Link>

            {/* Find Jobs Dropdown */}
            <div className="group relative">
              <Link
                href="/jobs"
                className="flex items-center gap-1 py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap cursor-pointer"
              >
                {t('findJobs')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-b-lg min-w-56 py-2 z-50 border border-t-0 border-gray-100">
                <Link href="/jobs?keyword=โรงแรม" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
                  {t('findJobsSub.hotel')}
                </Link>
                <Link href="/jobs?jobType=INTERNSHIP" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
                  {t('findJobsSub.internship')}
                </Link>
                <Link href="/jobs?keyword=สหกิจศึกษา" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
                  {t('findJobsSub.coop')}
                </Link>
                <Link href="/jobs?category=งานไอที งานเทคโนโลยีสื่อสาร" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
                  {t('findJobsSub.disabled')}
                </Link>
              </div>
            </div>

            {/* Regional Jobs Dropdown */}
            <div className="group relative">
              <Link
                href="/all_group_job"
                className="flex items-center gap-1 py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap cursor-pointer"
              >
                {t('regionalJobs')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <div className="absolute top-full left-0 hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-b-lg min-w-48 py-2 z-50 border border-t-0 border-gray-100">
                {['central', 'east', 'north', 'northeast', 'south', 'west'].map((region) => (
                  <Link
                    key={region}
                    href={`/all_group_job/${region}`}
                    className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm"
                  >
                    {t(`regionalJobsSub.${region}`)}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-1"></div>

        {/* User Guide Dropdown */}
        <div className="group relative">
          <button className="flex items-center gap-1 py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap cursor-default">
            {t('userGuide')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="absolute top-full right-0 hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-b-lg min-w-48 py-2 z-50 border border-t-0 border-gray-100">
            <Link href="/coming-soon" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
              {t('userGuideSub.employer')}
            </Link>
            <Link href="/coming-soon" className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm">
              {t('userGuideSub.jobseeker')}
            </Link>
          </div>
        </div>

        {/* Contact Us Link */}
        <Link
          href="/contact-us"
          className="py-2.5 hover:text-blue-200 transition-colors border-b-2 border-transparent hover:border-blue-200 whitespace-nowrap"
        >
          {t('aboutSub.contact')}
        </Link>
      </div>
    </div>
  );
}
