'use client';

import { useState } from 'react';
import { Search, Briefcase, CheckCircle2, XCircle, Clock, Eye, Filter, Check, X, MapPin, DollarSign } from 'lucide-react';
import { ToastContainer } from '@/components/admin/Toast';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  status: 'published' | 'pending' | 'rejected';
  postedDate: string;
  type: string;
  applications: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer (React)',
    company: 'Tech Innovators Co., Ltd.',
    location: 'Bangkok (BTS Ari)',
    salary: '60,000 - 90,000 THB',
    status: 'published',
    postedDate: '2024-06-10',
    type: 'Full-time',
    applications: 12,
  },
  {
    id: '2',
    title: 'Marketing Manager',
    company: 'Creative Solutions Group',
    location: 'Remote',
    salary: '45,000 - 55,000 THB',
    status: 'pending',
    postedDate: '2024-06-14',
    type: 'Full-time',
    applications: 0,
  },
  {
    id: '3',
    title: 'Graphic Designer',
    company: 'Modern Art Studio',
    location: 'Nonthaburi',
    salary: '25,000 - 35,000 THB',
    status: 'pending',
    postedDate: '2024-06-15',
    type: 'Contract',
    applications: 0,
  },
  {
    id: '4',
    title: 'Part-time Admin',
    company: 'Unknown Co.',
    location: 'Bangkok',
    salary: '500 THB/Day',
    status: 'rejected',
    postedDate: '2024-06-12',
    type: 'Part-time',
    applications: 0,
  },
];

export default function JobManagementPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleApprove = (jobId: string) => {
    setJobs(jobs.map(j =>
      j.id === jobId ? { ...j, status: 'published' as const } : j
    ));
    const job = jobs.find(j => j.id === jobId);
    addToast({
      type: 'success',
      title: 'อนุมัติงานสำเร็จ',
      message: `ประกาศงาน "${job?.title}" ถูกเผยแพร่แล้ว`,
      duration: 3000,
    });
  };

  const handleReject = (jobId: string) => {
    setJobs(jobs.map(j =>
      j.id === jobId ? { ...j, status: 'rejected' as const } : j
    ));
    const job = jobs.find(j => j.id === jobId);
    addToast({
      type: 'error',
      title: 'ปฏิเสธงานสำเร็จ',
      message: `ประกาศงาน "${job?.title}" ไม่ผ่านการอนุมัติ`,
      duration: 3000,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3 h-3" /> เผยแพร่แล้ว
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3 h-3" /> รอตรวจสอบ
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
            <XCircle className="w-3 h-3" /> ไม่ผ่านอนุมัติ
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการงาน</h1>
          <p className="text-gray-500 mt-1">ตรวจสอบความเหมาะสมและอนุมัติประกาศรับสมัครงาน</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">รอตรวจ</p>
              <p className="text-xl font-bold text-yellow-600">
                {jobs.filter(j => j.status === 'pending').length}
              </p>
            </div>
            <div className="w-px bg-gray-200 h-10" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">เผยแพร่แล้ว</p>
              <p className="text-xl font-bold text-green-600">
                {jobs.filter(j => j.status === 'published').length}
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
          <Filter className="w-4 h-4" /> ตัวกรอง
        </button>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">งาน / บริษัท</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">วันที่ลง</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">{job.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        <DollarSign className="w-3 h-3 text-green-600" /> {job.salary}
                      </div>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">
                        {job.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{job.postedDate}</td>
                  <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                  <td className="px-6 py-4 text-right">
                    {job.status === 'pending' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(job.id)}
                          className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all"
                          title="อนุมัติ"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(job.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                          title="ปฏิเสธ"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-200 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button className="text-blue-600 hover:underline text-sm font-bold flex items-center gap-1 ml-auto">
                        <Eye className="w-4 h-4" /> รายละเอียด
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
