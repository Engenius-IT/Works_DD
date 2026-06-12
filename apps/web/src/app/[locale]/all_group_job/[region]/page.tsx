'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HeroSearch, SearchParams } from '@/components/HeroSearch';
import { useAuth } from '@/context/AuthContext';
import { /*REGION_LABELS,*/ isRegionId } from '@/data/job-regions';
import { useTranslations } from 'next-intl';
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
  ChevronLeft,
  Map,
  X,
  ExternalLink,
  Upload,
  User,
  Heart,
} from 'lucide-react';
import { useRef } from 'react';

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
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    isVerified?: boolean;
    verificationStatus?: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  };
  _count?: { savedBy: number };
  education?: string;
  qualificationExperience?: number;
  transportation?: string[];
  welcomeRecentGrads?: boolean;
  isQuickApply?: boolean;
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

function CompanyLogo({ company, size = 'md' }: { company: Job['company']; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-3xl rounded-2xl' : 'w-14 h-14 text-2xl rounded-xl';

  if (company.logoUrl) {
    return (
      <img
        src={company.logoUrl}
        alt={company.name}
        className={`${dim} object-contain border border-gray-200 bg-white shrink-0`}
      />
    );
  }

  const initial = company.name.charAt(0).toUpperCase();
  const colors = [
    'bg-blue-600',
    'bg-green-600',
    'bg-purple-600',
    'bg-red-600',
    'bg-amber-500',
    'bg-teal-600',
    'bg-indigo-600',
  ];
  const color = colors[company.name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`${dim} ${color} flex items-center justify-center text-white font-black shrink-0`}
    >
      {initial}
    </div>
  );
}

