'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from 'next-intl';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
    User,
    GraduationCap,
    Briefcase,
    Languages,
    Award,
    Car,
    Bike,
    Truck,
    Wrench,
    CreditCard,
    Loader2,
    Check,
    Pickaxe,
    Construction,
    type LucideIcon,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const menuLabels = {
    th: {
        personal: 'ข้อมูลส่วนบุคคล',
        education: 'ประวัติการศึกษา',
        work: 'ตำแหน่ง/ประวัติการทำงาน',
        language: 'ความสามารถทางภาษา',
        driving: 'ทักษะการขับขี่',
        certificates: 'ใบประกาศนียบัตร',
    },
    en: {
        personal: 'Personal Information',
        education: 'Education History',
        work: 'Work History',
        language: 'Language Skills',
        driving: 'Driving Skills',
        certificates: 'Certificates',
    }
};

const getLicenseTypes = (locale: 'th' | 'en') => [
    { id: 'l_car', label: locale === 'en' ? 'Car' : 'รถยนต์', icon: Car },
    { id: 'l_bike', label: locale === 'en' ? 'Motorcycle' : 'รถจักรยานยนต์', icon: Bike },
    { id: 'l_truck_6', label: locale === 'en' ? '6-wheel Truck' : 'รถบรรทุก 6 ล้อ', icon: Truck },
    { id: 'l_truck_10', label: locale === 'en' ? '10-wheel Truck' : 'รถบรรทุก 10 ล้อ', icon: Truck },
];

const getTravelVehicles = (locale: 'th' | 'en') => [
    { id: 'v_car', label: locale === 'en' ? 'Private Car' : 'รถยนต์ส่วนตัว', icon: Car },
    { id: 'v_bike', label: locale === 'en' ? 'Private Motorcycle' : 'รถจักรยานยนต์ส่วนตัว', icon: Bike },
];

const getHeavyMachinery = (locale: 'th' | 'en') => [
    { id: 'm_backhoe', label: locale === 'en' ? 'Backhoe' : 'รถแบคโฮ (Backhoe)', icon: Pickaxe },
    { id: 'm_crane', label: locale === 'en' ? 'Crane' : 'รถเครน (Crane)', icon: Construction },
    { id: 'm_forklift', label: locale === 'en' ? 'Forklift' : 'รถยก (Forklift)', icon: Wrench },
];

const translations = {
    th: {
        completeness: 'ความสมบูรณ์ของโปรไฟล์',
        success: 'สำเร็จ',
        licenseTitle: 'ใบอนุญาตขับขี่',
        vehicleTitle: 'พาหนะที่มีส่วนตัว',
        machineryTitle: 'ทักษะเครื่องจักรพิเศษ',
        saved: 'บันทึกข้อมูลเรียบร้อยแล้ว ✓',
        error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        backBtn: 'ย้อนกลับ',
        saveAndNext: 'บันทึกและถัดไป',
        saving: 'กำลังบันทึก...',
        start: 'เริ่มต้น',
        complete: 'สมบูรณ์',
        licensePrefix: 'ใบขับขี่',
        machineryPrefix: 'ขับ',
        machinerySuffix: 'ได้'
    },
    en: {
        completeness: 'Profile Completeness',
        success: 'Success',
        licenseTitle: 'Driving License',
        vehicleTitle: 'Personal Vehicles',
        machineryTitle: 'Heavy Machinery Skills',
        saved: 'Data saved successfully ✓',
        error: 'An error occurred, please try again.',
        backBtn: 'Back',
        saveAndNext: 'Save & Next',
        saving: 'Saving...',
        start: 'Start',
        complete: 'Complete',
        licensePrefix: 'Driver License: ',
        machineryPrefix: 'Able to drive ',
        machinerySuffix: ''
    }
};

