'use client';

import { useState } from 'react';
import {
  Bot,
  X,
  Plus,
  AlertTriangle,
  Briefcase,
  MapPin,
  Banknote,
  ChevronRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Target,
  FileText,
  Upload,
  Wand2,
} from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface WorkItem {
  id: string;
  company?: string;
  companyName?: string;
  position?: string;
  startYear?: string;
  endYear?: string;
  isCurrent?: boolean;
}

interface EducationItem {
  id: string;
  institution: string;
  educationLevel?: string;
  faculty?: string;
  major?: string;
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

interface JobResult {
  id: string;
  title: string;
  slug: string;
  company: { id: string; name: string; logoUrl?: string };
  requiredSkills: string[] | string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryVisible?: boolean;
  qualificationExperience?: number | null;
  locationProvince?: string | null;
  jobType: string;
  workModel: string;
  description: string;
}

interface MatchResult {
  job: JobResult;
  totalScore: number;
  titleScore: number;
  hardSkillScore: number;
  expScore: number;
  matchedSkills: string[];
  missedSkills: string[];
  salaryWarning: boolean;
}

interface ResumeInfo {
  id: string;
  title?: string;
  fileUrl?: string;
}

interface ParsedResume {
  skills?: string[];
  experienceYears?: number;
  expectedSalary?: number;
  currentPosition?: string;
  firstName?: string;
  lastName?: string;
}

interface Props {
  works: WorkItem[];
  certs: CertItem[];
  languages: LanguageItem[];
  educations: EducationItem[];
  resume?: ResumeInfo | null;
}

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'งานประจำ',
  PART_TIME: 'งานพาร์ทไทม์',
  CONTRACT: 'สัญญาจ้าง',
  INTERNSHIP: 'ฝึกงาน',
  FREELANCE: 'ฟรีแลนซ์',
};

const WORK_MODEL_LABEL: Record<string, string> = {
  ONSITE: 'ทำงานที่ออฟฟิศ',
  REMOTE: 'ทำงานจากบ้าน',
  HYBRID: 'ไฮบริด',
};

function calcExpYears(works: WorkItem[]): number {
  let totalMonths = 0;
  const now = new Date();
  for (const w of works) {
    const startYear = parseInt(String(w.startYear || '0'));
    const endYear = w.isCurrent ? now.getFullYear() : parseInt(String(w.endYear || '0'));
    if (startYear > 0 && endYear >= startYear) {
      totalMonths += (endYear - startYear) * 12;
    }
  }
  return Math.max(0, totalMonths / 12);
}

function extractInitialSkills(
  works: WorkItem[],
  certs: CertItem[],
  languages: LanguageItem[],
): string[] {
  const skills = new Set<string>();
  languages.forEach((l) => {
    if (l.language) skills.add(l.language);
  });
  certs.forEach((c) => {
    if (c.name) skills.add(c.name);
  });
  works.forEach((w) => {
    if (w.position) skills.add(w.position);
  });
  return Array.from(skills).slice(0, 12);
}

function parseRequiredSkills(skills: any): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) {
    return skills.flatMap(s => s.split(',').map((item: string) => item.trim()));
  }
  if (typeof skills === 'string') {
    return skills.split(',').map((s: string) => s.trim());
  }
  return [];
}

