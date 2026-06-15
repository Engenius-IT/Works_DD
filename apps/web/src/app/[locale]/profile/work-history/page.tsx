'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SearchableSelect } from '@/components/SearchableSelect';
import {
  User,
  GraduationCap,
  Briefcase,
  Languages,
  Award,
  Plus,
  Trash2,
  Loader2,
  Check,
  ArrowUp,
  ArrowDown,
  FileText,
  Car,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getProfileSteps = (locale: 'th' | 'en') => [
  { 
    icon: User, 
    label: locale === 'en' ? 'Personal Information' : 'ข้อมูลส่วนบุคคล', 
    completed: true, 
    active: false, 
    path: '/profile' 
  },
  { 
    icon: GraduationCap, 
    label: locale === 'en' ? 'Education History' : 'ประวัติการศึกษา', 
    completed: true, 
    active: false, 
    path: '/profile/education' 
  },
  { 
    icon: Briefcase, 
    label: locale === 'en' ? 'Work History' : 'ตำแหน่ง/ประวัติการทำงาน', 
    completed: false, 
    active: true, 
    path: '/profile/work-history' 
  },
  { 
    icon: Languages, 
    label: locale === 'en' ? 'Language Skills' : 'ความสามารถทางภาษา', 
    completed: false, 
    active: false, 
    path: '/profile/languages' 
  },
  { 
    icon: Car, 
    label: locale === 'en' ? 'Driving Skills' : 'ทักษะการขับขี่', 
    completed: false, 
    active: false, 
    path: '/profile/driving' 
  },
  { 
    icon: Award, 
    label: locale === 'en' ? 'Certificates' : 'ใบประกาศนียบัตร', 
    completed: false, 
    active: false, 
    path: '/profile/certificates' 
  },
];

const BUSINESS_TYPES_TH = [
  'เทคโนโลยีสารสนเทศ', 'การเงิน/ธนาคาร', 'การผลิต/อุตสาหกรรม', 'ค้าปลีก/ค้าส่ง', 'อาหารและเครื่องดื่ม',
  'การศึกษา', 'สุขภาพ/การแพทย์', 'อสังหาริมทรัพย์/ก่อสร้าง', 'โลจิสติกส์/ขนส่ง', 'สื่อ/โฆษณา/ประชาสัมพันธ์',
  'โทรคมนาคม', 'การท่องเที่ยว/โรงแรม', 'ประกันภัย', 'พลังงาน', 'เกษตรกรรม', 'ราชการ/รัฐวิสาหกิจ',
  'องค์กรไม่แสวงหาผลกำไร', 'อีคอมเมิร์ซ/แพลตฟอร์มออนไลน์', 'บริการวิชาชีพ (ที่ปรึกษา/กฎหมาย/บัญชี)',
  'บริการจัดหางาน/ทรัพยากรบุคคล', 'ยานยนต์และชิ้นส่วน', 'สินค้าอุปโภคบริโภค (FMCG)', 'นำเข้าและส่งออก',
  'ความงาม/แฟชั่น/สปา', 'บันเทิง/ศิลปะ/นันทนาการ', 'เหมืองแร่/ปิโตรเคมี/เคมีภัณฑ์',
  'บริการรักษาความปลอดภัย/จัดการอาคาร', 'อื่นๆ'
];

const BUSINESS_TYPES_EN = [
  'Information Technology', 'Finance / Banking', 'Manufacturing / Industrial', 'Retail / Wholesale',
  'Food & Beverage', 'Education', 'Healthcare / Medical', 'Real Estate / Construction',
  'Logistics / Transportation', 'Media / Advertising / PR', 'Telecommunications', 'Tourism / Hospitality',
  'Insurance', 'Energy', 'Agriculture', 'Government / State Enterprise', 'Non-Profit Organization',
  'E-Commerce / Online Platform', 'Professional Services (Consulting/Legal/Accounting)',
  'Recruitment / HR Services', 'Automotive & Parts', 'Consumer Goods (FMCG)', 'Import & Export',
  'Beauty / Fashion / Spa', 'Entertainment / Arts / Recreation', 'Mining / Petrochemical / Chemicals',
  'Security Services / Facility Management', 'Other'
];

const JOB_TYPES_TH = [
  'งานประจำ (Full-time)',
  'งานพาร์ทไทม์ (Part-time)',
  'สัญญาจ้าง (Contract)',
  'ฟรีแลนซ์ (Freelance)',
  'ฝึกงาน (Internship)',
];

const JOB_TYPES_EN = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
];

