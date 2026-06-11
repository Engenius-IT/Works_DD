'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export interface SearchParams {
  keyword: string;
  province: string;
  jobType: string;
  salaryMin: string;
  education: string;
  category: string;
}


const JOB_CATEGORIES = [
  { value: 'accounting', labelKey: 'categories.accounting' },
  { value: 'admin', labelKey: 'categories.admin' },
  { value: 'banking', labelKey: 'categories.banking' },
  { value: 'community', labelKey: 'categories.community' },
  { value: 'construction', labelKey: 'categories.construction' },
  { value: 'design', labelKey: 'categories.design' },
  { value: 'education', labelKey: 'categories.education' },
  { value: 'engineering', labelKey: 'categories.engineering' },
  { value: 'farming', labelKey: 'categories.farming' },
  { value: 'government', labelKey: 'categories.government' },
  { value: 'medical', labelKey: 'categories.medical' },
  { value: 'service', labelKey: 'categories.service' },
  { value: 'hr', labelKey: 'categories.hr' },
  { value: 'it', labelKey: 'categories.it' },
  { value: 'insurance', labelKey: 'categories.insurance' },
  { value: 'legal', labelKey: 'categories.legal' },
  { value: 'manufacturing', labelKey: 'categories.manufacturing' },
  { value: 'marketing', labelKey: 'categories.marketing' },
  { value: 'real_estate', labelKey: 'categories.real_estate' },
  { value: 'retail', labelKey: 'categories.retail' },
  { value: 'sales', labelKey: 'categories.sales' },
  { value: 'science', labelKey: 'categories.science' },
  { value: 'sports', labelKey: 'categories.sports' },
  { value: 'food_beverage', labelKey: 'categories.food_beverage' },
  { value: 'logistics', labelKey: 'categories.logistics' },
  { value: 'technician', labelKey: 'categories.technician' },
  { value: 'beauty_wellness', labelKey: 'categories.beauty_wellness' },
  { value: 'purchasing', labelKey: 'categories.purchasing' },
  { value: 'media_entertainment', labelKey: 'categories.media_entertainment' },
  { value: 'writing_translation', labelKey: 'categories.writing_translation' },
  { value: 'ecommerce', labelKey: 'categories.ecommerce' },
  { value: 'maid_security', labelKey: 'categories.maid_security' },
  { value: 'automotive', labelKey: 'categories.automotive' },
  { value: 'energy_oil_gas', labelKey: 'categories.energy_oil_gas' },
  { value: 'fashion_garment', labelKey: 'categories.fashion_garment' },
  { value: 'general_labor', labelKey: 'categories.general_labor' },
];

const SALARY_PRESETS = [
  { value: 15000, label: '15,000' },
  { value: 20000, label: '20,000' },
  { value: 25000, label: '25,000' },
  { value: 30000, label: '30,000' },
  { value: 40000, label: '40,000' },
  { value: 50000, label: '50,000' },
  { value: 60000, label: '60,000' },
  { value: 70000, label: '70,000' },
  { value: 80000, label: '80,000' },
  { value: 100000, label: '100,000' },
  { value: 150000, label: '150,000' },
  { value: 200000, label: '200,000' },
  { value: 250000, label: '250,000' },
];

const PROVINCE_KEYS = [
  'all', 'bangkok', 'krabi', 'kanchanaburi', 'kalasin', 'kamphaeng_phet',
  'khon_kaen', 'chanthaburi', 'chachoengsao', 'chonburi', 'chainat', 'chaiyaphum',
  'chumphon', 'chiang_rai', 'chiang_mai', 'trang', 'trat', 'tak', 'nakhon_nayok',
  'nakhon_pathom', 'nakhon_phanom', 'nakhon_ratchasima', 'nakhon_sawan',
  'nakhon_si_thammarat', 'narathiwat', 'nan', 'nonthaburi', 'bueng_kan',
  'buriram', 'pathum_thani', 'prachuap_khiri_khan', 'prachinburi', 'pattani',
  'phra_nakhon_si_ayutthaya', 'phayao', 'phang_nga', 'phatthalung', 'phichit',
  'phitsanulok', 'phetchaburi', 'phetchabun', 'phrae', 'phuket', 'maha_sarakham',
  'mukdahan', 'mae_hong_son', 'yasothon', 'yala', 'roi_et', 'ranong', 'rayong',
  'ratchaburi', 'lopburi', 'lampang', 'lamphun', 'loei', 'sisaket', 'sakon_nakhon',
  'songkhla', 'satun', 'samut_prakan', 'samut_songkhram', 'samut_sakhon', 'sa_kaeo',
  'saraburi', 'sing_buri', 'sukhothai', 'suphan_buri', 'surat_thani', 'surin',
  'nong_khai', 'nong_bua_lam_phu', 'ang_thong', 'amnat_charoen', 'udon_thani',
  'uttaradit', 'uthaithani', 'ubon_ratchathani'
];