function getTitleScore(jobTitle: string, userPosition: string): number {
  let job = jobTitle.toLowerCase().trim();
  let user = userPosition.toLowerCase().trim();

  if (!user || !job) return 0;
  if (job === user) return 100;

  const synonymGroups = [
    ['account', 'accounting', 'auditor', 'audit', 'tax', 'finance', 'bookkeeper', 'cpa', 'บัญชี', 'ตรวจสอบเงิน', 'สมุห์บัญชี', 'การเงิน', 'ภาษี'],
    ['it', 'software', 'developer', 'programmer', 'engineer', 'stack', 'coder', 'backend', 'frontend', 'system', 'network', 'computer', 'data', 'เทคโนโลยี', 'โปรแกรมเมอร์', 'นักพัฒนา'],
    ['sale', 'sales', 'marketing', 'bd', 'business development', 'ae', 'account executive', 'telesale', 'ขาย', 'การตลาด', 'เซลล์', 'พัฒนาธุรกิจ'],
    ['hr', 'human resource', 'people', 'talent', 'recruitment', 'recruiter', 'admin', 'administrator', 'office', 'back office', 'ธุรการ', 'บุคคล', 'สรรหา'],
    ['cs', 'customer service', 'support', 'coordinator', 'receptionist', 'service', 'ดูแลลูกค้า', 'ประสานงาน', 'ต้อนรับ', 'บริการ'],
    ['production', 'factory', 'manufacturing', 'technician', 'mechanic', 'maintenance', 'qc', 'qa', 'ผลิต', 'โรงงาน', 'ช่าง', 'ซ่อมบำรุง', 'ควบคุมคุณภาพ'],
    ['driver', 'logistic', 'logistics', 'warehouse', 'delivery', 'stock', 'ขนส่ง', 'โลจิสติกส์', 'คลังสินค้า', 'ส่งของ', 'คนขับรถ'],
    ['design', 'designer', 'graphic', 'ux', 'ui', 'creative', 'content', 'editor', 'กราฟิก', 'ออกแบบ', 'ตัดต่อ', 'ครีเอทีฟ']
  ];

  const isMatchInGroup = synonymGroups.some(group =>
    group.some(word => user.includes(word)) && group.some(word => job.includes(word))
  );

  if (isMatchInGroup) return 85;

  const stopWords = ['senior', 'junior', 'assistant', 'staff', 'level', 'expert', 'specialist', 'หัวหน้า', 'ผู้ช่วย', 'เจ้าหน้าที่', 'manager', 'lead', 'director'];

  const cleanJobWords = job.split(/[\s/&-]+/).filter(w => w.length > 2 && !stopWords.includes(w));
  const cleanUserWords = user.split(/[\s/&-]+/).filter(w => w.length > 2 && !stopWords.includes(w));

  const hasOverlap = cleanJobWords.some(jw => cleanUserWords.some(uw => uw.includes(jw) || jw.includes(uw)));

  if (hasOverlap) return 70;

  return 0;
}

function computeMatch(
  job: JobResult,
  userSkills: string[],
  expYears: number,
  expectedSalary: number,
  currentPosition: string = ""
): MatchResult {
  const reqSkills = parseRequiredSkills(job.requiredSkills);

  const titleMatchScore = getTitleScore(job.title, currentPosition);

  const cleanUserSkills = userSkills.map(s =>
    String(s).toLowerCase().replace(/[^a-z0-9ก-๙]/g, '')
  ).filter(s => s.length > 0);

  const matchedSkills: string[] = [];
  const missedSkills: string[] = [];

  for (const skill of reqSkills) {
    const cleanReq = String(skill).toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
    const isMatched = cleanUserSkills.some(cus =>
      cus === cleanReq || (cleanReq.length > 3 && cus.includes(cleanReq)) || (cus.length > 3 && cleanReq.includes(cus))
    );

    if (isMatched) matchedSkills.push(skill);
    else missedSkills.push(skill);
  }
  const hardSkillRaw = reqSkills.length > 0 ? (matchedSkills.length / reqSkills.length) * 100 : 0;

  const reqExp = job.qualificationExperience || 0;
  let expScoreRaw = 0;

  if (titleMatchScore === 0) {
    expScoreRaw = 0;
  }
  else {
    if (reqExp === 0) {
      expScoreRaw = 100;
    } else {
      const expWeight = titleMatchScore >= 80 ? 1.0 : 0.5;
      expScoreRaw = Math.min(((expYears * expWeight) / reqExp) * 100, 100);
    }
  }

  const totalScore = Math.round(
    (titleMatchScore * 0.2) +
    (hardSkillRaw * 0.5) +
    (expScoreRaw * 0.3)
  );

  const salary = Number(expectedSalary) || 0;
  const salaryMax = job.salaryMax ? Number(job.salaryMax) : 0;
  const salaryWarning = !!(salary > 0 && salaryMax > 0 && salary > salaryMax * 1.2);

  return {
    job,
    totalScore,
    titleScore: Math.round(titleMatchScore),
    hardSkillScore: Math.round(hardSkillRaw),
    expScore: Math.round(expScoreRaw),
    matchedSkills,
    missedSkills,
    salaryWarning,
  };
}

