'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { bookmarkService } from '@/services/bookmark';
import { useTranslations, useLocale } from 'next-intl';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Languages,
  UserRound,
  X,
  BadgeInfo,
  CalendarDays,
  Star,
  FileText,
  MessageCircle,
  Heart,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type EducationHistory = {
  id: string;
  educationLevel: string;
  degreeName: string;
  major: string;
  faculty: string;
  institution: string;
  graduationYear: string | number;
  gpa: number | null;
};

type WorkHistory = {
  id: string;
  position: string;
  company: string;
  businessType: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
};

type CandidateDetail = {
  id: string;
  fullName: string;
  gender: string;
  age: number | null;
  desiredPosition: string;
  expectedSalaryText: string;
  educationLevel: string;
  major: string;
  province: string;
  postedAt: string;
  skills: string[];
  institution: string;
  gpa: number | null;
  englishLevelLabel: string;
  englishStars: number;
  englishDetails: string;
  candidateType: string;
  nationality: string;
  religion: string;
  workProvince: string;
  educationHistory: EducationHistory[];
  workHistory: WorkHistory[];
  resumeFileUrl: string | null;
  avatarUrl?: string | null;
};

type ContactData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  lineId: string;
};

interface CandidateDetailModalProps {
  candidateId: string;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => void;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function timeAgo(dateStr: string, locale: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  const isEn = locale === 'en';

  if (years > 0) return isEn ? `${years} ${years === 1 ? 'year' : 'years'} ago` : `${years} ปีที่แล้ว`;
  if (months > 0) return isEn ? `${months} ${months === 1 ? 'month' : 'months'} ago` : `${months} เดือนที่แล้ว`;
  if (weeks > 0 && days >= 14) return isEn ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago` : `${weeks} สัปดาห์ที่แล้ว`;
  if (days > 0) return isEn ? `${days} ${days === 1 ? 'day' : 'days'} ago` : `${days} วันที่แล้ว`;
  if (hrs > 0) return isEn ? `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago` : `${hrs} ชั่วโมงที่แล้ว`;
  if (mins > 0) return isEn ? `${mins} ${mins === 1 ? 'min' : 'mins'} ago` : `${mins} นาทีที่แล้ว`;

  return isEn ? 'Just now' : 'เพิ่งโพสต์';
}

function GenderBadge({ avatarUrl }: { avatarUrl: string | null | undefined }) {
  const imageSrc = avatarUrl || "/images/Proflie_SeekJobDD.webp";
  return (
    <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
      <Image
        src={imageSrc}
        alt="Profile"
        fill
        sizes="96px"
        priority
        className="object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/images/Proflie_SeekJobDD.webp";
        }}
      />
    </div>
  );
}


export function CandidateDetailModal({ candidateId, onClose, isBookmarked, onBookmarkToggle }: CandidateDetailModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<CandidateDetail | null>(null);
  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState('');
  const [contactError, setContactError] = useState('');
  const t = useTranslations('CandidateDirectory');
  const locale = useLocale();


  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`${API_URL}/users/candidate-directory/${candidateId}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || t('detailModal.errorFetchDetail'));
        }

        setData(json);
      } catch (error: unknown) {
        setError(getErrorMessage(error, t('detailModal.errorDefault')));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [candidateId]);

  const handleShowContact = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'EMPLOYER') {
      setContactError(t('detailModal.employerOnlyError'));
      return;
    }

    try {
      setContactLoading(true);
      setContactError('');
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/users/candidate-directory/${candidateId}/contact`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || t('detailModal.errorFetchContact'));
      }

      setContact(json);
    } catch (error: unknown) {
      setContactError(getErrorMessage(error, t('detailModal.errorFetchContact')));
    } finally {
      setContactLoading(false);
    }
  };

  const starList = useMemo(() => Array.from({ length: 5 }, (_, index) => index < (data?.englishStars || 0)), [data?.englishStars]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-sm text-center">
          <div className="w-10 h-10 border-4 border-[#020263] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">{t('detailModal.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-8 shadow-2xl w-full max-w-md text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
            <BadgeInfo className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{t('detailModal.errorTitle')}</h3>
          <p className="text-sm text-slate-500 mb-6">{error || t('detailModal.errorDefault')}</p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold transition-colors"
          >
            {t('detailModal.closeBtn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden min-h-[80vh]">
        <div className="bg-white border-b border-slate-100 px-6 sm:px-8 py-6 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-3">
              <Briefcase className="w-4 h-4" />
              {data.candidateType ? t(`list.${data.candidateType.toLowerCase()}`) : t('list.jobSeeker')}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('detailModal.desiredPosition')}</h2>
            <p className="text-sm text-slate-500 mt-2">
              {t('detailModal.postedAt', { time: timeAgo(data.postedAt, locale) })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'EMPLOYER' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onBookmarkToggle) {
                    onBookmarkToggle();
                  }
                  bookmarkService.toggle(candidateId).catch((err) => {
                    console.error("Bookmark failed", err);
                    onBookmarkToggle?.();
                  });
                }}
                className={`p-2.5 rounded-full border transition-all ${isBookmarked
                  ? "bg-rose-50 border-rose-100 text-rose-500"
                  : "bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500"
                  }`}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-0">
          <aside className="bg-[#0f172a] text-white p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center gap-4">
              <GenderBadge avatarUrl={data.avatarUrl} />
              <div>
                <h3 className="text-xl font-bold">{data.fullName}</h3>
                <p className="text-slate-300 text-sm mt-1">{t('list.lookingFor')}: {data.candidateType
                  ? t(`list.${data.candidateType.toLowerCase()}`)
                  : '-'}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-slate-300 mb-1"> {t('filters.genderAll')} </div>
                <div className="font-semibold">{data.gender ? t(`filters.gender.${data.gender}`) : t('list.noGender')}</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-slate-300 mb-1">{t('list.age')}</div>
                <div className="font-semibold">{data.age ? `${data.age} ${t('list.ageUnit')}` : '-'}</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-slate-300 mb-1">{t('detailModal.religion')}</div>
                <div className="font-semibold">{data.religion || '-'}</div>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-slate-300 mb-1">{t('detailModal.nationality')}</div>
                <div className="font-semibold">{data.nationality ? (t(`detailModal.nationalityValue.${data.nationality.toLowerCase()}`) || data.nationality) : '-'}</div>
              </div>
            </div>

            <div className="rounded-3xl bg-white text-slate-900 p-4 border border-white/20">
              <button
                onClick={handleShowContact}
                disabled={contactLoading}
                className="w-full py-3 rounded-2xl bg-[#020263] hover:bg-[#11117c] disabled:opacity-60 text-white font-bold transition-colors"
              >
                {contactLoading ? `${t('detailModal.loadingContact')}` : `${t('detailModal.showContactBtn')}`}
              </button>

              {contactError && <p className="mt-3 text-sm text-red-500">{contactError}</p>}

              {contact && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                    <Mail className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <div className="text-slate-500">{t('detailModal.contactEmail')}</div>
                      <div className="font-semibold break-all">{contact.email}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                    <Phone className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <div className="text-slate-500">{t('detailModal.contactPhone')}</div>
                      <div className="font-semibold">{contact.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                    <MessageCircle className="w-4 h-4 mt-0.5 text-slate-400" />
                    <div>
                      <div className="text-slate-500">{t('detailModal.contactLine')}</div>
                      <div className="font-semibold">{contact.lineId}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <section className="p-6 sm:p-8 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-black mb-4">{data.desiredPosition}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <Briefcase className="w-4 h-4 mt-0.5 text-indigo-500" />
                  <div>
                    <div className="text-slate-500">{t('detailModal.expectedSalary')}</div>
                    <div className="font-semibold">{data.expectedSalaryText}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <MapPin className="w-4 h-4 mt-0.5 text-indigo-500" />
                  <div>
                    <div className="text-slate-500">{t('detailModal.workProvince')}</div>
                    <div className="font-semibold">{data.workProvince}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{t('detailModal.skillsTitle')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skills.length > 0 ? (
                  data.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">{t('list.noSkills')}</span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Languages className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{t('detailModal.englishLevel')}</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {starList.map((filled, index) => (
                  <Star
                    key={index}
                    className={`w-5 h-5 ${filled ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                  />
                ))}
                <span className="ml-1 text-sm font-semibold text-slate-800">{data.englishLevelLabel}</span>
              </div>
              <p className="text-sm text-slate-500">{data.englishDetails}</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{t('detailModal.educationTitle')}</h3>
              </div>
              <div className="space-y-4">
                {data.educationHistory.length > 0 ? (
                  data.educationHistory.map((education) => (
                    <div key={education.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="font-bold text-slate-900">
                        {education.educationLevel} {education.degreeName !== '-' ? `· ${education.degreeName}` : ''}
                      </div>
                      <div className="text-sm text-slate-700 mt-1">{t('detailModal.majorPrefix')} {education.major}</div>
                      <div className="text-sm text-slate-700">{t('detailModal.institutionPrefix')} {education.institution}</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span>{t('list.updated')} {education.graduationYear}</span>
                        <span>GPA {education.gpa ?? '-'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{t('detailModal.noEducation')}</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{t('detailModal.workHistoryTitle')}</h3>
              </div>
              <div className="space-y-4">
                {data.workHistory.length > 0 ? (
                  data.workHistory.map((work) => (
                    <div key={work.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="font-bold text-slate-900">{work.position}</div>
                      <div className="text-sm text-slate-700 mt-1">{work.company}</div>
                      <div className="text-xs text-slate-500 mt-2">
                        {work.startMonth}/{work.startYear} -{' '}
                        {work.isCurrent ? t('detailModal.present') : `${work.endMonth}/${work.endYear}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">{t('detailModal.noWork')}</p>
                )}
              </div>
            </div>

            {data.resumeFileUrl && (
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-extrabold text-black">Resume</h3>
                </div>
                <a
                  href={data.resumeFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {t('detailModal.viewResume')}
                </a>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
