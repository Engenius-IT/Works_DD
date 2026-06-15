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
  Trash2,
  Loader2,
  Check,
  Car,
  PlusCircle,
} from 'lucide-react';
import { getThaiUniversities } from '@/data/thai-universities';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const EDUCATION_LEVELS_TH = [
  'ต่ำกว่ามัธยมศึกษาตอนปลาย',
  'มัธยมศึกษาตอนปลาย',
  'ปวช.',
  'ปวส.',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
];

const EDUCATION_LEVELS_EN = [
  'Below High School',
  'High School',
  'Vocational Certificate',
  'Diploma / High Vocational Certificate',
  "Bachelor's Degree",
  "Master's Degree",
  'Doctorate Degree',
];


const FACULTIES_TH = [
  "คณะเกษตรศาสตร์", "คณะครุศาสตร์", "คณะครุศาสตร์อุตสาหกรรม", "คณะดุริยางคศิลป์", "คณะทันตแพทยศาสตร์", 
  "คณะเทคนิคการแพทย์", "คณะเทคโนโลยี", "คณะเทคโนโลยีทางทะเล", "คณะเทคโนโลยีสารสนเทศ", "คณะนิติศาสตร์", 
  "คณะนิเทศศาสตร์", "คณะบริหารธุรกิจ", "คณะโบราณคดี", "คณะประมง", "คณะพยาบาลศาสตร์", 
  "คณะพาณิชยศาสตร์และการบัญชี", "คณะแพทยศาสตร์", "คณะเภสัชศาสตร์", "คณะโภชนศาสตร์", "คณะมนุษยศาสตร์", 
  "คณะมัณฑนศิลป์", "คณะวนศาสตร์", "คณะวารสารศาสตร์และสื่อสารมวลชน", "คณะวิจิตรศิลป์", "คณะวิทยาการจัดการ", 
  "คณะวิทยาการสารสนเทศ", "คณะวิทยาศาสตร์", "คณะวิทยาศาสตร์การกีฬา", "คณะวิศวกรรมศาสตร์", "คณะศิลปกรรมศาสตร์", 
  "คณะศิลปศาสตร์", "คณะศิลปะและการออกแบบ", "คณะเศรษฐศาสตร์", "คณะสถาปัตยกรรมศาสตร์", "คณะสหเวชศาสตร์", 
  "คณะสัตวแพทยศาสตร์", "คณะสังคมสงเคราะห์ศาสตร์", "คณะสังคมศาสตร์", "คณะสาธารณสุขศาสตร์", "คณะศึกษาศาสตร์", 
  "คณะสิ่งแวดล้อมและทรัพยากรศาสตร์", "คณะอุตสาหกรรมเกษตร", "คณะอุตสาหกรรมสร้างสรรค์", "คณะอักษรศาสตร์", 
  "วิทยาลัยการคอมพิวเตอร์", "วิทยาลัยการภาพยนตร์ ศิลปะการแสดงและสื่อใหม่", "วิทยาลัยนานาชาติ", "วิทยาลัยนวัตกรรม", 
  "วิทยาลัยป๊อปพิวเลชันศาสตร์", "วิทยาลัยสื่อสารการเมือง"
];

