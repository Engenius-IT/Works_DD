'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { NotificationModal } from './NotificationModal';
import { useLocale, useTranslations } from 'next-intl'; // 🌐 นำเข้า useLocale, useTranslations สำหรับระบบแปลภาษา

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
  applicationId?: string;
  application?: any;
}

// ─── Translations Dictionary ────────────────
const translations = {
  th: {
    bellLabel: 'แจ้งเตือน',
    headerTitle: 'การแจ้งเตือน',
    readAll: 'อ่านทั้งหมด',
    deleteAll: 'ลบทั้งหมด',
    emptyNotifications: 'ไม่มีการแจ้งเตือน',
    deleteSingleLabel: 'ลบการแจ้งเตือน',
    btnDeleteTitle: 'ลบ',
    viewAll: 'ดูทั้งหมด',
    timeJustNow: 'เมื่อสักครู่',
    timeMinutesAgo: (m: number) => `${m} นาทีที่แล้ว`,
    timeHoursAgo: (h: number) => `${h} ชั่วโมงที่แล้ว`,
    timeDaysAgo: (d: number) => `${d} วันที่แล้ว`,
    timeWeeksAgo: (w: number) => `${w} สัปดาห์ที่แล้ว`,
  },
  en: {
    bellLabel: 'Notifications',
    headerTitle: 'Notifications',
    readAll: 'Mark all as read',
    deleteAll: 'Clear all',
    emptyNotifications: 'No notifications',
    deleteSingleLabel: 'Delete notification',
    btnDeleteTitle: 'Delete',
    viewAll: 'View All',
    timeJustNow: 'Just now',
    timeMinutesAgo: (m: number) => `${m}m ago`,
    timeHoursAgo: (h: number) => `${h}h ago`,
    timeDaysAgo: (d: number) => `${d}d ago`,
    timeWeeksAgo: (w: number) => `${w}w ago`,
  }
};

// ปรับ Helper timeAgo ให้รับ Object คำแปลเข้ามาประมวลผลดิกชันนารีตาม Locale
function timeAgo(dateStr: string, t: any) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.timeJustNow;
  if (mins < 60) return t.timeMinutesAgo(mins);
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t.timeHoursAgo(hrs);
  const days = Math.floor(hrs / 24);
  if (days < 7) return t.timeDaysAgo(days);
  return t.timeWeeksAgo(Math.floor(days / 7));
}

function translateNotificationValue(
  value: any,
  tNoti: any,
  locale: 'th' | 'en',
): string {
  if (!value) return '';

  const fallbackTranslate = (key: string, params?: Record<string, any>) => {
    const name = params?.name || '';
    const isThai = locale === 'th';

    const fallback: Record<string, string> = {
      title_register_success: isThai ? '🎉 สมัครสมาชิกสำเร็จ' : '🎉 Registration Successful',
      msg_register_success_jobseeker: isThai
        ? `ยินดีต้อนรับคุณ ${name} เข้าสู่ WorksDD`
        : `Welcome ${name} to WorksDD`,
      msg_register_success_employer: isThai
        ? `ยินดีต้อนรับ ${name} เข้าสู่ WorksDD`
        : `Welcome ${name} to WorksDD`,
    };

    return fallback[key] || key;
  };

  const translateByKey = (key: string, params?: Record<string, any>) => {
    const cleanKey = key.startsWith('Notifications.') ? key.replace('Notifications.', '') : key;

    try {
      const translated = tNoti(cleanKey, params || {});
      if (translated && translated !== cleanKey && translated !== key) {
        return translated;
      }
    } catch {}

    return fallbackTranslate(cleanKey, params);
  };

  if (typeof value !== 'string') return String(value);

  try {
    const parsed = JSON.parse(value);

    if (parsed?.key) {
      return translateByKey(parsed.key, parsed.params);
    }
  } catch {}

  if (value.startsWith('Notifications.')) {
    return translateByKey(value);
  }

  return value;
}

