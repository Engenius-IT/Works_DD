'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CompanyLogo } from '@/components/CompanyLogo';
import { HeroSearch, SearchParams } from '@/components/HeroSearch';
import { useAuth } from '@/context/AuthContext';
import {
  Bus,
  TrainFront,
  TramFront,
  Plane,
  Train,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Briefcase as BriefcaseIcon,
  X,
  Phone,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Job {
  id: string;
  title: string;
  slug: string;
  jobType: string;
  workModel: string;
  locationProvince?: string;
  locationDistrict?: string;
  companyAddress?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible: boolean;
  requiredSkills: string[];
  createdAt: string;
  description?: string;
  requirements?: string;
  benefits?: string | string[];
  education?: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isVerified?: boolean;
    verificationStatus?: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
    description?: string;
    website?: string;
    industry?: string;
    size?: string;
  };
  _count?: { savedBy: number };
  category?: string;
  jobFunction?: string;
  qualificationGender?: string;
  qualificationAgeMin?: number;
  qualificationAgeMax?: number;
  qualificationExperience?: number;
  additionalQualifications?: string[];
  contactName?: string;
  contactPhone?: string;
  transportation?: string[];
  welcomeRecentGrads?: boolean;
  isQuickApply?: boolean;
  positions?: number;
  workingDays?: string;
  startTime?: string;
  endTime?: string;
  canOnlineInterview?: boolean;
  companyImages?: string[];
}

interface CompanyGroup {
  companyId: string;
  companyName: string;
  companySlug: string;
  logoUrl?: string;
  jobs: Job[];
}

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'งานประจำ',
  PART_TIME: 'พาร์ทไทม์',
  CONTRACT: 'สัญญาจ้าง',
  INTERNSHIP: 'ฝึกงาน',
  FREELANCE: 'ฟรีแลนซ์',
};

const WORK_MODEL_LABEL: Record<string, string> = {
  ONSITE: 'ออฟฟิศ',
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เพิ่งโพสต์';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function salaryText(job: Job) {
  if (!job.salaryVisible || (!job.salaryMin && !job.salaryMax)) return 'ตามโครงสร้างบริษัท';
  if (job.salaryMin && job.salaryMax)
    return `${job.salaryMin.toLocaleString()} – ${job.salaryMax.toLocaleString()} บาท`;
  if (job.salaryMin) return `${job.salaryMin.toLocaleString()}+ บาท`;
  return `ถึง ${job.salaryMax!.toLocaleString()} บาท`;
}

function isVerifiedCompany(company: Job['company']) {
  return company.isVerified || company.verificationStatus === 'VERIFIED';
}

// We will import CompanyLogo at the top of the file.