const FACULTY_EN_MAP: Record<string, string> = {
  "คณะเกษตรศาสตร์": "Faculty of Agriculture",
  "คณะครุศาสตร์": "Faculty of Education (B.Ed.)",
  "คณะครุศาสตร์อุตสาหกรรม": "Faculty of Technical Education",
  "คณะดุริยางคศิลป์": "Faculty of Music",
  "คณะทันตแพทยศาสตร์": "Faculty of Dentistry",
  "คณะเทคนิคการแพทย์": "Faculty of Associated Medical Sciences",
  "คณะเทคโนโลยี": "Faculty of Technology",
  "คณะเทคโนโลยีทางทะเล": "Faculty of Marine Technology",
  "คณะเทคโนโลยีสารสนเทศ": "Faculty of Information Technology",
  "คณะนิติศาสตร์": "Faculty of Law",
  "คณะนิเทศศาสตร์": "Faculty of Communication Arts",
  "คณะบริหารธุรกิจ": "Faculty of Business Administration",
  "คณะโบราณคดี": "Faculty of Archaeology",
  "คณะประมง": "Faculty of Fisheries",
  "คณะพยาบาลศาสตร์": "Faculty of Nursing",
  "คณะพาณิชยศาสตร์และการบัญชี": "Faculty of Commerce and Accountancy",
  "คณะแพทยศาสตร์": "Faculty of Medicine",
  "คณะเภสัชศาสตร์": "Faculty of Pharmacy",
  "คณะโภชนศาสตร์": "Faculty of Nutrition",
  "คณะมนุษยศาสตร์": "Faculty of Humanities",
  "คณะมัณฑนศิลป์": "Faculty of Decorative Arts",
  "คณะวนศาสตร์": "Faculty of Forestry",
  "คณะวารสารศาสตร์และสื่อสารมวลชน": "Faculty of Journalism and Mass Communication",
  "คณะวิจิตรศิลป์": "Faculty of Fine Arts",
  "คณะวิทยาการจัดการ": "Faculty of Management Science",
  "คณะวิทยาการสารสนเทศ": "Faculty of Informatics",
  "คณะวิทยาศาสตร์": "Faculty of Science",
  "คณะวิทยาศาสตร์การกีฬา": "Faculty of Sports Science",
  "คณะวิศวกรรมศาสตร์": "Faculty of Engineering",
  "คณะศิลปกรรมศาสตร์": "Faculty of Fine and Applied Arts",
  "คณะศิลปศาสตร์": "Faculty of Liberal Arts",
  "คณะศิลปะและการออกแบบ": "Faculty of Arts and Design",
  "คณะเศรษฐศาสตร์": "Faculty of Economics",
  "คณะสถาปัตยกรรมศาสตร์": "Faculty of Architecture",
  "คณะสหเวชศาสตร์": "Faculty of Allied Health Sciences",
  "คณะสัตวแพทยศาสตร์": "Faculty of Veterinary Science",
  "คณะสังคมสงเคราะห์ศาสตร์": "Faculty of Social Work",
  "คณะสังคมศาสตร์": "Faculty of Social Sciences",
  "คณะสาธารณสุขศาสตร์": "Faculty of Public Health",
  "คณะศึกษาศาสตร์": "Faculty of Education (TEFL)",
  "คณะสิ่งแวดล้อมและทรัพยากรศาสตร์": "Faculty of Environment and Resource Studies",
  "คณะอุตสาหกรรมเกษตร": "Faculty of Agro-Industry",
  "คณะอุตสาหกรรมสร้างสรรค์": "Faculty of Creative Industries",
  "คณะอักษรศาสตร์": "Faculty of Arts",
  "วิทยาลัยการคอมพิวเตอร์": "College of Computing",
  "วิทยาลัยการภาพยนตร์ ศิลปะการแสดงและสื่อใหม่": "College of Film, Performing Arts and New Media",
  "วิทยาลัยนานาชาติ": "International College",
  "วิทยาลัยนวัตกรรม": "College of Innovation",
  "วิทยาลัยป๊อปพิวเลชันศาสตร์": "College of Population Studies",
  "วิทยาลัยสื่อสารการเมือง": "College of Politics and Governance"
};

const currentYear = new Date().getFullYear() + 543;
const graduationYears = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

interface EducationEntry {
  id: string;
  institution: string;
  faculty: string;
  major: string;
  educationLevel: string;
  degreeName: string;
  graduationYear: string;
  gpa: string;
  hasHonors: boolean;
}

interface SavedEducationEntry {
  id: string;
  institution: string;
  faculty: string;
  major: string;
  educationLevel: string;
  degreeName: string;
  graduationYear: number | null;
  gpa: number | null;
  hasHonors: boolean;
}

function createEntry(): EducationEntry {
  return {
    id: Math.random().toString(36).slice(2),
    institution: '',
    faculty: '',
    major: '',
    educationLevel: '',
    degreeName: '',
    graduationYear: '',
    gpa: '',
    hasHonors: false,
  };
}

function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

function getApiErrorMessage(errorData: unknown, fallback: string) {
  if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
    const message = (errorData as { message?: string | string[] }).message;
    if (Array.isArray(message)) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message) {
      return message;
    }
  }
  return fallback;
}

