"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, ArrowLeft, Sparkles, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { usePackage } from '@/hooks/usePackage';

export default function PackagesPage() {
    const router = useRouter();
    const { packageInfo, isLoading } = usePackage();

    const TIER_LEVELS: Record<string, number> = {
        'standard': 0, // สมาชิกทั่วไป
        'Pro': 1,
        'Premium': 2,
        'VIP': 3
    };


    const userTier = !packageInfo ? 0 : (TIER_LEVELS[packageInfo.name] || 0);

    console.log("Current Tier:", packageInfo?.name); // ดูว่าคำนี้ขึ้นใน Console ไหม
    console.log("Calculated Level:", !packageInfo ? 0 : TIER_LEVELS[packageInfo.name]);

    useEffect(() => {
        if (!isLoading && userTier === 3) {
            router.replace('/');
        }
    }, [userTier, isLoading, router]);

    if (isLoading) return null;

    const handleUpgrade = (planName: string, price: number) => {
        router.push(`./checkout?plan=${planName} ราคา ${price} บาท`);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <Navbar />

            {/* --- โซนหัวข้อ (ลดขนาดลงเพื่อความกระชับ) --- */}
            <section className="bg-[#F8FAFF] border-b border-blue-50 pt-8 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1)_0%,rgba(255,255,255,0)_70%)] -z-10" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="mb-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-medium group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:border-blue-200 transition-all">
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                            <span className="text-xs uppercase tracking-wider">Back</span>
                        </button>
                    </div>

                    <div className="text-center">
                        <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase bg-blue-100/50 rounded-md">
                            Flexible Pricing
                        </span>
                        <h1 className="text-3xl font-black text-slate-900 sm:text-4xl tracking-tight mb-3">
                            เลือกแพ็คเกจที่ใช่สำหรับคุณ
                        </h1>
                        <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                            ปลดล็อกขีดจำกัดการค้นหา และเข้าถึงฐานข้อมูลบุคลากรที่ดีที่สุด
                        </p>
                    </div>
                </div>
            </section>

            {/* --- โซนการ์ด --- */}
            <section className="flex-grow bg-white relative py-16 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center relative z-10 -mt-20">

                    {/* --- การ์ด PRO --- */}
                    <div className="relative w-full max-w-md group">
                        {/* ป้าย Pro ด้านบน พร้อมสายฟ้ากระพริบ */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-[#020263] border-2 border-white text-white px-8 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <Zap className="w-4 h-4 text-blue-300 fill-blue-300 animate-pulse drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                            <span className="text-sm font-bold uppercase tracking-widest">Pro</span>
                        </div>

                        {/* ตัวการ์ดหลัก */}
                        <div className="h-full bg-white border-2 border-slate-100 group-hover:border-blue-600 rounded-[2.5rem] p-8 pt-16 shadow-xl group-hover:shadow-blue-900/10 transition-all duration-500 group-hover:-translate-y-2 flex flex-col relative overflow-hidden">

                            {/* --- เส้นคาดแสงสีฟ้า (Slim Blue Sweep) --- */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent rotate-[45deg] group-hover:animate-sweep-swing" />
                            </div>

                            <div className="text-center mb-8 relative z-10">
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-6xl font-black text-[#020263]">39</span>
                                    <span className="text-xl font-bold text-slate-400">บาท/เดือน</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow relative z-10">
                                {/* Quota CC */}
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-transparent group-hover:border-blue-50 transition-colors">
                                    <div className="bg-blue-100 rounded-lg p-2">
                                        <Sparkles className="w-5 h-5 text-[#020263]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">โควต้าติดต่อบุคลากร (CC)</p>
                                        <p className="text-lg font-black text-[#020263]">15 CC / วัน</p>
                                    </div>
                                </div>

                                {/* Quota AC */}
                                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-transparent group-hover:border-blue-50 transition-colors">
                                    <div className="bg-blue-100 rounded-lg p-2">
                                        <Zap className="w-5 h-5 text-[#020263]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">โควต้าการลงงาน (AC)</p>
                                        <p className="text-lg font-black text-[#020263]">8 AC / วัน</p>
                                    </div>
                                </div>

                                {/* รายละเอียดเพิ่มเติม */}
                                <div className="pt-4 space-y-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-black">
                                        <Check className="w-4 h-4 text-blue-600 stroke-[3px]" />
                                        ปลดล็อคระบบคัดกรองด้วย AI
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกด (สว่างขึ้นเมื่อ Hover) --- */}
                            <button
                                onClick={() => handleUpgrade('Pro', 39)}
                                disabled={userTier >= 1} // ถ้าเป็น Pro, Premium, VIP อยู่แล้ว ห้ามกด
                                className={`mt-8 w-full font-black py-4 rounded-xl transition-all duration-300 border-b-4 relative overflow-hidden uppercase text-sm tracking-widest ${userTier >= 1
                                    ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed grayscale'
                                    : 'bg-[#020263] text-white border-black/20 hover:brightness-125 hover:scale-[1.02] active:scale-95'
                                    }`}
                            >
                                <span className="relative z-10">
                                    {userTier === 1 ? 'กำลังใช้งาน' : userTier > 1 ? 'กำลังใช้งานแพ็คเกจระดับสูงกว่า' : 'เลือกแผนเริ่มต้น'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* --- การ์ด PREMIUM --- */}
                    <div className="relative w-full max-w-md group">
                        {/* ป้าย Premium ด้านบน พร้อม Crown กระพริบเบาๆ */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-amber-500 to-yellow-600 border-2 border-white text-white px-8 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <Crown className="w-4 h-4 text-white fill-white animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest">Premium</span>
                        </div>

                        {/* ตัวการ์ดหลัก */}
                        <div className="h-full bg-white border-2 border-slate-100 group-hover:border-amber-400 rounded-[2.5rem] p-8 pt-16 shadow-xl group-hover:shadow-amber-500/10 transition-all duration-500 group-hover:-translate-y-2 flex flex-col relative overflow-hidden">

                            {/* --- เส้นคาดแสงสีทอง (Slim Golden Sweep) --- */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent rotate-[45deg] group-hover:animate-sweep-swing" />
                            </div>

                            <div className="text-center mb-8 relative z-10">
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-6xl font-black text-slate-900 tracking-tighter">99</span>
                                    <span className="text-xl font-bold text-slate-400">บาท/เดือน</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow relative z-10">
                                {/* Quota CC */}
                                <div className="flex items-center gap-4 bg-amber-50/40 p-4 rounded-2xl border border-transparent group-hover:border-amber-100 transition-colors">
                                    <div className="bg-amber-100 rounded-lg p-2">
                                        <Sparkles className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">โควต้าติดต่อบุคลากร (CC)</p>
                                        <p className="text-lg font-black text-slate-800">50 CC / วัน</p>
                                    </div>
                                </div>

                                {/* Quota AC */}
                                <div className="flex items-center gap-4 bg-amber-50/40 p-4 rounded-2xl border border-transparent group-hover:border-amber-100 transition-colors">
                                    <div className="bg-amber-100 rounded-lg p-2">
                                        <Zap className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">โควต้าการลงงาน (AC)</p>
                                        <p className="text-lg font-black text-slate-800">25 AC / วัน</p>
                                    </div>
                                </div>

                                {/* Features ลิสต์เพิ่มเติม */}
                                <div className="pt-4 space-y-2 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-black">
                                        <Check className="w-4 h-4 text-amber-500 stroke-[3px]" />
                                        ฟิลเตอร์คัดกรองระดับสูง
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-black">
                                        <Check className="w-4 h-4 text-amber-500 stroke-[3px]" />
                                        ส่งออกข้อมูลเป็น PDF ไม่จำกัด
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกด (สว่างขึ้นเมื่อ Hover) --- */}
                            <button
                                onClick={() => handleUpgrade('Premium', 99)}
                                // ปิดปุ่มถ้า user เป็น Premium (2) หรือ VIP (3) อยู่แล้ว
                                disabled={userTier >= 2}
                                className={`mt-8 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-xl transition-all duration-300 border-b-4 border-amber-800 relative overflow-hidden uppercase text-sm tracking-widest shadow-md ${userTier >= 2
                                    ? 'opacity-50 cursor-not-allowed grayscale' // สไตล์ตอนปิดปุ่ม
                                    : 'hover:brightness-115 hover:scale-[1.02] active:scale-95 hover:shadow-amber-500/40' // สไตล์ตอนเปิดปกติ
                                    }`}
                            >
                                <span className="relative z-10">
                                    {userTier === 2 ? 'กำลังใช้งาน' : userTier > 2 ? 'ปลดล็อกแล้ว' : 'อัปเกรดความคุ้มค่า'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* --- การ์ด VIP เฉด Rose Red สว่างขึ้น (ฐาน Blue บางๆ) --- */}
                    <div className="relative w-full max-w-md group">
                        {/* ป้าย VIP ด้านบน - เน้น Rose Red สว่าง */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-rose-500 via-red-600 to-rose-800 border-2 border-white/30 text-white px-8 py-1.5 rounded-full shadow-[0_10px_25px_-5px_rgba(225,29,72,0.5)] flex items-center gap-2">
                            <Star className="w-4 h-4 text-rose-200 fill-rose-200 animate-pulse" />
                            <span className="text-sm font-black uppercase tracking-[0.2em]">VIP</span>
                        </div>

                        {/* ตัวการ์ดหลัก - ปรับ BG ให้แดงขึ้น ไม่ทึบดำ */}
                        <div className="h-full bg-gradient-to-br from-rose-800 via-red-900 to-[#020263]/80 border-2 border-white/20 group-hover:border-rose-400 rounded-[2.5rem] p-8 pt-16 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] group-hover:shadow-[0_25px_80px_-15px_rgba(225,29,72,0.6)] transition-all duration-500 group-hover:-translate-y-2 flex flex-col relative overflow-hidden">

                            {/* --- เอฟเฟกต์แสงฟุ้ง (Glow Orb) ด้านในเพิ่มความแดง --- */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -ml-32 -mb-32" />

                            {/* --- เส้นคาดแสงสี Rose Sweep วิ่งผ่าน --- */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                                <div className="absolute -top-[150%] -left-[150%] w-[40%] h-[300%] bg-gradient-to-r from-transparent via-rose-300/30 to-transparent rotate-[45deg] group-hover:animate-sweep-swing" />
                            </div>

                            <div className="text-center mb-8 relative z-10">
                                <div className="flex justify-center items-baseline gap-1">
                                    {/* ราคาตัวเลขไล่เฉดขาวไปชมพูแดง */}
                                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-rose-100 to-rose-400 drop-shadow-sm">249</span>
                                    <span className="text-xl font-bold text-rose-200/80">บาท/เดือน</span>
                                </div>
                            </div>

                            <div className="space-y-4 flex-grow relative z-10">
                                {/* โควต้า CC - Rose Red Style */}
                                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 group-hover:border-rose-300/40 transition-all">
                                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-3 shadow-lg shadow-rose-950/50">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-rose-200 font-bold uppercase tracking-widest">โควต้าติดต่อบุคลากร (CC)</p>
                                        <p className="text-xl font-black text-white">150 CC / วัน</p>
                                    </div>
                                </div>

                                {/* โควต้า AC - Dark Rose Style */}
                                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/5 group-hover:border-red-400/30 transition-all">
                                    <div className="bg-gradient-to-br from-red-600 to-rose-800 rounded-2xl p-3 shadow-lg shadow-red-950/50">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">โควต้าการลงงาน (AC)</p>
                                        <p className="text-xl font-black text-white">75 AC / วัน</p>
                                    </div>
                                </div>

                                {/* รายละเอียดเพิ่มเติม */}
                                <div className="pt-6 space-y-3 border-t border-white/20 mt-2">
                                    <div className="flex items-center gap-3 text-sm text-white font-medium">
                                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                                        </div>
                                        วิเคราะห์บุคลากรเชิงลึก (AI Insight)
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white font-medium">
                                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                                        </div>
                                        Priority Support 24/7
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกด Rose Red ที่ตะโกนว่า VIP --- */}
                            <button
                                onClick={() => handleUpgrade('VIP', 249)}
                                className="mt-8 w-full bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 text-white font-black py-4.5 rounded-2xl transition-all duration-300 border-b-[6px] border-red-900 relative overflow-hidden hover:brightness-110 hover:-translate-y-1 active:translate-y-0.5 active:border-b-0 shadow-2xl shadow-rose-900/40 uppercase tracking-[0.2em] text-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                <span className="relative z-10">รับสิทธิพิเศษสูงสุด</span>
                            </button>
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );
}