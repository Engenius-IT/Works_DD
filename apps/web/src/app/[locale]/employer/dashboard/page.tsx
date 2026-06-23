'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { bookmarkService } from '@/services/bookmark';
import { CandidateDetailModal } from '@/components/CandidateDetailModal';
import { ApplicantDetailModal } from '@/components/ApplicantDetailModal';
import axios from 'axios';
import {
  Building2,
  FileText,
  Package,
  CalendarDays,
  Calendar,
  Users,
  ChevronRight,
  ChevronLeft,
  Eye,
  MapPin,
  CheckCircle2,
  Trash2,
  Heart,
  Star,
  Crown,
  Zap,
} from 'lucide-react';
import { EmployerVerificationModal } from '@/components/EmployerVerificationModal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const getAccountStatusDisplay = (verificationStatus?: Company['verificationStatus']) => {
  switch (verificationStatus) {
    case 'VERIFIED':
      return { label: 'ยืนยันแล้ว', iconClassName: 'text-emerald-500', textClassName: 'text-gray-800' };
    case 'PENDING_REVIEW':
      return { label: 'รอตรวจสอบ', iconClassName: 'text-blue-500', textClassName: 'text-blue-700' };
    case 'REJECTED':
      return { label: 'ไม่ผ่านการยืนยัน', iconClassName: 'text-red-500', textClassName: 'text-red-700' };
    case 'UNVERIFIED':
    default:
      return { label: 'ยังไม่ได้ยืนยันบัญชี', iconClassName: 'text-amber-500', textClassName: 'text-amber-700' };
  }
};


const VerificationStatusBanner = ({
  company,
  onVerifyClick,
}: {
  company: Company;
  onVerifyClick: () => void;
}) => {
  if (company.verificationStatus === 'VERIFIED') return null;

  if (company.verificationStatus === 'REJECTED') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-red-800 tracking-tight">การยืนยันตัวตนบริษัทไม่ผ่าน</h3>
          <p className="text-sm text-red-600 mt-1 mb-3">
            เหตุผล: {company.rejectionReason || 'เอกสารไม่ถูกต้องหรือไม่ชัดเจน กรุณาตรวจสอบและอัปโหลดเอกสารใหม่อีกครั้ง'}
          </p>
          <button
            onClick={onVerifyClick}
            className="text-sm font-semibold bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition-colors shadow-sm"
          >
            ยื่นเอกสารใหม่
          </button>
        </div>
      </div>
    );
  }

  if (company.verificationStatus === 'PENDING_REVIEW') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-fade-in">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-[#020263] tracking-tight">กำลังตรวจสอบเอกสารยืนยันตัวตน</h3>
          <p className="text-sm text-blue-700 mt-1">
            บริษัทของคุณส่งเอกสารยืนยันตัวตนเรียบร้อยแล้ว แอดมินกำลังดำเนินการตรวจสอบ ซึ่งอาจใช้เวลา 1-2 วันทำการ
          </p>
        </div>
      </div>
    );
  }

  // UNVERIFIED
  return (
    <div className="bg-[#fff8e6] border border-[#ffe099] rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-fade-in relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#fff2cc] rounded-full blur-2xl -translate-y-16 translate-x-16 opacity-50 pointer-events-none" />
      <div className="w-10 h-10 rounded-full bg-[#ffecb3] flex items-center justify-center shrink-0 mt-0.5 relative z-10">
        <svg className="w-5 h-5 text-[#b37400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <div className="flex-1 relative z-10">
        <h3 className="text-base font-bold text-[#805300] tracking-tight">ยังไม่ได้ยืนยันบัญชี</h3>
        <p className="text-sm text-[#996300] mt-1 mb-4 leading-relaxed max-w-2xl">
          โปรดอัปโหลด <span className="font-semibold text-[#805300]">"หนังสือรับรองบริษัท"</span> หรือ <span className="font-semibold text-[#805300]">"ภ.พ.20"</span> เพื่อเป็นการยืนยันตัวตน <br />
          หลังจากผ่านการตรวจสอบ คุณจะสามารถ <span className="font-semibold text-[#805300]">เผยแพร่ประกาศงาน</span> และใช้งานฟีเจอร์ต่างๆ ได้อย่างเต็มประสิทธิภาพ
        </p>
        <button
          onClick={onVerifyClick}
          className="text-sm font-semibold bg-[#ffcc4d] hover:bg-[#ffc126] text-[#664200] px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          เริ่มยืนยันตัวตนตอนนี้
        </button>
      </div>
    </div>
  );
};

const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const MONTHS_TH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

interface Job {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { applications: number };
}

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  phone?: string;
  address?: string;
  district?: string;
  province?: string;
  companyType?: string;
  logoUrl?: string;
  verificationStatus?: 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
}

const SIZE_OPTIONS = ['1 - 10 คน', '10 - 30 คน', '30 - 100 คน', '100 - 500 คน', '500+ คน'];

interface InterviewItem {
  id: string;
  interviewDate: string;
  user: { id: string; firstName: string; lastName: string; email: string };
  job: { id: string; title: string };
}

interface RecentApplicantItem {
  id: string;
  status: string;
  appliedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  };
  job?: {
    title?: string;
  };
}

