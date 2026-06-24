'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Link } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const OAUTH_BASE = API_URL.replace('/api/v1', '');

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย Google',
  google_failed: 'เข้าสู่ระบบด้วย Google ล้มเหลว กรุณาลองใหม่',
};

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  /* State สำหรับจัดการ Role (เฉพาะฟอร์มกรอก Password ปกติ) */
  const [role, setRole] = useState<'JOBSEEKER' | 'EMPLOYER'>('JOBSEEKER');

  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── 🟢 1. ดักจับกรณี Google Auth (เวอร์ชันแก้ทางล็อกตาย เปลี่ยนหน้าได้ชัวร์) ───
  // เพิ่มตัวแปร Flag ดักรีรันซ้ำเฉพาะเซสชันนี้
  const hasProcessed = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');
    const status = searchParams.get('status');
    const oauthData = searchParams.get('oauthData');

    // 1. เคสคนเก่า (มีบัญชีอยู่แล้ว)
    if (token && userParam) {
      try {
        // 🔥 ป้องกันการรันซ้ำซ้อนในรอบเรนเดอร์เดียวกัน
        if (hasProcessed.current) return;
        hasProcessed.current = true;

        const userData = JSON.parse(decodeURIComponent(userParam));

        // อัปเดตสถานะล็อกอินเข้าสู่ Context ตัวแอปพลิเคชัน
        login(token, userData);

        // ดึงค่า locale จาก url ปัจจุบัน (ถ้ามี) หรือใช้เริ่มต้นเป็น th
        const currentLocale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'th' : 'th';

        // 🟢 เปลี่ยนมาใช้ window.location.href ตัดปัญหาระบบเร้าเตอร์ Next.js นิ่งค้าง
        if (userData.role === 'EMPLOYER') {
          window.location.href = `/${currentLocale}/employer/dashboard`;
        } else {
          // พี่สามารถเปลี่ยนจาก '/th' เป็น '/th/profilefull' หรือหน้าไหนก็ได้ที่พี่อยากให้ผู้สมัครไปได้เลยครับ!
          window.location.href = `/${currentLocale}/profilefull`;
        }

        // 🧼 เคลียร์พารามิเตอร์บน URL ทิ้งหลังจากที่สั่งย้ายหน้าแล้ว
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }, 50);
      } catch (err) {
        console.error('Failed to parse OAuth user data:', err);
        setError('เกิดข้อผิดพลาดในการประมวลผลข้อมูลของ Google');
        hasProcessed.current = false;
      }
    }

    // 2. เคสเด็กใหม่ 
    if (status === 'new_user' && oauthData) {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const currentLocale = window.location.pathname.split('/')[1] || 'th';

      router.replace(`/${currentLocale}/register?status=new_user&oauthData=${encodeURIComponent(oauthData)}`);
    }
  }, [searchParams, login, router]);

  // ดักจับข้อความ Error ล็อกอินไม่ผ่านจาก Google
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError && OAUTH_ERROR_MESSAGES[oauthError]) {
      setError(OAUTH_ERROR_MESSAGES[oauthError]);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ฟังก์ชันการล็อกอินด้วยฟอร์มธรรมดา (Email/Password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        email: form.username,
        password: form.password,
        role: role,
      };

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        setError(msg || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        return;
      }

      login(data.accessToken, data.user);

      // 🟢 ฟอร์มธรรมดาก็ให้เช็คทางเดินไปหน้าที่มีอยู่จริงเช่นกันครับ
      if (data.user.role === 'EMPLOYER' || data.user.role === 'ADMIN') {
        router.replace('/th/employer/dashboard');
      } else {
        // 🟢 [เปลี่ยนจุดนี้] เปลี่ยนให้เหมือนกันกับจุดแรกเพื่อความปลอดภัยครับ
        router.replace('/th');
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อ API ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex justify-center items-center px-4 mb-20">
        <div className="w-full max-w-md bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-black mb-6">เข้าสู่ระบบ</h1>

          {/* ส่วนของ Toggle Switch เลือก Role (ใช้เฉพาะฟอร์มธรรมดา) */}
          <div className="flex p-1 bg-gray-100 rounded-full mb-8">
            <button
              type="button"
              onClick={() => setRole('JOBSEEKER')}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${role === 'JOBSEEKER'
                ? 'bg-blue-800 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              ผู้สมัครงาน
            </button>
            <button
              type="button"
              onClick={() => setRole('EMPLOYER')}
              className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${role === 'EMPLOYER'
                ? 'bg-red-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              ผู้ประกอบการ
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="อีเมลผู้ใช้งาน"
                required
                className="w-full px-4 py-3 rounded-full border border-gray-300 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="รหัสผ่าน"
                required
                className="w-full px-4 py-3 rounded-full border border-gray-300 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 text-white font-medium py-3 px-4 rounded-full transition-colors flex justify-center items-center disabled:opacity-70 ${role === 'JOBSEEKER' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-red-800 hover:bg-red-900'
                  }`}
              >
                {loading ? '...' : 'เข้าสู่ระบบ'}
              </button>
              <Link
                href="/register"
                className={`flex-1 text-white font-medium py-3 px-4 rounded-full transition-colors flex justify-center items-center text-center ${role === 'JOBSEEKER' ? 'bg-blue-800 hover:bg-blue-900' : 'bg-red-800 hover:bg-red-900'
                  }`}
              >
                สมัครสมาชิก
              </Link>
            </div>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">หรือ</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* 🟢 แก้ไขจุดที่ 3: ปลดล็อกดึงตัวแปร `?role=${role}` ออก เพื่อให้ Google ค้นหาตัวตนและบทบาทจริงจากตารางฐานข้อมูล */}
            <a
              href={`${OAUTH_BASE}/api/v1/auth/google`}
              className="w-full bg-white border border-gray-200 text-black font-medium py-3 px-4 rounded-full hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 relative shadow-sm"
            >
              <svg className="w-6 h-6 absolute left-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>ดำเนินการต่อด้วยบัญชี Google</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex flex-col font-sans" >
          <Navbar />
          <div className="flex-1 flex justify-center items-center" >
            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#d32f2f] rounded-full animate-spin" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}