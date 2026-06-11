'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { bookmarkService } from '@/services/bookmark';
import { useTranslations, useLocale } from 'next-intl';
import axios from 'axios';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Languages,
  X,
  BadgeInfo,
  CalendarDays,
  Star,
  FileText,
  MessageCircle,
  Heart,
  Clock,
  ExternalLink,
  Award,
  Car,
  Lock,
  LockOpen,
  Timer,
  ShieldCheck,
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
  experience: number | null;
  languages: UserLanguage[];
  languageTests: LanguageTest[];
  certificates: Certificate[];
  drivingSkills: string[];
  desiredProvinces: string[];
  subDistrict?: string;
  district?: string;
  postalCode?: string;
  isUnlocked?: boolean;
};

type UserLanguage = {
  id: string;
  language: string;
  level: string | null;
  speaking: string | null;
  reading: string | null;
  writing: string | null;
};

type LanguageTest = {
  id: string;
  testName: string;
  score: string | null;
  fileUrl: string | null;
};

type Certificate = {
  id: string;
  name: string;
  issuedBy: string | null;
  issueYear: string | null;
  imageUrl: string | null;
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
        onError={(e: any) => {
          const target = e.target as HTMLImageElement;
          target.src = "/images/Proflie_SeekJobDD.webp";
        }}
      />
    </div>
  );
}

const ContactRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-white transition-colors">
    <div className="mt-0.5">{icon}</div>
    <div>
      <div className="text-slate-400 text-[9px] uppercase font-bold">{label}</div>
      <div className="font-bold text-sm text-slate-900 break-all">{value || '-'}</div>
    </div>
  </div>
);


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
  const [showConfirmUseCC, setShowConfirmUseCC] = useState(false);
  const isUnlocked = !!contact || !!data?.isUnlocked;

  const getStarRating = (level: string) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('native') || l.includes('เจ้าของภาษา')) return 5;
    if (l.includes('fluent') || l.includes('ดีมาก')) return 4;
    if (l.includes('good') || l.includes('ดี')) return 3;
    if (l.includes('fair') || l.includes('พอใช้') || l.includes('ปานกลาง')) return 2;
    if (l.includes('basic') || l.includes('พื้นฐาน')) return 1;
    return 1;
  };

  const drivingSkillMap: Record<string, { th: string; en: string }> = {
    l_car: { th: 'ใบขับขี่รถยนต์', en: 'Car License' },
    l_bike: { th: 'ใบขับขี่รถจักรยานยนต์', en: 'Motorcycle License' },
    l_truck_6: { th: 'ใบขับขี่รถบรรทุก 6 ล้อ', en: '6-Wheel Truck License' },
    l_truck_10: { th: 'ใบขับขี่รถบรรทุก 10 ล้อ', en: '10-Wheel Truck License' },

    v_car: { th: 'มีรถยนต์ส่วนตัว', en: 'Own Private Car' },
    v_bike: { th: 'มีรถจักรยานยนต์ส่วนตัว', en: 'Own Motorcycle' },

    m_backhoe: { th: 'รถแบคโฮ (Backhoe)', en: 'Backhoe' },
    m_crane: { th: 'รถเครน (Crane)', en: 'Crane' },
    m_forklift: { th: 'รถยก (Forklift)', en: 'Forklift' },
  };

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');

        const token = localStorage.getItem('accessToken'); // เพิ่มการดึง Token
        const res = await fetch(`${API_URL}/users/candidate-directory/${candidateId}`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}), // ส่ง Token ไปถ้ามี
          }
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || t('detailModal.errorFetchDetail'));

        setData(json);
      } catch (error: unknown) {
        setError(getErrorMessage(error, t('detailModal.errorDefault')));
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [candidateId]);

  useEffect(() => {
    if (candidateId && data?.id) {
      const checkStatus = async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) return;

          const res = await axios.post(`${API_URL}/users/candidate-directory/${candidateId}/contact`,
            { confirmUseCC: false },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data) {
            setContact(res.data);
          }
        } catch (err: any) {
        }
      };
      checkStatus();
    }
  }, [candidateId, data?.id]);

  const handleShowContact = async (isConfirmed: boolean = false) => {
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confirmUseCC: isConfirmed // ส่งตัวนี้ไปบอกหลังบ้านว่า "กดยืนยันจ่ายแต้มแล้วนะ"
        }),
      });
      const json = await res.json();

      if (res.status === 402) {
        // 402 Payment Required: สมมติว่าหลังบ้านส่ง Code นี้มาถ้ายังไม่เคยปลดล็อกและไม่ได้สมัครงานมา
        setShowConfirmUseCC(true);
        return;
      }

      console.log("DEBUG CONTACT DATA:", json);

      if (!res.ok) {
        throw new Error(json.message || t('detailModal.errorFetchContact'));
      }

      setContact(json);
      setShowConfirmUseCC(false);
    } catch (error: unknown) {
      setContactError(getErrorMessage(error, t('detailModal.errorFetchContact')));
    } finally {
      setContactLoading(false);
    }
  };

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
  // วางไว้ก่อนบรรทัด return หรือตรงที่มีการประกาศ isUnlocked
  console.log("DEBUG CHECK:", {
    hasContact: !!contact,
    dataIsUnlocked: data?.isUnlocked,
    finalResult: isUnlocked
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto bg-slate-50 rounded-[2rem] shadow-2xl overflow-hidden min-h-[80vh]">
        {/* ปรับจาก items-center เป็น items-start เพื่อให้รองรับชื่อตำแหน่งที่ยาวหลายบรรทัดบนมือถือ */}
        <div className="bg-white border-b border-slate-100 px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          <div className="flex-1 min-w-0 w-full"> {/* เพิ่ม w-full เพื่อให้กินพื้นที่เต็มบนมือถือ */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 mb-2">
              <Briefcase className="w-4 h-4" />
              {data.candidateType ? t(`list.${data.candidateType.toLowerCase()}`) : t('list.jobSeeker')}
            </div>

            {/* ปรับให้ Header รองรับการขึ้นบรรทัดใหม่ และไม่เบียดกับปุ่ม */}
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight break-words">
                {data.desiredPosition?.split(',')[0].trim() || t('detailModal.desiredPosition')}
              </h2>

              {(data as any).jobTypes?.[0] && (
                <span className="inline-flex items-center px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 shadow-sm">
                  {(data as any).jobTypes[0]}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('detailModal.postedAt', { time: timeAgo(data.postedAt, locale) })}
            </p>
          </div>

          {/* ส่วนของปุ่ม ปรับให้ชิดขวาในจอใหญ่ และจัดวางให้เหมาะสมในมือถือ */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {user?.role === 'EMPLOYER' && (
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault(); // ใช้ preventDefault แทนเพื่อป้องกัน side effect

                  try {
                    // 1. เรียก Service เพื่อ Toggle สถานะใน Backend
                    await bookmarkService.toggle(candidateId);

                    // 2. แจ้ง Parent Component ให้ Handle การอัปเดต UI (เช่นเปลี่ยนสีปุ่มหรือรีเฟรชลิสต์)
                    if (onBookmarkToggle) {
                      onBookmarkToggle();
                    }
                  } catch (error) {
                    console.error("Failed to toggle bookmark:", error);
                    // กรณี Error อาจจะแจ้งเตือนผู้ใช้ตรงนี้
                  }
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all shadow-sm font-bold text-sm ${isBookmarked
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-500"
                  }`}
              >
                <Heart
                  className="w-5 h-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                />
                <span>
                  {isBookmarked
                    ? (locale === 'en' ? 'Saved' : 'บันทึกแล้ว')
                    : (locale === 'en' ? 'Save' : 'บันทึก')}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              <X className="w-6 h-6" />
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
                {data.religion && data.religion !== '-'
                  ? t(`detailModal.religionValue.${data.religion}`)
                  : '-'}
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3">
                <div className="text-slate-300 mb-1">{t('detailModal.nationality')}</div>
                <div className="font-semibold">{data.nationality ? (t(`detailModal.nationalityValue.${data.nationality.toLowerCase()}`) || data.nationality) : '-'}</div>
              </div>
            </div>

            <div className="rounded-3xl bg-white text-slate-900 p-4 border border-white/20">
              {/* --- 🟢 ส่วนที่ 1: ถ้าปลดล็อกแล้ว ต้องโชว์แค่นี้เท่านั้น --- */}
              {isUnlocked ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  {/* Header Status - ปลดล็อกแล้ว (เปลี่ยนเป็นโทน Indigo) */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 shadow-md">
                      <LockOpen className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-indigo-700 uppercase leading-tight">
                        {locale === 'en' ? 'Unlocked' : 'ปลดล็อกแล้ว'}
                      </span>
                      <span className="text-[10px] text-indigo-500 font-medium">
                        {locale === 'en' ? 'Access granted' : 'ได้รับสิทธิ์เข้าถึงข้อมูลแล้ว'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Grid & Resume Section */}
                  <div className="grid gap-3 mt-2">
                    <div className="grid gap-2">
                      <ContactRow
                        icon={<Mail className="w-4 h-4 text-indigo-500" />}
                        label={t('detailModal.contactEmail')}
                        value={contact?.email || (data as any)?.email}
                      />
                      <ContactRow
                        icon={<Phone className="w-4 h-4 text-indigo-500" />}
                        label={t('detailModal.contactPhone')}
                        value={contact?.phone || (data as any)?.phone}
                      />
                      <ContactRow
                        icon={<MessageCircle className="w-4 h-4 text-indigo-500" />}
                        label={t('detailModal.contactLine')}
                        value={contact?.lineId || (data as any)?.lineId}
                      />
                    </div>

                    {/* Resume Box - โทน Indigo ทั้งหมด */}
                    {data.resumeFileUrl && (
                      <div className="mt-4">
                        <a
                          href={data.resumeFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="
                                      group flex items-center justify-between w-full px-6 py-4 rounded-2xl 
                                      bg-indigo-600 text-white 
                                      shadow-[0_8px_16px_-6px_rgba(79,70,229,0.5)]
                                      hover:bg-indigo-700 hover:shadow-[0_12px_20px_-8px_rgba(79,70,229,0.6)]
                                      hover:-translate-y-0.5 transition-all duration-200
                                    "
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold tracking-wide">
                              {t('detailModal.viewResume')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/50 border border-indigo-400/30 text-[10px] font-black tracking-widest">
                            PDF
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* --- 🔴 ส่วนที่ 2: ถ้ายังไม่ปลดล็อก (ปุ่มแดง/ยืนยัน) --- */
                <div className="relative z-10 transition-all duration-500">
                  {!showConfirmUseCC ? (
                    <div className="group animate-in fade-in zoom-in-95 duration-300">
                      <button
                        onClick={() => handleShowContact(false)}
                        disabled={contactLoading}
                        className="
                                  w-full py-4 rounded-2xl 
                                  bg-gradient-to-r from-rose-600 to-red-600 
                                  text-white font-black text-sm tracking-wide
                                  shadow-[0_10px_20px_-5px_rgba(225,29,72,0.4)]
                                  hover:shadow-[0_20px_30px_-5px_rgba(225,29,72,0.6)]
                                  /* จุดสำคัญ: ใช้ relative และ z-20 เวลา hover เพื่อให้ลอยเหนือก้อนอื่นๆ */
                                  relative z-10 hover:z-20
                                  hover:-translate-y-1.5 active:scale-[0.97]
                                  transition-all duration-300 ease-out 
                                  flex items-center justify-center gap-3
                                "
                      >
                        {contactLoading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                              <Lock className="w-4 h-4" />
                            </div>
                            <span className="relative">{t('detailModal.showContactBtn')}</span>
                          </>
                        )}
                      </button>

                      {/* ส่วนเส้นขีดข้างล่าง */}
                      <div className="flex items-center justify-center gap-3 mt-4 opacity-60">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-200" />
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                          {locale === 'en' ? "Information Locked" : "ข้อมูลถูกล็อกไว้"}
                        </p>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-200" />
                      </div>
                    </div>
                  ) : (
                    /* ส่วนยืนยัน (Confirm Card) */
                    <div className="relative z-30 animate-in slide-in-from-bottom-2 fade-in duration-300 p-6 rounded-3xl bg-white border border-red-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)]">
                      <div className="flex flex-col items-center text-center">

                        {/* 🔄 ถ้ากำลังโหลด ให้โชว์สถานะ Unlocking */}
                        {contactLoading ? (
                          <div className="py-8 flex flex-col items-center animate-in fade-in zoom-in-95">
                            <div className="relative w-16 h-16 mb-4">
                              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-indigo-600 animate-pulse" />
                              </div>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 mb-1">
                              {locale === 'en' ? 'Unlocking...' : 'กำลังปลดล็อก...'}
                            </h4>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                              {locale === 'en' ? 'Processing Transaction' : 'กำลังดำเนินการ'}
                            </p>
                          </div>
                        ) : (
                          /* 🛑 ถ้าไม่ได้โหลด ให้โชว์ปุ่มยืนยันปกติ (โค้ดเดิมของพี่) */
                          <>
                            <div className={`
          w-14 h-14 rounded-2xl flex items-center justify-center mb-4
          ${contactError?.includes('โควต้า') ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'}
        `}>
                              {contactError?.includes('โควต้า') ? <Timer className="w-7 h-7 animate-pulse" /> : <ShieldCheck className="w-7 h-7" />}
                            </div>

                            <h4 className="text-base font-black text-slate-900 mb-1">
                              {contactError?.includes('โควต้า') ? (locale === 'en' ? 'Limit Reached' : 'ถึงขีดจำกัดแล้ว') : (locale === 'en' ? 'Confirm Unlock' : 'ยืนยันการเข้าถึง')}
                            </h4>

                            <p className="text-xs text-slate-500 mb-6 leading-relaxed px-2">
                              {contactError || (locale === 'en' ? "Use 1 CC to unlock this candidate's contact info?" : "ระบบจะหัก 1 CC เพื่อแสดงข้อมูลติดต่อและ Resume")}
                            </p>

                            <div className="flex gap-3 w-full">
                              {!contactError?.includes('โควตา') && (
                                <button
                                  onClick={() => handleShowContact(true)}
                                  className="flex-[2] py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-2xl font-black shadow-lg shadow-red-200 transition-all active:scale-95"
                                >
                                  {locale === 'en' ? 'Confirm' : 'ยืนยันปลดล็อก'}
                                </button>
                              )}
                              <button
                                onClick={() => { setShowConfirmUseCC(false); setContactError(''); }}
                                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-2xl font-bold transition-all"
                              >
                                {locale === 'en' ? 'Cancel' : 'ยกเลิก'}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ⚠️ ส่วนที่ 3: Error ทั่วไป (จะโชว์ได้ทั้งสองสถานะถ้ามี Error หลุดมา) */}
              {contactError && !showConfirmUseCC && (
                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 flex items-center gap-2">
                  <BadgeInfo className="w-4 h-4 shrink-0" />
                  <span className="leading-tight font-medium">{contactError}</span>
                </div>
              )}
            </div>
          </aside>

          <section className="p-6 sm:p-8 space-y-6">

            {/* ส่วนที่ 1: รายการตำแหน่งที่สนใจ (Desired Positions) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{locale === 'en' ? 'Job Preferences' : 'ตำแหน่งงานที่สนใจ'}</h3>
              </div>

              <div className="space-y-4">
                {data.desiredPosition ? (
                  data.desiredPosition.split(',').map((pos, idx) => (
                    <div key={idx} className="flex items-center gap-3 w-full group">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />

                      <span className="text-sm font-bold text-slate-800 whitespace-nowrap">
                        {pos.trim()}
                      </span>

                      <div className="flex-grow border-b border-dotted border-slate-300 mx-2 mb-1" />

                      {(data as any).jobTypes?.[idx] && (
                        <div className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 whitespace-nowrap shadow-sm group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
                          {(data as any).jobTypes[idx]}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">{t('list.noSpecified')}</p>
                )}
              </div>

              {/* จังหวัดที่สนใจ */}
              <div className="mt-6 pt-6 border-t border-slate-50">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {locale === 'en' ? 'Preferred Locations' : 'จังหวัดที่สนใจทำงาน'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.desiredProvinces?.map((p, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded-lg border border-slate-200">
                      {p}
                    </span>
                  )) || '-'}
                </div>
              </div>
            </div>

            {/* ส่วนที่ 2: ข้อมูลทั่วไป (General Info) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BadgeInfo className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{locale === 'en' ? 'General Information' : 'ข้อมูลทั่วไป'}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100">
                  <Briefcase className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-500 text-xs">{t('detailModal.expectedSalary')}</div>
                    <div className="font-bold text-slate-900 text-xl mt-1">{data.expectedSalaryText}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 border border-slate-100">
                  <MapPin className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-slate-500 text-xs">{locale === 'en' ? 'Current Location' : 'ที่อยู่ปัจจุบัน'}</div>
                    <div className="font-bold text-slate-900 text-sm leading-relaxed mt-1">
                      {data.province ? `${data.subDistrict || ''} ${data.district || ''} ${data.province} ${data.postalCode || ''}` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">-
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">{t('detailModal.skillsTitle')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.skills && data.skills.filter(s => s && s.trim() !== "").length > 0 ? (
                  Array.from(new Set(data.skills.filter(s => s && s.trim() !== ""))).map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      className="px-3 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-medium animate-in fade-in duration-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">{t('list.noSkills')}</span>
                )}
              </div>
            </div>

            {/* ทักษะการขับขี่ */}

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Car className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">
                  {locale === 'en' ? 'Driving Skills' : 'ทักษะการขับขี่'}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.drivingSkills && data.drivingSkills.length > 0 ? (
                  data.drivingSkills.map((skillId) => {
                    const skillInfo = drivingSkillMap[skillId];

                    return (
                      <span
                        key={skillId}
                        className="px-3 py-2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-sm font-medium flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        {skillInfo
                          ? (locale === 'en' ? skillInfo.en : skillInfo.th)
                          : skillId
                        }
                      </span>
                    );
                  })
                ) : (
                  <span className="text-sm text-slate-400 italic flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                    {locale === 'en' ? 'No driving license information' : 'ไม่มีข้อมูลใบอนุญาตขับขี่'}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <Languages className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-extrabold text-black">
                  {locale === 'en' ? 'Language Proficiency' : 'ทักษะทางภาษาและผลคะแนนสอบ'}
                </h3>
              </div>


              <div className="space-y-3">
                {data.languages && data.languages.length > 0 ? (
                  data.languages.map((lang) => {
                    const isEnglish = lang.language.toLowerCase().includes('english') || lang.language.includes('อังกฤษ');

                    const stars = getStarRating(lang.level || '');

                    return (
                      <div key={lang.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-900 text-base">{lang.language}</span>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3.5 h-3.5 ${s <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="text-xs text-slate-600">
                            {lang.level && (
                              <span className="mr-3">
                                {locale === 'en' ? 'Level' : 'ระดับ'}: <span className="text-indigo-600 font-bold">{lang.level}</span>
                              </span>
                            )}
                            {lang.speaking && (
                              <p className="mt-1 text-slate-500 italic font-medium">
                                {locale === 'en' ? 'Speak' : 'พูด'}: {lang.speaking} / {locale === 'en' ? 'Read' : 'อ่าน'}: {lang.reading} / {locale === 'en' ? 'Write' : 'เขียน'}: {lang.writing}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {data.languageTests?.filter(t => {
                            const testName = t.testName.toLowerCase();
                            const langName = lang.language.toLowerCase();

                            if (isEnglish) {
                              return ['toeic', 'ielts', 'toefl', 'english', 'duolingo'].some(key => testName.includes(key));
                            }

                            if (langName.includes('ญี่ปุ่น') || langName.includes('japan')) {
                              return testName.includes(langName) || ['jlpt', 'n1', 'n2', 'n3', 'n4', 'n5', 'nat-test'].some(key => testName.includes(key));
                            }

                            if (langName.includes('จีน') || langName.includes('chinese') || langName.includes('mandarin')) {
                              return testName.includes(langName) || ['hsk', 'tocfl'].some(key => testName.includes(key));
                            }

                            return testName.includes(langName);
                          }).map((test) => (
                            <div key={test.id} className="flex items-center gap-3 p-2 px-3 bg-white rounded-xl border border-indigo-100 shadow-sm transition-transform hover:scale-105">
                              <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{test.testName}</div>
                                <div className="text-sm font-black text-indigo-600">{test.score || '-'}</div>
                              </div>
                              {test.fileUrl && (
                                <a href={test.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                    {locale === 'en' ? 'No language data provided' : 'ไม่มีข้อมูลทักษะทางภาษา'}
                  </div>
                )}

                {/* Certificates Section */}
                {data.certificates && data.certificates.length > 0 && (
                  <div className="pt-5 mt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 mb-4 flex items-center gap-2 uppercase tracking-[0.1em]">
                      <Award className="w-4 h-4 text-slate-400" />
                      {locale === 'en' ? 'Certificates' : 'ประกาศนียบัตร / อื่นๆ'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.certificates.map((cert) => (
                        <div key={cert.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all group">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{cert.name}</div>
                            <div className="text-[10px] text-slate-500 truncate">{cert.issuedBy}</div>
                          </div>
                          {cert.imageUrl && (
                            <a href={cert.imageUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-500 shrink-0 ml-3 bg-white px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all uppercase">View</a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-extrabold text-black">{t('detailModal.workHistoryTitle')}</h3>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold text-slate-400 uppercase tracking-tight">{t('detailModal.totalExperience')}</div>
                  <div className="flex items-baseline justify-end">
                    <span className="text-3xl font-black text-indigo-600">
                      {data.experience !== null && data.experience > 0 ? data.experience : '0'}
                    </span>
                    <span className="text-sm font-bold text-slate-500 ml-1">
                      {t('list.ageUnit') || 'ปี'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {data.workHistory && data.workHistory.length > 0 ? (
                  data.workHistory.map((work) => (
                    <div key={work.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{work.position || '-'}</div>
                          <div className="text-sm text-indigo-600 font-medium mt-0.5">{work.company || '-'}</div>
                        </div>

                        {work.isCurrent && (
                          <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                            {t('detailModal.present')}
                          </span>
                        )}
                      </div>

                      {work.businessType && (
                        <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                          <span className="text-slate-400">{t('detailModal.businessType')}:</span>
                          <span className="text-slate-600">{work.businessType}</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {work.startMonth}/{work.startYear} -{' '}
                        {work.isCurrent ? t('detailModal.present') : `${work.endMonth}/${work.endYear}`}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4">{t('detailModal.noWork')}</p>
                )}
              </div>
            </div>
          </section>
        </div>
      </div >
    </div >
  );
}