export function getLocalizedNotification(
  notification: any,
  tNoti: any,
  locale: 'th' | 'en',
): { title: string; message: string } {
  const company = notification.application?.job?.company?.name || notification.metadata?.companyName || 'Company';
  const job = notification.application?.job?.title || notification.metadata?.position || 'Position';
  const translatedTitle = translateNotificationValue(notification.title, tNoti, locale as 'th' | 'en');
  const translatedMessage = translateNotificationValue(notification.message, tNoti, locale as 'th' | 'en');
  
  let dateText = '';
  if (notification.metadata?.interviewDate) {
    dateText = `${notification.metadata.interviewDate} ${notification.metadata.interviewTime || ''}`.trim();
  } else if (notification.application?.interviewDate) {
    dateText = new Date(notification.application.interviewDate).toLocaleDateString();
  }

  const title = notification.title || '';
  
  if (title.startsWith('Notifications.') || title.trim().startsWith('{')) {
    return {
      title: translatedTitle,
      message: translatedMessage,
    };
  }

  if (title.includes('คัดเลือก')) {
    return {
      title: tNoti('title_shortlisted'),
      message: tNoti('msg_shortlisted', { company, job })
    };
  }
  
  if (title.includes('ตรวจสอบ')) {
    return {
      title: tNoti('title_reviewed'),
      message: tNoti('msg_reviewed', { company, job })
    };
  }
  
  if (title.includes('ข้อเสนอ')) {
    return {
      title: tNoti('title_offered'),
      message: tNoti('msg_offered', { company, job })
    };
  }
  
  if (title.includes('ผลการสมัคร')) {
    return {
      title: tNoti('title_rejected'),
      message: tNoti('msg_rejected', { company, job })
    };
  }

  if (title.includes('สัมภาษณ์')) {
    if (dateText) {
      return {
        title: tNoti('title_interview'),
        message: tNoti('msg_interview_date', { company, job, date: dateText })
      };
    }
    const match = (notification.message || '').match(/วันที่\s+([^\n"'\s]+(?:\s+[^\n"'\s]+)*)/);
    const msgDate = match ? match[1] : '';
    if (msgDate) {
      return {
        title: tNoti('title_interview'),
        message: tNoti('msg_interview_date', { company, job, date: msgDate })
      };
    }
    return {
      title: tNoti('title_interview'),
      message: tNoti('msg_interview', { company, job })
    };
  }

  return {
    title: translatedTitle,
    message: translatedMessage
  };
}

export function NotificationBell() {
  const { user } = useAuth();
  
  const locale = useLocale() as 'th' | 'en'; // 🌐 ดึง Locale ปัจจุบันของระบบ
  const t = translations[locale] || translations.th;
  const tNoti = useTranslations('Notifications');

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotificationForModal, setSelectedNotificationForModal] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getToken = () => localStorage.getItem('accessToken');

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {}
  }, []);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll unread count every 30 seconds
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark single as read
  const markAsRead = async (notification: Notification) => {
    const token = getToken();
    if (!token) return;

    if (!notification.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      fetch(`${API_URL}/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // 2. ปิด Dropdown
    setIsOpen(false);

    // 3. เปิด Modal แสดงรายละเอียดของแจ้งเตือนชิ้นนี้ทันที
    setSelectedNotificationForModal(notification);
    setIsModalOpen(true);
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  // Process pending deletions (Debounced)
  useEffect(() => {
    if (pendingDeletions.length === 0) return;

    const timer = setTimeout(() => {
      const token = getToken();
      if (!token) return;

      const idsToDelete = [...pendingDeletions];
      setPendingDeletions([]); // Clear queue before fetch to prevent race conditions

      fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: idsToDelete }),
      }).catch(() => {
        // Fallback: if delete fails, could restore them to UI, but in optimistic UI we often just ignore
      });
    }, 2000); // 2 seconds debounce

    return () => clearTimeout(timer);
  }, [pendingDeletions]);

  // Clear single notification (Optimistic)
  const handleClearSingle = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation(); // Prevent triggering markAsRead

    // 1. Remove from UI immediately
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

    // 2. Adjust unread count if it was unread
    if (!notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    // 3. Add to pending deletions queue
    setPendingDeletions((prev) => [...prev, notification.id]);
  };

  // Clear all notifications
  const handleClearAll = async () => {
    const token = getToken();
    if (!token) return;

    // 1. Clear UI immediately
    setNotifications([]);
    setUnreadCount(0);
    setPendingDeletions([]); // Clear any pending queued deletions

    // 2. Call API immediately (no debounce needed for clear all)
    fetch(`${API_URL}/notifications/read-all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  };

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={t.bellLabel}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>

          {/* Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none animate-pulse shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-sm">{t.headerTitle}</h3>
              {notifications.length > 0 && (
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      {t.readAll}
                    </button>
                  )}
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                  >
                    {t.deleteAll}
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="text-center py-10 px-6">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-sm text-gray-400">{t.emptyNotifications}</p>
                </div>
              )}

              {notifications.map((notification) => {
                const locNoti = getLocalizedNotification(notification, tNoti, locale);
                return (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification)}
                    className={`group w-full text-left px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/50 flex gap-3 items-start cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Icon */}
                   
<div
  className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 mt-0.5 ${
    notification.type === 'INTERVIEW_SCHEDULED'
      ? 'bg-purple-100 text-purple-600'
      : 'bg-blue-100 text-blue-600'
  }`}
>
  {notification.title.includes('title_register_success') ? '🎉' : locNoti.title.charAt(0)}
</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}
                      >
                        {locNoti.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {locNoti.message}
                      </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(notification.createdAt, t)}
                    </p>
                  </div>

                  {/* Unread indicator & Delete button wrapper */}
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2 mt-1">
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleClearSingle(e, notification)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={t.deleteSingleLabel}
                      title={t.btnDeleteTitle}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </button>

                    {/* Unread indicator */}
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Footer View All */}
            {user.role !== 'EMPLOYER' && user.role !== 'ADMIN' && (
              <div className="border-t border-gray-100 bg-gray-50 py-2 px-3">
                <button
                  onClick={() => {
                    setIsOpen(false);      // ปิด Dropdown เล็ก
                    setIsModalOpen(true);  // เปิดหน้าจอ Premium Modal ตัวเต็ม
                  }}
                  className="w-full py-2 text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  aria-label={t.viewAll}
                >
                  {t.viewAll}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <NotificationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotificationForModal(null);
        }}
        onRefreshBellCount={fetchUnreadCount}
        initialSelectedNotification={selectedNotificationForModal}
      />
    </>
  );
}