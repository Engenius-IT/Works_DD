'use client';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Search,
  CheckCircle2,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function EmployerGuidePage() {
  const t = useTranslations('employerGuide');

  // ─── ขั้นตอนสำหรับผู้ประกอบการ ───
  const steps = [
    {
      icon: <Briefcase className="w-5 h-5 text-red-300" />,
      title: t('steps.companySetup.title'),
      desc: t('steps.companySetup.desc'),
      badgeColor: 'bg-red-500/10 text-red-300 border-red-500/20',
    },
    {
      icon: <FileText className="w-5 h-5 text-orange-300" />,
      title: t('steps.postJob.title'),
      desc: t('steps.postJob.desc'),
      badgeColor: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
    },
    {
      icon: <Search className="w-5 h-5 text-yellow-300" />,
      title: t('steps.manageApplicants.title'),
      desc: t('steps.manageApplicants.desc'),
      badgeColor: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-green-300" />,
      title: t('steps.hiring.title'),
      desc: t('steps.hiring.desc'),
      badgeColor: 'bg-green-500/10 text-green-300 border-green-500/20',
    },
  ];

  const faqs = [
    { q: t('faqs.q1'), a: t('faqs.a1') },
    { q: t('faqs.q2'), a: t('faqs.a2') },
  ];

  return (
    <div className="min-h-screen bg-[#020263] text-white flex flex-col justify-between relative overflow-hidden">

      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div>
        <Navbar />

        {/* Hero */}
        <div className="pt-24 pb-16 relative z-10">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-red-100 to-red-300">
              {t('title')}
            </h1>
            <p className="text-red-200/70 text-sm md:text-base max-w-xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 pb-20 relative z-10 space-y-8">

          {/* Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-red-200 px-1">
              <BookOpen className="w-4 h-4 text-red-400" />
              {t('sections.stepsTitle')}
            </h2>

            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 hover:border-red-400/30 backdrop-blur-md rounded-2xl p-5 md:p-6 transition-all shadow-md group flex gap-5 items-start"
                >
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    {step.icon}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h3 className="font-bold text-white group-hover:text-red-300">
                        {step.title}
                      </h3>

                      <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${step.badgeColor}`}>
                        Step 0{idx + 1}
                      </span>
                    </div>

                    <p className="text-sm text-red-100/60">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-4 pt-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-red-200 px-1">
              <HelpCircle className="w-4 h-4 text-red-400" />
              {t('sections.faqTitle')}
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-2.5"
                >
                  <h3 className="font-bold text-white">{faq.q}</h3>
                  <p className="text-sm text-red-100/60">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Back */}
          <div className="flex justify-center pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 h-11 text-xs font-bold bg-white text-red-900 rounded-xl hover:bg-red-100 transition-all shadow-md"
            >
              <ArrowLeft size={16} />
              {t('backHome')}
            </Link>
          </div>

        </div>
      </div>

      <Footer role="EMPLOYER" />
    </div>
  );
}