function JobCard({
  job,
  router,
  isSelected,
  isSaved,
  saveCount,
  onSelect,
  onToggleSave,
}: {
  job: Job;
  router: ReturnType<typeof useRouter>;
  isSelected?: boolean;
  isSaved: boolean;
  saveCount: number;
  onSelect?: (job: Job) => void;
  onToggleSave: (jobId: string) => void;
}) {
  const isNew = job.isQuickApply === true;

  return (
    <div
      className={`bg-white border-2 rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer ${isSelected
        ? 'border-[#020263] ring-2 ring-[#020263]/20 shadow-lg'
        : 'border-gray-200 drop-shadow-md hover:drop-shadow-xl hover:border-[#020263]'
        }`}
      onClick={() => (onSelect ? onSelect(job) : router.push(`/jobs/${job.slug}`))}
    >
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-6 p-7">
        <div className="shrink-0 flex items-start pt-1">
          <CompanyLogo company={job.company} size="lg" />
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-[#020263] text-[22px] leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 min-w-0">
              {job.title}
            </h3>

            <div className="shrink-0 flex flex-col items-end gap-3">
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(job.id);
                }}
                title={isSaved ? 'ยกเลิกบันทึก' : 'บันทึกงาน'}
                className={`flex items-center gap-1 transition-colors ${isSaved ? 'text-[#E00016] hover:text-[#E00016]/80' : 'text-gray-300 hover:text-[#E00016]/80'
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
          </div>

          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3 text-gray-700">
              <span className="text-[#000000] font-semibold">บริษัท :</span>
              <div className="flex items-center gap-1.5 min-w-0">
                {isVerifiedCompany(job.company) && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <span className="font-bold text-[#020263] truncate">{job.company.name}</span>
              </div>
            </div>

            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3 text-[#020263]">
              <span className="text-[#000000] font-bold">สถานที่ :</span>
              <span className="text-[#000000] break-words leading-relaxed">
                {job.companyAddress
                  ? job.companyAddress.length > 80
                    ? job.companyAddress.slice(0, 80) + '...'
                    : job.companyAddress
                  : job.locationProvince
                    ? job.locationProvince +
                    (job.locationDistrict ? ` ${job.locationDistrict}` : '')
                    : 'ไม่ระบุสถานที่'}
              </span>
            </div>

            <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3 text-gray-700">
              <span className="text-[#000000] font-bold">เงินเดือน :</span>
              <span className="text-[#000000] break-words leading-relaxed">
                {salaryText(job)}
              </span>
            </div>
          </div>

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

          {job.transportation && job.transportation.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {job.transportation.map((t) => {
                const iconMap: Record<string, React.ElementType> = {
                  รถเมย์: Bus,
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
                    className="text-xs text-[#000000] bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full flex items-center gap-1"
                  >
                    <Icon className="w-3 h-3" />
                    {t}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between gap-4 pt-2">
            {isNew ? (
              <span className="inline-block w-fit text-xs font-semibold text-white whitespace-nowrap bg-[#10B981] px-5 py-1.5 rounded-full hover:bg-[#16A34A]/80 transition-all duration-300 cursor-pointer">
                สมัครด่วน
              </span>
            ) : (
              <span />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) {
                  onSelect(job);
                } else {
                  router.push(`/jobs/${job.slug}`);
                }
              }}
              className="bg-[#E00016] hover:bg-[#A80010]/80 text-white text-sm font-semibold px-7 py-3 rounded-full transition-colors shadow-sm whitespace-nowrap"
            >
              อ่านรายละเอียดงาน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-pulse p-5"
        >
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-1/5 mb-6" />
          <div className="space-y-4">
            {[1, 2].map((j) => (
              <div key={j} className="border border-gray-100 rounded-2xl p-5 space-y-3">
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
      ))}
    </div>
  );
}

function TextBlock({ content }: { content?: string }) {
  if (!content) return null;
  const isHtml = /<[a-z][\s\S]*>/i.test(content);
  if (isHtml) {
    return (
      <div
        className="prose prose-sm max-w-none overflow-x-hidden break-words text-gray-700 prose-p:leading-relaxed prose-p:break-words prose-li:my-1 prose-li:break-words marker:text-[#020263] [&_*]:max-w-full [&_*]:break-words"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words overflow-x-hidden">{content}</div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-gray-100">
        <div className="p-2 bg-[#020263]/5 rounded-xl text-[#020263]">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-[#020263] text-lg">{title}</h3>
      </div>
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
  detailJob: any;
  detailLoading: boolean;
  onClose: () => void;
  onApply: () => void;
  isApplying: boolean;
  applyStatus: string;
}) {
  const displayJob = detailJob || job;

  const getApplyButtonContent = () => {
    switch (applyStatus) {
      case 'success':
        return (
          <>
            <CheckCircle2 className="w-5 h-5" />
            ส่งใบสมัครแล้ว
          </>
        );
      case 'already_applied':
        return 'คุณเคยสมัครงานนี้แล้ว';
      default:
        return isApplying ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            กำลังสมัคร...
          </span>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            สมัครงานนี้
          </>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      {/* Detail Panel Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-4">
            <CompanyLogo company={displayJob.company} size="lg" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#020263] leading-tight mb-2">
                {displayJob.title}
              </h2>
              <div className="flex items-center gap-2">
                {isVerifiedCompany(displayJob.company) && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span className="font-semibold text-gray-700">{displayJob.company.name}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button
            onClick={onApply}
            disabled={
              isApplying || applyStatus === 'success' || applyStatus === 'already_applied'
            }
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-sm ${applyStatus === 'success' || applyStatus === 'already_applied'
              ? 'bg-emerald-500 text-white cursor-not-allowed hidden'
              : 'bg-[#E00016] hover:bg-[#A80010] hover:-translate-y-0.5 hover:shadow-md text-white'
              }`}
          >
            {getApplyButtonContent()}
          </button>

          <Link
            href={`/jobs/${displayJob.slug}`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#020263] bg-[#020263]/5 hover:bg-[#020263]/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            เปิดเต็มหน้าจอ
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pr-6 sm:pr-8 custom-scrollbar">
        {detailLoading ? (
          <SkeletonSection />
        ) : (
          <div className="space-y-6">
            {/* Quick Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex flex-col gap-1 text-center p-2 rounded-xl bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">รูปแบบงาน</span>
                <span className="font-semibold text-[#020263] text-sm">
                  {JOB_TYPE_LABEL[displayJob.jobType] || displayJob.jobType}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-center p-2 rounded-xl bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">เงินเดือน</span>
                <span className="font-semibold text-emerald-600 text-sm">
                  {salaryText(displayJob)}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-center p-2 rounded-xl bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">สถานที่ทำงาน</span>
                <span className="font-semibold text-[#020263] text-sm">
                  {WORK_MODEL_LABEL[displayJob.workModel] || displayJob.workModel}
                </span>
              </div>
              <div className="flex flex-col gap-1 text-center p-2 rounded-xl bg-gray-50/50">
                <span className="text-xs text-gray-500 font-medium">ลงประกาศเมื่อ</span>
                <span className="font-semibold text-[#020263] text-sm">
                  {timeAgo(displayJob.createdAt)}
                </span>
              </div>
            </div>

            <DetailSection icon={BriefcaseIcon} title="รายละเอียดงาน">
              {displayJob.description ? (
                <TextBlock content={displayJob.description} />
              ) : (
                <p className="text-gray-500 text-sm italic">ไม่มีรายละเอียด</p>
              )}
            </DetailSection>

            <DetailSection icon={User} title="คุณสมบัติผู้สมัคร">
              {displayJob.qualifications ? (
                <TextBlock content={displayJob.qualifications} />
              ) : (
                <p className="text-gray-500 text-sm italic">ไม่มีข้อมูลคุณสมบัติ</p>
              )}
            </DetailSection>

            {(displayJob.benefits?.length > 0 || displayJob.customBenefits) && (
              <DetailSection icon={Heart} title="สวัสดิการ">
                {displayJob.benefits && displayJob.benefits.length > 0 && (
                  <ul className="grid sm:grid-cols-2 gap-3 mb-4">
                    {displayJob.benefits.map((b: string) => (
                      <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {displayJob.customBenefits && (
                  <div className="pt-4 border-t border-gray-100">
                    <TextBlock content={displayJob.customBenefits} />
                  </div>
                )}
              </DetailSection>
            )}

            <DetailSection icon={MapPin} title="สถานที่ปฏิบัติงาน">
              {displayJob.companyAddress ? (
                <div className="text-sm text-gray-700">{displayJob.companyAddress}</div>
              ) : displayJob.locationProvince ? (
                <div className="text-sm text-gray-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {displayJob.locationProvince}
                  {displayJob.locationDistrict && `, ${displayJob.locationDistrict}`}
                </div>
              ) : (
                <p className="text-gray-500 text-sm italic">ไม่ระบุสถานที่</p>
              )}
            </DetailSection>
          </div>
        )}
      </div>
    </div>
  );
}

function RegionJobsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations();

  const regionParam = String(params?.region || '');
  const region = isRegionId(regionParam) ? regionParam : null;
  const regionLabel = region ? t(`NavbarSub.regionalJobsSub.${region}`) : '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saveCounts, setSaveCounts] = useState<Record<string, number>>({});

  // Split View States
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error' | 'already_applied'>('idle');
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const keyword = searchParams.get('keyword') ?? '';
  const province = searchParams.get('province') ?? '';
  const jobType = searchParams.get('jobType') ?? '';
  const salaryMin = searchParams.get('salaryMin') ?? '';
  const education = searchParams.get('education') ?? '';
  const category = searchParams.get('category') ?? '';

  const fetchJobs = useCallback(
    async (targetPage = 1) => {
      if (!region) {
        setLoading(false);
        setJobs([]);
        return;
      }

      setLoading(true);
      const q = new URLSearchParams({ limit: '10', page: String(targetPage), region });
      if (province) q.set('province', province);
      if (jobType) q.set('jobType', jobType);
      if (salaryMin) q.set('salaryMin', salaryMin);
      if (education) q.set('education', education);
      if (category) q.set('category', category);

      const hasSearchFilters = keyword || province || jobType || salaryMin || education || category;
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
        const list: Job[] = Array.isArray(data?.data) ? data.data : [];
        const meta = data?.meta ?? {};

        const counts: Record<string, number> = {};
        list.forEach((job) => {
          counts[job.id] = job._count?.savedBy || 0;
        });

        setSaveCounts((prev) => ({ ...prev, ...counts }));
        setJobs(list);
        setTotal(meta.total ?? list.length);
        setTotalPages(meta.totalPages ?? 1);
        setPage(targetPage);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
        if (targetPage > 1) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [region, keyword, province, jobType, salaryMin, education, category],
  );

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_URL}/jobs/saved/ids`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: string[]) => setSavedIds(new Set(ids)))
      .catch(() => { });
  }, [user]);

  const handleSelectJob = useCallback(
    async (job: Job) => {
      setSelectedJob(job);
      setDetailJob(null);
      setApplyStatus('idle');

      setDetailLoading(true);
      try {
        const res = await fetch(`${API_URL}/jobs/${job.slug}`);
        if (res.ok) {
          const data = await res.json();
          setDetailJob(data);
        }
      } catch (e) {
        console.error('Failed to fetch job detail', e);
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  const handleApply = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    const targetJob = detailJob || selectedJob;
    if (!targetJob) return;

    setIsApplying(true);
    setApplyStatus('idle');
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token');

      const res = await fetch(`${API_URL}/jobs/${targetJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.message === 'ALREADY_APPLIED' || res.status === 400) {
          setApplyStatus('already_applied');
          return;
        }
        throw new Error(data.message || 'Apply failed');
      }

      setApplyStatus('success');
    } catch (err: any) {
      console.error('Apply error:', err);
      if (err.message && err.message.includes('ALREADY_APPLIED')) {
        setApplyStatus('already_applied');
      } else {
        setApplyStatus('error');
        alert(err.message || 'เกิดข้อผิดพลาดในการสมัครงาน กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggleSave = async (jobId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const wasSaved = savedIds.has(jobId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
    setSaveCounts((prev) => ({
      ...prev,
      [jobId]: (prev[jobId] || 0) + (wasSaved ? -1 : 1),
    }));

    try {
      await fetch(`${API_URL}/jobs/${jobId}/save`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      setSaveCounts((prev) => ({
        ...prev,
        [jobId]: (prev[jobId] || 0) + (wasSaved ? 1 : -1),
      }));
    }
  };

  const handleSearch = (values: SearchParams) => {
    if (!region) {
      return;
    }

    const q = new URLSearchParams();
    if (values.keyword) q.set('keyword', values.keyword);
    if (values.province) q.set('province', values.province);
    if (values.jobType) q.set('jobType', values.jobType);
    if (values.salaryMin) q.set('salaryMin', values.salaryMin);
    if (values.education) q.set('education', values.education);
    if (values.category) q.set('category', values.category);
    router.push(`/all_group_job/${region}${q.toString() ? `?${q.toString()}` : ''}`);
    setSelectedJob(null);
    setDetailJob(null);
  };

  const activeFilters = useMemo(
    () => [keyword && `“${keyword}”`, province, jobType && JOB_TYPE_LABEL[jobType], category]
      .filter(Boolean)
      .join(' · '),
    [keyword, province, jobType, category],
  );

  if (!region) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-xl text-center bg-white rounded-3xl border border-gray-200 shadow-sm p-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <Map className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ไม่พบภูมิภาคที่เลือก</h1>
            <p className="mt-3 text-sm text-gray-500">
              กรุณากลับไปเลือกหมวดภูมิภาคจากหน้ารวมหมวดงานอีกครั้ง
            </p>
            <div className="mt-6">
              <Link
                href="/all_group_job"
                className="inline-flex items-center gap-2 rounded-xl bg-[#020263] px-5 py-3 font-semibold text-white hover:bg-[#0a0a7a]"
              >
                <ChevronLeft className="h-4 w-4" />
                กลับไปหน้าหมวดงานทั้งหมด
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <HeroSearch
        onSearch={handleSearch}
        initialValues={{ keyword, province, jobType, education, category }}
      />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 rounded-3xl bg-white p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Map className="h-4 w-4" />
                {t('all_group_job.region_badge_label')}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#020263]">{regionLabel}</h1>
              <p className="mt-2 text-sm text-gray-500">
                {t('all_group_job.regional_description', { region: regionLabel })}
              </p>
              {activeFilters && !loading && (
                <p className="mt-2 text-sm text-gray-400">{t('filters_label')} {activeFilters}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/all_group_job"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#020263]/30 hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('all_group_job.back_to_categories')}
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl bg-[#020263] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0a0a7a]"
              >
                {t('all_group_job.view_all_jobs')}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {loading ? t('all_group_job.loading') : t('all_group_job.jobs_found_count', { count: total, region: regionLabel })}
            </h2>
            {!loading && province && (
              <p className="text-sm text-gray-400 mt-0.5">{t('filtering_province', { province })}</p>
            )}
          </div>
          {(keyword || province || jobType || salaryMin || education || category) && (
            <button
              onClick={() => router.push(`/all_group_job/${region}`)}
              className="text-sm text-blue-600 hover:underline"
            >
              {t('clear_filters')}
            </button>
          )}
        </div>

        {loading && <SkeletonSection />}

        {!loading && jobs.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 shadow-sm w-full">
            <div className="text-5xl mb-4">🔍</div>
            <div className="text-gray-700 font-semibold text-lg mb-2">{t('all_group_job.no_jobs_found', { region: regionLabel })}</div>
            <p className="text-gray-400 text-sm mb-6">{t('all_group_job.try_changing_filters')}</p>
            <button
              onClick={() => router.push(`/all_group_job/${region}`)}
              className="px-6 py-2.5 bg-[#020263] text-white rounded-xl font-semibold text-sm hover:bg-[#0a0a7a] transition-colors"
            >
              {t('all_group_job.view_all_in_region')}
            </button>
          </div>
        )}

        {/* Split-panel layout */}
        <div className="flex gap-5 items-start">
          {/* Left: Job list */}
          <div
            className="flex flex-col gap-4 transition-all duration-300 w-full"
          >
            {!loading && jobs.length > 0 && (
              <div className="flex flex-col gap-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    router={router}
                    isSelected={selectedJob?.id === job.id}
                    isSaved={savedIds.has(job.id)}
                    saveCount={saveCounts[job.id] || 0}
                    onSelect={handleSelectJob}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>
            )}

            {/* Pagination inside left panel */}
            {!loading && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchJobs(page - 1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('pagination_prev')}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .map((p, index, arr) => (
                    <div key={p} className="flex items-center gap-2">
                      {index > 0 && arr[index - 1] !== p - 1 && (
                        <span className="px-2 py-2 text-sm text-gray-400">…</span>
                      )}
                      <button
                        onClick={() => fetchJobs(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${p === page
                          ? 'bg-[#020263] text-white shadow-md'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {p}
                      </button>
                    </div>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchJobs(page + 1)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t('pagination_next')}
                </button>
              </div>
            )}
          </div>

          {selectedJob && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-6xl h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl">
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

export default function RegionJobsPage() {
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
        <RegionJobsContent />
      </Suspense>
      <Footer />
    </div>
  );
}
