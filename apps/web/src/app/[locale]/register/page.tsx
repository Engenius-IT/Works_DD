'use client';

import { Suspense, useState } from 'react';
import { Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function RegisterContent() {
  const searchParams = useSearchParams();
  const oauthDataStr = searchParams.get('oauthData');
  const status = searchParams.get('status');
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showEmployerModal, setShowEmployerModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');

  const isGoogleFlow = !!(oauthDataStr && status === 'new_user');

  const handleGoogleRegister = async (role: 'JOBSEEKER' | 'EMPLOYER', companyNameInput?: string) => {
    if (!oauthDataStr) return;
    setLoading(true);
    setError('');
    
    try {
      const oauthData = JSON.parse(decodeURIComponent(oauthDataStr));
      const res = await fetch(`${API_URL}/auth/google/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          oauthData,
          companyName: companyNameInput
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'เกิดข้อผิดพลาดในการลงทะเบียน'));
        setLoading(false);
        return;
      }
      
      login(data.accessToken, data.user);
      const currentLocale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'th' : 'th';
      
      if (role === 'EMPLOYER') {
        window.location.href = `/${currentLocale}/employer/dashboard`;
      } else {
        window.location.href = `/${currentLocale}/profilefull`;
      }
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง');
      setLoading(false);
    }
  };

  const onSelectJobseeker = (e: React.MouseEvent) => {
    if (isGoogleFlow) {
      e.preventDefault();
      handleGoogleRegister('JOBSEEKER');
    }
  };

  const onSelectEmployer = (e: React.MouseEvent) => {
    if (isGoogleFlow) {
      e.preventDefault();
      setShowEmployerModal(true);
    }
  };

  const submitEmployerGoogle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    handleGoogleRegister('EMPLOYER', companyName);
  };

  return (
    <main className="flex-1 flex items-center justify-center py-12 px-4 relative">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-[#020263] pt-10">กรุณาเลือกประเภทบัญชีผู้ใช้งาน?</h1>
          <p className="mt-4 text-[#202063] text-xl">เลือกรูปแบบที่ตรงกับความต้องการของคุณเพื่อดำเนินการต่อ</p>
          
          {isGoogleFlow && (
            <div className="mt-6 inline-block bg-blue-50 border border-blue-200 text-blue-700 px-6 py-3 rounded-xl font-medium shadow-sm animate-pulse">
              ✨ ดำเนินการต่อด้วย Google Account กรุณาเลือกประเภทบัญชีของคุณ
            </div>
          )}
          
          {error && (
            <div className="mt-4 max-w-lg mx-auto bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Job Seeker Card */}
          <Link
            href="/register/jobseeker"
            onClick={onSelectJobseeker}
           className={`group relative w-full min-w-0 bg-[#FFFFFF] rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#020263] transition-all duration-300 flex flex-col items-center text-center overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-full max-w-[280px] sm:max-w-[400px] aspect-square mb-0 relative transition-transform group-hover:scale-105 duration-300">
              <Image
                src="/images/job-seeker-2d.png"
                alt="ผู้สมัครงาน"
                fill
                className="object-contain rounded-xl mix-blend-multiply"
              />
            </div>
            <h2 className="text-xl font-bold text-[#00003D] mb-3">ผู้สมัครงาน</h2>
            <p className="text-gray-500 mb-6">
              สร้างโปรไฟล์ส่วนตัว ค้นหาตำแหน่งงาน และสมัครงานกับองค์กรชั้นนำทั่วประเทศ
            </p>
            <span className="mt-auto w-full">
              <button className="w-full py-3 px-6 bg-[#00003D] text-white font-semibold rounded-xl group-hover:bg-[#020263] transition-colors duration-200">
                {loading ? 'กำลังประมวลผล...' : 'ลงทะเบียนผู้สมัครงาน'}
              </button>
            </span>
          </Link>

          {/* Employer Card */}
          <Link
            href="/register/employer"
            onClick={onSelectEmployer}
              className={`group relative w-full min-w-0 bg-[#FFFFFF] rounded-2xl p-5 sm:p-8 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#020263] transition-all duration-300 flex flex-col items-center text-center overflow-hidden ${loading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-full max-w-[280px] sm:max-w-[400px] aspect-square mb-0 relative transition-transform group-hover:scale-105 duration-300">
              <Image
                src="/images/employer-2d.png"
                alt="ผู้ประกอบการ"
                fill
                className="object-contain rounded-xl mix-blend-multiply"
              />
            </div>
            <h2 className="text-xl font-bold text-[#00003D] mb-3">
              ผู้ประกอบการ / ฝ่ายบุคคล
            </h2>
            <p className="text-gray-500 mb-6">
              เข้าถึงคลังประวัติผู้สมัคร ลงประกาศตำแหน่งงาน และสรรหาบุคลากรอย่างมีประสิทธิภาพ
            </p>
            <span className="mt-auto w-full">
              <button className="w-full py-3 px-6 bg-[#00003D] text-white font-semibold rounded-xl group-hover:bg-[#020263] transition-colors duration-200">
                {loading ? 'กำลังประมวลผล...' : 'ลงทะเบียนองค์กร'}
              </button>
            </span>
          </Link>
        </div>

        {!isGoogleFlow && (
          <div className="text-center mt-12">
            <p className="text-gray-500">
              มีบัญชีอยู่แล้ว?{' '}
              <Link href="/login" className="text-[#E00016] font-medium hover:underline">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Modal for Employer Company Name */}
      {showEmployerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4">
            <h3 className="text-2xl font-bold text-[#202063] mb-2">ข้อมูลองค์กร</h3>
            <p className="text-gray-500 text-sm mb-6">กรุณาระบุชื่อบริษัทหรือองค์กรของคุณ เพื่อดำเนินการสร้างบัญชีผู้ประกอบการผ่าน Google</p>
            
            <form onSubmit={submitEmployerGoogle}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อบริษัท / องค์กร <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#020263] focus:border-transparent transition-all text-black"
                  placeholder="บริษัท จ๊อบสบาย จำกัด"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowEmployerModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 px-4 rounded-xl bg-[#00003D] text-white font-medium hover:bg-[#020263] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={!companyName.trim() || loading}
                >
                  {loading ? 'กำลังดำเนินการ...' : 'ยืนยันและสร้างบัญชี'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default function RegisterLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EAEAEA]">
      <Navbar />
      <Suspense fallback={
        <div className="flex-1 flex justify-center items-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#d32f2f] rounded-full animate-spin" />
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
