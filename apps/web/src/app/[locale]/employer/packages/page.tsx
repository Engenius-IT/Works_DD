"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import QRCode from 'qrcode';
import { Check, Crown, Zap, ArrowLeft, Sparkles, Star, X, ArrowRight, ShieldCheck, CheckCircle2, Clock3, QrCode, Upload, Building2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { usePackage } from '@/hooks/usePackage';
import { useAuth } from '@/context/AuthContext';
import { SlipReviewAnimation, WorksddLogoLoader } from '@/components/SlipReviewAnimation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function formatRemainingTime(seconds: number) {
    const safeSeconds = Math.max(0, seconds);
    const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
    const remainder = (safeSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${remainder}`;
}

async function createBrandedQrDataUrl(payload: string) {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, payload, {
        width: 640,
        margin: 2,
        errorCorrectionLevel: 'H',
    });

    const context = canvas.getContext('2d');
    if (!context) return canvas.toDataURL('image/png');

    const logo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = '/images/logo_jobdd_main.png';
    });

    const logoWidth = 150;
    const logoHeight = Math.round(logoWidth / (logo.naturalWidth / logo.naturalHeight));
    const padding = 16;
    const boxWidth = logoWidth + padding * 2;
    const boxHeight = logoHeight + padding * 2;
    const x = (canvas.width - boxWidth) / 2;
    const y = (canvas.height - boxHeight) / 2;

    context.save();
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#e2e8f0';
    context.lineWidth = 4;
    context.beginPath();
    context.roundRect(x, y, boxWidth, boxHeight, 18);
    context.fill();
    context.stroke();
    context.drawImage(logo, x + padding, y + padding, logoWidth, logoHeight);
    context.restore();

    return canvas.toDataURL('image/png');
}

type PlanSelection = {
    name: string;
    price: number;
    period: string;
    description: string;
    gradient: string;
    glow: string;
};

export default function PackagesPage() {
    const router = useRouter();
    const { packageInfo, isLoading } = usePackage();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<PlanSelection | null>(null);
    const [paymentStep, setPaymentStep] = useState<'confirm' | 'payment'>('confirm');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [chargeId, setChargeId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [slipResult, setSlipResult] = useState<any>(null);
    const [verificationState, setVerificationState] = useState<'idle' | 'checking' | 'success' | 'rejected'>('idle');
    const [paymentMessage, setPaymentMessage] = useState('');
    const [companyRequired, setCompanyRequired] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [creatingCompany, setCreatingCompany] = useState(false);

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

    useEffect(() => {
        if (!selectedPlan) return;

        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelectedPlan(null);
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [selectedPlan]);

    useEffect(() => {
        if (!chargeId || paymentStep !== 'payment') return;

        const timer = window.setInterval(async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const { data } = await axios.get(`${API_URL}/payments/status/${chargeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (data.status === 'SUCCESS') {
                    setVerificationState('success');
                    setChargeId(null);
                    window.setTimeout(() => {
                        closePlanModal();
                        router.push('./dashboard?upgrade=success');
                    }, 1400);
                } else if (data.status === 'CANCELLED') {
                    setPaymentMessage('QR หมดอายุแล้ว กรุณาปิดหน้าต่างแล้วสร้าง QR ใหม่');
                    setChargeId(null);
                    setQrImage(null);
                    setExpiresAt(null);
                    setSecondsRemaining(0);
                }
            } catch {
                // Keep polling while payment is being reviewed.
            }
        }, 3000);

        return () => window.clearInterval(timer);
    }, [chargeId, paymentStep, router]);

    useEffect(() => {
        if (paymentStep !== 'payment' || !expiresAt) return;

        const updateRemainingTime = () => {
            const remaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
            setSecondsRemaining(Math.max(0, remaining));
        };

        updateRemainingTime();
        const timer = window.setInterval(updateRemainingTime, 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt, paymentStep]);

    if (isLoading) return null;

    const resetPaymentState = () => {
        setPaymentStep('confirm');
        setPaymentLoading(false);
        setQrImage(null);
        setChargeId(null);
        setPaymentAmount(null);
        setExpiresAt(null);
        setSecondsRemaining(0);
        setSlipFile(null);
        setUploading(false);
        setSlipResult(null);
        setVerificationState('idle');
        setPaymentMessage('');
        setCompanyRequired(false);
    };

    const closePlanModal = () => {
        setSelectedPlan(null);
        resetPaymentState();
    };

    const handleUpgrade = (plan: PlanSelection) => {
        resetPaymentState();
        setSelectedPlan(plan);
    };

    const createQr = async () => {
        if (!selectedPlan) return;
        if (!user) {
            setPaymentMessage('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
            return;
        }
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            setPaymentMessage('ต้องใช้บัญชีผู้ประกอบการเพื่อซื้อแพ็กเกจ');
            return;
        }

        setPaymentLoading(true);
        setPaymentMessage('');
        try {
            const token = localStorage.getItem('accessToken');
            const { data } = await axios.post(`${API_URL}/payments/self/create`, { planName: selectedPlan.name }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPaymentAmount(Number(data.amount));
            setExpiresAt(data.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
            setSecondsRemaining(Number(data.expiresInSeconds ?? 300));
            setQrImage(await createBrandedQrDataUrl(data.qrPayload));
            setChargeId(data.chargeId);
            setSlipFile(null);
            setSlipResult(null);
            setCompanyRequired(false);
            setPaymentStep('payment');
        } catch (error: any) {
            if (error.response?.status === 404 && error.response?.data?.message?.includes('บริษัท')) {
                setCompanyRequired(true);
                setPaymentMessage('กรุณาสร้างข้อมูลบริษัทก่อน ระบบจึงจะสร้าง QR ชำระเงินได้');
                setPaymentStep('payment');
            } else {
                setPaymentMessage(error.response?.data?.message || error.message || 'สร้าง QR ไม่สำเร็จ');
            }
        } finally {
            setPaymentLoading(false);
        }
    };

    const createCompanyAndRetry = async () => {
        if (!companyName.trim()) {
            setPaymentMessage('กรุณากรอกชื่อบริษัท');
            return;
        }

        setCreatingCompany(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`${API_URL}/companies/mine`, { name: companyName.trim() }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCompanyRequired(false);
            await createQr();
        } catch (error: any) {
            setPaymentMessage(error.response?.data?.message || error.message || 'สร้างข้อมูลบริษัทไม่สำเร็จ');
        } finally {
            setCreatingCompany(false);
        }
    };

    const uploadSlip = async () => {
        if (!chargeId || !slipFile) {
            setPaymentMessage('กรุณาเลือกไฟล์สลิปก่อน');
            return;
        }

        setUploading(true);
        setPaymentMessage('');
        setVerificationState('checking');
        try {
            const form = new FormData();
            form.append('file', slipFile);
            const token = localStorage.getItem('accessToken');
            const { data } = await axios.post(`${API_URL}/payments/self/${chargeId}/slip`, form, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSlipResult(data);
            const slipStatus = String(data?.status || '').toUpperCase();
            if (slipStatus === 'SUCCESS' || slipStatus === 'APPROVED') {
                setVerificationState('success');
            } else if (['REJECTED', 'FAILED', 'INVALID', 'ERROR', 'DUPLICATE'].includes(slipStatus)) {
                setVerificationState('rejected');
            }
        } catch (error: any) {
            setVerificationState('rejected');
            setPaymentMessage(error.response?.data?.message || error.message || 'ส่งสลิปไม่สำเร็จ');
        } finally {
            setUploading(false);
        }
    };

    const confirmUpgrade = () => {
        void createQr();
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

                    {/* --- การ์ดแรก: แพ็กเกจ PRO (ใช้ธีมสีทองหรูหรา Modern Golden) --- */}
                    <div className="relative w-full max-w-md group">
                        {/* ป้ายชื่อ Pro สีทองพร้อมมงกุฎสง่างาม */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-amber-500 to-yellow-600 border-2 border-white text-white px-8 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                            <Zap className="w-4 h-4 text-white fill-white animate-pulse" />
                            <span className="text-sm font-bold uppercase tracking-widest">Pro</span>
                        </div>

                        {/* ตัวการ์ดหลัก - โทนสีพื้นหลังเนื้อครีมทองและกรอบสีทอง */}
                        <div className="h-full bg-gradient-to-b from-amber-50/60 via-white to-white border-2 border-slate-100 group-hover:border-amber-400 rounded-[2.5rem] p-8 pt-16 shadow-xl group-hover:shadow-amber-500/10 transition-all duration-500 group-hover:-translate-y-2 flex flex-col relative overflow-hidden">

                            {/* --- เส้นคาดแสงสีทอง (Slim Golden Sweep) --- */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-amber-400/20 to-transparent rotate-[45deg] group-hover:animate-sweep-swing" />
                            </div>

                            <div className="text-center mb-8 relative z-10">
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-6xl font-black text-slate-900 tracking-tighter">2,990</span>
                                    <span className="text-xl font-bold text-amber-700/70">บาท 1 เดือน</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow relative z-10">
                                {/* Quota CC - กล่องดีไซน์สีทองนุ่มนวล */}
                                <div className="flex items-center gap-4 bg-amber-50/80 p-4 rounded-2xl border border-amber-100/40 group-hover:border-amber-200/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] transition-colors">
                                    <div className="bg-amber-100 rounded-lg p-2">
                                        <Sparkles className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">โควตาติดต่อบุคลากร (CC)</p>
                                        <p className="text-lg font-black text-slate-800">100 Credits / เดือน</p>
                                    </div>
                                </div>

                                {/* Quota AC - กล่องดีไซน์สีทองนุ่มนวล */}
                                <div className="flex items-center gap-4 bg-amber-50/80 p-4 rounded-2xl border border-amber-100/40 group-hover:border-amber-200/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] transition-colors">
                                    <div className="bg-amber-100 rounded-lg p-2">
                                        <Zap className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tight">โควตาการลงงาน (AC)</p>
                                        <p className="text-lg font-black text-slate-800">10 AC </p>
                                    </div>
                                </div>

                                {/* รายละเอียดเพิ่มเติม */}
                                <div className="pt-4 space-y-2 border-t border-amber-100">
                                    <div className="flex items-center gap-2 text-sm text-slate-700 font-bold">
                                        <Check className="w-4 h-4 text-amber-500 stroke-[3px]" />
                                        ปลดล็อคการมองเห็นข้อมูลติดต่อผู้สมัคร
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกดสีทองอร่ามแมทช์กับตัวการ์ด --- */}
                            <button
                                onClick={() => handleUpgrade({
                                    name: 'Pro',
                                    price: 2990,
                                    period: '1 เดือน',
                                    description: 'เหมาะสำหรับทีมที่กำลังเริ่มต้นค้นหาบุคลากร',
                                    gradient: 'from-amber-500 to-yellow-600',
                                    glow: 'shadow-amber-500/30',
                                })}
                                disabled={userTier >= 1}
                                className={`mt-8 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black py-4 rounded-xl transition-all duration-300 border-b-4 border-amber-800 relative overflow-hidden uppercase text-sm tracking-widest shadow-md ${userTier >= 1
                                    ? 'opacity-50 cursor-not-allowed grayscale'
                                    : 'hover:brightness-115 hover:scale-[1.02] active:scale-95 hover:shadow-amber-500/40'
                                    }`}
                            >
                                <span className="relative z-10">
                                    {userTier === 1 ? 'กำลังใช้งาน' : userTier > 1 ? 'กำลังใช้งานแพ็คเกจระดับสูงกว่า' : 'เลือกแผนเริ่มต้น'}
                                </span>
                            </button>
                        </div>
                    </div>


                    {/* --- การ์ดสอง: แพ็กเกจ PREMIUM (ธีมสีน้ำเงินเข้มสุดหรู Midnight Rich - ปรับพื้นหลังเข้มพิเศษ) --- */}
                    <div className="relative w-full max-w-md group">
                        {/* ป้ายชื่อ Premium สีน้ำเงินเข้มขอบทอง/ขาว พร้อมมงกุฎเปล่งประกาย */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 bg-[#020263] border-2 border-blue-400 text-white px-8 py-1.5 rounded-full shadow-[0_0_15px_rgba(30,144,255,0.5)] flex items-center gap-2">
                            <Crown className="w-4 h-4 text-blue-300 fill-blue-300 animate-pulse drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]" />
                            <span className="text-sm font-bold uppercase tracking-widest text-blue-100">Premium</span>
                        </div>

                        {/* ตัวการ์ดหลัก - ปรับเป็น Gradient สีน้ำเงินเข้มลึก ลุ่มลึกและมีมิติ */}
                        <div className="h-full bg-gradient-to-b from-slate-900 via-[#03034f] to-[#01013a] border-2 border-blue-900/50 group-hover:border-blue-500 rounded-[2.5rem] p-8 pt-16 shadow-2xl shadow-black/50 group-hover:shadow-blue-500/20 transition-all duration-500 group-hover:-translate-y-2 flex flex-col relative overflow-hidden">

                            {/* --- เส้นคาดแสงสีฟ้าสว่างชัดเจนขึ้น (Bright Blue Sweep) --- */}
                            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-[2.5rem]">
                                <div className="absolute -top-[150%] -left-[150%] w-[30%] h-[300%] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rotate-[45deg] group-hover:animate-sweep-swing" />
                            </div>

                            {/* ราคา - ปรับฟอนต์สีขาว/ฟ้าสว่าง เพื่อให้ลอยเด่นออกมาจากพื้นหลังเข้ม */}
                            <div className="text-center mb-8 relative z-10">
                                <div className="flex justify-center items-baseline gap-1">
                                    <span className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">5,990</span>
                                    <span className="text-xl font-bold text-blue-300/70">บาท 3 เดือน</span>
                                </div>
                            </div>

                            <div className="space-y-3 flex-grow relative z-10">
                                {/* Quota CC - กล่องดีไซน์โปร่งแสงบนพื้นหลังเข้ม (Glassmorphism) */}
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-blue-500/40 transition-colors backdrop-blur-sm">
                                    <div className="bg-blue-950 rounded-lg p-2 border border-blue-800/50">
                                        <Sparkles className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-300/60 font-bold uppercase tracking-tight">โควตาติดต่อบุคลากร (CC)</p>
                                        <p className="text-lg font-black text-white">150 Credits / เดือน</p>
                                    </div>
                                </div>

                                {/* Quota AC - กล่องดีไซน์โปร่งแสงบนพื้นหลังเข้ม */}
                                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:border-blue-500/40 transition-colors backdrop-blur-sm">
                                    <div className="bg-blue-950 rounded-lg p-2 border border-blue-800/50">
                                        <Zap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-blue-300/60 font-bold uppercase tracking-tight">โควตาการลงงาน (AC)</p>
                                        <p className="text-lg font-black text-white">10 AC </p>
                                    </div>
                                </div>

                                {/* Features ลิสต์เพิ่มเติม - ปรับสีตัวอักษรให้อ่านง่ายบนพื้นหลังมืด */}
                                <div className="pt-4 space-y-2 border-t border-white/10">
                                    <div className="flex items-center gap-2 text-sm text-blue-100 font-bold">
                                        <Check className="w-4 h-4 text-blue-400 stroke-[3px]" />
                                        ปลดล็อคการมองเห็นข้อมูลติดต่อผู้สมัคร
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-blue-100 font-bold">
                                        <Check className="w-4 h-4 text-blue-400 stroke-[3px]" />
                                        เพิ่มระดับการมองเห็นงานแก่ผู้สมัคร
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกดสีน้ำเงินนีออนตัดขอบ เพิ่มความโดดเด่นบนตัวการ์ด --- */}
                            <button
                                onClick={() => handleUpgrade({
                                    name: 'Premium',
                                    price: 5990,
                                    period: '3 เดือน',
                                    description: 'คุ้มค่าขึ้นสำหรับทีมที่ต้องการลงประกาศต่อเนื่อง',
                                    gradient: 'from-blue-600 to-indigo-700',
                                    glow: 'shadow-blue-500/30',
                                })}
                                disabled={userTier >= 2}
                                className={`mt-8 w-full font-black py-4 rounded-xl transition-all duration-300 border-b-4 relative overflow-hidden uppercase text-sm tracking-widest ${userTier >= 2
                                    ? 'bg-slate-800 text-slate-500 border-slate-900 cursor-not-allowed grayscale'
                                    : 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-950 hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] active:scale-95 shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.5)]'
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
                                    <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-rose-100 to-rose-400 drop-shadow-sm">15,990</span>
                                    <span className="text-xl font-bold text-rose-200/80">บาท 1 ปี</span>
                                </div>
                            </div>

                            <div className="space-y-4 flex-grow relative z-10">
                                {/* โควตา CC - Rose Red Style */}
                                <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 group-hover:border-rose-300/40 transition-all">
                                    <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl p-3 shadow-lg shadow-rose-950/50">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-rose-200 font-bold uppercase tracking-widest">โควตาติดต่อบุคลากร (CC)</p>
                                        <p className="text-xl font-black text-white">200 Credits / เดือน</p>
                                    </div>
                                </div>

                                {/* โควตา AC - Dark Rose Style */}
                                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-md p-4 rounded-3xl border border-white/5 group-hover:border-red-400/30 transition-all">
                                    <div className="bg-gradient-to-br from-red-600 to-rose-800 rounded-2xl p-3 shadow-lg shadow-red-950/50">
                                        <Zap className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest">โควตาการลงงาน (AC)</p>
                                        <p className="text-xl font-black text-white">10 AC </p>
                                    </div>
                                </div>

                                {/* รายละเอียดเพิ่มเติม */}
                                <div className="pt-6 space-y-3 border-t border-white/20 mt-2">
                                    <div className="flex items-center gap-3 text-sm text-white font-medium">
                                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                                        </div>
                                        เพิ่มการมองเห็นแสดงไปยังบริษัทชั้นนำ
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white font-medium">
                                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white stroke-[4px]" />
                                        </div>
                                        Priority Support
                                    </div>
                                </div>
                            </div>

                            {/* --- ปุ่มกด Rose Red ที่ตะโกนว่า VIP --- */}
                            <button
                                onClick={() => handleUpgrade({
                                    name: 'VIP',
                                    price: 15990,
                                    period: '1 ปี',
                                    description: 'สิทธิ์สูงสุดสำหรับบริษัทที่ต้องการเติบโตแบบเต็มสปีด',
                                    gradient: 'from-rose-500 via-red-600 to-rose-700',
                                    glow: 'shadow-rose-500/40',
                                })}
                                className="mt-8 w-full bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 text-white font-black py-4.5 rounded-2xl transition-all duration-300 border-b-[6px] border-red-900 relative overflow-hidden hover:brightness-110 hover:-translate-y-1 active:translate-y-0.5 active:border-b-0 shadow-2xl shadow-rose-900/40 uppercase tracking-[0.2em] text-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                <span className="relative z-10">รับสิทธิพิเศษสูงสุด</span>
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* --- Upgrade confirmation modal --- */}
            {selectedPlan && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="upgrade-modal-title"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closePlanModal();
                    }}
                >
                    <div
                        className="worksdd-payment-backdrop absolute inset-0 bg-slate-950/70 backdrop-blur-md"
                        onMouseDown={closePlanModal}
                    />

                    <div className={`worksdd-payment-modal relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl ${selectedPlan.glow}`}>
                        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${selectedPlan.gradient} opacity-15`} />
                        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/50 blur-3xl" />
                        <div className="absolute -left-20 top-24 h-36 w-36 rounded-full bg-blue-100/70 blur-3xl" />

                        {paymentLoading && (
                            <div className="worksdd-qr-generating-state absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/95 px-8 text-center backdrop-blur-md">
                                <button
                                    type="button"
                                    onClick={closePlanModal}
                                    className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-400 transition-all hover:rotate-90 hover:border-slate-300 hover:text-slate-700"
                                    aria-label="ยกเลิกการสร้าง QR"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="slip-review-orbit">
                                    <span className="slip-review-logo-3d">
                                        <img src="/images/logo_jobdd_main.png" alt="WorksDD" />
                                    </span>
                                </div>
                                <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">WorksDD Secure Payment</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-900">กำลังสร้าง QR Code</h2>
                                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-500">ระบบกำลังเตรียม QR PromptPay สำหรับแพ็กเกจ {selectedPlan.name} กรุณารอสักครู่</p>
                                <div className="slip-review-progress mt-6"><span /></div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                    <span className="slip-checking-dot">กำลังเชื่อมต่อ</span>
                                    <span className="slip-checking-dot">.</span>
                                    <span className="slip-checking-dot">.</span>
                                    <span className="slip-checking-dot">.</span>
                                </div>
                            </div>
                        )}

                        <div className="relative p-6 sm:p-8">
                            <button
                                type="button"
                                onClick={closePlanModal}
                                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-400 transition-all hover:rotate-90 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                aria-label="ปิดหน้าต่าง"
                            >
                                <X className="h-4 w-4" />
                            </button>

                            <div className="worksdd-payment-part mb-7 flex items-start gap-4 pr-10">
                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${selectedPlan.gradient} text-white shadow-lg ${selectedPlan.glow}`}>
                                    {selectedPlan.name === 'VIP' ? <Star className="h-7 w-7 fill-current" /> : selectedPlan.name === 'Premium' ? <Crown className="h-7 w-7 fill-current" /> : <Zap className="h-7 w-7 fill-current" />}
                                </div>
                                <div>
                                    <p className="mb-1 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{paymentStep === 'payment' ? 'ชำระเงินแพ็กเกจ' : 'ยืนยันแพ็กเกจ'}</p>
                                    <h2 id="upgrade-modal-title" className="text-2xl font-black text-slate-900">{paymentStep === 'payment' ? (companyRequired ? 'ตั้งค่าบริษัทก่อนชำระ' : 'สแกนเพื่อชำระเงิน') : `${selectedPlan.name} Plan`}</h2>
                                    <p className="mt-1 text-sm text-slate-500">{paymentStep === 'payment' ? (companyRequired ? 'กรอกชื่อบริษัทเพื่อเปิดใช้งานการชำระเงิน' : 'ชำระผ่าน Thai QR PromptPay ได้จากทุกธนาคาร') : selectedPlan.description}</p>
                                </div>
                            </div>

                            {paymentStep === 'confirm' ? (
                                <>
                                    <div className={`worksdd-payment-part relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} p-[1px] shadow-lg ${selectedPlan.glow}`}>
                                        <div className="rounded-[15px] bg-white/95 px-5 py-4 backdrop-blur-xl">
                                            <div className="flex items-end justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400">ยอดชำระแพ็กเกจ</p>
                                                    <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">฿{selectedPlan.price.toLocaleString('th-TH')}</p>
                                                </div>
                                                <span className="mb-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{selectedPlan.period}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="worksdd-payment-part space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">สิ่งที่จะได้รับ</p>
                                        {['ปลดล็อกโควตาตามแพ็กเกจทันทีหลังชำระเงิน', 'สร้าง QR PromptPay และตรวจสอบสลิปได้ในระบบ', 'มีประวัติการชำระเงินสำหรับตรวจสอบย้อนหลัง'].map((item) => (
                                            <div key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                        ชำระเงินอย่างปลอดภัยผ่านระบบ WorksDD
                                    </div>

                                    {paymentMessage && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{paymentMessage}</p>}

                                    <div className="worksdd-payment-part mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={closePlanModal}
                                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
                                        >
                                            ดูแพ็กเกจอื่น
                                        </button>
                                        <button
                                            type="button"
                                            onClick={confirmUpgrade}
                                            disabled={paymentLoading}
                                            className={`group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${selectedPlan.gradient} px-6 py-3 text-sm font-black text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-wait disabled:opacity-60 ${paymentLoading ? 'slip-checking-button' : ''}`}
                                        >
                                            {paymentLoading ? <><WorksddLogoLoader />กำลังสร้าง QR...</> : 'ชำระเงินหน้านี้'}
                                            {!paymentLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className={`worksdd-payment-part mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r ${selectedPlan.gradient} px-5 py-4 text-white shadow-lg ${selectedPlan.glow}`}>
                                        <div>
                                            <p className="text-xs font-bold text-white/70">ยอดชำระสุทธิ</p>
                                            <p className="text-3xl font-black">฿{(paymentAmount ?? selectedPlan.price).toLocaleString('th-TH')}.00</p>
                                        </div>
                                        <QrCode className="h-9 w-9 opacity-80" />
                                    </div>

                                    {qrImage && verificationState === 'idle' && <div className="worksdd-payment-part mx-auto max-w-[260px] rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 shadow-inner">
                                        <img src={qrImage} alt="PromptPay QR Code" className="aspect-square w-full rounded-2xl bg-white" />
                                    </div>}

                                    {qrImage && verificationState === 'idle' && <div className={`worksdd-payment-part mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${secondsRemaining <= 30 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-700'}`}>
                                        <Clock3 className="h-4 w-4" />
                                        {secondsRemaining > 0 ? `QR นี้ใช้ได้อีก ${formatRemainingTime(secondsRemaining)} นาที` : 'QR หมดอายุ กำลังยกเลิกคำสั่งซื้อ...'}
                                    </div>}

                                    {companyRequired && <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                                        <div className="flex gap-3">
                                            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                            <div className="w-full">
                                                <p className="font-black">กรุณาสร้างข้อมูลบริษัทก่อน</p>
                                                <p className="mt-1 text-xs text-amber-700">สร้างครั้งเดียว แล้วระบบจะสร้าง QR ต่อให้ทันที</p>
                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                    <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="ชื่อบริษัท" className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-500" />
                                                    <button type="button" onClick={createCompanyAndRetry} disabled={creatingCompany} className="rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-60">{creatingCompany ? 'กำลังสร้าง...' : 'สร้างบริษัท'}</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>}

                                    {verificationState !== 'idle' ? (
                                        <SlipReviewAnimation
                                            status={verificationState}
                                            message={verificationState === 'rejected' ? (paymentMessage || slipResult?.verificationMessage) : undefined}
                                            onRetry={verificationState === 'rejected' ? () => { setVerificationState('idle'); setSlipResult(null); setSlipFile(null); setPaymentMessage(''); } : undefined}
                                        />
                                    ) : qrImage && chargeId ? (
                                        <div className="worksdd-payment-part mt-5 space-y-3">
                                            <label htmlFor="package-payment-slip" className="flex items-center gap-2 text-sm font-black text-slate-700"><Upload className="h-4 w-4 text-[#020263]" />แนบสลิปหลังโอนเงิน</label>
                                            <input id="package-payment-slip" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setSlipFile(event.target.files?.[0] || null); setSlipResult(null); setVerificationState('idle'); setPaymentMessage(''); }} className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#020263] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
                                            <button type="button" onClick={uploadSlip} disabled={!slipFile || uploading || !!slipResult} className={`w-full rounded-xl py-3 text-sm font-black text-white transition disabled:cursor-not-allowed ${uploading ? 'slip-checking-button' : 'bg-[#020263] hover:bg-[#10108a] disabled:bg-slate-300'}`}>
                                                {uploading ? 'กำลังตรวจสอบสลิป...' : 'ส่งสลิปให้ตรวจสอบ'}
                                            </button>
                                        </div>
                                    ) : null}

                                    {paymentMessage && verificationState === 'idle' && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{paymentMessage}</p>}

                                    <div className="mt-6 flex items-center justify-between gap-3">
                                        <button type="button" onClick={() => { resetPaymentState(); }} className="text-sm font-bold text-slate-400 transition hover:text-slate-700">← เปลี่ยนแพ็กเกจ</button>
                                        <span className="flex items-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" />ปลอดภัยโดย WorksDD</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
