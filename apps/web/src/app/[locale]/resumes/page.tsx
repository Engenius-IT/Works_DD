"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Link } from "@/i18n/routing";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CandidateDetailModal } from "@/components/CandidateDetailModal";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { bookmarkService } from "@/services/bookmark";

import {
  Search,
  Filter,
  MapPin,
  GraduationCap,
  Banknote,
  Clock3,
  Briefcase,
  RefreshCw,
  Languages,
  //FileText,
  ArrowRight,
  Heart,
  ChevronDown,
  Car,
  Star,
  CreditCard,
  Wrench,
  Users,
  Calendar,
  School,
  Award,
  BookOpen,
  StickyNote,
  Target,
  Building2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface EducationHistoryItem {
  faculty: string;
  major: string;
}

interface JobPreference {
  id: string;
  position: string;
  job_type: string;
}

type CandidateCard = {
  id: string;
  fullName: string;
  gender: string;
  age: number | null;
  desiredPosition: string;
  expectedSalaryText: string;
  educationLevel: string;
  major: string;
  province: string;
  postedAt: string;
  skills: string[];
  institution: string;
  gpa: number | null;
  englishLevelLabel: string;
  englishLevelScore: number;
  candidateType: string;
  categoryName?: string;
  avatarUrl: string | null;
  experience: number | null;
  isBookmarked?: boolean;
  languages?: {
    language: string;
    level: string;
  }[];
  drivingSkills: string[];
  desiredProvinces?: {
    provinceName: string;
  }[];
  subDistrict?: string;
  district?: string;
  educationHistory: EducationHistoryItem[];
  jobPreferences?: JobPreference[];
  jobTypes?: string[];
  businessTypes?: string[];
};

type Filters = {
  query: string;
  position?: string;
  province: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  skills: string;
  educationLevel: string;
  minGpa: string;
  institution: string;
  language: string;
  languageLevel: string;
  englishLevel: string;
  experience: string;
  business_type?: string;
  desiredProvinces: string;
  hasDrivingLicense: string;
  hasOwnCar: string;
  machinerySkill: string;
  faculty: string;
  major: string;
  jobType?: string;
  salaryRange?: string;
};

const initialFilters: Filters = {
  query: "",
  province: "",
  gender: "",
  ageMin: "",
  ageMax: "",
  skills: "",
  educationLevel: "",
  language: "",
  languageLevel: "",
  minGpa: "",
  institution: "",
  englishLevel: "",
  experience: "",
  business_type: "",
  desiredProvinces: "",
  hasDrivingLicense: "",
  hasOwnCar: "",
  machinerySkill: "",
  faculty: "",
  major: "",
  jobType: "",
  salaryRange: "",
};

export interface SearchParams {
  keyword: string;
  province: string;
  jobType: string;
  salaryMin: string;
  education: string;
  category: string;
}

const PROVINCE_KEYS = [
  "all",
  "bangkok",
  "vicinity",
  "krabi",
  "kanchanaburi",
  "kalasin",
  "kamphaeng_phet",
  "khon_kaen",
  "chanthaburi",
  "chachoengsao",
  "chonburi",
  "chainat",
  "chaiyaphum",
  "chumphon",
  "chiang_rai",
  "chiang_mai",
  "trang",
  "trat",
  "tak",
  "nakhon_nayok",
  "nakhon_pathom",
  "nakhon_phanom",
  "nakhon_ratchasima",
  "nakhon_sawan",
  "nakhon_si_thammarat",
  "narathiwat",
  "nan",
  "nonthaburi",
  "bueng_kan",
  "buriram",
  "pathum_thani",
  "prachuap_khiri_khan",
  "prachinburi",
  "pattani",
  "phra_nakhon_si_ayutthaya",
  "phayao",
  "phang_nga",
  "phatthalung",
  "phichit",
  "phitsanulok",
  "phetchaburi",
  "phetchabun",
  "phrae",
  "phuket",
  "maha_sarakham",
  "mukdahan",
  "mae_hong_son",
  "yasothon",
  "yala",
  "roi_et",
  "ranong",
  "rayong",
  "ratchaburi",
  "lopburi",
  "lampang",
  "lamphun",
  "loei",
  "sisaket",
  "sakon_nakhon",
  "songkhla",
  "satun",
  "samut_prakan",
  "samut_songkhram",
  "samut_sakhon",
  "sa_kaeo",
  "saraburi",
  "sing_buri",
  "sukhothai",
  "suphan_buri",
  "surat_thani",
  "surin",
  "nong_khai",
  "nong_bua_lam_phu",
  "ang_thong",
  "amnat_charoen",
  "udon_thani",
  "uttaradit",
  "uthaithani",
  "ubon_ratchathani",
];

const FACULTIES = [
  "คณะเกษตรศาสตร์",
  "คณะครุศาสตร์",
  "คณะครุศาสตร์อุตสาหกรรม",
  "คณะดุริยางคศิลป์",
  "คณะทันตแพทยศาสตร์",
  "คณะเทคนิคการแพทย์",
  "คณะเทคโนโลยี",
  "คณะเทคโนโลยีทางทะเล",
  "คณะเทคโนโลยีสารสนเทศ",
  "คณะนิติศาสตร์",
  "คณะนิเทศศาสตร์",
  "คณะบริหารธุรกิจ",
  "คณะโบราณคดี",
  "คณะประมง",
  "คณะพยาบาลศาสตร์",
  "คณะพาณิชยศาสตร์และการบัญชี",
  "คณะแพทยศาสตร์",
  "คณะเภสัชศาสตร์",
  "คณะโภชนศาสตร์",
  "คณะมนุษยศาสตร์",
  "คณะมัณฑนศิลป์",
  "คณะวนศาสตร์",
  "คณะวารสารศาสตร์และสื่อสารมวลชน",
  "คณะวิจิตรศิลป์",
  "คณะวิทยาการจัดการ",
  "คณะวิทยาการสารสนเทศ",
  "คณะวิทยาศาสตร์",
  "คณะวิทยาศาสตร์การกีฬา",
  "คณะวิศวกรรมศาสตร์",
  "คณะศิลปกรรมศาสตร์",
  "คณะศิลปศาสตร์",
  "คณะศิลปะและการออกแบบ",
  "คณะเศรษฐศาสตร์",
  "คณะสถาปัตยกรรมศาสตร์",
  "คณะสหเวชศาสตร์",
  "คณะสัตวแพทยศาสตร์",
  "คณะสังคมสงเคราะห์ศาสตร์",
  "คณะสังคมศาสตร์",
  "คณะสาธารณสุขศาสตร์",
  "คณะศึกษาศาสตร์",
  "คณะสิ่งแวดล้อมและทรัพยากรศาสตร์",
  "คณะอุตสาหกรรมเกษตร",
  "คณะอุตสาหกรรมสร้างสรรค์",
  "คณะอักษรศาสตร์",
  "วิทยาลัยการคอมพิวเตอร์",
  "วิทยาลัยการภาพยนตร์ ศิลปะการแสดงและสื่อใหม่",
  "วิทยาลัยนานาชาติ",
  "วิทยาลัยนวัตกรรม",
  "วิทยาลัยป๊อปพิวเลชันศาสตร์",
  "วิทยาลัยสื่อสารการเมือง",
];

const LANGUAGES_LIST = [
  "ภาษาไทย",
  "ภาษาอังกฤษ",
  "ภาษาจีน (แมนดาริน)",
  "ภาษาญี่ปุ่น",
  "ภาษาเกาหลี",
  "ภาษาฝรั่งเศส",
  "ภาษาเยอรมัน",
  "ภาษาสเปน",
  "ภาษาพม่า",
  "ภาษาเวียดนาม",
  "ภาษาลาว",
  "ภาษาเขมร",
  "ภาษามลายู",
  "ภาษาฮินดี",
  "ภาษารัสเซีย",
  "ภาษาอาหรับ",
  "ภาษาโปรตุเกส",
  "อื่นๆ",
];

const LANGUAGE_LEVELS = [
  "พื้นฐาน (Basic)",
  "พอใช้ (Fair)",
  "ดี (Good)",
  "ดีมาก (Fluent)",
  "เจ้าของภาษา (Native)",
];

const BUSINESS_TYPES = [
  "เทคโนโลยีสารสนเทศ",
  "การเงิน/ธนาคาร",
  "การผลิต/อุตสาหกรรม",
  "ค้าปลีก/ค้าส่ง",
  "อาหารและเครื่องดื่ม",
  "การศึกษา",
  "สุขภาพ/การแพทย์",
  "อสังหาริมทรัพย์/ก่อสร้าง",
  "โลจิสติกส์/ขนส่ง",
  "สื่อ/โฆษณา/ประชาสัมพันธ์",
  "โทรคมนาคม",
  "การท่องเที่ยว/โรงแรม",
  "ประกันภัย",
  "พลังงาน",
  "เกษตรกรรม",
  "ราชการ/รัฐวิสาหกิจ",
  "องค์กรไม่แสวงหาผลกำไร",
  "อีคอมเมิร์ซ/แพลตฟอร์มออนไลน์",
  "บริการวิชาชีพ (ที่ปรึกษา/กฎหมาย/บัญชี)",
  "บริการจัดหางาน/ทรัพยากรบุคคล",
  "ยานยนต์และชิ้นส่วน",
  "สินค้าอุปโภคบริโภค (FMCG)",
  "นำเข้าและส่งออก",
  "ความงาม/แฟชั่น/สปา",
  "บันเทิง/ศิลปะ/นันทนาการ",
  "เหมืองแร่/ปิโตรเคมี/เคมีภัณฑ์",
  "บริการรักษาความปลอดภัย/จัดการอาคาร",
  "อื่นๆ",
];

const JOB_TYPES = [
  "งานประจำ (Full-time)",
  "งานพาร์ทไทม์ (Part-time)",
  "สัญญาจ้าง (Contract)",
  "ฟรีแลนซ์ (Freelance)",
  "ฝึกงาน (Internship)",
];

const drivingSkillMap: Record<string, { th: string; en: string }> = {
  l_car: { th: "ใบขับขี่รถยนต์", en: "Car License" },
  l_bike: { th: "ใบขับขี่รถจักรยานยนต์", en: "Motorcycle License" },
  l_truck_6: { th: "ใบขับขี่รถบรรทุก 6 ล้อ", en: "6-Wheel Truck License" },
  l_truck_10: { th: "ใบขับขี่รถบรรทุก 10 ล้อ", en: "10-Wheel Truck License" },

  v_car: { th: "รถยนต์ส่วนบุคคล", en: "Private Car" },
  v_bike: { th: "รถจักรยานยนต์", en: "Motorcycle" },

  m_backhoe: { th: "รถแบคโฮ", en: "Backhoe" },
  m_crane: { th: "รถเครน", en: "Crane" },
  m_forklift: { th: "รถยก (Forklift)", en: "Forklift" },
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เพิ่งโพสต์";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function getMatchedSnippet(
  candidate: CandidateCard,
  searchQuery: string | null,
) {
  if (!searchQuery) return null;

  const q = searchQuery.toLowerCase();

  if (candidate.institution?.toLowerCase().includes(q))
    return candidate.institution;
  if (candidate.major?.toLowerCase().includes(q)) return candidate.major;
  if (candidate.skills?.some((s) => s.toLowerCase().includes(q))) {
    return candidate.skills.find((s) => s.toLowerCase().includes(q));
  }
  if (candidate.desiredPosition?.toLowerCase().includes(q))
    return candidate.desiredPosition;

  return null;
}

function GenderAvatar({
  gender,
  avatarUrl,
}: {
  gender: string;
  avatarUrl: string | null;
}) {
  const defaultAvatar = "/images/Proflie_SeekJobDD.webp";
  
  return (
    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100">
      <Image
        src={avatarUrl || defaultAvatar}
        alt="Profile"
        fill
        className="object-cover"
      />
    </div>
  );
}

interface Resumesearch {
  onSearch?: (params: SearchParams) => void;
  initialValues?: Partial<SearchParams>;
}

export default function ResumeDirectoryPage({}: Resumesearch = {}) {
  const t = useTranslations("CandidateDirectory");
  const tt = useTranslations("HeroSearch");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [genderSearch, setGenderSearch] = useState("");
  const genderDropdownRef = useRef<HTMLDivElement>(null);
  const [isEnglishOpen, setIsEnglishOpen] = useState(false);
  const englishDropdownRef = useRef<HTMLDivElement>(null);
  const [languageSearch, setLanguageSearch] = useState("");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [isDesiredOpen, setIsDesiredOpen] = useState(false);
  const [desiredSearch, setDesiredSearch] = useState("");
  const desiredLocationRef = useRef<HTMLDivElement>(null);
  const [isEduOpen, setIsEduOpen] = useState(false);
  const eduDropdownRef = useRef<HTMLDivElement>(null);
  const [isFacultyOpen, setIsFacultyOpen] = useState(false);
  const [facultySearch, setFacultySearch] = useState("");
  const facultyDropdownRef = useRef<HTMLDivElement>(null);
  const [isExpOpen, setIsExpOpen] = useState(false);
  const expDropdownRef = useRef<HTMLDivElement>(null);
  const businessTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [isJobTypeOpen, setIsJobTypeOpen] = useState(false);
  const jobTypeDropdownRef = useRef<HTMLDivElement>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const handleClearAll = () => {
    setFilters(initialFilters);
    router.push(pathname);
  };

  const getInitialFilters = () => {
    const category =
      searchParams.get("category") || searchParams.get("categoryId") || "";
    return {
      ...initialFilters,
      query: category,
    };
  };

  const filteredFaculties = FACULTIES.filter((f) =>
    f.toLowerCase().includes(facultySearch.toLowerCase()),
  );

  const { user } = useAuth();
  const [filters, setFilters] = useState<Filters>(getInitialFilters());
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [isCarOpen, setIsCarOpen] = useState(false);
  const licenseDropdownRef = useRef<HTMLDivElement>(null);
  const carDropdownRef = useRef<HTMLDivElement>(null);
  const [isMachineryOpen, setIsMachineryOpen] = useState(false);
  const machineryDropdownRef = useRef<HTMLDivElement>(null);
  const [isBusinessOpen, setIsBusinessOpen] = useState(false);
  const [businessSearch, setBusinessSearch] = useState("");

  const employerCtaHref =
    user?.role === "EMPLOYER" ? "/employer/jobs/create" : "/employer/login";
  const employerCtaLabel =
    user?.role === "EMPLOYER"
      ? t("employerBox.ctaLoggedIn")
      : t("employerBox.ctaGuest");
  const isExpValid = filters.experience !== "" && filters.experience !== "0";

  const experienceOptions = useMemo(
    () => [
      { id: "0", label: t("filters.experienceOptions.noExperience") },
      { id: "1-3", label: t("filters.experienceOptions.oneToThree") },
      { id: "3-5", label: t("filters.experienceOptions.threeToFive") },
      { id: "5-10", label: t("filters.experienceOptions.fiveToTen") },
      { id: "10+", label: t("filters.experienceOptions.moreThanTen") },
    ],
    [t],
  );

  const getExperienceLabel = (value: string) =>
    experienceOptions.find((item) => item.id === value)?.label ||
    t("filters.experienceAll");

  const jobTypeLabelMap: Record<string, string> = {
    "งานประจำ (Full-time)": t("filters.jobTypeOptions.fullTime"),
    "งานพาร์ทไทม์ (Part-time)": t("filters.jobTypeOptions.partTime"),
    "สัญญาจ้าง (Contract)": t("filters.jobTypeOptions.contract"),
    "ฟรีแลนซ์ (Freelance)": t("filters.jobTypeOptions.freelance"),
    "ฝึกงาน (Internship)": t("filters.jobTypeOptions.internship"),
  };

  const educationOptions = useMemo(
    () => [
      { id: "ต่ำกว่ามัธยมศึกษาตอนปลาย", label: t("filters.educationOptions.lowerThanHighSchool") },
      { id: "มัธยมศึกษาตอนปลาย", label: t("filters.educationOptions.highSchool") },
      { id: "ปวช", label: t("filters.educationOptions.vocationalCertificate") },
      { id: "ปวส", label: t("filters.educationOptions.diploma") },
      { id: "ปริญญาตรี", label: t("filters.educationOptions.bachelor") },
      { id: "ปริญญาโท", label: t("filters.educationOptions.master") },
      { id: "ปริญญาเอก", label: t("filters.educationOptions.doctorate") },
    ],
    [t],
  );

  const getEducationLabel = (value: string) =>
    educationOptions.find((item) => item.id === value)?.label ||
    t("filters.educationAll");

  {
    /*const updateUrlParams = (newFilters: Filters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value.trim()) {
        params.set(key, value.trim());
      }
    });
    // ผลลัพธ์จะเป็น ?query=abc&province=bangkok...
    router.push(`${pathname}?${params.toString()}`);
  };*/
  }

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("accessToken");
      const queryString = searchParams.toString();
      console.log(
        "Fetching API with:",
        `${API_URL}/users/candidate-directory?${queryString}`,
      );
      const res = await fetch(
        `${API_URL}/users/candidate-directory${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      const data = await res.json();

      console.log(candidates[0]);

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถโหลดข้อมูลผู้หางานได้");
      }

      const candidatesList = Array.isArray(data) ? data : data.candidates || [];
      //console.log("Check candidate 0 bookmark:", candidatesList[0]?.isBookmarked);
      console.log("CANDIDATES DATA FROM API:", candidatesList);
      setCandidates(candidatesList);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "เกิดข้อผิดพลาด"));
      console.error("Fetch Error:", error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  useEffect(() => {
    const filtersFromUrl: Filters = { ...initialFilters };
    searchParams.forEach((value, key) => {
      if (key in filtersFromUrl) {
        (filtersFromUrl as any)[key] = value;
      }
    });

    const categoryFromUrl =
      searchParams.get("category") || searchParams.get("categoryId");

    if (categoryFromUrl) {
      filtersFromUrl.business_type = categoryFromUrl.trim();
    }

    const desiredFromUrl = searchParams.get("desiredProvince");
    if (desiredFromUrl) {
      filtersFromUrl.desiredProvinces = desiredFromUrl;
    }

    filtersFromUrl.hasDrivingLicense =
      searchParams.get("hasDrivingLicense") || "";
    filtersFromUrl.hasOwnCar = searchParams.get("hasOwnCar") || "";

    filtersFromUrl.educationLevel = searchParams.get("educationLevel") || "";

    setFilters(filtersFromUrl);
  }, [searchParams]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationOpen(false);
      }

      if (
        genderDropdownRef.current &&
        !genderDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenderOpen(false);
      }

      if (
        englishDropdownRef.current &&
        !englishDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEnglishOpen(false);
      }

      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageOpen(false);
      }

      if (
        desiredLocationRef.current &&
        !desiredLocationRef.current.contains(event.target as Node)
      ) {
        setIsDesiredOpen(false);
      }

      if (
        licenseDropdownRef.current &&
        !licenseDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLicenseOpen(false);
      }

      if (
        carDropdownRef.current &&
        !carDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCarOpen(false);
      }

      if (
        machineryDropdownRef.current &&
        !machineryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMachineryOpen(false);
      }

      if (
        eduDropdownRef.current &&
        !eduDropdownRef.current.contains(event.target as Node)
      ) {
        setIsEduOpen(false);
      }

      if (
        facultyDropdownRef.current &&
        !facultyDropdownRef.current.contains(event.target as Node)
      ) {
        setIsFacultyOpen(false);
        setFacultySearch("");
      }

      if (
        expDropdownRef.current &&
        !expDropdownRef.current.contains(event.target as Node)
      ) {
        setIsExpOpen(false);
      }

      if (
        businessTypeDropdownRef.current &&
        !businessTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBusinessOpen(false);
      }

      if (
        jobTypeDropdownRef.current &&
        !jobTypeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsJobTypeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [locationDropdownRef]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && String(value).trim()) {
        params.set(key, String(value).trim());
      }
    });

    console.log("ค่าที่เลือกกรอง:", filters.jobType, filters.business_type);
    console.log("ข้อมูลก้อนแรกในลิสต์:", candidates[0]);

    const filtered = candidates.filter((item) => {
      // รับค่าจาก URL Query หรือ State
      const selectedJobType = filters.jobType;

      if (!selectedJobType) return true; // ถ้าไม่ได้เลือกอะไร ให้ผ่านหมด

      // ต้องเช็คว่าใน Array jobTypes ของ Candidate มีค่าที่เลือกหรือไม่
      return item.jobTypes && item.jobTypes.includes(selectedJobType);
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const filteredCandidates = useMemo(() => {
    const vicinityLabel = tt("provinces.vicinity");

    const VICINITY_GROUP = [
      tt("provinces.bangkok"),
      tt("provinces.nakhon_pathom"),
      tt("provinces.nonthaburi"),
      tt("provinces.pathum_thani"),
      tt("provinces.samut_prakan"),
      tt("provinces.samut_sakhon"),
    ];

    return candidates.filter((candidate) => {
      if (filters.desiredProvinces) {
        const target = filters.desiredProvinces;
        const isSearchingVicinity =
          target === "vicinity" || target === vicinityLabel;

        const targetThaiName = tt(`provinces.${target}`);

        const matchDesired = candidate.desiredProvinces?.some((dp) => {
          const candidateProvinceName =
            typeof dp === "string" ? dp : dp.provinceName;

          if (isSearchingVicinity) {
            return VICINITY_GROUP.includes(candidateProvinceName);
          }
          return (
            candidateProvinceName === target ||
            candidateProvinceName === targetThaiName
          );
        });

        if (!matchDesired) return false;
      }

      if (filters.province) {
        const target = filters.province;
        const isSearchingVicinity =
          target === "vicinity" || target === vicinityLabel;

        const targetThaiName = tt(`provinces.${target}`);

        if (isSearchingVicinity) {
          if (!VICINITY_GROUP.includes(candidate.province)) return false;
        } else {
          if (
            candidate.province !== target &&
            candidate.province !== targetThaiName
          ) {
            return false;
          }
        }
      }

      if (filters.gender && candidate.gender !== filters.gender) {
        return false;
      }

      const age = candidate.age || 0;
      if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && age > parseInt(filters.ageMax)) return false;

      if (filters.hasDrivingLicense) {
        const hasMatch = candidate.drivingSkills?.includes(
          filters.hasDrivingLicense,
        );
        if (!hasMatch) return false;
      }

      if (filters.hasOwnCar) {
        const hasMatch = candidate.drivingSkills?.includes(filters.hasOwnCar);
        if (!hasMatch) return false;
      }

      if (filters.machinerySkill) {
        const hasMatch = candidate.drivingSkills?.includes(
          filters.machinerySkill,
        );
        if (!hasMatch) return false;
      }

      if (
        filters.educationLevel &&
        candidate.educationLevel !== filters.educationLevel
      ) {
        return false;
      }

      if (filters.faculty) {
        const hasFaculty = candidate.educationHistory?.some(
          (edu) => edu.faculty === filters.faculty,
        );
        if (!hasFaculty) return false;
      }

      if (filters.major) {
        const hasMajor = candidate.educationHistory?.some((edu) =>
          edu.major?.toLowerCase().includes(filters.major.toLowerCase()),
        );
        if (!hasMajor) return false;
      }

      if (filters.minGpa) {
        const minGpaNum = parseFloat(filters.minGpa);
        if (!isNaN(minGpaNum)) {
          if ((candidate.gpa || 0) < minGpaNum) return false;
        }
      }

      if (filters.institution) {
        const searchInst = filters.institution.toLowerCase().trim();
        const candInst = (candidate.institution || "").toLowerCase();
        if (!candInst.includes(searchInst)) return false;
      }

      if (filters.experience) {
        const exp = candidate.experience || 0;
        if (filters.experience === "0" && exp > 0) return false;
        if (filters.experience === "1-3" && (exp < 1 || exp > 3)) return false;
        if (filters.experience === "3-5" && (exp < 3 || exp > 5)) return false;
        if (filters.experience === "5-10" && (exp < 5 || exp > 10))
          return false;
        if (filters.experience === "10+" && exp < 10) return false;
      }

      if (filters.jobType) {
        const selectedJob = filters.jobType;
        const matchJobType = candidate.jobTypes?.includes(selectedJob);

        if (!matchJobType) return false;
      }

      if (filters.business_type) {
        const selectedBiz = filters.business_type;
        const matchBusiness = candidate.businessTypes?.includes(selectedBiz);

        if (!matchBusiness) return false;
      }

      if (filters.salaryRange) {
        const salaryText = candidate.expectedSalaryText || "";
        const salaryNumbers = salaryText.match(/\d[\d,]*/g)?.map((num) =>
          parseInt(num.replace(/,/g, ""), 10),
        );
        const candidateSalary = salaryNumbers?.length
          ? Math.max(...salaryNumbers.filter((num) => !Number.isNaN(num)))
          : 0;

        if (candidateSalary) {
          if (filters.salaryRange === "0-10000" && candidateSalary > 10000) return false;
          if (filters.salaryRange === "10001-15000" && (candidateSalary < 10001 || candidateSalary > 15000)) return false;
          if (filters.salaryRange === "15001-20000" && (candidateSalary < 15001 || candidateSalary > 20000)) return false;
          if (filters.salaryRange === "20001-30000" && (candidateSalary < 20001 || candidateSalary > 30000)) return false;
          if (filters.salaryRange === "30001-50000" && (candidateSalary < 30001 || candidateSalary > 50000)) return false;
          if (filters.salaryRange === "50001+" && candidateSalary < 50001) return false;
        }
      }

      return true;
    });
  }, [candidates, filters]);

  const resultText = useMemo(
    () => `${filteredCandidates.length.toLocaleString()}`,
    [filteredCandidates.length],
  );

  console.log(candidates);
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-[#020263] text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,#ffffff,transparent_40%)]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 relative z-10">
            <div className="max-w-5xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wide">
                <Briefcase className="w-4 h-4" />
                {t("badge")}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-sm md:text-base text-blue-100/85 leading-relaxed">
                {t("description")}
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                <div className="rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Briefcase className="w-4 h-4" />
                    {t("employerBox.title")}
                  </div>
                  <p className="text-sm text-blue-100/85 leading-relaxed">
                    {t("employerBox.desc")}
                  </p>
                  <Link
                    href={employerCtaHref}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#16A34A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#15803D] transition-colors"
                  >
                    {employerCtaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={filters.query}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, query: e.target.value }))
                    }
                    placeholder={t("search.placeholder")}
                    className="w-full h-12 rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl bg-[#020263] hover:bg-[#11117c] text-white font-semibold transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    {t("search.btnSearch")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFilterPanelOpen((prev) => !prev)}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                  >
                    <Filter className="w-4 h-4 text-indigo-600" />
                    {t("filters.title")}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isFilterPanelOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("search.btnClear")}
                  </button>
                </div>
              </div>

              {/* ส่วนที่ 2: ตัวกรองหลักด้านหน้า (แสดง 8 อันจริง: 2 แถว x 4 ช่อง) */}
              <div className="border-t border-slate-200 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.positionLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.position}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            position: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.positionPlaceholder")}</option>
                        <option value="Developer">Developer</option>
                        <option value="Programmer">Programmer</option>
                        <option value="Sales">Sales</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Admin">Admin</option>
                        <option value="บัญชี">
                          {t("filters.positionOptions.accounting")}
                        </option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.education")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.educationLevel}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            educationLevel: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.educationPlaceholder")}</option>
                        {educationOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.jobTypeLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.jobType || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            jobType: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.jobTypePlaceholder")}</option>
                        {JOB_TYPES.map((type) => (
                          <option key={type} value={type}>
{jobTypeLabelMap[type] || type}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.genderLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.gender}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            gender: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.genderPlaceholder")}</option>
                        <option value="male">{t("filters.gender.male")}</option>
                        <option value="female">{t("filters.gender.female")}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.provinceResidence")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.province}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            province: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.provincePlaceholder")}</option>
                        {PROVINCE_KEYS.filter((key) => key !== "all").map(
                          (key) => (
                            <option key={key} value={key}>
                              {tt(`provinces.${key}`)}
                            </option>
                          ),
                        )}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.experienceLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.experience}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            experience: e.target.value,
                            business_type:
                              e.target.value === "0" ? "" : prev.business_type,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.experiencePlaceholder")}</option>
                        {experienceOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.salaryRangeLabel")}
                    </label>
                    <div className="relative">
                      <select
                        value={filters.salaryRange || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            salaryRange: e.target.value,
                          }))
                        }
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none"
                      >
                        <option value="">{t("filters.salaryRangePlaceholder")}</option>
                        <option value="0-10000">
                          {t("filters.salaryRanges.upTo10000")}
                        </option>
                        <option value="10001-15000">
                          {t("filters.salaryRanges.10001to15000")}
                        </option>
                        <option value="15001-20000">
                          {t("filters.salaryRanges.15001to20000")}
                        </option>
                        <option value="20001-30000">
                          {t("filters.salaryRanges.20001to30000")}
                        </option>
                        <option value="30001-50000">
                          {t("filters.salaryRanges.30001to50000")}
                        </option>
                        <option value="50001+">
                          {t("filters.salaryRanges.moreThan50000")}
                        </option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">
                      {t("filters.skillsLabel")}
                    </label>
                    <input
                      value={filters.skills}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          skills: e.target.value,
                        }))
                      }
                      placeholder={t("filters.skillsPlaceholder")}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>
              </div>

              {/* ส่วนที่ 3: ตัวกรองเต็มแบบ Popup */}
              {isFilterPanelOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 pt-[120px] pb-8">
                  <button
                    type="button"
                    aria-label={t("filters.closeFilterAria")}
                    onClick={() => setIsFilterPanelOpen(false)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                  />

                  <div className="relative flex w-full max-w-6xl max-h-[calc(100vh-150px)] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl border border-slate-200">
                    <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
                      <div className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <Filter className="w-5 h-5 text-indigo-600" />
                        {t("filters.title")}
                      </div>
                        
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                      <div className="space-y-6">

                  {/* --- Group 1: ข้อมูลส่วนบุคคล --- */}
                  <div className="space-y-4">
                    <div className="bg-slate-100/80 px-4 py-2 rounded-xl  ">
                      <div className="flex items-center mb-6">
                        <div className="bg-[#020263] px-5 py-2 rounded-xl shadow-md flex items-center gap-3 shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t("filters.personalInfo")}
                          </h3>
                        </div>
                        <div className="flex-1 h-[1px] bg-slate-200 ml-4" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* จังหวัด */}
                        <div className="relative" ref={locationDropdownRef}>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                            <input
                              type="text"
                              value={
                                isLocationOpen
                                  ? locationSearch
                                  : filters.province
                                    ? tt(`provinces.${filters.province}`)
                                    : ""
                              }
                              onChange={(e) => {
                                setLocationSearch(e.target.value);
                                if (!isLocationOpen) setIsLocationOpen(true);
                              }}
                              onFocus={() => {
                                setIsLocationOpen(true);
                                setLocationSearch("");
                              }}
                              placeholder={t("filters.currentProvincePlaceholder")}
                              className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isLocationOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {isLocationOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      province: "",
                                    }));
                                    setIsLocationOpen(false);
                                    setLocationSearch("");
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg italic hover:text-slate-600"
                                >
                                  -- เลือกทุกจังหวัด (ล้างค่า) --
                                </button>

                                {PROVINCE_KEYS.filter((k) => k !== "all").map(
                                  (key) => {
                                    const provinceName = tt(`provinces.${key}`);

                                    if (
                                      locationSearch &&
                                      !provinceName
                                        .toLowerCase()
                                        .includes(locationSearch.toLowerCase())
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                          setFilters((prev) => ({
                                            ...prev,
                                            province: key,
                                          }));
                                          setIsLocationOpen(false);
                                          setLocationSearch("");
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                          filters.province === key
                                            ? "bg-indigo-50 text-indigo-700 font-bold"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        {provinceName}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* จังหวัดที่สนใจ */}
                        <div className="relative" ref={desiredLocationRef}>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 pointer-events-none" />
                            <input
                              type="text"
                              value={
                                isDesiredOpen
                                  ? desiredSearch
                                  : filters.desiredProvinces
                                    ? tt(
                                        `provinces.${filters.desiredProvinces}`,
                                      )
                                    : ""
                              }
                              onChange={(e) => {
                                setDesiredSearch(e.target.value);
                                if (!isDesiredOpen) setIsDesiredOpen(true);
                              }}
                              onFocus={() => {
                                setIsDesiredOpen(true);
                                setDesiredSearch("");
                              }}
                              placeholder={t("filters.desiredProvincePlaceholder")}
                              className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isDesiredOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {isDesiredOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      desiredProvinces: "",
                                    })); // ล้างค่าเป็นว่างเพื่อให้ Placeholder แสดง
                                    setIsDesiredOpen(false);
                                    setDesiredSearch("");
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg italic hover:text-slate-600"
                                >
                                  -- เลือกทุกจังหวัด (ล้างค่า) --
                                </button>

                                {PROVINCE_KEYS.filter((k) => k !== "all").map(
                                  (key) => {
                                    const provinceName = tt(`provinces.${key}`);

                                    if (
                                      desiredSearch &&
                                      !provinceName
                                        .toLowerCase()
                                        .includes(desiredSearch.toLowerCase())
                                    )
                                      return null;

                                    return (
                                      <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                          setFilters((prev) => ({
                                            ...prev,
                                            desiredProvinces: key,
                                          })); // เก็บเป็น key
                                          setIsDesiredOpen(false);
                                          setDesiredSearch("");
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                          // ไฮไลท์จะติดเพราะเทียบ key ตรงกันแล้ว
                                          filters.desiredProvinces === key
                                            ? "bg-indigo-50 text-indigo-700 font-bold"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        {provinceName}
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* เพศ */}
                        <div className="relative" ref={genderDropdownRef}>
                          <div className="relative">
                            {/* ไอคอนด้านซ้าย */}
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />

                            <input
                              type="text"
                              // ถ้าเปิด Dropdown ให้แสดงค่าที่กำลังพิมพ์ ถ้าปิดให้แสดงค่าที่เลือกจริง
                              value={
                                isGenderOpen
                                  ? genderSearch
                                  : filters.gender === "male"
                                    ? t("filters.gender.male") 
                                    : filters.gender === "female"
                                      ? t("filters.gender.female") 
                                      : filters.gender === ""
                                        ? ""
                                        : t("filters.genderAll") 
                              }
                              onChange={(e) => {
                                setGenderSearch(e.target.value);
                                if (!isGenderOpen) setIsGenderOpen(true);
                              }}
                              onFocus={() => {
                                setIsGenderOpen(true);
                                setGenderSearch("");
                              }}
                              placeholder={
                                t("filters.genderAll") 
                              }
                              // ปรับเป็น rounded-2xl ถาวร และ shadow-none
                              className="w-full h-11 border border-slate-200 pl-11 pr-4 text-sm text-black bg-white rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                            />

                            {/* ไอคอนลูกศรด้านขวา */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isGenderOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {/* ส่วนรายการ Dropdown - เพิ่ม mt-2 และเปลี่ยนเป็น rounded-2xl */}
                          {isGenderOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none">
                              <div className="p-2 space-y-0.5">
                                {[
                                  {
                                    value: "",
                                    label: t("filters.genderAll") ,
                                  },
                                  {
                                    value: "male",
                                    label: t("filters.gender.male") ,
                                  },
                                  {
                                    value: "female",
                                    label: t("filters.gender.female") ,
                                  },
                                ].map((item) => {
                                  if (
                                    genderSearch &&
                                    !item.label
                                      .toLowerCase()
                                      .includes(genderSearch.toLowerCase())
                                  )
                                    return null;

                                  // แยกสไตล์ระหว่าง "ปุ่มล้างค่า (ทุกเพศ)" กับ "ปุ่มตัวเลือกปกติ"
                                  const isClearOption = item.value === "";

                                  return (
                                    <button
                                      key={item.value}
                                      type="button"
                                      onClick={() => {
                                        setFilters((prev) => ({
                                          ...prev,
                                          gender: item.value,
                                        }));
                                        setIsGenderOpen(false);
                                        setGenderSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                        isClearOption
                                          ? "italic text-slate-400 hover:bg-slate-50 hover:text-slate-600" // สไตล์ล้างค่า (เหมือนที่อยู่)
                                          : filters.gender === item.value
                                            ? "bg-indigo-50 text-indigo-700 font-bold" // ตัวเลือกที่ถูกเลือก
                                            : "text-slate-700 hover:bg-slate-50" // ตัวเลือกปกติ
                                      }`}
                                    >
                                      {isClearOption
                                        ? `-- ${item.label} (ล้างค่า) --`
                                        : item.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* อายุเริ่มต้น */}
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                          <input
                            value={filters.ageMin}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                ageMin: e.target.value,
                              }))
                            }
                            placeholder={t("filters.ageMin") }
                            type="number"
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all hover:border-indigo-300"
                          />
                        </div>

                        {/* อายุสูงสุด */}
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                          <input
                            value={filters.ageMax}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                ageMax: e.target.value,
                              }))
                            }
                            placeholder={t("filters.ageMax") }
                            type="number"
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all hover:border-indigo-300 "
                          />
                        </div>

                        {/* ประเภทงาน (Job Type) - ปลดล็อคให้เลือกได้ตลอดเวลา */}
                        <div className="relative" ref={jobTypeDropdownRef}>
                          <div className="relative">
                            <Clock3 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 z-10 pointer-events-none text-indigo-500" />
                            <input
                              type="text"
                              readOnly
                              // ไม่ใช้ disabled แล้ว เพื่อให้เลือกได้เสมอ
                              value={filters.jobType ? jobTypeLabelMap[filters.jobType] || filters.jobType : t("filters.jobTypePlaceholder")}
                              onClick={() => setIsJobTypeOpen(!isJobTypeOpen)}
                              className={`w-full h-11 border pl-11 pr-10 text-sm rounded-2xl transition-all cursor-pointer focus:outline-none bg-white border-slate-200 text-black focus:ring-2 focus:ring-indigo-200 ${
                                !filters.jobType
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isJobTypeOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {/* Dropdown รายการประเภทงาน - แสดงผลได้ตลอดเมื่อกด */}
                          {isJobTypeOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
                              <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      jobType: "",
                                    }));
                                    setIsJobTypeOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50"
                                >
                                  {t("filters.all")}
                                </button>
                                {JOB_TYPES.map((type) => (
                                  <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        jobType: type,
                                      }));
                                      setIsJobTypeOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.jobType === type
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
{jobTypeLabelMap[type] || type}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ประสบการณ์การทำงาน */}
                        <div className="relative" ref={expDropdownRef}>
                          <div className="relative">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                            <input
                              type="text"
                              readOnly
                              value={getExperienceLabel(filters.experience)}
                              onClick={() => setIsExpOpen(!isExpOpen)}
                              className={`w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.experience
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {isExpOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-xl">
                              <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      experience: "",
                                      business_type: "",
                                    }));
                                    setIsExpOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.all")}
                                </button>

                                {experienceOptions.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        experience: item.id,
                                        business_type:
                                          item.id === "0"
                                            ? ""
                                            : prev.business_type,
                                      }));
                                      setIsExpOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.experience === item.id
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* ประเภทธุรกิจ (Business Type) */}
                        <div
                          className={`relative transition-all duration-300 ${!isExpValid ? "opacity-50 cursor-not-allowed" : ""}`}
                          ref={businessTypeDropdownRef}
                        >
                          <div className="relative">
                            <Building2
                              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 ${!isExpValid ? "text-slate-300" : "text-indigo-500"}`}
                            />
                            <input
                              type="text"
                              disabled={!isExpValid}
                              // ใช้ filters.business_type (snake_case) ตาม Interface Filters ของคุณ
                              value={
                                isBusinessOpen
                                  ? businessSearch
                                  : filters.business_type || ""
                              }
                              onChange={(e) => {
                                setBusinessSearch(e.target.value);
                                if (!isBusinessOpen) setIsBusinessOpen(true);
                              }}
                              onFocus={() => {
                                if (isExpValid) {
                                  setIsBusinessOpen(true);
                                  setBusinessSearch("");
                                }
                              }}
                              placeholder={
                                isExpValid
                                  ? t("filters.businessTypePlaceholder")
                                  : t("filters.businessTypeDisabled")
                              }
                              className={`w-full h-11 rounded-2xl border pl-11 pr-4 text-sm transition-all ${
                                !isExpValid
                                  ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-black focus:outline-none focus:ring-2 focus:ring-indigo-200"
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${!isExpValid ? "text-slate-300" : "text-slate-400"} ${isBusinessOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {/* Dropdown จะแสดงก็ต่อเมื่อเงื่อนไขผ่านเท่านั้น */}
                          {isExpValid && isBusinessOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      business_type: "",
                                    }));
                                    setIsBusinessOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:bg-slate-50 rounded-lg italic"
                                >
                                  -- ทุกประเภทธุรกิจ --
                                </button>
                                {BUSINESS_TYPES.map((name) => {
                                  // ค้นหาจากชื่อภาษาไทยในอาเรย์โดยตรง
                                  if (
                                    businessSearch &&
                                    !name
                                      .toLowerCase()
                                      .includes(businessSearch.toLowerCase())
                                  )
                                    return null;

                                  return (
                                    <button
                                      key={name}
                                      type="button"
                                      onClick={() => {
                                        setFilters((prev) => ({
                                          ...prev,
                                          business_type: name,
                                        }));
                                        setIsBusinessOpen(false);
                                        setBusinessSearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                        filters.business_type === name
                                          ? "bg-indigo-50 text-indigo-700 font-bold"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Group 2: ความสามารถและทักษะ --- */}
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-100/80 px-4 py-2 rounded-xl ">
                      <div className="flex items-center mb-6">
                        <div className="bg-[#020263] px-5 py-2 rounded-xl shadow-md flex items-center gap-3 shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t("detailModal.skillsTitle")}
                          </h3>
                        </div>
                        <div className="flex-1 h-[1px] bg-slate-200 ml-4" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* 1. เลือกภาษา (แบบพิมพ์ค้นหาได้เหมือนจังหวัด) */}
                        <div className="relative" ref={languageDropdownRef}>
                          <div className="relative">
                            <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />

                            <input
                              type="text"
                              value={
                                isLanguageOpen
                                  ? languageSearch
                                  : filters.language || ""
                              }
                              onChange={(e) => {
                                setLanguageSearch(e.target.value);
                                if (!isLanguageOpen) setIsLanguageOpen(true);
                              }}
                              onFocus={() => {
                                setIsLanguageOpen(true);
                                setLanguageSearch("");
                              }}
                              placeholder={t("filters.allLanguages")}
                              className="w-full h-11 border border-slate-200 pl-11 pr-4 text-sm text-black bg-white rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                            />

                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isLanguageOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {/* รายการตัวเลือก */}
                          {isLanguageOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none">
                              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
                                {/* ปุ่มล้างค่าภาษา (ปรับให้เหมือนตัวเลือกจังหวัด) */}
                                {!languageSearch && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        language: "",
                                        languageLevel: "",
                                      }));
                                      setIsLanguageOpen(false);
                                      setLanguageSearch("");
                                    }}
                                    // ลบเงื่อนไขไฮไลท์ออก ใช้สี slate-400 และ hover เป็นหลัก
                                    className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                  >
                                    -- เลือกทุกภาษา (ล้างค่า) --
                                  </button>
                                )}

                                {LANGUAGES_LIST.filter((lang) =>
                                  lang
                                    .toLowerCase()
                                    .includes(languageSearch.toLowerCase()),
                                ).map((lang) => (
                                  <button
                                    key={lang}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        language: lang,
                                        languageLevel: "",
                                      }));
                                      setIsLanguageOpen(false);
                                      setLanguageSearch("");
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.language === lang
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {lang}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2 ระดับความเชี่ยวชาญ */}
                        <div
                          className={`relative transition-all duration-300 ${!filters.language ? "opacity-50 cursor-not-allowed" : ""}`}
                          ref={englishDropdownRef}
                        >
                          <div className="relative">
                            {/* icon ซ้าย - เปลี่ยนสีตามสถานะ */}
                            <Languages
                              className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10 ${!filters.language ? "text-slate-300" : "text-indigo-500"}`}
                            />

                            <input
                              type="text"
                              readOnly
                              disabled={!filters.language}
                              value={filters.languageLevel || ""}
                              onClick={() => {
                                if (filters.language)
                                  setIsEnglishOpen(!isEnglishOpen);
                              }}
                              placeholder={
                                filters.language
                                  ? t("filters.languageLevelPlaceholder")
                                  : t("filters.selectLanguageFirst")
                              }
                              // ปรับ className ให้มีการเปลี่ยนสีพื้นหลังและขอบเมื่อ disabled
                              className={`w-full h-11 border rounded-2xl pl-11 pr-10 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.language
                                  ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-white border-slate-200 text-black cursor-pointer"
                              }`}
                            />

                            {/* chevron - เปลี่ยนสีตามสถานะ */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  !filters.language
                                    ? "text-slate-300"
                                    : "text-slate-500"
                                } ${isEnglishOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {/* dropdown จะแสดงต่อเมื่อมีภาษาถูกเลือกเท่านั้น */}
                          {isEnglishOpen && filters.language && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-xl">
                              <div className="max-h-60 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      languageLevel: "",
                                    }));
                                    setIsEnglishOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  -- ทุกระดับ (ล้างค่า) --
                                </button>

                                {LANGUAGE_LEVELS.map((level) => (
                                  <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        languageLevel: level,
                                      }));
                                      setIsEnglishOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.languageLevel === level
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {level}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* --- 1. ใบอนุญาตขับขี่ --- */}
                        <div className="relative" ref={licenseDropdownRef}>
                          <div className="relative">
                            {/* ไอคอนด้านซ้าย */}
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />

                            <input
                              type="text"
                              readOnly
                              value={
                                filters.hasDrivingLicense === "l_car"
                                  ? drivingSkillMap.l_car[locale as "th" | "en"]
                                  : filters.hasDrivingLicense === "l_bike"
                                    ? drivingSkillMap.l_bike[locale as "th" | "en"]
                                    : filters.hasDrivingLicense === "l_truck_6"
                                      ? drivingSkillMap.l_truck_6[locale as "th" | "en"]
                                      : filters.hasDrivingLicense ===
                                          "l_truck_10"
                                        ? drivingSkillMap.l_truck_10[locale as "th" | "en"]
                                        : t("filters.drivingLicenseAll")
                              }
                              onClick={() => setIsLicenseOpen(!isLicenseOpen)}
                              // แก้ไข: ใช้ rounded-2xl ตลอดเวลา (ไม่ต้องสลับเป็นเหลี่ยม) เพื่อให้เข้ากับ Dropdown ที่แยกห่างออกมา
                              className={`w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.hasDrivingLicense
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />

                            {/* ไอคอนลูกศรทางขวา */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isLicenseOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {/* รายการตัวเลือก (Dropdown) */}
                          {isLicenseOpen && (
                            <div
                              // แก้ไข: เปลี่ยน mt-0 เป็น mt-2 เพื่อเว้นระยะ และใส่ rounded-2xl พร้อม border ครบทุกด้าน
                              className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none"
                            >
                              <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                {/* ... เนื้อหาข้างในปุ่มกดเลือกเหมือนเดิม ... */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      hasDrivingLicense: "",
                                    }));
                                    setIsLicenseOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.allClear")}
                                </button>
                                {[
                                  { id: "l_car", label: drivingSkillMap.l_car[locale as "th" | "en"] },
                                  {
                                    id: "l_bike",
                                    label: drivingSkillMap.l_bike[locale as "th" | "en"],
                                  },
                                  {
                                    id: "l_truck_6",
                                    label: drivingSkillMap.l_truck_6[locale as "th" | "en"],
                                  },
                                  {
                                    id: "l_truck_10",
                                    label: drivingSkillMap.l_truck_10[locale as "th" | "en"],
                                  },
                                ].map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        hasDrivingLicense: item.id,
                                      }));
                                      setIsLicenseOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${filters.hasDrivingLicense === item.id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-700 hover:bg-slate-50"}`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* --- 2. พาหนะส่วนตัว --- */}
                        <div className="relative" ref={carDropdownRef}>
                          <div className="relative">
                            {/* ไอคอนด้านซ้าย - ตำแหน่งเดียวกับภาษา */}
                            <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />

                            <input
                              type="text"
                              readOnly
                              value={
                                filters.hasOwnCar === "v_car"
                                  ? drivingSkillMap.v_car[locale as "th" | "en"]
                                  : filters.hasOwnCar === "v_bike"
                                    ? drivingSkillMap.v_bike[locale as "th" | "en"]
                                    : t("filters.vehicleAll")
                              }
                              onClick={() => setIsCarOpen(!isCarOpen)}
                              // แก้ไข Class ให้เป็น input สไตล์เดียวกับภาษา
                              // pl-11 เพื่อเว้นที่ให้ไอคอนรถ, pr-10 เพื่อหลบลูกศร
                              className={`w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.hasOwnCar
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />

                            {/* ไอคอนลูกศรทางขวา - วางตำแหน่งและอนิเมชั่นเหมือนภาษา */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isCarOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {/* รายการตัวเลือก (Dropdown) */}
                          {isCarOpen && (
                            <div
                              // mt-2 เพื่อเว้นระยะจากกรอบหลัก และ rounded-2xl เพื่อให้มนสวยงาม
                              className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none"
                            >
                              <div className="p-2 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      hasOwnCar: "",
                                    }));
                                    setIsCarOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.allClear")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      hasOwnCar: "v_car",
                                    }));
                                    setIsCarOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                    filters.hasOwnCar === "v_car"
                                      ? "bg-indigo-50 text-indigo-700 font-bold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {drivingSkillMap.v_car[locale as "th" | "en"]}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      hasOwnCar: "v_bike",
                                    }));
                                    setIsCarOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                    filters.hasOwnCar === "v_bike"
                                      ? "bg-indigo-50 text-indigo-700 font-bold"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                >
                                  {drivingSkillMap.v_bike[locale as "th" | "en"]}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* --- 3. ทักษะเครื่องจักร --- */}
                        <div className="relative" ref={machineryDropdownRef}>
                          <div className="relative">
                            <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />

                            <input
                              type="text"
                              readOnly
                              value={
                                filters.machinerySkill === "m_backhoe"
                                  ? drivingSkillMap.m_backhoe[locale as "th" | "en"]
                                  : filters.machinerySkill === "m_crane"
                                    ? drivingSkillMap.m_crane[locale as "th" | "en"]
                                    : filters.machinerySkill === "m_forklift"
                                      ? drivingSkillMap.m_forklift[locale as "th" | "en"]
                                      : t("filters.machineryAll")
                              }
                              onClick={() =>
                                setIsMachineryOpen(!isMachineryOpen)
                              }
                              className={`w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.machinerySkill
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />

                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                                  isMachineryOpen ? "rotate-180" : "rotate-0"
                                }`}
                              />
                            </div>
                          </div>

                          {isMachineryOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none">
                              <div className="p-2 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      machinerySkill: "",
                                    }));
                                    setIsMachineryOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.allClear")}
                                </button>
                                {[
                                  {
                                    id: "m_backhoe",
                                    label: drivingSkillMap.m_backhoe[locale as "th" | "en"],
                                  },
                                  { id: "m_crane", label: drivingSkillMap.m_crane[locale as "th" | "en"] },
                                  {
                                    id: "m_forklift",
                                    label: drivingSkillMap.m_forklift[locale as "th" | "en"],
                                  },
                                ].map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        machinerySkill: item.id,
                                      }));
                                      setIsMachineryOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.machinerySkill === item.id
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. ค้นหาจากทักษะ (Skills) - กินพื้นที่ 2 คอลัมน์ในจอใหญ่ */}
                        <div className="md:col-span-2 relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                            <svg
                              className="w-4 h-4 text-indigo-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>

                          <input
                            type="text"
                            value={filters.skills}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                skills: e.target.value,
                              }))
                            }
                            placeholder={
                              t("filters.skills") ||
                              t("filters.otherSkillsPlaceholder")
                            }
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- Group 3: ประวัติการศึกษา --- */}
                  <div className="space-y-4 pt-3">
                    <div className="bg-slate-100/80 px-4 py-2 rounded-xl  ">
                      <div className="flex items-center mb-6">
                        <div className="bg-[#020263] px-5 py-2 rounded-xl shadow-md flex items-center gap-3 shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            {t("filters.educationHistory")}
                          </h3>
                        </div>
                        <div className="flex-1 h-[1px] bg-slate-200 ml-4" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {/* ระดับการศึกษา */}
                        <div className="relative" ref={eduDropdownRef}>
                          <div className="relative">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                            <input
                              type="text"
                              readOnly
                              value={getEducationLabel(filters.educationLevel)}
                              onClick={() => setIsEduOpen(!isEduOpen)}
                              className={`w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white cursor-pointer rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none ${
                                !filters.educationLevel
                                  ? "text-slate-500"
                                  : "text-black"
                              }`}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isEduOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {isEduOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-none">
                              <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      educationLevel: "",
                                    }));
                                    setIsEduOpen(false);
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.all")}
                                </button>
                                {educationOptions.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setFilters((prev) => ({
                                        ...prev,
                                        educationLevel: item.id,
                                      }));
                                      setIsEduOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                      filters.educationLevel === item.id
                                        ? "bg-indigo-50 text-indigo-700 font-bold"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="relative" ref={facultyDropdownRef}>
                          <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                            <input
                              type="text"
                              // ถ้าเปิด Dropdown ให้โชว์คำที่กำลังพิมพ์ (search) ถ้าปิดให้โชว์ค่าที่เลือกจริง (filters.faculty)
                              value={
                                isFacultyOpen
                                  ? facultySearch
                                  : filters.faculty || ""
                              }
                              placeholder={t("filters.facultyPlaceholder")}
                              onChange={(e) => setFacultySearch(e.target.value)}
                              onFocus={() => {
                                setIsFacultyOpen(true);
                                setFacultySearch(""); // ล้างคำค้นหาเก่าเมื่อกดใหม่
                              }}
                              className="w-full h-11 border border-slate-200 pl-11 pr-10 text-sm bg-white rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none text-black"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown
                                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isFacultyOpen ? "rotate-180" : ""}`}
                              />
                            </div>
                          </div>

                          {isFacultyOpen && (
                            <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 shadow-lg">
                              <div className="p-2 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                                {/* เพิ่มปุ่มล้างค่า (Reset) เหมือนระดับการศึกษา */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilters((prev) => ({
                                      ...prev,
                                      faculty: "",
                                    })); // ล้างค่าใน filters
                                    setIsFacultyOpen(false); // ปิด dropdown
                                    setFacultySearch(""); // ล้างคำที่พิมพ์ค้างไว้
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors italic text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                                >
                                  {t("filters.all")}
                                </button>

                                {/* รายการคณะที่ผ่านการกรอง (Search) */}
                                {filteredFaculties.length === 0 ? (
                                  <div className="px-4 py-2.5 text-sm text-slate-400 italic">
                                    ไม่พบชื่อคณะนี้...
                                  </div>
                                ) : (
                                  filteredFaculties.map((facultyName) => (
                                    <button
                                      key={facultyName}
                                      type="button"
                                      onClick={() => {
                                        setFilters((prev) => ({
                                          ...prev,
                                          faculty: facultyName,
                                        }));
                                        setIsFacultyOpen(false);
                                        setFacultySearch("");
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                        filters.faculty === facultyName
                                          ? "bg-indigo-50 text-indigo-700 font-bold"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {facultyName}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* สาขาวิชา (Keyword) */}
                        <div className="relative">
                          <StickyNote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                          <input
                            value={filters.major}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                major: e.target.value,
                              }))
                            }
                            placeholder={t("filters.majorPlaceholder")}
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                          />
                        </div>

                        {/* เกรดเฉลี่ยขั้นต่ำ */}
                        <div className="relative">
                          <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                          <input
                            value={filters.minGpa}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                minGpa: e.target.value,
                              }))
                            }
                            placeholder={
                              t("filters.gpa") 
                            }
                            type="number"
                            step="0.01"
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                          />
                        </div>

                        {/* สถานศึกษา */}
                        <div className="relative">
                          <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                          <input
                            value={filters.institution}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                institution: e.target.value,
                              }))
                            }
                            placeholder={
                              t("filters.institution") 
                            }
                            className="w-full h-11 rounded-2xl border border-slate-200 pl-11 pr-4 text-sm text-black bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 shadow-none"
                          />
                        </div>
                      </div>
                    </div>
                      </div>
                    </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-white">
                      <button
                        type="button"
                        onClick={() => setIsFilterPanelOpen(false)}
                        className="inline-flex items-center justify-center h-11 px-6 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition-colors"
                      >
                        {t("filters.cancel")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSearch();
                          setIsFilterPanelOpen(false);
                        }}
                        className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl bg-[#020263] hover:bg-[#11117c] text-white font-semibold transition-colors"
                      >
                        <Search className="w-4 h-4" />
                        {t("search.btnSearch")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {t("list.title")}
              </h2>
              <p className="text-sm text-slate-500 mt-2">
                {t("list.resultCount")} {resultText} {t("list.list")}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[320px] rounded-[2rem] bg-white border border-slate-100 shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm px-8 py-16 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t("list.emptyTitle")}
              </h3>
              <p className="text-sm text-slate-500">{t("list.emptyDesc")}</p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCandidates.map((candidate) => {
                const highlight = getMatchedSnippet(
                  candidate,
                  searchParams.get("query"),
                );

                return (
                  <div key={candidate.id} className="h-full">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className="text-left w-full rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6 h-full min-h-[700px] flex flex-col relative overflow-hidden"
                    >
                      {highlight && (
                        <div className="mb-4 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                          <Search className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-xs text-slate-600 truncate">
                            ตรงกับที่คุณหา:{" "}
                            <strong className="text-indigo-600 font-bold">
                              {highlight}
                            </strong>
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-5">
                        <div className="flex items-center gap-4 min-w-0">
                          <GenderAvatar
                            gender={candidate.gender}
                            avatarUrl={candidate.avatarUrl}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {candidate.experience !== null && (
                                <div className="px-2 py-0.5 rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                                  {candidate.experience > 0
                                    ? `${t("filters.experienceLabel")}: ${candidate.experience} ${t("list.ageUnit")}`
                                    : t("filters.experienceOptions.noExperience")}
                                </div>
                              )}
                            </div>
                            <div className="text-lg font-extrabold text-slate-900 truncate">
                              {candidate.fullName}
                            </div>
                            <div className="text-sm text-slate-500">
                              {candidate.age
                                ? `${candidate.age} ${t("list.ageUnit")}`
                                : t("list.noAge")}{" "}
                              · {candidate.gender || t("list.noGender")}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-xs text-slate-400 whitespace-nowrap">
                            {timeAgo(candidate.postedAt)}
                          </div>
                          {user?.role === "EMPLOYER" && (
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();
                                setCandidates((prev) =>
                                  prev.map((c) =>
                                    c.id === candidate.id
                                      ? { ...c, isBookmarked: !c.isBookmarked }
                                      : c,
                                  ),
                                );
                                try {
                                  await bookmarkService.toggle(candidate.id);
                                } catch (error) {
                                  setCandidates((prev) =>
                                    prev.map((c) =>
                                      c.id === candidate.id
                                        ? {
                                            ...c,
                                            isBookmarked: !c.isBookmarked,
                                          }
                                        : c,
                                    ),
                                  );
                                  alert(
                                    t("list.actionError"),
                                  );
                                }
                              }}
                              className={`p-2 rounded-full border transition-colors cursor-pointer ${
                                candidate.isBookmarked
                                  ? "bg-rose-50 border-rose-100 text-rose-500"
                                  : "bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                              }`}
                            >
                              <Heart
                                className="w-4 h-4"
                                fill={
                                  candidate.isBookmarked
                                    ? "currentColor"
                                    : "none"
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 text-sm text-slate-700">
                        <div className="font-bold text-[#020263] text-base mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-pink-500 shrink-0" />
                            <span>{t("list.lookingFor")}</span>
                          </div>

                          <div className="flex flex-col gap-y-2.5">
                            {candidate.jobPreferences &&
                            candidate.jobPreferences.length > 0 ? (
                              candidate.jobPreferences.map((pref, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 group"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                  <span className="text-sm font-bold text-slate-800">
                                    {pref.position}
                                  </span>
                                  {pref.job_type && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-indigo-100 text-[10px] font-bold text-indigo-500 bg-indigo-50/50 whitespace-nowrap">
                                      {pref.job_type}
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : candidate.desiredPosition ? (
                              candidate.desiredPosition
                                .split(",")
                                .map((pos, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />

                                    <span className="text-sm font-bold text-slate-800">
                                      {pos.trim()}
                                    </span>
                                    {(candidate as any).jobTypes?.[idx] && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 bg-slate-50 whitespace-nowrap">
                                        {(candidate as any).jobTypes[idx]}
                                      </span>
                                    )}
                                  </div>
                                ))
                            ) : (
                              <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                                {t("list.noSpecified")}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Banknote className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
                          <span>
                            {t("list.salary")} {candidate.expectedSalaryText}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" />
                          <div className="flex flex-col">
                            <span>
                              {t("list.education")} {candidate.educationLevel}
                            </span>
                            <span className="text-xs text-slate-500 leading-relaxed">
                              {candidate.major}{" "}
                              {candidate.institution
                                ? `· ${candidate.institution}`
                                : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />
                          <div className="flex flex-col w-full">
                            <span>{t("list.address") || "ที่อยู่"}</span>
                            <div className="flex items-center text-sm text-slate-700">
                              <span className="text-xs text-slate-500 leading-relaxed">
                                {[
                                  candidate.subDistrict &&
                                    ` ${candidate.subDistrict}`,
                                  candidate.district &&
                                    ` ${candidate.district}`,
                                  candidate.province &&
                                    ` ${candidate.province}`,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                {!candidate.subDistrict &&
                                  !candidate.district &&
                                  !candidate.province &&
                                  (t("list.noAddress") || "ไม่ระบุข้อมูล")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Star className="w-4 h-4 mt-0.5 text-yellow-500 shrink-0" />
                          <div className="flex flex-col w-full">
                            <span>
                              {t("list.province") || "จังหวัดที่สนใจ"}
                            </span>

                            <div className="flex flex-col gap-y-1.5">
                              {candidate.desiredProvinces &&
                              candidate.desiredProvinces.length > 0 ? (
                                candidate.desiredProvinces.map(
                                  (provinceName: any, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center text-xs group"
                                    >
                                      <span className="w-1 h-1 rounded-full bg-yellow-500 mr-2 shrink-0" />
                                      <span className="text-xs text-slate-500 leading-relaxed">
                                        {provinceName}
                                      </span>
                                    </div>
                                  ),
                                )
                              ) : (
                                /* Fallback กรณีไม่มีข้อมูล - แสดงจังหวัดปัจจุบัน */
                                <div className="flex items-center text-xs">
                                  <span className="w-1 h-1 rounded-full bg-slate-300 mr-2 shrink-0" />
                                  <span className="text-xs text-slate-400 italic leading-relaxed">
                                    {t("list.noProvince") || "ไม่ระบุ"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Languages className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                          <div className="flex flex-col w-full">
                            <span>
                              {t("list.languageSkills") || "ทักษะทางภาษา"}
                            </span>

                            <div className="flex flex-col gap-y-1.5">
                              {candidate.languages &&
                              candidate.languages.length > 0 ? (
                                candidate.languages.map((lang, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center text-xs group"
                                  >
                                    {/* จุดนำหน้า (Bullet Point) */}
                                    <span className="w-1 h-1 rounded-full bg-amber-500 mr-2 shrink-0" />

                                    <div className="flex justify-between items-center w-full">
                                      <span className="text-xs text-slate-500 leading-relaxed">
                                        {lang.language}
                                      </span>
                                      {lang.level && (
                                        <span className="text-[10px] text-slate-400 font-normal">
                                          {lang.level}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                /* Fallback กรณีไม่มี Array */
                                <div className="flex items-center text-xs italic text-slate-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2" />
                                  {t("list.english")}:{" "}
                                  {candidate.englishLevelLabel || "ไม่ระบุ"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <Car className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                          <div className="flex flex-col w-full">
                            <span>
                              {t("list.drivingSkillsTitle") || "ทักษะการขับขี่"}
                            </span>

                            <div className="flex flex-col gap-y-1.5">
                              {candidate.drivingSkills &&
                              candidate.drivingSkills.length > 0 ? (
                                candidate.drivingSkills.map(
                                  (skillId: string) => {
                                    const skillData =
                                      drivingSkillMap[
                                        skillId as keyof typeof drivingSkillMap
                                      ];
                                    const label = skillData
                                      ? locale === "en"
                                        ? skillData.en
                                        : skillData.th
                                      : skillId;

                                    return (
                                      <div
                                        key={skillId}
                                        className="flex items-center text-xs"
                                      >
                                        {/* จุดนำหน้าสีเดียวกับไอคอนรถ (Blue-500) */}
                                        <span className="w-1 h-1 rounded-full bg-blue-500 mr-2 shrink-0" />
                                        <span className="text-xs text-slate-500 leading-relaxed">
                                          {label}
                                        </span>
                                      </div>
                                    );
                                  },
                                )
                              ) : (
                                /* กรณีไม่มีข้อมูล */
                                <div className="flex items-center text-xs italic text-slate-400">
                                  <span className="w-1 h-1 rounded-full bg-slate-300 mr-2 shrink-0" />
                                  {t("list.noDrivingSkill") || "ไม่มีข้อมูล"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                        {candidate.skills.length > 0 ? (
                          candidate.skills.slice(0, 4).map((skill) => {
                            const isMatch =
                              searchParams.get("query") &&
                              skill
                                .toLowerCase()
                                .includes(
                                  searchParams.get("query")!.toLowerCase(),
                                );
                            return (
                              <span
                                key={skill}
                                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                                  isMatch
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {skill}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400">
                            {t("list.noSkills")}
                          </span>
                        )}
                      </div>

                      <div className="mt-auto pt-5 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Clock3 className="w-3.5 h-3.5" />
                          {t("list.updated")} {timeAgo(candidate.postedAt)}
                        </div>
                        <span className="font-bold text-indigo-600 group-hover:underline">
                          {t("list.viewDetail")}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />

      {selectedCandidateId && (
        <CandidateDetailModal
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
          isBookmarked={
            filteredCandidates.find((c) => c.id === selectedCandidateId)
              ?.isBookmarked
          }
          onBookmarkToggle={() => {
            setCandidates((prev) =>
              prev.map((c) =>
                c.id === selectedCandidateId
                  ? { ...c, isBookmarked: !c.isBookmarked }
                  : c,
              ),
            );
          }}
        />
      )}
    </div>
  );
}
