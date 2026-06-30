'use client';

import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

interface SubNavbarProps {
  userRole?: 'JOBSEEKER' | 'EMPLOYER' | string;
}

export function SubNavbar({ userRole }: SubNavbarProps) {
  const t = useTranslations('NavbarSub');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active state helper with query param awareness for duplicate paths
  const isLinkActive = (href: string, isDropdown = false) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/jobs') {
      const keyword = searchParams.get('keyword');
      const jobType = searchParams.get('jobType');
      const category = searchParams.get('category');
      
      const isDropdownParam = 
        keyword === 'โรงแรม' || 
        keyword === 'สหกิจศึกษา' || 
        jobType === 'INTERNSHIP' || 
        category === 'งานไอที งานเทคโนโลยีสื่อสาร';

      if (isDropdown) {
        return pathname === '/jobs' && isDropdownParam;
      } else {
        return pathname === '/jobs' && !isDropdownParam;
      }
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Dynamic className builder for nav links (removes original border-b-2)
  const navLinkClass = (href: string, isDropdown = false) => {
    const active = isLinkActive(href, isDropdown);
    return `${isDropdown ? 'flex items-center gap-1' : ''} py-2.5 transition-all duration-200 whitespace-nowrap relative group ${
      active
        ? 'text-white font-semibold text-glow-blue'
        : 'text-white/80 hover:text-white'
    }${isDropdown ? ' cursor-pointer' : ''}`;
  };

  // Render Glow Neon Line Active & Hover Indicator
  const renderActiveIndicator = (href: string, isDropdown = false) => {
    const active = isLinkActive(href, isDropdown);
    return (
      <span
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[3px] rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-400 shadow-[0_0_8px_rgba(147,197,253,0.8)] transition-all duration-300 origin-center ${
          active
            ? 'opacity-100 scale-x-100'
            : 'opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-75'
        }`}
      />
    );
  };

  return (
    <div className="hidden md:block animate-luxury-flow text-white">
      <div className="max-w-(--container-max) mx-auto px-4 flex items-center gap-8 text-sm font-medium tracking-wide">

        {/* Home */}
        <Link
          href="/"
          className={navLinkClass('/')}
        >
          {t('home')}
          {renderActiveIndicator('/')}
        </Link>

        {/* ---  Separate Role --- */}
        {userRole === 'EMPLOYER' || userRole === 'ADMIN' ? (
          /* EMPLOYER) */
          <>
            <Link
              href="/resumes"
              className={navLinkClass('/resumes')}
            >
              {t('searchResumes')}
              {renderActiveIndicator('/resumes')}
            </Link>

            {/* Regional Candidates Dropdown */}
            <div className="group relative">
              <Link
                href="/all_group_job/group-by-region"
                className={navLinkClass('/all_group_job', true)}
              >
                {t('regionalCandidates')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {renderActiveIndicator('/all_group_job', true)}
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
              className={navLinkClass('/jobs')}
            >
              {t('quickSearch')}
              {renderActiveIndicator('/jobs')}
            </Link>

            {/* Find Jobs Dropdown */}
            <div className="group relative">
              <Link
                href="/jobs"
                className={navLinkClass('/jobs', true)}
              >
                {t('findJobs')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {renderActiveIndicator('/jobs', true)}
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
                className={navLinkClass('/all_group_job', true)}
              >
                {t('regionalJobs')}
                <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {renderActiveIndicator('/all_group_job', true)}
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
          <button className={`flex items-center gap-1 py-2.5 transition-all duration-200 whitespace-nowrap cursor-default relative group ${
            isLinkActive('/coming-soon')
              ? 'text-white font-semibold text-glow-blue'
              : 'text-white/80 hover:text-white'
          }`}>
            {t('userGuide')}
            {/* ... svg ... */}
            {renderActiveIndicator('/coming-soon')}
          </button>
          <div className="absolute top-full right-0 hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-b-lg min-w-48 py-2 z-50 border border-t-0 border-gray-100">
            
            {/* 1. สำหรับผู้ประกอบการ (Employer) */}
            <Link 
              href="/coming-soon/employer"
              className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm"
            >
              {t('userGuideSub.employer')}
            </Link>
            
            {/* 2. สำหรับผู้สมัครงาน (Jobseeker) */}
            <Link 
              href="/coming-soon/jobseeker"
              className="block px-4 py-2 hover:bg-blue-50 hover:text-(--color-primary) text-sm"
            >
              {t('userGuideSub.jobseeker')}
            </Link>

          </div>
        </div>
        {/* Contact Us Link */}
        <Link
          href="/contact-us"
          className={navLinkClass('/contact-us')}
        >
          {t('aboutSub.contact')}
          {renderActiveIndicator('/contact-us')}
        </Link>
      </div>
    </div>
  );
}
