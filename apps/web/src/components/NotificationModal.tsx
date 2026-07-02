'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { Bell, MailOpen, AtSign, Settings, ArrowLeft, Calendar, Tag, MapPin, Users, Building, Map, Phone, Mail, MessageSquare, Search, X, ChevronRight, CheckCircle } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { getLocalizedNotification } from './NotificationBell';

interface Notification {
  id: string;
  type: string;
  companyId?: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
  applicationId?: string;
  application?: {
    id: string;
    interviewDate?: string;
    job?: {
      id: string;
      title: string;
      slug: string;
      jobType: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryVisible: boolean;
      companyAddress?: string;
      mapUrl?: string;
      company?: {
        id: string;
        name: string;
        slug: string;
        logoUrl?: string;
        bgUrl?: string;
        phone?: string;
        province?: string;
        address?: string;
        size?: string;
        owner?: {
          email: string;
        };
      };
    };
  };
  metadata?: {
    companyBanner?: string;
    companyLogo?: string;
    companyName?: string;
    position?: string;
    interviewDate?: string;
    interviewTime?: string;
    duration?: string;
    interviewType?: string;
    locationName?: string;
    locationAddress?: string;
    salaryRange?: string;
    employmentType?: string;
    recruiterName?: string;
    recruiterRole?: string;
    companyPhone?: string;
    companyEmail?: string;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshBellCount?: () => void;
  initialSelectedNotification?: Notification | null;
}

type FilterTab = 'all' | 'unread' | 'company' | 'system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onRefreshBellCount,
  initialSelectedNotification,
}) => {
  const router = useRouter();
  const tNoti = useTranslations('Notifications');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // 🌟 State ควบคุมการเปิดแสดงมุมมองรายละเอียด 100% ตามที่ออกแบบไว้
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [welcomeMobileMenuOpen, setWelcomeMobileMenuOpen] = useState(false);

  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);

  const computedUnreadCount = React.useMemo(() => {
    if (notifications.length === 0 && unreadCount > 0) {
      return unreadCount;
    }
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications, unreadCount]);

  const lastInitialIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    setLogoError(false);
    setBannerError(false);
  }, [selectedNotification]);
  const [profileName, setProfileName] = useState('Natchapon');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const fetchProfile = async () => {
        try {
          const token = getAccessToken();
          if (!token) return;
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.firstName) {
              setProfileName(data.firstName);
            }
          }
        } catch (err) {
          console.error('Failed to fetch user profile:', err);
        }
      };
      fetchProfile();
    }
  }, [isOpen]);

  const getAccessToken = () => localStorage.getItem('accessToken');

  const fetchNotifications = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    try {
      let url = `${API_URL}/notifications?limit=50`;
      if (activeTab === 'unread') url += '&isRead=false';
      if (activeTab === 'company') url += '&type=COMPANY_RESPONSE';
      if (activeTab === 'system') url += '&type=SYSTEM';

      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isOpen]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();

      const currentId = initialSelectedNotification?.id || null;
      if (currentId !== lastInitialIdRef.current) {
        lastInitialIdRef.current = currentId;
        if (initialSelectedNotification) {
          setSelectedNotification(initialSelectedNotification);
          if (!initialSelectedNotification.isRead) {
            const token = getAccessToken();
            if (token) {
              fetch(`${API_URL}/notifications/${initialSelectedNotification.id}/read`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
              }).then(() => {
                if (onRefreshBellCount) onRefreshBellCount();
                fetchUnreadCount();
                setNotifications(prev =>
                  prev.map(n => n.id === initialSelectedNotification.id ? { ...n, isRead: true } : n)
                );
              }).catch(console.error);
            }
          }
        } else {
          setSelectedNotification(null);
        }
      }
    } else {
      lastInitialIdRef.current = null;
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount, initialSelectedNotification, onRefreshBellCount]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        const token = getAccessToken();
        if (!token) return;

        await fetch(`${API_URL}/notifications/${notification.id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (onRefreshBellCount) onRefreshBellCount();
        fetchUnreadCount();

        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    const locNoti = getLocalizedNotification(notification, tNoti);

    if (notification.metadata || notification.title.includes('สัมภาษณ์') || locNoti.title.includes('สัมภาษณ์') || notification.type === 'GENERAL') {
      setSelectedNotification(notification);
    } else if (notification.linkUrl) {
      onClose();
      router.push(notification.linkUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        if (onRefreshBellCount) onRefreshBellCount();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const filteredNotifications = notifications.filter(n => {
    // 1. Tab Filter
    if (activeTab === 'unread' && n.isRead) {
      return false;
    }
    if (activeTab === 'company') {
      const isCompanyType = ['STATUS_CHANGE', 'INTERVIEW_SCHEDULED', 'COMPANY_RESPONSE'].includes(n.type);
      if (!isCompanyType) return false;
    }
    if (activeTab === 'system') {
      const isCompanyType = ['STATUS_CHANGE', 'INTERVIEW_SCHEDULED', 'COMPANY_RESPONSE'].includes(n.type);
      if (isCompanyType) return false;
    }

    // 2. Search Query Filter
    const locNoti = getLocalizedNotification(n, tNoti);
    return (
      locNoti.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      locNoti.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'เมื่อครู่นี้';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  // ดึงข้อมูลจริงจาก relation หรือ fallback เป็น metadata
  const selectedApp = selectedNotification?.application;
  const selectedJob = selectedApp?.job;
  const selectedCompany = selectedJob?.company;

  const displayCompanyName = selectedCompany?.name || selectedNotification?.metadata?.companyName || 'NovaTech Solutions';
  const displayCompanyLogo = selectedCompany?.logoUrl || selectedNotification?.metadata?.companyLogo;
  const displayCompanyBanner = selectedCompany?.bgUrl || selectedNotification?.metadata?.companyBanner;

  let displayInterviewDate = selectedNotification?.metadata?.interviewDate || '25 June 2026';
  let displayInterviewTime = selectedNotification?.metadata?.interviewTime || '14:00';

  if (selectedApp?.interviewDate) {
    const iDate = new Date(selectedApp.interviewDate);
    displayInterviewDate = iDate.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Bangkok'
    });
    displayInterviewTime = iDate.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
  }

  const displayPosition = selectedJob?.title || selectedNotification?.metadata?.position || 'UX/UI Designer';

  const displayEmploymentType = selectedJob?.jobType ? (
    selectedJob.jobType === 'FULL_TIME' ? 'งานประจำ (Full Time)' :
      selectedJob.jobType === 'PART_TIME' ? 'งานพาร์ทไทม์ (Part Time)' :
        selectedJob.jobType === 'CONTRACT' ? 'งานสัญญาจ้าง (Contract)' :
          selectedJob.jobType === 'INTERNSHIP' ? 'ฝึกงาน (Internship)' :
            selectedJob.jobType === 'FREELANCE' ? 'ฟรีแลนซ์ (Freelance)' :
              selectedJob.jobType
  ) : selectedNotification?.metadata?.employmentType || 'Technology';

  const displayLocationName = selectedCompany?.province || selectedNotification?.metadata?.locationName || 'Bangkok';
  const displayLocationAddress = selectedCompany?.address || selectedNotification?.metadata?.locationAddress || '88 Sukhumvit Road, 12th Floor, Room A1203';

  const displaySalaryRange = selectedJob ? (
    selectedJob.salaryVisible && (selectedJob.salaryMin || selectedJob.salaryMax) ? (
      `${selectedJob.salaryMin ? Number(selectedJob.salaryMin).toLocaleString() : '0'} - ${selectedJob.salaryMax ? Number(selectedJob.salaryMax).toLocaleString() : 'N/A'} THB`
    ) : 'ไม่ระบุเงินเดือน'
  ) : selectedNotification?.metadata?.salaryRange || '35k-50k THB';

  const displayCompanyPhone = selectedCompany?.phone || selectedNotification?.metadata?.companyPhone || '02-123-4567';
  const displayCompanyEmail = selectedCompany?.owner?.email || selectedNotification?.metadata?.companyEmail || 'contact@novatech.com';

  const locDetail = selectedNotification ? getLocalizedNotification(selectedNotification, tNoti) : null;

  const getNotificationParams = (value?: string) => {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed?.params || {};
    } catch {
      return {};
    }
  };

  const isWelcomeNotification = selectedNotification
    ? selectedNotification.title.includes('title_register_success') ||
    selectedNotification.message.includes('msg_register_success')
    : false;

  const welcomeParams = selectedNotification
    ? {
      ...getNotificationParams(selectedNotification.title),
      ...getNotificationParams(selectedNotification.message),
    }
    : {};

  const welcomeName =
    typeof welcomeParams.name === 'string' && welcomeParams.name.trim()
      ? welcomeParams.name
      : profileName;

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-[#1a1c3d]/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
      `}} />


      {/* Mobile Notification Modal */}
      <div className="md:hidden w-full max-w-md h-[95vh] bg-white shadow-2xl border border-white/30 overflow-hidden rounded-3xl animate-in zoom-in-95 duration-200 relative">
        {welcomeMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[10000] bg-black/50"
            onClick={() => setWelcomeMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 right-0 h-full z-[10001] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            welcomeMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width: 300 }}
        >
          <div className="px-6 pt-8 pb-6 flex items-center justify-between border-b border-slate-100">
            <h2 className="text-2xl font-bold text-[#0F172A]">Notifications</h2>
            <button
              onClick={() => setWelcomeMobileMenuOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              aria-label="ปิด"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="mb-8">
              <p className="px-6 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">MAIN</p>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => { setActiveTab('all'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                  className={`w-full mx-4 px-4 py-3 flex items-center gap-4 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                    activeTab === 'all' && !selectedNotification ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                  style={{
                    width: 'calc(100% - 2rem)',
                    backgroundColor: activeTab === 'all' && !selectedNotification ? '#0F172A' : undefined,
                  }}
                >
                  <Bell size={20} className={activeTab === 'all' && !selectedNotification ? 'text-white' : 'text-slate-400'} />
                  ทั้งหมด
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('unread'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                  className={`w-full mx-4 px-4 py-3 flex items-center justify-between gap-4 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                    activeTab === 'unread' && !selectedNotification ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                  style={{
                    width: 'calc(100% - 2rem)',
                    backgroundColor: activeTab === 'unread' && !selectedNotification ? '#0F172A' : undefined,
                  }}
                >
                  <span className="flex items-center gap-4">
                    <MailOpen size={20} className={activeTab === 'unread' && !selectedNotification ? 'text-white' : 'text-slate-400'} />
                    ยังไม่ได้อ่าน
                  </span>
                  {computedUnreadCount > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {computedUnreadCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('company'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                  className={`w-full mx-4 px-4 py-3 flex items-center gap-4 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                    activeTab === 'company' && !selectedNotification ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                  style={{
                    width: 'calc(100% - 2rem)',
                    backgroundColor: activeTab === 'company' && !selectedNotification ? '#0F172A' : undefined,
                  }}
                >
                  <AtSign size={20} className={activeTab === 'company' && !selectedNotification ? 'text-white' : 'text-slate-400'} />
                  การตอบรับจากบริษัท
                </button>
              </div>
            </div>

            <div>
              <p className="px-6 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest">PREFERENCES</p>
              <button
                type="button"
                onClick={() => { setActiveTab('system'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                className={`w-full mx-4 px-4 py-3 flex items-center gap-4 rounded-xl cursor-pointer transition-colors text-sm font-medium ${
                  activeTab === 'system' && !selectedNotification ? 'text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}
                style={{
                  width: 'calc(100% - 2rem)',
                  backgroundColor: activeTab === 'system' && !selectedNotification ? '#0F172A' : undefined,
                }}
              >
                <Settings size={20} className={activeTab === 'system' && !selectedNotification ? 'text-white' : 'text-slate-400'} />
                ระบบ
              </button>
            </div>
          </div>
        </aside>

        <main className="bg-white h-full relative flex flex-col">
          <nav className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => {
                if (selectedNotification) {
                  onClose();
                } else {
                  onClose();
                }
              }}
              className="flex items-center font-medium active:scale-95 transition-all"
              style={{ color: '#635BFF' }}
              aria-label="กลับ"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-lg font-semibold text-[#1E1B4B]">
              {selectedNotification
                ? isWelcomeNotification
                  ? 'Welcome Detail'
                  : 'Notification Detail'
                : activeTab === 'all'
                  ? 'ทั้งหมด'
                  : activeTab === 'unread'
                    ? 'ยังไม่ได้อ่าน'
                    : activeTab === 'company'
                      ? 'การตอบรับจากบริษัท'
                      : 'ระบบ'}
            </h1>

            <button
              type="button"
              onClick={() => setWelcomeMobileMenuOpen(true)}
              aria-label="Menu"
              className="p-1 active:scale-95 transition-all text-[#1E1B4B]"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </button>
          </nav>

          {selectedNotification ? (
            isWelcomeNotification ? (
              <>
                <div className="flex-1 overflow-y-auto bg-white">
                  <section className="relative h-56 w-full overflow-hidden shrink-0">
                    <img
                      alt="Welcome Illustration"
                      className="w-full h-full object-cover"
                      src="/images/messageImage_1782791898599.jpg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                      <h2 className="text-white text-2xl font-bold">Welcome to WorksDD</h2>
                      <p className="text-white/80 text-sm">Your journey to a dream career starts here.</p>
                    </div>
                  </section>

                  <section className="p-6 space-y-6">
                    <div className="flex justify-between items-start gap-3">
                      <h3 className="text-xl font-bold text-slate-800 leading-tight">Hello {welcomeName} 👋</h3>
                      <span className="text-xs shrink-0 mt-1 text-slate-500">
                        Received {formatRelativeTime(selectedNotification.createdAt)}
                      </span>
                    </div>

                    <div className="leading-relaxed text-sm text-slate-600">
                      <p>{locDetail?.message || 'Welcome to WorksDD. Your account has been created successfully.'}</p>
                    </div>

                    <div className="rounded-2xl p-5 border bg-[#f7f7ff] border-[#F0F0FF]">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Profile Completion
                        </span>
                        <span className="font-bold text-[#635BFF]">25%</span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full mb-6">
                        <div className="h-2 rounded-full bg-[#635BFF] w-1/4" />
                      </div>

                      <ul className="space-y-4">
                        <li className="flex items-center text-sm text-slate-700">
                          <CheckCircle size={20} className="mr-3 shrink-0 text-[#635BFF]" />
                          <span>Create Account</span>
                        </li>
                        {['Upload Resume', 'Complete Profile', 'Enable AI Matching'].map((label) => (
                          <li key={label} className="flex items-center text-sm text-slate-400">
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 mr-3 shrink-0" />
                            <span>{label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <Search size={24} className="mb-2 text-[#635BFF]" />
                        <h4 className="font-bold text-sm">Find Jobs</h4>
                        <p className="text-xs text-slate-500">Smart search filters</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <Bell size={24} className="mb-2 text-[#635BFF]" />
                        <h4 className="font-bold text-sm">AI Matching</h4>
                        <p className="text-xs text-slate-500">Personalized roles</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-6 pb-6">
                      <button
                        onClick={() => {
                          router.push('/coming-soon/jobseeker');
                          onClose();
                        }}
                        className="w-full bg-white font-bold py-3 rounded-xl transition-colors text-sm active:scale-95 border-2 border-[#635BFF] text-[#635BFF]"
                      >
                        Open User Guide
                      </button>
                      <button
                        onClick={() => {
                          router.push('/jobs');
                          onClose();
                        }}
                        className="w-full text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm hover:opacity-90 bg-[#635BFF]"
                      >
                        Start Exploring Jobs
                      </button>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto bg-white">
                <section className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {locDetail?.title || selectedNotification.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Received {formatRelativeTime(selectedNotification.createdAt)}
                      </p>
                    </div>
                    {!selectedNotification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#635BFF] shrink-0 mt-2" />
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <p className="text-sm leading-relaxed text-slate-600">
                      {locDetail?.message || selectedNotification.message}
                    </p>
                  </div>

                  {(selectedCompany || selectedJob || selectedNotification.metadata) && (
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#1a1c3d] text-white flex items-center justify-center font-bold overflow-hidden">
                          {selectedLogo && !logoError ? (
                            <img
                              src={selectedLogo}
                              alt={displayCompanyName}
                              className="w-full h-full object-cover"
                              onError={() => setLogoError(true)}
                            />
                          ) : (
                            displayCompanyName.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{displayCompanyName}</p>
                          <p className="text-xs text-slate-500 truncate">{displayJobTitle}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-slate-400" />
                          <span>{displayLocationName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag size={16} className="text-slate-400" />
                          <span>{displaySalaryRange}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-slate-400" />
                          <span>{displayInterviewDate} {displayInterviewTime}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedNotification.linkUrl && (
                    <button
                      onClick={() => {
                        onClose();
                        router.push(selectedNotification.linkUrl || '/');
                      }}
                      className="w-full text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm bg-[#635BFF]"
                    >
                      เปิดรายละเอียด
                    </button>
                  )}
                </section>
              </div>
            )
          ) : filteredNotifications.length > 0 ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <section className="p-4 space-y-3">
                {filteredNotifications.map((noti) => {
                  const locNoti = getLocalizedNotification(noti, tNoti);
                  return (
                    <button
                      key={noti.id}
                      type="button"
                      onClick={() => handleNotificationClick(noti)}
                      className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-left flex items-center gap-4 shadow-sm active:scale-[0.99] transition-all"
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        !noti.isRead ? 'bg-[#eef2ff] text-[#635BFF]' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {noti.title.includes('title_register_success') || noti.message.includes('msg_register_success') ? (
                          <span className="text-xl">🎉</span>
                        ) : (
                          <Bell size={20} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-bold text-slate-900 truncate">{locNoti.title}</p>
                          {!noti.isRead && <span className="w-2 h-2 rounded-full bg-[#635BFF] shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{locNoti.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(noti.createdAt)}</p>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 shrink-0" />
                    </button>
                  );
                })}
              </section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-8 text-center flex-1">
              <Bell size={88} className="mb-6 text-slate-200" />
              <h3 className="text-xl font-bold mb-2 text-[#0F172A]">ไม่มีการแจ้งเตือน</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                คุณจะได้รับการแจ้งเตือนที่นี่เมื่อมีข่าวสารใหม่ๆ
              </p>
            </div>
          )}
        </main>
      </div>


      {/* Main Updated Notification Modal Frame */}
      <div className="hidden md:flex bg-white w-full max-w-[940px] h-[85vh] shadow-2xl border border-white/30 overflow-hidden rounded-3xl animate-in zoom-in-95 duration-200">

        {/* Sidebar */}
        <aside className={`${selectedNotification && isWelcomeNotification ? 'hidden md:flex' : 'flex'} w-[280px] bg-[#f1f4f9] border-r border-gray-200 flex-col shrink-0`}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[22px] font-bold text-[#1a1c3d] tracking-tight">Notifications</h2>
              {computedUnreadCount > 0 && (
                <div className="bg-[#5b4df2]/10 text-[#5b4df2] px-2.5 py-1 rounded-full text-[11px] font-bold">{computedUnreadCount} New</div>
              )}
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-bold text-[#45464e] uppercase tracking-[0.15em] mb-4 ml-1">Main</h3>
                <nav className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('all'); setSelectedNotification(null); }}
                    className={`flex items-center justify-between px-5 py-3.5 w-full rounded-2xl transition-all ${activeTab === 'all' && !selectedNotification ? 'bg-[#5b4df2] text-white shadow-lg shadow-[#5b4df2]/30 font-bold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="flex-shrink-0" />
                      <span className="text-[14px]">ทั้งหมด</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('unread'); setSelectedNotification(null); }}
                    className={`flex items-center justify-between px-5 py-3.5 w-full rounded-2xl transition-all ${activeTab === 'unread' && !selectedNotification ? 'bg-[#5b4df2] text-white shadow-lg shadow-[#5b4df2]/30 font-bold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <MailOpen size={20} className="flex-shrink-0" />
                      <span className="text-[14px]">ยังไม่ได้อ่าน</span>
                    </div>
                    {computedUnreadCount > 0 && (
                      <span className="text-[11px] font-bold bg-gray-200/60 px-1.5 rounded-md text-gray-700">{computedUnreadCount}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('company'); setSelectedNotification(null); }}
                    className={`flex items-center justify-between px-5 py-3.5 w-full rounded-2xl transition-all ${activeTab === 'company' && !selectedNotification ? 'bg-[#5b4df2] text-white shadow-lg shadow-[#5b4df2]/30 font-bold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <AtSign size={20} className="flex-shrink-0" />
                      <span className="text-[14px]">การตอบรับจากบริษัท</span>
                    </div>
                  </button>
                </nav>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-[#45464e] uppercase tracking-[0.15em] mb-4 ml-1">Preferences</h3>
                <nav className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('system'); setSelectedNotification(null); }}
                    className={`flex items-center gap-3 px-5 py-3.5 w-full rounded-2xl transition-all ${activeTab === 'system' && !selectedNotification ? 'bg-[#5b4df2] text-white font-bold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <Settings size={20} className="flex-shrink-0" />
                    <span className="text-[14px]">ระบบ</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8 pt-0">
            <div className="bg-[#5b4df2]/10 rounded-3xl p-5 border border-[#5b4df2]/10">
              <p className="text-[11px] font-bold text-[#5b4df2] uppercase mb-1.5">AI Match Status</p>
              <p className="text-[13px] text-[#1a1c3d] leading-tight font-semibold mb-4">Today your skills matched with 5 high-priority roles.</p>
              <div className="h-2 w-full bg-white/60 rounded-full overflow-hidden">
                <div className="h-full bg-[#5b4df2] w-[85%] rounded-full"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Panel */}
        <main className="flex-grow flex flex-col bg-white min-w-0">

          {selectedNotification ? (
            isWelcomeNotification ? (
              <>
                {/* Desktop Welcome เดิม */}
                <div className="hidden md:flex flex-grow flex-col h-full bg-white animate-in slide-in-from-right duration-300">
                  <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 shrink-0">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedNotification(null)}
                        className="flex items-center gap-2 text-[#5b4df2] font-bold text-[14px] hover:bg-[#5b4df2]/5 px-3 py-2 rounded-xl transition-all"
                      >
                        <ArrowLeft size={20} className="flex-shrink-0" />
                        Back to Notifications
                      </button>
                      <div className="h-4 w-px bg-gray-200"></div>
                      <h2 className="text-[16px] font-bold text-[#1a1c3d]">Welcome Detail</h2>
                    </div>
                    <span className="text-[11px] font-medium text-[#45464e]/60">Received {formatRelativeTime(selectedNotification.createdAt)}</span>
                  </header>

                  <div className="flex-grow overflow-y-auto custom-scrollbar bg-white">
                    <div className="relative h-64 overflow-hidden">
                      <div
                        className="relative h-[260px] overflow-hidden bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(90deg, rgba(35,18,89,0.9), rgba(35,18,89,0.35)), url('/images/messageImage_1782791898599.jpg')`,
                        }}
                      >
                        <div className="absolute bottom-10 left-10 right-10">
                          <h2 className="text-4xl font-bold text-white">
                            Welcome to WorksDD
                          </h2>
                          <p className="mt-2 text-white/90">
                            Your journey to a dream career starts here.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-10 py-10 relative z-10">
                      <div className="space-y-8">
                        <div>
                          <h2 className="text-[26px] font-bold text-[#1a1c3d] mb-3">Hello {welcomeName} 👋</h2>
                          <p className="text-[15px] text-[#45464e] leading-relaxed max-w-3xl">
                            {locDetail?.message || 'Welcome to WorksDD. Your account has been created successfully.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="rounded-3xl border border-gray-100 shadow-sm p-6 bg-white">
                            <div className="flex items-center justify-between mb-5">
                              <p className="text-[11px] font-bold text-[#45464e] uppercase tracking-wider">Profile Completion</p>
                              <span className="text-[#5b4df2] font-bold text-[14px]">25%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
                              <div className="h-full bg-[#5b4df2] w-1/4 rounded-full"></div>
                            </div>
                            <div className="space-y-4 text-[14px] text-[#1a1c3d]">
                              <div className="flex items-center gap-3">
                                <CheckCircle size={22} className="text-[#5b4df2]" />
                                <span>Create Account</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-[22px] h-[22px] rounded-full border-2 border-[#45464e]/60 block"></span>
                                <span>Upload Resume</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-[22px] h-[22px] rounded-full border-2 border-[#45464e]/60 block"></span>
                                <span>Complete Profile</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="w-[22px] h-[22px] rounded-full border-2 border-[#45464e]/60 block"></span>
                                <span>Enable AI Matching</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-2xl bg-[#eef2ff] p-5 border border-[#5b4df2]/5">
                              <Search size={24} className="text-[#5b4df2] mb-5" />
                              <p className="font-bold text-[#1a1c3d] text-[15px]">Find Jobs</p>
                              <p className="text-[12px] text-[#45464e] leading-tight">Smart search filters</p>
                            </div>
                            <div className="rounded-2xl bg-[#eef2ff] p-5 border border-[#5b4df2]/5">
                              <Bell size={24} className="text-[#5b4df2] mb-5" />
                              <p className="font-bold text-[#1a1c3d] text-[15px]">AI Matching</p>
                              <p className="text-[12px] text-[#45464e] leading-tight">Personalized roles</p>
                            </div>
                            <div className="rounded-2xl bg-[#eef2ff] p-5 border border-[#5b4df2]/5">
                              <Building size={24} className="text-[#5b4df2] mb-5" />
                              <p className="font-bold text-[#1a1c3d] text-[15px]">Follow Companies</p>
                              <p className="text-[12px] text-[#45464e] leading-tight">Get latest updates</p>
                            </div>
                            <div className="rounded-2xl bg-[#eef2ff] p-5 border border-[#5b4df2]/5">
                              <Tag size={24} className="text-[#5b4df2] mb-5" />
                              <p className="font-bold text-[#1a1c3d] text-[15px]">Career Insights</p>
                              <p className="text-[12px] text-[#45464e] leading-tight">Market trends</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <footer className="h-20 px-8 border-t border-gray-100 flex items-center justify-end gap-4 bg-white shrink-0">
                    <button
                      onClick={() => {
                        router.push('/coming-soon/jobseeker');
                        onClose();
                      }}
                      className="px-6 py-3 rounded-2xl text-[14px] font-bold text-[#45464e] hover:bg-gray-100 transition-all"
                    >
                      Open User Guide
                    </button>
                    <button
                      onClick={() => {
                        router.push('/jobs');
                        onClose();
                      }}
                      className="px-8 py-3 rounded-2xl bg-[#5b4df2] text-white text-[14px] font-bold shadow-lg shadow-[#5b4df2]/20 hover:shadow-xl transition-all"
                    >
                      Start Exploring Jobs
                    </button>
                  </footer>
                </div>

                {/* Mobile Welcome ใหม่ */}
                <div className="md:hidden flex-grow flex flex-col h-full bg-white">
                  {welcomeMobileMenuOpen && (
                    <div
                      className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm"
                      onClick={() => setWelcomeMobileMenuOpen(false)}
                    />
                  )}

                  <aside
                    className={`fixed top-0 right-0 h-full w-72 z-[10001] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                      welcomeMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                  >
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Notifications</h2>
                      <button
                        onClick={() => setWelcomeMobileMenuOpen(false)}
                        aria-label="ปิดเมนู"
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 active:scale-90 transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-7">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">
                          Main
                        </p>
                        <ul className="space-y-1">
                          <li>
                            <button
                              onClick={() => { setActiveTab('all'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-white shadow-md active:scale-95 transition-all bg-[#635BFF]"
                            >
                              <Bell size={20} />
                              ทั้งหมด
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => { setActiveTab('unread'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                            >
                              <span className="flex items-center gap-3">
                                <MailOpen size={20} className="text-slate-400" />
                                ยังไม่ได้อ่าน
                              </span>
                              {computedUnreadCount > 0 && (
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {computedUnreadCount}
                                </span>
                              )}
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => { setActiveTab('company'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                            >
                              <AtSign size={20} className="text-slate-400" />
                              การตอบรับจากบริษัท
                            </button>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">
                          Preferences
                        </p>
                        <button
                          onClick={() => { setActiveTab('system'); setSelectedNotification(null); setWelcomeMobileMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                        >
                          <Settings size={20} className="text-slate-400" />
                          ระบบ
                        </button>
                      </div>
                    </nav>
                  </aside>

                  <nav className="sticky top-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex items-center font-medium text-[#635BFF]"
                      aria-label="Back to previous page"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <h1 className="text-lg font-semibold text-[#1E1B4B]">
                      Welcome Detail
                    </h1>

                    <button
                      type="button"
                      onClick={() => setWelcomeMobileMenuOpen(true)}
                      aria-label="Menu"
                      className="active:scale-95 transition-all text-[#1E1B4B]"
                    >
                      <span className="block w-6 h-0.5 bg-current mb-1.5 rounded-full" />
                      <span className="block w-6 h-0.5 bg-current mb-1.5 rounded-full" />
                      <span className="block w-6 h-0.5 bg-current rounded-full" />
                    </button>
                  </nav>

                  <div className="flex-1 overflow-y-auto bg-white">
                    <section className="relative h-56 w-full overflow-hidden shrink-0">
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.05)), url('/images/messageImage_1782791898599.jpg')`,
                        }}
                      />
                      <div className="absolute inset-0 flex flex-col justify-end p-6">
                        <h2 className="text-white text-2xl font-bold">Welcome to WorksDD</h2>
                        <p className="text-white/80 text-sm">Your journey to a dream career starts here.</p>
                      </div>
                    </section>

                    <section className="p-6 space-y-6">
                      <div className="flex justify-between items-start gap-3">
                        <h3 className="text-xl font-bold text-slate-800 leading-tight">Hello {welcomeName} 👋</h3>
                        <span className="text-xs shrink-0 mt-1 text-slate-500">
                          Received {formatRelativeTime(selectedNotification.createdAt)}
                        </span>
                      </div>

                      <div className="leading-relaxed text-sm text-slate-600">
                        <p>{locDetail?.message || 'Welcome to WorksDD. Your account has been created successfully.'}</p>
                      </div>

                      <div className="rounded-2xl p-5 border bg-[#f7f7ff] border-[#F0F0FF]">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Profile Completion
                          </span>
                          <span className="font-bold text-[#635BFF]">
                            25%
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 h-2 rounded-full mb-6">
                          <div className="h-2 rounded-full bg-[#635BFF] w-1/4" />
                        </div>

                        <ul className="space-y-4">
                          <li className="flex items-center text-sm text-slate-700">
                            <CheckCircle size={20} className="mr-3 shrink-0 text-[#635BFF]" />
                            <span>Create Account</span>
                          </li>
                          <li className="flex items-center text-sm text-slate-400">
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 mr-3 shrink-0" />
                            <span>Upload Resume</span>
                          </li>
                          <li className="flex items-center text-sm text-slate-400">
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 mr-3 shrink-0" />
                            <span>Complete Profile</span>
                          </li>
                          <li className="flex items-center text-sm text-slate-400">
                            <div className="h-5 w-5 rounded-full border-2 border-slate-300 mr-3 shrink-0" />
                            <span>Enable AI Matching</span>
                          </li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <Search size={24} className="mb-2 text-[#635BFF]" />
                          <h4 className="font-bold text-sm">Find Jobs</h4>
                          <p className="text-xs text-slate-500">Smart search filters</p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <Bell size={24} className="mb-2 text-[#635BFF]" />
                          <h4 className="font-bold text-sm">AI Matching</h4>
                          <p className="text-xs text-slate-500">Personalized roles</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-6 pb-6">
                        <button
                          onClick={() => {
                            router.push('/coming-soon/jobseeker');
                            onClose();
                          }}
                          className="w-full bg-white font-bold py-3 rounded-xl transition-colors text-sm active:scale-95 border-2 border-[#635BFF] text-[#635BFF]"
                        >
                          Open User Guide
                        </button>

                        <button
                          onClick={() => {
                            router.push('/jobs');
                            onClose();
                          }}
                          className="w-full text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm hover:opacity-90 bg-[#635BFF]"
                        >
                          Start Exploring Jobs
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            ) : (
              /* ─── มุมมองหน้าต่างย่อยขยายดีเทล 100% ตามดีไซน์ (รูปที่ 3) ─── */
              <div className="flex-grow flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
                <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 shrink-0">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedNotification(null)}
                      className="flex items-center gap-2 text-[#5b4df2] font-bold text-[14px] hover:bg-[#5b4df2]/5 px-3 py-2 rounded-xl transition-all"
                    >
                      <ArrowLeft size={20} className="flex-shrink-0" />
                      Back to Notifications
                    </button>
                    <div className="h-4 w-px bg-gray-200"></div>
                    <h2 className="text-[14px] font-bold text-[#1a1c3d]">Notification Detail</h2>
                  </div>
                  <span className="text-[11px] font-medium text-[#45464e]/60">Received {formatRelativeTime(selectedNotification.createdAt)}</span>
                </header>

                <div className="flex-grow overflow-y-auto custom-scrollbar">
                  {/* Company Hero Section Banner */}
                  <div className="relative">
                    {displayCompanyBanner && !bannerError ? (
                      <Image
                        src={displayCompanyBanner}
                        alt={`${displayCompanyName} Banner`}
                        width={940} // Adjust based on your design's max-w
                        height={192} // h-48 = 192px
                        className="h-48 w-full object-cover"
                        priority
                        onError={() => setBannerError(true)}
                      />
                    ) : (
                      <div className="h-48 w-full bg-[#000240] overflow-hidden">
                        <div className="w-full h-full opacity-70 bg-gradient-to-r from-purple-900 to-indigo-900" />
                      </div>
                    )}
                  </div>

                  <div className="px-8 pb-4 relative z-10">
                    <div className="flex gap-6">
                      {/* Logo Container overlapping the banner */}
                      <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-xl border border-white/20 -mt-12 flex-shrink-0 relative z-20">
                        {displayCompanyLogo && !logoError ? (
                          <Image
                            src={displayCompanyLogo}
                            alt={`${displayCompanyName} Logo`}
                            width={88}
                            height={88}
                            className="w-full h-full rounded-[20px] object-contain flex-shrink-0"
                            onError={() => setLogoError(true)}
                          />
                        ) : (
                          <div className="w-full h-full rounded-[20px] bg-[#1a1c3d] text-white flex items-center justify-center font-bold text-2xl">
                            {displayCompanyName.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Text content starting fully in the white space below the banner cover */}
                      <div className="pt-2 flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="font-bold text-[#1a1c3d] text-[28px] truncate">{displayCompanyName}</h1>
                          <CheckCircle size={20} className="text-[#5b4df2] flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-[#45464e] font-medium flex-wrap">
                          <span className="flex items-center gap-1"><Tag size={16} className="flex-shrink-0" /> {displayEmploymentType}</span>
                          <span className="flex items-center gap-1"><MapPin size={16} className="flex-shrink-0" /> {displayLocationName}</span>
                          <span className="flex items-center gap-1"><Users size={16} className="flex-shrink-0" /> {selectedCompany?.size ? `${selectedCompany.size} Employees` : '500+ Employees'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-8">
                    {/* Invitation Headline */}
                    <div className="space-y-4">
                      <h2 className="text-[20px] font-bold text-[#1a1c3d] flex items-center gap-2 mb-4">
                        <Calendar size={20} className="flex-shrink-0" /> {locDetail?.title || 'Notification Detail'}
                      </h2>
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 space-y-4 shadow-sm text-ellipsis overflow-hidden">
                        <p className="text-[14px] font-bold text-[#1a1c3d]">{tNoti('dear', { name: profileName })}</p>
                        <p className="text-[14px] text-[#45464e] leading-relaxed">
                          {tNoti('intro_text')}
                        </p>
                        <div className="bg-[#5b4df2]/5 border border-[#5b4df2]/15 p-5 rounded-2xl">
                          <p className="text-[14px] font-semibold text-[#5b4df2] leading-relaxed">
                            {locDetail?.message}
                          </p>
                        </div>
                        <p className="text-[13px] text-[#45464e]/80 leading-relaxed">
                          {tNoti('outro_text')}
                        </p>
                      </div>
                    </div>

                    {/* Summary Grid Info */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3">
                        <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-wider mb-4">Interview Details</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Type</span><span className="font-bold text-[#1a1c3d] truncate">{selectedNotification.metadata?.interviewType || 'On-site'}</span></div>
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Position</span><span className="font-bold text-[#1a1c3d] truncate">{displayPosition}</span></div>
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Date</span><span className="font-bold text-[#1a1c3d] truncate">{displayInterviewDate}</span></div>
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Time</span><span className="font-bold text-[#1a1c3d] truncate">{displayInterviewTime} น.</span></div>
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Duration</span><span className="font-bold text-[#1a1c3d] truncate">{selectedNotification.metadata?.duration || '60 Min'}</span></div>
                          <div className="flex justify-between text-[14px]"><span className="text-[#45464e]">Status</span><span className="px-2 py-0.5 bg-[#5b4df2]/10 text-[#5b4df2] rounded-md font-bold text-[11px]">Scheduled</span></div>
                        </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-wider mb-4">Location</h3>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#5b4df2]/10 flex items-center justify-center shrink-0 flex-shrink-0">
                            <Building size={20} className="text-[#5b4df2]" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-[#1a1c3d] truncate">{displayLocationName}</p>
                            <p className="text-[13px] text-[#45464e] mt-1 line-clamp-2">{displayLocationAddress}</p>
                            {selectedJob?.mapUrl && (
                              <a
                                href={selectedJob.mapUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 text-[#5b4df2] text-[12px] font-bold inline-flex items-center gap-1 hover:underline"
                              >
                                <Map size={16} className="flex-shrink-0" /> Open in Maps
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recruiter & Financial Info Row */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center font-bold text-[#1a1c3d] flex-shrink-0">
                          <Building size={32} className="text-gray-600" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[14px] font-bold text-[#1a1c3d] truncate">ข้อมูลติดต่อส่วนกลางของบริษัท</p>
                          <p className="text-[12px] text-[#45464e] truncate">{displayCompanyName}</p>
                          <div className="flex gap-2 mt-3 flex-wrap">
                            <a href={`tel:${displayCompanyPhone}`} className="p-2 rounded-lg bg-gray-100 text-[#45464e] hover:bg-[#5b4df2] hover:text-white transition-all" title="โทรศัพท์"><Phone size={18} /></a>
                            <a href={`mailto:${displayCompanyEmail}`} className="p-2 rounded-lg bg-gray-100 text-[#45464e] hover:bg-[#5b4df2] hover:text-white transition-all" title="อีเมล"><Mail size={18} /></a>
                            <button className="p-2 rounded-lg bg-gray-100 text-[#45464e] hover:bg-[#5b4df2] hover:text-white transition-all" title="แชท"><MessageSquare size={18} /></button>
                          </div>
                        </div>
                      </div>

                      {/* Employment & Salary Info */}
                      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-3 flex-shrink-0 min-w-0">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#45464e] uppercase">Employment</span>
                          <span className="text-[14px] font-bold text-[#1a1c3d] truncate">{displayEmploymentType}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#45464e] uppercase">Salary</span>
                          <span className="text-[14px] font-bold text-[#1a1c3d] truncate">{displaySalaryRange}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons Footer (Sticky) */}
                <footer className="h-20 px-8 border-t border-gray-100 flex items-center justify-end gap-4 bg-white shrink-0">
                  <button
                    onClick={() => {
                      if (selectedJob?.slug) {
                        router.push(`/jobs/${selectedJob.slug}`);
                      } else if (selectedNotification.linkUrl) {
                        router.push(selectedNotification.linkUrl);
                      }
                      onClose();
                    }}
                    className="px-6 py-3 rounded-2xl text-[14px] font-bold text-[#45464e] hover:bg-gray-100 transition-all"
                  >
                    View Job Posting
                  </button>
                  <button
                    onClick={() => {
                      if (selectedCompany?.slug) {
                        router.push(`/companies/${selectedCompany.slug}`);
                      }
                      onClose();
                    }}
                    className="px-8 py-3 rounded-2xl bg-[#5b4df2] text-white text-[14px] font-bold shadow-lg shadow-[#5b4df2]/20 hover:shadow-xl transition-all"
                  >
                    View Company Profile
                  </button>
                </footer>
              </div>
            )
          ) : (
            /* ─── มุมมองรายการ Feed หลัก ─── */
            <>
              <header className="h-16 px-8 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-4 flex-grow max-w-md">
                  <div className="relative w-full">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464e]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search notifications..."
                      className="w-full bg-[#f1f3f9] border-none rounded-2xl pl-10 pr-4 py-2 text-[14px] focus:ring-2 focus:ring-[#5b4df2]/20 placeholder:text-[#45464e]/60 text-[#0b1c30]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-4 shrink-0">
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[14px] font-bold text-[#5b4df2] hover:text-[#5b4df2]/80 transition-colors"
                  >
                    ทำเป็นอ่านแล้วทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-[#f1f3f9] hover:bg-gray-200 rounded-xl transition-all border border-gray-100 shadow-sm text-[#1a1c3d]"
                  >
                    <X size={22} />
                  </button>
                </div>
              </header>

              <div className="flex-grow overflow-y-auto custom-scrollbar p-8 bg-[#f8f9ff]">
                {loading ? (
                  <div className="flex justify-center items-center h-full text-[14px] text-[#45464e]">กำลังโหลดข้อมูล...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-[14px] text-[#45464e]">ไม่มีการแจ้งเตือนในหมวดหมู่นี้</div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[11px] font-bold text-[#45464e] uppercase tracking-[0.2em] mb-4 ml-1">Today</h3>
                      <div className="space-y-3">
                        {filteredNotifications.map((noti) => {
                          const locNoti = getLocalizedNotification(noti, tNoti);
                          return (
                            <div
                              key={noti.id}
                              onClick={() => handleNotificationClick(noti)}
                              className="group relative bg-white hover:shadow-xl hover:shadow-[#1a1c3d]/5 transition-all p-4 rounded-2xl border border-gray-100 cursor-pointer flex items-center gap-4"
                            >
                              <div className="w-12 h-12 bg-[#1a1c3d] text-white flex items-center justify-center rounded-2xl shrink-0 shadow-lg">
                                {noti.title.includes('สัมภาษณ์') || noti.type === 'COMPANY_RESPONSE' ?
                                  <Calendar size={24} /> : <Bell size={24} />
                                }
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-2 min-w-0 flex-grow">
                                    <p className="text-[14px] font-bold text-[#1a1c3d] truncate">{locNoti.title}</p>
                                    {!noti.isRead && <div className="w-2 h-2 rounded-full bg-[#5b4df2] shrink-0" aria-label="Unread notification indicator"></div>}
                                  </div>
                                  <span className="text-[11px] text-[#45464e] font-medium shrink-0 ml-2">{formatRelativeTime(noti.createdAt)}</span>
                                </div>
                                <p className="text-[13px] text-[#45464e] truncate">{locNoti.message}</p>
                              </div>
                              <ChevronRight size={20} className="text-[#45464e]/40 group-hover:text-[#5b4df2] group-hover:translate-x-1 transition-all shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <footer className="h-14 px-8 border-t border-gray-100 bg-white flex items-center justify-center shrink-0 sticky bottom-0">
                <p className="text-[11px] font-medium text-[#45464e]/80">
                  ปรับแต่งการแจ้งเตือนเพิ่มเติมได้ใน <span className="text-[#5b4df2] cursor-pointer hover:underline">การตั้งค่าบัญชี</span>
                </p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>,
    document.body
  );
};