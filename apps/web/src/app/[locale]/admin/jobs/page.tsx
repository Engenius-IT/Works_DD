'use client';

import { useState, useEffect } from 'react';
import { Search, Briefcase, CheckCircle2, XCircle, Clock, Eye, Filter, Check, X, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/admin/Toast';

interface Job {
  id: string;
  title: string;
  company: {
    name: string;
    logoUrl?: string;
  };
  locationProvince?: string;
  salaryMin?: number;
  salaryMax?: number;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  createdAt: string;
  jobType?: string;
  _count: {
    applications: number;
  };
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchJobs();
  }, [page, searchTerm]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/admin/jobs?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }

      const data = await response.json();
      setJobs(data.data);
      setTotal(data.meta.total);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      addToast({
        type: 'error',
        title: 'ข้อผิดพลาด',
        message: 'ไม่สามารถโหลดข้อมูลงานได้',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบงานนี้?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      addToast({
        type: 'success',
        title: 'ลบสำเร็จ',
        message: 'ลบงานเรียบร้อยแล้ว',
        duration: 3000,
      });

      fetchJobs();
    } catch (err) {
      console.error('Error deleting job:', err);
      addToast({
        type: 'error',
        title: 'ข้อผิดพลาด',
        message: 'ไม่สามารถลบงานได้',
        duration: 3000,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" /> เผยแพร่แล้ว
          </span>
        );
      case 'DRAFT':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" /> ร่าง
          </span>
        );
      case 'CLOSED':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
            <XCircle className="w-3 h-3" /> ปิด
          </span>
        );
      default:
        return null;
    }
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'ไม่ระบุ';
    if (min && max) return `${min.toLocaleString()} - ${max.toLocaleString()} บาท`;
    if (min) return `${min.toLocaleString()} บาท`;
    return `${max?.toLocaleString()} บาท`;
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการงาน</h1>
          <p className="text-gray-500 mt-1">จำนวนงานทั้งหมด: {total} งาน</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">ร่าง</p>
              <p className="text-xl font-bold text-yellow-600">
                {jobs.filter(j => j.status === 'DRAFT').length}
              </p>
            </div>
            <div className="w-px bg-gray-200 h-10" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">เผยแพร่</p>
              <p className="text-xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่องาน หรือชื่อบริษัท..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">งาน / บริษัท</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{job.title}</p>
                            <p className="text-xs text-gray-500">{job.company.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {job.locationProvince && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3" /> {job.locationProvince}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                            <DollarSign className="w-3 h-3 text-green-600" /> {formatSalary(job.salaryMin, job.salaryMax)}
                          </div>
                          {job.jobType && (
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                              {job.jobType}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(job.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                            title="ลบ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {jobs.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">ไม่พบข้อมูลงาน</p>
              </div>
            )}

            {/* Pagination */}
            {total > limit && (
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  หน้า {page} จาก {Math.ceil(total / limit)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    ก่อนหน้า
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(total / limit)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
