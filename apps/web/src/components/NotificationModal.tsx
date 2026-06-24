'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from '@/i18n/routing';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshBellCount?: () => void;
}

type FilterTab = 'all' | 'unread' | 'company' | 'system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onRefreshBellCount,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

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
    }
  }, [isOpen, fetchNotifications, fetchUnreadCount]);

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
    if (notification.linkUrl) {
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

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-[#0d1b3e]/40 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; font-size: 20px; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; word-wrap: normal; direction: ltr; -webkit-font-smoothing: antialiased; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .unread-indicator { width: 6px; height: 6px; background-color: #4f46e5; border-radius: 9999px; box-shadow: 0 0 10px rgba(79, 70, 229, 0.5); }
      `}} />

      <div className="bg-[#f8f9ff] w-full max-w-[880px] h-[75vh] shadow-2xl border border-white/30 overflow-hidden flex rounded-3xl animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <aside className="w-[260px] bg-[#f1f3f9] border-r border-gray-200/50 flex flex-col shrink-0">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[20px] font-bold text-[#0d1b3e] tracking-tight">Notifications</h2>
              {unreadCount > 0 && (
                <div className="bg-[#4f46e5]/10 text-[#4f46e5] px-2 py-0.5 rounded-full text-[11px] font-bold">{unreadCount} New</div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-bold text-[#45464e] uppercase tracking-[0.1em] mb-4 ml-1">Main</h3>
                <nav className="space-y-1">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center justify-between px-4 py-2.5 w-full rounded-xl transition-all ${activeTab === 'all' ? 'bg-[#4f46e5] text-white shadow-lg shadow-[#4f46e5]/20 font-semibold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">notifications</span>
                      <span className="text-[14px]">ทั้งหมด</span>
                    </div>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveTab('unread')}
                    className={`flex items-center justify-between px-4 py-2.5 w-full rounded-xl transition-all ${activeTab === 'unread' ? 'bg-[#4f46e5] text-white shadow-lg shadow-[#4f46e5]/20 font-semibold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">mark_email_unread</span>
                      <span className="text-[14px]">ยังไม่ได้อ่าน</span>
                    </div>
                    {unreadCount > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 rounded-md ${activeTab === 'unread' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-700'}`}>{unreadCount}</span>
                    )}
                  </button>

                  <button 
                    type="button"
                    onClick={() => setActiveTab('company')}
                    className={`flex items-center justify-between px-4 py-2.5 w-full rounded-xl transition-all ${activeTab === 'company' ? 'bg-[#4f46e5] text-white shadow-lg shadow-[#4f46e5]/20 font-semibold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined">alternate_email</span>
                      <span className="text-[14px]">การตอบรับจากบริษัท</span>
                    </div>
                  </button>
                </nav>
              </div>

              <div>
                <h3 className="text-[10px] font-bold text-[#45464e] uppercase tracking-[0.1em] mb-4 ml-1">Preferences</h3>
                <nav className="space-y-1">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('system')}
                    className={`flex items-center gap-3 px-4 py-2.5 w-full rounded-xl transition-all ${activeTab === 'system' ? 'bg-[#4f46e5] text-white font-semibold' : 'text-[#45464e] hover:bg-white/60'}`}
                  >
                    <span className="material-symbols-outlined">settings</span>
                    <span className="text-[14px]">ระบบ</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          <div className="mt-auto p-8 pt-0">
            <div className="bg-[#4f46e5]/5 rounded-2xl p-4 border border-[#4f46e5]/10">
              <p className="text-[11px] font-semibold text-[#4f46e5] uppercase mb-1">AI Match Status</p>
              <p className="text-[13px] text-[#0d1b3e] leading-tight font-medium mb-3">Today your skills matched with 5 high-priority roles.</p>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#4f46e5] w-[85%] rounded-full"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Panel - 🌟 จุดแก้ไข: ใส่ min-w-0 เพื่อบล็อกไม่ให้ขนาดฝั่งขวาขยายตัวเกินขอบเขตโมดอลหลัก */}
        <main className="flex-grow flex flex-col bg-white min-w-0">
          {/* Content Header */}
          <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-grow max-w-md">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#45464e] text-[20px]">search</span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full bg-[#f1f3f9] border-none rounded-2xl pl-10 pr-4 py-2 text-[14px] focus:ring-2 focus:ring-[#4f46e5]/20 placeholder:text-[#45464e]/60 text-[#0b1c30]" 
                />
              </div>
            </div>
            <div className="flex items-center gap-6 ml-4 shrink-0">
              <button 
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[14px] font-bold text-[#4f46e5] hover:text-[#4f46e5]/80 transition-colors"
              >
                ทำเป็นอ่านแล้วทั้งหมด
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center bg-[#f1f3f9] hover:bg-gray-200 rounded-xl transition-all border border-gray-100 shadow-sm text-[#0d1b3e]"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>close</span>
              </button>
            </div>
          </header>

          {/* Feed Content List */}
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
                    {filteredNotifications.map((noti) => (
                      <div 
                        key={noti.id}
                        onClick={() => handleNotificationClick(noti)}
                        className="group relative bg-white hover:shadow-xl hover:shadow-[#0d1b3e]/5 transition-all p-4 rounded-2xl border border-gray-100 cursor-pointer flex items-center gap-4"
                      >
                        <div className="w-12 h-12 bg-[#0d1b3e] text-white flex items-center justify-center rounded-2xl shrink-0 shadow-lg">
                          <span className="material-symbols-outlined text-[24px]">
                            {noti.type === 'COMPANY_RESPONSE' ? 'work' : 'notifications'}
                          </span>
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <p className="text-[14px] font-bold text-[#0d1b3e] truncate">{noti.title}</p>
                              {!noti.isRead && <div className="unread-indicator shrink-0"></div>}
                            </div>
                            <span className="text-[11px] text-[#45464e] font-medium shrink-0 ml-2">{formatRelativeTime(noti.createdAt)}</span>
                          </div>
                          <p className="text-[13px] text-[#45464e] truncate">{noti.message}</p>
                        </div>
                        <span className="material-symbols-outlined text-[#45464e]/40 group-hover:text-[#4f46e5] group-hover:translate-x-1 transition-all shrink-0">chevron_right</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="h-14 px-8 border-t border-gray-100 bg-white flex items-center justify-center">
            <p className="text-[11px] font-medium text-[#45464e]/80">
              ปรับแต่งการแจ้งเตือนเพิ่มเติมได้ใน <span className="text-[#4f46e5] cursor-pointer hover:underline">การตั้งค่าบัญชี</span>
            </p>
          </footer>
        </main>
      </div>
    </div>,
    document.body
  );
};