const monthsTh = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const monthsEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// แปลภาษาหน้า Work History
const translations = {
  th: {
    completeness: 'ความสมบูรณ์ของโปรไฟล์',
    success: 'สำเร็จ',
    saved: 'บันทึกข้อมูลเรียบร้อยแล้ว ✓',
    error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    saveAndNext: 'บันทึกและถัดไป',
    saving: 'กำลังบันทึก...',
    backBtn: 'ย้อนกลับ',
    addWorkHistory: 'เพิ่มประวัติการทำงาน',
    jobPreferenceTitle: 'ฝากประวัติ (ตำแหน่งงานที่สนใจ)',
    jobPreferenceDesc: 'ระบุตำแหน่งงานและประเภทงานที่คุณสนใจ (สูงสุด 3 ตำแหน่ง) เพื่อโอกาสในการจับคู่กับงานที่ตรงใจที่สุด',
    seqOrder: 'ลำดับที่',
    position: 'ตำแหน่งงาน',
    jobType: 'ประเภทงาน',
    addPosition: 'เพิ่มตำแหน่งงาน',
    maxPosition: 'ระบุครบ 3 ตำแหน่งแล้ว',
    companyName: 'ชื่อบริษัท',
    businessType: 'ประเภทธุรกิจ',
    workHistoryLabel: 'ประวัติการทำงาน',
    startDate: 'วันที่เริ่ม',
    endDate: 'วันที่สิ้นสุด',
    currentLocationWork: 'ทำงานที่นี่อยู่ในปัจจุบัน',
    currentWord: 'ปัจจุบัน',
    placeholderSelect: 'โปรดเลือก',
    placeholderInput: 'โปรดระบุ',
    month: 'เดือน',
    year: 'ปี'
  },
  en: {
    completeness: 'Profile Completeness',
    success: 'Success',
    saved: 'Information saved successfully ✓',
    error: 'An error occurred, please try again.',
    saveAndNext: 'Save & Next',
    saving: 'Saving...',
    backBtn: 'Back',
    addWorkHistory: 'Add Work History',
    jobPreferenceTitle: 'Job Preferences (Desired Positions)',
    jobPreferenceDesc: 'Specify the position and job type you are interested in (up to 3 positions) for the best job matching opportunities.',
    seqOrder: 'Order',
    position: 'Position',
    jobType: 'Job Type',
    addPosition: 'Add Position',
    maxPosition: '3 positions specified',
    companyName: 'Company Name',
    businessType: 'Business Type',
    workHistoryLabel: 'Work History',
    startDate: 'Start Date',
    endDate: 'End Date',
    currentLocationWork: 'Currently working here',
    currentWord: 'Present',
    placeholderSelect: 'Please select',
    placeholderInput: 'Please specify',
    month: 'Month',
    year: 'Year'
  }
};

const currentYear = new Date().getFullYear() + 543;
const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

interface SavedWorkEntry {
  id: string;
  company: string;
  businessType: string;
  position: string;
  jobType: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
}

interface WorkEntry {
  id: string;
  company: string;
  businessType: string;
  position: string;
  jobType: string;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrent: boolean;
}

interface JobPreference {
  id: string;
  position: string;
  jobType: string;
}

function createEntry(): WorkEntry {
  return {
    id: Math.random().toString(36).slice(2),
    company: '',
    businessType: '',
    position: '',
    jobType: '',
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrent: false,
  };
}

function createJobPreference(): JobPreference {
  return {
    id: Math.random().toString(36).slice(2),
    position: '',
    jobType: '',
  };
}

