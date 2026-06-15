'use client';

import { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'JOBSEEKER' | 'EMPLOYER' | 'ADMIN';
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  applications?: number;
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    role: 'JOBSEEKER',
    status: 'active',
    joinDate: '2024-01-15',
    applications: 5,
  },
  {
    id: '2',
    name: 'บริษัท ABC จำกัด',
    email: 'contact@abc.co.th',
    role: 'EMPLOYER',
    status: 'active',
    joinDate: '2024-02-10',
  },
  {
    id: '3',
    name: 'นางสาว ดวงใจ',
    email: 'duangjai@example.com',
    role: 'JOBSEEKER',
    status: 'active',
    joinDate: '2024-03-05',
    applications: 3,
  },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      case 'suspended':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">จัดการผู้ใช้</h1>
        <p className="text-gray-500 mt-1">จำนวนผู้ใช้ทั้งหมด: {users.length} คน</p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">ชื่อ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">อีเมล</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">บทบาท</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">สถานะ</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">วันที่เข้าร่วม</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-medium ${getStatusColor(user.status)}`}>
                      {user.status === 'active' && '✓ ใช้งาน'}
                      {user.status === 'inactive' && '○ ไม่ใช้งาน'}
                      {user.status === 'suspended' && '✕ ถูกระงับ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.joinDate}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</p>
          </div>
        )}
      </div>
    </div>
  );
}
