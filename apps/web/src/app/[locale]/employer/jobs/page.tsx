'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  Plus,
  Eye,
  Send,
  XCircle,
  PenSquare,
  Users,
  Heart,
  RefreshCcw,
  ChevronDown,
  MoreVertical,
  Rocket,
  Search,
  History,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Job {
  id: string;
  title: string;
  slug: string;
  status: string;
  jobType: string;
  workModel: string;
  locationProvince: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryVisible: boolean;
  positions?: number;
  requiredSkills: string[];
  viewCount: number;
  createdAt: string;
  company: { name: string; logoUrl?: string };
  _count?: { applications: number; savedBy: number };
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'ร่าง', color: 'bg-slate-100 text-slate-600' },
  PENDING: { label: 'รออนุมัติ', color: 'bg-orange-100 text-orange-700' },
  ACTIVE: { label: 'เผยแพร่', color: 'bg-[#10B981]/10 text-[#16A34A]' },
  CLOSED: { label: 'ปิดรับสมัคร', color: 'bg-gray-100 text-gray-500' },
};

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: 'งานประจำ',
  PART_TIME: 'งานพาร์ทไทม์',
  CONTRACT: 'สัญญาจ้าง',
  INTERNSHIP: 'ฝึกงาน',
  FREELANCE: 'ฟรีแลนซ์',
};

