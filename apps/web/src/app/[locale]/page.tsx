'use client';

import { Navbar } from '@/components/Navbar';
import { HeroSearch } from '@/components/HeroSearch';
import { TopCompanies } from '@/components/TopCompanies';
import { RecommendedJobs } from '@/components/RecommendedJobs';
import { JobCategories } from '@/components/JobCategories';
import { EmployerJobCategories } from '@/components/EmployerJobCategories'; // ไฟล์ใหม่
import { Footer } from '@/components/Footer';
import { LoginBanner } from '@/components/LoginBanner';
import { FAQ } from '@/components/FAQ';
import { AISkillBanner } from '@/components/AISkillBanner';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'ADMIN';
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Navbar />

      <main className="flex-1">
        {isEmployer ? (
          <div className="bg-[#020263] py-16 text-center text-white">
            <h1 className="text-3xl font-bold">
              ยินดีต้อนรับกลับมา, {user.companyName || 'ผู้ประกอบการ'}
            </h1>
            <p className="mt-2 text-blue-200">จัดการประกาศงานและค้นหาแคนดิเดตที่ดีที่สุดได้ที่นี่</p>
          </div>
        ) : (
          <HeroSearch />
        )}

        {!isLoggedIn && <LoginBanner />}

        {/* --- [2] CONTENT SECTION --- */}
        {isEmployer ? (
          /* >>> กรณีเป็น ผู้ประกอบการ <<< */
          <>
            <EmployerJobCategories />
            {/* นายจ้างก็ควรเห็น TopCompanies เพื่อดูภาพรวมตลาด */}
            <TopCompanies />
          </>
        ) : (
          /* >>> กรณีเป็น ผู้สมัคร หรือ Guest <<< */
          <>
            <JobCategories />
            <AISkillBanner />
            <TopCompanies />
            <RecommendedJobs />
          </>
        )}

        {/* --- [3] COMMON SECTION (เห็นทุกคน) --- */}
        <FAQ />

      </main>

      {/* Footer */}
      <Footer role={user?.role} />
    </div>
  );
}