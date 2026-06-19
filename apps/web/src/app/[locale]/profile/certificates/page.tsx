'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
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
  Upload,
  X,
  Car,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const menuLabels = {
  th: {
    personal: 'ข้อมูลส่วนบุคคล',
    education: 'ประวัติการศึกษา',
    work: 'ประวัติการทำงาน',
    language: 'ความสามารถทางภาษา',
    driving: 'ทักษะการขับขี่',
    certificates: 'ใบประกาศนียบัตร',
  },
  en: {
    personal: 'Personal Information',
    education: 'Education History',
    work: 'Work History',
    language: 'Language Skills',
    driving: 'Driving Skills',
    certificates: 'Certificates',
  }
};

const translations = {
  th: {
    completeness: 'ความสมบูรณ์ของโปรไฟล์',
    success: 'สำเร็จ',
    start: 'เริ่มต้น',
    complete: 'สมบูรณ์',
    certTitle: 'ใบประกาศนียบัตร / เกียรติบัตร ที่',
    certName: 'ชื่อใบประกาศนียบัตร / เกียรติบัตร',
    certPlaceholder: 'เช่น AWS Certified Solutions Architect',
    issuedBy: 'ออกโดย',
    issuedByPlaceholder: 'เช่น Amazon Web Services',
    issueYear: 'ปีที่ได้รับ',
    pleaseSelect: 'โปรดเลือก',
    uploadTitle: 'อัพโหลดรูปเกียรติบัตร',
    uploadClick: 'คลิกเพื่ออัพโหลดรูปภาพ',
    uploadSupport: 'รองรับ JPG, PNG, WEBP (ขนาดไม่เกิน 5MB)',
    errorSize: 'ขนาดไฟล์เกิน 5MB กรุณาเลือกไฟล์ใหม่',
    addCertificate: 'เพิ่มใบประกาศนียบัตร',
    saved: 'บันทึกใบประกาศนียบัตรเรียบร้อยแล้ว — โปรไฟล์สมบูรณ์ 100% ✓',
    error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    backBtn: 'ย้อนกลับ',
    saveBtn: 'บันทึก',
    saving: 'กำลังบันทึก...'
  },
  en: {
    completeness: 'Profile Completeness',
    success: 'Success',
    start: 'Start',
    complete: 'Complete',
    certTitle: 'Certificate / Award ',
    certName: 'Certificate / Award Name',
    certPlaceholder: 'e.g. AWS Certified Solutions Architect',
    issuedBy: 'Issued By',
    issuedByPlaceholder: 'e.g. Amazon Web Services',
    issueYear: 'Issue Year',
    pleaseSelect: 'Please select',
    uploadTitle: 'Upload Certificate Image',
    uploadClick: 'Click to upload image',
    uploadSupport: 'Supports JPG, PNG, WEBP (under 5MB)',
    errorSize: 'File size exceeds 5MB, please select a new file.',
    addCertificate: 'Add Certificate',
    saved: 'Certificates saved successfully — Profile 100% complete ✓',
    error: 'An error occurred, please try again.',
    backBtn: 'Back',
    saveBtn: 'Save',
    saving: 'Saving...'
  }
};

interface CertificateEntry {
  id: string;
  name: string;
  issuedBy: string;
  issueYear: string;
  imageFile: File | null;
  imagePreview: string | null;
}

interface SavedCertificateEntry {
  id?: string;
  name?: string | null;
  issuedBy?: string | null;
  issueYear?: string | number | null;
  imageUrl?: string | null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

const currentYear = new Date().getFullYear() + 543;
const years = Array.from({ length: 50 }, (_, i) => String(currentYear - i));

function createEntry(): CertificateEntry {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    issuedBy: '',
    issueYear: '',
    imageFile: null,
    imagePreview: null,
  };
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale() as 'th' | 'en';
  const t = translations[locale] || translations.th;

  const [entries, setEntries] = useState<CertificateEntry[]>([createEntry()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [completionPercent, setCompletionPercent] = useState(83);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  const profileSteps = [
    { icon: User, label: menuLabels[locale].personal, completed: true, active: false, path: '/profile' },
    { icon: GraduationCap, label: menuLabels[locale].education, completed: true, active: false, path: '/profile/education' },
    { icon: Briefcase, label: menuLabels[locale].work, completed: true, active: false, path: '/profile/work-history' },
    { icon: Languages, label: menuLabels[locale].language, completed: true, active: false, path: '/profile/languages' },
    { icon: Car, label: menuLabels[locale].driving, completed: true, active: false, path: '/profile/driving' },
    { icon: Award, label: menuLabels[locale].certificates, completed: false, active: true, path: '/profile/certificates' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing certificates
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setCompletionPercent(83);
    fetch(`${API_URL}/users/me/certificates`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEntries(
            data.map((d: SavedCertificateEntry) => ({
              id: d.id || Math.random().toString(36).slice(2),
              name: d.name || '',
              issuedBy: d.issuedBy || '',
              issueYear: d.issueYear != null ? String(d.issueYear) : '',
              imageFile: null,
              imagePreview: d.imageUrl || null,
            })),
          );
        }
      })
      .catch(() => { });
  }, [user]);

