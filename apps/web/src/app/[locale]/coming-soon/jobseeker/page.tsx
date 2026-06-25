'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useTranslations } from 'next-intl';
import { 
  ArrowLeft, 
  UserPlus, 
  FileText, 
  Search, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function ApplicantGuidePage() {
  const t = useTranslations('applicantGuide');

  // โครงสร้างขั้นตอนการใช้งาน (Steps)
  const steps = [
    {
      icon: <UserPlus className="w-5 h-5 text-blue-300" />,
      title: t('steps.register.title'),
      desc: t('steps.register.desc'),
      badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
    },
    {
      icon: <FileText className="w-5 h-5 text-emerald-300" />,
      title: t('steps.resume.title'),
      desc: t('steps.resume.desc'),
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
    },
    {
      icon: <Search className="w-5 h-5 text-orange-300" />,
      title: t('steps.search.title'),
      desc: t('steps.search.desc'),
      badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/20'
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-purple-300" />,
      title: t('steps.tracking.title'),
      desc: t('steps.tracking.desc'),
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
    }
  ];

  // ข้อมูลคำถามที่พบบ่อย (FAQs)
  const faqs = [
    { q: t('faqs.q1'), a: t('faqs.a1') },
    { q: t('faqs.q2'), a: t('faqs.a2') }
  ];

  return (
    <div className="min-h-screen bg-[#020263] text-white flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div>
        <Navbar />

        {/* ─── Hero Section (ถอดแบบโครงสร้างเดียวกับหน้าประวัติการสมัครงาน) ─── */}
        <div className="pt-24 pb-16 relative z-10">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-blue-300">
              {t('title')}
            </h1>
            <p className="text-blue-200/60 text-sm md:text-base max-w-xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="max-w-4xl mx-auto px-4 pb-20 relative z-10 space-y-8">
          
          {/* 📋 ส่วนที่ 1: ขั้นตอนการใช้งาน (กางการ์ดกระจกแบบเดียวกับหน้าประวัติการสมัคร) */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-200 px-1">
              <BookOpen className="w-4 h-4 text-blue-400" />
              {t('sections.stepsTitle')}
            </h2>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div 
                  key={idx}
                  className="bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-md rounded-2xl p-5 md:p-6 transition-all duration-200 shadow-md group flex gap-5 items-start"
                >
                  {/* กล่องใส่ Icon ขอบมนมนแบบเดียวกับโลโก้บริษัท */}
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xs shadow-inner group-hover:scale-105 transition-transform">
                    {step.icon}
                  </div>

                  {/* เนื้อหาดีเทล */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-bold text-base md:text-lg text-white group-hover:text-blue-300 transition-colors">
                        {step.title}
                      </h3>
                      {/* Badge แสดงขั้นตอน สไตล์เดียวกับแถบสถานะการสมัคร */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold self-start sm:self-auto ${step.badgeColor}`}>
                        Step 0{idx + 1}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-blue-100/60 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ❓ ส่วนที่ 2: FAQ (คำถามที่พบบ่อย) */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-blue-200 px-1">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              {t('sections.faqTitle')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((faq, idx) => (
                <div 
                  key={idx} 
                  className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-2.5 shadow-md"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-black text-blue-400 text-xs mt-0.5 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Q</span>
                    <h3 className="font-bold text-sm md:text-base text-white leading-snug">{faq.q}</h3>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-start gap-2">
                    <span className="font-black text-emerald-400 text-xs mt-0.5 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">A</span>
                    <p className="text-xs md:text-sm text-blue-100/60 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── ปุ่มกลับหน้าหลักด้านล่างสุด ─── */}
          <div className="flex justify-center pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 h-11 text-xs font-bold bg-white text-[#020263] rounded-xl hover:bg-blue-50 transition-all shadow-md active:scale-98"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              {t('backHome')}
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}