const TABS = [
  { key: 'all', label: 'ทั้งหมด', jobType: null },
  { key: 'INTERNSHIP', label: 'ฝึกงาน', jobType: 'INTERNSHIP' },
  { key: 'FULL_TIME', label: 'งานประจำ', jobType: 'FULL_TIME' },
  { key: 'PART_TIME', label: 'งานพาร์ทไทม์', jobType: 'PART_TIME' },
  { key: 'CONTRACT', label: 'สัญญาจ้าง', jobType: 'CONTRACT' },
  { key: 'CLOSED', label: 'ปิดรับสมัครแล้ว', jobType: 'CLOSED' },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/* ---------- Mock Bar Chart ---------- */
const BAR_HEIGHTS = [40, 55, 35, 70, 50, 80, 65, 95, 85, 60, 75, 90, 55, 70, 45];

function BarChart() {
  return (
    <div className="mt-4">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 justify-end text-[11px] text-gray-500 font-medium px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#020263]"></div>
          ช่วงโปรโมทโพสต์
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#A5CBE5]"></div>
          ปกติ
        </div>
      </div>
      <div className="flex items-end gap-[6px] h-40 mt-6 relative">
        {BAR_HEIGHTS.map((h, i) => {
          const isMid = i >= 5 && i <= 10;
          const bgColor = isMid ? 'bg-[#020263]' : 'bg-[#A5CBE5]';
          return (
            <div
              key={i}
              className="flex-1 relative group h-full flex flex-col justify-end"
            >
              <div className="absolute inset-x-0 bottom-0 pointer-events-none flex justify-center w-full" style={{ bottom: `calc(${h}% + 4px)` }}>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-1.5 rounded whitespace-nowrap z-10">
                  {h * 10} Views
                </span>
              </div>
              <div
                className={`w-full rounded-t-md ${bgColor} transition-all hover:opacity-85 cursor-pointer`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-gray-400 px-1">
        <span>10 FEB</span>
        <span>17 FEB</span>
        <span>24 FEB</span>
      </div>
    </div>
  );
}

/* ---------- Engagement Card ---------- */
function EngagementCard({
  views,
  likes,
  applicants,
}: {
  views: number;
  likes: number;
  applicants: number;
}) {
  const stats = [
    {
      icon: <Eye className="w-4 h-4 text-[#020263]" />,
      bgIcon: 'bg-[#A5CBE5]/30',
      label: 'Post Reach (ยอดเข้าชม)',
      value: views.toLocaleString(),
    },
    {
      icon: <Heart className="w-4 h-4 text-[#E00016]" />,
      bgIcon: 'bg-[#E00016]/10',
      label: 'ผู้ที่สนใจ (บันทึกงาน)',
      value: likes.toLocaleString(),
    },
    {
      icon: <Users className="w-4 h-4 text-[#16A34A]" />,
      bgIcon: 'bg-[#10B981]/10',
      label: 'ผู้สมัครตำแหน่งนี้',
      value: applicants.toLocaleString(),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-bold text-gray-800 text-sm mb-4">ภาพรวมการมีส่วนร่วม</h3>
      <div className="space-y-4">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full ${s.bgIcon} flex items-center justify-center shrink-0`}
            >
              {s.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 leading-none">{s.label}</p>
              <p className="text-lg font-bold text-gray-800 leading-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Premium Upgrade Card ---------- */
function PremiumCard() {
  return (
    <div className="relative bg-[#020263] rounded-xl p-6 overflow-hidden">
      {/* Rocket watermark */}
      <Rocket className="absolute -bottom-3 -right-3 w-24 h-24 text-[#00003D] opacity-40 rotate-12 pointer-events-none" />
      <h3 className="font-bold text-white text-sm mb-1.5 relative z-10">อัปเกรดเป็นพรีเมียม</h3>
      <p className="text-[#A5CBE5] text-xs leading-relaxed relative z-10">
        รับการแสดงผลที่มากขึ้น 3 เท่า และเครื่องมือวิเคราะห์ขั้นสูง
      </p>
      <button className="relative z-10 mt-4 w-full py-2.5 bg-white text-[#020263] font-semibold text-sm rounded-full hover:bg-gray-50 transition-colors">
        ดูแพ็กเกจทั้งหมด
      </button>
    </div>
  );
}

/* ---------- Applicant Avatars (mock) ---------- */
function ApplicantAvatars({ count }: { count: number }) {
  const colors = ['bg-[#020263]', 'bg-[#00003D]', 'bg-[#A5CBE5]'];
  return (
    <div className="flex items-center">
      {colors.map((c, i) => (
        <div
          key={i}
          className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-[10px] font-bold ${i > 0 ? '-ml-2' : ''}`}
        >
          {String.fromCharCode(65 + i)}
        </div>
      ))}
      {count > 3 && (
        <div className="w-8 h-8 rounded-full bg-[#020263] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold -ml-2">
          +{count - 3}
        </div>
      )}
    </div>
  );
}

/* ========== MAIN PAGE ========== */
export default function EmployerJobsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJobIndex, setSelectedJobIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // สำหรับกรองข้อมูลจริง (ทำงานเมื่อกด Enter/เลือก)
  const [inputText, setInputText] = useState(''); // สำหรับเก็บค่าระหว่างที่ผู้ใช้กำลังพิมพ์
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest'); // <-- Added Sort State
  // --- เพิ่ม State สำหรับ Search History ---
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // โหลดประวัติจาก Local Storage เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const savedHistory = localStorage.getItem('jobSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }
  }, []);

  // --- สร้างรายการคำแนะนำ (Suggestions) โดยรวบคำซ้ำพิมพ์เล็ก/พิมพ์ใหญ่ ---
    const getSuggestions = () => {
      const query = inputText.toLowerCase().trim();
      if (!query) return [];

      const uniqueMap = new Map<string, { text: string; type: 'history' | 'job' }>();

      // 1. ประวัติที่ตรงกัน (เอาอันที่พิมพ์มาแสดง)
      searchHistory.forEach((h) => {
        if (h.toLowerCase().includes(query)) {
          uniqueMap.set(h.toLowerCase(), { text: h, type: 'history' });
        }
      });

      // 2. ชื่อตำแหน่งงานในระบบ (ไม่ให้ซ้ำกับประวัติ และรวบคำที่สะกดเหมือนกันแต่พิมพ์เล็กใหญ่ต่างกัน)
      jobs.forEach((j) => {
        const lowerTitle = j.title.toLowerCase();
        if (lowerTitle.includes(query) && !uniqueMap.has(lowerTitle)) {
          uniqueMap.set(lowerTitle, { text: j.title, type: 'job' });
        }
      });

      return Array.from(uniqueMap.values()).slice(0, 6); // แสดงสูงสุด 6 รายการ
    };

    const suggestions = getSuggestions();

    // ฟังก์ชันสั่งค้นหาจริง และบันทึกประวัติ
    const executeSearch = (term: string) => {
      const trimmedTerm = term.trim();
      setSearchQuery(trimmedTerm); // สั่งให้ระบบกรองข้อมูล
      setInputText(trimmedTerm); // เปลี่ยนคำในช่องค้นหาให้ตรงกับสิ่งที่เลือก
      setSelectedJobIndex(0);
      setShowSuggestions(false);

      if (!trimmedTerm) return;

      // ลบคำซ้ำเดิมออก (ไม่สนใจพิมพ์เล็กพิมพ์ใหญ่) แล้วเอาคำที่หาล่าสุดไปไว้บนสุด
      const newHistory = [
        trimmedTerm,
        ...searchHistory.filter((h) => h.toLowerCase() !== trimmedTerm.toLowerCase()),
      ];
      setSearchHistory(newHistory);
      localStorage.setItem('jobSearchHistory', JSON.stringify(newHistory));
    };

    const handleSuggestionClick = (term: string) => {
      executeSearch(term);
    };

    // ฟังก์ชันลบประวัติรายตัว
    const removeHistory = (termToRemove: string, e: React.MouseEvent) => {
      e.stopPropagation(); // ป้องกันไม่ให้ทะลุไปกดคลิกที่ตัวเลือก
      const newHistory = searchHistory.filter((term) => term !== termToRemove);
      setSearchHistory(newHistory);
      localStorage.setItem('jobSearchHistory', JSON.stringify(newHistory));
    };


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

  const fetchJobs = () => {
    if (!user || user.role !== 'EMPLOYER') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    fetch(`${API_URL}/companies/mine/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const publish = async (id: string) => {
    setActionLoading(id);
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`${API_URL}/jobs/${id}/publish`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'ไม่สามารถเผยแพร่งานได้');
      }

      setMessage('เผยแพร่ประกาศงานเรียบร้อยแล้ว ✓');
      fetchJobs();
    } catch (error) {
      setMessage(getErrorMessage(error, 'เกิดข้อผิดพลาดในการเผยแพร่งาน'));
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const close = async (id: string) => {
    if (!confirm('ต้องการปิดรับสมัครงานนี้ใช่ไหม?')) return;
    setActionLoading(id);
    const token = localStorage.getItem('accessToken');
    await fetch(`${API_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessage('ปิดรับสมัครและหยุดเผยแพร่เรียบร้อยแล้ว');
    fetchJobs();
    setActionLoading(null);
    setTimeout(() => setMessage(''), 3000);
  };

/* Filtered and Sorted jobs */
  const filteredJobs = jobs
    .filter((j) => {
      // --- 1. เช็คเงื่อนไขตาม Tab ---
      if (activeTab === 'CLOSED') {
        if (j.status !== 'CLOSED') return false; // ถ้าอยู่แท็บปิดรับสมัคร แต่งานยังไม่ปิด ให้ซ่อน
      } else {
        if (j.status === 'CLOSED') return false; // ถ้าอยู่แท็บอื่น แต่งานปิดแล้ว ให้ซ่อน
        if (activeTab !== 'all' && j.jobType !== activeTab) return false; // กรองตามประเภทงาน
      }

      // --- 2. เช็คเงื่อนไขตามคำค้นหา (Search) ---
      if (searchQuery) {
        const keyword = searchQuery.toLowerCase().trim();
        if (!j.title.toLowerCase().includes(keyword)) {
          return false; // ถ้าชื่อตำแหน่งงาน ไม่มีคำที่ค้นหา ให้ซ่อน
        }
      }

      return true; // ถ้าผ่านทุกเงื่อนไข ให้แสดงผล
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.viewCount - a.viewCount;
      if (sortBy === 'applicants') return (b._count?.applications || 0) - (a._count?.applications || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // 'newest' default
    });

  const selectedJob = filteredJobs[selectedJobIndex] || filteredJobs[0];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[#020263] tracking-tight">จัดการประกาศงาน</h1>
            <p className="text-sm text-gray-500 mt-1">
              จัดการประกาศรับสมัครงานและติดตามสถานะผู้สมัครของคุณ
            </p>
          </div>
          <button
            onClick={() => router.push('/employer/jobs/create')}
            className="flex items-center gap-2 bg-[#A80010] hover:bg-[#E00016] text-white font-semibold drop-shadow-lg px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            ลงประกาศงานใหม่
          </button>
        </div>

        {/* ─── Tabs ─── */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="flex gap-6 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedJobIndex(0);
                }}
                className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.key
                  ? 'border-[#020263] text-[#020263] font-bold'
                  : 'border-transparent text-gray-400 hover:text-[#020263]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Toast */}
        {message && (
          <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
            {message}
          </div>
        )}

{/* ─── Empty State แบบโกลบอล (โชว์เมื่อผู้ใช้ยังไม่เคยลงประกาศงานเลยสักงานเดียว) ─── */}
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <div className="text-gray-500 font-medium mb-2">ยังไม่มีประกาศงาน</div>
            <p className="text-gray-400 text-sm mb-6">เริ่มสร้างประกาศงานแรกของคุณได้เลย</p>
            <button
              onClick={() => router.push('/employer/jobs/create')}
              className="px-6 py-3 bg-[#020263] text-white rounded-xl font-semibold text-sm hover:bg-[#00003D] transition-colors"
            >
              สร้างประกาศงาน
            </button>
          </div>
        ) : (
          /* ─── Grid Layout ─── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ───── Card 1: Job Detail & Search (2 cols) ───── */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              
              {/* --- กล่องค้นหา (แยกออกมาเป็นกล่องด้านบนสุด) --- */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-5 pt-4 pb-2">
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        setShowSuggestions(true);
                        if (e.target.value === '') {
                           setSearchQuery('');
                           setSelectedJobIndex(0);
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          executeSearch(inputText);
                        }
                      }}
                      placeholder="ค้นหาชื่อตำแหน่งงาน... (กด Enter เพื่อค้นหา)"
                      className={`w-full pl-9 pr-10 py-2 text-sm border focus:outline-none transition-all
                        ${
                          inputText 
                            ? 'bg-[#020263] text-white border-[#00003D] placeholder:text-gray-400' 
                            : 'bg-white text-gray-800 border-gray-200 focus:border-[#020263] focus:ring-1 focus:ring-[#020263]'
                        }
                        ${showSuggestions && suggestions.length > 0 ? 'rounded-t-lg border-b-0' : 'rounded-lg'}
                      `}
                    />

                    {inputText && (
                      <button
                        onClick={() => {
                          setInputText('');
                          setSearchQuery('');
                          setSelectedJobIndex(0);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Dropdown Autocomplete */}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg z-50 overflow-hidden">
                        <ul>
                          {suggestions.map((item, index) => (
                            <li 
                              key={index}
                              onMouseDown={(e) => {
                                e.preventDefault(); 
                                handleSuggestionClick(item.text);
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors text-sm text-gray-700"
                            >
                              {item.type === 'history' ? (
                                <History className="w-4 h-4 text-gray-400 shrink-0" />
                              ) : (
                                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                              )}
                              <span className="truncate">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  {/* Sort Dropdown */}
                  <div className="relative shrink-0">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setSelectedJobIndex(0);
                      }}
                      className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 text-gray-600 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#020263] min-w-[130px]"
                    >
                      <option value="newest">เพิ่มล่าสุด</option>
                      <option value="applicants">มีผู้สมัครเยอะสุด</option>
                      <option value="popular">ยอดเข้าชมเยอะสุด</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                
                {/* Search History Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 items-center min-h-[36px] scrollbar-hide">
                  {searchHistory.length > 0 ? (
                    searchHistory.map((term, idx) => (
                      <div
                        key={idx}
                        onClick={() => executeSearch(term)}
                        className="flex items-center gap-1.5 whitespace-nowrap text-xs px-3 py-1.5 rounded-full font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-[#020263] cursor-pointer border border-transparent hover:border-gray-300 shrink-0 group"
                      >
                        <span>{term}</span>
                        <button
                          onClick={(e) => removeHistory(term, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full focus:outline-none opacity-60 group-hover:opacity-100"
                          title="ลบประวัติ"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 py-1">พิมพ์คำค้นหาแล้วกด Enter เพื่อบันทึกประวัติ</span>
                  )}
                </div>
              </div>

              {/* --- แสดงรายการประกาศงานแบบ List (วนลูป) --- */}
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-[#020263] font-bold text-base">ไม่พบตำแหน่งงานที่ตรงกับ "{searchQuery}"</p>
                  <p className="text-gray-500 text-sm mt-1">ลองเปลี่ยนคำค้นหา หรือตรวจสอบการสะกดอีกครั้ง</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredJobs.map((job, index) => {
                    const isSelected = index === selectedJobIndex;
                    
                    return (
                      <div 
                        key={job.id}
                        onClick={() => setSelectedJobIndex(index)}
                        className={`bg-white rounded-xl border transition-all cursor-pointer p-5 
                          ${isSelected 
                            ? 'border-[#020263] ring-1 ring-[#020263]/10 shadow-md' 
                            : 'border-gray-100 hover:border-gray-300 shadow-sm hover:shadow-md'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row gap-5">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-gray-100 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            {job.company?.logoUrl ? (
                              <img
                                src={job.company.logoUrl}
                                alt={job.company.name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#020263] text-white flex items-center justify-center text-xl font-bold">
                                {job.company?.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="font-bold text-[#020263] text-base leading-snug group-hover:text-[#E00016] transition-colors">
                                {job.title}
                              </h2>
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation(); // ไม่ให้ทะลุไปกดเลือกการ์ด
                                    setOpenDropdownId(openDropdownId === job.id ? null : job.id);
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                                {openDropdownId === job.id && (
                                  <>
                                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}></div>
                                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenDropdownId(null);
                                          close(job.id);
                                        }}
                                        disabled={actionLoading === job.id}
                                        className="w-full text-left px-4 py-2.5 text-sm text-[#E00016] hover:bg-[#E00016]/10 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
                                      >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                        ปิดรับสมัคร (เลิกเผยแพร่)
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${STATUS_LABEL[job.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                                {STATUS_LABEL[job.status]?.label || job.status}
                              </span>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                                {JOB_TYPE_LABEL[job.jobType] || job.jobType}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
                                </svg>
                                <span>
                                  เงินเดือน: {job.salaryVisible && job.salaryMin ? `${job.salaryMin.toLocaleString()}${job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : '+'} บาท` : 'ตามตกลง/ความสามารถ'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                                <span>จำนวนที่รับ: {job.positions || 1} อัตรา</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>รีโพสต์ล่าสุด: {formatDate(job.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                          <ApplicantAvatars count={job._count?.applications || 0} />
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/employer/jobs/${job.id}/edit`); }}
                              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#E00016] hover:bg-[#A80010] border border-gray-200 rounded-lg transition-colors"
                            >
                              <PenSquare className="w-3.5 h-3.5" />
                              แก้ไข
                            </button>
                            {(job.status === 'DRAFT' || job.status === 'CLOSED') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); publish(job.id); }}
                                disabled={actionLoading === job.id}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#020263] rounded-lg hover:bg-[#00003D] transition-colors disabled:opacity-60"
                              >
                                {job.status === 'CLOSED' ? <RefreshCcw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                                {actionLoading === job.id ? '...' : (job.status === 'CLOSED' ? 'รีโพสต์งาน' : 'เผยแพร่')}
                              </button>
                            )}
                            {job.status === 'ACTIVE' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); publish(job.id); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                                รีโพสต์งาน(ปิดใช้งาน)
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ───── Card 2: Reach Chart + Summary (1 col) ───── */}
            <div className="lg:col-span-1 space-y-5 sticky top-24 self-start">
              <EngagementCard
                views={selectedJob?.viewCount || 0}
                likes={selectedJob?._count?.savedBy || 0}
                applicants={selectedJob?._count?.applications || 0}
              />
              {/* Reach Bar Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm">สถิติการเข้าถึงงาน</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 max-w-[150px]">{selectedJob?.title}</p>
                  </div>
                  <button className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
                    15 วันล่าสุด
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                </div>
                <BarChart />
              </div>
              <PremiumCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
