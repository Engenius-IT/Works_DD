'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data for demo if API fails
      const mockStats = {
        totalUsers: 1250,
        totalCompanies: 85,
        totalJobs: 430,
        totalApplications: 2100,
        pendingCompanies: 12,
        newUsersThisMonth: 150,
        newJobsThisMonth: 45,
        newApplicationsThisMonth: 320,
      };

      // In a real scenario, we would fetch from API
      // But for preview, we use mock if connection fails
      setStats(mockStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('ไม่สามารถโหลดข้อมูลจริงได้ กำลังแสดงข้อมูลจำลอง');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Dashboard (Preview)</h1>
          <p className="text-sm text-gray-500 mt-1">
            ยินดีต้อนรับเข้าสู่ระบบจัดการ JobDD
          </p>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'ผู้ใช้ทั้งหมด', value: stats.totalUsers, icon: <Users />, color: 'text-blue-600', bg: 'bg-blue-50', trend: 15 },
          { title: 'บริษัททั้งหมด', value: stats.totalCompanies, icon: <Building2 />, color: 'text-green-600', bg: 'bg-green-50', trend: 8 },
          { title: 'งานทั้งหมด', value: stats.totalJobs, icon: <Briefcase />, color: 'text-purple-600', bg: 'bg-purple-50', trend: 12 },
          { title: 'การสมัครทั้งหมด', value: stats.totalApplications, icon: <FileText />, color: 'text-orange-600', bg: 'bg-orange-50', trend: 20 },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.bg} rounded-xl p-3 ${card.color}`}>
                {card.icon}
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <TrendingUp className="w-3 h-3" />
                +{card.trend}%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">{card.title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              รายการรอดำเนินการ
            </h2>
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
              {stats.pendingCompanies}
            </span>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="font-semibold text-gray-900">บริษัทรอตรวจสอบเอกสาร</p>
                <p className="text-xs text-gray-500">กรุณาตรวจสอบความถูกต้องของใบอนุญาต</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium">
              ตรวจสอบเลย
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            สรุปรายเดือน
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">ผู้ใช้ใหม่</span>
              <span className="font-bold text-blue-600">+{stats.newUsersThisMonth}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">งานใหม่</span>
              <span className="font-bold text-green-600">+{stats.newJobsThisMonth}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">การสมัครใหม่</span>
              <span className="font-bold text-purple-600">+{stats.newApplicationsThisMonth}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
