'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CandidateDetailModal } from '@/components/CandidateDetailModal';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { bookmarkService } from '@/services/bookmark';

import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  Banknote,
  Clock3,
  Briefcase,
  RefreshCw,
  Languages,
  //FileText,
  ArrowRight,
  Heart,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type CandidateCard = {
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
  englishLevelScore: number;
  candidateType: string;
  categoryName?: string;
  avatarUrl: string | null;
  experience: number | null;
  isBookmarked?: boolean;
};

type Filters = {
  query: string;
  province: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  skills: string;
  educationLevel: string;
  minGpa: string;
  institution: string;
  englishLevel: string;
  experience: string;
  business_type?: string;
};

const initialFilters: Filters = {
  query: '',
  province: '',
  gender: '',
  ageMin: '',
  ageMax: '',
  skills: '',
  educationLevel: '',
  minGpa: '',
  institution: '',
  englishLevel: '',
  experience: '',
  business_type: '',
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'เพิ่งโพสต์';
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function getMatchedSnippet(candidate: CandidateCard, searchQuery: string | null) {
  if (!searchQuery) return null;

  const q = searchQuery.toLowerCase();

  if (candidate.institution?.toLowerCase().includes(q)) return candidate.institution;
  if (candidate.major?.toLowerCase().includes(q)) return candidate.major;
  if (candidate.skills?.some(s => s.toLowerCase().includes(q))) {
    return candidate.skills.find(s => s.toLowerCase().includes(q));
  }
  if (candidate.desiredPosition?.toLowerCase().includes(q)) return candidate.desiredPosition;

  return null;
}

function GenderAvatar({ gender, avatarUrl }: { gender: string, avatarUrl: string | null }) {
  const defaultAvatar = gender === 'male'
    ? '/images/avatar_male.webp'
    : gender === 'female'
      ? '/images/avatar_female.webp'
      : '/images/Proflie_SeekJobDD.webp';
  return (
    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
      <Image
        src={avatarUrl || defaultAvatar}
        alt="Profile"
        fill
        className="object-cover"
      />
    </div>
  );
}

export default function ResumeDirectoryPage() {
  const t = useTranslations('CandidateDirectory');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();


  const handleClearAll = () => {
    setFilters(initialFilters); // ล้าง State ในหน้าจอ
    router.push(pathname); // ล้าง URL (เปลี่ยน path ให้ตรงกับไฟล์นี้ของคุณ)
  };


  const getInitialFilters = () => {
    // ดึงทั้ง category (แบบเดิม) และ categoryId (แบบใหม่ที่ส่งมา)
    const category = searchParams.get('category') || searchParams.get('categoryId') || '';
    return {
      ...initialFilters,
      query: category,
    };
  };

  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>(getInitialFilters());
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);


  //const jobSeekerCtaHref = user?.role === 'JOBSEEKER' ? '/profilefull' : '/login';
  const employerCtaHref = user?.role === 'EMPLOYER' ? '/employer/jobs/create' : '/employer/login';
  //const jobSeekerCtaLabel = user?.role === 'JOBSEEKER' ? t('jobSeekerBox.ctaLoggedIn') : t('jobSeekerBox.ctaGuest');
  const employerCtaLabel = user?.role === 'EMPLOYER' ? t('employerBox.ctaLoggedIn') : t('employerBox.ctaGuest');


  {/*const updateUrlParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value.trim());
      }
    });
    // ผลลัพธ์จะเป็น ?query=abc&province=bangkok...
    router.push(`${pathname}?${params.toString()}`);
  };*/}


  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');
      const queryString = searchParams.toString();
      const res = await fetch(`${API_URL}/users/candidate-directory${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      const data = await res.json();

      setCandidates(data.candidates);

      if (!res.ok) {
        throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลผู้หางานได้');
      }

      const candidatesList = Array.isArray(data) ? data : (data.candidates || []);
      console.log("Check candidate 0 bookmark:", candidatesList[0]?.isBookmarked); // <--- เช็คตรงนี้!
      setCandidates(candidatesList);
    } catch (error: unknown) {
      setError(getErrorMessage(error, 'เกิดข้อผิดพลาด'));
      console.error("Fetch Error:", error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);


  useEffect(() => {
    const filtersFromUrl: Filters = { ...initialFilters };
    searchParams.forEach((value, key) => {
      if (key in filtersFromUrl) {
        (filtersFromUrl as any)[key] = value;
      }
    });

    const categoryFromUrl = searchParams.get('category') || searchParams.get('categoryId');

    if (categoryFromUrl) {
      filtersFromUrl.business_type = categoryFromUrl.trim();
    }

    setFilters(filtersFromUrl);

  }, [searchParams]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    // วนลูปเอาค่าจาก state filters ไปใส่ใน params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && String(value).trim()) {
        params.set(key, String(value).trim());
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const resultText = useMemo(() => `${candidates.length.toLocaleString()}`, [candidates.length]);

  console.log(candidates)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#020263] text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_40%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative z-10">
            <div className="max-w-5xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide">
                <Briefcase className="w-4 h-4" />
                {t('badge')}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{t('title')}</h1>
              <p className="text-sm md:text-base text-blue-100/85 leading-relaxed">
                {t('description')}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                {/*<div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <FileText className="w-4 h-4" />
                    {t('jobSeekerBox.title')}
                  </div>
                  <p className="text-sm text-blue-100/85 leading-relaxed">
                    {t('jobSeekerBox.desc')}
                  </p>
                  <Link
                    href={jobSeekerCtaHref}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#020263] hover:bg-blue-50 transition-colors"
                  >
                    {jobSeekerCtaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div> */}
                <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Briefcase className="w-4 h-4" />
                    {t('employerBox.title')}
                  </div>
                  <p className="text-sm text-blue-100/85 leading-relaxed">
                    {t('employerBox.desc')}
                  </p>
                  <Link
                    href={employerCtaHref}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D] transition-colors"
                  >
                    {employerCtaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
                    placeholder={t('search.placeholder')}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-[#020263] hover:bg-[#11117c] text-white font-semibold transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    {t('search.btnSearch')}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t('search.btnClear')}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Filter className="w-4 h-4 text-indigo-600" />
                {t('filters.title')}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <input
                  value={filters.province}
                  onChange={(e) => setFilters((prev) => ({ ...prev, province: e.target.value }))}
                  placeholder={t('filters.province')}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters((prev) => ({ ...prev, gender: e.target.value }))}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >

                  <option value="">{t('filters.genderAll')}</option>
                  <option value="male">{t('filters.gender.male') || 'ชาย'}</option>
                  <option value="female">{t('filters.gender.female') || 'หญิง'}</option>
                </select>
                <input
                  value={filters.ageMin}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ageMin: e.target.value }))}
                  placeholder={t('filters.ageMin')}
                  type="number"
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={filters.ageMax}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ageMax: e.target.value }))}
                  placeholder={t('filters.ageMax')}
                  type="number"
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={filters.skills}
                  onChange={(e) => setFilters((prev) => ({ ...prev, skills: e.target.value }))}
                  placeholder={t('filters.skills')}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={filters.educationLevel}
                  onChange={(e) => setFilters((prev) => ({ ...prev, educationLevel: e.target.value }))}
                  placeholder={t('filters.education')}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={filters.minGpa}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minGpa: e.target.value }))}
                  placeholder={t('filters.gpa')}
                  type="number"
                  step="0.01"
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  value={filters.institution}
                  onChange={(e) => setFilters((prev) => ({ ...prev, institution: e.target.value }))}
                  placeholder={t('filters.institution')}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <select
                  value={filters.englishLevel}
                  onChange={(e) => setFilters((prev) => ({ ...prev, englishLevel: e.target.value }))}
                  className="h-11 rounded-2xl border border-slate-200 px-4 text-sm text-black bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('filters.englishAll')}</option>
                  <option value="พื้นฐาน">{t('filters.english.basic') || 'พื้นฐาน'}</option>
                  <option value="พอใช้">{t('filters.english.fair') || 'พอใช้'}</option>
                  <option value="ดี">{t('filters.english.good') || 'ดี'}</option>
                  <option value="ดีมาก">{t('filters.english.excellent') || 'ดีมาก'}</option>
                </select>
              </div>
            </div>
          </div>


          <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{t('list.title')}</h2>
              <p className="text-sm text-slate-500 mt-2">{t('list.resultCount')} {resultText} {t('list.list')}</p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[320px] rounded-[2rem] bg-white border border-slate-100 shadow-sm animate-pulse" />
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm px-8 py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{t('list.emptyTitle')}</h3>
              <p className="text-sm text-slate-500">{t('list.emptyDesc')}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {candidates.map((candidate) => {
                const highlight = getMatchedSnippet(candidate, searchParams.get('query'));

                return (
                  <div key={candidate.id} className="h-full">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className="text-left w-full rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 min-h-[320px] flex flex-col relative overflow-hidden"
                    >
                      {highlight && (
                        <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                          <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-xs text-slate-600 truncate">
                            ตรงกับที่คุณหา: <strong className="text-indigo-600 font-bold">{highlight}</strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-4 min-w-0">
                          <GenderAvatar gender={candidate.gender} avatarUrl={candidate.avatarUrl} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              {candidate.candidateType}
                            </div>
                            <div className="text-lg font-extrabold text-slate-900 truncate">
                              {candidate.fullName}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">
                              {candidate.age ? `${candidate.age} ${t('list.ageUnit')}` : t('list.noAge')} · {candidate.gender || t('list.noGender')}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-xs text-slate-400 whitespace-nowrap">{timeAgo(candidate.postedAt)}</div>
                          {user?.role === 'EMPLOYER' && (
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();
                                setCandidates(prev => prev.map(c =>
                                  c.id === candidate.id ? { ...c, isBookmarked: !c.isBookmarked } : c
                                ));
                                try {
                                  await bookmarkService.toggle(candidate.id);
                                } catch (error) {
                                  setCandidates(prev => prev.map(c =>
                                    c.id === candidate.id ? { ...c, isBookmarked: !c.isBookmarked } : c
                                  ));
                                  alert("ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง");
                                }
                              }}
                              className={`p-2 rounded-full border transition-colors cursor-pointer ${candidate.isBookmarked
                                ? "bg-rose-50 border-rose-100 text-rose-500"
                                : "bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                                }`}
                            >
                              <Heart
                                className="w-4 h-4"
                                fill={candidate.isBookmarked ? "currentColor" : "none"}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 text-sm text-slate-700">
                        <div className="font-bold text-[#020263] text-base line-clamp-2">
                          {t('list.lookingFor')} {
                            candidate.desiredPosition && candidate.desiredPosition.length > 2
                              ? candidate.desiredPosition
                              : (searchParams.get('query') || (locale === 'th' ? 'ไม่ระบุ' : 'Not Specified'))
                          }
                        </div>

                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                          <span>{t('list.salary')} {candidate.expectedSalaryText}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" />
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900">
                              {t('list.education')} {candidate.educationLevel}
                            </span>
                            <span className="text-xs text-slate-500 leading-relaxed">
                              {candidate.major} {candidate.institution ? `· ${candidate.institution}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                          <span>{t('list.province')} {candidate.province}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Languages className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                          <span>{t('list.english')} {candidate.englishLevelLabel}</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        {candidate.skills.length > 0 ? (
                          candidate.skills.slice(0, 4).map((skill) => {
                            const isMatch = searchParams.get('query') && skill.toLowerCase().includes(searchParams.get('query')!.toLowerCase());
                            return (
                              <span
                                key={skill}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${isMatch
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                              >
                                {skill}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400">{t('list.noSkills')}</span>
                        )}
                      </div>

                      <div className="mt-auto pt-5 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5" />
                          {t('list.updated')} {timeAgo(candidate.postedAt)}
                        </div>
                        <span className="font-bold text-indigo-600 group-hover:underline">
                          {t('list.viewDetail')}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )
          }
        </section >
      </main >

      <Footer />

      {selectedCandidateId && (
        <CandidateDetailModal candidateId={selectedCandidateId} onClose={() => setSelectedCandidateId(null)}
          isBookmarked={candidates.find(c => c.id === selectedCandidateId)?.isBookmarked}
          onBookmarkToggle={() => {
            setCandidates(prev => prev.map(c =>
              c.id === selectedCandidateId ? { ...c, isBookmarked: !c.isBookmarked } : c
            ));
          }} />
      )
      }
    </div >
  );
}
