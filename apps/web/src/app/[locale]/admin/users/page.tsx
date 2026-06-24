'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Eye, Loader2 } from 'lucide-react';
import { ToastContainer } from '@/components/admin/Toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'JOBSEEKER' | 'EMPLOYER' | 'ADMIN';
  createdAt: string;
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

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const roleParam = filterRole !== 'all' ? `&role=${filterRole}` : '';
      const response = await fetch(
        `${API_URL}/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(searchTerm)}${roleParam}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data);
      setTotal(data.meta.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      addToast({
        type: 'error',
        title: 'ข้อผิดพลาด',
        message: 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้',
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

  const handleDelete = async (userId: string) => {
    if (!confirm('คุณแน่ใจหรือว่าต้องการลบผู้ใช้นี้?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      addToast({
        type: 'success',
        title: 'ลบสำเร็จ',
        message: 'ลบผู้ใช้เรียบร้อยแล้ว',
        duration: 3000,
      });

      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      addToast({
        type: 'error',
        title: 'ข้อผิดพลาด',
        message: 'ไม่สามารถลบผู้ใช้ได้',
        duration: 3000,
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'EMPLOYER':
        return 'bg-blue-100 text-blue-800';
      case 'JOBSEEKER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'ผู้ดูแลระบบ';
      case 'EMPLOYER':
        return 'ผู้ประกอบการ';
      case 'JOBSEEKER':
        return 'ผู้สมัครงาน';
      default:
        return role;
    }
  };

  const getUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-gray-500 mt-1">จำนวนผู้ใช้ทั้งหมด: {total} คน</p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรืออีเมล..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">ทุกบทบาท</option>
              <option value="JOBSEEKER">ผู้สมัครงาน</option>
              <option value="EMPLOYER">ผู้ประกอบการ</option>
              <option value="ADMIN">ผู้ดูแลระบบ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ชื่อ</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">อีเมล</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">บทบาท</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">จำนวนสมัคร</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">วันที่เข้าร่วม</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{getUserName(user)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.role === 'JOBSEEKER' ? user._count.applications : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('th-TH')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</p>
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
