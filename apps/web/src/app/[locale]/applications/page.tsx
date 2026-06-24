'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl'; // 🌐 นำเข้า useLocale สำหรับระบบแปลภาษา
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Building2, MapPin, Briefcase, Calendar, Clock, Ban, CheckCircle2 } from 'lucide-react';
import { Link } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface Application {
  id: string;
  status: string;
  appliedAt: string;
  interviewDate: string | null;
  job: {
    id: string;
    title: string;
    slug: string;
    locationProvince: string;
    locationDistrict: string;
    companyAddress?: string;
    workModel: string;
    jobType: string;
    company: {
      name: string;
      logoUrl: string | null;
    };
  };
}

// ─── Translations Dictionary ────────────────
const translations = {
  th: {
    heroTitle: 'ประวัติการสมัครงานและนัดสัมภาษณ์',
    heroDesc: 'ติดตามสถานะและตรวจสอบงานที่คุณได้ทำการสมัครไว้ทั้งหมดในที่เดียว',
    statTotal: 'สมัครทั้งหมด',
    statInterested: 'ได้รับความสนใจ',
    statRejected: 'ถูกปฏิเสธ',
    fetchError: 'ไม่สามารถโหลดข้อมูลประวัติการสมัครงานได้',
    emptyTitle: 'ยังไม่มีประวัติการสมัครงาน',
    emptyDesc: 'ค้นหางานที่ใช่และเริ่มต้นสมัครงานเพื่อสานฝันอาชีพของคุณ',
    btnFindJob: 'ค้นหางานเลย',
    noLocation: 'ไม่ระบุสถานที่',
    appliedOn: 'สมัครเมื่อ',
    interviewDateTitle: 'นัดสัมภาษณ์:',
    notSpecifiedDate: 'ยังไม่ระบุวัน',
    timeSuffix: ' น.',
    status: {
      PENDING: 'รอดำเนินการ',
      REVIEWING: 'กำลังพิจารณา',
      SHORTLISTED: 'ผ่านเข้ารอบ',
      INTERVIEW: 'นัดสัมภาษณ์',
      HIRED: 'รับเข้าทำงาน',
      REJECTED: 'ถูกปฏิเสธ',
    }
  },
  en: {
    heroTitle: 'Application History & Interviews',
    heroDesc: 'Track status and review all your job applications in one place.',
    statTotal: 'Total Applied',
    statInterested: 'Shortlisted / Invited',
    statRejected: 'Rejected',
    fetchError: 'Failed to load application history.',
    emptyTitle: 'No application history yet',
    emptyDesc: 'Find the right job and start applying to achieve your career goals.',
    btnFindJob: 'Find Jobs Now',
    noLocation: 'Location not specified',
    appliedOn: 'Applied on',
    interviewDateTitle: 'Interview Date:',
    notSpecifiedDate: 'Not specified yet',
    timeSuffix: '',
    status: {
      PENDING: 'Pending',
      REVIEWING: 'Reviewing',
      SHORTLISTED: 'Shortlisted',
      INTERVIEW: 'Interviewing',
      HIRED: 'Hired',
      REJECTED: 'Rejected',
    }
  }
};

