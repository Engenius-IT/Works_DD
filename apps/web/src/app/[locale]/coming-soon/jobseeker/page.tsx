'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Link } from '@/i18n/routing';
import { 
  Search, 
  MapPin, 
  HelpCircle, 
  Layers,
  User,
  ChevronDown,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  FileText,
  Bell
} from 'lucide-react';

export default function JobseekerSystemGuidePage() {
  const t = useTranslations('JobseekerGuide');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const searchKeywords = ['พนักงานคลังสินค้า', 'HR Manager', 'พนักงานขายหน้าร้าน', 'IT Support Specialist'];

  useEffect(() => {
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingTimer: NodeJS.Timeout;

    const handleTyping = () => {
      const currentWord = searchKeywords[wordIndex];
      if (!isDeleting) {
        setSearchTerm(currentWord.substring(0, charIndex + 1));
        charIndex++;
        if (charIndex === currentWord.length) {
          isDeleting = true;
          typingTimer = setTimeout(handleTyping, 1500);
          return;
        }
      } else {
        setSearchTerm(currentWord.substring(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % searchKeywords.length;
        }
      }
      typingTimer = setTimeout(handleTyping, isDeleting ? 50 : 100);
    };

    typingTimer = setTimeout(handleTyping, 500);

    return () => {
      clearTimeout(typingTimer);
    };
  }, []);

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const uiSteps = [
    {
      id: 1,
      title: t('step1Title'),
      desc: t('step1Desc'),
      badge: t('step1Badge'),
      tips: t('step1Tips')
    },
    {
      id: 2,
      title: t('step2Title'),
      desc: t('step2Desc'),
      badge: t('step2Badge'),
      tips: t('step2Tips')
    },
    {
      id: 3,
      title: t('step3Title'),
      desc: t('step3Desc'),
      badge: t('step3Badge'),
      tips: t('step3Tips')
    },
    {
      id: 4,
      title: t('step4Title'),
      desc: t('step4Desc'),
      badge: t('step4Badge'),
      tips: t('step4Tips')
    }
  ];

  const faqs = [
    {
      id: 1,
      q: t('faq1Q'),
      a: t('faq1A')
    },
    {
      id: 2,
      q: t('faq2Q'),
      a: t('faq2A')
    }
  ];

  const timelineSteps = [
    { status: t('timelineStep1Status'), icon: CheckCircle2, color: 'text-blue-600 bg-blue-50', desc: t('timelineStep1Desc') },
    { status: t('timelineStep2Status'), icon: Clock, color: 'text-amber-600 bg-amber-50', desc: t('timelineStep2Desc') },
    { status: t('timelineStep3Status'), icon: Calendar, color: 'text-purple-600 bg-purple-50', desc: t('timelineStep3Desc') }
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans flex flex-col justify-between">
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div>
        <Navbar />

        {/* 🌌 Hero Section */}
        <div className="bg-[#020263] pt-16 pb-24 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#00003D] mix-blend-multiply opacity-60 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-blue-600 mix-blend-multiply opacity-15 blur-3xl transform -translate-x-1/3 translate-y-1/2" />
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <span className="px-3 py-1 text-xs font-semibold bg-[#00E5FF] text-[#020263] rounded-full uppercase tracking-wider mb-3 inline-block">
              {t('heroBadge')}
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-[#A5CBE5] text-sm md:text-base max-w-2xl mx-auto">
              {t('heroDesc')}
            </p>
          </div>
        </div>

        {/* 🗂️ Main Content Layout */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-14 relative z-20">
          
          {/* ฟีเจอร์เด่นระบบ */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#020263] flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('featureResumeTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('featureResumeDesc')}</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-4 border-t md:border-t-0 md:border-x border-gray-100 pt-4 md:pt-0 md:px-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('featureAlertTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('featureAlertDesc')}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">{t('featureFilterTitle')}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{t('featureFilterDesc')}</p>
              </div>
            </div>
          </div>

          {/* ส่วนแสดงผลแบบ Interactive */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
            
            {/* 💻 ฝั่งซ้าย: หน้าต่างเบราว์เซอร์จำลอง */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#020263]" />
                  {t('uiSectionTitle')}
                </h3>
                
                <div className="relative border border-gray-200 bg-white rounded-2xl overflow-hidden flex flex-col shadow-md select-none">
                  <div className="bg-white border-b border-gray-100 px-3 py-2 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                      </div>
                      <div className="mx-auto bg-gray-50 text-[9px] text-gray-400 px-4 py-0.5 rounded border border-gray-100 font-mono w-32 text-center truncate">
                        worksdd.com
                      </div>
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-2 h-2 text-[#020263]" />
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div 
                        onClick={() => setActiveStep(1)}
                        className={`flex items-center justify-between px-2 py-1.5 bg-[#020263] rounded-md text-[9px] text-white/80 cursor-pointer border transition-all duration-300 ease-out ${
                          activeStep === 1 ? 'ring-2 ring-red-500 border-transparent scale-[1.02] shadow-sm' : 'border-transparent opacity-90'
                        }`}
                      >
                        <div className="flex gap-2 font-medium scale-90 origin-left">
                          <span className="text-white font-bold">{t('uiNavHome')}</span>
                          <span>{t('uiNavSearch')}</span>
                          <span className="flex items-center gap-0.5">{t('uiNavRegion')} <ChevronDown className="w-2 h-2" /></span>
                        </div>
                        <div className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded text-white font-mono scale-90">WORKS DD</div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveStep(1); }}
                        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                          activeStep === 1 ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-110 z-20' : 'bg-white text-[#020263] shadow-md border border-blue-100 hover:scale-105'
                        }`}
                      >
                        1
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 flex flex-col">
                    <div className="bg-[#020263] p-4 pt-6 pb-10 flex flex-col items-center relative shrink-0 border-t border-blue-950">
                      <div 
                        onClick={() => setActiveStep(2)}
                        className={`w-full bg-white rounded-xl p-2 shadow-md flex items-center gap-1 cursor-pointer border transition-all duration-300 ease-out ${
                          activeStep === 2 ? 'ring-2 ring-red-500 border-transparent scale-[1.03] shadow-lg' : 'border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-1 flex-1 px-1 border-r border-gray-100 min-w-0">
                          <Search className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-[10px] text-gray-800 truncate font-semibold">
                            {searchTerm || '...'}
                            <span className="animate-pulse font-light text-blue-500 ml-0.5">|</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-1 px-1 border-r border-gray-100 shrink-0">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <div className="h-2 w-10 bg-gray-100 rounded-xs" />
                        </div>
                        <div className="bg-red-700 text-white text-[8px] font-bold px-3 py-1 rounded-lg shrink-0">
                          {t('uiSearchBtn')}
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveStep(2); }}
                        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                          activeStep === 2 ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-110 z-20' : 'bg-white text-[#020263] shadow-md border border-blue-100 hover:scale-105'
                        }`}
                      >
                        2
                      </button>
                    </div>

                    <div className="p-3 pt-6 pb-5 space-y-6 bg-white flex flex-col justify-start">
                      <div className="relative">
                        <div 
                          onClick={() => setActiveStep(3)}
                          className={`w-full bg-gradient-to-r from-[#020263] to-red-600 rounded-lg p-2.5 flex items-center text-white cursor-pointer border transition-all duration-300 ease-out ${
                            activeStep === 3 ? 'ring-2 ring-red-500 border-transparent scale-[1.02] shadow-sm' : 'border-transparent opacity-90'
                          }`}
                        >
                          <div className="h-2.5 w-24 bg-white/30 rounded-xs" />
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveStep(3); }}
                          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                            activeStep === 3 ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-110 z-20' : 'bg-white text-[#020263] shadow-md border border-blue-100 hover:scale-105'
                        }`}
                        >
                          3
                        </button>
                      </div>

                      <div className="relative pt-1">
                        <div 
                          onClick={() => setActiveStep(4)}
                          className={`grid grid-cols-2 gap-2 p-1.5 cursor-pointer border rounded-xl transition-all duration-300 ease-out ${
                            activeStep === 4 ? 'ring-2 ring-red-500 border-transparent scale-[1.02] bg-gray-50/50 shadow-xs' : 'border-transparent'
                          }`}
                        >
                          <div className="bg-white border border-gray-100 p-2 rounded-lg shadow-2xs space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="h-2.5 w-8 bg-gray-700 rounded-xs" />
                              <div className="w-3 h-3 bg-amber-100 rounded-xs" />
                            </div>
                            <div className="h-4 w-12 bg-red-50 text-red-600 rounded-xs font-bold text-[9px] flex items-center justify-center">12 P.</div>
                          </div>
                          <div className="bg-white border border-gray-100 p-2 rounded-lg shadow-2xs space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="h-2.5 w-8 bg-gray-700 rounded-xs" />
                              <div className="w-3 h-3 bg-amber-100 rounded-xs" />
                            </div>
                            <div className="h-4 w-12 bg-red-50 text-red-600 rounded-xs font-bold text-[9px] flex items-center justify-center">8 P.</div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveStep(4); }}
                          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                            activeStep === 4 ? 'bg-red-600 text-white shadow-lg ring-4 ring-red-100 scale-110 z-20' : 'bg-white text-[#020263] shadow-md border border-blue-100 hover:scale-105'
                          }`}
                        >
                          4
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-center text-gray-400 italic mt-3 flex items-center justify-center gap-1">
                  {t('uiSectionHint')}
                </p>
              </div>
            </div>

            {/* 📋 ฝั่งขวา: รายละเอียดเนื้อหาข้อมูลสำคัญ */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                <span className="w-1.5 h-4 bg-[#020263] rounded-xs"></span>
                {t('detailsTitle')}
              </h2>

              <div className="space-y-3">
                {uiSteps.map((step) => {
                  const isCurrent = activeStep === step.id;
                  return (
                    <div
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 ease-in-out cursor-pointer ${
                        isCurrent
                          ? 'bg-white border-2 border-[#020263] shadow-md scale-[1.01]'
                          : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-xs opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-all duration-300 ${
                          isCurrent ? 'bg-[#020263] text-white scale-110 shadow-xs' : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {step.id}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900 text-sm md:text-base">{step.title}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-sm font-semibold border border-gray-100 bg-gray-50 text-gray-500">
                              {step.badge}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-xs md:text-sm mt-1.5 leading-relaxed">
                            {step.desc}
                          </p>

                          {isCurrent && (
                            <div className="mt-3 p-3 bg-gray-50 border-l-2 border-red-600 rounded-r-lg text-xs text-gray-500 animate-fadeSlideIn">
                              <p className="font-bold text-[#020263] flex items-center gap-1 mb-0.5">
                                <HelpCircle className="w-3.5 h-3.5 text-red-600" /> {t('detailsTipLabel')}
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

          {/* 📑 ไทม์ไลน์ระบบติดตามผลงานหลังกดสมัคร */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-lg md:text-xl font-bold text-[#020263] mb-1">
                {t('timelineTitle')}
              </h2>
              <p className="text-gray-400 text-xs">
                {t('timelineDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {timelineSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div key={idx} className="relative flex flex-col items-center text-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-all duration-300 hover:scale-[1.02]">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-2xs ${step.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{step.status}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed px-2">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ❓ FAQ Section */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-12 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-extrabold text-[#020263] mb-1">
                {t('faqTitle')}
              </h2>
              <p className="text-gray-400 text-xs md:text-sm">
                {t('faqDesc')}
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div 
                    key={faq.id}
                    className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/50 transition-colors duration-150"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 text-left transition-colors cursor-pointer select-none"
                    >
                      <span className="font-bold text-gray-800 text-xs md:text-sm pr-4">
                        {faq.q}
                      </span>
                      <div className="shrink-0 w-5 h-5 rounded-full bg-blue-50 text-[#020263] flex items-center justify-center">
                        {isOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      </div>
                    </button>

                    <div 
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-40 border-t border-gray-100 opacity-100 p-4 bg-gray-50' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 🔘 ปุ่มนำทางกลับหน้าหลัก */}
          <div className="mt-6 mb-12 flex justify-center w-full">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#020263] to-[#00003D] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 min-w-[200px]"
            >
              {t('backToHomeBtn')}
            </Link>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}