export default function EditDrivingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const locale = useLocale() as 'th' | 'en';
    const t = translations[locale] || translations.th;

    // 🔄 โหลดค่าจาก LocalStorage มารองพื้นเป็นค่าเริ่มต้นทันทีตั้งแต่สร้าง State (แก้ปัญหาค่าหายวับ)
    const [selectedLicenses, setSelectedLicenses] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const local = localStorage.getItem('backup_selected_licenses');
            if (local) return JSON.parse(local).filter((v: string) => ['l_car', 'l_bike', 'l_truck_6', 'l_truck_10'].includes(v));
        }
        return [];
    });

    const [ownedVehicles, setOwnedVehicles] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const local = localStorage.getItem('backup_owned_vehicles');
            if (local) return JSON.parse(local).filter((v: string) => ['v_car', 'v_bike'].includes(v));
        }
        return [];
    });

    const [machinerySkills, setMachinerySkills] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const local = localStorage.getItem('backup_machinery_skills');
            if (local) return JSON.parse(local).filter((v: string) => ['m_backhoe', 'm_crane', 'm_forklift'].includes(v));
        }
        return [];
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [completionPercent, setCompletionPercent] = useState(67);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

    const LICENSE_TYPES = getLicenseTypes(locale);
    const TRAVEL_VEHICLES = getTravelVehicles(locale);
    const HEAVY_MACHINERY = getHeavyMachinery(locale);

    const profileSteps = [
        { icon: User, label: menuLabels[locale].personal, completed: true, active: false, path: '/profile' },
        { icon: GraduationCap, label: menuLabels[locale].education, completed: true, active: false, path: '/profile/education' },
        { icon: Briefcase, label: menuLabels[locale].work, completed: true, active: false, path: '/profile/work-history' },
        { icon: Languages, label: menuLabels[locale].language, completed: true, active: false, path: '/profile/languages' },
        { icon: Car, label: menuLabels[locale].driving, completed: false, active: true, path: '/profile/driving' },
        { icon: Award, label: menuLabels[locale].certificates, completed: false, active: false, path: '/profile/certificates' },
    ];

    // Auth Guard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // 🔄 ดักจับและแกะโครงสร้างข้อมูลเชิงลึกจาก API (Deep Object Scanner)
    useEffect(() => {
        if (!user) return;
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        setCompletionPercent(67);
        
        fetch(`${API_URL}/users/me/profile`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                const profileData = data?.data || data;
                if (!profileData) return;

                // ใช้ Set เก็บคำดิบทุกอย่างที่แฝงอยู่ในตัวแอบเจกต์ profile
                const foundValues = new Set<string>();

                const searchDeep = (obj: any) => {
                    if (!obj) return;
                    if (typeof obj === 'string') {
                        foundValues.add(obj.trim().toLowerCase());
                        return;
                    }
                    if (Array.isArray(obj)) {
                        obj.forEach(item => searchDeep(item));
                        return;
                    }
                    if (typeof obj === 'object') {
                        Object.keys(obj).forEach(key => {
                            if (typeof obj[key] === 'string') {
                                foundValues.add(obj[key].trim().toLowerCase());
                            } else {
                                searchDeep(obj[key]);
                            }
                        });
                    }
                };

                searchDeep(profileData);

                const matchedLicenses: string[] = [];
                const matchedVehicles: string[] = [];
                const matchedMachinery: string[] = [];

                // จับคู่คำดิบที่ค้นเจอ เข้ากับระบบเมนูปุ่มของหน้าบ้าน
                foundValues.forEach(val => {
                    if (['l_car', 'car'].includes(val)) matchedLicenses.push('l_car');
                    if (['l_bike', 'bike', 'motorcycle', 'l_motorcycle'].includes(val)) matchedLicenses.push('l_bike');
                    if (['l_truck_6', 'truck_6', 'truck'].includes(val)) matchedLicenses.push('l_truck_6');
                    if (['l_truck_10', 'truck_10'].includes(val)) matchedLicenses.push('l_truck_10');

                    if (['v_car', 'own_car', 'private_car'].includes(val)) matchedVehicles.push('v_car');
                    if (['v_bike', 'own_bike', 'private_bike', 'own_motorcycle'].includes(val)) matchedVehicles.push('v_bike');

                    if (['m_backhoe', 'backhoe'].includes(val)) matchedMachinery.push('m_backhoe');
                    if (['m_crane', 'crane'].includes(val)) matchedMachinery.push('m_crane');
                    if (['m_forklift', 'forklift'].includes(val)) matchedMachinery.push('m_forklift');
                });

                // 💡 จุดสำคัญ: จะสั่งอัปเดตสเตตเฉพาะเมื่อ Server ตรวจพบข้อมูลจริงเท่านั้น หากไม่มีข้อมูลจะไม่ไปเคลียร์ค่า LocalStorage ทิ้ง
                if (matchedLicenses.length > 0) {
                    const unique = [...new Set(matchedLicenses)];
                    setSelectedLicenses(unique);
                    localStorage.setItem('backup_selected_licenses', JSON.stringify(unique));
                }
                if (matchedVehicles.length > 0) {
                    const unique = [...new Set(matchedVehicles)];
                    setOwnedVehicles(unique);
                    localStorage.setItem('backup_owned_vehicles', JSON.stringify(unique));
                }
                if (matchedMachinery.length > 0) {
                    const unique = [...new Set(matchedMachinery)];
                    setMachinerySkills(unique);
                    localStorage.setItem('backup_machinery_skills', JSON.stringify(unique));
                }
            })
            .catch((err) => console.error("โหลดข้อมูลซิงค์จากหลังบ้านขัดข้อง:", err));
    }, [user]);

    const toggle = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>, backupKey: string) => {
        setter(prev => {
            const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
            localStorage.setItem(backupKey, JSON.stringify(next)); 
            return next;
        });
    };

    const handleSubmit = async () => {
        setSaving(true);
        setMessage(null);

        const token = localStorage.getItem('accessToken');
        const skillsPayload = [
            ...selectedLicenses,
            ...ownedVehicles,
            ...machinerySkills
        ];

        try {
            const response = await fetch(`${API_URL}/users/me/driving-skills`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ skills: skillsPayload }),
            });

            if (!response.ok) throw new Error('Save failed');

            setSaving(false);
            setMessage({ type: 'success', text: t.saved });
            setCompletionPercent(83);
            
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                router.push('/profile/certificates');
            }, 1000);
        } catch {
            setSaving(false);
            setMessage({ type: 'error', text: t.error });
        };
    }

    const handleStepClick = (path: string) => {
        window.scrollTo(0, 0);
        router.push(path);
    };

    const handleBack = () => {
        window.scrollTo(0, 0);
        router.push('/profile/languages');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />

            {/* Progress Banner */}
<div
    className="relative overflow-hidden"
    style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0e2a5e 40%, #1a3a7a 70%, #243b82 100%)',
    }}