export default function ApplicationsPage() {
  const router = useRouter();
  const locale = useLocale() as 'th' | 'en'; // 🌐 เรียกใช้ระบบจับภาษาของ Next-intl
  const t = translations[locale] || translations.th;

  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'JOBSEEKER') {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'JOBSEEKER') return;

    const fetchApplications = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/applications/my-applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch applications');

        const data = await res.json();
        setApplications(data);
      } catch (err) {
        setError(t.fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user, t.fetchError]);

  // Dynamic Date Formatter based on Locale
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Dynamic Date Time Formatter based on Locale
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return null;
    const d = new Date(dateString);
    const formatted = d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${formatted}${t.timeSuffix}`;
  };

  const getStatusDisplay = (status: string) => {
    const displayLabel = t.status[status as keyof typeof t.status] || status;

    switch (status) {
      case 'PENDING':
        return {
          label: displayLabel,
          colors: 'bg-[#A5CBE5]/20 text-[#020263] border-[#A5CBE5]',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'REVIEWING':
        return {
          label: displayLabel,
          colors: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'SHORTLISTED':
        return {
          label: displayLabel,
          colors: 'bg-[#00003D] text-white border-[#00003D]',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'INTERVIEW':
        return {
          label: displayLabel,
          colors: 'bg-[#020263] text-white border-[#020263]',
          icon: <Calendar className="w-3.5 h-3.5" />,
        };
      case 'HIRED':
        return {
          label: displayLabel,
          colors: 'bg-emerald-500 text-white border-emerald-500',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'REJECTED':
        return {
          label: displayLabel,
          colors: 'bg-[#E00016]/10 text-[#A80010] border-[#E00016]/20',
          icon: <Ban className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: displayLabel,
          colors: 'bg-[#EAEAEA] text-gray-700 border-gray-200',
          icon: null,
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#020263] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans pb-12">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-[#020263] pt-16 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#00003D] mix-blend-multiply opacity-50 blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#E00016] mix-blend-multiply opacity-20 blur-3xl transform -translate-x-1/3 translate-y-1/2" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t.heroTitle}
          </h1>
          <p className="text-[#A5CBE5] text-lg max-w-2xl mx-auto">
            {t.heroDesc}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
        {/* Stats Row */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 grid grid-cols-3 sm:divide-x sm:divide-gray-100 text-center mb-8 gap-y-2 sm:gap-y-0">
          
          {/* บล็อกที่ 1: ทั้งหมด */}
          <div className="flex flex-col justify-center items-center px-1 sm:px-4 min-w-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#020263] truncate">
              {applications.length}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 leading-tight max-w-full break-words">
              {t.statTotal}
            </div>
          </div>
          
          {/* บล็อกที่ 2: ได้รับการพิจารณา */}
          <div className="flex flex-col justify-center items-center px-1 sm:px-4 min-w-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#00003D] truncate">
              {
                applications.filter((a) => ['SHORTLISTED', 'INTERVIEW', 'HIRED'].includes(a.status))
                  .length
              }
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 leading-tight max-w-full break-words">
              {t.statInterested}
            </div>
          </div>
          
          {/* บล็อกที่ 3: ไม่ผ่านการพิจารณา */}
          <div className="flex flex-col justify-center items-center px-1 sm:px-4 min-w-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-[#E00016] truncate">
              {applications.filter((a) => a.status === 'REJECTED').length}
            </div>
            <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1 leading-tight max-w-full break-words">
              {t.statRejected}
            </div>
          </div>

        </div>

        {error && (
          <div className="bg-[#E00016]/10 border border-[#E00016]/20 text-[#A80010] px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <Ban className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Application List */}
        <div className="space-y-4">
          {applications.length === 0 && !error ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-[#F5F7FA] rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t.emptyTitle}</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                {t.emptyDesc}
              </p>
              <Link
                href="/jobs"
                className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white bg-linear-to-r from-[#020263] to-[#00003D] rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {t.btnFindJob}
              </Link>
            </div>
          ) : (
            applications.map((app) => {
              const statusInfo = getStatusDisplay(app.status);
              return (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-5 sm:p-6 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Company Logo */}
                    <div className="shrink-0 flex items-start sm:items-center">
                      <div className="w-16 h-16 rounded-xl bg-[#F5F7FA] border border-gray-100 flex items-center justify-center overflow-hidden">
                        {app.job.company.logoUrl ? (
                          <img
                            src={app.job.company.logoUrl}
                            alt={app.job.company.name}
                            className="w-full h-full object-contain p-2"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                        <div>
                          <Link
                            href={`/jobs/${app.job.slug}`}
                            className="hover:text-[#020263] transition-colors group-hover:underline decoration-2 underline-offset-4"
                          >
                            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                              {app.job.title}
                            </h3>
                          </Link>
                          <div className="text-sm font-medium text-[#020263] mt-1">
                            {app.job.company.name}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${statusInfo.colors}`}
                          >
                            {statusInfo.icon}
                            {statusInfo.label}
                          </div>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-gray-500 mt-4">
                        <div className="flex items-center gap-1.5 bg-[#F5F7FA] px-2.5 py-1.5 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {app.job.locationDistrict || app.job.locationProvince ? (
                              <>
                                {app.job.locationDistrict}, {app.job.locationProvince}
                              </>
                            ) : (
                              app.job.companyAddress || t.noLocation
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#F5F7FA] px-2.5 py-1.5 rounded-lg">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {app.job.jobType} ({app.job.workModel})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 sm:mt-0 sm:ml-auto text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{t.appliedOn} {formatDate(app.appliedAt)}</span>
                        </div>
                      </div>

                      {/* Interview Date Section */}
                      {(app.status === 'INTERVIEW' || app.interviewDate) && (
                        <div className="mt-4 pt-4 border-t border-gray-100/60">
                          <div className="flex items-center gap-2 bg-[#F5F7FA] w-fit px-3 py-2 rounded-lg text-sm font-medium">
                            <Clock className="w-4 h-4 text-[#020263]" />
                            <span className="text-gray-500">{t.interviewDateTitle}</span>
                            <span className="text-[#020263] font-bold">
                              {app.interviewDate ? formatDateTime(app.interviewDate) : t.notSpecifiedDate}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}