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
  Upload,
  FileText,
  Car,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const menuLabels = {
  th: {
    personal: 'ข้อมูลส่วนบุคคล',
    education: 'ประวัติการศึกษา',
    work: 'ตำแหน่ง/ประวัติการทำงาน',
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

const LANGUAGES_LIST = [
  'ภาษาไทย',
  'ภาษาอังกฤษ',
  'ภาษาจีน (แมนดาริน)',
  'ภาษาญี่ปุ่น',
  'ภาษาเกาหลี',
  'ภาษาฝรั่งเศส',
  'ภาษาเยอรมัน',
  'ภาษาสเปน',
  'ภาษาพม่า',
  'ภาษาเวียดนาม',
  'ภาษาลาว',
  'ภาษาเขมร',
  'ภาษามลายู',
  'ภาษาฮินดี',
  'ภาษารัสเซีย',
  'ภาษาอาหรับ',
  'ภาษาโปรตุเกส',
  'อื่นๆ',
];

const LANGUAGES_LIST_EN = [
  'Thai',
  'English',
  'Chinese (Mandarin)',
  'Japanese',
  'Korean',
  'French',
  'German',
  'Spanish',
  'Burmese',
  'Vietnamese',
  'Lao',
  'Khmer',
  'Malay',
  'Hindi',
  'Russian',
  'Arabic',
  'Portuguese',
  'Other',
];

const LANGUAGE_LEVELS_TH = [
  'พื้นฐาน(Basic)',
  'พอใช้ (Fair)',
  'ดี (Good)',
  'ดีมาก (Fluent)',
  'เจ้าของภาษา (Native)',
];

const LANGUAGE_LEVELS_EN = [
  'Basic',
  'Fair',
  'Good',
  'Fluent',
  'Native',
];

const SKILL_LEVELS_TH = ['ไม่ได้', 'พอใช้', 'ดี', 'ดีเยี่ยม'];
const SKILL_LEVELS_EN = ['None', 'Fair', 'Good', 'Excellent'];

const TEST_NAMES = [
  'TOEIC',
  'TOEFL iBT',
  'TOEFL ITP',
  'IELTS',
  'CU-TEP',
  'TU-GET',
  'JLPT (N1-N5)',
  'HSK',
  'TOPIK',
  'DELF/DALF',
  'TestDaF',
  'DELE',
  'อื่นๆ',
];

const translations = {
  th: {
    completeness: 'ความสมบูรณ์ของโปรไฟล์',
    success: 'สำเร็จ',
    saved: 'บันทึกความสามารถทางภาษาเรียบร้อยแล้ว ✓',
    error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    saveAndNext: 'บันทึกและถัดไป',
    saving: 'กำลังบันทึก...',
    backBtn: 'ย้อนกลับ',
    langTitle: 'ความสามารถทางภาษา',
    langLabel: 'ภาษา',
    overallLevel: 'ระดับภาษาโดยรวม',
    speaking: 'พูด',
    reading: 'อ่าน',
    writing: 'เขียน',
    pleaseSelect: 'โปรดเลือก',
    addLang: 'เพิ่มภาษา',
    testScoresTitle: 'ผลสอบระดับภาษา',
    testName: 'ชื่อผลสอบ',
    scoreReceived: 'คะแนนที่ได้รับ',
    attachDoc: 'เอกสารแนบผลสอบ (PDF)',
    selectFile: 'เลือกไฟล์',
    addTestResult: 'เพิ่มผลสอบ',
    placeholderLang: 'ระบุภาษา',
    placeholderLevel: 'ระบุระดับภาษา',
    placeholderScore: 'ระบุคะแนน',
    fileNotSelected: 'ยังไม่ได้เลือกไฟล์ใหม่',
    viewOldFile: 'ดูไฟล์เอกสารแนบเดิม',
    deleteAttachment: 'ลบเอกสารแนบ'
  },
  en: {
    completeness: 'Profile Completeness',
    success: 'Success',
    saved: 'Language skills saved successfully ✓',
    error: 'An error occurred, please try again.',
    saveAndNext: 'Save & Next',
    saving: 'Saving...',
    backBtn: 'Back',
    langTitle: 'Language Skills',
    langLabel: 'Language',
    overallLevel: 'Overall Language Level',
    speaking: 'Speaking',
    reading: 'Reading',
    writing: 'Writing',
    pleaseSelect: 'Please select',
    addLang: 'Add Language',
    testScoresTitle: 'Language Test Scores',
    testName: 'Test Name',
    scoreReceived: 'Score Received',
    attachDoc: 'Test Attachment (PDF)',
    selectFile: 'Select File',
    addTestResult: 'Add Test Result',
    placeholderLang: 'Select Language',
    placeholderLevel: 'Select Level',
    placeholderScore: 'Enter Score',
    fileNotSelected: 'No file selected',
    viewOldFile: 'View existing attached file',
    deleteAttachment: 'Delete attachment'
  }
};

interface LanguageEntry {
  id: string;
  language: string;
  level: string;
  speaking: string;
  reading: string;
  writing: string;
}

interface TestEntry {
  id: string;
  testName: string;
  score: string;
  file?: File;
  fileName?: string;
  fileUrl?: string;
}

interface SavedLanguageEntry {
  id?: string;
  language?: string | null;
  level?: string | null;
  speaking?: string | null;
  reading?: string | null;
  writing?: string | null;
}

interface SavedTestEntry {
  id?: string;
  testName?: string | null;
  score?: string | null;
  fileUrl?: string | null;
}

function createLanguageEntry(): LanguageEntry {
  return {
    id: Math.random().toString(36).slice(2),
    language: '',
    level: '',
    speaking: '',
    reading: '',
    writing: '',
  };
}

function createTestEntry(): TestEntry {
  return {
    id: Math.random().toString(36).slice(2),
    testName: '',
    score: '',
    file: undefined,
    fileName: '',
  };
}

export default function LanguagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale() as 'th' | 'en';
  const t = translations[locale] || translations.th;

  const [langEntries, setLangEntries] = useState<LanguageEntry[]>([createLanguageEntry()]);
  const [testEntries, setTestEntries] = useState<TestEntry[]>([createTestEntry()]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [completionPercent, setCompletionPercent] = useState(50);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  const langsListOptions = (locale === 'en' ? LANGUAGES_LIST_EN : LANGUAGES_LIST).map((l, i) => ({
    value: LANGUAGES_LIST[i], // เก็บค่า value เป็นภาษาไทยอิงตาม backend เดิม หรือปรับเปลี่ยนตามตกลง
    label: l,
  }));

  const langLevelsOptions = (locale === 'en' ? LANGUAGE_LEVELS_EN : LANGUAGE_LEVELS_TH).map((l, i) => ({
    value: LANGUAGE_LEVELS_TH[i],
    label: l,
  }));

  const skillLevelsList = locale === 'en' ? SKILL_LEVELS_EN : SKILL_LEVELS_TH;

  const profileSteps = [
    { icon: User, label: menuLabels[locale].personal, completed: true, active: false, path: '/profile' },
    { icon: GraduationCap, label: menuLabels[locale].education, completed: true, active: false, path: '/profile/education' },
    { icon: Briefcase, label: menuLabels[locale].work, completed: true, active: false, path: '/profile/work-history' },
    { icon: Languages, label: menuLabels[locale].language, completed: false, active: true, path: '/profile/languages' },
    { icon: Car, label: menuLabels[locale].driving, completed: false, active: false, path: '/profile/driving' },
    { icon: Award, label: menuLabels[locale].certificates, completed: false, active: false, path: '/profile/certificates' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Load existing language data
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setCompletionPercent(50);
    fetch(`${API_URL}/users/me/languages`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.languages && Array.isArray(data.languages) && data.languages.length > 0) {
          setLangEntries(
            data.languages.map((d: SavedLanguageEntry) => ({
              id: d.id || Math.random().toString(36).slice(2),
              language: d.language || '',
              level: d.level || '',
              speaking: d.speaking || '',
              reading: d.reading || '',
              writing: d.writing || '',
            })),
          );
        }
        if (data?.tests && Array.isArray(data.tests) && data.tests.length > 0) {
          setTestEntries(
            data.tests.map((t: SavedTestEntry) => ({
              id: t.id || Math.random().toString(36).slice(2),
              testName: t.testName || '',
              score: t.score || '',
              fileUrl: t.fileUrl || undefined,
              fileName: t.fileUrl ? t.fileUrl.split('/').pop() : '',
            })),
          );
        }
      })
      .catch(() => { });
  }, [user]);

  // Language entries
  const updateLang = (id: string, field: keyof LanguageEntry, value: string) => {
    setLangEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const addLang = () => setLangEntries((prev) => [...prev, createLanguageEntry()]);
  const removeLang = (id: string) => {
    if (langEntries.length === 1) return;
    setLangEntries((prev) => prev.filter((e) => e.id !== id));
  };

  // Test entries
  const updateTest = <K extends keyof TestEntry>(id: string, field: K, value: TestEntry[K]) => {
    setTestEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };
  const addTest = () => setTestEntries((prev) => [...prev, createTestEntry()]);
  const removeTest = (id: string) => {
    if (testEntries.length === 1) return;
    setTestEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        updateTest(id, 'file', file);
        updateTest(id, 'fileName', file.name);
      } else {
        alert(locale === 'en' ? 'Please upload a PDF file only.' : 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น');
      }
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      const validLangs = langEntries.filter((e) => e.language.trim() !== '');
      const validTests = testEntries.filter((e) => e.testName.trim() !== '');

      // 1. Upload files first
      const testsToSave = await Promise.all(
        validTests.map(async (testEntry) => {
          if (testEntry.file) {
            const formData = new FormData();
            formData.append('file', testEntry.file);

            const uploadRes = await fetch(`${API_URL}/upload/document`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });

            if (!uploadRes.ok) {
              console.error('Failed to upload file for', testEntry.testName);
              throw new Error(`อัปโหลดไฟล์สำหรับ ${testEntry.testName} ไม่สำเร็จ`);
            }

            const uploadData = await uploadRes.json();
            return {
              id: testEntry.id,
              testName: testEntry.testName,
              score: testEntry.score,
              fileUrl: uploadData.url,
            };
          }

          return {
            id: testEntry.id,
            testName: testEntry.testName,
            score: testEntry.score,
            fileUrl: testEntry.fileUrl,
          };
        }),
      );

      // 2. Save language data
      const res = await fetch(`${API_URL}/users/me/languages`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          languages: validLangs.map(({ id, ...rest }) => ({
            ...rest,
            speaking: rest.speaking || undefined,
            reading: rest.reading || undefined,
            writing: rest.writing || undefined,
          })),
          tests: testsToSave.map(({ id, ...rest }) => rest),
        }),
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }
        throw new Error('Save failed');
      }
      setSaving(false);
      setMessage({ type: 'success', text: t.saved });
      
      setCompletionPercent(67);
      
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        router.push('/profile/driving');
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
    router.push('/profile/work-history');
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
                    {step.completed ? <Check className="w-5 h-5 text-white" /> : <Icon className="w-5 h-5 text-white/30" />}
                  </div>
                  <span className="text-[11px] text-center font-medium text-white/70">{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Section 1: Language Skills */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-6">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
            <Languages className="w-4 h-4 text-blue-600" />
            {t.langTitle}
          </h2>

          {langEntries.map((entry, idx) => (
            <div key={entry.id} className="mb-4 last:mb-0">
              {idx > 0 && <hr className="my-4 border-gray-200" />}

              {/* Row 1: Language + Overall Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.langLabel}</label>
                  <SearchableSelect
                    placeholder={t.placeholderLang}
                    value={entry.language}
                    onChange={(val) => updateLang(entry.id, 'language', val)}
                    options={langsListOptions}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t.overallLevel}
                  </label>
                  <SearchableSelect
                    placeholder={t.placeholderLevel}
                    value={entry.level}
                    onChange={(val) => updateLang(entry.id, 'level', val)}
                    options={langLevelsOptions}
                  />
                </div>
              </div>

              {/* Row 2: Speaking / Reading / Writing */}
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    { field: 'speaking' as const, label: t.speaking },
                    { field: 'reading' as const, label: t.reading },
                    { field: 'writing' as const, label: t.writing },
                  ] as const
                ).map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
                    <div className="relative">
                      <select
                        value={entry[field]}
                        onChange={(e) => updateLang(entry.id, field, e.target.value)}
                        className="w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer text-sm"
                      >
                        <option value="">{t.pleaseSelect}</option>
                        {skillLevelsList.map((s, idxS) => (
                          <option key={s} value={SKILL_LEVELS_TH[idxS]}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Remove button */}
              {langEntries.length > 1 && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeLang(entry.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add language */}
          <button
            onClick={addLang}
            className="mt-4 flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.addLang}
          </button>
        </div>

        {/* Section 2: Language Test Scores */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 md:p-8 mb-8">
          <h2 className="text-base font-bold text-gray-800 mb-6">{t.testScoresTitle}</h2>

          {testEntries.map((entry, idx) => (
            <div key={entry.id} className="mb-4 last:mb-0">
              {idx > 0 && <hr className="my-4 border-gray-200" />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.testName}</label>
                  <SearchableSelect
                    placeholder={t.placeholderLang}
                    value={entry.testName}
                    onChange={(val) => updateTest(entry.id, 'testName', val)}
                    options={TEST_NAMES.map((tItem) => ({ value: tItem, label: tItem }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {t.scoreReceived}
                  </label>
                  <input
                    type="text"
                    value={entry.score}
                    onChange={(e) => updateTest(entry.id, 'score', e.target.value)}
                    placeholder={t.placeholderScore}
                    className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* File Upload for Test Entry */}
              <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  {t.attachDoc}
                </label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm">
                    <Upload className="w-4 h-4" />
                    <span>{t.selectFile}</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleFileChange(entry.id, e)}
                    />
                  </label>

                  {entry.fileName ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="truncate flex-1">{entry.fileName}</span>
                      <button
                        onClick={() => {
                          updateTest(entry.id, 'file', undefined);
                          updateTest(entry.id, 'fileName', '');
                          updateTest(entry.id, 'fileUrl', undefined);
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        title={t.deleteAttachment}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : entry.fileUrl ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 flex-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <a
                        href={entry.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate flex-1 text-blue-600 hover:underline"
                      >
                        {t.viewOldFile}
                      </a>
                      <button
                        onClick={() => {
                          updateTest(entry.id, 'fileUrl', undefined);
                          updateTest(entry.id, 'fileName', '');
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                        title={t.deleteAttachment}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">{t.fileNotSelected}</span>
                  )}
                </div>
              </div>

              {/* Add & Remove buttons */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={addTest}
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addTestResult}
                </button>
                {testEntries.length > 1 && (
                  <button
                    onClick={() => removeTest(entry.id)}
                    className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    title="ลบรายการนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
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

        {/* Action buttons */}
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