'use client';

import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Sparkles, FileCheck, AlertCircle } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useTranslations } from 'next-intl';
import AIJobMatcher from '@/components/AIJobMatcher';
import { useGeneratePDF } from '@/hooks/useGeneratePDF'; // เรียกใช้ Hook สีทอง

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// --- Interfaces ---
interface WorkItem {
  id: string;
  company?: string;
  companyName?: string;
  position?: string;
  startYear?: string;
  endYear?: string;
  isCurrent?: boolean;
  businessType?: string;
}

interface EducationItem {
  id: string;
  institution: string;
  educationLevel?: string;
  faculty?: string;
  major?: string;
  graduationYear?: number;
  gpa?: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level?: string;
}

interface CertItem {
  id: string;
  name: string;
  issuedBy?: string;
}

interface ResumeInfo {
  id: string;
  title?: string;
  fileUrl?: string;
  createdAt?: string;
}

// อย่าลืมก๊อปปี้ฟังก์ชันนี้ไปไว้ด้านบนนอก Component (เหมือนในหน้า ProfileFull)
const getSkillLabel = (id: string) => {
  const labels: Record<string, string> = {
    'l_car': 'ใบขับขี่รถยนต์',
    'l_bike': 'ใบขับขี่รถจักรยานยนต์',
    'l_truck_6': 'ใบขับขี่รถบรรทุก 6 ล้อ',
    'l_truck_10': 'ใบขับขี่รถบรรทุก 10 ล้อ',
    'v_car': 'รถยนต์ส่วนตัว',
    'v_bike': 'รถจักรยานยนต์ส่วนตัว',
    'm_backhoe': 'ขับรถแบคโฮได้',
    'm_crane': 'ขับรถเครนได้',
    'm_forklift': 'ขับรถยกได้',
  };
  return labels[id] || id;
};