export default function EducationPage() {
  const router = useRouter();
  const locale = useLocale() as 'th' | 'en';
  const { user, loading: authLoading } = useAuth();

  const [entries, setEntries] = useState<EducationEntry[]>([createEntry()]);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(0);

  const UNIVERSITIES = getThaiUniversities(locale);

  const menuLabels = {
    th: {
      personal: 'ข้อมูลส่วนบุคคล',
      education: 'ประวัติการศึกษา',
      work: 'ประวัติการทำงาน',
      language: 'ความสามารถทางภาษา',
      driving: 'ทักษะการขับขี่',
      certificates: 'ใบประกาศนียบัตร',
      profileComplete: 'สถานะโปรไฟล์',
      success: 'ความสำเร็จ',
      start: 'เริ่มต้น',
      complete: 'สมบูรณ์',
      educationTitle: 'ประวัติการศึกษา',
      deleteItem: 'ลบรายการ',
      institutionLabel: 'สถาบันการศึกษา',
      institutionPlaceholder: 'เลือกสถาบันการศึกษา',
      facultyLabel: 'คณะ',
      facultyPlaceholder: 'เลือกหรือค้นหาคณะ',
      majorLabel: 'สาขาวิชา',
      majorPlaceholder: 'กรอกสาขาวิชา',
      eduLevelLabel: 'ระดับการศึกษา',
      eduLevelPlaceholder: 'เลือกระดับการศึกษา',
      degreeLabel: 'ชื่อวุฒิการศึกษา / ปริญญา',
      degreePlaceholder: 'เช่น วิศวกรรมศาสตรบัณฑิต',
      gradYearLabel: 'ปี พ.ศ. ที่จบการศึกษา',
      gradYearPlaceholder: 'เลือกปี พ.ศ.',
      gpaLabel: 'เกรดเฉลี่ย (GPA)',
      gpaPlaceholder: 'เช่น 3.50',
      honorsLabel: 'ได้รับเกียรตินิยม',
      addEdu: 'เพิ่มประวัติการศึกษา',
      backBtn: 'ย้อนกลับ',
      savingBtn: 'กำลังบันทึก...',
      nextBtn: 'บันทึกและถัดไป',
      saveSuccess: 'บันทึกประวัติการศึกษาสำเร็จ',
      saveError: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
      search: 'ค้นหา...',
    },
    en: {
      personal: 'Personal Information',
      education: 'Education History',
      work: 'Work History',
      language: 'Language Skills',
      driving: 'Driving Skills',
      certificates: 'Certificates',
      profileComplete: 'Profile Completion',
      success: 'Success',
      start: 'Start',
      complete: 'Complete',
      educationTitle: 'Education History',
      deleteItem: 'Delete item',
      institutionLabel: 'Institution / University',
      institutionPlaceholder: 'Select institution',
      facultyLabel: 'Faculty',
      facultyPlaceholder: 'Select or search faculty',
      majorLabel: 'Major',
      majorPlaceholder: 'Enter major',
      eduLevelLabel: 'Education Level',
      eduLevelPlaceholder: 'Select education level',
      degreeLabel: 'Degree Name',
      degreePlaceholder: 'e.g. Bachelor of Engineering',
      gradYearLabel: 'Graduation Year',
      gradYearPlaceholder: 'Select year',
      gpaLabel: 'GPA',
      gpaPlaceholder: 'e.g. 3.50',
      honorsLabel: 'Honors received',
      addEdu: 'Add Education',
      backBtn: 'Back',
      savingBtn: 'Saving...',
      nextBtn: 'Save & Next',
      saveSuccess: 'Education history saved successfully',
      saveError: 'An error occurred while saving data',
      search: 'Search...',
    }
  };

  const t = locale === 'en' ? menuLabels.en : menuLabels.th;

  const profileSteps = [
    { icon: User, label: t.personal, completed: true, active: false, path: '/profile' },
    { icon: GraduationCap, label: t.education, completed: false, active: true, path: '/profile/education' },
    { icon: Briefcase, label: t.work, completed: false, active: false, path: '/profile/work-history' },
    { icon: Languages, label: t.language, completed: false, active: false, path: '/profile/languages' },
    { icon: Car, label: t.driving, completed: false, active: false, path: '/profile/driving' },
    { icon: Award, label: t.certificates, completed: false, active: false, path: '/profile/certificates' },
  ];

  const educationLevels = locale === 'en' ? EDUCATION_LEVELS_EN : EDUCATION_LEVELS_TH;
  
  const facultiesOptions = FACULTIES_TH.map(f => ({
    value: f,
    label: locale === 'en' && FACULTY_EN_MAP[f] ? FACULTY_EN_MAP[f] : f
  }));

  // คำนวณ Progress Ring SVG
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
    
    setCompletionPercent(17);

    fetch(`${API_URL}/users/me/educations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(
            data.map((d: SavedEducationEntry) => ({
              id: d.id || Math.random().toString(36).slice(2),
              institution: d.institution || '',
              faculty: d.faculty || '',
              major: d.major || '',
              educationLevel: d.educationLevel || '',
              degreeName: d.degreeName || '',
              graduationYear: d.graduationYear != null ? String(d.graduationYear) : '',
              gpa: d.gpa != null ? String(d.gpa) : '',
              hasHonors: d.hasHonors || false,
            })),
          );
        }
      })
      .catch(() => { });
  }, [user]);

  const updateEntry = (id: string, field: keyof EducationEntry, value: string | boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const removeEntry = (id: string) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEntry()]);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const validEntries = entries.filter((e) => e.institution && e.institution.trim() !== '');

      const res = await fetch(`${API_URL}/users/me/educations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: validEntries.map(({ id, graduationYear, gpa, ...rest }) => {
            const parsedYear = graduationYear ? parseInt(graduationYear, 10) : undefined;
            const parsedGpa = gpa ? parseFloat(gpa) : undefined;
            return {
              ...rest,
              graduationYear: parsedYear != null && !isNaN(parsedYear) ? parsedYear : undefined,
              gpa: parsedGpa != null && !isNaN(parsedGpa) ? parsedGpa : undefined,
            };
          }),
        }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }
        const errorData = await res.json().catch(() => null);
        throw new Error(getApiErrorMessage(errorData, 'Save failed'));
      }
      
      setSaving(false);
      setMessage({ type: 'success', text: t.saveSuccess });
      setCompletionPercent(34);
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push('/profile/work-history');
      }, 1200);
    } catch (error: unknown) {
      setSaving(false);
      setMessage({
        type: 'error',
        text: getErrorMessage(error, t.saveError),
      });
    }
  };

  const handleStepClick = (path: string) => {
    window.scrollTo(0, 0);
    router.push(path);
  };

  const handleBack = () => {
    window.scrollTo(0, 0);
    router.push('/profile');
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
              {t.profileComplete}
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
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
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
                    <span>{t.start}</span>
                    <span>{t.complete}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {entries.map((entry, idx) => (
          <div
            key={entry.id}
            className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                {t.educationTitle} {idx + 1}
              </h2>
              {entries.length > 1 && (
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1"
                  title={t.deleteItem}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.institutionLabel}</label>
              <SearchableSelect
                locale={locale}
                placeholder={t.institutionPlaceholder}
                value={entry.institution}
                onChange={(val) => updateEntry(entry.id, 'institution', val)}
                options={UNIVERSITIES.map((u) => ({ value: u, label: u }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.facultyLabel}</label>
                <SearchableSelect
                  locale={locale}
                  placeholder={t.facultyPlaceholder}
                  value={entry.faculty}
                  onChange={(val) => updateEntry(entry.id, 'faculty', val)}
                  options={facultiesOptions}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.majorLabel}</label>
                <input
                  type="text"
                  value={entry.major}
                  onChange={(e) => updateEntry(entry.id, 'major', e.target.value)}
                  placeholder={t.majorPlaceholder}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.eduLevelLabel}</label>
                <SearchableSelect
                  locale={locale}
                  placeholder={t.eduLevelPlaceholder}
                  value={entry.educationLevel}
                  onChange={(val) => updateEntry(entry.id, 'educationLevel', val)}
                  options={educationLevels.map((l, i) => ({ value: EDUCATION_LEVELS_TH[i], label: l }))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.degreeLabel}</label>
                <input
                  type="text"
                  value={entry.degreeName}
                  onChange={(e) => updateEntry(entry.id, 'degreeName', e.target.value)}
                  placeholder={t.degreePlaceholder}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t.gradYearLabel}
                </label>
                <SearchableSelect
                  locale={locale}
                  placeholder={t.gradYearPlaceholder}
                  value={entry.graduationYear}
                  onChange={(val) => updateEntry(entry.id, 'graduationYear', val)}
                  options={graduationYears.map((y) => ({ value: y, label: y }))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.gpaLabel}</label>
                <input
                  type="text"
                  value={entry.gpa}
                  onChange={(e) => updateEntry(entry.id, 'gpa', e.target.value)}
                  placeholder={t.gpaPlaceholder}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={entry.hasHonors}
                onClick={() => updateEntry(entry.id, 'hasHonors', !entry.hasHonors)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${entry.hasHonors ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${entry.hasHonors ? 'translate-x-6' : 'translate-x-1'
                    }`}
                />
              </button>
              <span className="text-sm text-gray-600">{t.honorsLabel}</span>
            </div>
          </div>
        ))}

        <div className="flex justify-center mb-8">
          <button
            onClick={addEntry}
            className="flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-colors bg-blue-50 px-4 py-2 rounded-full border border-dashed border-blue-300 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            {t.addEdu}
          </button>
        </div>

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
            className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {t.backBtn}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-12 py-3 rounded-lg font-bold text-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.savingBtn}
              </>
            ) : (
              t.nextBtn
            )}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}