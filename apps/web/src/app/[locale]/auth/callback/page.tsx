'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';

function OAuthCallbackInner() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const error = searchParams.get('error');

    if (error || !token || !userRaw) {
      const messages: Record<string, string> = {
        google_cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย Google',
        google_failed: 'เข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่',
        line_cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย Line',
        line_failed: 'เข้าสู่ระบบด้วย Line ล้มเหลว กรุณาลองใหม่',
      };
      setErrorMsg(messages[error ?? ''] || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setStatus('error');
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      login(token, user);
      const locale = window.location.pathname.split('/')[1] || 'th';
      let targetPath = '';

      if (user.role === 'ADMIN') {
        targetPath = 'admin/companies/verify';
      } else if (user.role === 'EMPLOYER') {
        targetPath = 'employer/dashboard';
      } else {
        targetPath = 'profilefull';
      }

      window.location.href = `/${locale}/${targetPath}`;

    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการประมวลผลข้อมูล กรุณาลองใหม่');
      setStatus('error');
    }
  }, [searchParams, router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">เข้าสู่ระบบไม่สำเร็จ</h1>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-medium py-2.5 px-6 rounded-full transition-colors"
          >
            กลับหน้าเข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d32f2f] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">กำลังเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#d32f2f] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">กำลังโหลด...</p>
          </div>
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