>
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />
    </div>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 relative z-10">
        <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 rounded-full bg-linear-to-b from-blue-400 to-cyan-400" />
            <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide">
                {t.completeness}
            </h2>
        </div>

        {/* Main Glass Card */}
        <div className="rounded-2xl border border-white/10 p-6 md:p-8" style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

                {/* Circular Progress */}
                <div className="relative shrink-0">
                    <div className="relative w-32 h-32 md:w-36 md:h-36">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                            <circle
                                cx="60" cy="60" r="54" fill="none" stroke="url(#progressGradient)" strokeWidth="8"
                                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-1000 ease-out"
                            />
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#60a5fa" />
                                    <stop offset="50%" stopColor="#38bdf8" />
                                    <stop offset="100%" stopColor="#22d3ee" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl md:text-4xl font-bold text-white">{completionPercent}%</span>
                            <span className="text-[10px] text-blue-300/80 mt-0.5">{t.success}</span>
                        </div>
                    </div>
                    <div className="absolute inset-0 rounded-full opacity-20 blur-xl" style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }} />
                </div>

                {/* Steps Navigation */}
                <div className="flex-1 w-full">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {profileSteps.map((step, index) => {
                            const StepIcon = step.icon;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleStepClick(step.path)}
                                    className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 cursor-pointer
                                        ${step.active
                                            ? 'bg-white/15 border border-white/20'
                                            : 'hover:bg-white/6 border border-transparent'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${step.completed ? 'bg-linear-to-br from-blue-400 to-cyan-400' :
                                        'bg-white/10'
                                        }`}>
                                        {step.completed ? (
                                            <Check className="w-5 h-5 text-white" />
                                        ) : (
                                            <StepIcon className="w-5 h-5 text-white/30" />
                                        )}
                                    </div>
                                    <span className="text-[11px] text-center font-medium text-white/70">
                                        {step.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    </div>
</div>

            {/* Main Selection Content */}
            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-10 mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* 1. ใบขับขี่ */}
                        <div className="space-y-5">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 pb-2 border-b">
                                <CreditCard className="w-5 h-5 text-blue-600" /> {t.licenseTitle}
                            </h3>
                            <div className="space-y-3">
                                {LICENSE_TYPES.map(v => (
                                    <SelectionCard
                                        key={v.id}
                                        title={`${t.licensePrefix}${v.label}`}
                                        active={selectedLicenses.includes(v.id)}
                                        icon={v.icon}
                                        onClick={() => toggle(v.id, setSelectedLicenses, 'backup_selected_licenses')}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 2. พาหนะส่วนตัว */}
                        <div className="space-y-5">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 pb-2 border-b">
                                <Car className="w-5 h-5 text-blue-600" /> {t.vehicleTitle}
                            </h3>
                            <div className="space-y-3">
                                {TRAVEL_VEHICLES.map(v => (
                                    <SelectionCard
                                        key={v.id}
                                        title={v.label}
                                        active={ownedVehicles.includes(v.id)}
                                        icon={v.icon}
                                        onClick={() => toggle(v.id, setOwnedVehicles, 'backup_owned_vehicles')}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 3. เครื่องจักรหนัก */}
                        <div className="space-y-5">
                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 pb-2 border-b">
                                <Wrench className="w-5 h-5 text-blue-600" /> {t.machineryTitle}
                            </h3>
                            <div className="space-y-3">
                                {HEAVY_MACHINERY.map(v => (
                                    <SelectionCard
                                        key={v.id}
                                        title={`${t.machineryPrefix}${v.label}${t.machinerySuffix}`}
                                        active={machinerySkills.includes(v.id)}
                                        icon={v.icon}
                                        onClick={() => toggle(v.id, setMachinerySkills, 'backup_machinery_skills')}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg text-center font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-3 pb-20">
                    <button
                        onClick={handleBack}
                        className="px-8 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                    >
                        {t.backBtn}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-12 py-3 rounded-lg font-bold text-lg shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t.saving}
                            </>
                        ) : t.saveAndNext}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}

function SelectionCard({ title, active, icon: Icon, onClick }: {
    title: string,
    active: boolean,
    icon: LucideIcon,
    onClick: () => void
}) {
    return (
        <div
            onClick={onClick}
            className={`group p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${active ? "border-blue-600 bg-blue-50/40 shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
                }`}
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${active ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                    }`}>
                    <Icon size={22} />
                </div>
                <span className={`font-bold text-sm ${active ? "text-blue-900" : "text-gray-600"}`}>
                    {title}
                </span>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-blue-600 bg-blue-600" : "border-gray-200 bg-gray-50"
                }`}>
                {active && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
        </div>
    );
}