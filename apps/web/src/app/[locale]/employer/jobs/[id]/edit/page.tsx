'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import { useParams } from 'next/navigation';
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
  { value: 'รถเมล์', icon: Bus, label: 'รถเมล์' },
  { value: 'BTS', icon: TrainFront, label: 'BTS' },
  { value: 'MRT', icon: TramFront, label: 'MRT' },
  { value: 'ARL', icon: Plane, label: 'ARL' },
  { value: 'รถไฟ', icon: Train, label: 'รถไฟ' },
];

const ADDITIONAL_QUAL_PRESETS = [
  'ยินดีรับนักศึกษาจบใหม่',
  'ยินดีรับผู้ไม่มีประสบการณ์',
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

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('HeroSearch.provinces');
  const tt = useTranslations('jobcreate');

  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingJob, setLoadingJob] = useState(true);
  const [companyError, setCompanyError] = useState('');

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

  const [transportInput, setTransportInput] = useState('');
  const [additionalQualInput, setAdditionalQualInput] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/employer/login');
      return;
    }
    if (!authLoading && user && user.role !== 'EMPLOYER') {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'EMPLOYER') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${API_URL}/companies/mine/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error('ไม่พบข้อมูลงาน หรือคุณไม่มีสิทธิ์');
        return r.json();
      })
      .then((data) => {
        console.log('Job data', data);
        // Parse benefits
        let parsedBenefits: string[] = [];
        let parsedOtherBenefits = '';

        if (Array.isArray(data.benefits)) {
          parsedBenefits = data.benefits.filter((b: string) => !b.startsWith('สวัสดิการอื่นๆ: '));
          const otherBenefitMatch = data.benefits.find((b: string) =>
            b.startsWith('สวัสดิการอื่นๆ: '),
          );
          if (otherBenefitMatch) {
            parsedOtherBenefits = otherBenefitMatch.replace('สวัสดิการอื่นๆ: ', '').trim();
          }
        }

        setForm({
          title: data.title || '',
          description: data.description || '',
          requirements: data.requirements || '',
          benefits: parsedBenefits,
          otherBenefits: parsedOtherBenefits,
          salaryMin: data.salaryMin ? data.salaryMin.toString() : '',
          salaryMax: data.salaryMax ? data.salaryMax.toString() : '',
          salaryVisible: data.salaryVisible ?? true,
          jobType: data.jobType || 'FULL_TIME',
          workModel: data.workModel || 'ONSITE',
          locationProvince: data.locationProvince || '',
          locationDistrict: data.locationDistrict || '',
          companyAddress: data.companyAddress || '',
          mapUrl: data.mapUrl || '',
          requiredSkills: data.requiredSkills || [],
          positions: data.positions || 1,
          workingDays: data.workingDays || '5 วัน/สัปดาห์',
          startTime: data.startTime || '',
          endTime: data.endTime || '',
          canOnlineInterview: data.canOnlineInterview || false,
          isQuickApply: data.isQuickApply || false,
          welcomeRecentGrads: data.welcomeRecentGrads || false,
          education: data.education || '',
          category: data.category || '',
          jobFunction: data.jobFunction || '',
          qualificationGender: data.qualificationGender || '',
          qualificationAgeMin: data.qualificationAgeMin ? data.qualificationAgeMin.toString() : '',
          qualificationAgeMax: data.qualificationAgeMax ? data.qualificationAgeMax.toString() : '',
          qualificationExperience: data.qualificationExperience
            ? data.qualificationExperience.toString()
            : '',
          additionalQualifications: (() => {
            const quals = Array.isArray(data.additionalQualifications)
              ? [...data.additionalQualifications]
              : [];
            if (data.welcomeRecentGrads && !quals.includes('ยินดีรับนักศึกษาจบใหม่')) {
              quals.unshift('ยินดีรับนักศึกษาจบใหม่');
            }
            return quals;
          })(),
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          transportation: Array.isArray(data.transportation) ? data.transportation : [],
          companyImages: Array.isArray(data.companyImages) ? data.companyImages : [],
        });
        setCompanyId(data.companyId);
        setCompanyName(data.company?.name || 'บริษัทของคุณ');
        setLoadingJob(false);
        setLoadingCompany(false);
      })
      .catch((err) => {
        setCompanyError(err.message);
        setLoadingJob(false);
        setLoadingCompany(false);
      });
  }, [user, jobId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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

  const handleSubmit = async (publishNow: boolean) => {
    setError('');
    if (!companyId) {
      setError('ไม่พบข้อมูลบริษัท');
      return;
    }
    if (form.requiredSkills.length === 0) {
      setError('กรุณาเพิ่มทักษะที่ต้องการอย่างน้อย 1 รายการ');
      return;
    }

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
      };

      const res = await fetch(`${API_URL}/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'บันทึกไม่สำเร็จ');
      }

      if (publishNow) {
        await fetch(`${API_URL}/jobs/${jobId}/publish`, {
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

  if (authLoading || loadingCompany || loadingJob) {
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
    <div className="min-h-screen bg-gray-50 font-sans">
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
                  <div className="relative w-12 h-12 rounded-2xl bg-linear-to-br from-[#020263] to-[#4f4f96] flex items-center justify-center shadow-md">
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

        {/* Section: ข้อมูลพื้นฐาน */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            {tt('basicInfo.title')}
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {tt('basicInfo.jobTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="เช่น Senior Frontend Developer, ผู้จัดการฝ่ายการตลาด"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.jobType')} <span className="text-red-500">*</span>
              </label>
              <select
                name="jobType"
                value={form.jobType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.workModel')} <span className="text-red-500">*</span>
              </label>
              <select
                name="workModel"
                value={form.workModel}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
              >
                {WORK_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.positions')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="positions"
                value={form.positions}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {tt('basicInfo.province')} <span className="text-red-500">*</span>
              </label>
              <select
                name="locationProvince"
                value={form.locationProvince}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] outline-none text-gray-900 text-sm bg-white">

                {Object.keys(th.HeroSearch.provinces)
                  .filter((key) => key !== 'all')
                  .map((key) => (
                    <option key={key} value={t(key)}>
                      {t(key)}
                    </option>
                  ))}
              </select>
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                สาขาอาชีพ/ตำแหน่งงาน
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ลักษณะงาน
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

          <div className="grid grid-cols-1 gap-4 border-t border-gray-100 pt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันและเวลาทำงาน <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-4 mb-4">
                {['5 วัน/สัปดาห์', '6 วัน/สัปดาห์', 'บริษัทกำหนดเลือก'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="workingDays"
                      value={opt}
                      checked={form.workingDays === opt}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>

              {form.workingDays === 'บริษัทกำหนดเลือก' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      เวลาเข้างาน
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={form.startTime}
                      onChange={handleChange}
                      required={form.workingDays === 'บริษัทกำหนดเลือก'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">
                      เวลาออกงาน
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={form.endTime}
                      onChange={handleChange}
                      required={form.workingDays === 'บริษัทกำหนดเลือก'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รองรับการสัมภาษณ์ออนไลน์ <span className="text-red-500">*</span>
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
                  <span className="text-sm text-gray-700">รองรับ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="canOnlineInterview"
                    checked={form.canOnlineInterview}
                    onChange={() => setForm((p) => ({ ...p, canOnlineInterview: true }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">ไม่รองรับ</span>
                </label>
              </div>
            </div>

            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">สมัครด่วน</label>
              <p className="text-xs text-gray-400 mb-2">
                เปิดใช้เพื่อแสดง badge "สมัครด่วน" บนประกาศ เพื่อดึงดูดผู้สมัครเร็วขึ้น
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
                  <span className="text-sm text-gray-700">ปิด</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isQuickApply"
                    checked={form.isQuickApply}
                    onChange={() => setForm((p) => ({ ...p, isQuickApply: true }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">เปิด — แสดง badge สมัครด่วน</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ข้อมูลการติดต่อบริษัท (ที่อยู่)
            </label>
            <textarea
              name="companyAddress"
              value={form.companyAddress}
              onChange={handleChange}
              rows={3}
              placeholder="เช่น 111 หมู่ 9 อุทยานวิทยาศาสตร์ประเทศไทย ชั้น 2 ห้อง P-206 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm resize-none"
            />
          </div>

          <div className="mt-4 border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ลิงก์แผนที่ (Google Maps URL)
            </label>
            <input
              type="url"
              name="mapUrl"
              value={form.mapUrl}
              onChange={handleChange}
              placeholder="เช่น https://goo.gl/maps/... หรือ https://maps.app.goo.gl/..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
            />
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
            เงินเดือน
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เงินเดือนต่ำสุด (บาท)
              </label>
              <input
                type="number"
                name="salaryMin"
                value={form.salaryMin}
                onChange={handleChange}
                placeholder="เช่น 15,000 บาท"
                min={0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เงินเดือนสูงสุด (บาท)
              </label>
              <input
                type="number"
                name="salaryMax"
                value={form.salaryMax}
                onChange={handleChange}
                placeholder="เช่น 50,000 บาท"
                min={0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
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
            <span className="text-sm text-gray-600">แสดงเงินเดือนในประกาศ</span>
          </label>
        </div>

        {/* Section: รายละเอียดงาน */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            รายละเอียดงาน
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              รายละเอียดงาน <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
              placeholder="อธิบายหน้าที่ความรับผิดชอบ สภาพแวดล้อมการทำงาน และรายละเอียดอื่นๆ..."
              minHeight={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              คุณสมบัติผู้สมัคร <span className="text-red-500">*</span>
            </label>
            <RichTextEditor
              value={form.requirements}
              onChange={(html) => setForm((prev) => ({ ...prev, requirements: html }))}
              placeholder="เช่น วุฒิการศึกษา, ประสบการณ์, ทักษะที่จำเป็น, คุณลักษณะที่ต้องการ..."
              minHeight={160}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สวัสดิการและค่าตอบแทน
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {[
                'ประกันสังคม',
                'โบนัส',
                'ค่าล่วงเวลา',
                'ค่าคอมมิชชัน',
                'กองทุนสำรองเลี้ยงชีพ',
                'ที่พัก',
                'ค่าเดินทาง',
                'อาหาร',
                'ชุดพนักงาน',
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
                สวัสดิการอื่นๆ
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
            ทักษะที่ต้องการ <span className="text-red-500">*</span>
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="พิมพ์ทักษะแล้วกด Enter เช่น React, Python, Excel"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2.5 bg-[#E00016] hover:bg-[#E00016]/80 text-white rounded-xl text-sm font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม
            </button>
          </div>

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
              ยังไม่มีทักษะ — กรุณาเพิ่มอย่างน้อย 1 รายการ
            </p>
          )}
        </div>

        {/* Section: คุณสมบัติ */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            คุณสมบัติ
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">เพศ</label>
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
                ระดับการศึกษา (ขั้นต่ำ)
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">อายุ (ปี)</label>
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
                ประสบการณ์ (ปี)
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
            คุณสมบัติเพิ่มเติม
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
              เพิ่ม
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
            สนใจสมัครงานตำแหน่งงานนี้กรุณาติดต่อ
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ชื่อผู้ติดต่อ
              </label>
              <input
                type="text"
                name="contactName"
                value={form.contactName}
                onChange={handleChange}
                placeholder="เช่น คุณสมชาย"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                เบอร์ผู้ติดต่อ
              </label>
              <input
                type="tel"
                name="contactPhone"
                value={form.contactPhone}
                onChange={handleChange}
                placeholder="เช่น 081-234-5678"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#020263] focus:border-[#00003D] outline-none text-gray-900 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section: การเดินทาง */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-700 text-base border-b border-gray-100 pb-3">
            <MapPin className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
            การเดินทาง
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
                เลือกประเภท (หรือพิมพ์เอง)
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
              เพิ่ม
            </button>
          </div>

          {form.transportation.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.transportation.map((t) => {
                // Find icon by checking if the text starts with the preset value
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
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-60 text-sm"
          >
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกการแก้ไข (Draft)'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#E00016] hover:bg-[#E00016]/80 text-white font-semibold transition-all disabled:opacity-60 shadow-sm hover:shadow-md text-sm"
          >
            {saving ? 'กำลังอัปเดตงาน...' : '🚀 บันทึกและเผยแพร่ประกาศงาน'}
          </button>
        </div>
      </div>
    </div>
  );
}
