'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { pdf } from '@react-pdf/renderer';
import { ResumeTemplate } from '../../../components/ResumeTemplate';
import {
  User,
  GraduationCap,
  Briefcase,
  Languages,
  CheckCircle2,
  Upload,
  Edit3,
  Plus,
  FileText,
  Trash2,
  ExternalLink,
  Loader2,
  Phone,
  Mail,
  Sparkles,
  Car,
  AlertCircle,
  Target,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ProfileData {
  gender?: string;
  phone?: string;
  lineId?: string;
  nationality?: string;
  maritalStatus?: string;
  militaryStatus?: string;
  religion?: string;
  height?: number;
  weight?: number;
  experience?: number;
  address?: string;
  province?: string;
  district?: string;
  subDistrict?: string;
  zipCode?: string;
  birthDate?: string;
  isPublic?: boolean;
  drivingSkills?: any[];
  expectedSalary?: number;
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

interface WorkItem {
  id: string;
  company: string;
  businessType?: string;
  jobType?: string;
  startYear?: string;
  endYear?: string;
  isCurrent: boolean;
  position: string;
  startDate?: string;
  endDate?: string;
}

interface LanguageItem {
  id: string;
  language: string;
  level?: string;
  speaking?: string;
  reading?: string;
  writing?: string;
}

interface CertItem {
  id: string;
  name: string;
  issuedBy?: string;
  issueYear?: string;
  imageUrl?: string;
}

interface JobPreference {
  id: string;
  position: string;
  jobType?: string;
}

interface LanguageTest {
  id: string;
  testName: string;
  score: string;
  fileUrl?: string;
}

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

export default function ProfileFullPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading: authLoading, setUser } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [works, setWorks] = useState<WorkItem[]>([]);
  const [jobPreferences, setJobPreferences] = useState<JobPreference[]>([]);
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [certs, setCerts] = useState<CertItem[]>([]);
  const [drivingSkillsData, setDrivingSkillsData] = useState<any[]>([]);
  const [resume, setResume] = useState<{
    id: string;
    title: string;
    fileUrl?: string;
    createdAt: string;
  } | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const drivingSkills = drivingSkillsData;
  const licenses = drivingSkills.filter((s: any) => s.skillType?.startsWith('l_'));
  const vehicles = drivingSkills.filter((s: any) => s.skillType?.startsWith('v_'));
  const machinery = drivingSkills.filter((s: any) => s.skillType?.startsWith('m_'));
  const [languageTests, setLanguageTests] = useState<LanguageTest[]>([]);


  // ─── 🟢 แก้ไขจุดสำคัญ: ป้องกัน Infinite Loop จากอาการ Context โหลดช้า ──────────────────
  useEffect(() => {
    // 1. ถ้ายังโหลดเซสชันไม่เสร็จ ห้ามเพิ่งสั่งเด้งหน้าหนีเด็ดขาด
    if (authLoading) return;

    // 2. ถ้าไม่มีตัวแปร user ใน Context ให้เช็คที่ตัวตั๋วจริง (accessToken) ในเครื่องก่อน
    const hasLocalToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');

    if (!user && !hasLocalToken) {
      // ไม่มีทั้งตัวตน และไม่มีทั้งตั๋วในเครื่อง แปลว่าไม่ได้ล็อกอินชัวร์ ๆ -> ส่งไปหน้า Login
      router.replace('/login');
    } else if (user && user.role === 'EMPLOYER') {
      // เป็นนายจ้าง ห้ามเข้าหน้านี้ -> ส่งกลับหน้าแรก
      router.replace('/th/');
    }
  }, [user, authLoading, router]);
  useEffect(() => {
    console.log("avatar:", user?.avatarUrl);
  }, [user]);

  // ─── 🟢 แก้ไขจุดตาย: ล็อกลูป Promise.all ไม่ให้ยิงรัวตามตัวแปร user ──────────────────
  useEffect(() => {
    // 1. ถ้า Context บอกว่ากำลังโหลดเซสชันอยู่ ให้ยืนรอเฉย ๆ ก่อน
    if (authLoading) return;

    // 2. ดึง Token ออกมาเช็คตรง ๆ
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // 🚀 ยิงดึงข้อมูล (ตัดคำสั่ง setLoading(true) สุ่มสี่สุ่มห้าออก เพื่อไม่ให้กระตุกเรนเดอร์)
    Promise.all([
      fetch(`${API_URL}/users/me/profile`, { headers }).then((r) => r.json()).catch(() => null),
      fetch(`${API_URL}/users/me/educations`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/work-histories`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/languages`, { headers }).then((r) => r.json()).catch(() => ({ languages: [], tests: [] })),
      fetch(`${API_URL}/users/me/certificates`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/resumes`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/driving-skills`, { headers }).then((r) => r.json()).catch(() => []),
      fetch(`${API_URL}/users/me/job-preferences`, { headers }).then(r => r.json()).catch(() => []),
    ]).then(([prof, edu, work, lang, cert, resumes, skills, jobPrefs]) => {
      setProfile(prof || null);
      setEducations(Array.isArray(edu) ? edu : []);
      setWorks(Array.isArray(work) ? work : []);
      setJobPreferences(Array.isArray(jobPrefs) ? jobPrefs : []);
      setCerts(Array.isArray(cert) ? cert : []);
      setDrivingSkillsData(Array.isArray(skills) ? skills : []);
      setLanguages(Array.isArray(lang?.languages) ? lang.languages : []);
      setLanguageTests(Array.isArray(lang?.tests) ? lang.tests : []);

      if (Array.isArray(resumes) && resumes.length > 0) {
        // ใช้ข้อมูลจากตัวแปร local 'prof' หรือถอดจาก Token แทนการพึ่งพาตัวแปร user นอกลูปที่ทำลูปพัง
        const myResume = resumes.find(r => r.fileUrl);
        setResume(myResume || null);
      } else {
        setResume(null);
      }

      // ดึงข้อมูลเสร็จสิ้น คลายล็อกหน้าจอ
      setLoading(false);
    }).catch((err) => {
      console.error("Error loading profile details:", err);
      setLoading(false);
    });

    // 🔒 เปลี่ยน Dependency ด้านล่างนี้ให้เหลือแค่นี้พอครับ! ห้ามใส่ user เข้าไปเด็ดขาด!
  }, [authLoading]);

  const profileComplete = !!(
    profile?.phone ||
    profile?.gender ||
    profile?.nationality ||
    profile?.address
  );

  const levelColor = (level?: string) => {
    if (!level) return 'bg-slate-200';
    if (level.includes('เยี่ยม') || level.includes('Native')) return 'bg-emerald-500';
    if (level.includes('ดีมาก') || level.includes('Very')) return 'bg-blue-500';
    if (level.includes('ดี') || level.includes('Good')) return 'bg-cyan-500';
    if (level.includes('พอใช้') || level.includes('Fair')) return 'bg-amber-400';
    return 'bg-slate-300';
  };

  const levelWidth = (level?: string) => {
    if (!level) return '10%';
    if (level.includes('เยี่ยม') || level.includes('Native')) return '100%';
    if (level.includes('ดีมาก') || level.includes('Very')) return '80%';
    if (level.includes('ดี') || level.includes('Good')) return '65%';
    if (level.includes('พอใช้') || level.includes('Fair')) return '45%';
    if (level.includes('เบื้อง') || level.includes('Basic')) return '25%';
    return '20%';
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('กรุณาอัปโหลดไฟล์ภาพ (JPG, PNG, WEBP) เท่านั้น');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์ภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setAvatarUploading(true);
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Update global user context to reflect new avatar
      if (user) {
        setUser({ ...user, avatarUrl: data.avatarUrl });
      }
    } catch {
      alert('อัปโหลดรูปโปรไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setAvatarUploading(false);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('ไฟล์ต้องมีขนาดไม่เกิน 10MB');
      return;
    }
    setResumeUploading(true);
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setResume(data);
    } catch {
      alert('อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    if (!resume) return;
    if (!confirm('ต้องการลบ Resume นี้ใช่ไหม?')) return;
    const token = localStorage.getItem('accessToken');
    try {
      await fetch(`${API_URL}/resumes/${resume.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setResume(null);
    } catch {
      alert('ลบไม่สำเร็จ');
    }
  };

  const handleTogglePublic = async () => {
    const currentIsPublic = profile?.isPublic ?? true;
    const newStatus = !currentIsPublic;

    // Optimistic update
    const previousProfile = profile;
    const newProfile = profile
      ? { ...profile, isPublic: newStatus }
      : ({ isPublic: newStatus } as ProfileData);
    setProfile(newProfile);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');
    } catch (error) {
      console.error('Failed to update visibility', error);
      // Revert
      setProfile(previousProfile);
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  const completionPercentage =
    ([
      profileComplete,
      educations.length > 0,
      works.length > 0,
      languages.length > 0,
      drivingSkillsData.length > 0,
      certs.length > 0,
      !!resume?.fileUrl,
    ].filter(Boolean).length /
      7) *
    100;

  const getCompletionColor = (percent: number) => {
    if (percent <= 30) return 'bg-red-600';
    if (percent <= 50) return 'bg-red-400';
    if (percent <= 70) return 'bg-orange-500';
    if (percent <= 80) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const getCompletionTextColor = (percent: number) => {
    if (percent <= 30) return 'text-red-600';
    if (percent <= 50) return 'text-red-400';
    if (percent <= 70) return 'text-orange-500';
    if (percent <= 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  const toBase64 = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();

      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Base64 error:", err);
      return undefined;
    }
  };

  const handleGenerateResume = async () => {
    if (resumeUploading) return;
    setResumeUploading(true);

    let avatarUrl = user?.avatarUrl;

    if (avatarUrl) {
      avatarUrl = await toBase64(avatarUrl);
    }

    // 1. เตรียมข้อมูลสำหรับ Template
    const fullUserData = {
      fullName: `${user?.firstName} ${user?.lastName}`,
      email: user?.email,
      phone: profile?.phone,
      lineId: profile?.lineId,
      avatarUrl: user?.avatarUrl,
      address: profile?.address,
      subDistrict: profile?.subDistrict,
      district: profile?.district,
      province: profile?.province,
      zipCode: profile?.zipCode,
      age: profile?.birthDate ? (new Date().getFullYear() - new Date(profile.birthDate).getFullYear()) : '-',
      gender: profile?.gender || '-',
      nationality: profile?.nationality || '-',
      religion: profile?.religion || '-',
      maritalStatus: profile?.maritalStatus || '-',
      militaryStatus: profile?.militaryStatus || '-',
      height: profile?.height,
      weight: profile?.weight,
      targetPosition: jobPreferences.length > 0 ? jobPreferences[0].position : 'พร้อมเริ่มงาน',
      experience: profile?.experience || 0,
      totalExperienceYear: profile?.experience || 0,
      profile: {
        ...profile,
        experience: profile?.experience || 0,
        age: profile?.birthDate ? (new Date().getFullYear() - new Date(profile.birthDate).getFullYear()) : '-',
      },
      expectedSalary: profile?.expectedSalary,
      expectedSalaryText: profile?.expectedSalary
        ? `${Number(profile.expectedSalary).toLocaleString()} บาท`
        : 'ตามตกลง',
      drivingSkills: drivingSkillsData.map(s => getSkillLabel(s.skillType)),
      languages: languages.map(l => ({ language: l.language, level: l.level })),
      languageTests: languageTests.map(t => ({
        testName: t.testName,
        score: t.score
      })),
      workHistory: works.map(w => ({
        position: w.position,
        company: w.company,
        startYear: w.startYear,
        endYear: w.endYear,
        isCurrent: w.isCurrent,
        businessType: w.businessType
      })),
      educationHistory: educations.map(e => ({
        institution: e.institution,
        educationLevel: e.educationLevel,
        major: e.major || '-',
        graduationYear: e.graduationYear,
        gpa: e.gpa || '-'
      }))
    };

    try {
      // 2. สร้าง Blob ใหม่จาก Template (เลเอาท์ใหม่จะถูกคำนวณที่นี่)
      const blob = await pdf(<ResumeTemplate data={fullUserData} />).toBlob();

      // 3. ใช้ Timestamp ในชื่อไฟล์เพื่อป้องกัน Server-side cache
      const timestamp = new Date().getTime();
      const uniqueFileName = `Resume_${user?.firstName}_${timestamp}.pdf`;
      const file = new File([blob], uniqueFileName, { type: 'application/pdf' });

      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();

      if (data.fileUrl) {
        const timestamp = new Date().getTime();
        const freshUrl = `${data.fileUrl.split('?')[0]}?t=${timestamp}`;

        setResume({ ...data, fileUrl: freshUrl });
        setRefreshKey(prev => prev + 1);
        alert("สร้างเรซูเม่อัตโนมัติสำเร็จ!");
      }

    } catch (error) {
      console.error("Generate Error:", error);
      alert("สร้างเรซูเม่ไม่สำเร็จ");
    } finally {
      setResumeUploading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans bg-[#f8fafc] relative">
      <Navbar />

      {/* Premium Header Profile Section */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-48 sm:h-64 bg-linear-to-r from-[#eef2f6] to-[#e2e8f0] overflow-hidden">
          <svg className="absolute inset-0 w-full h-full text-white/40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="currentColor" opacity="0.5" d="M0,0 L500,150 L1000,0 Z"></path>
            <path fill="rgba(255,255,255,0.7)" d="M400,0 L900,200 L1440,50 L1440,0 Z"></path>
            <path fill="#dce4ef" d="M800,0 L1440,250 L1440,0 Z"></path>
            <path fill="#dce4ef" d="M0,50 L400,250 L0,320 Z"></path>
          </svg>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 xl:px-8 relative z-10 pt-24 sm:pt-36 pb-8">
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col xl:flex-row items-center gap-8 xl:gap-10 relative">

            {/* 1. Avatar */}
            <label className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-[6px] border-white shadow-lg flex items-center justify-center -mt-20 lg:-mt-24 shrink-0 relative overflow-hidden z-20 group bg-slate-100 cursor-pointer">
              {avatarUploading ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl ?? undefined} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
              {!avatarUploading && (
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Edit3 className="text-white w-6 h-6" />
                </div>
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>

            {/* 2. Profile Main Info */}
            <div className="flex-none text-center xl:text-left min-w-fit">
              <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
                  {user?.firstName} {user?.lastName}
                </h1>
                {user?.role === 'JOBSEEKER' && <Sparkles className="w-5 h-5 text-blue-500 fill-current shrink-0" />}
              </div>
              <div className="text-slate-500 font-medium mt-3 flex flex-col items-center xl:items-start gap-2 text-sm">
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <Mail className="w-4 h-4 text-slate-400" /> {user?.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <Phone className="w-4 h-4 text-slate-400" /> {profile.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Right Side Group */}
            <div className="flex flex-col lg:flex-row gap-4 w-full xl:flex-1 xl:ml-auto justify-end">

              <div className="w-full xl:flex-1 xl:max-w-[380px] bg-[#f8faff] rounded-3xl p-5 border border-indigo-50 shadow-xs flex flex-col justify-center">
                <div className="flex justify-between items-end mb-3 gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-700 truncate">ความสมบูรณ์ของโปรไฟล์</h3>
                    <p className="text-[14px] text-slate-500 mt-1 whitespace-nowrap">มีโอกาสได้งานมากขึ้น {Math.round(completionPercentage)}%</p>
                  </div>
                  <span className={`text-xl font-bold shrink-0 ${getCompletionTextColor(completionPercentage)}`}>
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getCompletionColor(completionPercentage)} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>

              {/* Card 2: เผยแพร่โปรไฟล์ - ใช้ flex-1 และ max-w เช่นกัน */}
              <div className="w-full xl:flex-1 xl:max-w-[340px] bg-[#f8faff] rounded-3xl p-5 border border-indigo-50 shadow-xs flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-700 truncate">เผยแพร่โปรไฟล์</h3>
                  <p className="text-sm text-slate-500 mt-1 truncate">อนุญาตให้ค้นหาโปรไฟล์ของคุณได้</p>
                  <Link href="/profile-visibility" className="mt-2 inline-block text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 underline">
                    รายละเอียดเพิ่มเติม
                  </Link>
                </div>
                <button
                  onClick={handleTogglePublic}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${(profile?.isPublic ?? true) ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`${(profile?.isPublic ?? true) ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-[1600px] mx-auto px-4 xl:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Personal Info */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#f4f7fe] text-[#4f75e2] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="text-xs text-[#4f75e2] bg-[#f4f7fe] hover:bg-blue-100 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                แก้ไข
              </button>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">ข้อมูลส่วนบุคคล</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                ข้อมูลเบื้องต้นและรายละเอียดทางกายภาพเพื่อประกอบการพิจารณา
              </p>
            </div>

            <div className="mt-auto">
              {profileComplete ? (
                <div className="inline-flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold bg-[#ecfdf3] px-3 py-1.5 rounded-full mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ข้อมูลครบถ้วน
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-amber-600 text-[11px] font-bold bg-amber-50 px-3 py-1.5 rounded-full mb-4 border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ยังกรอกข้อมูลไม่ครบ
                </div>
              )}

              {/* Section: ข้อมูลรายละเอียดแบบ Grid */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-3">
                {/* แถวที่ 1 */}
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">โทรศัพท์</span>
                  <span className="text-[13px] font-semibold text-slate-700">{profile?.phone || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">LINE ID</span>
                  <span className="text-[13px] font-semibold text-slate-700">{profile?.lineId || '-'}</span>
                </div>

                {/* แถวที่ 2 */}
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">ส่วนสูง / น้ำหนัก</span>
                  <span className="text-[13px] font-semibold text-slate-700">
                    {profile?.height ? `${profile.height} ซม.` : '-'} / {profile?.weight ? `${profile.weight} กก.` : '-'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">สถานภาพทางทหาร</span>
                  <span className="text-[13px] font-semibold text-slate-700">{profile?.militaryStatus || '-'}</span>
                </div>

                {/* แถวที่ 3 */}
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">สัญชาติ / ศาสนา</span>
                  <span className="text-[13px] font-semibold text-slate-700">
                    {profile?.nationality || '-'} / {profile?.religion || '-'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">สถานภาพสมรส</span>
                  <span className="text-[13px] font-semibold text-slate-700">{profile?.maritalStatus || '-'}</span>
                </div>

                {/* แถวที่ 4 (เน้นสีน้ำเงินเพื่อให้เห็นเงินเดือนชัดเจน) */}
                <div className="flex flex-col col-span-2 mt-1 p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                  <span className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">เงินเดือนที่ต้องการ</span>
                  <span className="text-[14px] font-bold text-blue-700">
                    {profile?.expectedSalary ? `${Number(profile.expectedSalary).toLocaleString()} บาท` : 'ตามตกลง'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Education */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#fef4eb] text-[#f97316] flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <button
                onClick={() => router.push('/profile/education')}
                className="text-xs text-[#f97316] bg-[#fef4eb] hover:bg-orange-100 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                จัดการ
              </button>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">ประวัติการศึกษา</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                วุฒิการศึกษาสูงสุดและสถาบันที่คุณจบการศึกษา
              </p>
            </div>
            <div className="mt-auto">
              {educations.length > 0 ? (
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-y-5">
                  {educations.map((e) => (
                    <div key={e.id} className="relative pl-4">
                      {/* จุดวงกลมหน้าทุกรายการ */}
                      <div className="absolute left-0 top-[7px] w-[5px] h-[5px] bg-[#f97316] rounded-full"></div>

                      <div className="flex items-start justify-between gap-4">
                        <div className="text-[13px] font-semibold text-slate-800 leading-tight">
                          {/* แสดงคณะ และ สาขา ต่อกัน */}
                          {e.faculty}{e.major ? ` สาขา${e.major}` : ''}
                        </div>
                        {/* ระดับการศึกษาวางไว้ด้านขวา */}
                        <span className="shrink-0 inline-block text-[10px] text-[#f97316] bg-[#fef4eb] font-bold px-2 py-0.5 rounded-full">
                          {e.educationLevel || 'ปริญญาตรี'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-1">
                        {e.institution} {e.graduationYear ? `(${e.graduationYear})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => router.push('/profile/education')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#f97316] text-[13px] font-bold text-slate-500 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มการศึกษา
                </button>
              )}
            </div>
          </div>

          {/* Card 3: Work History */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg">
            {/* Header & Icon */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#f0fcfc] text-[#06b6d4] flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/profile/work-history')}
                  className="text-xs text-cyan-600 bg-cyan-50 hover:bg-cyan-100 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 stroke-3" />
                  เพิ่มข้อมูล
                </button>
              </div>
            </div>

            {/* Description - ปรับให้เหมือน Card อื่นๆ */}
            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">ข้อมูลการทำงาน</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                ตำแหน่งงานที่กำลังมองหาและประวัติประสบการณ์การทำงานที่ผ่านมา
              </p>
            </div>

            <div className="mt-auto">
              {/* ส่วนบน: ตำแหน่งงานที่ต้องการ */}
              <div className="pt-4 border-t border-slate-100 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] font-bold text-slate-700">ตำแหน่งงานที่สนใจ</span>
                </div>

                {jobPreferences && jobPreferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {jobPreferences.map((pref: JobPreference) => (
                      <div key={pref.id} className="bg-gradient-to-r from-pink-50 to-transparent border-l-2 border-cyan-400 px-3 py-1.5 rounded-r-xl">
                        <div className="text-[12px] font-bold text-slate-800">{pref.position}</div>
                        {pref.jobType && (
                          <div className="text-[9px] text-cyan-600 font-medium uppercase tracking-wider">{pref.jobType}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic pl-5">ยังไม่ได้ระบุตำแหน่งที่ต้องการ</p>
                )}
              </div>

              {/* เส้นแบ่งกลางแบบจางๆ */}
              <div className="border-t border-slate-50 mb-6"></div>

              {/* ส่วนล่าง: ประวัติการทำงาน */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[13px] font-bold text-slate-700">ประวัติการทำงาน</span>
                </div>

                {works && works.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
                    {works.map((w: WorkItem) => (
                      <div key={w.id} className="relative pl-6">
                        <div className="absolute left-0 top-[6px] w-[15px] h-[15px] bg-white border-2 border-cyan-500 rounded-full z-10"></div>

                        <div className="text-[13px] font-bold text-slate-800 leading-tight">
                          <span className="text-cyan-600 font-medium mr-2 text-[11px]">
                            [{w.businessType || 'ทั่วไป'}]
                          </span>
                          {w.position}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span className="font-semibold text-slate-600">{w.company}</span>
                          <span className="text-slate-300">|</span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                            {w.startYear} – {w.isCurrent ? 'ปัจจุบัน' : w.endYear}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic pl-5">ยังไม่มีข้อมูลประวัติการทำงาน</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Languages */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg ">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#22c55e] flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <button
                onClick={() => router.push('/profile/languages')}
                className="text-xs text-[#22c55e] bg-[#f0fdf4] hover:bg-green-100 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                จัดการ
              </button>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">ทักษะด้านภาษา</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                ภาษาต่างประเทศที่สามารถสื่อสารได้และระดับความเชี่ยวชาญ
              </p>
            </div>
            <div className="mt-auto">
              {languages.length > 0 ? (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {languages.map((lang) => (
                    <div key={lang.id}>
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="font-semibold text-slate-800 text-[13px]">
                          {lang.language}
                        </span>
                        <span className="text-[10px] font-bold text-[#22c55e] bg-[#f0fdf4] px-2 py-0.5 rounded-md">
                          {lang.level || 'ดีเยี่ยม (Excellent)'}
                        </span>
                      </div>
                      <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${levelColor(lang.level)}`}
                          style={{ width: levelWidth(lang.level) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="font-semibold text-slate-800 text-[13px]">ภาษาอังกฤษ</span>
                      <span className="text-[10px] font-bold text-[#22c55e] bg-[#f0fdf4] px-2 py-0.5 rounded-md">
                        ดีเยี่ยม (Excellent)
                      </span>
                    </div>
                    <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#22c55e] w-[85%]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="font-semibold text-slate-800 text-[13px]">ภาษาไทย</span>
                      <span className="text-[10px] font-bold text-[#22c55e] bg-[#f0fdf4] px-2 py-0.5 rounded-md">
                        ดีเยี่ยม (Excellent)
                      </span>
                    </div>
                    <div className="h-[5px] bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#22c55e] w-full" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Driving Skills */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Car className="w-5 h-5" />
              </div>
              <button
                onClick={() => router.push('/profile/driving')}
                className="text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                จัดการ
              </button>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">ทักษะการขับขี่</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                ใบอนุญาตขับขี่ ยานพาหนะส่วนตัว และความสามารถพิเศษ
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
              {drivingSkills.length > 0 ? (
                <>
                  {/* 1. กลุ่มใบอนุญาตขับขี่ (ใช้ตัวแปร licenses) */}
                  {licenses.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {licenses.map((s: any) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-bold border border-violet-100">
                          <CheckCircle2 className="w-3 h-3" />
                          {getSkillLabel(s.skillType)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 2. กลุ่มพาหนะส่วนตัว (ใช้ตัวแปร vehicles - ตรงนี้ v_bike จะโชว์) */}
                  {vehicles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {vehicles.map((s: any) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                          <Car className="w-3 h-3" />
                          {getSkillLabel(s.skillType)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 3. กลุ่มเครื่องจักร/ทักษะพิเศษ (ใช้ตัวแปร machinery) */}
                  {machinery.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {machinery.map((s: any) => (
                        <span key={s.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-100">
                          <Sparkles className="w-3 h-3" />
                          {getSkillLabel(s.skillType)}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* กรณีไม่มีข้อมูลเลย */
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-3 py-2 rounded-xl border border-amber-100/50">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[11px] font-bold">ยังไม่ได้ระบุข้อมูล</span>
                </div>
              )}
            </div>
          </div>

          {/* Card 6: Resume */}
          <div className="bg-white rounded-4xl p-6 shadow-sm flex flex-col border border-slate-100/50 drop-shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-[#fff1f2] text-[#ef4444] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>

              {resume?.fileUrl ? (
                <button
                  onClick={handleResumeDelete}
                  className="text-xs text-[#ef4444] bg-[#fff1f2] hover:bg-red-100 font-bold px-4 py-2 rounded-full flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบไฟล์
                </button>
              ) : (
                <div className="opacity-0 pointer-events-none">
                  <div className="px-4 py-2 text-xs">placeholder</div>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-[17px] mb-2">เรซูเม่ (Resume)</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                อัปโหลดไฟล์ PDF หรือสร้างใหม่จากข้อมูลโปรไฟล์ของคุณ
              </p>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="space-y-3">
                {/* ส่วนแสดงข้อมูลไฟล์ปัจจุบัน */}
                <div className={`flex items-center gap-3 p-3 rounded-2xl transition-colors ${resume?.fileUrl ? 'bg-[#fff1f2]' : 'bg-slate-50 border border-dashed border-slate-200'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${resume?.fileUrl ? 'text-[#ef4444]' : 'text-slate-400'
                    }`}>
                    <FileText className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold truncate ${resume?.fileUrl ? 'text-slate-800' : 'text-slate-400 italic'
                      }`}>
                      {resume?.fileUrl ? (resume.title || 'resume.pdf') : 'ยังไม่ได้อัปโหลดไฟล์'}
                    </p>
                  </div>

                  {resume?.fileUrl && (
                    <a
                      key={refreshKey}
                      href={`${resume.fileUrl}?v=${new Date().getTime()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-[#ef4444] p-1.5 bg-white rounded-md shadow-xs border border-slate-100 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* ส่วนปุ่ม Action */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* ปุ่มสร้างอัตโนมัติ: แดงไล่เฉดไปน้ำเงิน */}
                  <button
                    type="button"
                    onClick={handleGenerateResume}
                    disabled={resumeUploading} // ปิดปุ่มระหว่างอัปโหลด
                    className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-[#ef4444] via-[#ef4444] to-[#3b82f6] bg-[length:150%_100%] bg-left hover:bg-right text-[13px] font-bold text-white shadow-md transition-all duration-500 active:scale-95 disabled:opacity-50"
                  >
                    {resumeUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {resumeUploading ? 'กำลังสร้าง...' : 'สร้างอัตโนมัติ'}
                  </button>

                  {/* ปุ่มอัปโหลดไฟล์: ใช้สีเดิม (แดงชมพู) */}
                  <label className="flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-slate-200 hover:border-[#fecaca] text-[13px] font-bold text-slate-600 hover:text-[#ef4444] cursor-pointer transition-colors bg-white">
                    {resumeUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#ef4444]" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        อัปโหลด PDF
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleResumeUpload}
                      disabled={resumeUploading}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