export default function AIJobMatcherPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('AIjobmatch');
  const { generate } = useGeneratePDF(); // Hook สำหรับสร้างไฟล์ PDF

  const [profile, setProfile] = useState<any>(null);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [resume, setResume] = useState<ResumeInfo | null>(null);

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [jobPreferences, setJobPreferences] = useState<any[]>([]);
  const [drivingSkillsData, setDrivingSkillsData] = useState<any[]>([]);
  const [languageTests, setLanguageTests] = useState<any[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user?.role === 'EMPLOYER') {
      router.push('/');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!user || user.role !== 'JOBSEEKER')
      return;

    let isActive = true;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/users/me/profile`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API_URL}/users/me/educations`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/work-histories`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/languages`, { headers }).then((r) => r.json()).catch(() => ({ languages: [], tests: [] })),
      fetch(`${API_URL}/users/me/certificates`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/resumes`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/driving-skills`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/job-preferences`, { headers }).then((r) => r.json()).catch(() => []),
    ])
      .then(([profData, edu, work, lang, cert, resumes, skills, jobPrefs]) => {
        setProfile(profData || null);
        setEducations(Array.isArray(edu) ? edu : []);
        setWorks(Array.isArray(work) ? work : []);
        setLanguages(Array.isArray(lang?.languages) ? lang.languages : []);
        setLanguageTests(Array.isArray(lang?.tests) ? lang.tests : []);
        setCerts(Array.isArray(cert) ? cert : []);
        setResume(Array.isArray(resumes) && resumes.length > 0 ? resumes[0] : null);

        // ✅ เซ็ตค่าลง State (แก้ Error ts(6133))
        setDrivingSkillsData(Array.isArray(skills) ? skills : []);
        setJobPreferences(Array.isArray(jobPrefs) ? jobPrefs : []);
      })
      .catch((err) => console.error("Fetch All Data Error:", err))
      .finally(() => {
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [user]);

  // 2. ดึงข้อมูลทั้งหมดจาก API (รวม Profile เพื่อใช้สร้าง PDF)
  useEffect(() => {
    if (!user || user.role !== 'JOBSEEKER') return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      // 🚩 เปลี่ยนจาก /users/me เป็น /users/me/profile เพื่อให้ได้ข้อมูลเจาะลึก
      fetch(`${API_URL}/users/me/profile`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/users/me/educations`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/users/me/work-histories`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/users/me/languages`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/users/me/certificates`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/resumes`, { headers }).then((r) => r.json()),
      // 🚩 ดึงข้อมูลเพิ่มเติมที่ Template Resume ต้องใช้
      fetch(`${API_URL}/users/me/driving-skills`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/job-preferences`, { headers }).then((r) => r.json()).catch(() => []),
    ])
      .then(([profData, edu, work, lang, cert, resumes, skills, jobPrefs]) => {
        // เซ็ตข้อมูลโปรไฟล์ (น้ำหนัก, ส่วนสูง, วันเกิด จะอยู่ในนี้แล้ว)
        setProfile(profData || null);

        setEducations(Array.isArray(edu) ? edu : []);
        setWorks(Array.isArray(work) ? work : []);
        setLanguages(Array.isArray(lang?.languages) ? lang.languages : []);

        // ถ้าในหน้า AI Matcher มี State เหล่านี้ ให้ Uncomment เพื่อใช้งานครับ
        setLanguageTests(Array.isArray(lang?.tests) ? lang.tests : []);
        setDrivingSkillsData(Array.isArray(skills) ? skills : []);
        setJobPreferences(Array.isArray(jobPrefs) ? jobPrefs : []);

        setCerts(Array.isArray(cert) ? cert : []);
        setResume(Array.isArray(resumes) && resumes.length > 0 ? resumes[0] : null);
      })
      .catch((err) => console.error("Fetch All Data Error:", err))
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const toBase64WithType = async (url: string) => {
    try {
      const res = await fetch(url);

      if (!res.ok) {
        console.warn("Image fetch failed:", url);
        return null;
      }

      const blob = await res.blob();

      return await new Promise<{ base64: string; type: string }>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            base64: reader.result as string,
            type: blob.type,
          });
        };
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Image fetch error:", err);
      return null;
    }
  };

  const handleGenerateResume = async () => {
    if (resume?.fileUrl) {
      const confirmOverwrite = window.confirm(
        "คุณมีไฟล์ Resume อยู่แล้วในระบบ ต้องการสร้างใหม่เพื่ออัปเดตข้อมูลหรือไม่?"
      );
      if (!confirmOverwrite) return;
    }

    setIsGenerating(true);

    try {
      const token = localStorage.getItem('accessToken');

      const timestamp = Date.now();
      const uniqueFileName = `Resume_${profile?.firstName || 'User'}_${timestamp}.pdf`;

      const rawAvatar = user?.avatarUrl || profile?.avatarUrl || '';
      console.log("rawAvatar:", rawAvatar);

      let avatarFinal: string | null = null;

      if (rawAvatar) {
        const avatarData = await toBase64WithType(rawAvatar);

        if (avatarData?.base64) {
          avatarFinal = avatarData.base64;
        }
      }

      console.log("avatarFinal:", avatarFinal);

      const fullDataForTemplate = {
        fullName: `${user?.firstName || profile?.firstName || ''} ${user?.lastName || profile?.lastName || ''}`,
        email: user?.email || profile?.email,
        phone: profile?.phone || '-',
        lineId: profile?.lineId || '-',

        // 🔥 FIX 3: ส่ง base64 เท่านั้น
        avatarUrl: avatarFinal,

        address: profile?.address || '-',
        subDistrict: profile?.subDistrict || '',
        district: profile?.district || '',
        province: profile?.province || '',
        zipCode: profile?.zipCode || '',

        age: profile?.birthDate
          ? (new Date().getFullYear() - new Date(profile.birthDate).getFullYear())
          : '-',

        gender: profile?.gender || '-',
        nationality: profile?.nationality || '-',
        religion: profile?.religion || '-',
        maritalStatus: profile?.maritalStatus || '-',
        militaryStatus: profile?.militaryStatus || '-',
        height: profile?.height || '-',
        weight: profile?.weight || '-',

        targetPosition:
          jobPreferences.length > 0
            ? jobPreferences[0].position
            : (works.length > 0 ? works[0].position : 'พร้อมเริ่มงาน'),

        experience: profile?.experience || 0,
        totalExperienceYear: profile?.experience || 0,

        expectedSalary: profile?.expectedSalary,
        expectedSalaryText: profile?.expectedSalary
          ? `${Number(profile.expectedSalary).toLocaleString()} บาท`
          : 'ตามตกลง',

        drivingSkills: drivingSkillsData.map(s =>
          getSkillLabel(s.skillType)
        ),

        languages: languages.map(l => ({
          language: l.language,
          level: l.level
        })),

        languageTests: languageTests.map(t => ({
          testName: t.testName,
          score: t.score
        })),

        workHistory: works.map(w => ({
          position: w.position,
          company: w.company || w.companyName,
          startYear: w.startYear,
          endYear: w.endYear,
          isCurrent: w.isCurrent,
          businessType: w.businessType || '-'
        })),

        educationHistory: educations.map(e => ({
          institution: e.institution,
          educationLevel: e.educationLevel,
          major: e.major || '-',
          graduationYear: e.graduationYear,
          gpa: e.gpa || '-'
        })),

        profile: {
          ...profile,
          age: profile?.birthDate
            ? (new Date().getFullYear() - new Date(profile.birthDate).getFullYear())
            : '-',
        }
      };

      // 🔥 สร้าง PDF
      const pdfBlob = await generate(fullDataForTemplate);

      const pdfFile = new File([pdfBlob], uniqueFileName, {
        type: 'application/pdf'
      });

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('title', uniqueFileName);
      formData.append('isPrimary', 'true');

      const response = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (response.ok) {
        const updatedResume = await response.json();
        setResume(updatedResume);
        alert("สร้างและอัปเดต Resume สำเร็จ!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload");
      }

    } catch (error: any) {
      console.error("Generate Error:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-10 h-10 text-[#A80010] animate-spin" />
            <p className="text-sm text-[#020263] font-medium">กำลังเตรียม AI Job Matcher...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'JOBSEEKER') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#00003D] via-[#020263] to-[#020263] text-white">
        <div className="absolute inset-0 opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(229,0,22,0.28),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(165,203,229,0.18),_transparent_30%)]" />
          <div className="absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#E00016]/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#A5CBE5]/20 blur-3xl" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#A5CBE5]/60 to-transparent" />
        </div>

        <div className="relative max-w-[1600px] mx-auto px-4 xl:px-8 py-14 lg:py-18">
          <div className="max-w-4xl">
            <div className="inline-flex items-center rounded-full border border-[#A5CBE5]/30 bg-white/8 px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#A5CBE5] backdrop-blur">
              {t("aimatch")}
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  AI Job Matcher
                </h1>
                <p className="mt-4 max-w-3xl text-sm sm:text-base lg:text-lg text-[#E5EEF6] leading-relaxed">
                  {t('aimatcher')}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#A5CBE5]/25 bg-[#A5CBE5]/10 px-3 py-1.5 text-xs font-semibold text-[#A5CBE5]">
                    {t('useprofiledata')}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#E71F29]/25 bg-[#E71F29]/10 px-3 py-1.5 text-xs font-semibold text-[#FFD7DA]">
                    {t('fastanalyze')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Skills Stats */}
              <div className="rounded-2xl border border-[#A5CBE5]/20 bg-white/10 px-4 py-4 backdrop-blur shadow-lg transition-all hover:bg-white/15">
                <p className="text-xs font-semibold text-[#A5CBE5] uppercase tracking-wider">{t('initial_skills')}</p>
                <p className="mt-2 text-2xl font-black text-white">{languages.length + certs.length + works.length}</p>
                <p className="mt-1 text-xs text-[#D8E8F3] opacity-80">{t('extracted_from_info')}</p>
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-3/4 rounded-full bg-[#A5CBE5] shadow-[0_0_8px_rgba(165,203,229,0.5)]" />
                </div>
              </div>

              {/* Education Stats */}
              <div className="rounded-2xl border border-[#E71F29]/20 bg-white/10 px-4 py-4 backdrop-blur shadow-lg transition-all hover:bg-white/15">
                <p className="text-xs font-semibold text-[#FFD7DA] uppercase tracking-wider">{t('education')}</p>
                <p className="mt-2 text-2xl font-black text-white">{educations.length}</p>
                <p className="mt-1 text-xs text-[#F7D7DA] opacity-80">{t('profile_prep_info')}</p>
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-[#E00016] shadow-[0_0_8px_rgba(224,0,22,0.5)]" />
                </div>
              </div>

              {/* Resume Status & Action Button */}
              <div className="rounded-2xl border border-[#10B981]/20 bg-white/10 px-4 py-4 backdrop-blur shadow-lg transition-all hover:bg-white/15">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-[#A7F3D0] uppercase tracking-wider">{t('resume_analyzed')}</p>
                  {resume?.fileUrl ? <FileCheck className="w-5 h-5 text-[#10B981]" /> : <AlertCircle className="w-5 h-5 text-[#E00016]" />}
                </div>

                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-2xl font-black text-white leading-none">
                    {resume?.fileUrl ? t('status_ready') : t('status_missing')}
                  </p>

                  <div className="flex gap-1.5">
                    {/* 👁️ View Button */}
                    {resume?.fileUrl && (
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 items-center gap-2 px-3 rounded-xl text-[11px] font-bold bg-[#A5CBE5]/20 text-[#A5CBE5] hover:bg-[#A5CBE5]/30 transition-all border border-[#A5CBE5]/30 active:scale-95"
                        title="View Resume"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {t('view') || 'ดูไฟล์'}
                      </a>
                    )}

                    {/* 🔄 Action Button */}
                    <button
                      onClick={handleGenerateResume}
                      disabled={isGenerating}
                      className={`flex h-9 items-center gap-2 px-4 rounded-xl text-[11px] font-extrabold transition-all active:scale-95 shadow-md ${resume?.fileUrl
                        ? 'bg-white text-[#020263] hover:bg-[#E5EEF6]'
                        : 'bg-[#E00016] text-white hover:bg-[#C00012] animate-pulse shadow-[#E00016]/20'
                        }`}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : resume?.fileUrl ? (
                        <><RefreshCw className="w-3.5 h-3.5" /> {t('update') || 'อัปเดต'}</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> {t('create') || 'สร้างไฟล์'}</>
                      )}
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-[10px] text-[#D1FAE5] font-medium opacity-90 italic">
                  {resume?.fileUrl ? `• ${t('resume_uploaded')}` : `• ${t('no_resume_hint')}`}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${resume?.fileUrl ? 'bg-[#10B981] w-full shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#E00016] w-1/4'
                      }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Matcher Section */}
      <section className="max-w-[1600px] mx-auto px-4 xl:px-8 py-8 lg:py-10">
        <AIJobMatcher
          works={works}
          certs={certs}
          languages={languages}
          educations={educations}
          resume={resume}
        />
      </section>
      <Footer />
    </div>
  );
}