function JobCard({
  job,
  isSelected,
  isSaved,
  saveCount,
  onSelect,
  onToggleSave,
}: {
  job: Job;
  isSelected: boolean;
  isSaved: boolean;
  saveCount: number;
  onSelect: (job: Job) => void;
  onToggleSave: () => void;
}) {
  const locale = useLocale();
  const isNew = job.isQuickApply === true;

  return (
    <div
      id={`job-card-${job.id}`}
      className={`relative bg-white border-2 rounded-xl drop-shadow-md hover:drop-shadow-xl transition-all duration-300 cursor-pointer ${isSelected
        ? 'border-[#020263] ring-2 ring-[#020263]/20 drop-shadow-xl z-10'
        : 'border-gray-200 hover:border-[#00003D] hover:z-10'
        }`}
      onClick={() => onSelect(job)}
    >
      {/* Urgent Badge - Corner Ribbon Style */}
      {isNew && (
        <div className="absolute -top-[2px] -right-[2px] w-[96px] h-[96px] overflow-hidden pointer-events-none z-30">
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
      {/* Main row: logo | info | right panel */}
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-5 px-6 py-5">
        {/* Logo */}
        <div className="shrink-0 flex items-start pt-0.5">
          <CompanyLogo company={job.company} size="lg" />
        </div>

        {/* Center: title + labeled info rows + tags */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
          {/* Title */}
          <h3 className="font-semibold text-[#020263] text-[17px] leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
            {job.title}
          </h3>

          {/* Labeled info rows */}
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-1.5 text-gray-700">
              <span className="text-[#000000] font-bold shrink-0 w-[60px] whitespace-nowrap text-[15px]   ">
                บริษัท :
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                {isVerifiedCompany(job.company) && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-bold text-[#020263] truncate text-[15px]">{job.company.name}</span>
              </div>
            </div>
            <div className="flex items-start gap-1.5 text-[#020263] ">
              <span className="text-[#000000] font-bold shrink-0 w-[120px] whitespace-nowrap">
                สถานที่ปฏิบัติงาน :
              </span>
              <span className="text-[#000000] text-[15px] line-clamp-2">
                {job.companyAddress
                  ? job.companyAddress.length > 60
                    ? job.companyAddress.slice(0, 60) + '...'
                    : job.companyAddress
                  : job.locationProvince
                    ? job.locationProvince +
                    (job.locationDistrict ? ` ${job.locationDistrict}` : '')
                    : 'ไม่ระบุสถานที่'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-700">
              <span className="text-[#000000] font-bold shrink-0 w-[60px] whitespace-nowrap text-[15px]">
                เงินเดือน :
              </span>
              <span className="text-[#000000]">{salaryText(job)}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1 rounded-full">
              {JOB_TYPE_LABEL[job.jobType] || job.jobType}
            </span>
            <span className="text-xs text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1 rounded-full">
              {WORK_MODEL_LABEL[job.workModel] || job.workModel}
            </span>
            {job.education && (
              <span className="text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-1 rounded-full flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                {job.education}
              </span>
            )}
            {job.qualificationExperience != null && job.qualificationExperience > 0 && (
              <span className="text-xs text-purple-600 border border-purple-200 bg-purple-50 px-3 py-1 rounded-full flex items-center gap-1">
                <BriefcaseIcon className="w-3 h-3" />
                ประสบการณ์ {job.qualificationExperience} ปี
              </span>
            )}
            {job.welcomeRecentGrads && (
              <span className="text-xs text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1 rounded-full">
                🎓 รับจบใหม่
              </span>
            )}
            {job.requiredSkills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-xs text-gray-500 border border-gray-200 bg-gray-50 px-3 py-1 rounded-full"
              >
                {s}
              </span>
            ))}
            {job.requiredSkills.length > 3 && (
              <span className="text-xs text-gray-400 py-1">+{job.requiredSkills.length - 3}</span>
            )}
          </div>

          {/* Transportation */}
          {job.transportation && job.transportation.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {job.transportation.map((t) => {
                const iconMap: Record<string, React.ElementType> = {
                  รถเมล์: Bus,
                  BTS: TrainFront,
                  MRT: TramFront,
                  ARL: Plane,
                  รถไฟ: Train,
                };
                // Find icon by checking if the text starts with the preset value
                const presetKey = Object.keys(iconMap).find((key) => t.startsWith(key));
                const Icon = presetKey ? iconMap[presetKey] : MapPin;

                return (
                  <span
                    key={t}
                    className="text-xs text-[#000000] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Icon className="w-3 h-3" />
                    {t}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel: urgent + time + bookmark (top) | button (bottom) */}
        <div className="shrink-0 flex flex-row items-center justify-between w-full gap-4 sm:w-auto sm:min-w-[160px] sm:flex-col sm:items-end sm:justify-between">
          {/* Top: time + bookmark */}
          <div className="flex items-center gap-4 text-gray-400 sm:pt-14">
            <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap">
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {timeAgo(job.createdAt)}
            </span>
            {/* Bookmark */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              title={isSaved ? 'ยกเลิกบันทึก' : 'บันทึกงาน'}
              className={`shrink-0 flex items-center gap-1 text-xs font-medium whitespace-nowrap transition-colors ${isSaved ? 'text-[#E00016] hover:text-[#E00016]/80' : 'text-gray-400 hover:text-[#E00016]/80'
                }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>
              {saveCount > 0 && <span className="text-xs font-medium">{saveCount}</span>}
            </button>
          </div>

          {/* Bottom: view detail indicator */}
          <div className="flex items-center gap-1 text-xs text-[#020263] font-semibold opacity-70">
            <span>ดูรายละเอียด</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const isHtml = text.trimStart().startsWith('<');
  if (isHtml) {
    return (
      <div
        className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none overflow-hidden break-words
    [&_*]:max-w-full [&_*]:break-words
    prose-headings:text-gray-800 prose-headings:font-semibold
    prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
    prose-ul:pl-5 prose-ol:pl-5 prose-li:my-0.5
    prose-strong:text-gray-800 prose-em:text-gray-600
    prose-hr:border-gray-200"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }
  return <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{text}</div>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-bold text-[#020263] mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#E00016] rounded-full inline-block" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function JobDetailPanel({
  job,
  detailJob,
  detailLoading,
  onClose,
  onApply,
  isApplying,
  applyStatus,
}: {
  job: Job;
  detailJob: Job | null;
  detailLoading: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
  isApplying: boolean;
  applyStatus: 'idle' | 'success' | 'error' | 'already_applied';
}) {
  const merged = detailJob ?? job;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [job.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-start gap-3">
        <CompanyLogo company={merged.company} size="md" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[#020263] text-base leading-snug line-clamp-2">
            {merged.title}
          </h2>
          <div className="flex items-center gap-1 mt-0.5">
            {isVerifiedCompany(merged.company) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            )}
            <span className="text-sm text-gray-600 truncate">{merged.company.name}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 rounded-full font-medium">
              {JOB_TYPE_LABEL[merged.jobType] || merged.jobType}
            </span>
            <span className="text-xs bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full font-medium">
              {WORK_MODEL_LABEL[merged.workModel] || merged.workModel}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          title="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {/* Quick info row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5 text-sm text-gray-600">
          {(merged.locationProvince || merged.locationDistrict) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              {merged.locationProvince}
              {merged.locationDistrict ? ` · ${merged.locationDistrict}` : ''}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-orange-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {salaryText(merged)}
          </span>
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            โพสต์ {timeAgo(merged.createdAt)}
          </span>
        </div>

        {/* Apply buttons */}
        <div className="flex flex-col gap-2 mb-5 sm:flex-row">
          <button
            onClick={() => onApply(merged.id)}
            disabled={isApplying || applyStatus === 'success' || applyStatus === 'already_applied'}
            className={`w-full sm:w-auto flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${applyStatus === 'success' || applyStatus === 'already_applied'
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
              : 'bg-[#E00016] hover:bg-[#A80010] text-white'
              }`}
          >
            {isApplying
              ? 'กำลังส่ง...'
              : applyStatus === 'success'
                ? '✓ สมัครสำเร็จ!'
                : applyStatus === 'already_applied'
                  ? 'สมัครไปแล้ว'
                  : 'สมัครงานนี้'}
          </button>
          <Link
            href={`/jobs/${merged.slug}`}
            target="_blank"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-[#020263] text-[#020263] text-sm font-bold hover:bg-[#020263] hover:text-white transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            ดูเต็มหน้า
          </Link>
        </div>

        {detailLoading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-3 bg-gray-100 rounded w-4/6" />
              </div>
            ))}
          </div>
        )}

        {!detailLoading && (
          <>
            {/* Description */}
            {merged.description && (
              <DetailSection title="รายละเอียดงาน">
                <TextBlock text={merged.description} />
              </DetailSection>
            )}

            {/* Requirements */}
            {merged.requirements && (
              <DetailSection title="คุณสมบัติที่ต้องการ">
                <TextBlock text={merged.requirements} />
              </DetailSection>
            )}

            {/* Skills */}
            {merged.requiredSkills.length > 0 && (
              <DetailSection title="ทักษะที่ต้องการ">
                <div className="flex flex-wrap gap-1.5">
                  {merged.requiredSkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </DetailSection>
            )}

            {/* Benefits */}
            {merged.benefits && (
              <DetailSection title="สวัสดิการ">
                {Array.isArray(merged.benefits) ? (
                  <ul className="list-disc list-inside text-gray-600 text-sm leading-relaxed space-y-1">
                    {merged.benefits.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <TextBlock text={merged.benefits as string} />
                )}
              </DetailSection>
            )}

            {/* Qualification */}
            {(merged.qualificationGender ||
              merged.education ||
              merged.qualificationAgeMin ||
              merged.qualificationAgeMax ||
              merged.qualificationExperience != null) && (
                <DetailSection title="คุณสมบัติผู้สมัคร">
                  <div className="grid grid-cols-2 gap-3">
                    {merged.qualificationGender && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">เพศ</p>
                          <p className="font-medium text-gray-700 text-xs">
                            {merged.qualificationGender}
                          </p>
                        </div>
                      </div>
                    )}
                    {(merged.qualificationAgeMin || merged.qualificationAgeMax) && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">อายุ</p>
                          <p className="font-medium text-gray-700 text-xs">
                            {merged.qualificationAgeMin && merged.qualificationAgeMax
                              ? `${merged.qualificationAgeMin}–${merged.qualificationAgeMax} ปี`
                              : merged.qualificationAgeMin
                                ? `${merged.qualificationAgeMin}+ ปี`
                                : `≤${merged.qualificationAgeMax} ปี`}
                          </p>
                        </div>
                      </div>
                    )}
                    {merged.education && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-3.5 h-3.5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">วุฒิการศึกษา</p>
                          <p className="font-medium text-gray-700 text-xs">{merged.education}</p>
                        </div>
                      </div>
                    )}
                    {merged.qualificationExperience != null && merged.qualificationExperience > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <BriefcaseIcon className="w-3.5 h-3.5 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">ประสบการณ์</p>
                          <p className="font-medium text-gray-700 text-xs">
                            {merged.qualificationExperience} ปี
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </DetailSection>
              )}

            {/* Working details */}
            {(merged.positions ||
              merged.workingDays ||
              merged.startTime ||
              merged.canOnlineInterview) && (
                <DetailSection title="ข้อมูลการทำงาน">
                  <div className="space-y-1.5 text-sm">
                    {merged.positions && merged.positions > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">จำนวนรับ</span>
                        <span className="text-gray-700 font-medium">{merged.positions} ตำแหน่ง</span>
                      </div>
                    )}
                    {merged.workingDays && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">วันทำงาน</span>
                        <span className="text-gray-700 font-medium">{merged.workingDays}</span>
                      </div>
                    )}
                    {merged.startTime && merged.endTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">เวลาทำงาน</span>
                        <span className="text-gray-700 font-medium">
                          {merged.startTime} – {merged.endTime}
                        </span>
                      </div>
                    )}
                    {merged.canOnlineInterview && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">สัมภาษณ์ออนไลน์</span>
                        <span className="text-green-600 font-medium">รองรับ</span>
                      </div>
                    )}
                  </div>
                </DetailSection>
              )}

            {/* Contact info */}
            {(merged.contactName || merged.contactPhone || merged.companyAddress) && (
              <DetailSection title="ข้อมูลผู้ติดต่อ">
                <div className="space-y-2 text-sm">
                  {merged.contactName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-700">{merged.contactName}</span>
                    </div>
                  )}
                  {merged.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <a
                        href={`tel:${merged.contactPhone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {merged.contactPhone}
                      </a>
                    </div>
                  )}
                  {merged.companyAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-gray-700 leading-relaxed">{merged.companyAddress}</span>
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Transportation */}
            {merged.transportation && merged.transportation.length > 0 && (
              <DetailSection title="การเดินทาง">
                <div className="flex flex-wrap gap-1.5">
                  {merged.transportation.map((t) => {
                    const iconMap: Record<string, React.ElementType> = {
                      รถเมล์: Bus,
                      BTS: TrainFront,
                      MRT: TramFront,
                      ARL: Plane,
                      รถไฟ: Train,
                    };
                    const presetKey = Object.keys(iconMap).find((key) => t.startsWith(key));
                    const Icon = presetKey ? iconMap[presetKey] : MapPin;
                    return (
                      <span
                        key={t}
                        className="flex items-center gap-1.5 text-xs text-[#020263] bg-blue-50 border border-[#020263]/30 px-3 py-1.5 rounded-xl"
                      >
                        <Icon className="w-3 h-3" />
                        {t}
                      </span>
                    );
                  })}
                </div>
              </DetailSection>
            )}

            {/* Company Images */}
            {merged.companyImages && merged.companyImages.length > 0 && (
              <DetailSection title="ภาพบรรยากาศในที่ทำงาน">
                <div className="grid grid-cols-2 gap-2">
                  {merged.companyImages.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 hover:border-[#020263] transition-all block"
                    >
                      <img
                        src={url}
                        alt={`รูปบริษัท ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/50 px-2.5 py-1 rounded-full transition-opacity">
                          ดูรูปภาพ
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </DetailSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
        <div className="w-14 h-14 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-1/5" />
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="flex justify-end">
              <div className="h-8 bg-gray-200 rounded-full w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [groups, setGroups] = useState<CompanyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});

  // Split-panel state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error' | 'already_applied'>(
    'idle',
  );
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const keyword = searchParams.get('keyword') ?? '';
  const province = searchParams.get('province') ?? '';
  const jobType = searchParams.get('jobType') ?? '';
  const salaryMin = searchParams.get('salaryMin') ?? '';
  const education = searchParams.get('education') ?? '';
  const category = searchParams.get('category') ?? '';

  const fetchJobs = useCallback(
    async (p = 1) => {
      setLoading(true);
      const q = new URLSearchParams({ limit: '10', page: String(p) });
      if (province) q.set('province', province);
      if (jobType) q.set('jobType', jobType);
      if (salaryMin) q.set('salaryMin', salaryMin);
      if (education) q.set('education', education);
      if (category) q.set('category', category);

      // Use search API when any filter is present, otherwise use jobs API
      const hasSearchFilters = keyword || jobType || salaryMin || education || category;
      let apiEndpoint: string;
      if (hasSearchFilters) {
        if (keyword) q.set('q', keyword);
        apiEndpoint = `${API_URL}/search/jobs?${q.toString()}`;
      } else {
        apiEndpoint = `${API_URL}/jobs?${q.toString()}`;
      }

      try {
        const res = await fetch(apiEndpoint);
        const data = await res.json();
        const jobs: Job[] = Array.isArray(data?.data) ? data.data : [];
        const meta = data?.meta ?? {};

        // Build save counts from API data
        const counts: Record<string, number> = {};
        jobs.forEach((j) => {
          counts[j.id] = j._count?.savedBy || 0;
        });
        setSaveCounts((prev) => ({ ...prev, ...counts }));

        // Group by company — preserve insertion order (newest first)
        const map = new Map<string, CompanyGroup>();
        for (const job of jobs) {
          const cid = job.company.id;
          if (!map.has(cid)) {
            map.set(cid, {
              companyId: cid,
              companyName: job.company.name,
              companySlug: job.company.slug,
              logoUrl: job.company.logoUrl,
              jobs: [],
            });
          }
          map.get(cid)!.jobs.push(job);
        }

        setGroups(Array.from(map.values()));
        setTotal(meta.total ?? jobs.length);
        setTotalPages(meta.totalPages ?? 1);
        setPage(p);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
        if (p > 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [keyword, province, jobType, salaryMin, education, category],
  );

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  // Load saved slugs from localStorage
  useEffect(() => {
    const slugs = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    setSavedSlugs(new Set(slugs));
  }, []);

  // Fetch full job detail when a card is selected
  const handleSelectJob = useCallback(async (job: Job) => {
    setSelectedJob(job);
    setDetailJob(null);
    setApplyStatus('idle');
    setDetailLoading(true);

    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }

    setTimeout(() => {
      const el = document.getElementById(`job-card-${job.id}`);
      if (el) {
        const yOffset = -110;
        const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }, 50);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/jobs/${job.slug}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setDetailJob(data);
        if (data.hasApplied) {
          setApplyStatus('already_applied');
        }
      }
    } catch {
      // Use card data as fallback
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleApply = async (jobId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'JOBSEEKER') {
      setApplyStatus('error');
      return;
    }

    setIsApplying(true);
    setApplyStatus('idle');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message === 'You have already applied for this job') {
          setApplyStatus('already_applied');
        } else {
          setApplyStatus('error');
        }
      } else {
        setApplyStatus('success');
      }
    } catch {
      setApplyStatus('error');
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleSave = (jobSlug: string) => {
    const slugs = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    let updated: string[];
    if (slugs.includes(jobSlug)) {
      updated = slugs.filter((s) => s !== jobSlug);
    } else {
      updated = [...slugs, jobSlug];
    }
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSavedSlugs(new Set(updated));
  };

  const handleSearch = (params: SearchParams) => {
    const q = new URLSearchParams();
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.province) q.set('province', params.province);
    if (params.jobType) q.set('jobType', params.jobType);
    if (params.salaryMin) q.set('salaryMin', params.salaryMin);
    if (params.education) q.set('education', params.education);
    if (params.category) q.set('category', params.category);
    router.push(`/jobs?${q.toString()}`);
    setSelectedJob(null);
    setDetailJob(null);
  };

  const hasFilters = keyword || province || jobType || salaryMin || education || category;
  const allJobs = groups.flatMap((g) => g.jobs);

  return (
    <>
      {/* Hero Search */}
      <HeroSearch
        onSearch={handleSearch}
        initialValues={{ keyword, province, jobType, education, category, salaryMin }}
      />

      {/* Results */}
      <main className="max-w-[1400px] mx-auto px-6 py-10 w-full">
        {/* Stats bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {loading ? 'กำลังโหลด...' : `พบ ${total} ตำแหน่งงาน`}
            </h1>
            {hasFilters && !loading && (
              <p className="text-sm text-gray-400 mt-0.5">
                {[keyword && `"${keyword}"`, province, jobType && JOB_TYPE_LABEL[jobType]]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          {hasFilters && (
            <button
              onClick={() => router.push('/jobs')}
              className="text-sm text-blue-600 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>

        {/* Split-panel layout */}
        <div className="flex gap-5 items-start min-h-screen pb-10">
          {/* Left: Job list */}
          <div
            className="flex flex-col gap-4 transition-all duration-300 w-full"
          >
            {/* Loading */}
            {loading && (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonSection key={i} />
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && allJobs.length === 0 && (
              <div className="text-center py-24">
                <div className="text-5xl mb-4">🔍</div>
                <div className="text-gray-600 font-semibold text-lg mb-2">ไม่พบประกาศงาน</div>
                <p className="text-gray-400 text-sm mb-6">ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง</p>
                <button
                  onClick={() => router.push('/jobs')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
                >
                  ดูงานทั้งหมด
                </button>
              </div>
            )}

            {/* Job Cards */}
            {!loading &&
              allJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob?.id === job.id}
                  isSaved={savedSlugs.has(job.slug)}
                  saveCount={saveCounts[job.id] || 0}
                  onSelect={handleSelectJob}
                  onToggleSave={() => handleToggleSave(job.slug)}
                />
              ))}

            {/* Pagination */}
            {!loading &&
              totalPages > 1 &&
              (() => {
                const pages: (number | string)[] = [];
                const maxVisible = 5;
                if (totalPages <= maxVisible + 2) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  let start = Math.max(2, page - 1);
                  let end = Math.min(totalPages - 1, page + 1);
                  if (page <= 3) {
                    start = 2;
                    end = Math.min(maxVisible, totalPages - 1);
                  }
                  if (page >= totalPages - 2) {
                    end = totalPages - 1;
                    start = Math.max(2, totalPages - maxVisible + 1);
                  }
                  if (start > 2) pages.push('...');
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
                }
                return (
                  <div className="flex justify-center items-center gap-2 mt-10">
                    <button
                      disabled={page <= 1}
                      onClick={() => fetchJobs(page - 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ← ก่อนหน้า
                    </button>
                    {pages.map((p, idx) =>
                      typeof p === 'string' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-gray-400">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => fetchJobs(p)}
                          className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${p === page
                            ? 'bg-[#020263] text-white shadow-md'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      disabled={page >= totalPages}
                      onClick={() => fetchJobs(page + 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      ถัดไป →
                    </button>
                  </div>
                );
              })()}
          </div>

          {/* Popup: Detail panel */}
          {selectedJob && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
              role="dialog"
              aria-modal="true"
              onClick={() => {
                setSelectedJob(null);
                setDetailJob(null);
                setApplyStatus('idle');
              }}
            >
              <div
                className="w-full max-w-4xl h-[calc(100vh-3rem)] overflow-hidden bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <JobDetailPanel
                  job={selectedJob}
                  detailJob={detailJob}
                  detailLoading={detailLoading}
                  onClose={() => {
                    setSelectedJob(null);
                    setDetailJob(null);
                    setApplyStatus('idle');
                  }}
                  onApply={handleApply}
                  isApplying={isApplying}
                  applyStatus={applyStatus}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function JobsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <JobsContent />
      </Suspense>
      <Footer />
    </div>
  );
}