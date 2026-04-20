'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { bookmarkService } from '@/services/bookmark';
import { CandidateDetailModal } from '@/components/CandidateDetailModal';
import {
  Search,
  Eye,
  Heart,
  Trash2,
  MapPin,
  Clock,
} from 'lucide-react';

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  title?: string;
  location?: string;
  updatedAt: string;
}

export default function MyBookmarksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);


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

  const fetchBookmarks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await bookmarkService.getMyList();
      console.log("Data from Service:", result);
      const rawList = Array.isArray(result) ? result : Array.isArray(result?.data) ? result.data : [];


      const formattedData = rawList.map((item: any) => {
        const c = item.candidate;
        const p = c?.profile;

        return {
          id: item.candidateId || c?.id,
          fullName: c?.firstName ? `${c.firstName} ${c.lastName || ''}` : 'ไม่ระบุชื่อ',
          email: c?.email || 'ไม่ระบุอีเมล',
          avatarUrl: c?.avatarUrl || null,
          title: c?.jobPreferences?.[0]?.position || 'ไม่ได้ระบุตำแหน่ง',
          location: p?.province || 'ไม่ระบุพื้นที่',
          updatedAt: item.createdAt || new Date().toISOString()
        };
      });

      setCandidates(formattedData);
    } catch (err: any) {
      console.error('Fetch error details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'EMPLOYER') {
      fetchBookmarks();
    }
  }, [user, fetchBookmarks]);

  const handleUnbookmark = async (candidateId: string) => {
    if (!confirm('ยืนยันการลบออกจากรายการที่บันทึกไว้?')) return;

    try {
      await bookmarkService.toggle(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));

    } catch (err) {
      console.error('Delete error:', err);
      alert('ไม่สามารถลบรายการได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const filteredCandidates = candidates.filter((c) =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-12">
      <Navbar />

      <div className="relative bg-[#020263] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                <span className="text-[11px] font-bold tracking-wide text-blue-100 uppercase">
                  Candidate Bookmarks
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                ผู้สมัครที่บันทึกไว้
              </h1>
              <p className="text-sm md:text-base text-blue-200/80 max-w-2xl">
                จัดการรายชื่อผู้สมัครที่คุณสนใจ เพื่อความสะดวกรวดเร็วในการติดต่อภายหลัง
              </p>
            </div>

            <div className="hidden md:flex flex-col items-end">
              <div className="bg-white px-6 py-4 rounded-2xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">บันทึกไว้ทั้งหมด</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : candidates.length} <span className="text-sm font-normal text-gray-500">คน</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-[#202063] rounded-2xl p-4 mb-6 shadow-md border border-white/10">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรืออีเมลผู้สมัครจากรายการที่บันทึกไว้..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-white border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 items-center bg-gray-50/80 px-6 py-4 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-5">ข้อมูลผู้สมัคร</div>
            <div className="col-span-3">ตำแหน่ง / ความเชี่ยวชาญ</div>
            <div className="col-span-2">วันที่บันทึก</div>
            <div className="col-span-2 text-right">การจัดการ</div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-6 animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>
                </div>
              ))
            ) : filteredCandidates.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <Heart className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">ไม่พบรายการที่บันทึก</h3>
                <p className="text-sm text-gray-500">คุณยังไม่ได้กดบันทึกผู้สมัครคนใดไว้</p>
                <button
                  onClick={() => router.push('/resume-directory')}
                  className="mt-4 px-6 py-2 bg-[#020263] text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
                >
                  ไปที่หน้าค้นหาผู้สมัคร
                </button>
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="group hover:bg-gray-50/50 transition-colors px-4 md:px-6 py-5 flex flex-col md:grid md:grid-cols-12 gap-4 items-center">

                  <div className="md:col-span-5 flex items-center gap-4 w-full">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-100 to-blue-50 flex items-center justify-center text-[#020263] font-bold text-xl border border-blue-100 overflow-hidden shadow-sm">
                      {candidate.avatarUrl ? (
                        <img src={candidate.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        candidate.fullName?.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[15px] font-bold text-gray-900 group-hover:text-[#020263] transition-colors">
                        {candidate.fullName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{candidate.email}</div>
                    </div>
                  </div>

                  <div className="md:col-span-3 w-full">
                    <div className="text-sm font-medium text-gray-700">{candidate.title || 'ไม่ได้ระบุตำแหน่ง'}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                      <MapPin className="w-3 h-3" />
                      {candidate.location || 'ไม่ระบุพื้นที่'}
                    </div>
                  </div>

                  <div className="md:col-span-2 w-full text-sm text-gray-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 md:hidden text-gray-300" />
                    {formatDate(candidate.updatedAt)}
                  </div>

                  <div className="md:col-span-2 w-full flex items-center md:justify-end gap-2 border-t md:border-0 pt-3 md:pt-0">
                    <button
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-[#020263] hover:text-[#020263] transition-all text-sm font-medium"
                      title="ดูหน้าโปรไฟล์"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="md:hidden">ดูโปรไฟล์</span>
                    </button>
                    <button
                      onClick={() => handleUnbookmark(candidate.id)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-red-600 hover:bg-red-600 hover:text-white transition-all text-sm font-medium"
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
        </div>
      </div>
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
    </div>
  );
}