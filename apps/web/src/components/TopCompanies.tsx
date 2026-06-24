'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface TopCompany {
  id: string;
  name: string;
  slug: string;
  desc?: string;
  phone?: string;
  image?: string;
  logoUrl?: string;
  packageScore?: number;
}

export function TopCompanies() {
  const t = useTranslations('TopCompanies');
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [companies, setCompanies] = useState<TopCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCompanies = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/companies/top-by-package`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setCompanies([]);
          return;
        }

        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Fetch top companies error:', error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCompanies();
  }, []);

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    if (container.scrollLeft <= 0) {
      container.scrollTo({
        left: container.scrollWidth - container.clientWidth,
        behavior: 'smooth',
      });
    } else {
      container.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 5) {
      container.scrollTo({
        left: 0,
        behavior: 'smooth',
      });
    } else {
      container.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50 overflow-hidden font-sans">
        <div className="max-w-6xl mx-auto px-4 relative">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight uppercase relative">
            {t('title')}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-red-600 rounded-full" />
          </h2>
        </div>
      </section>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50 overflow-hidden font-sans">
      <div className="max-w-6xl mx-auto px-4 relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight uppercase relative">
            {t('title')}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-red-600 rounded-full" />
          </h2>

          <div className="hidden md:flex gap-3">
            <button
              onClick={scrollLeft}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-600 hover:shadow-md transition-all focus:outline-none"
              aria-label="Scroll Left"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollRight}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-red-600 hover:border-red-600 hover:shadow-md transition-all focus:outline-none"
              aria-label="Scroll Right"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative flex items-center group/slider">
          <button
            onClick={scrollLeft}
            className="md:hidden absolute -left-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-gray-500 hover:text-red-600 focus:outline-none opacity-0 group-hover/slider:opacity-100 transition-opacity"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x pt-2 w-full scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {companies.map((company, index) => (
              <div
                key={company.id}
                onClick={() => router.push(`/Companyprofile?slug=${company.slug}`)}
                className="min-w-[280px] md:min-w-[320px] h-[400px] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden snap-center flex flex-col relative group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shrink-0"
              >
                <div className="relative w-full h-3/5 overflow-hidden">
                  <Image
                    src={company.image || company.logoUrl || '/images/JobDD_PicSell.jpg'}
                    alt={company.name}
                    fill
                    sizes="(max-width: 768px) 280px, 320px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                  {index === 0 && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {t('recommended')}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between bg-white relative">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors line-clamp-2">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-medium line-clamp-2">
                      {company.desc || '-'}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-md font-bold text-gray-800 flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-red-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {company.phone || '-'}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                      <ChevronRight className="w-4 h-4 text-red-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="md:hidden absolute -right-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-gray-500 hover:text-red-600 focus:outline-none opacity-0 group-hover/slider:opacity-100 transition-opacity"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `,
          }}
        />
      </div>
    </section>
  );
}