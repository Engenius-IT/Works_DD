"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import axios from 'axios';
import QRCode from 'qrcode';
import { ArrowLeft, Building2, Clock3, QrCode, ShieldCheck, Upload, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { SlipReviewAnimation, WorksddLogoLoader } from '@/components/SlipReviewAnimation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TEST_PAYMENT_AMOUNT = Number(process.env.NEXT_PUBLIC_PAYMENT_TEST_AMOUNT);
const IS_PAYMENT_TEST_MODE = (process.env.NEXT_PUBLIC_PAYMENT_TEST_MODE === 'true'
    || process.env.NODE_ENV !== 'production')
    && Number.isFinite(TEST_PAYMENT_AMOUNT)
    && TEST_PAYMENT_AMOUNT > 0;

function resolvePlan(value: string | null) {
    const name = (value || 'Pro').toLowerCase();
    const basePlan = name.includes('vip')
        ? { name: 'VIP', price: 15990, theme: 'from-rose-600 via-red-600 to-[#020263]', button: 'bg-rose-600 hover:bg-rose-700' }
        : name.includes('premium')
            ? { name: 'Premium', price: 5990, theme: 'from-[#020263] to-[#2020a0]', button: 'bg-[#020263] hover:bg-[#10108a]' }
            : { name: 'Pro', price: 2990, theme: 'from-amber-500 to-amber-600', button: 'bg-amber-500 hover:bg-amber-600' };

    return IS_PAYMENT_TEST_MODE ? { ...basePlan, price: TEST_PAYMENT_AMOUNT } : basePlan;
}

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

    // Keep a generous white quiet-zone around the logo so banking apps can
    // still detect the QR reliably after branding.
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

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const plan = resolvePlan(searchParams.get('plan'));
    const [loading, setLoading] = useState(false);
    const [showQr, setShowQr] = useState(false);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [chargeId, setChargeId] = useState<string | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [secondsRemaining, setSecondsRemaining] = useState(0);
    const [slipFile, setSlipFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [slipResult, setSlipResult] = useState<any>(null);
    const [verificationState, setVerificationState] = useState<'idle' | 'checking' | 'success' | 'rejected'>('idle');
    const [slipMessage, setSlipMessage] = useState('');
    const [companyRequired, setCompanyRequired] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [creatingCompany, setCreatingCompany] = useState(false);
    const [employerAccountRequired, setEmployerAccountRequired] = useState(false);

    const createQr = async () => {
        if (!user) return window.alert('กรุณาเข้าสู่ระบบก่อนชำระเงิน');
        if (user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            setCompanyRequired(false);
            setEmployerAccountRequired(true);
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const { data } = await axios.post(`${API_URL}/payments/self/create`, { planName: plan.name }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setPaymentAmount(Number(data.amount));
            setExpiresAt(data.expiresAt || new Date(Date.now() + 5 * 60 * 1000).toISOString());
            setSecondsRemaining(Number(data.expiresInSeconds ?? 300));
            setQrImage(await createBrandedQrDataUrl(data.qrPayload));
            setChargeId(data.chargeId);
            setSlipFile(null);
            setSlipResult(null);
            setVerificationState('idle');
            setSlipMessage('');
            setShowQr(true);
        } catch (error: any) {
            if (error.response?.status === 404 && error.response?.data?.message?.includes('บริษัท')) {
                setCompanyRequired(true);
                return;
            }
            window.alert(error.response?.data?.message || error.message || 'สร้าง QR ไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    const createCompanyAndRetry = async () => {
        if (user && user.role !== 'EMPLOYER' && user.role !== 'ADMIN') {
            setCompanyRequired(false);
            setEmployerAccountRequired(true);
            return;
        }
        if (!companyName.trim()) {
            window.alert('กรุณากรอกชื่อบริษัท');
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
            if (error.response?.status === 403) {
                setCompanyRequired(false);
                setEmployerAccountRequired(true);
                return;
            }
            window.alert(error.response?.data?.message || error.message || 'สร้างข้อมูลบริษัทไม่สำเร็จ');
        } finally {
            setCreatingCompany(false);
        }
    };

    const uploadSlip = async () => {
        if (!chargeId || !slipFile) {
            setSlipMessage('กรุณาเลือกไฟล์สลิปก่อน');
            return;
        }
        setUploading(true);
        setVerificationState('checking');
        setSlipMessage('');
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
            setSlipMessage(error.response?.data?.message || error.message || 'ส่งสลิปไม่สำเร็จ');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (!showQr || !chargeId) return;
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
                        setShowQr(false);
                        router.push('/employer/dashboard?upgrade=success');
                    }, 1400);
                } else if (data.status === 'CANCELLED') {
                    setShowQr(false);
                    setChargeId(null);
                    setQrImage(null);
                    setExpiresAt(null);
                    setSecondsRemaining(0);
                    window.alert('QR หมดอายุแล้ว ระบบยกเลิกคำสั่งซื้อรายการนี้ กรุณาสร้าง QR ใหม่');
                }
            } catch {
                // Keep polling while the admin reviews the payment.
            }
        }, 3000);
        return () => window.clearInterval(timer);
    }, [chargeId, router, showQr]);

    useEffect(() => {
        if (!showQr || !expiresAt) return;

        const updateRemainingTime = () => {
            const remaining = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000);
            setSecondsRemaining(Math.max(0, remaining));
        };

        updateRemainingTime();
        const timer = window.setInterval(updateRemainingTime, 1000);
        return () => window.clearInterval(timer);
    }, [expiresAt, showQr]);

    const payableAmount = paymentAmount ?? plan.price;

    return (
        <div className="min-h-screen bg-[#F4F7FE] px-4 py-12">
            <div className="mx-auto max-w-5xl">
                <button type="button" onClick={() => router.back()} className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#020263]">
                    <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
                </button>
                <div className="grid gap-8 md:grid-cols-12">
                    <aside className="space-y-4 md:col-span-4">
                        <div className={`rounded-[2.5rem] bg-gradient-to-br ${plan.theme} p-8 text-white shadow-xl`}>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Order Summary</p>
                            <div className="my-7 border-y border-white/20 py-6">
                                <p className="text-xs text-white/70">แพ็กเกจที่คุณเลือก</p>
                                <h1 className="mt-1 text-3xl font-black">{plan.name} Plan</h1>
                            </div>
                            <p className="text-xs text-white/70">ยอดชำระสุทธิ</p>
                            <p className="mt-1 text-4xl font-black">฿{payableAmount.toLocaleString('th-TH')}.00</p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500" />
                            <span className="text-[11px] leading-snug text-slate-500">ระบบชำระเงินภายใน WorksDD<br />ไม่เก็บข้อมูลบัตรเครดิต</span>
                        </div>
                    </aside>
                    <main className="md:col-span-8">
                        <h2 className="text-2xl font-black text-slate-800">ช่องทางชำระเงิน</h2>
                        <p className="mt-1 text-sm text-slate-400">PromptPay QR ที่สร้างโดยระบบ WorksDD</p>
                        <section className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                            <div className="flex gap-4 rounded-2xl bg-blue-50 p-5 text-blue-700">
                                <div className="h-fit rounded-xl bg-white p-3 shadow-sm"><QrCode className="h-6 w-6" /></div>
                                <div><h3 className="font-black">Thai QR PromptPay</h3><p className="mt-1 text-sm text-blue-600">สแกนจ่ายจาก Mobile Banking ได้ทุกธนาคาร</p><p className="mt-1 text-xs text-blue-500">หลังโอนเงิน ให้แนบสลิปเพื่อให้แอดมินตรวจยอดเงินจริง</p></div>
                            </div>
                            <button type="button" onClick={createQr} disabled={loading} className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-300 ${plan.button} ${loading ? 'slip-checking-button' : ''}`}>
                                {loading ? <><WorksddLogoLoader />กำลังสร้าง QR...</> : <><QrCode className="h-5 w-5" />สร้าง QR เพื่อชำระ ฿{payableAmount.toLocaleString('th-TH')}.00</>}
                            </button>
                        </section>
                        {companyRequired && <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm" role="alert">
                            <div className="flex gap-3">
                                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                <div className="w-full">
                                    <h3 className="font-black">กรุณาสร้างข้อมูลบริษัทก่อน</h3>
                                    <p className="mt-1 text-sm text-amber-700">บัญชีนี้ยังไม่มีบริษัทที่ผูกไว้ ระบบจะสร้างโปรไฟล์บริษัทเริ่มต้นให้ แล้วจึงสร้าง QR ต่อให้ทันที</p>
                                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                        <input
                                            value={companyName}
                                            onChange={(event) => setCompanyName(event.target.value)}
                                            placeholder="ชื่อบริษัท"
                                            className="min-w-0 flex-1 rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                                        />
                                        <button type="button" onClick={createCompanyAndRetry} disabled={creatingCompany} className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-300">
                                            {creatingCompany ? 'กำลังสร้าง...' : 'สร้างบริษัทและสร้าง QR'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>}
                        {employerAccountRequired && <section className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm" role="alert">
                            <div className="flex gap-3">
                                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                                <div>
                                    <h3 className="font-black">ต้องใช้บัญชีผู้ประกอบการ</h3>
                                    <p className="mt-1 text-sm text-rose-700">บัญชีปัจจุบันเป็นบัญชีผู้สมัครงาน จึงไม่สามารถสร้างบริษัทหรือซื้อแพ็กเกจสำหรับประกาศงานได้</p>
                                    <button type="button" onClick={() => router.push('/register/employer')} className="mt-4 rounded-xl bg-rose-600 px-5 py-3 text-sm font-black text-white transition hover:bg-rose-700">
                                        สมัครบัญชีผู้ประกอบการ
                                    </button>
                                </div>
                            </div>
                        </section>}
                    </main>
                </div>
            </div>
            {showQr && qrImage && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                <div className="relative max-h-[95vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
                    <button type="button" onClick={() => setShowQr(false)} className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
                    <div className="text-center"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#020263]">PromptPay QR</p><h3 className="mt-2 text-2xl font-black text-slate-800">สแกนเพื่อชำระเงิน</h3><p className="mt-1 text-sm text-slate-400">ยอดชำระ ฿{payableAmount.toLocaleString('th-TH')}.00</p></div>
                    {verificationState === 'idle' && <>
                        <div className="mx-auto mt-6 max-w-xs rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-4"><img src={qrImage} alt="PromptPay QR Code" className="aspect-square w-full rounded-xl bg-white" /></div>
                        <div className={`mt-4 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${secondsRemaining <= 30 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-700'}`}>
                            <Clock3 className="h-4 w-4" />
                            {secondsRemaining > 0 ? `QR นี้ใช้ได้อีก ${formatRemainingTime(secondsRemaining)} นาที` : 'QR หมดอายุ กำลังยกเลิกคำสั่งซื้อ...'}
                        </div>
                    </>}
                    {verificationState !== 'idle' ? (
                        <SlipReviewAnimation
                            status={verificationState}
                            message={verificationState === 'rejected' ? (slipMessage || slipResult?.verificationMessage) : undefined}
                            onRetry={verificationState === 'rejected' ? () => { setVerificationState('idle'); setSlipResult(null); setSlipFile(null); setSlipMessage(''); } : undefined}
                        />
                    ) : (
                        <div className="mt-6 space-y-3">
                            <label htmlFor="payment-slip" className="flex items-center gap-2 text-sm font-black text-slate-700"><Upload className="h-4 w-4 text-[#020263]" />แนบสลิปหลังโอนเงิน</label>
                            <input id="payment-slip" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { setSlipFile(event.target.files?.[0] || null); setSlipResult(null); setVerificationState('idle'); setSlipMessage(''); }} className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#020263] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white" />
                            <button type="button" onClick={uploadSlip} disabled={!slipFile || uploading || !!slipResult} className={`w-full rounded-xl py-3 text-sm font-black text-white transition disabled:cursor-not-allowed ${uploading ? 'slip-checking-button' : 'bg-[#020263] hover:bg-[#10108a] disabled:bg-slate-300'}`}>
                                {uploading ? 'กำลังตรวจสอบสลิป...' : 'ส่งสลิปให้ตรวจสอบ'}
                            </button>
                        </div>
                    )}
                    {slipMessage && verificationState === 'idle' && <div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-600">{slipMessage}</div>}
                    <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">ถ้า 1xSlip ยืนยันข้อมูลครบ ระบบจะเปิดแพ็กเกจให้อัตโนมัติ</div>
                </div>
            </div>}
        </div>
    );
}