function MiniCalendar({ interviews = [] }: { interviews?: InterviewItem[] }) {
  const today = new Date();
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [clickedDay, setClickedDay] = useState<number | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false });

  // Build set of days that have interviews in the current month
  const interviewDaySet = new Set<number>();
  const monthInterviews = interviews.filter((iv) => {
    const d = new Date(iv.interviewDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  monthInterviews.forEach((iv) => {
    interviewDaySet.add(new Date(iv.interviewDate).getDate());
  });

  const todayDay =
    today.getMonth() === month && today.getFullYear() === year ? today.getDate() : -1;

  // Determine which day's interviews to show
  const activeDay = clickedDay ?? todayDay;

  const activeInterviews = monthInterviews.filter((iv) => {
    return new Date(iv.interviewDate).getDate() === activeDay;
  });

  // Label for the active day
  const activeDateLabel = activeDay > 0 ? `${activeDay} ${MONTHS_TH[month]} ${year + 543}` : null;

  const handleDayClick = (day: number, hasCurInterview: boolean) => {
    if (hasCurInterview) {
      setClickedDay(clickedDay === day ? null : day);
    }
  };

  // Reset clicked day when changing month
  const handleMonthChange = (dir: number) => {
    setClickedDay(null);
    setCurrent(new Date(year, month + dir, 1));
  };

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-gray-700 text-sm">
          {MONTHS_TH[month]} {year + 543}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] text-gray-400 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => {
          const isToday = cell.cur && cell.day === todayDay;
          const hasInterview = cell.cur && interviewDaySet.has(cell.day);
          const isClicked = cell.cur && cell.day === clickedDay;
          return (
            <div key={i} className="flex flex-col items-center py-0.5">
              <div
                onClick={() => cell.cur && handleDayClick(cell.day, hasInterview)}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all
                  ${isClicked ? 'bg-[#020263] text-white ring-2 ring-[#00003D] shadow-sm' : isToday ? 'bg-[#E00016] text-white' : hasInterview ? 'bg-blue-100 text-[#020263] font-bold cursor-pointer hover:bg-blue-200' : cell.cur ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300'}`}
              >
                {cell.day}
              </div>
              {hasInterview && !isToday && !isClicked && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#00003D] mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Interview details for selected/today */}
      {activeInterviews.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">📅 {activeDateLabel}</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
              {activeInterviews.length} นัด
            </span>
          </div>
          <div className="space-y-2">
            {activeInterviews.map((iv) => {
              const d = new Date(iv.interviewDate);
              const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              return (
                <div
                  key={iv.id}
                  className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="text-xs font-bold text-green-600 whitespace-nowrap pt-0.5">
                    {time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-800">
                      {iv.user.firstName} {iv.user.lastName}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{iv.job.title}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">📧 {iv.user.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeInterviews.length === 0 && clickedDay !== null && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">วันที่เลือกไม่มีนัดสัมภาษณ์</p>
        </div>
      )}

      {activeInterviews.length === 0 && clickedDay === null && interviews.length > 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            วันนี้ไม่มีนัดสัมภาษณ์ · กดวันที่มีจุดสีเพื่อดูรายละเอียด
          </p>
        </div>
      )}

      {interviews.length === 0 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">ยังไม่มีนัดสัมภาษณ์</p>
        </div>
      )}
    </div>
  );
}

function CompanyEditModal({
  company,
  onClose,
  onSaved,
}: {
  company: Company;
  onClose: () => void;
  onSaved: (c: Company) => void;
}) {
  const [form, setForm] = useState<Company>({ ...company });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');


  const set = (field: keyof Company, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');

      const payload = {
        name: form.name,
        description: form.description,
        website: form.website,
        industry: form.industry,
        size: form.size,
        phone: form.phone,
        address: form.address,
        district: form.district,
        province: form.province,
        companyType: form.companyType,
        logoUrl: form.logoUrl,
      };

      const res = await fetch(`${API_URL}/companies/${company.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onSaved(updated);
      onClose();
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-xl font-bold text-gray-800">แก้ไขข้อมูลบริษัท</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Logo Upload */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group rounded-2xl overflow-hidden shrink-0">
              <div className="w-24 h-24 bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <svg
                  className="w-6 h-6 text-white mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                <span className="text-[10px] text-white font-medium">เปลี่ยนโลโก้</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const formData = new FormData();
                      formData.append('file', file);
                      const token = localStorage.getItem('accessToken');
                      const uploadRes = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${token}` },
                        body: formData,
                      });
                      if (!uploadRes.ok) throw new Error('Upload failed');
                      const data = await uploadRes.json();
                      set('logoUrl', data.url);
                    } catch (err) {
                      setError('อัปโหลดรูปภาพไม่สำเร็จ');
                    }
                  }}
                />
              </label>
            </div>
            <div className="flex flex-col justify-center max-w-sm text-center sm:text-left">
              <h3 className="text-sm font-semibold text-gray-800">โลโก้บริษัท</h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                อัปโหลดโลโก้บริษัทของคุณเพื่อให้น่าเชื่อถือมากยิ่งขึ้น
                <br />
                รองรับไฟล์ JPG, PNG, WEBP ขนาดไม่เกิน 5MB
              </p>
            </div>
          </div>

          {/* ชื่อบริษัท */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">ชื่อบริษัท</label>
            <input
              type="text"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* เกี่ยวกับบริษัท */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              เกี่ยวกับบริษัท
              <span className="text-gray-400 font-normal ml-1 text-xs">
                (อธิบายคร่าวๆ บริษัทประกอบการเกี่ยวกัน)
              </span>
            </label>
            <textarea
              rows={4}
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              className="w-full px-4 py-3 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {/* รูปแบบบริษัท */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">รูปแบบบริษัท</label>
            <div className="flex gap-6">
              {['เอกชน', 'รัฐวิสาหกิจ'].map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="radio"
                      name="companyType"
                      value={t}
                      checked={form.companyType === t}
                      onChange={() => set('companyType', t)}
                      className="w-4 h-4 accent-blue-600"
                    />
                  </div>
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* จำนวนพนักงาน */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">จำนวนพนักงาน</label>
            <div className="relative">
              <select
                value={form.size ?? ''}
                onChange={(e) => set('size', e.target.value)}
                className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none pr-10"
              >
                <option value="">เลือกจำนวนพนักงาน</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* สายงาน */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              สายงาน / อุตสาหกรรม
            </label>
            <input
              type="text"
              value={form.industry ?? ''}
              onChange={(e) => set('industry', e.target.value)}
              placeholder="เช่น IT, การเงิน, การแพทย์"
              className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* ข้อมูลที่อยู่บริษัท */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">ข้อมูลที่อยู่บริษัท</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">จังหวัด</label>
                <input
                  type="text"
                  value={form.province ?? ''}
                  onChange={(e) => set('province', e.target.value)}
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  อำเภอ/เขต
                </label>
                <input
                  type="text"
                  value={form.district ?? ''}
                  onChange={(e) => set('district', e.target.value)}
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  ที่อยู่ เลขที่
                </label>
                <input
                  type="text"
                  value={form.address ?? ''}
                  onChange={(e) => set('address', e.target.value)}
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* ข้อมูลติดต่อบริษัท */}
          <div className="border-t border-gray-100 pt-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">ข้อมูลติดต่อบริษัท</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  value={form.phone ?? ''}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  เว็บไซต์บริษัท
                </label>
                <input
                  type="text"
                  value={form.website ?? ''}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://"
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-8 py-4 flex gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-[#E00016] hover:bg-[#A80010] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  position?: string;
  title?: string;
  location?: string;
  updatedAt: string;
}

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [recentApplicants, setRecentApplicants] = useState<RecentApplicantItem[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loadingApplicants, setLoadingApplicants] = useState(true);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const accountStatusDisplay = getAccountStatusDisplay(company?.verificationStatus);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [now, setNow] = useState(new Date());
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  const handleUnbookmark = async (candidateId: string) => {
    if (!confirm('ยืนยันการลบออกจากรายการที่บันทึกไว้?')) return;
    try {
      await bookmarkService.toggle(candidateId);
      // ลบออกจาก candidates เพราะเราเปลี่ยนมาใช้ตัวนี้ตัวเดียว
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
    } catch (err) {
      alert('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoadingBookmarks(true); // ใช้ loading สำหรับ bookmark โดยเฉพาะ
      const result = await bookmarkService.getMyList();
      const rawList = Array.isArray(result) ? result : (result?.data || []);

      const formattedData = rawList.map((item: any) => {
        const c = item.candidate;
        const p = c?.profile;

        return {
          id: item.candidateId || c?.id,
          fullName: c?.firstName ? `${c.firstName} ${c.lastName || ''}` : 'ไม่ระบุชื่อ',
          email: c?.email || 'ไม่ระบุอีเมล',
          avatarUrl: c?.avatarUrl || null,
          position: c?.jobPreferences?.[0]?.position || 'ไม่ได้ระบุตำแหน่ง',
          location: p?.province || 'ไม่ระบุพื้นที่',
          updatedAt: item.createdAt || new Date().toISOString()
        };
      });

      setCandidates(formattedData);
    } catch (err: any) {
      console.error('Fetch error details:', err);
    } finally {
      setLoadingBookmarks(false);
    }
  }, []);

  const getPackageData = useCallback(async () => {
    if (!company?.id) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await axios.get(`${baseUrl}/packages/status/${company.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPackageInfo(res.data.data || res.data);
    } catch (err: any) {
      console.error("❌ Package API Error:", err.message);
      setPackageInfo(false);
    }
  }, [company?.id]);

  const getTimeLeftLabel = (endDate: string | Date | null, currentTime: Date) => {
    if (!endDate) return "ไม่ระบุ";

    const total = new Date(endDate).getTime() - currentTime.getTime();
    if (total <= 0) return "(หมดอายุแล้ว)";

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    // Logic: ยิ่งใกล้ยิ่งโชว์ละเอียด
    if (days > 7) return `(ใช้งานได้ ${days} วัน)`;
    if (days >= 1) return `(ใช้งานได้ ${days} วัน ${hours} ชม.)`;
    if (hours >= 1) return `(ใช้งานได้ ${hours} ชม. ${minutes} นาที)`;
    return `(ใช้งานได้ ${minutes} นาที ${seconds} วินาที)`; // นาทีสุดท้าย
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);

      if (packageInfo?.endDate && packageInfo.name !== 'Free Plan') {
        const end = new Date(packageInfo.endDate).getTime();
        const current = currentTime.getTime();

        // ถ้าหมดเวลา ให้ดึงข้อมูลใหม่ทันที
        if (current >= end) {
          console.log("⏰ Package expired! Updating status...");
          getPackageData(); // เรียกใช้ฟังก์ชันที่เราสร้างไว้
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [packageInfo?.endDate, packageInfo?.name, getPackageData]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
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

    // 2. ดึงข้อมูลบริษัท (ทำทีเดียว ได้ทั้งข้อมูลบริษัทและเอา ID ไปดึง Package ต่อ)
    fetch(`${API_URL}/companies/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.id) {
          setCompany(data);
        } else {
          setPackageInfo(false);
        }
      })
      .catch(() => setPackageInfo(false));

    // 3. ดึงรายการงาน (Jobs)
    fetch(`${API_URL}/companies/mine/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setJobs(list);
        setLoadingJobs(false);
      })
      .catch(() => setLoadingJobs(false));

    // 4. ดึงข้อมูลอื่นๆ
    setLoadingApplicants(true);
    fetch(`${API_URL}/applications/employer/recent`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setRecentApplicants(Array.isArray(data) ? data : []);
        setLoadingApplicants(false);
      })
      .catch(() => setLoadingApplicants(false));

    fetch(`${API_URL}/applications/employer/interviews`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInterviews(Array.isArray(data) ? data : []))
      .catch(() => { });

    fetchBookmarks();


  }, [user]);

  useEffect(() => {
    if (company?.id) {
      getPackageData();

      const interval = setInterval(() => {
        console.log("🔄 Polling package status...");
        getPackageData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [company?.id, getPackageData]);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === 'PUBLISHED' || j.status === 'ACTIVE').length;
  const closedJobs = jobs.filter((j) => j.status === 'CLOSED' || j.status === 'DRAFT').length;

  const formatAppliedAt = (dateString: string) => {
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
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
    const month = months[d.getMonth()];
    const year = d.getFullYear() + 543;
    const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} น.`;
    return `${day} ${month} ${year}\n${time}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Premium Header */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* Modern Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"></div>

          {/* Glowing Orbs */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.15] blur-[80px]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          />
          <div
            className="absolute top-10 right-0 w-80 h-80 rounded-full opacity-[0.1] blur-[80px]"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">


            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              สวัสดี,{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#020263] to-[#00003D]">
                {user?.firstName} {user?.lastName}
              </span>{' '}

            </h1>

            <p className="text-sm md:text-base text-gray-500 max-w-xl leading-relaxed mt-1">
              ยินดีต้อนรับสู่ระบบบริหารจัดการสรรหาบุคลากร คุณสามารถจัดการประกาศงาน ดูข้อมูลผู้สมัคร และเริ่มสร้างทีมงานที่มีประสิทธิภาพได้ที่นี่
            </p>
          </div>

          <div className="hidden md:flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-center px-4 border-r border-gray-200/60 last:border-0">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                สถานะบัญชี
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <CheckCircle2 className={`w-4 h-4 ${accountStatusDisplay.iconClassName}`} />
                <span className={`text-sm font-bold ${accountStatusDisplay.textClassName}`}>{accountStatusDisplay.label}</span>
              </div>
            </div>
            <div className="text-center px-4">
              <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                วันที่ใช้งาน
              </div>
              <div className="text-sm font-bold text-gray-800">
                {new Date().toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Verification Status Banner */}
        {company && (
          <VerificationStatusBanner
            company={company}
            onVerifyClick={() => setShowVerifyModal(true)}
          />
        )}

        {/* Top 3 Cards - Added negative margin logic to overlap nicely if desired, but standard py-8 looks clean too */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Company Info */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-bold text-gray-800">ข้อมูลบริษัท</span>
              </div>
              {company && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#E00016] hover:text-[#A80010] bg-gray-50 hover:bg-[#E00016]/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                    />
                  </svg>
                  แก้ไข
                </button>
              )}
            </div>

            {company ? (
              <div className="space-y-3">
                {/* Company name + avatar */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shrink-0 overflow-hidden">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      company.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-800 text-sm leading-tight truncate">
                      {company.name}
                    </div>
                    {company.industry && (
                      <div className="text-xs text-gray-400 mt-0.5">{company.industry}</div>
                    )}
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 text-xs text-gray-500">
                  {(company.province || company.district) && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{[company.district, company.province].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  {company.size && (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{company.size}</span>
                    </div>
                  )}
                  {company.website && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3"
                        />
                      </svg>
                      <span className="truncate text-blue-500">{company.website}</span>
                    </div>
                  )}
                  {company.phone && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 6.75Z"
                        />
                      </svg>
                      <span>{company.phone}</span>
                    </div>
                  )}
                </div>

                {company.description && (
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 border-t border-gray-50 pt-2">
                    {company.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลบริษัท</p>
              </div>
            )}
          </div>

          {/* Card 2: Job Listings */}
          <div className="bg-white rounded-2xl border border-gray-300 shadow-lg p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-bold text-gray-800">ประกาศงานทั้งหมด</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {loadingJobs ? '—' : totalJobs}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">ทั้งหมด</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-2xl font-bold text-green-600">
                  {loadingJobs ? '—' : activeJobs}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">เผยแพร่</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-400">
                  {loadingJobs ? '—' : closedJobs}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">ปิดประกาศ</div>
              </div>
            </div>

            <button
              onClick={() => router.push('/employer/jobs')}
              className="w-full flex items-center justify-center gap-2 bg-[#020263] hover:bg-[#00003D] text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              เพิ่มประกาศงานและจัดการผู้สมัคร
            </button>
          </div>

          {/* Card 3: Package Container - ปรับโทนสีหรูหรา ลุ่มลึก และเพิ่มมิติแสงเงาตามธีม Package ของแต่ละ Tier */}
          <div className={`rounded-2xl border-2 flex flex-col gap-4 transition-all duration-500 p-6 shadow-2xl relative overflow-hidden ${!packageInfo ? 'bg-white border-gray-200 text-slate-900' :
            packageInfo?.name === 'VIP'
              ? 'bg-gradient-to-br from-rose-800 via-red-900 to-[#020263]/80 border-white/20 shadow-[0_20px_50px_-15px_rgba(225,29,72,0.4)]'
              : packageInfo?.name === 'Premium'
                ? 'bg-gradient-to-b from-slate-900 via-[#03034f] to-[#01013a] border-blue-900/50 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]'
                : packageInfo?.name === 'Pro'
                  ? 'bg-gradient-to-b from-amber-50/60 via-white to-white border-slate-100 shadow-xl shadow-amber-500/5'
                  : 'bg-white border-gray-200 text-slate-900'
            }`}>

            {/* --- เอฟเฟกต์แสงเงาเบื้องหลัง (Background Effects) เพื่อดึงเลเยอร์ของ Package ออกมา --- */}
            {packageInfo?.name === 'VIP' && (
              <>
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                  <div className="absolute -top-[150%] -left-[150%] w-[40%] h-[300%] bg-gradient-to-r from-transparent via-rose-300/20 to-transparent rotate-[45deg] animate-[sweep_5s_infinite]" />
                </div>
              </>
            )}
            {packageInfo?.name === 'Premium' && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-blue-400/15 to-transparent rotate-[45deg] animate-[sweep_6s_infinite]" />
              </div>
            )}
            {packageInfo?.name === 'Pro' && (
              <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-amber-400/10 to-transparent rotate-[45deg] animate-[sweep_7s_infinite]" />
              </div>
            )}

            {/* ส่วนหัว: จัดการระยะห่าง ไม่ให้ Ring เบียดขอบ */}
            <div className="flex items-center gap-4.5 p-0.5 relative z-10">
              {/* Icon Container: ปรับแต่งสีพื้นหลังไอคอนให้รับกับตัวการ์ด */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0 ${!packageInfo ? 'bg-gray-100' :
                packageInfo?.name === 'VIP'
                  ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-950/50 text-white'
                  : packageInfo?.name === 'Premium'
                    ? 'bg-blue-950 border border-blue-800/50 text-blue-400'
                    : packageInfo?.name === 'Pro'
                      ? 'bg-amber-100 text-amber-600 border border-amber-200/50'
                      : 'bg-orange-100'
                }`}>
                <Package className="w-5 h-5" />
              </div>

              <div className="flex-1">
                {/* แถวชื่อ Package และ Bonus */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {!packageInfo ? (
                      <span className={`font-bold text-sm ${packageInfo === false ? 'text-gray-800' : 'text-gray-600'}`}>
                        {packageInfo === false ? 'ดึงข้อมูลไม่สำเร็จ' : 'กำลังโหลด...'}
                      </span>
                    ) : packageInfo?.name === 'VIP' ? (
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 via-red-600 to-rose-800 border border-white/20 text-white text-[10px] font-black shadow-md tracking-widest uppercase">
                        VIP ACCOUNT
                      </span>
                    ) : packageInfo?.name === 'Premium' ? (
                      <span className="px-3 py-1 rounded-full bg-[#020263] border border-blue-400 text-blue-100 text-[10px] font-black shadow-md tracking-widest uppercase">
                        PREMIUM
                      </span>
                    ) : packageInfo?.name === 'Pro' ? (
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 border border-white text-white text-[10px] font-black shadow-sm tracking-widest uppercase">
                        PRO ACCOUNT
                      </span>
                    ) : (
                      <span className={`font-bold text-xs ${packageInfo?.name === 'VIP' || packageInfo?.name === 'Premium' ? 'text-white' : 'text-slate-800'}`}>
                        {packageInfo?.name || 'Standard'}
                      </span>
                    )}
                  </div>

                  {/* ป้าย Bonus แบบกะทัดรัด (Compact) */}
                  {(packageInfo?.bonusQuotaCC > 0 || packageInfo?.bonusQuotaAC > 0) && (
                    <div className="flex items-center gap-1.5 bg-fuchsia-100 border border-fuchsia-200 px-2.5 py-1 rounded-full shadow-sm">
                      <div className="w-1.5 h-1.5 bg-fuchsia-600 rounded-full animate-ping" />
                      <span className="text-[9px] font-black text-fuchsia-800 italic uppercase tracking-tighter">
                        Bonus
                      </span>
                      <span className="text-[9px] font-medium text-fuchsia-700 border-l border-fuchsia-200 pl-1.5">
                        {getTimeLeftLabel(packageInfo?.bonusEndsAt, now)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Dot */}
                <div className="flex items-center gap-1.5 mt-1.5 relative z-10">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block animate-pulse ${!packageInfo ? 'bg-gray-300' :
                    packageInfo?.name === 'VIP' ? 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]' :
                      packageInfo?.name === 'Premium' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' :
                        packageInfo?.name === 'Pro' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]' :
                          'bg-gray-500'
                    }`} />
                  <span className={`text-xs font-semibold ${packageInfo?.name === 'VIP' || packageInfo?.name === 'Premium' ? 'text-slate-300' : packageInfo?.name === 'Pro' ? 'text-amber-700' : 'text-gray-500'}`}>
                    {packageInfo
                      ? (packageInfo?.name === 'VIP'
                        ? 'สิทธิพิเศษขั้นสูงสุด · Active'
                        : (packageInfo?.name === 'Premium' ? 'สิทธิพิเศษขั้นสูง · Active' : (packageInfo?.name === 'Pro' ? 'สิทธิพิเศษขั้นพื้นฐาน · Active' : 'ฟรีทดลอง · ทดลองใช้')))
                      : 'สถานะการเชื่อมต่อ API'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quota Progress */}
            <div className="space-y-3.5 relative z-10">
              {/* CC Quota */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold">
                  <span className={!packageInfo ? 'text-gray-600' :
                    packageInfo?.name === 'VIP' ? 'text-rose-200' :
                      packageInfo?.name === 'Premium' ? 'text-blue-300' :
                        packageInfo?.name === 'Pro' ? 'text-amber-700' : 'text-gray-600'
                  }>
                    โควตา CC คงเหลือ
                  </span>
                  <span className={!packageInfo ? "text-red-400" :
                    packageInfo?.name === 'VIP' ? 'text-white' :
                      packageInfo?.name === 'Premium' ? 'text-white' :
                        packageInfo?.name === 'Pro' ? 'text-slate-800' : 'text-slate-700'
                  }>
                    {packageInfo ? (
                      <>
                        {Math.max(0, (packageInfo?.ccQuotaTotal || 0) - (packageInfo?.ccQuotaUsed || 0))} / {packageInfo?.ccQuotaTotal || 0}
                        {(packageInfo?.bonusQuotaCC || 0) > 0 && (
                          <span className={`text-[10px] ml-1 font-normal ${packageInfo?.name === 'VIP' ? 'text-rose-300/80' : packageInfo?.name === 'Premium' ? 'text-blue-300/80' : 'text-gray-400'}`}>
                            (
                            <span>{(packageInfo?.ccQuotaTotal || 0) - (packageInfo?.bonusQuotaCC || 0)}</span>
                            <span className="mx-0.5">+</span>
                            <span className="font-bold text-fuchsia-500">{packageInfo?.bonusQuotaCC}</span>
                            )
                          </span>
                        )}
                      </>
                    ) : "— / —"}
                  </span>
                </div>

                {/* Progress Track: ปรับตามธีมพื้นหลังของแต่ละ Tier */}
                <div className={`h-2 rounded-full overflow-hidden flex border shadow-inner ${!packageInfo ? 'bg-gray-100 border-gray-200' :
                  packageInfo?.name === 'VIP' ? 'bg-black/40 border-rose-950/20' :
                    packageInfo?.name === 'Premium' ? 'bg-black/40 border-blue-950/20' :
                      packageInfo?.name === 'Pro' ? 'bg-amber-100/60 border-amber-200/50' : 'bg-gray-100 border-gray-200'
                  }`}>
                  {packageInfo ? (() => {
                    const total = packageInfo?.ccQuotaTotal || 1;
                    const used = packageInfo?.ccQuotaUsed || 0;
                    const bonusTotal = packageInfo?.bonusQuotaCC || 0;
                    const baseTotal = total - bonusTotal;
                    const remainingTotal = Math.max(0, total - used);
                    const baseWidth = (Math.min(remainingTotal, baseTotal) / total) * 100;
                    const bonusWidth = (Math.max(0, remainingTotal - baseTotal) / total) * 100;
                    return (
                      <>
                        <div
                          className={`h-full transition-all duration-1000 shadow-sm ${packageInfo?.name === 'VIP' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                            packageInfo?.name === 'Premium' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                              packageInfo?.name === 'Pro' ? 'bg-gradient-to-r from-amber-400 to-yellow-600' : 'bg-blue-600'
                            }`}
                          style={{ width: `${baseWidth}%` }}
                        />
                        {bonusWidth > 0 && (
                          <div
                            className="h-full transition-all duration-1000 border-l border-white/20 bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 relative"
                            style={{ width: `${bonusWidth}%` }}
                          >
                            <div className="absolute inset-0 bg-white/15 h-[40%]" />
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="h-full bg-gray-200 w-0" />
                  )}
                </div>
              </div>

              {/* AC Quota */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-bold">
                  <span className={!packageInfo ? 'text-gray-600' :
                    packageInfo?.name === 'VIP' ? 'text-rose-200' :
                      packageInfo?.name === 'Premium' ? 'text-blue-300' :
                        packageInfo?.name === 'Pro' ? 'text-amber-700' : 'text-gray-600'
                  }>
                    โควตา AC คงเหลือ
                  </span>
                  <span className={!packageInfo ? "text-red-400" :
                    packageInfo?.name === 'VIP' ? 'text-white' :
                      packageInfo?.name === 'Premium' ? 'text-white' :
                        packageInfo?.name === 'Pro' ? 'text-slate-800' : 'text-slate-700'
                  }>
                    {packageInfo ? (
                      <>
                        {Math.max(0, (packageInfo?.acQuotaTotal || 0) - (packageInfo?.acQuotaUsed || 0))} / {packageInfo?.acQuotaTotal || 0}
                        {(packageInfo?.bonusQuotaAC || 0) > 0 && (
                          <span className={`text-[10px] ml-1 font-normal ${packageInfo?.name === 'VIP' ? 'text-rose-300/80' : packageInfo?.name === 'Premium' ? 'text-blue-300/80' : 'text-gray-400'}`}>
                            (
                            <span>{(packageInfo?.acQuotaTotal || 0) - (packageInfo?.bonusQuotaAC || 0)}</span>
                            <span className="mx-0.5">+</span>
                            <span className="font-bold text-fuchsia-500">{packageInfo?.bonusQuotaAC}</span>
                            )
                          </span>
                        )}
                      </>
                    ) : "— / —"}
                  </span>
                </div>

                {/* Progress Track */}
                <div className={`h-2 rounded-full overflow-hidden flex border shadow-inner ${!packageInfo ? 'bg-gray-100 border-gray-200' :
                  packageInfo?.name === 'VIP' ? 'bg-black/40 border-rose-950/20' :
                    packageInfo?.name === 'Premium' ? 'bg-black/40 border-blue-950/20' :
                      packageInfo?.name === 'Pro' ? 'bg-amber-100/60 border-amber-200/50' : 'bg-gray-100 border-gray-200'
                  }`}>
                  {packageInfo ? (() => {
                    const total = packageInfo?.acQuotaTotal || 1;
                    const used = packageInfo?.acQuotaUsed || 0;
                    const bonusTotal = packageInfo?.bonusQuotaAC || 0;
                    const baseTotal = total - bonusTotal;
                    const remainingTotal = Math.max(0, total - used);
                    const baseWidth = (Math.min(remainingTotal, baseTotal) / total) * 100;
                    const bonusWidth = (Math.max(0, remainingTotal - baseTotal) / total) * 100;
                    return (
                      <>
                        <div
                          className={`h-full transition-all duration-1000 shadow-sm ${packageInfo?.name === 'VIP' ? 'bg-gradient-to-r from-rose-500 to-red-600' :
                            packageInfo?.name === 'Premium' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                              packageInfo?.name === 'Pro' ? 'bg-gradient-to-r from-amber-400 to-yellow-600' : 'bg-blue-600'
                            }`}
                          style={{ width: `${baseWidth}%` }}
                        />
                        {bonusWidth > 0 && (
                          <div
                            className="h-full transition-all duration-1000 border-l border-white/20 bg-gradient-to-r from-fuchsia-400 to-fuchsia-600 relative"
                            style={{ width: `${bonusWidth}%` }}
                          >
                            <div className="absolute inset-0 bg-white/15 h-[40%]" />
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="h-full bg-gray-200 w-0" />
                  )}
                </div>
              </div>
            </div>

            {/* ส่วนแสดงระยะเวลาแพ็คเกจ */}
            {packageInfo?.name !== 'Free Plan' && (
              <div className={`pt-3 border-t flex flex-col gap-1 relative z-10 ${packageInfo?.name === 'VIP' || packageInfo?.name === 'Premium' ? 'border-white/10' : packageInfo?.name === 'Pro' ? 'border-amber-100' : 'border-gray-200'}`}>
                <div className={`flex items-center justify-between text-[11px] font-bold ${packageInfo?.name === 'VIP' || packageInfo?.name === 'Premium' ? 'text-white' : packageInfo?.name === 'Pro' ? 'text-slate-800' : 'text-gray-600'}`}>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <Calendar className="w-3.5 h-3.5 text-current" />
                    <span>ระยะเวลาแพ็คเกจ</span>
                  </div>
                  <span className={packageInfo?.name === 'VIP' ? 'text-rose-200' : packageInfo?.name === 'Premium' ? 'text-blue-300' : packageInfo?.name === 'Pro' ? 'text-amber-800' : ''}>
                    {packageInfo?.startDate && packageInfo?.endDate
                      ? `${new Date(packageInfo.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - ${new Date(packageInfo.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}`
                      : 'ไม่ระบุ'}
                  </span>
                </div>
                {packageInfo?.endDate && (
                  <div className={`text-[10px] text-right italic font-medium ${packageInfo?.name === 'VIP' ? 'text-rose-300/80' : packageInfo?.name === 'Premium' ? 'text-blue-300/80' : packageInfo?.name === 'Pro' ? 'text-amber-600' : 'text-gray-400'}`}>
                    {getTimeLeftLabel(packageInfo.endDate, now)}
                  </div>
                )}
              </div>
            )}

            {/* Button Area */}
            <div className="mt-auto pt-2 flex gap-2.5 items-center relative z-10">
              {!packageInfo ? (
                <div className="flex-1 text-center py-2.5 text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                  {packageInfo === false ? 'เซิร์ฟเวอร์ขัดข้อง' : 'กำลังตรวจสอบข้อมูลบัญชี...'}
                </div>
              ) : (
                <>
                  {/* ฝั่งซ้าย: ปุ่มอัปเกรด หรือ กล่องสถานะบัญชี */}
                  {packageInfo?.name === 'Free Plan' || packageInfo?.name === 'Standard' || !packageInfo?.name ? (
                    <button
                      onClick={() => router.push('/employer/packages')}
                      className="flex-1 min-h-[44px] font-black py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all text-sm shadow-md active:scale-[0.98]"
                    >
                      อัปเกรดแพ็คเกจ
                    </button>
                  ) : (
                    <div className="flex-1 min-h-[44px] flex items-center">
                      {packageInfo?.name === 'VIP' ? (
                        <div className="w-full h-full font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border-2 border-white/20 shadow-xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 text-white tracking-wide">
                          <Star className="w-4 h-4 fill-white text-white animate-pulse" />
                          บัญชีระดับสูงสุด (VIP)
                        </div>
                      ) : packageInfo?.name === 'Premium' ? (
                        <div className="w-full h-full font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border-2 border-blue-950/40 shadow-xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white tracking-wide">
                          <Crown className="w-4 h-4 text-blue-200 fill-blue-200" />
                          บัญชีระดับพรีเมียม (Premium)
                        </div>
                      ) : packageInfo?.name === 'Pro' ? (
                        <div className="w-full h-full font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border-b-4 border-amber-800 bg-gradient-to-r from-amber-500 to-amber-600 text-white tracking-wide">
                          <Zap className="w-4 h-4 text-white fill-white" />
                          บัญชีระดับโปร (Pro Account)
                        </div>
                      ) : (
                        <div className="w-full h-full font-medium py-2.5 rounded-xl text-xs flex items-center justify-center border border-gray-200 bg-gray-50 text-gray-600">
                          {packageInfo?.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ฝั่งขวา: ปุ่มประวัติการชำระเงิน (Billing History) ปรับสีให้แมทช์กับ Contrast พื้นหลัง */}
                  <button
                    onClick={() => router.push('/employer/settings/billing')}
                    className={`w-[44px] h-[44px] flex items-center justify-center border-2 rounded-xl transition-all shadow-md active:scale-[0.98] shrink-0 ${packageInfo?.name === 'VIP' ? 'border-rose-400/30 bg-white/10 text-white hover:bg-white/20' :
                      packageInfo?.name === 'Premium' ? 'border-blue-400/30 bg-white/5 text-blue-200 hover:bg-white/10' :
                        packageInfo?.name === 'Pro' ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' :
                          'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
                      }`}
                    title="ประวัติการชำระเงิน"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Card 4: Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-300 shadow-lg p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-purple-500" />
              </div>
              <span className="font-bold text-gray-800">ปฏิทินนัดสัมภาษณ์</span>
            </div>
            <MiniCalendar interviews={interviews} />
          </div>

          {/* Card 5: Recent Applicants */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-300 shadow-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-teal-500" />
                </div>
                <span className="font-bold text-gray-800">
                  ผู้สมัครล่าสุด ({recentApplicants.length} รายการ)
                </span>
              </div>
              <button
                onClick={() => router.push('/employer/applicants')}
                className="text-lg font-medium flex items-center gap-1 bg-[#020263] text-white rounded-xl px-4 py-2 drop-shadow-lg hover:bg-[#00003D] transition-colors"
              >
                จัดการผู้สมัครและนัดสัมภาษณ์

              </button>
            </div>

            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-4 text-xs text-gray-400 font-medium pb-2 border-b border-gray-50 px-2">
              <span>ผู้สมัคร</span>
              <span>ตำแหน่ง</span>
              <span>วันที่สมัคร</span>
              <span className="text-right">การจัดการ</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
              {loadingApplicants ? (
                <div className="py-8 text-center text-sm text-gray-400">กำลังโหลดข้อมูล...</div>
              ) : recentApplicants.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">ยังไม่มีผู้สมัครล่าสุด</div>
              ) : (
                recentApplicants.map((a) => (
                  <div
                    key={a.id}
                    /* แก้จุดนี้: ใช้ flex-col บนมือถือ และ md:grid-cols-4 บนคอม */
                    className="flex flex-col md:grid md:grid-cols-4 items-start md:items-center py-4 md:py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors gap-3 md:gap-0"
                  >
                    {/* 1. Name + avatar */}
                    <div className="flex items-center gap-2.5 w-full">
                      <div className="w-9 h-9 rounded-full bg-blue-500 overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {a.user?.avatarUrl ? (
                          <img src={a.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          (a.user?.firstName || 'U').charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm md:text-xs font-bold md:font-semibold text-gray-800 leading-tight truncate">
                          {a.user?.firstName} {a.user?.lastName}
                        </div>
                        <div className={`text-[10px] font-medium ${a.status === 'SHORTLISTED' ? 'text-green-500' : a.status === 'REJECTED' ? 'text-red-500' : 'text-gray-400'}`}>
                          {a.status === 'SHORTLISTED' ? 'นัดสัมภาษณ์' : a.status === 'REJECTED' ? 'ปฏิเสธ' : 'สมัครงานแล้ว'}
                        </div>
                      </div>
                    </div>

                    {/* 2. Position - บนมือถือให้มีหัวข้อกำกับเล็กๆ */}
                    <div className="w-full md:w-auto">
                      <span className="md:hidden text-[10px] text-gray-400 font-bold block mb-0.5 uppercase">ตำแหน่ง</span>
                      <div className="text-xs text-gray-600 truncate bg-gray-50 md:bg-transparent p-1.5 md:p-0 rounded">
                        {a.job?.title}
                      </div>
                    </div>

                    {/* 3. Date */}
                    <div className="w-full md:w-auto">
                      <span className="md:hidden text-[10px] text-gray-400 font-bold block mb-0.5 uppercase">วันที่สมัคร</span>
                      <div className="text-[11px] text-gray-500">
                        {formatAppliedAt(a.appliedAt)}
                      </div>
                    </div>

                    {/* 4. Actions */}
                    <div className="flex justify-end w-full md:w-auto border-t md:border-0 pt-2 md:pt-0">
                      <button
                        onClick={() => setSelectedApplicantId(a.id)} // ส่ง ID ของการสมัครเข้าไป
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 md:p-1.5 rounded-xl md:rounded-lg bg-blue-50 md:bg-transparent text-[#E00016] hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="md:hidden text-xs font-bold text-[#E00016]">ดูรายละเอียด</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              แสดง {recentApplicants.length} จากรายการล่าสุด (สูงสุด 5 รายการ)
            </div>
          </div>
        </div>


        {/* Card 6: Bookmarked Candidates */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-300 shadow-lg p-6 flex flex-col h-full">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 leading-tight">
                  ผู้สมัครที่บันทึกไว้
                </h3>
                <p className="text-[10px] text-gray-400 font-medium">
                  {candidates.length} รายการทั้งหมด
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/employer/bookmarks')}
              className="text-sm font-medium flex items-center gap-1 bg-[#020263] text-white rounded-xl px-4 py-2 hover:bg-[#00003D] transition-all shadow-md active:scale-95"
            >
              ดูทั้งหมด
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Table Header - แก้ไข: ซ่อนบนมือถือ */}
          <div className="hidden md:grid grid-cols-12 text-[11px] text-gray-400 font-bold pb-2 border-b border-gray-50 px-2 uppercase tracking-wider">
            <div className="col-span-5">ข้อมูลผู้สมัคร / อีเมล</div>
            <div className="col-span-5">ตำแหน่งที่สนใจ</div>
            <div className="col-span-2 text-right">จัดการ</div>
          </div>

          {/* List Content */}
          <div className="divide-y divide-gray-50 flex-1 overflow-hidden">
            {loadingBookmarks ? (
              <div className="py-10 text-center">
                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">กำลังโหลด...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="py-10 text-center">
                <Heart className="w-10 h-10 text-gray-100 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-medium">ยังไม่มีรายการที่บันทึกไว้</p>
              </div>
            ) : (
              candidates.slice(0, 5).map((candidate) => (
                /* แก้ไข: เปลี่ยน grid เป็น flex-col บนมือถือ */
                <div
                  key={candidate.id}
                  className="flex flex-col md:grid md:grid-cols-12 items-start md:items-center py-4 px-2 hover:bg-gray-50 rounded-xl transition-all group gap-3 md:gap-0"
                >
                  {/* 1. ข้อมูลผู้สมัคร */}
                  <div className="md:col-span-5 flex items-center gap-3 min-w-0 w-full">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 text-xs font-bold border border-pink-200 overflow-hidden shadow-sm">
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                          candidate.fullName?.charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-800 leading-tight truncate group-hover:text-blue-700 transition-colors">
                        {candidate.fullName}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate italic">
                        {candidate.email || "ไม่ได้ระบุอีเมล"}
                      </div>
                    </div>
                  </div>

                  {/* 2. ตำแหน่งที่สนใจ */}
                  <div className="md:col-span-5 min-w-0 w-full md:pr-4">
                    <span className="md:hidden text-[10px] text-gray-400 font-bold block mb-1 uppercase">ตำแหน่งที่สนใจ</span>
                    <div className="text-xs text-gray-600 truncate bg-gray-100/50 md:bg-transparent px-2 py-1 md:p-0 rounded-md inline-block md:block">
                      {candidate.position || 'ไม่ได้ระบุตำแหน่ง'}
                    </div>
                  </div>

                  {/* 3. ปุ่มจัดการ */}
                  <div className="md:col-span-2 w-full flex items-center md:justify-end gap-2 border-t md:border-0 pt-3 md:pt-0">
                    <button
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-[#020263] hover:text-[#020263] transition-all text-sm font-medium shadow-sm"
                      title="ดูหน้าโปรไฟล์"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">ดูโปรไฟล์</span>
                    </button>
                    <button
                      onClick={() => handleUnbookmark(candidate.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2.5 md:py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-medium shadow-sm"
                      title="ลบออกจากรายการที่บันทึก"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="md:hidden">ลบออก</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-400 font-medium">
              แสดง {candidates.slice(0, 5).length} จากรายการล่าสุด (สูงสุด 5 รายการ)
            </p>
          </div>
        </div>
      </div>

      {showVerifyModal && company && (
        <EmployerVerificationModal
          companyId={company.id}
          onClose={() => setShowVerifyModal(false)}
          onSuccess={() => {
            setShowVerifyModal(false);
            const token = localStorage.getItem('accessToken');
            fetch(`${API_URL}/companies/mine`, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.json())
              .then(data => { if (data) setCompany(data); });
          }}
        />
      )}

      {showEditModal && company && (
        <CompanyEditModal
          company={company}
          onClose={() => setShowEditModal(false)}
          onSaved={(updated) => {
            setCompany(updated);
            setShowEditModal(false);
          }}
        />
      )}

      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          isBookmarked={true}
          onBookmarkToggle={() => {
            fetchBookmarks();
          }}
        />
      )}

      {selectedApplicantId && (
        <ApplicantDetailModal
          applicationId={selectedApplicantId}
          onClose={() => setSelectedApplicantId(null)}
        />
      )}
    </div>
  );
}