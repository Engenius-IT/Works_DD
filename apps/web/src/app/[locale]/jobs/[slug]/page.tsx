'use client';

import { useState, useEffect } from 'react';
import { ImageLightbox } from '@/components/ImageLightbox';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CompanyLogo } from '@/components/CompanyLogo';
import { useAuth } from '@/context/AuthContext';
import { useTranslator } from '@/hooks/useTranslator';
import { Translate } from '@/components/Translate';
import {
  Bus,
  TrainFront,
  TramFront,
  Plane,
  Train,
  MapPin,
  Phone,
  User,
  GraduationCap,
  Briefcase as BriefcaseIcon,
  Calendar,
  CheckCircle2,
  Bookmark,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Company {
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
}

interface Job {
  id: string;
  title: string;
  slug: string;
  description?: string;
  requirements?: string;
  benefits?: string | string[];
  jobType: string;
  workModel: string;
  locationProvince?: string;
  locationDistrict?: string;
  companyAddress?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible: boolean;
  mapUrl?: string;
  requiredSkills: string[];
  status: string;
  createdAt: string;
  company: Company;
  education?: string;
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
  positions?: number;
  workingDays?: string;
  startTime?: string;
  endTime?: string;
  canOnlineInterview?: boolean;
  companyImages?: string[];
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

function isVerifiedCompany(company: Company) {
  return company.isVerified || company.verificationStatus === 'VERIFIED';
}

const CompanyAvatar = ({ company }: { company: any }) => (
  <CompanyLogo company={company} size="lg" />
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-[17px] font-bold text-[#020263] mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-[#E00016] rounded-full inline-block"></span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function TextBlock({ text }: { text: string }) {
  const isHtml = text.trimStart().startsWith('<');

  if (isHtml) {
    return (
      <div
        className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none overflow-hidden break-words
          [&_*]:max-w-full [&_*]:break-all
          prose-headings:text-gray-800 prose-headings:font-semibold
          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
          prose-ul:pl-5 prose-ol:pl-5 prose-li:my-0.5
          prose-strong:text-gray-800 prose-em:text-gray-600
          prose-hr:border-gray-200"
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  return (
    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-all overflow-hidden">
      {text}
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gray-200 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="flex gap-2">
              <div className="h-7 bg-gray-100 rounded-full w-24" />
              <div className="h-7 bg-gray-100 rounded-full w-20" />
            </div>
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-4 bg-gray-100 rounded w-4/6" />
        </div>
      ))}
    </div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { user } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error' | 'already_applied'>(
    'idle',
  );
  const [applyMessage, setApplyMessage] = useState('');
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const handleApply = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'JOBSEEKER') {
      setApplyStatus('error');
      setApplyMessage('สงวนสิทธิ์การสมัครสำหรับผู้หางานเท่านั้น');
      return;
    }
    if (!job) return;

    setIsApplying(true);
    setApplyStatus('idle');
    setApplyMessage('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'You have already applied for this job') {
          setApplyStatus('already_applied');
        } else {
          throw new Error(data.message || 'การสมัครงานล้มเหลว');
        }
      } else {
        setApplyStatus('success');
      }
    } catch (err: unknown) {
      setApplyStatus('error');
      setApplyMessage(err instanceof Error ? err.message : 'การสมัครงานล้มเหลว');
    } finally {
      setIsApplying(false);
    }
  };

  // Load saved state from localStorage
  useEffect(() => {
    if (!slug) return;
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    setIsSaved(saved.includes(slug));
  }, [slug]);

  const toggleSave = () => {
    if (!slug) return;
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]') as string[];
    let updated: string[];
    if (saved.includes(slug)) {
      updated = saved.filter((s) => s !== slug);
      setIsSaved(false);
    } else {
      updated = [...saved, slug];
      setIsSaved(true);
    }
    localStorage.setItem('savedJobs', JSON.stringify(updated));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    fetch(`${API_URL}/jobs/${slug}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setJob(data);
          if (data.hasApplied) {
            setApplyStatus('already_applied');
          }
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch similar jobs
  useEffect(() => {
    if (!slug) return;
    fetch(`${API_URL}/jobs/${slug}/similar`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSimilarJobs(Array.isArray(data) ? data : []))
      .catch(() => setSimilarJobs([]));
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-16 py-8 w-full flex-1 overflow-x-hidden">
        {/* Back button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/jobs');
            }
          }}
          className="flex items-center gap-1.5 text-sm text-[#000000] hover:text-gray-700 mb-6 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          กลับไปรายการงาน
        </button>

        {/* Save toast */}
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 ${
            saveToast
              ? 'opacity-100 translate-y-0 bg-[#020263] text-white'
              : 'opacity-0 translate-y-2 pointer-events-none bg-[#020263] text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-white' : 'fill-none'}`} />
          {isSaved ? 'บันทึกงานแล้ว!' : 'ยกเลิกการบันทึกแล้ว'}
        </div>

        {/* Not found */}
        {notFound && (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-gray-700 mb-2">ไม่พบประกาศงานนี้</h1>
            <p className="text-gray-400 text-sm mb-6">อาจถูกปิดหรือลบไปแล้ว</p>
            <button
              onClick={() => router.push('/jobs')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              ดูงานทั้งหมด
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && <SkeletonDetail />}

        {/* Content */}
        {!loading && job && (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full min-w-0 overflow-hidden">
            {/* ─── Left Column ─── */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 drop-shadow-lg w-full min-w-0 overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-5 items-start min-w-0">
                  <CompanyAvatar company={job.company} />
                  <div className="flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold text-[#020263] leading-snug">
                      <Translate text={job.title} />
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1 min-w-0">
                      {isVerifiedCompany(job.company) && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <p className="text-[#020263] text-base truncate">{job.company.name}</p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-xl">
                        {JOB_TYPE_LABEL[job.jobType] || job.jobType}
                      </span>
                      <span className="text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-3 py-1 rounded-xl">
                        {WORK_MODEL_LABEL[job.workModel] || job.workModel}
                      </span>
                      {job.education && (
                        <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-xl">
                          {job.education}
                        </span>
                      )}
                      {job.category && (
                        <span className="text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-xl">
                          {job.category}
                        </span>
                      )}
                      {job.jobFunction && (
                        <span className="text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-xl">
                          {job.jobFunction}
                        </span>
                      )}
                    </div>

                    {/* Location + Salary */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-4 h-4 text-red-500 shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {job.locationProvince}
                        {job.locationDistrict ? ` · ${job.locationDistrict}` : ''}
                      </span>
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
                        {salaryText(job)}
                      </span>
                      <div className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1.5 text-gray-400">
                        <svg
                          className="w-4 h-4 shrink-0"
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
                        โพสต์ {timeAgo(job.createdAt)}
                      </span>
                      <button
                    onClick={toggleSave}
                    title={isSaved ? 'ยกเลิกบันทึก' : 'บันทึกงาน'}
                    className={`ml-2 shrink-0 flex flex-row items-center gap-1 p-2 rounded-xl transition-all ${
                      isSaved
                        ? 'text-[#E00016] bg-red-50 hover:bg-red-100'
                        : 'text-gray-400 hover:text-[#E00016] hover:bg-red-50'
                    }`}
                  >
                    <Bookmark
                      className={`w-5 h-5 transition-all ${
                        isSaved ? 'fill-[#E00016] stroke-[#E00016]' : 'fill-none stroke-current'
                      }`}
                    />
                    <span className="text-[10px] font-semibold leading-none">
                      {isSaved ? 'บันทึกแล้ว' : 'บันทึกงาน'}
                    </span>
                  </button>
                  </div>
                    </div>
                  </div>
                  {/* Save button */}
                  
                  
                </div>
              </div>

              {/* Description */}
              {job.description && (
                <Section title="รายละเอียดงาน">
                  <TextBlock text={job.description} />
                </Section>
              )}

              {/* Requirements */}
              {job.requirements && (
                <Section title="คุณสมบัติที่ต้องการ">
                  <TextBlock text={job.requirements} />
                </Section>
              )}

              {/* Skills */}
              {job.requiredSkills.length > 0 && (
                <Section title="ทักษะที่ต้องการ">
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="text-sm text-[#000000] bg-gray-50 border border-gray-200 px-4 py-1.5 rounded-full"
                      >
                        <Translate text={s} />
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Benefits */}
              {job.benefits && (
                <Section title="สวัสดิการ">
                  {Array.isArray(job.benefits) ? (
                    <ul className="list-disc list-inside text-[#000000] text-sm leading-relaxed space-y-1">
                      {job.benefits.map((b: string, i: number) => (
                        <li key={i}><Translate text={b} /></li>
                      ))}
                    </ul>
                  ) : (
                    <TextBlock text={job.benefits as string} />
                  )}
                </Section>
              )}

              {/* รูปภาพบริษัท */}
              {job.companyImages && job.companyImages.length > 0 && (
                <Section title="ภาพบรรยากาศในที่ทำงาน">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {job.companyImages.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setGalleryIndex(idx)}
                        className="group relative aspect-4/3 rounded-xl overflow-hidden border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <img
                          src={url}
                          alt={`รูปบริษัท ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/40 px-3 py-1 rounded-full transition-opacity">
                            ดูรูปภาพ
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {galleryIndex !== null && (
                    <ImageLightbox
                      images={job.companyImages}
                      initialIndex={galleryIndex}
                      onClose={() => setGalleryIndex(null)}
                    />
                  )}
                </Section>
              )}

              {/* คุณสมบัติผู้สมัคร */}
              {(job.qualificationGender ||
                job.education ||
                job.qualificationAgeMin ||
                job.qualificationAgeMax ||
                job.qualificationExperience != null) && (
                <Section title="คุณสมบัติผู้สมัคร">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {job.qualificationGender && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">เพศ</p>
                          <p className="font-medium text-gray-700">{job.qualificationGender}</p>
                        </div>
                      </div>
                    )}
                    {(job.qualificationAgeMin || job.qualificationAgeMax) && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">อายุ</p>
                          <p className="font-medium text-gray-700">
                            {job.qualificationAgeMin && job.qualificationAgeMax
                              ? `${job.qualificationAgeMin} – ${job.qualificationAgeMax} ปี`
                              : job.qualificationAgeMin
                                ? `${job.qualificationAgeMin}+ ปี`
                                : `ไม่เกิน ${job.qualificationAgeMax} ปี`}
                          </p>
                        </div>
                      </div>
                    )}
                    {job.education && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">วุฒิการศึกษา</p>
                          <p className="font-medium text-gray-700">{job.education}</p>
                        </div>
                      </div>
                    )}
                    {job.qualificationExperience != null && job.qualificationExperience > 0 && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                          <BriefcaseIcon className="w-4 h-4 text-purple-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">ประสบการณ์</p>
                          <p className="font-medium text-gray-700">
                            {job.qualificationExperience} ปี
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              )}

              {/* คุณสมบัติเพิ่มเติม */}
              {job.additionalQualifications && job.additionalQualifications.length > 0 && (
                <Section title="คุณสมบัติเพิ่มเติม">
                  <div className="flex flex-wrap gap-2">
                    {job.additionalQualifications.map((q, i) => (
                      <span
                        key={i}
                        className="text-sm text-[#000000] bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full"
                      >
                        <Translate text={q} />
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* การเดินทาง */}
              {job.transportation && job.transportation.length > 0 && (
                <Section title="การเดินทาง">
                  <div className="flex flex-wrap gap-2">
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
                          className="flex items-center gap-1.5 text-sm text-[#000000] bg-blue-50 border border-[#020263] px-4 py-2 rounded-xl"
                        >
                          <Icon className="w-4 h-4" />
                          <Translate text={t} />
                        </span>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Map */}
              {job.mapUrl && (
                <Section title="แผนที่และที่ตั้งบริษัท">
                  {job.mapUrl.includes('<iframe') ? (
                    <div
                      className="w-full h-80 overflow-hidden rounded-xl border border-gray-200"
                      dangerouslySetInnerHTML={{ __html: job.mapUrl }}
                    />
                  ) : job.mapUrl.includes('google.com/maps/embed') ? (
                    <div className="w-full h-80 overflow-hidden rounded-xl border border-gray-200">
                      <iframe
                        src={job.mapUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-sm text-xl">
                          📍
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-base">
                            ดูแผนที่บน Google Maps
                          </p>
                          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            คลิกเพื่อเปิดดูตำแหน่งที่ตั้งของบริษัทนี้ผ่านแอปพลิเคชันแผนที่
                          </p>
                        </div>
                        <a
                          href={job.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all shadow-sm group"
                        >
                          เปิดแผนที่
                          <svg
                            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  )}
                </Section>
              )}
            </div>

            {/* ─── Right Sidebar ─── */}
            <div className="w-full lg:w-80 shrink-0 space-y-4">
              {/* Apply button card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <button
                  onClick={handleApply}
                  disabled={
                    isApplying || applyStatus === 'success' || applyStatus === 'already_applied'
                  }
                  className={`w-full font-bold text-base py-3.5 rounded-xl transition-colors shadow-sm ${
                    applyStatus === 'success' || applyStatus === 'already_applied'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-[#E00016] hover:bg-[#A80010] text-white'
                  }`}
                >
                  {isApplying
                    ? 'กำลังส่งคำขอ...'
                    : applyStatus === 'success'
                      ? 'สมัครสำเร็จแล้ว!'
                      : applyStatus === 'already_applied'
                        ? 'คุณสมัครงานนี้ไปแล้ว'
                        : 'สมัครงานนี้'}
                </button>
                {applyStatus === 'error' && (
                  <p className="text-xs text-red-500 mt-3">{applyMessage}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">ฟรี ไม่มีค่าใช้จ่าย</p>
              </div>

              {/* Company info card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#020263] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#E00016] rounded-full inline-block"></span>
                  ข้อมูลบริษัท
                </h2>

                <div className="flex items-center gap-3 mb-4">
                  <CompanyAvatar company={job.company} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isVerifiedCompany(job.company) && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      <p className="font-bold text-gray-800 text-sm leading-snug truncate">
                        {job.company.name}
                      </p>
                    </div>
                    {isVerifiedCompany(job.company) && (
                      <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold">Verified Account</span>
                      </div>
                    )}
                    {job.company.industry && (
                      <p className="text-xs text-gray-400 mt-0.5"><Translate text={job.company.industry} /></p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  {job.company.size && (
                    <div className="flex items-start gap-2 text-gray-600">
                      <svg
                        className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                      <span>{job.company.size}</span>
                    </div>
                  )}
                  {job.company.website && (
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-4 h-4 text-gray-400 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253"
                        />
                      </svg>
                      <a
                        href={
                          job.company.website.startsWith('http')
                            ? job.company.website
                            : `https://${job.company.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {job.company.website}
                      </a>
                    </div>
                  )}
                  {job.company.description && (
                    <p className="text-[#000000] text-xs leading-relaxed border-t border-gray-100 pt-3 mt-3">
                      <Translate text={job.company.description} />
                    </p>
                  )}
                </div>
              </div>

              {/* Contact info + address card */}
              {(job.contactName || job.contactPhone || job.companyAddress) && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="text-sm font-bold text-[#020263] mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-[#E00016] rounded-full inline-block"></span>
                    ข้อมูลผู้ติดต่อ
                  </h2>
                  <div className="space-y-3">
                    {job.contactName && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-[#000000]">{job.contactName}</span>
                      </div>
                    )}
                    {job.contactPhone && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <a href={`tel:${job.contactPhone}`} className="text-[#000000]">
                          {job.contactPhone}
                        </a>
                      </div>
                    )}
                    {job.companyAddress && (
                      <div className="flex items-start gap-2.5 text-sm pt-1">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-[#000000] leading-relaxed">{job.companyAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Job summary card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-[#020263] mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-[#E00016] rounded-full inline-block"></span>
                  สรุปข้อมูลงาน
                </h2>
                <div className="space-y-3 text-sm">
                  {job.positions && job.positions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">จำนวนรับ</span>
                      <span className="text-[#000000] font-medium">{job.positions} ตำแหน่ง</span>
                    </div>
                  )}
                  {job.workingDays && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">วันทำงาน</span>
                      <span className="text-[#000000] font-medium">{job.workingDays}</span>
                    </div>
                  )}
                  {job.startTime && job.endTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">เวลาทำงาน</span>
                      <span className="text-gray-700 font-medium">
                        {job.startTime} – {job.endTime}
                      </span>
                    </div>
                  )}
                  {job.canOnlineInterview && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">สัมภาษณ์ออนไลน์</span>
                      <span className="text-green-600 font-medium">รองรับ</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Similar Jobs Section ─── */}
        {!loading && job && similarJobs.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-7 bg-[#E00016] rounded-full"></span>
              <h2 className="text-xl font-bold text-[#020263]">งานที่ใกล้เคียง</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {similarJobs.map((sJob) => (
                <Link
                  href={`/jobs/${sJob.slug}`}
                  key={sJob.id}
                  className="border border-gray-300 rounded-3xl p-6 relative hover:shadow-lg transition-shadow bg-white flex flex-col group cursor-pointer"
                >
                  {/* Header: Logo, Title, Time */}
                  <div className="flex items-start gap-4 mb-4">
                    {sJob.company.logoUrl ? (
                      <img
                        src={sJob.company.logoUrl}
                        alt={sJob.company.name}
                        className="w-14 h-14 rounded-xl object-contain border border-gray-100 bg-white"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shrink-0">
                        {sJob.company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1 truncate group-hover:text-red-700 transition-colors">
                        {sJob.title}
                      </h3>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isVerifiedCompany(sJob.company) && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                        <p className="text-gray-500 text-sm truncate">{sJob.company.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400 text-xs whitespace-nowrap shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                      {timeAgo(sJob.createdAt)}
                    </div>
                  </div>

                  {/* Details: Badges (Job Type, Category) */}
                  <div className="flex w-full flex-wrap items-center gap-2 mb-4">
                    <span className="bg-[#202263] text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-blue-100">
                      {JOB_TYPE_LABEL[sJob.jobType] || sJob.jobType}
                    </span>
                    {sJob.category && (
                      <span className="bg-[#A80010] text-white px-2.5 py-1 rounded-full text-xs font-semibold border border-purple-100">
                        {sJob.category}
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
                        สถานที่ : {sJob.locationProvince}
                        {sJob.locationDistrict ? ` เขต${sJob.locationDistrict}` : ''}
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
                      <span className="text-lg">เงินเดือน : {salaryText(sJob)}</span>
                    </div>
                    {sJob.positions && sJob.positions > 0 && (
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-5 h-5 text-red-600 shrink-0"
                        >
                          <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                        </svg>
                        <span className="text-lg"> จำนวนรับสมัคร : {sJob.positions} อัตรา</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* View all button */}
            <div className="text-center mt-8">
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 px-8 py-3 bg-[#020263] hover:bg-[#00003D] text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                ดูงานทั้งหมด
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
