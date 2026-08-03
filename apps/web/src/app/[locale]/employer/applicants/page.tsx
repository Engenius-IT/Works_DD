'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import {
  Users,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  Briefcase,
  CalendarDays,
  CalendarPlus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ApplicantDetailModal } from '@/components/ApplicantDetailModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Job {
  id: string;
  title: string;
}

interface Applicant {
  id: string;
  status: string;
  appliedAt: string;
  interviewDate?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  job: {
    id: string;
    title: string;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  PENDING: {
    label: 'สมัครงานแล้ว',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    icon: Clock,
  },
  REVIEWED: {
    label: 'กำลังพิจารณา',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    icon: Eye,
  },
  SHORTLISTED: {
    label: 'เข้ารอบ',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    icon: CheckCircle2,
  },
  INTERVIEW: {
    label: 'นัดสัมภาษณ์',
    color: 'bg-orange-50 text-orange-600 border-orange-100',
    icon: CalendarDays,
  },
  OFFERED: {
    label: 'เสนอเข้าทำงาน',
    color: 'bg-green-50 text-green-600 border-green-100',
    icon: CheckCircle2,
  },
  REJECTED: { label: 'ปฏิเสธ', color: 'bg-red-50 text-red-600 border-red-100', icon: XCircle },
  WITHDRAWN: {
    label: 'ยกเลิกการสมัคร',
    color: 'bg-gray-50 text-gray-500 border-gray-200',
    icon: XCircle,
  },
};

export default function EmployerApplicantsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  // Interview scheduling state
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewApplicantId, setInterviewApplicantId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState<string>('');
  const [interviewTime, setInterviewTime] = useState<string>('09:00');
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(() => new Date());
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0, width: 0 });
  const calendarButtonRef = useRef<HTMLButtonElement>(null);

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

  // Fetch Jobs for filter dropdown
  useEffect(() => {
    if (!user || user.role !== 'EMPLOYER') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    fetch(`${API_URL}/companies/mine/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error('Failed to fetch jobs', err));
  }, [user]);

  // Fetch Applicants
  const fetchApplicants = () => {
    if (!user || user.role !== 'EMPLOYER') return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setLoading(true);
    const url = new URL(`${API_URL}/applications/employer/all`);
    if (selectedJobId !== 'all') {
      url.searchParams.append('jobId', selectedJobId);
    }

    fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setApplicants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch applicants', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchApplicants();
  }, [user, selectedJobId]);

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Update local state
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));

      // Optional: show toast notification here
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  const handleScheduleInterview = async () => {
    if (!interviewApplicantId || !interviewDate || !interviewTime) {
      alert('กรุณาระบุวันที่และเวลาให้ครบถ้วน');
      return;
    }

    try {
      setInterviewLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Build datetime in local timezone (not UTC) to avoid timezone offset issues
      const localDate = new Date(`${interviewDate}T${interviewTime}:00`);
      const dateTimeString = localDate.toISOString();

      const res = await fetch(`${API_URL}/applications/${interviewApplicantId}/interview`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interviewDate: dateTimeString }),
      });

      if (!res.ok) throw new Error('Failed to schedule interview');

      // Update local state - setting status to INTERVIEW and updating interviewDate
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === interviewApplicantId
            ? { ...a, status: 'INTERVIEW', interviewDate: dateTimeString }
            : a,
        ),
      );

      setInterviewModalOpen(false);
      setInterviewApplicantId(null);
      setInterviewDate('');
      setInterviewTime('09:00');

      // Try to reload to get fresh data from DB
      fetchApplicants();
      alert('นัดสัมภาษณ์เรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการนัดสัมภาษณ์');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleCancelInterview = async (applicationId: string) => {
    if (!confirm('ยืนยันการยกเลิกนัดสัมภาษณ์ใช่หรือไม่?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const res = await fetch(`${API_URL}/applications/${applicationId}/cancel-interview`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to cancel interview');

      // Update local state - setting status to SHORTLISTED and removing interviewDate
      setApplicants((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, status: 'SHORTLISTED', interviewDate: undefined }
            : a,
        ),
      );

      // Try to reload to get fresh data from DB
      fetchApplicants();
      alert('ยกเลิกนัดสัมภาษณ์เรียบร้อยแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยกเลิกนัดสัมภาษณ์');
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  // Filter by search query
  const filteredApplicants = applicants.filter((a) => {
    const fullName = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
    const email = (a.user?.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#020263] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 font-sans pb-12">
      <Navbar />

      {/* Formal Header */}
      <div className="relative bg-[#020263] border-b border-[#020263] overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-size-[32px_32px]"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.1] blur-[100px] bg-blue-400 -translate-y-1/2 translate-x-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Users className="w-4 h-4 text-blue-200" />
                <span className="text-[11px] font-bold tracking-wide text-blue-100 uppercase">
                  Applicant Management System
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                ข้อมูลผู้สมัครทั้งหมด
              </h1>
              <p className="text-sm md:text-base text-blue-200/80 max-w-2xl leading-relaxed">
                จัดการ คัดกรอง และนัดสัมภาษณ์ผู้สมัครจากทุกตำแหน่งงาน
                ของคุณได้อย่างรวดเร็วและมีประสิทธิภาพ
              </p>
            </div>

            {/* Total Stats Badge */}
            <div className="hidden md:flex flex-col items-end">
              <div className="bg-white px-6 py-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#020263]/5 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#020263]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">จำนวนผู้สมัครรวม</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : applicants.length.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-gray-500">คน</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filters & Search Bar */}
        <div className="bg-[#202063] rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, นามสกุล หรืออีเมลผู้สมัคร..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#020263]/20 focus:border-[#020263] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Job Filter */}
            <div className="md:w-72 relative">
              <div
                className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <div className="flex items-center gap-2 truncate">
                  <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate font-medium">
                    {selectedJobId === 'all'
                      ? 'ทุกตำแหน่งงาน'
                      : jobs.find((j) => j.id === selectedJobId)?.title || 'ทุกตำแหน่งงาน'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Dropdown menu */}
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 bg-white border border-gray-100 shadow-xl rounded-xl py-2 z-40 max-h-80 overflow-y-auto w-full min-w-[300px] md:right-0 md:left-auto">
                    <button
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedJobId === 'all' ? 'text-[#020263] font-semibold bg-blue-50/30' : 'text-gray-700'}`}
                      onClick={() => {
                        setSelectedJobId('all');
                        setIsFilterOpen(false);
                      }}
                    >
                      <span>ทุกตำแหน่งงาน</span>
                      {selectedJobId === 'all' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedJobId === job.id ? 'text-[#020263] font-semibold bg-blue-50/30' : 'text-gray-700'}`}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setIsFilterOpen(false);
                        }}
                      >
                        <span className="truncate pr-4">{job.title}</span>
                        {selectedJobId === job.id && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Selected Job Context Banner */}
        {selectedJobId !== 'all' && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-3 rounded-xl border border-gray-200">
            <span className="font-medium text-gray-800">กำลังแสดงผู้สมัครสำหรับ:</span>
            <span className="text-[#020263] font-semibold">
              {jobs.find((j) => j.id === selectedJobId)?.title}
            </span>
            <span className="mx-2 text-gray-300">|</span>
            <span>{applicants.length} คน</span>

            <button
              onClick={() => setSelectedJobId('all')}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              ล้างตัวกรอง
            </button>
          </div>
        )}

        {/* Applicants List */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 items-center bg-gray-50/80 px-6 py-3.5 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div className="col-span-4">ข้อมูลผู้สมัคร</div>
            <div className="col-span-3">ตำแหน่งที่สมัคร</div>
            <div className="col-span-2">วันที่สมัคร</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-1 text-right">การจัดการ</div>
          </div>

          {/* List Content */}
          <div className="divide-y divide-gray-100">
            {loading ? (
              // Loading Skeletons
              [...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-5 animate-pulse flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))
            ) : filteredApplicants.length === 0 ? (
              // Empty State
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">ไม่พบข้อมูลผู้สมัคร</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `ไม่พบผู้สมัครที่ตรงกับ "${searchQuery}" ลองค้นหาด้วยคำอื่น`
                    : selectedJobId !== 'all'
                      ? 'ยังไม่มีผู้สมัครในตำแหน่งงานนี้'
                      : 'คุณยังไม่มีผู้สมัครงานเข้ามาในระบบ'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            ) : (
              // Data Rows
              filteredApplicants.map((applicant) => {
                const StatusIcon = STATUS_CONFIG[applicant.status]?.icon || Clock;

                return (
                  <div
                    key={applicant.id}
                    className="group hover:bg-gray-50/80 transition-colors px-4 md:px-6 py-4 md:py-5 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center relative cursor-pointer"
                    onClick={() => setSelectedApplicantId(applicant.id)}
                  >
                    {/* Applicant Info (Col 1-4) */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden shadow-inner">
                        {applicant.user?.avatarUrl ? (
                          <img
                            src={applicant.user.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          (applicant.user?.firstName || 'U').charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {applicant.user?.firstName} {applicant.user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {applicant.user?.email}
                        </div>
                      </div>
                    </div>

                    {/* Job Title (Col 5-7) */}
                    <div className="md:col-span-3">
                      <div className="hidden md:block text-xs font-semibold text-gray-800 line-clamp-2 leading-relaxed">
                        {applicant.job?.title}
                      </div>
                      {/* Mobile view job title */}
                      <div className="md:hidden flex items-start gap-1.5 mt-1 text-sm text-gray-700">
                        <Briefcase className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{applicant.job?.title}</span>
                      </div>
                    </div>

                    {/* Applied Date (Col 8-9) */}
                    <div className="md:col-span-2 text-[13px] text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0 md:hidden text-gray-400" />
                      {formatDateTime(applicant.appliedAt)}
                    </div>

                    {/* Status (Col 10-11) */}
                    <div className="md:col-span-2">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[applicant.status]?.color || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{STATUS_CONFIG[applicant.status]?.label || applicant.status}</span>
                      </div>

                      {applicant.status === 'INTERVIEW' && applicant.interviewDate && (
                        <div className="text-[11px] text-orange-600 mt-1.5 flex items-center gap-1 font-medium">
                          <CalendarDays className="w-3 h-3" />
                          {formatDateTime(applicant.interviewDate)}
                        </div>
                      )}
                    </div>

                    {/* Actions (Col 12) */}
                    <div className="md:col-span-1 flex items-center md:justify-end gap-1.5 mt-3 md:mt-0 pt-3 md:pt-0 border-t border-gray-100 md:border-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplicantId(applicant.id);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-gray-600 md:text-gray-400 hover:text-[#020263] hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                        title="ดูรายละเอียด/เรซูเม่"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="md:hidden">ดูข้อมูล</span>
                      </button>

                      {/* Quick action: Shortlist (If pending or reviewed) */}
                      {(applicant.status === 'PENDING' || applicant.status === 'REVIEWED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(applicant.id, 'SHORTLISTED');
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-green-600 md:text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                          title="ให้ผ่านเข้ารอบ"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="md:hidden">เข้ารอบ</span>
                        </button>
                      )}

                      {/* Quick action: Reject (If pending or reviewed) */}
                      {(applicant.status === 'PENDING' || applicant.status === 'REVIEWED') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `ยืนยันการปฏิเสธผู้สมัคร ${applicant.user?.firstName} ใช่หรือไม่?`,
                              )
                            ) {
                              handleUpdateStatus(applicant.id, 'REJECTED');
                            }
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-red-600 md:text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                          title="ปฎิเสธ"
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="md:hidden">ปฏิเสธ</span>
                        </button>
                      )}

                      {/* Quick action: Schedule Interview (If SHORTLISTED) */}
                      {applicant.status === 'SHORTLISTED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInterviewApplicantId(applicant.id);
                            // Default to tomorrow
                            const tomorrow = new Date();
                            tomorrow.setDate(tomorrow.getDate() + 1);
                            setInterviewDate(tomorrow.toISOString().split('T')[0]);
                            setInterviewTime('10:00');
                            setInterviewModalOpen(true);
                          }}
                          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-orange-600 md:text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                          title="เพิ่มเวลานัดสัมภาษณ์"
                        >
                          <CalendarPlus className="w-4 h-4" />
                          <span className="md:hidden">นัดสัมภาษณ์</span>
                        </button>
                      )}

                      {/* Quick actions for INTERVIEW status */}
                      {applicant.status === 'INTERVIEW' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`ยืนยันการเสนอเข้าทำงานให้ ${applicant.user?.firstName} ใช่หรือไม่?`)) {
                                handleUpdateStatus(applicant.id, 'OFFERED');
                              }
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-green-600 md:text-gray-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                            title="เสนอเข้าทำงาน"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="md:hidden">รับทำงาน</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`ยืนยันการปฏิเสธผู้สมัคร ${applicant.user?.firstName} ใช่หรือไม่?`)) {
                                handleUpdateStatus(applicant.id, 'REJECTED');
                              }
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-red-600 md:text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                            title="ปฎิเสธ"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="md:hidden">ปฏิเสธ</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelInterview(applicant.id);
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-gray-500 md:text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                            title="ยกเลิกนัดสัมภาษณ์"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="md:hidden">ยกเลิกนัด</span>
                          </button>
                        </>
                      )}

                      {/* Quick actions for OFFERED status */}
                      {applicant.status === 'OFFERED' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setInterviewApplicantId(applicant.id);
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setInterviewDate(tomorrow.toISOString().split('T')[0]);
                              setInterviewTime('10:00');
                              setInterviewModalOpen(true);
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-orange-600 md:text-gray-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                            title="เพิ่มเวลานัดสัมภาษณ์"
                          >
                            <CalendarPlus className="w-4 h-4" />
                            <span className="md:hidden">นัดสัมภาษณ์</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`ยืนยันการยกเลิกข้อเสนอของ ${applicant.user?.firstName} และกลับไประยะสัมภาษณ์ใช่หรือไม่?`)) {
                                handleUpdateStatus(applicant.id, 'INTERVIEW');
                              }
                            }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 md:p-2 bg-white md:bg-transparent border border-gray-200 md:border-transparent rounded-lg text-gray-500 md:text-gray-400 hover:text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-all shadow-sm md:shadow-none font-medium text-xs md:text-base"
                            title="ยกเลิกข้อเสนอ (กลับไปเป็นนัดสัมภาษณ์)"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="md:hidden">ยกเลิกข้อเสนอ</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Applicant Detail Modal */}
      {selectedApplicantId && (
        <ApplicantDetailModal
          applicationId={selectedApplicantId}
          onClose={() => setSelectedApplicantId(null)}
        />
      )}

      {/* Interview Scheduling Modal */}
      {interviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !interviewLoading && setInterviewModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
            <h3 className="text-lg font-bold text-gray-900 mb-4">กำหนดวันนัดสัมภาษณ์</h3>

            <div className="space-y-4">
              {/* Calendar Date Picker */}
              <div className="relative">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">วันที่</label>
                <button
                  ref={calendarButtonRef}
                  type="button"
                  onClick={() => {
                    if (interviewDate) {
                      const [y, m] = interviewDate.split('-').map(Number);
                      setCalendarViewDate(new Date(y, m - 1, 1));
                    } else {
                      setCalendarViewDate(new Date());
                    }
                    // Calculate position from button's bounding rect
                    const rect = calendarButtonRef.current?.getBoundingClientRect();
                    if (rect) {
                      setCalendarPos({ top: rect.bottom + 6, left: rect.left, width: rect.width });
                    }
                    setCalendarOpen((o) => !o);
                  }}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm flex items-center justify-between hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#020263]/20 focus:border-[#020263] transition-all"
                >
                  <span className={interviewDate ? 'text-gray-800' : 'text-gray-400'}>
                    {interviewDate
                      ? (() => {
                          const [y, mo, d] = interviewDate.split('-');
                          return `${d}/${mo}/${y}`;
                        })()
                      : 'เลือกวันที่'}
                  </span>
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                </button>

                {calendarOpen && (
                  <>
                    <div className="fixed inset-0 z-60" onClick={() => setCalendarOpen(false)} />
                    <div
                      style={{ top: calendarPos.top, left: calendarPos.left, minWidth: calendarPos.width }}
                      className="fixed bg-white border border-gray-200 rounded-2xl shadow-2xl z-70 p-4 w-72"
                    >
                      {/* Month / Year Navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarViewDate(
                              (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-gray-900">
                          {new Intl.DateTimeFormat('th-TH', {
                            month: 'long',
                            year: 'numeric',
                          }).format(calendarViewDate)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCalendarViewDate(
                              (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Day-of-week headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                          <div
                            key={d}
                            className="text-center text-[10px] font-semibold text-gray-400 py-1"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Day grid */}
                      {(() => {
                        const yr = calendarViewDate.getFullYear();
                        const mo = calendarViewDate.getMonth();
                        const firstDay = new Date(yr, mo, 1).getDay();
                        const daysInMonth = new Date(yr, mo + 1, 0).getDate();
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const selectedParts = interviewDate ? interviewDate.split('-').map(Number) : null;
                        const cells: (number | null)[] = [];
                        for (let i = 0; i < firstDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                        return (
                          <div className="grid grid-cols-7 gap-0.5">
                            {cells.map((day, i) => {
                              if (!day) return <div key={`e-${i}`} />;
                              const dateObj = new Date(yr, mo, day);
                              const isPast = dateObj < today;
                              const isSelected =
                                selectedParts &&
                                yr === selectedParts[0] &&
                                mo + 1 === selectedParts[1] &&
                                day === selectedParts[2];
                              const isToday =
                                yr === today.getFullYear() &&
                                mo === today.getMonth() &&
                                day === today.getDate();
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    const dd = String(day).padStart(2, '0');
                                    const mm = String(mo + 1).padStart(2, '0');
                                    setInterviewDate(`${yr}-${mm}-${dd}`);
                                    setCalendarOpen(false);
                                  }}
                                  className={[
                                    'w-full aspect-square flex items-center justify-center text-xs rounded-lg transition-colors font-medium',
                                    isSelected
                                      ? 'bg-[#020263] text-white shadow'
                                      : isToday
                                        ? 'border border-[#020263] text-[#020263]'
                                        : isPast
                                          ? 'text-gray-300 cursor-not-allowed'
                                          : 'hover:bg-blue-50 hover:text-[#020263] text-gray-700',
                                  ].join(' ')}
                                >
                                  {day}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>


              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">เวลา</label>
                <input
                  type="time"
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#020263]/20 focus:border-[#020263]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setInterviewModalOpen(false)}
                disabled={interviewLoading}
                className="flex-1 h-11 px-4 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleScheduleInterview}
                disabled={interviewLoading || !interviewDate || !interviewTime}
                className="flex-2 h-11 px-4 font-semibold text-white bg-[#A80010] hover:bg-[#E00016] rounded-xl transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {interviewLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CalendarDays className="w-4 h-4" />
                )}
                ยืนยันการนัดหมาย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
