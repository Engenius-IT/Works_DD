'use client';

import { useState, useEffect, KeyboardEvent, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import th from '@/messages/th.json';
import { useTranslations } from 'next-intl';
import {
  X,
  Plus,
  Briefcase,
  ChevronLeft,
  Bus,
  TrainFront,
  TramFront,
  Plane,
  Train,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { RichTextEditor } from '@/components/RichTextEditor';
import { CompanyImageUpload } from '@/components/CompanyImageUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'งานประจำ (Full Time)' },
  { value: 'PART_TIME', label: 'งานพาร์ทไทม์ (Part Time)' },
  { value: 'CONTRACT', label: 'งานสัญญาจ้าง (Contract)' },
  { value: 'INTERNSHIP', label: 'ฝึกงาน (Internship)' },
  { value: 'FREELANCE', label: 'ฟรีแลนซ์ (Freelance)' },
];

const WORK_MODELS = [
  { value: 'ONSITE', label: 'ทำงานที่ออฟฟิศ (Onsite)' },
  { value: 'REMOTE', label: 'ทำงานจากที่บ้าน (Remote)' },
  { value: 'HYBRID', label: 'ผสมผสาน (Hybrid)' },
];

const JOB_CATEGORIES = [
  'งานบัญชี',
  'งานธุรการ',
  'งานธนาคาร งานการเงิน',
  'งานพัฒนาชุมชน',
  'งานก่อสร้าง',
  'งานออกแบบ งานสถาปัตยกรรม',
  'งานการศึกษา',
  'งานวิศวกรรม',
  'งานฟาร์ม งานสัตวบาล งานอนุรักษ์',
  'งานราชการ',
  'งานการแพทย์',
  'งานบริการ งานท่องเที่ยว',
  'งานทรัพยากรบุคคล',
  'งานไอที งานเทคโนโลยีสื่อสาร',
  'งานประกันภัย',
  'งานกฎหมาย',
  'งานการผลิต งานขนส่ง',
  'งานการตลาด งานสื่อสาร',
  'งานอสังหาริมทรัพย์',
  'งานสินค้าขายปลีกและอุปโภคบริโภค',
  'งานขาย',
  'งานวิทยาศาสตร์',
  'งานการกีฬา งานสันทนาการ',
];

const TRANSPORT_PRESETS = [
  { value: 'รถเมย์', icon: Bus, label: 'รถเมย์' },
  { value: 'BTS', icon: TrainFront, label: 'BTS' },
  { value: 'MRT', icon: TramFront, label: 'MRT' },
  { value: 'ARL', icon: Plane, label: 'ARL' },
  { value: 'รถไฟ', icon: Train, label: 'รถไฟ' },
];

const ADDITIONAL_QUAL_PRESETS = [
  'ยินดีรับนักศึกษาจบใหม่',
  'ยินดีรับผู้ไม่มีประสบการณ์',
  'มีใบขับขี่',
  'สามารถเดินทางต่างจังหวัดได้',
  'สามารถทำงานเป็นกะได้',
];

interface FormState {
  title: string;
  description: string;
  requirements: string;
  benefits: string[];
  otherBenefits: string;
  salaryMin: string;
  salaryMax: string;
  salaryVisible: boolean;
  jobType: string;
  workModel: string;
  locationProvince: string;
  locationDistrict: string;
  companyAddress: string;
  mapUrl?: string;
  requiredSkills: string[];
  positions: number;
  workingDays: string;
  startTime: string;
  endTime: string;
  canOnlineInterview: boolean;
  isQuickApply: boolean;
  welcomeRecentGrads: boolean;
  education: string;
  category: string;
  jobFunction: string;
  qualificationGender: string;
  qualificationAgeMin: string;
  qualificationAgeMax: string;
  qualificationExperience: string;
  additionalQualifications: string[];
  contactName: string;
  contactPhone: string;
  transportation: string[];
  companyImages: string[];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function CreateJobPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('HeroSearch.provinces');
  const tt = useTranslations('jobcreate');

  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyStatus, setCompanyStatus] = useState<'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED'>('UNVERIFIED');
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyError, setCompanyError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    requirements: '',
    benefits: [] as string[],
    otherBenefits: '',
    salaryMin: '',
    salaryMax: '',
    salaryVisible: true,
    jobType: 'FULL_TIME',
    workModel: 'ONSITE',
    locationProvince: '',
    locationDistrict: '',
    companyAddress: '',
    mapUrl: '',
    requiredSkills: [],
    positions: 1,
    workingDays: '5 วัน/สัปดาห์',
    startTime: '',
    endTime: '',
    canOnlineInterview: false,
    isQuickApply: false,
    welcomeRecentGrads: false,
    education: '',
    category: '',
    jobFunction: '',
    qualificationGender: '',
    qualificationAgeMin: '',
    qualificationAgeMax: '',
    qualificationExperience: '',
    additionalQualifications: [],
    contactName: '',
    contactPhone: '',
    transportation: [],
    companyImages: [],
  });

  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 🟢 1. เพิ่ม State เก็บรายชื่อฟิลด์ที่กรอกไม่ผ่าน เพื่อทำขอบแดงแสดงข้อผิดพลาดแยกจุด
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 🟢 2. สร้าง Refs ผูกกับตำแหน่งอินพุตต่าง ๆ ไว้ดึงหน้าจอ (Scroll) ไปหา
  const basicInfoRef = useRef<HTMLDivElement>(null);

  const [transportInput, setTransportInput] = useState('');
  const [additionalQualInput, setAdditionalQualInput] = useState('');

  useEffect(() => {
    if (authLoading) return;

    // 1. เช็ก Login & Role (ต้องผ่านด่านนี้ก่อน)
    if (!user) {
      router.push('/employer/login');
      return;
    }
    if (user.role !== 'EMPLOYER') {
      router.push('/');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const initializePage = async () => {
      try {
        // 2. 🚨 ดักเช็กจำนวนงานสะสมในตาราง (ปรับโควตาเป็น 50 งาน)
        const quotaRes = await fetch(`${API_URL}/companies/mine/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const jobs = await quotaRes.json();

        // 🛑 ถ้าตรวจสอบแล้วพบว่าข้อมูลในตารางงอกครบ 50 แถวแล้ว
        if (Array.isArray(jobs) && jobs.length >= 50) {
          // โยนข้อความเข้า Error State เพื่อแสดง UI ล็อกหน้าแทนการยิง alert เบราว์เซอร์
          setCompanyError('ขออภัย จำนวนประกาศงานสะสมของคุณมีจำนวน 50 งานแล้ว เราไม่แนะนำให้คุณลงงานมากกว่านี้แต่แนะนำให้คุณจัดการกับงานที่เคยมีอยู่');
          setLoadingCompany(false);
          setCheckingAccess(false);
          return;
        }

        // 3. 🏢 ดึงข้อมูลบริษัทต่อตามปกติ (จะทำเมื่อจำนวนงานยังไม่เต็ม 50)
        const companyRes = await fetch(`${API_URL}/companies/mine`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const companyData = await companyRes.json();

        if (companyData?.id) {
          setCompanyId(companyData.id);
          setCompanyName(companyData.name);
          setCompanyStatus(companyData.verificationStatus || 'UNVERIFIED');
        } else {
          setCompanyError('ไม่พบข้อมูลบริษัท กรุณาตั้งค่าข้อมูลบริษัทก่อน');
        }

      } catch (err) {
        console.error('Initialization error:', err);
        setCompanyError('ไม่สามารถโหลดข้อมูลระบบได้');
      } finally {
        // โหลดเสร็จเรียบร้อย ปลดล็อกสถานะ Loading ทั้งหมด
        setLoadingCompany(false);
        setCheckingAccess(false);
      }
    };

    initializePage();
  }, [user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
    // 🟢 ล้างเออเร่อรายช่องเมื่อผู้ใช้พิมพ์แก้ไขแล้ว
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm((prev) => ({ ...prev, requiredSkills: [...prev.requiredSkills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill();
    }
  };

  // 🟢 3. ฟังก์ชันกลางสำหรับกรองข้อมูล (Form Validation) และดึงหน้าจอไปหาจุดที่พลาด
  const validateForm = (): boolean => {
    setErrors({});
    setError('');

    const errors: Record<string, string> = {};
    let firstErrorId = ''; // 🟢 เปลี่ยนจาก ref มาจำค่า id ตัวแรกที่พังแทน

    if (!form.title || !form.title.trim()) {
      errors.title = 'กรุณากรอกชื่อตำแหน่งงาน';
      if (!firstErrorId) firstErrorId = 'job-title'; // 🟢 ใส่ ID ของอินพุตนี้ลงไป
    }

    if (!form.positions || Number(form.positions) < 1) {
      errors.positions = 'กรุณาระบุจำนวนอัตราที่รับอย่างน้อย 1 อัตรา';
      if (!firstErrorId) firstErrorId = 'job-positions';
    }

    if (!form.locationProvince) {
      errors.locationProvince = 'กรุณาเลือกจังหวัดที่ปฏิบัติงาน';
      if (!firstErrorId) firstErrorId = 'job-province';
    }

    if (!form.workingDays) {
      errors.workingDays = 'กรุณาเลือกจำนวนวันทำงานต่อสัปดาห์';
    }

    if (!form.startTime) {
      errors.startTime = 'กรุณาระบุเวลาเข้างาน';
      if (!firstErrorId) firstErrorId = 'job-starttime';
    }

    if (!form.endTime) {
      errors.endTime = 'กรุณาระบุเวลาออกงาน';
      if (!firstErrorId) firstErrorId = 'job-endtime';
    }

    if (!form.companyAddress || !form.companyAddress.trim()) {
      errors.companyAddress = 'กรุณากรอกที่อยู่ติดต่อของบริษัท';
      if (!firstErrorId) firstErrorId = 'job-address';
    }

    // 🟢 เช็กรายละเอียดงาน (ต้องกรอก และต้องยาวอย่างน้อย 20 ตัวอักษร)
    const cleanDesc = form.description ? form.description.replace(/<[^>]*>/g, '').trim() : '';
    if (!cleanDesc) {
      errors.description = 'กรุณากรอกหน้าที่ความรับผิดชอบ';
      if (!firstErrorId) firstErrorId = 'job-description';
    } else if (cleanDesc.length < 20) {
      errors.description = `กรุณากรอกรายละเอียดงานอย่างน้อย 20 ตัวอักษร (ตอนนี้มี ${cleanDesc.length} ตัวอักษร)`;
      if (!firstErrorId) firstErrorId = 'job-description';
    }

    // 🟢 เช็กคุณสมบัติผู้สมัคร (ต้องกรอก และต้องยาวอย่างน้อย 20 ตัวอักษร)
    const cleanReq = form.requirements ? form.requirements.replace(/<[^>]*>/g, '').trim() : '';
    if (!cleanReq) {
      errors.requirements = 'กรุณากรอกคุณสมบัติผู้สมัคร';
      if (!firstErrorId) firstErrorId = 'job-requirements';
    } else if (cleanReq.length < 20) {
      errors.requirements = `กรุณากรอกคุณสมบัติผู้สมัครอย่างน้อย 20 ตัวอักษร (ตอนนี้มี ${cleanReq.length} ตัวอักษร)`;
      if (!firstErrorId) firstErrorId = 'job-requirements';
    }

    if (!form.requiredSkills || form.requiredSkills.length === 0) {
      errors.requiredSkills = 'กรุณาเพิ่มทักษะที่ต้องการอย่างน้อย 1 รายการ';
      if (!firstErrorId) firstErrorId = 'job-skills';
    }

    setErrors(errors);

    // 🚀 ลอจิกสั่งดึงหน้าจอและโฟกัสด้วย ID ปรับเหลือแค่นี้:
    if (Object.keys(errors).length > 0) {
      setError('กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน');

      if (firstErrorId) {
        const element = document.getElementById(firstErrorId);
        if (element) {
          // เลื่อนหน้าจอมาตรงกลางช่องที่กรอกผิด
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });

          // หน่วงเวลาแป๊บนึงเพื่อให้เลื่อนเสร็จ แล้วสั่งโฟกัสให้พร้อมพิมพ์ทันที
          setTimeout(() => {
            if (typeof element.focus === 'function') element.focus();
          }, 300);
        }
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (publishNow: boolean) => {
    setError('');
    if (!companyId) {
      setError('ไม่พบข้อมูลบริษัท');
      return;
    }

    // 🟢 ตรวจสอบความถูกต้องของฟอร์มก่อนยิง API
    if (!validateForm()) return;

    setSaving(true);
    const token = localStorage.getItem('accessToken');

    try {
      const combinedBenefits = [...form.benefits];
      if (form.otherBenefits.trim()) {
        combinedBenefits.push(`สวัสดิการอื่นๆ: ${form.otherBenefits.trim()}`);
      }

      const payload = {
        title: form.title,
        description: form.description,
        requirements: form.requirements,
        benefits: combinedBenefits.length > 0 ? combinedBenefits : undefined,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        salaryVisible: form.salaryVisible,
        jobType: form.jobType,
        workModel: form.workModel,
        locationProvince: form.locationProvince || undefined,
        locationDistrict: form.locationDistrict || undefined,
        companyAddress: form.companyAddress || undefined,
        mapUrl: form.mapUrl || undefined,
        requiredSkills: form.requiredSkills,
        positions: Number(form.positions) || 1,
        workingDays: form.workingDays || undefined,
        startTime:
          form.workingDays === 'บริษัทกำหนดเลือก' ? form.startTime || undefined : undefined,
        endTime: form.workingDays === 'บริษัทกำหนดเลือก' ? form.endTime || undefined : undefined,
        canOnlineInterview: form.canOnlineInterview,
        isQuickApply: form.isQuickApply,
        welcomeRecentGrads: form.additionalQualifications.includes('ยินดีรับนักศึกษาจบใหม่'),
        education: form.education || undefined,
        category: form.category || undefined,
        jobFunction: form.jobFunction || undefined,
        qualificationGender: form.qualificationGender || undefined,
        qualificationAgeMin: form.qualificationAgeMin
          ? Number(form.qualificationAgeMin)
          : undefined,
        qualificationAgeMax: form.qualificationAgeMax
          ? Number(form.qualificationAgeMax)
          : undefined,
        qualificationExperience: form.qualificationExperience
          ? Number(form.qualificationExperience)
          : undefined,
        additionalQualifications:
          form.additionalQualifications.length > 0 ? form.additionalQualifications : undefined,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        transportation: form.transportation.length > 0 ? form.transportation : undefined,
        companyImages: form.companyImages.length > 0 ? form.companyImages : undefined,
        companyId,
      };

      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'บันทึกไม่สำเร็จ');
      }

      if (publishNow) {
        await fetch(`${API_URL}/jobs/${data.id}/publish`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      router.push('/employer/jobs');
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'เกิดข้อผิดพลาด'));
      setSaving(false);
    }
  };

  // ฟังก์ชันเมื่อกดปุ่ม "เผยแพร่" (🚀 เผยแพร่ทันที)
  const handlePublishClick = () => {
    setError('');

    // 1. ตรวจสอบข้อมูลบริษัทเบื้องต้น
    if (!companyId) {
      setError('ไม่พบข้อมูลบริษัท');
      return;
    }

    if (!validateForm()) return;

    setShowConfirmModal(true);
  };

  if (authLoading || checkingAccess || loadingCompany) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (companyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">🏢</div>
            <div className="text-gray-700 font-semibold mb-2">{companyError}</div>
            <button
              onClick={() => router.push('/employer/dashboard')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
            >
              กลับหน้า Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="min-h-screen bg-gray-50 font-sans"
    >
      <Navbar />

      {/* Header */}
      <div className="bg-white relative overflow-hidden border-b border-gray-100">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-linear-to-br from-blue-50 to-indigo-50/50 rounded-full blur-3xl -translate-y-12 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-linear-to-tr from-blue-50 to-cyan-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-3xl mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <button
                onClick={() => router.push('/employer/jobs')}
                className="group p-2.5 rounded-2xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 text-gray-600 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-200 blur-md rounded-2xl"></div>
                  <div className="relative w-12 h-12 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-2xl tracking-tight mb-1">
                    {tt('header')}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <p className="text-sm text-gray-500 font-medium">{companyName}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Verification Alert */}
        {companyStatus !== 'VERIFIED' && (
          <div className="bg-[#fff8e6] border border-[#ffe099] rounded-xl p-4 flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#ffecb3] flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-[#b37400]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#805300]">{tt('verificationAlert.title')}</h3>
              <p className="text-xs text-[#996300] mt-0.5">
                {tt.rich('verificationAlert.description', { bold: (chunks) => <span className="font-semibold">{chunks}</span> })}
              </p>
            </div>
          </div>
        )}

        {/* Section: ข้อมูลพื้นฐาน */}
        {/* 🟢 ผูก ref ที่ Section นี้จุดเดียว เพื่อใช้สั่งดีดหน้าจอกลับมาเวลาลูกทีมด้านในพัง */}
        <div ref={basicInfoRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('basicInfo.title')}
          </h2>

          {/* ชื่อตำแหน่งงาน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('basicInfo.jobTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              id="job-title" // 🟢 1. เติม ID ตรงนี้เพื่อให้ลอจิกสั่งดึงหน้าจอ (Scroll) ทำงานถูกตัว
              type="text"
              name="title"
              value={form.title}
              // 🟢 2. ปรับ onChange ให้เก็บค่าลงฟอร์มปกติ พร้อมกับลบ Error ของช่องนี้ทิ้งทันทีเมื่อพิมพ์
              onChange={(e) => {
                handleChange(e); // เรียกฟังก์ชัน handle เดิมของคุณเพื่ออัปเดตสเตตตัวแปร form

                // สั่งลบเออร์เรอร์เฉพาะของช่อง title ออกทันที แจ้งเตือนสีแดงจะได้หายวับ
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.title;
                  return updated;
                });
              }}
              required
              placeholder="เช่น Senior Frontend Developer, ผู้จัดการฝ่ายการตลาด"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm transition-colors
                ${errors.title
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                }`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* ประเภทการจ้างงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.jobType')} <span className="text-red-500">*</span>
              </label>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm bg-white transition-colors
            ${errors.jobType
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.jobType && <p className="text-xs text-red-500 mt-1">{errors.jobType}</p>}
            </div>

            {/* รูปแบบการทำงาน */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.workModel')} <span className="text-red-500">*</span>
              </label>
              <select
                name="workModel"
                value={form.workModel}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm bg-white transition-colors
            ${errors.workModel
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              >
                {WORK_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {errors.workModel && <p className="text-xs text-red-500 mt-1">{errors.workModel}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* จำนวนอัตราที่รับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.positions')} <span className="text-red-500">*</span>
              </label>
              <input
                id="job-positions" // 🟢 1. เติม ID ตรงนี้ให้ตรงกับที่ตั้งไว้ใน validateForm เพื่อให้สั่ง Scroll มาเจอ
                type="number"
                name="positions"
                value={form.positions}
                // 🟢 2. ปรับ onChange ให้ลบเออร์เรอร์ของช่อง positions ทันทีที่เปลี่ยนค่าตัวเลข
                onChange={(e) => {
                  handleChange(e); // บันทึกค่าลงสเตตฟอร์มปกติ

                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.positions; // ลบแจ้งเตือนสีแดงออกทันที
                    return updated;
                  });
                }}
                required
                min="1"
                placeholder="เช่น 1" // แนะนำปรับตามที่คุยกันรอบก่อนเพื่อไม่ให้ชนกับชนิดข้อมูลที่เป็น number
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm transition-colors
                  ${errors.positions
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              />
              {errors.positions && <p className="text-xs text-red-500 mt-1">{errors.positions}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            {/* จังหวัด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.province')} <span className="text-red-500">*</span>
              </label>
              <select
                id="job-province" // 🟢 1. เติม ID สำหรับดักลอจิกสั่งดึงหน้าจอเลื่อนมาหาช่องนี้
                name="locationProvince"
                value={form.locationProvince}
                // 🟢 2. ปรับ onChange ให้ลบเออร์เรอร์ข้อผิดพลาดสีแดงออกทันทีที่เลือกจังหวัดใหม่
                onChange={(e) => {
                  handleChange(e); // บันทึกค่าลงสเตตฟอร์มปกติ

                  setErrors((prev) => {
                    const updated = { ...prev };
                    delete updated.locationProvince; // ลบแจ้งเตือนสีแดงออกทันที
                    return updated;
                  });
                }}
                required
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm bg-white transition-colors
                  ${errors.locationProvince
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-gray-300 focus:ring-2 focus:ring-[#020263]'
                  }`}
              >
                {/* 🟢 3. เพิ่มตัวเลือกแรกสุดเป็นค่าว่าง เพื่อป้องกันบั๊กแสดงผลหลอกสายตาผู้ใช้ */}
                <option value="">-- เลือกจังหวัด --</option>

                {Object.keys(th.HeroSearch.provinces)
                  .filter((key) => key !== 'all')
                  .map((key) => (
                    <option key={key} value={t(key)}>
                      {t(key)}
                    </option>
                  ))}
              </select>
              {errors.locationProvince && <p className="text-xs text-red-500 mt-1">{errors.locationProvince}</p>}
            </div>

            {/* เขต/อำเภอ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.district')}
              </label>
              <input
                type="text"
                name="locationDistrict"
                value={form.locationDistrict}
                onChange={handleChange}
                placeholder="เช่น คลองหลวง, จตุจักร"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] outline-none text-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* หมวดหมู่หลัก */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.category')}
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                <option value="">ไม่ระบุ</option>
                {JOB_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* สายงานย่อย */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.jobFunction')}
              </label>
              <input
                type="text"
                name="jobFunction"
                value={form.jobFunction}
                onChange={handleChange}
                placeholder="เช่น พัฒนาซอฟต์แวร์, จัดการโปรเจค"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* วันและเวลาทำงาน */}
          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tt('basicInfo.workingDays')}<span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4 mb-2">
                {[tt('basicInfo.workingDaysOptions.fiveDays'), tt('basicInfo.workingDaysOptions.sixDays'), tt('basicInfo.workingDaysOptions.custom')].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workingDays"
                      value={opt}
                      checked={form.workingDays === opt}
                      onChange={(e) => {
                        handleChange(e);
                        setErrors((prev) => {
                          const updated = { ...prev };
                          delete updated.workingDays;
                          return updated;
                        });
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>
              {errors.workingDays && <p className="text-xs text-red-500 mb-3">{errors.workingDays}</p>}

              {/* 🟢 ดึงกล่องเวลาออกมาโชว์ถาวร ไม่ต้องมีเงื่อนไขซ่อนอีกต่อไป */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mt-2">
                {/* เวลาเข้างาน */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    เวลาเข้างาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="job-starttime"
                    type="time"
                    name="startTime"
                    value={form.startTime}
                    onChange={(e) => {
                      handleChange(e);
                      setErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.startTime;
                        return updated;
                      });
                    }}
                    className={`w-full px-4 py-2 rounded-lg border outline-none text-gray-900 text-sm bg-white transition-colors
                      ${errors.startTime
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                      }`}
                  />
                  {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>}
                </div>

                {/* เวลาออกงาน */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    เวลาออกงาน <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="job-endtime"
                    type="time"
                    name="endTime"
                    value={form.endTime}
                    onChange={(e) => {
                      handleChange(e);
                      setErrors((prev) => {
                        const updated = { ...prev };
                        delete updated.endTime;
                        return updated;
                      });
                    }}
                    className={`w-full px-4 py-2 rounded-lg border outline-none text-gray-900 text-sm bg-white transition-colors
                      ${errors.endTime
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                      }`}
                  />
                  {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>}
                </div>
              </div>
            </div>

            {/* สัมภาษณ์ออนไลน์ */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {tt('basicInfo.onlineInterview')} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canOnlineInterview"
                    checked={!form.canOnlineInterview}
                    onChange={() => setForm((p) => ({ ...p, canOnlineInterview: false }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{tt('basicInfo.support')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canOnlineInterview"
                    checked={form.canOnlineInterview}
                    onChange={() => setForm((p) => ({ ...p, canOnlineInterview: true }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{tt('basicInfo.notsupport')}</span>
                </label>
              </div>
            </div>

            {/* Quick Apply */}
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{tt('basicInfo.quickApply.label')}</label>
              <p className="text-xs text-gray-400 mb-2">
                {tt('basicInfo.quickApply.description')}
              </p>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isQuickApply"
                    checked={!form.isQuickApply}
                    onChange={() => setForm((p) => ({ ...p, isQuickApply: false }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{tt('basicInfo.quickApply.off')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isQuickApply"
                    checked={form.isQuickApply}
                    onChange={() => setForm((p) => ({ ...p, isQuickApply: true }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{tt('basicInfo.quickApply.on')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* ที่อยู่ติดต่อ */}
          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('basicInfo.contactAddress')} <span className="text-red-500">*</span> {/* 🟢 1. เพิ่มดอกจันสีแดง */}
            </label>
            <textarea
              id="job-address" // 🟢 2. เติม ID สำหรับลอจิก Auto Scroll เลื่อนหน้าจอมาโฟกัส
              name="companyAddress"
              value={form.companyAddress}
              // 🟢 3. ปรับ onChange ให้ลบเออร์เรอร์สีแดงออกทันทีเมื่อยูสเซอร์พิมพ์แก้ไขที่อยู่
              onChange={(e) => {
                handleChange(e); // บันทึกค่าลงสเตตฟอร์มปกติ

                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.companyAddress; // พิมพ์ปุ๊บ ขอบแดงหายวับปั๊บ
                  return updated;
                });
              }}
              rows={3}
              placeholder="เช่น 111 หมู่ 9 อุทยานวิทยาศาสตร์ประเทศไทย ชั้น 2 ห้อง P-206 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120"
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm resize-none transition-colors
                ${errors.companyAddress
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                }`}
            />
            {errors.companyAddress && <p className="text-xs text-red-500 mt-1">{errors.companyAddress}</p>}
          </div>

          {/* ลิงก์แผนที่ */}
          <div className="mt-4 border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('basicInfo.mapUrl')}
            </label>
            <input
              type="url"
              name="mapUrl"
              value={form.mapUrl}
              onChange={handleChange}
              placeholder="เช่น https://goo.gl/maps/... หรือ https://maps.app.goo.gl/..."
              className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm
          ${errors.mapUrl
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                }`}
            />
            {errors.mapUrl && <p className="text-xs text-red-500 mt-1">{errors.mapUrl}</p>}
          </div>

          {/* รูปภาพบริษัท */}
          <div className="mt-4 border-t border-gray-100 pt-5">
            <CompanyImageUpload
              images={form.companyImages}
              onChange={(imgs) => setForm((prev) => ({ ...prev, companyImages: imgs }))}
            />
          </div>
        </div>

        {/* Section: เงินเดือน */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('salary.title')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('salary.min')}
              </label>
              <input
                type="number"
                name="salaryMin"
                value={form.salaryMin}
                onChange={handleChange}
                placeholder="เช่น 15,000 บาท"
                min={0}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.salaryMin
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              />
              {errors.salaryMin && <p className="text-xs text-red-500 mt-1">{errors.salaryMin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('salary.max')}
              </label>
              <input
                type="number"
                name="salaryMax"
                value={form.salaryMax}
                onChange={handleChange}
                placeholder="เช่น 50,000 บาท"
                min={0}
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${errors.salaryMax
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              />
              {errors.salaryMax && <p className="text-xs text-red-500 mt-1">{errors.salaryMax}</p>}
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              name="salaryVisible"
              checked={form.salaryVisible}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">{tt('salary.visible')}</span>
          </label>
        </div>

        {/* Section: รายละเอียดงาน */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('jobDetails.title')}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('jobDetails.title')} <span className="text-red-500">*</span>
            </label>
            <div id="job-description" className={`rounded-xl overflow-hidden border ${errors.description ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300'}`}>
              <RichTextEditor
                value={form.description}
                onChange={(html) => {
                  setForm((prev) => ({ ...prev, description: html }));

                  // 🟢 ล้าง Tag HTML ออกเพื่อนับเฉพาะข้อความจริง
                  const cleanHtml = html.replace(/<[^>]*>/g, '').trim();
                  // 🟢 ขอบแดงจะหายไป ก็ต่อเมื่อพิมพ์ข้อความจริงยาวตั้งแต่ 20 ตัวอักษรขึ้นไปเท่านั้น
                  if (cleanHtml.length >= 20 && errors.description) {
                    setErrors(prev => { const n = { ...prev }; delete n.description; return n; });
                  }
                }}
                placeholder="อธิบายหน้าที่ความรับผิดชอบ สภาพแวดล้อมการทำงาน และรายละเอียดอื่นๆ..."
                minHeight={200}
              />
            </div>
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('jobDetails.requirements')} <span className="text-red-500">*</span>
            </label>
            <div id="job-requirements" className={`rounded-xl overflow-hidden border ${errors.requirements ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300'}`}>
              <RichTextEditor
                value={form.requirements}
                onChange={(html) => {
                  setForm((prev) => ({ ...prev, requirements: html }));

                  // 🟢 ล้าง Tag HTML ออกเพื่อนับเฉพาะข้อความจริง
                  const cleanHtml = html.replace(/<[^>]*>/g, '').trim();
                  // 🟢 ขอบแดงจะหายไป ก็ต่อเมื่อพิมพ์ข้อความจริงยาวตั้งแต่ 20 ตัวอักษรขึ้นไปเท่านั้น
                  if (cleanHtml.length >= 20 && errors.requirements) {
                    setErrors(prev => { const n = { ...prev }; delete n.requirements; return n; });
                  }
                }}
                placeholder="เช่น วุฒิการศึกษา, ประสบการณ์, ทักษะที่จำเป็น, คุณลักษณะที่ต้องการ..."
                minHeight={160}
              />
            </div>
            {errors.requirements && <p className="text-xs text-red-500 mt-1">{errors.requirements}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {tt('benefits.title')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {[
                tt('benefits.items.social_security'),
                tt('benefits.items.bonus'),
                tt('benefits.items.ot'),
                tt('benefits.items.commission'),
                tt('benefits.items.provident_fund'),
                tt('benefits.items.housing'),
                tt('benefits.items.transport'),
                tt('benefits.items.food'),
                tt('benefits.items.uniform'),
              ].map((benefit) => (
                <label key={benefit} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.benefits.includes(benefit)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm((prev) => ({ ...prev, benefits: [...prev.benefits, benefit] }));
                      } else {
                        setForm((prev) => ({
                          ...prev,
                          benefits: prev.benefits.filter((b) => b !== benefit),
                        }));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('benefits.other')}
              </label>
              <input
                type="text"
                value={form.otherBenefits}
                onChange={(e) => setForm((prev) => ({ ...prev, otherBenefits: e.target.value }))}
                placeholder="สวัสดิการอื่นๆ (ถ้ามี)"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Section: ทักษะที่ต้องการ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('skills.title')} <span className="text-red-500">*</span>
          </h2>

          <div className="flex gap-2">
            <input
              id="job-skills" // 🟢 3. เติม ID ตรงนี้เพื่อให้สกรอลล์มาโฟกัสกล่องพิมพ์สกิลแท็ก
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                // 🟢 สั่งลบเออร์เรอร์สีแดงของสกิลทันทีเมื่อเขากด Enter เพิ่มสกิลสำเร็จ
                if (e.key === 'Enter') {
                  setErrors(prev => { const n = { ...prev }; delete n.requiredSkills; return n; });
                }
                if (typeof handleSkillKeyDown === 'function') handleSkillKeyDown(e);
              }}
              placeholder="พิมพ์ทักษะแล้วกด Enter เช่น React, Python, Excel"
              className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm ${errors.requiredSkills
                ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                }`}
            />
            <button
              type="button"
              onClick={() => {
                if (typeof addSkill === 'function') addSkill();
                // 🟢 กดปุ่มคลิกเพิ่มสกิล ก็ให้ลบเออร์เรอร์สีแดงออกด้วยเช่นกัน
                setErrors(prev => { const n = { ...prev }; delete n.requiredSkills; return n; });
              }}
              className="px-4 py-2.5 bg-[#E00016] hover:bg-[#E00016]/80 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {tt('skills.addBtn')}
            </button>
          </div>
          {errors.requiredSkills && <p className="text-xs text-red-500">{errors.requiredSkills}</p>}

          {form.requiredSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {form.requiredSkills.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              {tt('skills.noSkills')}
            </p>
          )}
        </div>

        {/* Section: คุณสมบัติ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('qualifications.title')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{tt('qualifications.gender')}</label>
              <select
                name="qualificationGender"
                value={form.qualificationGender}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                <option value="">ไม่ระบุ</option>
                <option value="ชาย">ชาย</option>
                <option value="หญิง">หญิง</option>
                <option value="ไม่จำกัดเพศ">ไม่จำกัดเพศ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('qualifications.education')}
              </label>
              <select
                name="education"
                value={form.education}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                <option value="">ไม่ระบุ</option>
                <option value="ต่ำกว่ามัธยมศึกษา">ต่ำกว่ามัธยมศึกษา</option>
                <option value="มัธยมศึกษา">มัธยมศึกษา</option>
                <option value="ปวช/ปวส">ปวช/ปวส</option>
                <option value="ปริญญาตรี">ปริญญาตรี</option>
                <option value="ปริญญาโท">ปริญญาโท</option>
                <option value="ปริญญาเอก">ปริญญาเอก</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{tt('qualifications.age')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="qualificationAgeMin"
                  value={form.qualificationAgeMin}
                  onChange={handleChange}
                  placeholder="ต่ำสุด"
                  min={0}
                  className="w-30 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
                />
                <span className="text-gray-400 text-sm">–</span>
                <input
                  type="number"
                  name="qualificationAgeMax"
                  value={form.qualificationAgeMax}
                  onChange={handleChange}
                  placeholder="สูงสุด"
                  min={0}
                  className="w-30 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('qualifications.experience')}
              </label>
              <select
                name="qualificationExperience"
                value={form.qualificationExperience}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                <option value="">ไม่ระบุ</option>
                <option value="0">ไม่มี</option>
                <option value="1">1-2 ปี</option>
                <option value="3">3-4 ปี</option>
                <option value="5">5-6 ปี</option>
                <option value="7">7-8 ปี</option>
                <option value="10">10 ปีขึ้นไป</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: คุณสมบัติเพิ่มเติม */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('qualifications.additional.title')}
          </h2>

          <div className="flex flex-wrap gap-2 mb-3">
            {ADDITIONAL_QUAL_PRESETS.map((preset) => {
              const active = form.additionalQualifications.includes(preset);
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setForm((prev) => ({
                        ...prev,
                        additionalQualifications: prev.additionalQualifications.filter(
                          (q) => q !== preset,
                        ),
                      }));
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        additionalQualifications: [...prev.additionalQualifications, preset],
                      }));
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${active
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  {active ? '✓ ' : '+ '}
                  {preset}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={additionalQualInput}
              onChange={(e) => setAdditionalQualInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = additionalQualInput.trim();
                  if (val && !form.additionalQualifications.includes(val)) {
                    setForm((prev) => ({
                      ...prev,
                      additionalQualifications: [...prev.additionalQualifications, val],
                    }));
                  }
                  setAdditionalQualInput('');
                }
              }}
              placeholder="พิมพ์คุณสมบัติเพิ่มเติมแล้วกด Enter"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const val = additionalQualInput.trim();
                if (val && !form.additionalQualifications.includes(val)) {
                  setForm((prev) => ({
                    ...prev,
                    additionalQualifications: [...prev.additionalQualifications, val],
                  }));
                }
                setAdditionalQualInput('');
              }}
              className="px-4 py-2.5 bg-[#E00016] hover:bg-[#E00016]/80 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {tt('qualifications.additional.addBtn')}
            </button>
          </div>

          {form.additionalQualifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.additionalQualifications.map((q) => (
                <span
                  key={q}
                  className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-3 py-1.5 rounded-full text-sm font-medium"
                >
                  {q}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        additionalQualifications: prev.additionalQualifications.filter(
                          (item) => item !== q,
                        ),
                      }))
                    }
                    className="hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Section: ข้อมูลผู้ติดต่อ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('contact.title')}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('contact.name')}
              </label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                placeholder="เช่น คุณสมชาย"
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm ${errors.contactName
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              />
              {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('contact.phone')}
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="เช่น 081-234-5678"
                className={`w-full px-4 py-2.5 rounded-xl border outline-none text-gray-900 text-sm ${errors.contactPhone
                  ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D]'
                  }`}
              />
              {errors.contactPhone && <p className="text-xs text-red-500 mt-1">{errors.contactPhone}</p>}
            </div>
          </div>
        </div>

        {/* Section: การเดินทาง */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            <MapPin className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            {tt('transportation.title')}
          </h2>

          <div className="flex gap-2">
            <select
              className="w-1/3 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              onChange={(e) => {
                const val = e.target.value;
                if (val && !transportInput.startsWith(val)) {
                  setTransportInput(val + ' ');
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                {tt('transportation.placeholder')}
              </option>
              {TRANSPORT_PRESETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={transportInput}
              onChange={(e) => setTransportInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = transportInput.trim();
                  if (val && !form.transportation.includes(val)) {
                    setForm((prev) => ({
                      ...prev,
                      transportation: [...prev.transportation, val],
                    }));
                  }
                  setTransportInput('');
                }
              }}
              placeholder="เช่น BTS หมอชิต, รถเมล์สาย 8"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const val = transportInput.trim();
                if (val && !form.transportation.includes(val)) {
                  setForm((prev) => ({
                    ...prev,
                    transportation: [...prev.transportation, val],
                  }));
                }
                setTransportInput('');
              }}
              className="px-4 py-2.5 bg-[#E00016] hover:bg-[#E00016]/80 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              {tt('transportation.addBtn')}
            </button>
          </div>

          {form.transportation.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.transportation.map((t) => {
                const preset = TRANSPORT_PRESETS.find((p) => t.startsWith(p.value));
                const Icon = preset?.icon || MapPin;

                return (
                  <span
                    key={t}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t}
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          transportation: prev.transportation.filter((v) => v !== t),
                        }))
                      }
                      className="hover:text-red-500 transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pb-8">
          {/* ปุ่มบันทึกแบบร่าง: ทำงานเหมือนเดิม ส่ง false ทันที ไม่ต้องผ่าน Pop-up */}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
          >
            {saving ? tt('footerActions.saving') : `💾 ${tt('footerActions.saveDraft')}`}
          </button>

          {/* ปุ่มเผยแพร่: เปลี่ยนมาเรียก handlePublishClick เพื่อเปิด Pop-up ก่อน */}
          <button
            type="button"
            onClick={handlePublishClick}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#E00016] hover:bg-[#E00016]/80 text-white font-semibold transition-all disabled:opacity-60 shadow-sm hover:shadow-md text-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                กำลังเผยแพร่...
              </>
            ) : (
              `🚀 ${tt('footerActions.publish')}`
            )}
          </button>
        </div>
        {/* ==================== POP-UP MODAL ยืนยันการใช้ 1 AC ==================== */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            {/* Background Overlay */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setShowConfirmModal(false)} // กดพื้นหลังเพื่อปิดได้
            />

            {/* Modal Container */}
            <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 p-6 shadow-2xl border border-gray-100 z-10 transform transition-all scale-100 animate-scaleUp">
              <div className="flex flex-col items-center text-center">
                {/* Icon สัญลักษณ์เหรียญ/เครดิต */}
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                  <span className="text-2xl text-[#E00016] font-bold">🪙</span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  ยืนยันการเผยแพร่ประกาศงาน
                </h3>

                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  การเปิดใช้งานและเผยแพร่ตำแหน่งงานนี้สู่สาธารณะ <br />
                  <span className="font-semibold text-[#E00016] bg-red-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                    จะมีค่าใช้จ่ายจำนวน 1 AC
                  </span> <br />
                  ระบบจะทำการตัดยอดเครดิตคงเหลือของคุณทันที
                </p>

                {/* Action Buttons inside Modal */}
                <div className="flex w-full gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit(true)} // พอกดยืนยัน จะยิงส่งฟอร์มจริงและสั่งยิง API Publish (true)
                    className="flex-1 px-4 py-2.5 bg-[#E00016] hover:bg-[#E00016]/90 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
                  >
                    ยืนยันและหัก 1 AC
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
