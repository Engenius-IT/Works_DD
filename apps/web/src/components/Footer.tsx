import React from 'react';
import Image from 'next/image';
import { Globe, Briefcase, MessageSquareText } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

// 💡 1. กำหนดรูปแบบ Props ให้รองรับตัวแปร role ที่ส่งต่อมาจากหน้าหลัก (HomePage)
interface FooterProps {
    role?: string;
}

// 💡 2. เปลี่ยนมาใช้ Props `{ role }` แทนการเขียน Hardcode ตัวแปรจำลองด้านใน
export const Footer: React.FC<FooterProps> = ({ role }) => {
    const t = useTranslations('Footer');

    return (
        <footer className="bg-[#020263] text-gray-300 py-12 px-6 md:px-12 lg:px-24 font-sans">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

                {/* Column 1: Brand & Description */}
                <div className="lg:pr-8">
                    <Link href="/" className="flex items-center gap-3 mb-6">
                        <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center overflow-hidden relative">
                            <Image
                                src="/images/JobDD_w.png"
                                alt="JobDD Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="text-white font-bold text-xl tracking-wide">
                            WorksDD
                        </span>
                    </Link>
                    <p className="text-sm leading-relaxed mb-8 text-gray-400">
                        {t('description')}
                    </p>
                    <div className="flex gap-4">
                        <Link href="/" className="bg-white/10 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300" aria-label="Website Language/Region">
                            <Globe size={18} />
                        </Link>
                        <Link href="/jobs" className="bg-white/10 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300" aria-label="Jobs">
                            <Briefcase size={18} />
                        </Link>
                        <Link href="/contact-us" className="bg-white/10 p-2.5 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300" aria-label="Contact or Chat">
                            <MessageSquareText size={18} />
                        </Link>
                    </div>
                </div>

                {/* * 🏢 กรณีที่ 1: เป็นผู้ประกอบการ (EMPLOYER) 
                  * จะซ่อนฝั่งคนหางาน และแสดงเฉพาะเมนูฝั่งจ้างงาน / ดูเรซูเม
                  */}
                {role === 'EMPLOYER' ? (
                    <>
                        {/* Column 2: Links - จัดการและหาบุคลากร (สำหรับ Employer) */}
                        <div>
                            <h3 className="text-white font-semibold text-base mb-6">จัดการงาน & ค้นหา</h3>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/resumes" className="hover:text-blue-400 transition-colors duration-200 block">{t('searchResumes')}</Link></li>
                                <li><Link href="/employer/dashboard" className="hover:text-blue-400 transition-colors duration-200 block">แดชบอร์ดผู้ประกอบการ</Link></li>
                                <li><Link href="/employer/packages" className="hover:text-blue-400 transition-colors duration-200 block">แพ็กเกจของฉัน</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Links - ประกาศงาน */}
                        <div>
                            <h3 className="text-white font-semibold text-base mb-6">สำหรับผู้ประกอบการ</h3>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/employer/jobs/create" className="hover:text-blue-400 transition-colors duration-200 block">ลงประกาศงานใหม่</Link></li>
                                <li><Link href="/employer/jobs" className="hover:text-blue-400 transition-colors duration-200 block">จัดการการประกาศงาน</Link></li>
                            </ul>
                        </div>
                    </>
                ) : (
                    /* * 👥 กรณีที่ 2: เป็นผู้สมัครงาน (CANDIDATE) หรือบุคคลทั่วไป (Guest)
                     * จะแสดงเมนู "หางาน" และซ่อนส่วนค้นหาเรซูเม (/resumes)
                     */
                    <>
                        {/* Column 2: Links - หางาน (สำหรับ Candidate ไม่เห็น resumes) */}
                        <div>
                            <h3 className="text-white font-semibold text-base mb-6">{t('findJobs')}</h3>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/jobs" className="hover:text-blue-400 transition-colors duration-200 block">{t('allJobs')}</Link></li>
                                <li><Link href="/jobs" className="hover:text-blue-400 transition-colors duration-200 block">{t('urgentJobs')}</Link></li>
                                <li><Link href="/all_group_job" className="hover:text-blue-400 transition-colors duration-200 block">{t('regionalJobs')}</Link></li>
                            </ul>
                        </div>

                        {/* Column 3: Links - สำหรับผู้สมัครงาน */}
                        <div>
                            <h3 className="text-white font-semibold text-base mb-6">{t('forJobSeekers')}</h3>
                            <ul className="space-y-4 text-sm text-gray-400">
                                <li><Link href="/profile" className="hover:text-blue-400 transition-colors duration-200 block">{t('createResume')}</Link></li>
                                <li><Link href="/saved-jobs" className="hover:text-blue-400 transition-colors duration-200 block">{t('savedJobs')}</Link></li>
                                <li><Link href="/applications" className="hover:text-blue-400 transition-colors duration-200 block">{t('applications')}</Link></li>
                                <li><Link href="/ai-job-matcher" className="hover:text-blue-400 transition-colors duration-200 block">{t('aiMatcher')}</Link></li>
                            </ul>
                        </div>
                    </>
                )}

                {/* Column 4: Links - ช่วยเหลือและสนับสนุน (แสดงผลเหมือนกันทุก Role) */}
                <div>
                    <h3 className="text-white font-semibold text-base mb-6">{t('support')}</h3>
                    <ul className="space-y-4 text-sm text-gray-400">
                        <li><Link href="/contact-us" className="hover:text-blue-400 transition-colors duration-200 block">{t('contact')}</Link></li>
                        <li><Link href="/privacy-policy" className="hover:text-blue-400 transition-colors duration-200 block">{t('privacyPolicy')}</Link></li>
                        <li><Link href="#" className="hover:text-blue-400 transition-colors duration-200 block">{t('terms')}</Link></li>
                        <li><Link href="#" className="hover:text-blue-400 transition-colors duration-200 block">{t('faq')}</Link></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-xs text-gray-400">
                <p>{t('copyright')}</p>
                <div className="flex gap-6">
                    <Link href="#" className="hover:text-blue-400 transition-colors duration-200">{t('terms')}</Link>
                    <Link href="#" className="hover:text-blue-400 transition-colors duration-200">{t('cookiePolicy')}</Link>
                </div>
            </div>
        </footer>
    );
};