export default function WorkHistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale() as 'th' | 'en';
  const t = translations[locale] || translations.th;

  const profileSteps = getProfileSteps(locale);

  const businessTypes = locale === 'en' ? BUSINESS_TYPES_EN : BUSINESS_TYPES_TH;
  const jobTypes = locale === 'en' ? JOB_TYPES_EN : JOB_TYPES_TH;
  const monthsList = locale === 'en' ? monthsEn : monthsTh;

  const monthOptions = monthsList.map((month, index) => ({ value: String(index + 1), label: month }));
  const yearOptions = years.map((year) => ({ value: year, label: year }));

  const [entries, setEntries] = useState<WorkEntry[]>([createEntry()]);
  const [jobPreferences, setJobPreferences] = useState<JobPreference[]>([createJobPreference()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [completionPercent, setCompletionPercent] = useState(34);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setCompletionPercent(34);
    fetch(`${API_URL}/users/me/work-histories`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(
            data.map((d: SavedWorkEntry) => ({
              id: d.id || Math.random().toString(36).slice(2),
              company: d.company || '',
              businessType: d.businessType || '',
              position: d.position || '',
              jobType: d.jobType || '',
              startMonth: d.startMonth || '',
              startYear: d.startYear || '',
              endMonth: d.endMonth || '',
              endYear: d.endYear || '',
              isCurrent: d.isCurrent || false,
            })),
          );
        }
      })
      .catch(() => { });

    fetch(`${API_URL}/users/me/job-preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setJobPreferences(
            data.map((d: any) => ({
              id: d.id || Math.random().toString(36).slice(2),
              position: d.position || '',
              jobType: d.jobType || '',
            })),
          );
        }
      })
      .catch(() => { });
  }, [user]);

  const updateEntry = (id: string, field: keyof WorkEntry, value: string | boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addEntry = () => setEntries((prev) => [...prev, createEntry()]);

  const removeEntry = (id: string) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const updateJobPreference = (id: string, value: string) => {
    setJobPreferences((prev) => prev.map((e) => (e.id === id ? { ...e, position: value } : e)));
  };

  const addJobPreference = () => setJobPreferences((prev) => [...prev, createJobPreference()]);

  const removeJobPreference = (id: string) => {
    if (jobPreferences.length === 1) return;
    setJobPreferences((prev) => prev.filter((e) => e.id !== id));
  };

  const moveJobPreference = (index: number, direction: 'up' | 'down') => {
    const newPreferences = [...jobPreferences];
    if (direction === 'up' && index > 0) {
      [newPreferences[index], newPreferences[index - 1]] = [newPreferences[index - 1], newPreferences[index]];
    } else if (direction === 'down' && index < newPreferences.length - 1) {
      [newPreferences[index], newPreferences[index + 1]] = [newPreferences[index + 1], newPreferences[index]];
    }
    setJobPreferences(newPreferences);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');

      const validEntries = entries.filter((e) => e.company && e.company.trim() !== '');
      const res1 = await fetch(`${API_URL}/users/me/work-histories`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: validEntries.map(({ id, ...rest }) => rest),
        }),
      });
      if (!res1.ok) throw new Error('Save work history failed');

      const validPreferences = jobPreferences.filter((e) => e.position && e.position.trim() !== '');
      const res2 = await fetch(`${API_URL}/users/me/job-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: validPreferences.map(({ position, jobType }) => ({ position, jobType })),
        }),
      });
      if (!res2.ok) throw new Error('Save job preferences failed');

      setSaving(false);
      setMessage({ type: 'success', text: t.saved });
      setCompletionPercent(50);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push('/profile/languages');
      }, 1000);
    } catch {
      setSaving(false);
      setMessage({ type: 'error', text: t.error });
    }
  };

  const handleStepClick = (path: string) => {
    window.scrollTo(0, 0);
    router.push(path);
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    router.push('/profile/education');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Progress Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0e2a5e 40%, #1a3a7a 70%, #243b82 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }}
          />
          <div
            className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-linear-to-b from-blue-400 to-cyan-400" />
            <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide">
              {t.completeness}
            </h2>
          </div>

          <div
            className="rounded-2xl border border-white/10 p-6 md:p-8"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Progress Ring */}
              <div className="relative shrink-0">
                <div className="relative w-32 h-32 md:w-36 md:h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {completionPercent}%
                    </span>
                    <span className="text-[10px] text-blue-300/80 mt-0.5">{t.success}</span>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-xl"
                  style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }}
                />
              </div>

              {/* Steps */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-2">
                  {profileSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleStepClick(step.path)}
                        className={`group relative flex sm:flex-col items-center gap-3 sm:gap-2.5 p-3 sm:p-4 rounded-xl transition-all duration-300 cursor-pointer
                          ${step.active
                            ? 'bg-white/15 border border-white/20 shadow-lg shadow-blue-500/10'
                            : 'hover:bg-white/6 border border-transparent'
                          }`}
                      >
                        <div
                          className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300
                          ${step.completed
                              ? 'bg-linear-to-br from-blue-400 to-cyan-400 shadow-md shadow-cyan-400/20'
                              : step.active
                                ? 'bg-white/15 border border-white/20'
                                : 'bg-white/6 border border-white/10'
                            }`}
                        >
                          {step.completed ? (
                            <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                          ) : (
                            <Icon
                              className={`w-5 h-5 ${step.active ? 'text-blue-300' : 'text-white/30'}`}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs sm:text-[11px] sm:text-center leading-tight font-medium transition-colors
                          ${step.active || step.completed ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}
                        >
                          {step.label}
                        </span>
                        {step.active && (
                          <div className="sm:hidden ml-auto w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div className="hidden sm:block mt-5">
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${completionPercent}%`,
                        background: 'linear-gradient(90deg, #60a5fa, #38bdf8, #22d3ee)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/30">
                    <span>เริ่มต้น</span>
                    <span>สมบูรณ์</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ฝากประวัติ */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">{t.jobPreferenceTitle}</h2>
          </div>

          <div className="pl-0 md:pl-7">
            <p className="text-sm text-gray-500 mb-6">
              {t.jobPreferenceDesc}
            </p>

            <div className="space-y-4">
              {jobPreferences.map((pref, index) => (
                <div key={pref.id} className="p-5 bg-gray-50 rounded-xl border border-gray-200 relative group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t.seqOrder} {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-gray-200 rounded-md">
                        <button onClick={() => moveJobPreference(index, 'up')} disabled={index === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveJobPreference(index, 'down')} disabled={index === jobPreferences.length - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowDown className="w-4 h-4" /></button>
                      </div>
                      {jobPreferences.length > 1 && (
                        <button onClick={() => removeJobPreference(pref.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t.position}</label>
                      <input
                        type="text"
                        value={pref.position}
                        onChange={(e) => updateJobPreference(pref.id, e.target.value)}
                        placeholder={t.placeholderInput}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">{t.jobType}</label>
                      <SearchableSelect
                        placeholder={t.placeholderSelect}
                        value={pref.jobType || ''}
                        onChange={(val) => {
                          setJobPreferences(prev => prev.map(p => p.id === pref.id ? { ...p, jobType: val } : p));
                        }}
                        options={jobTypes.map((j) => ({ value: j, label: j }))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addJobPreference}
              disabled={jobPreferences.length >= 3}
              className={`mt-6 px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${jobPreferences.length >= 3
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-sm'
                }`}
            >
              <Plus className="w-4 h-4" />
              {jobPreferences.length >= 3 ? t.maxPosition : t.addPosition}
            </button>
          </div>
        </div>

        {/* Job History Section */}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                {t.workHistoryLabel}
              </h2>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title="ลบรายการนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.companyName}</label>
                <input
                  type="text"
                  value={entry.company}
                  onChange={(e) => updateEntry(entry.id, 'company', e.target.value)}
                  placeholder={t.placeholderInput}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.businessType}</label>
                <SearchableSelect
                  placeholder={t.placeholderSelect}
                  value={entry.businessType}
                  onChange={(val) => updateEntry(entry.id, 'businessType', val)}
                  options={businessTypes.map((b) => ({ value: b, label: b }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.position}</label>
                <input
                  type="text"
                  value={entry.position}
                  onChange={(e) => updateEntry(entry.id, 'position', e.target.value)}
                  placeholder={t.placeholderInput}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.jobType}</label>
                <SearchableSelect
                  placeholder={t.placeholderSelect}
                  value={entry.jobType}
                  onChange={(val) => updateEntry(entry.id, 'jobType', val)}
                  options={jobTypes.map((j) => ({ value: j, label: j }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.startDate}</label>
                <div className="grid grid-cols-2 gap-2">
                  <SearchableSelect
                    placeholder={t.month}
                    value={entry.startMonth}
                    onChange={(val) => updateEntry(entry.id, 'startMonth', val)}
                    options={monthOptions}
                  />
                  <SearchableSelect
                    placeholder={t.year}
                    value={entry.startYear}
                    onChange={(val) => updateEntry(entry.id, 'startYear', val)}
                    options={yearOptions}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.endDate}</label>
                {entry.isCurrent ? (
                  <div className="flex items-center h-[42px] px-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm font-medium">
                    {t.currentWord}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <SearchableSelect
                      placeholder={t.month}
                      value={entry.endMonth}
                      onChange={(val) => updateEntry(entry.id, 'endMonth', val)}
                      options={monthOptions}
                    />
                    <SearchableSelect
                      placeholder={t.year}
                      value={entry.endYear}
                      onChange={(val) => updateEntry(entry.id, 'endYear', val)}
                      options={yearOptions}
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.isCurrent}
                    onChange={(e) => updateEntry(entry.id, 'isCurrent', e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-600">{t.currentLocationWork}</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addEntry}
          className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-4 flex items-center justify-center gap-2 transition-colors mb-8"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t.addWorkHistory}</span>
        </button>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
              }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleBack}
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
          >
            {t.backBtn}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-12 py-3 rounded-lg font-bold text-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.saving}
              </>
            ) : (
              t.saveAndNext
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}