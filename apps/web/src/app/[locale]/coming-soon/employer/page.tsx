'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  HelpCircle,
  Layers,
  Briefcase,
  ChevronDown,
} from 'lucide-react';

export default function EmployerSystemGuidePage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const t = useTranslations('EmployerGuide');

  // 📋 ข้อมูลคู่มือเรียงลำดับ 1-4 ผูก Key กับ JSON เพื่อรองรับการสลับภาษา th/en
  const uiSteps = [
    {
      id: 1,
      icon: Building2,
      title: t('steps.step1.title'),
      desc: t('steps.step1.desc'),
      badge: t('steps.step1.badge'),
      tips: t('steps.step1.tips'),
    },
    {
      id: 2,
      icon: FileText,
      title: t('steps.step2.title'),
      desc: t('steps.step2.desc'),
      badge: t('steps.step2.badge'),
      tips: t('steps.step2.tips'),
    },
    {
      id: 3,
      icon: Users,
      title: t('steps.step3.title'),
      desc: t('steps.step3.desc'),
      badge: t('steps.step3.badge'),
      tips: t('steps.step3.tips'),
    },
    {
      id: 4,
      icon: CheckCircle2,
      title: t('steps.step4.title'),
      desc: t('steps.step4.desc'),
      badge: t('steps.step4.badge'),
      tips: t('steps.step4.tips'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans flex flex-col justify-between">
      <div>
        <Navbar />

        {/* 🌌 Hero Section */}
        <div className="bg-[#020263] pt-16 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#00003D] mix-blend-multiply opacity-60 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-600 mix-blend-multiply opacity-15 blur-3xl transform -translate-x-1/3 translate-y-1/2" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <span className="px-3 py-1 text-xs font-semibold bg-[#00E5FF] text-[#020263] rounded-full uppercase tracking-wider mb-3 inline-block">
              {t('badge')}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-[#A5CBE5] text-sm md:text-base max-w-2xl mx-auto">
              {t('description')}
            </p>
          </div>
        </div>

        {/* 🗂️ Main Content Layout */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">

          {/* กล่องข้อมูลภาพรวมระดับสูง */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#020263] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('overview.setupTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('overview.setupDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-x border-gray-100 pt-4 md:pt-0 md:px-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#020263] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('overview.postTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('overview.postDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('overview.manageTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('overview.manageDesc')}</p>
              </div>
            </div>
          </div>

          {/* ส่วนแสดงผลแบบ Interactive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* 💻 ฝั่งซ้าย: หน้าต่างเบราว์เซอร์จำลอง */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#020263]" />
                  {t('interactiveTitle')}
                </h3>

                {/* กรอบหน้าต่าง Browser */}
                <div className="relative border border-gray-200 bg-white rounded-2xl overflow-hidden flex flex-col shadow-md select-none">

                  {/* Header ของ Browser */}
                  <div className="bg-white border-b border-gray-100 px-3 py-2 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                      </div>
                      <div className="mx-auto bg-gray-50 text-[9px] text-gray-400 px-4 py-0.5 rounded border border-gray-100 font-mono w-36 text-center truncate">
                        worksdd.com/employer
                      </div>
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Briefcase className="w-2 h-2 text-[#020263]" />
                      </div>
                    </div>

                    {/* บล็อกตั้งค่าบริษัทด้านบนสุด -> เป็นเลข 1 */}
                    <div className="relative">
                      <div
                        onClick={() => setActiveStep(1)}
                        className={`flex items-center justify-between px-2 py-1.5 bg-[#020263] rounded-md text-[9px] text-white/80 cursor-pointer border transition-all ${
                          activeStep === 1 ? 'ring-2 ring-red-500 border-transparent scale-[1.01]' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-medium scale-90 origin-left">
                          <span className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                            <Building2 className="w-2 h-2 text-white" />
                          </span>
                          <span className="text-white font-bold">{t('ui.company')}</span>
                          <span className="flex items-center gap-0.5 text-[8px] bg-emerald-400/20 text-emerald-300 px-1 rounded">
                            {t('ui.verified')}
                          </span>
                        </div>
                        <div className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono scale-90">EMPLOYER</div>
                      </div>

                      {/* 🔴 วงกลม Hotspot เลข 1 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveStep(1); }}
                        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all z-20 ${
                          activeStep === 1
                            ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-105'
                            : 'bg-white text-[#020263] shadow-md border border-blue-100'
                        }`}
                      >
                        1
                      </button>
                    </div>
                  </div>

                  {/* ส่วนเนื้อหาภายในเว็บแอป */}
                  <div className="bg-gray-50 flex flex-col">

                    {/* บล็อกปุ่มสร้างประกาศงาน -> เป็นเลข 2 */}
                    <div className="bg-[#020263] p-4 pt-6 pb-10 flex flex-col items-center relative shrink-0 border-t border-blue-950">
                      <div
                        onClick={() => setActiveStep(2)}
                        className={`w-full bg-white rounded-xl p-2.5 shadow-md flex items-center justify-between gap-1 cursor-pointer border transition-all ${
                          activeStep === 2 ? 'ring-2 ring-red-500 border-transparent scale-[1.02]' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 px-1">
                          <FileText className="w-3 h-3 text-gray-400" />
                          <div className="h-2 w-20 bg-gray-100 rounded-xs" />
                        </div>
                        <div className="bg-red-700 text-white text-[8px] font-bold px-3 py-1 rounded-lg shrink-0">
                          {t('ui.createJob')}
                        </div>
                      </div>

                      {/* 🔴 วงกลม Hotspot เลข 2 */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveStep(2); }}
                        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all z-20 ${
                          activeStep === 2
                            ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-105'
                            : 'bg-white text-[#020263] shadow-md border border-blue-100'
                        }`}
                      >
                        2
                      </button>
                    </div>

                    {/* พื้นหลังขาวด้านล่าง */}
                    <div className="p-3 pt-6 pb-5 space-y-6 bg-white flex flex-col justify-start">

                      {/* แถบหัวข้อรายชื่อผู้สมัคร -> เป็นเลข 3 */}
                      <div className="relative">
                        <div
                          onClick={() => setActiveStep(3)}
                          className={`w-full bg-gradient-to-r from-[#020263] to-red-600 rounded-lg p-2.5 flex items-center justify-between text-white cursor-pointer border transition-all ${
                            activeStep === 3 ? 'ring-2 ring-red-500 border-transparent scale-[1.01]' : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            <div className="h-2.5 w-20 bg-white/30 rounded-xs" />
                          </div>
                          <div className="flex items-center gap-0.5 text-[8px]">
                            {t('ui.applicantsCount')} <ChevronDown className="w-2 h-2" />
                          </div>
                        </div>

                        {/* 🔴 วงกลม Hotspot เลข 3 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveStep(3); }}
                          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all z-20 ${
                            activeStep === 3
                              ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-105'
                              : 'bg-white text-[#020263] shadow-md border border-blue-100'
                          }`}
                        >
                          3
                        </button>
                      </div>

                      {/* การ์ดสถานะผู้สมัครล่างสุด -> เป็นเลข 4 */}
                      <div className="relative pt-1">
                        <div
                          onClick={() => setActiveStep(4)}
                          className={`grid grid-cols-2 gap-2 p-1.5 cursor-pointer border rounded-xl transition-all ${
                            activeStep === 4 ? 'ring-2 ring-red-500 border-transparent scale-[1.01] bg-gray-50/50' : 'border-transparent'
                          }`}
                        >
                          <div className="bg-white border border-gray-100 p-2 rounded-lg shadow-2xs space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="h-2.5 w-10 bg-gray-700 rounded-xs" />
                              <div className="w-3 h-3 bg-amber-100 rounded-xs" />
                            </div>
                            <div className="h-4 w-16 bg-emerald-50 text-emerald-600 rounded-xs font-bold text-[9px] flex items-center justify-center">
                              {t('ui.statusInterview')}
                            </div>
                          </div>
                          <div className="bg-white border border-gray-100 p-2 rounded-lg shadow-2xs space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="h-2.5 w-10 bg-gray-700 rounded-xs" />
                              <div className="w-3 h-3 bg-amber-100 rounded-xs" />
                            </div>
                            <div className="h-4 w-16 bg-red-50 text-red-600 rounded-xs font-bold text-[9px] flex items-center justify-center">
                              {t('ui.statusPending')}
                            </div>
                          </div>
                        </div>

                        {/* 🔴 วงกลม Hotspot เลข 4 */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveStep(4); }}
                          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all z-20 ${
                            activeStep === 4
                              ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-105'
                              : 'bg-white text-[#020263] shadow-md border border-blue-100'
                          }`}
                        >
                          4
                        </button>
                      </div>

                    </div>
                  </div>

                </div>

                <p className="text-[11px] text-center text-gray-400 italic mt-3 flex items-center justify-center gap-1">
                  {t('interactiveHint')}
                </p>
              </div>
            </div>

            {/* 📋 ฝั่งขวา: รายละเอียดเนื้อหาข้อมูลสำคัญ */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <span className="w-1.5 h-4 bg-[#020263] rounded-xs"></span>
                {t('sectionTitle')}
              </h2>

              <div className="space-y-3">
                {uiSteps.map((step) => {
                  const isCurrent = activeStep === step.id;
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isCurrent
                          ? 'bg-white border-2 border-[#020263] shadow-sm'
                          : 'bg-white border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        {/* เลขลำดับหัวข้อ */}
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isCurrent ? 'bg-[#020263] text-white' : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {step.id}
                        </div>

                        {/* ข้อมูลเนื้อหา */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-1.5">
                              <Icon className="w-4 h-4 text-[#020263] shrink-0" />
                              {step.title}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-sm font-semibold border border-gray-100 bg-gray-50 text-gray-500">
                              {step.badge}
                            </span>
                          </div>

                          <p className="text-gray-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                            {step.desc}
                          </p>

                          {/* กล่องคำแนะนำเพิ่มเติม */}
                          {isCurrent && (
                            <div className="mt-3 p-3 bg-gray-50 border-l-2 border-red-600 rounded-r-lg text-xs text-gray-500 animate-fadeIn">
                              <p className="font-bold text-[#020263] flex items-center gap-1 mb-0.5">
                                <HelpCircle className="w-3.5 h-3.5 text-red-600" /> คำแนะนำเพิ่มเติม:
                              </p>
                              <span>{step.tips}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* 💡 คำแนะนำเพิ่มเติมแสดงคำแนะนำสำหรับผู้ประกอบการในการใช้งานระบบ */}
          <section
            aria-label="System Guidelines for Employers"
            className="mt-8 rounded-2xl border border-blue-500/20 bg-[#020263] p-6 hover:bg-[#020263]/90 transition"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">💡</span>
              <h2 className="font-bold text-blue-300 text-lg">
                {t('guidelines.title')}
              </h2>
            </div>

            {/* List */}
            <ul className="space-y-3 text-sm text-white/80 leading-relaxed">
              <li className="flex gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{t('guidelines.tip1')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{t('guidelines.tip2')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{t('guidelines.tip3')}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>{t('guidelines.tip4')}</span>
              </li>
            </ul>
          </section>

          {/* 🔘 ปุ่มนำทาง */}
          <div className="mt-12 mb-6 flex justify-center w-full">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#020263] to-[#00003D] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 min-w-[200px]"
            >
              {t('backToHome')}
            </Link>
          </div>

        </div>
      </div>

      {/* 🧱 Footer */}
      <Footer role="EMPLOYER" />
    </div>
  );
}