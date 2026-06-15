'use client';

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'JobDD',
    siteDescription: 'Platform for job seekers and employers',
    maintenanceMode: false,
    emailNotifications: true,
    autoApproveJobs: false,
    maxJobsPerCompany: 50,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
        <p className="text-gray-500 mt-1">จัดการการตั้งค่าทั่วไปของระบบ</p>
      </div>

      {/* Notification */}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
            ✓
          </div>
          <p className="text-green-800 font-medium">บันทึกการตั้งค่าสำเร็จ</p>
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ตั้งค่าทั่วไป</h2>

        <div className="space-y-6">
          {/* Site Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              ชื่อเว็บไซต์
            </label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Site Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              คำอธิบายเว็บไซต์
            </label>
            <textarea
              value={settings.siteDescription}
              onChange={(e) => handleChange('siteDescription', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Max Jobs Per Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              จำนวนงานสูงสุดต่อบริษัท
            </label>
            <input
              type="number"
              value={settings.maxJobsPerCompany}
              onChange={(e) => handleChange('maxJobsPerCompany', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">ฟีเจอร์</h2>

        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">โหมดบำรุงรักษา</p>
              <p className="text-sm text-gray-600">ปิดเว็บไซต์ชั่วคราวเพื่อบำรุงรักษา</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">การแจ้งเตือนทางอีเมล</p>
              <p className="text-sm text-gray-600">ส่งการแจ้งเตือนทางอีเมลให้ผู้ใช้</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Auto Approve Jobs */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">อนุมัติงานโดยอัตโนมัติ</p>
              <p className="text-sm text-gray-600">อนุมัติงานใหม่โดยอัตโนมัติหลังจากการตรวจสอบ</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoApproveJobs}
                onChange={(e) => handleChange('autoApproveJobs', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl border border-red-200 p-8">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-red-900">Danger Zone</h2>
            <p className="text-red-700 text-sm">การกระทำเหล่านี้ไม่สามารถเลิกทำได้</p>
          </div>
        </div>

        <div className="space-y-3">
          <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            ล้างข้อมูลทั้งหมด
          </button>
          <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
            รีเซ็ตระบบ
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
        >
          <Save className="w-5 h-5" />
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
