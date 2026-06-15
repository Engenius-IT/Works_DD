'use client';

import { useState } from 'react';
import { Search, Building2, CheckCircle2, XCircle, Clock, Eye, ShieldCheck, Check, X } from 'lucide-react';
import { ToastContainer } from '@/components/admin/Toast';

interface Company {
  id: string;
  name: string;
  email: string;
  industry: string;
  status: 'verified' | 'pending' | 'rejected';
  registeredDate: string;
  totalJobs: number;
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Tech Innovators Co., Ltd.',
    email: 'hr@techinn.com',
    industry: 'Technology',
    status: 'verified',
    registeredDate: '2024-01-20',
    totalJobs: 12,
  },
  {
    id: '2',
    name: 'Creative Solutions Group',
    email: 'jobs@creativesol.com',
    industry: 'Design & Media',
    status: 'pending',
    registeredDate: '2024-06-05',
    totalJobs: 0,
  },
  {
    id: '3',
    name: 'Global Logistics Inc.',
    email: 'admin@globallog.co.th',
    industry: 'Logistics',
    status: 'rejected',
    registeredDate: '2024-03-12',
    totalJobs: 0,
  },
];

export default function CompaniesManagementPage() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [searchTerm, setSearchTerm] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleApprove = (companyId: string) => {
    setCompanies(companies.map(c =>
      c.id === companyId ? { ...c, status: 'verified' as const } : c
    ));
    const company = companies.find(c => c.id === companyId);
    addToast({
      type: 'success',
      title: 'อนุมัติสำเร็จ',
      message: `บริษัท "${company?.name}" ได้รับการอนุมัติแล้ว`,
      duration: 3000,
    });
  };

  const handleReject = (companyId: string) => {
    setCompanies(companies.map(c =>
      c.id === companyId ? { ...c, status: 'rejected' as const } : c
    ));
    const company = companies.find(c => c.id === companyId);
    addToast({
      type: 'error',
      title: 'ปฏิเสธสำเร็จ',
      message: `บริษัท "${company?.name}" ถูกปฏิเสธ`,
      duration: 3000,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <span className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3 h-3" /> ตรวจสอบแล้ว
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
            <XCircle className="w-3 h-3" /> ปฏิเสธ
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
          <h1 className="text-3xl font-bold text-gray-900">จัดการบริษัท</h1>
          <p className="text-gray-500 mt-1">จัดการและตรวจสอบข้อมูลบริษัทในระบบ</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">ทั้งหมด</p>
            <p className="text-xl font-bold text-gray-900">{companies.length}</p>
          </div>
          <div className="w-px bg-gray-200 h-10" />
          <div className="text-center">
            <p className="text-xs text-yellow-600 uppercase font-bold tracking-wider">รอตรวจ</p>
            <p className="text-xl font-bold text-yellow-600">
              {companies.filter(c => c.status === 'pending').length}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อบริษัทหรืออีเมล..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <Building2 className="w-6 h-6 text-slate-600" />
                </div>
                {getStatusBadge(company.status)}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{company.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{company.email}</p>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">อุตสาหกรรม</p>
                  <p className="text-sm font-medium text-gray-700">{company.industry}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">งานที่ลง</p>
                  <p className="text-sm font-medium text-gray-700">{company.totalJobs} ตำแหน่ง</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
              {company.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(company.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" /> อนุมัติ
                  </button>
                  <button
                    onClick={() => handleReject(company.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" /> ปฏิเสธ
                  </button>
                </div>
              ) : (
                <button className="w-full flex items-center gap-1 justify-center text-blue-600 font-bold text-sm hover:text-blue-700">
                  <Eye className="w-4 h-4" /> ดูรายละเอียด
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <p className="text-gray-500">ไม่พบข้อมูลบริษัทที่ค้นหา</p>
        </div>
      )}
    </div>
  );
}