interface HeroSearchProps {
  onSearch?: (params: SearchParams) => void;
  initialValues?: Partial<SearchParams>;
}

export function HeroSearch({ onSearch, initialValues }: HeroSearchProps = {}) {
  const t = useTranslations('HeroSearch');
  const router = useRouter();

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (navigationEntry?.type === 'reload' && window.location.search) {
      router.push('/jobs');
    }
  }, [router]);

  const getCategoryValueFromParam = (categoryParam: string) => {
    const category = JOB_CATEGORIES.find(
      (item) => item.value === categoryParam || t(item.labelKey) === categoryParam,
    );
    return category ? category.value : categoryParam;
  };

  const parseCategoryParams = (categoryParams?: string) =>
    Array.from(
      new Set(
        categoryParams
          ? categoryParams.split(',').filter(Boolean).map(getCategoryValueFromParam)
          : [],
      ),
    );

  const [keyword, setKeyword] = useState(initialValues?.keyword ?? '');
  const [selectedProvince, setSelectedProvince] = useState(initialValues?.province ?? '');

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    parseCategoryParams(initialValues?.category),
  );
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);


  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');

  // Job Type (Position Type) State
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    initialValues?.jobType ? initialValues.jobType.split(',').filter(Boolean) : [],
  );
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false);

  // Education State
  const [selectedEducations, setSelectedEducations] = useState<string[]>(
    initialValues?.education ? initialValues.education.split(',').filter(Boolean) : [],
  );
  const [isEducationOpen, setIsEducationOpen] = useState(false);

  // Salary State — store as number (0 = no selection)
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<number>(
    initialValues?.salaryMin ? Number(initialValues.salaryMin) || 0 : 0,
  );
  // Text field for manual input (only used while the dropdown is open)
  const [salaryInputText, setSalaryInputText] = useState<string>('');

  useEffect(() => {
    setKeyword(initialValues?.keyword ?? '');
    setSelectedProvince(initialValues?.province ?? '');
    setSelectedCategories(parseCategoryParams(initialValues?.category));
    setSelectedJobTypes(initialValues?.jobType ? initialValues.jobType.split(',').filter(Boolean) : []);
    setSelectedEducations(initialValues?.education ? initialValues.education.split(',').filter(Boolean) : []);
    setSelectedSalary(initialValues?.salaryMin ? Number(initialValues.salaryMin) || 0 : 0);
    setSalaryInputText('');
  }, [
    initialValues?.keyword,
    initialValues?.province,
    initialValues?.category,
    initialValues?.jobType,
    initialValues?.education,
    initialValues?.salaryMin,
    t,
  ]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const salaryDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const jobTypeDropdownRef = useRef<HTMLDivElement>(null);
  const educationDropdownRef = useRef<HTMLDivElement>(null);

  const getCategoryParamValue = (categoryValue: string) => {
    if (categoryValue === 'admin') return 'งานธุรการ,admin';

    const category = JOB_CATEGORIES.find((item) => item.value === categoryValue);
    return category ? t(category.labelKey) : categoryValue;
  };

  const buildSearchParams = (overrides?: {
    keyword?: string;
    province?: string;
    jobTypes?: string[];
    salary?: number;
    educations?: string[];
    categories?: string[];
  }): SearchParams => ({
    keyword: overrides?.keyword ?? keyword,
    province: overrides?.province ?? selectedProvince,
    jobType: (overrides?.jobTypes ?? selectedJobTypes).join(','),
    salaryMin:
      (overrides?.salary ?? selectedSalary) > 0
        ? String(overrides?.salary ?? selectedSalary)
        : '',
    education: (overrides?.educations ?? selectedEducations).join(','),
    category: (overrides?.categories ?? selectedCategories).map(getCategoryParamValue).join(','),
  });

  const applySearch = (params: SearchParams) => {
    if (onSearch) {
      onSearch(params);
    } else {
      const q = new URLSearchParams();
      if (params.keyword) q.set('keyword', params.keyword);
      if (params.province) q.set('province', params.province);
      if (params.jobType) q.set('jobType', params.jobType);
      if (params.salaryMin) q.set('salaryMin', params.salaryMin);
      if (params.education) q.set('education', params.education);
      if (params.category) q.set('category', params.category);
      router.push(`/jobs?${q.toString()}`);
    }
  };

  const handleSearch = () => {
    const searchText = keyword.trim().toLowerCase();

    const matchedCategory = JOB_CATEGORIES.find((category) => {
      const categoryLabel = t(category.labelKey).toLowerCase();

      return (
        searchText &&
        (category.value.toLowerCase() === searchText ||
          categoryLabel.includes(searchText) ||
          searchText.includes(categoryLabel))
      );
    });

    if (matchedCategory) {
      setSelectedCategories([matchedCategory.value]);
      applySearch(
        buildSearchParams({
          keyword: '',
          categories: [matchedCategory.value],
        }),
      );
      return;
    }

    applySearch(buildSearchParams());
  };

  const handleClear = () => {
    setKeyword('');
    setSelectedProvince('');
    setSelectedCategories([]);
    setSelectedJobTypes([]);
    setSelectedEducations([]);
    setSelectedSalary(0);
    setSalaryInputText('');
    setLocationSearch('');
    if (onSearch) {
      onSearch({
        keyword: '',
        province: '',
        jobType: '',
        salaryMin: '',
        education: '',
        category: '',
      });
    } else {
      router.push('/jobs');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (salaryDropdownRef.current && !salaryDropdownRef.current.contains(event.target as Node)) {
        setIsSalaryOpen(false);
      }
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationOpen(false);
      }
      if (
        jobTypeDropdownRef.current &&
        !jobTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsJobTypeOpen(false);
      }
      if (
        educationDropdownRef.current &&
        !educationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEducationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const nextCategories = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];

      applySearch(buildSearchParams({ categories: nextCategories }));

      return nextCategories;
    });
  };

  const selectSalaryPreset = (value: number) => {
    const nextSalary = selectedSalary === value ? 0 : value;

    setSelectedSalary(nextSalary);
    setSalaryInputText('');
    setIsSalaryOpen(false);
    applySearch(buildSearchParams({ salary: nextSalary }));
  };

  const handleSalaryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const plainValue = e.target.value.replace(/,/g, '');
    if (plainValue === '') {
      setSalaryInputText('');
      setSelectedSalary(0);
      return;
    }
    if (!/^\d*$/.test(plainValue)) return;
    const num = parseInt(plainValue, 10);
    setSalaryInputText(num.toLocaleString());
    setSelectedSalary(num);
  };

  const toggleJobType = (type: string) => {
    setSelectedJobTypes((prev) => {
      const nextJobTypes = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];

      applySearch(buildSearchParams({ jobTypes: nextJobTypes }));

      return nextJobTypes;
    });
  };

  const toggleEducation = (edu: string) => {
    setSelectedEducations((prev) => {
      const nextEducations = prev.includes(edu)
        ? prev.filter((e) => e !== edu)
        : [...prev, edu];

      applySearch(buildSearchParams({ educations: nextEducations }));

      return nextEducations;
    });
  };

  return (
    <section className="relative bg-[#020263] py-5 lg:py-5 font-sans z-30">
      {/* Decorative Dark Blue Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute top-[30%] right-[30%] w-[20%] h-[20%] rounded-full bg-indigo-500/10 blur-[100px]"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 z-10 text-center">


        {/* Search Form Container */}
        <div className="bg-[#ffffff10] border border-white/10 rounded-[28px] p-4 md:p-5 backdrop-blur-md mx-auto max-w-4xl shadow-2xl relative z-40">
          {/* Top Search Bar (White Box) */}
          <div className="flex flex-col md:flex-row bg-white rounded-2xl md:rounded-xl p-1.5 md:p-2 gap-2 md:gap-0 relative z-50">
            {/* Keyword Input */}
            <div className="flex-1 flex items-center px-4 md:px-5 h-12 md:h-14 bg-white rounded-lg md:rounded-none">
              <svg
                className="w-5 h-5 text-gray-400 shrink-0 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder={t('keywordPlaceholder')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full h-full text-gray-700 bg-transparent focus:outline-none focus:ring-0 text-sm md:text-base"
              />
            </div>

            {/* Divider (Desktop Only) */}
            <div className="hidden md:block w-px bg-gray-200 my-2"></div>

            {/* Custom Location Dropdown */}
            <div
              className="flex-1 md:flex-none md:w-[260px] lg:w-[300px] flex items-center px-4 md:px-5 h-12 md:h-14 bg-white rounded-lg md:rounded-none relative"
              ref={locationDropdownRef}
            >
              <svg
                className="w-5 h-5 text-gray-400 shrink-0 mr-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <button
                type="button"
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className="w-full h-full text-gray-700 bg-transparent flex items-center justify-between focus:outline-none cursor-pointer text-sm md:text-base pr-4"
              >
                <span className="truncate">{selectedProvince || t('provincePlaceholder')}</span>
                <svg
                  className={`shrink-0 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${isLocationOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Location Options */}
              {isLocationOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-9999 text-left">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-100">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <svg
                        className="w-4 h-4 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        placeholder={t('searchProvince')}
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
                        className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
                    {PROVINCE_KEYS
                      .filter((key) => {
                        const provinceName = t(`provinces.${key}`);
                        if (!locationSearch.trim()) return true;
                        return provinceName.toLowerCase().includes(locationSearch.trim().toLowerCase());
                      })
                      .map((key) => {
                        const provinceName = t(`provinces.${key}`);
                        const value = key === 'all' ? '' : provinceName;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setSelectedProvince(value);
                              setIsLocationOpen(false);
                              setLocationSearch('');
                              applySearch(buildSearchParams({ province: value }));
                            }}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${selectedProvince === value
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {provinceName}
                          </button>
                        );
                      })}
                  </div>

                </div>
              )}
            </div>

            {/* Search and Clear Buttons */}
            <div className="flex gap-2 w-full md:w-auto h-12 md:h-14 mt-2 md:mt-0">
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 md:flex-none px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center shrink-0"
              >
                {t('clearFilter')}
              </button>
              <button
                type="button"
                onClick={handleSearch}
                className="flex-1 md:flex-none px-8 bg-[#A80010] hover:bg-[#A80010]/80 text-white font-semibold rounded-xl transition-colors flex items-center justify-center shrink-0"
              >
                {t('search')}
              </button>
            </div>
          </div>

          {/* Bottom Row Filters (Pills) */}
          <div className="relative z-50 flex flex-wrap gap-2 md:gap-3 mt-4 items-center justify-center md:px-4">
            {/* Position Type Pill */}
            <div className="relative" ref={jobTypeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsJobTypeOpen(!isJobTypeOpen)}
                className="pl-10 pr-6 py-2 bg-[#ffffff15] hover:bg-[#ffffff25] text-blue-50/90 text-sm font-medium rounded-full cursor-pointer transition-colors outline-none flex items-center"
              >
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="truncate max-w-[140px]">
                  {selectedJobTypes.length === 0
                    ? t('jobType')
                    : `${t('selected')} ${selectedJobTypes.length}`}
                </span>
              </button>

              {isJobTypeOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-9999 p-2 text-left">
                  <p className="px-2 py-1 text-xs text-gray-400 font-medium">{t('jobType')}</p>
                  {[
                    { value: 'FULL_TIME', label: t('jobTypes.FULL_TIME') },
                    { value: 'PART_TIME', label: t('jobTypes.PART_TIME') },
                    { value: 'CONTRACT', label: t('jobTypes.CONTRACT') },
                    { value: 'INTERNSHIP', label: t('jobTypes.INTERNSHIP') },
                    { value: 'FREELANCE', label: t('jobTypes.FREELANCE') },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedJobTypes.includes(item.value)}
                          onChange={() => toggleJobType(item.value)}
                          className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 appearance-none border checked:bg-blue-500 checked:border-blue-500"
                        />
                        <svg
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span
                        className={`text-sm ${selectedJobTypes.includes(item.value) ? 'text-blue-900 font-medium' : 'text-gray-700'}`}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Salary Range Pill */}
            <div className="relative" ref={salaryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSalaryOpen(!isSalaryOpen)}
                className="pl-10 pr-6 py-2 bg-[#ffffff15] hover:bg-[#ffffff25] text-blue-50/90 text-sm font-medium rounded-full cursor-pointer transition-colors outline-none flex items-center"
              >
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="truncate max-w-[140px]">
                  {selectedSalary > 0
                    ? `${t('minsalary')} ${selectedSalary.toLocaleString()}`
                    : t('salary')}
                </span>
              </button>

              {isSalaryOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-9999 text-left">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 font-medium">
                        {t('salary')}
                      </p>
                    </div>
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="ระบุเงินเดือนขั้นต่ำ..."
                        value={salaryInputText || (selectedSalary > 0 ? selectedSalary.toLocaleString() : '')}
                        onChange={handleSalaryInputChange}
                        onFocus={() => {
                          // Show raw number in text field for easy editing
                          if (selectedSalary > 0 && !salaryInputText) {
                            setSalaryInputText(selectedSalary.toLocaleString());
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setIsSalaryOpen(false);
                            handleSearch();
                          }
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {SALARY_PRESETS.map((preset) => (
                        <button
                          key={`salary-${preset.value}`}
                          type="button"
                          onClick={() => selectSalaryPreset(preset.value)}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${selectedSalary === preset.value
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Education Pill */}
            <div className="relative" ref={educationDropdownRef}>
              <button
                type="button"
                onClick={() => setIsEducationOpen(!isEducationOpen)}
                className="pl-10 pr-6 py-2 bg-[#ffffff15] hover:bg-[#ffffff25] text-blue-50/90 text-sm font-medium rounded-full cursor-pointer transition-colors outline-none flex items-center"
              >
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                  />
                </svg>
                <span className="truncate max-w-[140px]">
                  {selectedEducations.length === 0
                    ? t('education')
                    : `${t('selected')} ${selectedEducations.length}`}
                </span>
              </button>

              {isEducationOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-9999 p-2 text-left">
                  <p className="px-2 py-1 text-xs text-gray-400 font-medium">{t('education')}</p>
                  {[
                    { value: 'ต่ำกว่ามัธยมศึกษา', label: t('educationLevels.lower_secondary') },
                    { value: 'มัธยมศึกษา', label: t('educationLevels.secondary') },
                    { value: 'ปวช/ปวส', label: t('educationLevels.vocational') },
                    { value: 'ปริญญาตรี', label: t('educationLevels.bachelor') },
                    { value: 'ปริญญาโท', label: t('educationLevels.master') },
                    { value: 'ปริญญาเอก', label: t('educationLevels.doctorate') },
                  ].map((item) => (
                    <label
                      key={item.value}
                      className="flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedEducations.includes(item.value)}
                          onChange={() => toggleEducation(item.value)}
                          className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 appearance-none border checked:bg-blue-500 checked:border-blue-500"
                        />
                        <svg
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span
                        className={`text-sm ${selectedEducations.includes(item.value) ? 'text-blue-900 font-medium' : 'text-gray-700'}`}
                      >
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Industry Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                className="pl-10 pr-6 py-2 bg-[#ffffff15] hover:bg-[#ffffff25] text-blue-50/90 text-sm font-medium rounded-full cursor-pointer transition-colors outline-none flex items-center"
              >
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-100/70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="truncate max-w-[120px]">
                  {selectedCategories.length === 0
                    ? t('category')
                    : `${t('selected')} ${selectedCategories.length}`}
                </span>
              </button>

              {isCategoryOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-9999 p-2 text-left">
                  <div className="space-y-1">
                    <p className="px-2 py-1 text-xs text-gray-400 font-medium">{t('category')}</p>
                    {JOB_CATEGORIES.map((category) => (
                      <label
                        key={category.value}
                        className="flex items-center gap-3 px-2 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.value)}
                            onChange={() => toggleCategory(category.value)}
                            className="peer h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 appearance-none border checked:bg-blue-500 checked:border-blue-500"
                          />
                          <svg
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <span
                          className={`text-sm ${selectedCategories.includes(category.value) ? 'text-blue-900 font-medium' : 'text-gray-700'}`}
                        >
                          {t(category.labelKey)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