  const updateEntry = (id: string, field: keyof CertificateEntry, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const handleImageUpload = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, imageFile: file, imagePreview: reader.result as string } : e,
        ),
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, imageFile: null, imagePreview: null } : e)),
    );
  };

  const addEntry = () => setEntries((prev) => [...prev, createEntry()]);

  const removeEntry = (id: string) => {
    if (entries.length === 1) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const uploadImage = async (file: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || 'อัพโหลดรูปภาพไม่สำเร็จ');
    }
    const data = await res.json();
    return data.url as string;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const validEntries = entries.filter((e) => e.name && e.name.trim() !== '');

      const itemsWithUrls = await Promise.all(
        validEntries.map(async (entry) => {
          let imageUrl: string | undefined =
            entry.imagePreview && !entry.imageFile
              ? entry.imagePreview 
              : undefined;
          if (entry.imageFile) {
            imageUrl = await uploadImage(entry.imageFile, token);
          }
          return {
            name: entry.name,
            issuedBy: entry.issuedBy || undefined,
            issueYear: entry.issueYear || undefined,
            imageUrl,
          };
        }),
      );

      const res = await fetch(`${API_URL}/users/me/certificates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsWithUrls }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'บันทึกไม่สำเร็จ');
      }

      setSaving(false);
      setMessage({
        type: 'success',
        text: t.saved,
      });

      setCompletionPercent(100);

      // เพิ่มคำสั่งดึงหน้าจอกลับขึ้นด้านบนสุด ก่อนที่จะเริ่มทำการย้ายหน้าเพจไป /profilefull
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' }); // บังคับเลื่อนหน้าขึ้นด้านบนแบบนุ่มนวล
        router.push('/profilefull');
      }, 2000);

    } catch (error: unknown) {
      setSaving(false);
      setMessage({ type: 'error', text: getErrorMessage(error, t.error) });
    }
  };

  const handleBack = () => {
    window.scrollTo(0, 0); // เลื่อนขึ้นบนเมื่อกดย้อนกลับเช่นกัน
    router.push('/profile/driving');
  };

  const handleStepClick = (path: string) => {
    window.scrollTo(0, 0); // เลื่อนขึ้นบนเมื่อกดสลับเมนูด้านบน
    router.push(path);
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
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
    <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />
  </div>

  <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 relative z-10">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-1 h-6 rounded-full bg-linear-to-b from-blue-400 to-cyan-400" />
      <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide">
        {t.completeness}
      </h2>
    </div>

    {/* Main Glass Card */}
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
                cx="60" cy="60" r="54" fill="none" stroke="url(#progressGradient)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" /><stop offset="50%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-bold text-white">{completionPercent}%</span>
              <span className="text-[10px] text-blue-300/80 mt-0.5">{t.success}</span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />
        </div>

        {/* Steps Navigation */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {profileSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleStepClick(step.path)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 cursor-pointer
                    ${step.active
                      ? 'bg-white/15 border border-white/20'
                      : 'hover:bg-white/6 border border-transparent'
                    }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                    ${step.completed ? 'bg-linear-to-br from-blue-400 to-cyan-400' : 'bg-white/10'}`}
                  >
                    {step.completed ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Icon className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                  <span className="text-[11px] text-center font-medium text-white/70">
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

      {/* Main Content Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {entries.map((entry, idx) => (
          <div key={entry.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                {t.certTitle} {idx + 1}
              </h2>
              {entries.length > 1 && (
                <button onClick={() => removeEntry(entry.id)} className="text-red-400 hover:text-red-600 transition-colors p-1" title="ลบรายการนี้">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.certName}</label>
              <input
                type="text"
                value={entry.name}
                onChange={(e) => updateEntry(entry.id, 'name', e.target.value)}
                placeholder={t.certPlaceholder}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.issuedBy}</label>
                <input
                  type="text"
                  value={entry.issuedBy}
                  onChange={(e) => updateEntry(entry.id, 'issuedBy', e.target.value)}
                  placeholder={t.issuedByPlaceholder}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t.issueYear}</label>
                <div className="relative">
                  <select
                    value={entry.issueYear}
                    onChange={(e) => updateEntry(entry.id, 'issueYear', e.target.value)}
                    className="w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">{t.pleaseSelect}</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <svg className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t.uploadTitle}</label>
              {entry.imagePreview ? (
                <div className="relative group">
                  <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={entry.imagePreview} alt="Certificate preview" className="w-full h-full object-contain" />
                    <button onClick={() => removeImage(entry.id)} className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors opacity-0 group-hover:opacity-100">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[entry.id]?.click()}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-lg py-8 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium transition-colors">{t.uploadClick}</span>
                  <span className="text-xs text-gray-400">{t.uploadSupport}</span>
                </button>
              )}
              <input
                ref={(el) => { fileInputRefs.current[entry.id] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setMessage({ type: 'error', text: t.errorSize });
                      return;
                    }
                    handleImageUpload(entry.id, file);
                  }
                }}
              />
            </div>
          </div>
        ))}

        <button onClick={addEntry} className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 text-gray-500 hover:text-blue-600 rounded-xl py-4 flex items-center justify-center gap-2 transition-colors mb-8">
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t.addCertificate}</span>
        </button>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={handleBack} className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors">{t.backBtn}</button>
          <button onClick={handleSubmit} disabled={saving} className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-12 py-3 rounded-lg font-bold text-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> {t.saving}</> : t.saveBtn}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}