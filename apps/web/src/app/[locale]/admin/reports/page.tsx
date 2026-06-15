'use client';

import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Building2, 
  Briefcase, 
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">สถิติและรายงาน</h1>
          <p className="text-gray-500 mt-1">วิเคราะห์ข้อมูลการเติบโตของแพลตฟอร์ม</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" /> 30 วันที่ผ่านมา
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> ส่งออกรายงาน
          </button>
        </div>
      </div>

      {/* Growth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 12%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">ผู้ใช้ใหม่รายเดือน</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">1,240 คน</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> 8%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">บริษัทใหม่รายเดือน</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">45 บริษัท</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-full">
              <ArrowDownRight className="w-3 h-3" /> 3%
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium">งานที่ลงใหม่รายเดือน</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">320 ตำแหน่ง</p>
        </div>
      </div>

      {/* Main Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> แนวโน้มการสมัครงาน
          </h3>
          <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">พื้นที่สำหรับแสดงกราฟแนวโน้ม</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" /> สัดส่วนประเภทงาน
          </h3>
          <div className="flex-1 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">พื้นที่สำหรับแสดงกราฟสัดส่วน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">สถิติแยกตามหมวดหมู่</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">หมวดหมู่</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">งานทั้งหมด</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">การสมัคร</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">อัตราการสมัคร/งาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { cat: 'เทคโนโลยีและไอที', jobs: 120, apps: 850, rate: '7.1' },
                { cat: 'การตลาดและโฆษณา', jobs: 85, apps: 420, rate: '4.9' },
                { cat: 'บัญชีและการเงิน', jobs: 45, apps: 210, rate: '4.6' },
                { cat: 'งานบริการและลูกค้าสัมพันธ์', jobs: 70, apps: 380, rate: '5.4' },
              ].map((row, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.cat}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.jobs}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.apps}</td>
                  <td className="px-6 py-4 text-sm font-bold text-blue-600">{row.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