function getScoreColor(score: number) {
  if (score >= 80) return { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
  if (score >= 60) return { ring: 'ring-blue-400', bg: 'bg-blue-50', text: 'text-blue-600', bar: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
  if (score >= 40) return { ring: 'ring-amber-400', bg: 'bg-amber-50', text: 'text-amber-600', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' };
  return { ring: 'ring-slate-300', bg: 'bg-slate-50', text: 'text-slate-500', bar: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' };
}

function getScoreLabel(score: number, t: any) {
  if (score >= 80) return t('score_high');
  if (score >= 60) return t('score_medium');
  if (score >= 40) return t('score_fair');
  return t('score_low');
}

function formatSalary(num?: number | null): string {
  if (!num) return '';
  return num.toLocaleString('th-TH');
}

export default function AIJobMatcher({ works, certs, languages, resume }: Props) {
  const router = useRouter();
  const expYears = calcExpYears(works);
  const defaultSkills = extractInitialSkills(works, certs, languages);
  const t = useTranslations('AIjobmatch');

  const [skills, setSkills] = useState<string[]>(defaultSkills);
  const [skillInput, setSkillInput] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [expYearsOverride, setExpYearsOverride] = useState<number | null>(null);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [parseSuccess, setParseSuccess] = useState('');
  const [error, setError] = useState('');

  const effectiveExpYears = expYearsOverride !== null ? expYearsOverride : expYears;

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills([...skills, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (s: string) => setSkills(skills.filter((sk) => sk !== s));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const applyParsedResume = (parsed: ParsedResume) => {
    if (parsed.skills && parsed.skills.length > 0) {
      setSkills((prevSkills) => {
        // 1. ฟังก์ชันช่วยทำความสะอาดคำ (ตัวพิมพ์เล็ก และตัดช่องว่าง)
        const normalize = (s: string) => s.toLowerCase().trim();

        // 2. สร้างรายการคำที่มีอยู่แล้วในรูปแบบที่ Normalize แล้ว
        const existingNormalized = new Set(prevSkills.map(normalize));

        // 3. กรองคำใหม่จาก AI: เอาเฉพาะคำที่ "ไม่เคยมีอยู่" หลังจากการ Normalize
        const newUniqueSkills = parsed.skills!.filter(
          (skill) => !existingNormalized.has(normalize(skill))
        );

        // 4. รวมของเดิมกับของใหม่ (ที่กรองแล้ว) เข้าด้วยกัน
        return [...prevSkills, ...newUniqueSkills];
      });
    }

    // ส่วนเงินเดือน: ถ้า AI วิเคราะห์เจอ และของเดิมยังว่างอยู่ หรืออยากให้ AI อัปเดตก็ปล่อยไว้
    if (parsed.expectedSalary && parsed.expectedSalary > 0) {
      setExpectedSalary(String(parsed.expectedSalary));
    }

    // ส่วนประสบการณ์: ให้ยึดตามที่ AI วิเคราะห์จาก Resume ล่าสุด
    if (parsed.experienceYears != null && parsed.experienceYears > 0) {
      setExpYearsOverride(parsed.experienceYears);
    }

    // แสดงข้อความแจ้งเตือนผลการวิเคราะห์
    const position = parsed.currentPosition ? ` · ${t('label_position')}: ${parsed.currentPosition}` : '';
    const expStr = parsed.experienceYears ? ` · ${t('label_experience')}: ${parsed.experienceYears} ${t('label_years')}` : '';

    setParseSuccess(
      t('parse_success_msg', {
        skillCount: parsed.skills?.length ?? 0,
        position: position,
        experience: expStr
      })
    );
  };

  const handleAnalyzeStoredResume = async () => {
    if (!resume?.id) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setParsingResume(true);
    setError('');
    setParseSuccess('');
    try {
      const res = await fetch(`${API_URL}/resumes/${resume.id}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'วิเคราะห์เรซูเม่ไม่สำเร็จ');
      }
      const parsed: ParsedResume = await res.json();
      applyParsedResume(parsed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'วิเคราะห์เรซูเม่ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setParsingResume(false);
    }
  };

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('กรุณาอัพโหลดไฟล์ PDF เท่านั้น');
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    setParsingResume(true);
    setError('');
    setParseSuccess('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_URL}/resumes/parse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'วิเคราะห์เรซูเม่ไม่สำเร็จ');
      }
      const parsed: ParsedResume = await res.json();
      applyParsedResume(parsed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'วิเคราะห์เรซูเม่ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setParsingResume(false);
      e.target.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (skills.length === 0) {
      setError(t('error_add_skill'));
      return;
    }
    setError('');
    setAnalyzing(true);
    setResults(null);

    try {
      const res = await fetch(`${API_URL}/jobs?limit=100`);
      if (!res.ok) throw new Error(t('error_fetch_jobs'));
      const data = await res.json();
      const jobs: JobResult[] = Array.isArray(data.data) ? data.data : [];

      const salary = parseInt(expectedSalary.replace(/,/g, '')) || 0;
      const currentPos = works.find(w => w.isCurrent)?.position || works[0]?.position || "";
      const matched = jobs
        .map((job) => computeMatch(job, skills, effectiveExpYears, salary, currentPos))
        .filter((r) => r.totalScore >= 40)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 15);

      setResults(matched);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('error_generic'));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mt-6 bg-white rounded-4xl p-6 lg:p-8 shadow-sm border border-slate-100/50 drop-shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#020263] to-[#00003D] flex items-center justify-center shrink-0 shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            AI Job Matcher
            <span className="text-[10px] font-bold bg-linear-to-r from-violet-500 to-indigo-500 text-white px-2 py-0.5 rounded-full">
              BETA
            </span>
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            {t('ai_matcher_description')}
          </p>
        </div>
      </div>

      {/* Resume Analysis Panel */}
      <div className="mb-6 p-4 rounded-3xl border-2 border-dashed border-violet-200 bg-red-500/10">
        <p className="text-[12px] font-bold text-[#020263] mb-3 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5" />
          {t('ai_analysis_title')}
        </p>
        <div className="flex flex-wrap gap-2">
          {resume?.fileUrl && (
            <button
              onClick={handleAnalyzeStoredResume}
              disabled={parsingResume}
              className="inline-flex items-center gap-2 bg-[#020263] hover:bg-[#00003D] disabled:bg-[#020263]/50 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              {parsingResume ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {parsingResume ? t('analyzing') : t('analyze_stored')}
            </button>
          )}
          <label className="inline-flex items-center gap-2 bg-white border border-violet-200 hover:border-violet-400 text-violet-700 text-[12px] font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
            {parsingResume ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {t('upload_pdf_analyze')}
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleResumeFileUpload}
              disabled={parsingResume}
            />
          </label>
        </div>
        {parseSuccess && (
          <div className="mt-3 flex items-center gap-2 text-emerald-700 text-[12px] font-semibold bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            {parseSuccess}
          </div>
        )}
        {!resume?.fileUrl && (
          <p className="text-[11px] text-violet-400 mt-2">
            {t('no_resume_hint')}
          </p>
        )}
      </div>

      {/* Rules Info */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2.5 bg-sky-50 rounded-2xl px-3 py-3 border border-sky-100">
          <Target className="w-4 h-4 text-sky-600 shrink-0" />
          <p className="text-[11px] lg:text-[12px] text-sky-700 font-semibold leading-tight">
            ตำแหน่งงานคิด <span className="text-sky-900 font-bold block sm:inline">20%</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-red-50 rounded-2xl px-3 py-3 border border-red-100">
          <Wand2 className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[11px] lg:text-[12px] text-red-700 font-semibold leading-tight">
            {t('rule_hard_skills')} <span className="text-red-900 font-bold block sm:inline">50%</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-blue-50 rounded-2xl px-3 py-3 border border-blue-100">
          <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-[11px] lg:text-[12px] text-blue-700 font-semibold leading-tight">
            {t('rule_experience_weight')} <span className="text-blue-900 font-bold block sm:inline">30%</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 bg-amber-50 rounded-2xl px-3 py-3 border border-amber-100">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[11px] lg:text-[12px] text-amber-700 font-semibold leading-tight">
            {t('rule_your_experience')}
            <span className="text-amber-900 font-bold block uppercase mt-0.5">
              {effectiveExpYears.toFixed(1)} {t('unit_years')}
            </span>
          </p>
        </div>
      </div>

      {/* Input Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Skills Input */}
        <div className="lg:col-span-2">
          <label className="block text-[13px] font-bold text-slate-700 mb-2">
            {t('input_skills_label')}
          </label>
          <div className="min-h-[80px] border border-slate-200 rounded-2xl p-3 bg-[#fafbff] flex flex-wrap gap-2 mb-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[12px] font-semibold px-3 py-1.5 rounded-full"
              >
                {s}
                <button
                  onClick={() => removeSkill(s)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {skills.length === 0 && (
              <span className="text-slate-400 text-[13px] self-center">
                ยังไม่มีทักษะ — กรอกด้านล่างแล้วกด Enter
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="เช่น React, Python, Photoshop..."
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
            />
            <button
              onClick={addSkill}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              เพิ่ม
            </button>
          </div>
        </div>

        {/* Expected Salary + Analyze */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-bold text-slate-700 mb-2">
              {t('salary_label')}
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="เช่น 35000"
                min="0"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              {t('salary_warning_high')}
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || skills.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-red-600 to-red-600 hover:from-red-700 hover:to-red-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold text-[14px] py-3 rounded-2xl transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('analyzing')}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                วิเคราะห์งานที่เหมาะสม
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[13px] font-medium px-4 py-3 rounded-2xl">
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {results !== null && (
        <div>
          <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-[15px]">
                ผลการวิเคราะห์ — พบ {results.length} งานที่เหมาะสม
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">เรียงตามคะแนนสูงสุด</p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">ยังไม่มีประกาศงานในขณะนี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((r, idx) => {
                const colors = getScoreColor(r.totalScore);
                const reqSkills = parseRequiredSkills(r.job.requiredSkills);

                // 🚩 ตรวจสอบเงื่อนไขสำหรับแต่ละอันดับ
                const isRank1 = idx === 0;
                const isRank2 = idx === 1;
                const isRank3 = idx === 2;

                return (
                  <div
                    key={r.job.id}
                    className={`relative rounded-3xl border p-5 transition-all hover:shadow-md ${isRank1
                      ? 'border-amber-200 bg-linear-to-r from-amber-50/60 to-white'
                      : isRank2
                        ? 'border-slate-300 bg-linear-to-r from-slate-50 to-white'
                        : isRank3
                          ? 'border-orange-200 bg-linear-to-r from-orange-50/40 to-white'
                          : 'border-slate-100 bg-white'
                      }`}
                  >
                    {/* 🚩 แสดงแท็กอันดับตามลำดับ */}
                    {isRank1 && (
                      <div className="absolute -top-2.5 left-5">
                        <span className="inline-flex items-center gap-1 bg-linear-to-r from-amber-400 to-orange-400 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          <Trophy className="w-2.5 h-2.5" />
                          อันดับที่ 1
                        </span>
                      </div>
                    )}
                    {isRank2 && (
                      <div className="absolute -top-2.5 left-5">
                        <span className="inline-flex items-center gap-1 bg-linear-to-r from-slate-400 to-slate-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          <Trophy className="w-2.5 h-2.5" />
                          อันดับที่ 2
                        </span>
                      </div>
                    )}
                    {isRank3 && (
                      <div className="absolute -top-2.5 left-5">
                        <span className="inline-flex items-center gap-1 bg-linear-to-r from-amber-600 to-amber-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          <Trophy className="w-2.5 h-2.5" />
                          อันดับที่ 3
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="shrink-0 flex flex-col items-center justify-center">
                        <div
                          className={`w-20 h-20 rounded-full ring-4 ${colors.ring} ${colors.bg} flex flex-col items-center justify-center`}
                        >
                          <span className={`text-2xl font-black ${colors.text}`}>
                            {r.totalScore}
                          </span>
                          <span className={`text-[9px] font-bold ${colors.text} opacity-80`}>
                            คะแนน
                          </span>
                        </div>
                        <span
                          className={`text-[11px] font-bold mt-1.5 px-2 py-0.5 rounded-full ${colors.badge}`}
                        >
                          {getScoreLabel(r.totalScore, t)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-[15px] leading-snug">
                              {r.job.title}
                            </h4>
                            <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              {r.job.company?.logoUrl && (
                                <img
                                  src={r.job.company.logoUrl}
                                  alt=""
                                  className="w-4 h-4 rounded object-contain"
                                />
                              )}
                              {r.job.company?.name}
                              {r.job.locationProvince && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <MapPin className="w-3 h-3" />
                                  {r.job.locationProvince}
                                </>
                              )}
                            </p>
                          </div>

                          {r.salaryWarning && (
                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {t('expected_salary_high')}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full">
                            {JOB_TYPE_LABEL[r.job.jobType] || r.job.jobType}
                          </span>
                          <span className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-full">
                            {WORK_MODEL_LABEL[r.job.workModel] || r.job.workModel}
                          </span>
                          {(r.job.salaryMin || r.job.salaryMax) && r.job.salaryVisible !== false && (
                            <span className="text-[11px] bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                              {r.job.salaryMin && r.job.salaryMax
                                ? `฿${formatSalary(Number(r.job.salaryMin))} – ${formatSalary(Number(r.job.salaryMax))}`
                                : r.job.salaryMin
                                  ? `฿${formatSalary(Number(r.job.salaryMin))}+`
                                  : `ถึง ฿${formatSalary(Number(r.job.salaryMax))}`}
                            </span>
                          )}
                          {r.job.qualificationExperience != null && (
                            <span className="text-[11px] bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full">
                              ประสบการณ์ {r.job.qualificationExperience} ปี
                            </span>
                          )}
                        </div>

                        <div className="mb-6">
                          <div className="flex justify-between items-end mb-2">
                            <div>
                              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                                AI Scoring Breakdown
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Weighted: Title 20% | Skills 50% | Exp 30%
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-black text-indigo-700">
                                {r.totalScore}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 ml-1">
                                / 100
                              </span>
                            </div>
                          </div>

                          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/50">
                            <div
                              className="h-full bg-sky-400 transition-all duration-700 ease-out border-r border-white/30"
                              style={{ width: `${r.titleScore * 0.2}%` }}
                            />
                            <div
                              className="h-full bg-red-500 transition-all duration-700 ease-out border-r border-white/30"
                              style={{ width: `${r.hardSkillScore * 0.5}%` }}
                            />
                            <div
                              className="h-full bg-blue-600 transition-all duration-700 ease-out"
                              style={{ width: `${r.expScore * 0.3}%` }}
                            />
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
                              <span className="text-[11px] font-medium text-slate-600">
                                ตำแหน่ง ({Math.round(r.titleScore * 0.2)}/20)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                              <span className="text-[11px] font-medium text-slate-600">
                                ทักษะ ({Math.round(r.hardSkillScore * 0.5)}/50)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                              <span className="text-[11px] font-medium text-slate-600">
                                ประสบการณ์ ({Math.round(r.expScore * 0.3)}/30)
                              </span>
                            </div>
                          </div>
                        </div>

                        {reqSkills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.matchedSkills.map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-100"
                              >
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                {sk}
                              </span>
                            ))}
                            {r.missedSkills.slice(0, 4).map((sk) => (
                              <span
                                key={sk}
                                className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-500 font-medium px-2 py-0.5 rounded-full border border-red-100"
                              >
                                <XCircle className="w-2.5 h-2.5" />
                                {sk}
                              </span>
                            ))}
                            {r.missedSkills.length > 4 && (
                              <span className="text-[11px] text-slate-400 font-medium px-2 py-0.5">
                                +{r.missedSkills.length - 4} ทักษะที่ขาด
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => router.push(`/jobs/${r.job.slug}`)}
                          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                        >
                          ดูงาน
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
