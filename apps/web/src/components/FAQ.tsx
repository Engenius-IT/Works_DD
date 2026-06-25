'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter, usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // ดึงข้อมูล Auth Context ของโปรเจกต์

export function FAQ() {
  const t = useTranslations('FAQ');
  const { user } = useAuth(); // เรียกใช้งานข้อมูล User ปัจจุบัน
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // เช็คว่าเป็นผู้ประกอบการหรือไม่ (ถ้าไม่ใช่ หรือยังไม่ Login จะถือว่าเป็นคนหางาน/Guest)
  const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'ADMIN';

  // ดึงข้อมูล 6 ข้อสลับกันตามบทบาท (ถ้าเป็น EMPLOYER ใช้ข้อมูลชุด employer ถ้าไม่ใช่ใช้ชุด candidate)
  const faqs = [0, 1, 2, 3, 4, 5].map((i) => ({
    question: isEmployer ? t(`employer.${i}.q`) : t(`candidate.${i}.q`),
    answer: isEmployer ? t(`employer.${i}.a`) : t(`candidate.${i}.a`),
  }));

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // ตรวจจับพารามิเตอร์ ?scroll=faq จาก URL และทำการเลื่อนหน้าจอลงมาที่ส่วน FAQ
  useEffect(() => {
    const scrollParam = searchParams.get('scroll');

    // เช็กว่า useEffect ทำงานและดึงค่า Parameter ได้หรือไม่
    console.log('FAQ useEffect triggered', scrollParam);

    if (scrollParam === 'faq') {
      const timer = setTimeout(() => {
        const faqElement = document.getElementById('faq');
        console.log('faqElement found:', !!faqElement);

        if (faqElement) {
          // คำนวณระยะเยื้อง (Offset) หักลบความสูงของกลุ่ม Navbar ออก 140px
          const elementPosition = faqElement.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - 140; 

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });

          // ลบพารามิเตอร์ออกจาก URL โดยใช้ Router ของ Next.js เพื่อป้องกันปัญหา Soft Navigation
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete('scroll');
          const newQuery = newSearchParams.toString();
          const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
          
          // ลบ URL parameter ทิ้งโดยไม่ทำให้หน้าเว็บรีเฟรชหรือ Scroll กระตุก
          router.replace(newUrl, { scroll: false });
        }
      }, 800); // หน่วงเวลาเป็น 800ms
      
      // ทำการเคลียร์ Timeout เผื่อกรณีที่ผู้ใช้สลับหน้าหรือ Component Unmount อย่างรวดเร็ว
      return () => clearTimeout(timer);
    }
  }, [searchParams, pathname, router]);

  return (
    <section id="faq" className="py-16 bg-white relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      {/* ใช้โครงสร้าง Layout คอลัมน์เดียว (max-w-4xl) เหมือนเวอร์ชันแรก */}
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 rounded-2xl mb-4">
            <MessageCircleQuestion className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? isEmployer
                      ? 'border-red-200 shadow-lg shadow-red-100/50'
                      : 'border-blue-200 shadow-lg shadow-blue-100/50'
                    : isEmployer
                      ? 'border-gray-100 hover:border-red-100 hover:shadow-md'
                      : 'border-gray-100 hover:border-blue-100 hover:shadow-md'
                }`}
              >
                <button
                  className={`w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none focus-visible:ring-2 ${
                    isEmployer ? 'focus-visible:ring-red-500' : 'focus-visible:ring-blue-500'
                  } focus-visible:ring-inset group`}
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                >
                  <span
                    className={`font-semibold text-[1.1rem] transition-colors duration-300 pr-8 ${
                      isOpen
                        ? isEmployer ? 'text-red-700' : 'text-blue-700'
                        : 'text-gray-800'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isOpen
                        ? isEmployer ? 'bg-red-50' : 'bg-blue-50'
                        : isEmployer ? 'bg-gray-50 group-hover:bg-red-50' : 'bg-gray-50 group-hover:bg-blue-50'
                    }`}
                  >
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isOpen
                          ? isEmployer ? 'rotate-180 text-red-600' : 'rotate-180 text-blue-600'
                          : isEmployer ? 'text-gray-400 group-hover:text-red-500' : 'text-gray-400 group-hover:text-blue-500'
                      }`}
                    />
                  </div>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-5 pt-1 text-gray-600 leading-relaxed border-t border-gray-50 mt-2">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500">
            {t('stillHaveQuestions')}{' '}
            <Link
              href="/contact-us"
              className="text-red-600 font-semibold hover:underline decoration-2 underline-offset-4"
            >
              {t('contactUs')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}