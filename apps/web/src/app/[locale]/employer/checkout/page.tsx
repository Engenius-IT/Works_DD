"use client";
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import axios from 'axios';
import {
    CreditCard,
    QrCode,
    ShieldCheck,
    Zap,
    ChevronRight,
    ChevronDown,
    ArrowLeft,
    Building2,
    Star,
    Crown,
    Package,
    ExternalLink,
    EyeOff,
    Eye
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

declare global {
    interface Window {
        Omise: any;
    }
}

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();


    const rawPlan = searchParams.get('plan') || 'Pro';
    const isVip = rawPlan.toLowerCase().includes('vip');
    const isPremium = rawPlan.toLowerCase().includes('premium');
    const isPro = !isVip && !isPremium;

    let planName = 'Pro';
    let price = 2990;

    if (isVip) {
        planName = 'VIP';
        price = 15990;
    } else if (isPremium) {
        planName = 'Premium';
        price = 5990;
    }

    const [loading, setLoading] = useState(false);
    const [isBankOpen, setIsBankOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [currentChargeId, setCurrentChargeId] = useState<string | null>(null);
    const [isCardOpen, setIsCardOpen] = useState(false);
    const [showCvvPeek, setShowCvvPeek] = useState(false);
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    interface Bank {
        id: string;
        color: string;
        label: string;
        logoUrl: string;
    }

    const banks: Bank[] = [
        {
            id: 'kbank',
            color: '#00A950',
            label: 'กสิกร (K-Plus)',
            logoUrl: '/images/kbank.webp'
        },
        {
            id: 'scb',
            color: '#4E2E7F',
            label: 'ไทยพาณิชย์',
            logoUrl: '/images/thaipanit.jpg'
        },
        {
            id: 'ktb',
            color: '#00A1E0',
            label: 'กรุงไทย',
            logoUrl: '/images/krungthai.jpg'
        },
        {
            id: 'bbl',
            color: '#1E3A8A',
            label: 'กรุงเทพ',
            logoUrl: '/images/krungthep.png'
        },
        {
            id: 'bay',
            color: '#ED1C24',
            label: 'กรุงศรี',
            logoUrl: '/images/krungsri.jpg'
        },
        {
            id: 'ttb',
            color: '#FBBC05',
            label: 'ttb',
            logoUrl: '/images/ttb.png'
        },
        {
            id: 'uob',
            color: '#FF5D00',
            label: 'UOB',
            logoUrl: '/images/uob.png'
        },
        {
            id: 'gsb',
            color: '#0041CD',
            label: 'ออมสิน',
            logoUrl: '/images/aomsin.jpg'
        },
    ];

    const [cardData, setCardData] = useState({
        number: '',
        name: '',
        expiry: '',
        cvc: '',
    });
    const [cardType, setCardType] = useState('unknown');

    // เพิ่ม bankId เข้าไปใน Parameter
    const handleRealPayment = async (bankId?: string | null) => {
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนชำระเงิน");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');

            // 1. ดึงข้อมูลบริษัท
            const companyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const realCompanyId = companyRes.data.id;
            if (!realCompanyId) {
                alert("ไม่พบข้อมูลบริษัท กรุณาสร้างข้อมูลบริษัทก่อนอัปเกรด");
                return;
            }

            // 2. เตรียม Payload 
            const selectedMethod = bankId ? bankId : "promptpay";
            // ถ้าไม่มี bankId ส่งมา (จากปุ่ม PromptPay กลาง) ให้ default เป็น PROMPTPAY
            const payload = {
                companyId: realCompanyId,
                planName: planName,
                amount: price,
                method: selectedMethod
            };

            // 3. ยิง API
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const { authorizeUri, qrImageUrl, chargeId } = response.data;

            // 4. จัดการผลลัพธ์ (Response) - ปรับปรุงใหม่ให้แยกขาดจากกัน
            if (selectedMethod === 'promptpay' && qrImageUrl) {
                // ✅ ถ้าเลือกจ่าย PromptPay และมีรูป QR Code ให้เปิด Modal โชว์บนหน้าจอทันที (ห้ามวาร์ปหนี)
                setQrCodeUrl(qrImageUrl);
                setCurrentChargeId(chargeId);
                setShowQrModal(true);
            }
            else if (authorizeUri) {
                // ✅ ถ้าเป็น Mobile Banking (ซึ่ง selectedMethod จะไม่ใช่ 'promptpay') ให้เด้งไปแอปธนาคาร
                window.location.href = authorizeUri;
            }
            else {
                alert("ไม่สามารถสร้างรายการชำระเงินได้ในขณะนี้");
            }

        } catch (error: any) {
            console.error("Payment Error:", error);
            alert("Error: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleCreditCardPayment = async () => {
        if (!user || loading) return;

        if (!cardData.expiry) {
            alert("กรุณากรอกข้อมูลวันหมดอายุ");
            return;
        }

        // 🌟 1. ดึงเฉพาะตัวเลขล้วนๆ ออกมา (เช่น "12/28" หรือ "1228" จะเหลือแค่ "1228" เสมอ)
        const cleanNumbers = cardData.expiry.replace(/\D/g, '');

        // เช็คว่าตัวเลขครบ 4 หลักไหม (เดือน 2 หลัก + ปี 2 หลัก)
        if (cleanNumbers.length !== 4) {
            alert("รูปแบบวันหมดอายุไม่ถูกต้อง กรุณากรอกในรูปแบบ MM/YY (เช่น 12/28)");
            return;
        }

        // 🌟 2. หั่นตามตำแหน่ง Index ที่แน่นอนไปเลย ไม่ต้องง้อเครื่องหมาย '/'
        const expiry_month = parseInt(cleanNumbers.slice(0, 2), 10); // เอาตัวอักษรตำแหน่งที่ 0 และ 1
        const rawYear = cleanNumbers.slice(2, 4);                     // เอาตัวอักษรตำแหน่งที่ 2 และ 3
        const expiry_year = parseInt(`20${rawYear}`, 10);            // ต่อให้เป็น 2028 เต็มรูปแบบ

        // 🌟 3. ดักเช็คค่าเด็ดขาดก่อนยิงไป Omise (ถ้าหลุดตรงนี้ ระบบจะตัดบททันที ไม่ปล่อยให้ Error 400 ข้ามไปถึง Omise)
        if (isNaN(expiry_month) || expiry_month < 1 || expiry_month > 12) {
            alert("เดือนหมดอายุไม่ถูกต้อง ต้องอยู่ระหว่าง 01 - 12");
            return;
        }
        if (isNaN(expiry_year)) {
            alert("ปีหมดอายุไม่ถูกต้อง");
            return;
        }

        // เช็ควันหมดอายุเทียบกับเวลาปัจจุบัน
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;

        if (expiry_year < currentYear || (expiry_year === currentYear && expiry_month < currentMonth)) {
            alert("บัตรใบนี้หมดอายุการใช้งานแล้ว");
            return;
        }

        const publicKey = process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY;
        if (!publicKey) {
            alert("ไม่พบรหัส Public Key ในระบบ");
            return;
        }

        setLoading(true);

        const createOmiseToken = async () => {
            const cleanCardNumber = cardData.number.replace(/\D/g, '');
            const cleanCvc = cardData.cvc ? cardData.cvc.toString().replace(/\D/g, '') : '';

            const cardPayload = {
                card: {
                    name: cardData.name || "CARD HOLDER",
                    number: cleanCardNumber,
                    // 🌟 เปลี่ยนชื่อคีย์เป็นของ Omise API ตรงๆ (ไม่มีอันเดอร์สกอร์ตรงคำว่า expiry)
                    expiration_month: Number(expiry_month),
                    expiration_year: Number(expiry_year),
                    security_code: cleanCvc
                }
            };

            console.log("🚀 ส่งไป Omise รอบแก้คีย์:", cardPayload);

            const response = await axios.post('https://vault.omise.co/tokens', cardPayload, {
                auth: {
                    username: publicKey,
                    password: ''
                },
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        };

        try {
            const omiseResponse: any = await createOmiseToken();
            console.log("Omise Token Created Successfully:", omiseResponse.id);

            // 🟢 1. ดึง Token สิทธิ์เข้าถึงของผู้ใช้มาถือไว้ในหน้าบ้าน
            const token = localStorage.getItem('accessToken');

            // 🟢 2. เรียกหาข้อมูลบริษัทจริงจากฝั่งหลังบ้าน (อิงตาม logic เดียวกับ PromptPay ด้านบน)
            const companyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const realCompanyId = companyRes.data.id;
            if (!realCompanyId) {
                alert("ไม่พบข้อมูลบริษัท กรุณาสร้างข้อมูลบริษัทก่อนดำเนินการชำระเงิน");
                setLoading(false);
                return;
            }

            // 🟢 3. ยิงข้อมูลหาเส้นทาง NestJS ตัวจริง โดยเปลี่ยน URL ไปใช้ `${process.env.NEXT_PUBLIC_API_URL}`
            const backendResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/payments/create`, {
                token: omiseResponse.id,
                method: 'credit_card',
                companyId: realCompanyId,
                planName: planName,
                amount: price,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 🟢 4. ตรวจสอบสเตตัสการตอบกลับ หากเซิร์ฟเวอร์ทำงานเสร็จพาวาร์ปไปหน้าแดชบอร์ดทันที
            if (backendResponse.status === 200 || backendResponse.status === 201 || backendResponse.data.success) {
                alert("ทำรายการชำระเงินสำเร็จ!");
                setLoading(false);
                router.push('/employer/dashboard?upgrade=success');
            } else {
                alert("หลังบ้านตอบกลับสำเร็จแต่มีบางอย่างผิดพลาด");
                setLoading(false);
            }

        } catch (error: any) {
            console.error("Payment Error Full Object:", error);

            const omiseError = error.response?.data;
            if (omiseError && omiseError.message) {
                alert(`Omise Reject (400): ${omiseError.message}`);
            } else {
                // หาก URL ยิงถูกแล้ว จะไม่ขึ้น 404 อีกต่อไปครับ
                alert(`เกิดข้อผิดพลาดในการเชื่อมต่อหลังบ้าน: ${error.message}`);
            }
            setLoading(false);
        }
    };

    const handleBypass = async () => {
        if (!user || user.role !== 'EMPLOYER') {
            alert("สิทธิ์ของคุณไม่สามารถอัปเกรดแพ็คเกจได้");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const companyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const realCompanyId = companyRes.data.id;
            if (!realCompanyId) throw new Error("ไม่พบข้อมูลบริษัทที่ผูกกับบัญชีนี้");

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/packages/upgrade`, {
                companyId: realCompanyId,
                planName: planName
            });

            if (response.data.success) {
                router.push('/employer/dashboard?upgrade=success');
            }
        } catch (error: any) {
            alert(error.message || "เกิดข้อผิดพลาดในการอัปเกรด");
        } finally {
            setLoading(false);
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, ''); // ลบทุกอย่างที่ไม่ใช่ตัวเลข

        // ดักจับประเภทบัตรจากเลขตัวแรก
        if (value.startsWith('4')) setCardType('visa');
        else if (value.match(/^5[1-5]/)) setCardType('mastercard');
        else if (value.startsWith('35')) setCardType('jcb');
        else setCardType('unknown');

        // จัด Format เลขบัตรให้เว้นวรรคทุก 4 ตัว (1234 5678...)
        const formattedValue = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();

        setCardData({ ...cardData, number: formattedValue.slice(0, 19) }); // จำกัด 16 หลัก + 3 ช่องว่าง
    };

    React.useEffect(() => {
        let interval: NodeJS.Timeout;

        if (showQrModal && currentChargeId) {
            interval = setInterval(async () => {
                try {
                    // ✅ ดึง token ใหม่ข้างในนี้เลยครับ
                    const token = localStorage.getItem('accessToken');

                    // ยิงไปเช็คสถานะที่ Backend
                    const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/payments/status/${currentChargeId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    // ถ้าสถานะเป็นสำเร็จ
                    if (res.data.status === 'SUCCESS' || res.data.status === 'successful') {
                        clearInterval(interval);
                        setShowQrModal(false);
                        // 🚀 Redirect ไปหน้า Dashboard
                        router.push('/employer/dashboard?upgrade=success');
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 3000); // เช็คทุก 3 วินาที
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [showQrModal, currentChargeId, router]);

    return (
        <div className="min-h-screen bg-[#F4F7FE] py-12 px-4">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-[#020263] mb-8 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">ย้อนกลับ</span>
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

                    {/* --- ฝั่งซ้าย: Order Summary --- */}
                    <div className="md:col-span-4 space-y-4">
                        <div className={`
                            rounded-[2.5rem] p-8 text-white relative overflow-hidden transition-all duration-700
                            ${isVip ? 'bg-gradient-to-br from-rose-500 via-red-600 to-[#020263] shadow-[0_20px_50px_-15px_rgba(225,29,72,0.3)]' : ''}
                            ${isPremium ? 'bg-[#020263] shadow-xl shadow-blue-900/20' : ''} {/* 🌟 เปลี่ยน Premium เป็น Midnight Blue */}
                            ${isPro ? 'bg-amber-500 shadow-[0_20px_50px_-15px_rgba(245,158,11,0.3)]' : ''} {/* 🌟 เปลี่ยน Pro เป็น สีทอง amber */}
                        `}>
                            {/* --- VIP & Premium Decor --- */}
                            {isVip && (
                                <>
                                    <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-rose-400/30 rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                                </>
                            )}
                            {isPremium && (
                                <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/20 rounded-full blur-3xl" />
                            )}

                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] opacity-80 
                                    ${isVip ? 'text-rose-100' : isPremium ? 'text-blue-300' : 'text-amber-100'}`}> {/* 🌟 สลับสี text ย่อย */}
                                    Order Summary
                                </h3>
                                <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-md">
                                    {isVip && <Star className="w-4 h-4 text-rose-300 fill-rose-300 animate-pulse" />}
                                    {isPremium && <Crown className="w-4 h-4 text-blue-200 fill-blue-200" />} {/* 🌟 คราวน์ของพรีเมียมสีฟ้าอ่อนเนื้อ Midnight */}
                                    {isPro && <Package className="w-4 h-4 text-amber-200" />} {/* 🌟 แพ็คเกจของโปรสีทอง */}
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <div>
                                    <p className={`text-xs mb-1 ${isVip ? 'text-rose-100/70' : isPremium ? 'text-blue-200/60' : 'text-amber-50/70'}`}>
                                        แพ็คเกจที่คุณเลือก
                                    </p>
                                    <h4 className="text-3xl font-black tracking-tight flex items-center gap-2">
                                        {planName} Plan
                                        {isVip && <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Maximum</span>}
                                        {isPremium && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">High</span>} {/* 🌟 ปรับป้ายกำกับ */}
                                        {isPro && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Basic</span>} {/* 🌟 ปรับป้ายกำกับ */}
                                    </h4>
                                </div>

                                <div className={`pt-6 border-t ${isVip ? 'border-white/20' : isPremium ? 'border-white/10' : 'border-white/20'}`}>
                                    <p className={`text-xs mb-1 ${isVip ? 'text-rose-100/70' : isPremium ? 'text-blue-200/60' : 'text-amber-50/70'}`}>
                                        ยอดชำระสุทธิ
                                    </p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-white">฿{price}.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-center gap-3 px-4 py-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span className="text-[11px] text-slate-500 font-medium leading-snug">
                                ระบบชำระเงินปลอดภัยสูง <br />จัดเก็บข้อมูลด้วยมาตรฐาน PCI-DSS
                            </span>
                        </div>
                    </div>

                    {/* --- ฝั่งขวา: เลือกวิธีชำระเงิน --- */}
                    <div className="md:col-span-8 space-y-3">
                        <div className="mb-6 ml-2">
                            <h2 className="text-xl font-black text-slate-800">ช่องทางชำระเงิน</h2>
                            <p className="text-sm text-slate-400">เลือกช่องทางที่ต้องการเพื่อดำเนินการต่อ</p>
                        </div>

                        {/* 1. PromptPay */}
                        <PaymentOption
                            onClick={() => handleRealPayment()}
                            icon={<QrCode className="w-5 h-5" />}
                            title="Thai QR PromptPay"
                            description="สแกนผ่าน Mobile Banking ได้ทุกธนาคาร"
                            isVip={isVip}
                            isPremium={isPremium}
                        />

                        {/* 2. บัตรเครดิต */}
                        <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isCardOpen
                            ? (isVip ? 'border-rose-400 shadow-[0_15px_35px_-10px_rgba(225,29,72,0.15)] ring-1 ring-rose-400/10' : isPremium ? 'border-blue-600 shadow-[0_15px_35px_-10px_rgba(37,99,235,0.15)] ring-1 ring-blue-600/10' : 'border-amber-400 shadow-[0_15px_35px_-10px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/10')
                            : (isVip ? 'border-slate-100 hover:border-rose-400 hover:shadow-rose-900/5' : isPremium ? 'border-slate-100 hover:border-blue-600 hover:shadow-blue-900/5' : 'border-slate-100 hover:border-amber-400 hover:shadow-amber-900/5')
                            }`}
                        >
                            <button
                                onClick={() => setIsCardOpen(!isCardOpen)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-all duration-300 
                                        ${isCardOpen
                                            ? (isVip ? 'bg-rose-500 text-white' : isPremium ? 'bg-[#020263] text-white' : 'bg-amber-500 text-white')
                                            : (isVip ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' : isPremium ? 'bg-slate-50 text-[#020263] group-hover:bg-blue-50' : 'bg-amber-50 text-amber-500 group-hover:bg-amber-100')
                                        }`}
                                    >
                                        <CreditCard className="w-5 h-5" />
                                    </div>

                                    <div className="text-left">
                                        <p className={`text-sm font-bold text-slate-700 transition-colors ${isVip ? 'group-hover:text-rose-600' : isPremium ? 'group-hover:text-blue-600' : 'group-hover:text-amber-600'} ${isCardOpen && (isVip ? 'text-rose-600' : isPremium ? 'text-blue-600' : 'text-amber-600')}`}>
                                            บัตรเครดิต / เดบิต
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium">Mastercard, VISA, JCB</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {cardType !== 'unknown' && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border transition-all ${isVip ? 'bg-rose-50 border-rose-100 text-rose-600' : isPremium ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                            {cardType}
                                        </span>
                                    )}
                                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-all duration-500 ${isCardOpen ? 'rotate-180 text-slate-500' : 'group-hover:text-slate-400'}`} />
                                </div>
                            </button>

                            {isCardOpen && (
                                <div className="p-6 pt-2 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* Card Number */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Card Number</label>
                                        <input
                                            type="text"
                                            value={cardData.number}
                                            onChange={handleCardNumberChange}
                                            placeholder="0000 0000 0000 0000"
                                            className={`w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none transition-all font-mono text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:bg-white ${isVip ? 'focus:ring-rose-400/10 focus:border-rose-400' : isPremium ? 'focus:ring-blue-600/10 focus:border-blue-600' : 'focus:ring-amber-400/10 focus:border-amber-400'}`}
                                        />
                                    </div>

                                    {/* Holder Name */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Card Holder Name</label>
                                        <input
                                            type="text"
                                            value={cardData.name || ''}
                                            placeholder="NAME SURNAME"
                                            className={`w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none transition-all text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:bg-white ${isVip ? 'focus:ring-rose-400/10 focus:border-rose-400' : isPremium ? 'focus:ring-blue-600/10 focus:border-blue-600' : 'focus:ring-amber-400/10 focus:border-amber-400'}`}
                                            onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Expiry */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Expiry (MM/YY)</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                maxLength={5}
                                                value={cardData.expiry}
                                                className={`w-full p-3.5 bg-slate-50 border border-slate-100 rounded-xl outline-none transition-all text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:bg-white ${isVip ? 'focus:ring-rose-400/10 focus:border-rose-400' : isPremium ? 'focus:ring-blue-600/10 focus:border-blue-600' : 'focus:ring-amber-400/10 focus:border-amber-400'}`}
                                                onChange={(e) => {
                                                    let v = e.target.value.replace(/\D/g, '');
                                                    if (v.length > 4) v = v.slice(0, 4);
                                                    let formatted = v;
                                                    if (v.length > 2) {
                                                        formatted = `${v.slice(0, 2)}/${v.slice(2)}`;
                                                    }
                                                    setCardData({ ...cardData, expiry: formatted });
                                                }}
                                            />
                                        </div>

                                        {/* CVV */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">CVV</label>
                                            <div className="relative flex items-center">
                                                <input
                                                    type={showCvvPeek ? "text" : "password"}
                                                    placeholder="•••"
                                                    maxLength={3}
                                                    value={cardData.cvc || ''}
                                                    className={`w-full p-3.5 pr-10 bg-slate-50 border border-slate-100 rounded-xl outline-none transition-all text-slate-800 placeholder:text-slate-300 focus:ring-4 focus:bg-white ${isVip ? 'focus:ring-rose-400/10 focus:border-rose-400' : isPremium ? 'focus:ring-blue-600/10 focus:border-blue-600' : 'focus:ring-amber-400/10 focus:border-amber-400'}`}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setCardData({ ...cardData, cvc: val });
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCvvPeek(!showCvvPeek)}
                                                    className="absolute right-3 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {showCvvPeek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className={`w-full py-4 text-white font-black rounded-xl shadow-lg active:scale-[0.97] transition-all mt-4 mb-2 flex items-center justify-center gap-2 ${loading
                                            ? 'bg-slate-400 cursor-not-allowed shadow-none'
                                            : (isVip ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200' : isPremium ? 'bg-[#020263] hover:bg-black shadow-blue-200' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200')
                                            }`}
                                        onClick={handleCreditCardPayment}
                                    >
                                        {loading ? "กำลังประมวลผลบัตร..." : `ยืนยันชำระเงิน ฿${price}.00`}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Mobile Banking (Accordion) */}
                        <div className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${isBankOpen
                            ? (isVip ? 'border-rose-400 shadow-[0_15px_35px_-10px_rgba(225,29,72,0.15)] ring-1 ring-rose-400/10' : isPremium ? 'border-blue-600 shadow-[0_15px_35px_-10px_rgba(37,99,235,0.15)] ring-1 ring-blue-600/10' : 'border-amber-400 shadow-[0_15px_35px_-10px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/10')
                            : (isVip ? 'border-slate-100 hover:border-rose-400 hover:shadow-rose-900/5' : isPremium ? 'border-slate-100 hover:border-blue-600 hover:shadow-blue-900/5' : 'border-slate-100 hover:border-amber-400 hover:shadow-amber-900/5')
                            }`}
                        >
                            <button
                                onClick={() => setIsBankOpen(!isBankOpen)}
                                className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${isBankOpen
                                        ? (isVip ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : isPremium ? 'bg-[#020263] text-white shadow-lg shadow-blue-200' : 'bg-amber-500 text-white shadow-lg shadow-amber-200')
                                        : (isVip ? 'bg-rose-50 text-rose-500 group-hover:bg-rose-100' :
                                            isPremium ? 'bg-slate-50 text-[#020263] group-hover:bg-blue-50' :
                                                'bg-amber-50 text-amber-500 group-hover:bg-amber-100')
                                        }`}
                                    >
                                        <Building2 className="w-5 h-5" />
                                    </div>

                                    <div className="text-left">
                                        <p className={`text-sm font-bold transition-colors ${isBankOpen
                                            ? (isVip ? 'text-rose-600' : isPremium ? 'text-blue-600' : 'text-amber-600')
                                            : 'text-slate-700'}`}>
                                            Mobile Banking
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium">ชำระผ่านแอปพลิเคชันธนาคารโดยตรง</p>
                                    </div>
                                </div>

                                <ChevronDown className={`w-5 h-5 transition-all duration-500 ${isBankOpen
                                    ? 'rotate-180 text-slate-600'
                                    : 'text-slate-300 group-hover:text-slate-400'}`} />
                            </button>

                            {isBankOpen && (
                                <div className="p-6 pt-2 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* Bank Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {banks.map((bank) => (
                                            <button
                                                key={bank.id}
                                                type="button"
                                                onClick={() => setSelectedBank(bank.id)}
                                                className={`p-4 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group relative overflow-hidden ${selectedBank === bank.id
                                                    ? (isVip ? 'border-rose-500 bg-white shadow-xl scale-105' :
                                                        isPremium ? 'border-blue-600 bg-white shadow-xl scale-105' :
                                                            'border-amber-500 bg-white shadow-xl scale-105')
                                                    : 'border-slate-100 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <div className="w-16 h-16 flex items-center justify-center p-0.5 bg-slate-50 rounded-2xl overflow-hidden transition-transform group-hover:scale-110">
                                                    <img
                                                        src={bank.logoUrl}
                                                        alt={bank.label}
                                                        className="w-full h-full object-cover rounded-xl"
                                                    />
                                                </div>

                                                <span className={`text-xs font-black tracking-tight transition-colors ${selectedBank === bank.id
                                                    ? (isVip ? 'text-rose-600' : isPremium ? 'text-blue-600' : 'text-amber-600')
                                                    : 'text-slate-400 group-hover:text-slate-600'
                                                    }`}>
                                                    {bank.label}
                                                </span>

                                                {/* Indicator */}
                                                {selectedBank === bank.id && (
                                                    <div className={`absolute top-0 left-0 w-full h-1 ${isVip ? 'bg-rose-500' : isPremium ? 'bg-blue-600' : 'bg-amber-500'}`} />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* --- ปุ่มยืนยันชำระเงิน --- */}
                                    <div className="pt-2">
                                        <button
                                            disabled={!selectedBank || loading}
                                            onClick={() => {
                                                handleRealPayment(selectedBank);
                                            }}
                                            className={`w-full py-4 text-white font-black rounded-xl shadow-lg active:scale-[0.97] transition-all flex items-center justify-center gap-2 ${!selectedBank
                                                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                                : loading
                                                    ? 'bg-slate-400'
                                                    : (isVip ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                                                        : isPremium ? 'bg-[#020263] hover:bg-black shadow-blue-200'
                                                            : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200')
                                                }`}
                                        >
                                            {loading ? (
                                                "กำลังติดต่อธนาคาร..."
                                            ) : (
                                                <>
                                                    <ExternalLink className="w-4 h-4" />
                                                    {selectedBank
                                                        ? `ยืนยันชำระผ่าน ${banks.find(b => b.id === selectedBank)?.label}`
                                                        : 'กรุณาเลือกธนาคารด้านบน'}
                                                </>
                                            )}
                                        </button>

                                        <p className="text-center text-[10px] text-slate-400 mt-3">
                                            {selectedBank
                                                ? `* ระบบจะสร้าง QR Code หรือเปิดแอป ${banks.find(b => b.id === selectedBank)?.label} ให้คุณ`
                                                : `* กรุณาเลือกธนาคารเพื่อดำเนินการต่อ`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- Developer Bypass --- */}
                        <div className={`mt-12 p-6 rounded-[2rem] border flex items-center justify-between shadow-sm transition-colors
                            ${isVip ? 'bg-rose-50/50 border-rose-100' : isPremium ? 'bg-slate-50 border-slate-100' : 'bg-amber-50/50 border-amber-100'}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <Zap className={`w-6 h-6 fill-current ${isVip ? 'text-rose-500' : isPremium ? 'text-[#020263]' : 'text-amber-500'}`} />
                                </div>
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest opacity-60 
                                        ${isVip ? 'text-rose-800' : isPremium ? 'text-slate-500' : 'text-amber-800'}`}>Sandbox Mode</p>
                                    <p className={`text-xs font-bold ${isVip ? 'text-rose-900/80' : isPremium ? 'text-slate-700' : 'text-amber-900/80'}`}>จำลองการชำระเงินสำเร็จ</p>
                                </div>
                            </div>
                            <button
                                onClick={handleBypass}
                                disabled={loading}
                                className={`text-white text-[11px] font-black px-8 py-3 rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50
                                    ${isVip ? 'bg-gradient-to-r from-rose-500 via-red-600 to-blue-900 hover:brightness-110 shadow-rose-900/20' :
                                        isPremium ? 'bg-[#020263] hover:bg-black shadow-blue-900/20' :
                                            'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20'}`}
                            >
                                {loading ? "PROCESSING..." : "BYPASS PAYMENT"}
                            </button>
                        </div>

                        {showQrModal && qrCodeUrl && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                                <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black text-slate-800 text-center">สแกนเพื่อชำระเงิน</h3>
                                        <p className="text-sm text-slate-400">กรุณาใช้แอปธนาคารสแกน QR Code ด้านล่าง</p>
                                    </div>

                                    {/* ส่วนแสดง QR */}
                                    <div className="bg-slate-50 p-4 rounded-3xl border-2 border-dashed border-slate-200">
                                        <img src={qrCodeUrl} alt="PromptPay QR Code" className="w-full aspect-square rounded-xl shadow-sm" />
                                    </div>

                                    {/* รายละเอียดเพิ่มเติม */}
                                    <div className="bg-blue-50 p-4 rounded-2xl flex items-center gap-3 text-left">
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
                                            <QrCode className="w-5 h-5 text-[#020263]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-900 uppercase tracking-wider">PromptPay</p>
                                            <p className="text-xs text-blue-700 font-bold">ยอดชำระ: ฿{price}.00</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setShowQrModal(false)}
                                        className="w-full py-4 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        ปิดหน้าต่างนี้
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-components
function PaymentOption({ icon, title, description, isVip, isPremium, onClick }: any) {

    const hoverBorderClass = isVip
        ? 'hover:border-rose-400 hover:shadow-rose-900/5'
        : isPremium
            ? 'hover:border-[#020263] hover:shadow-blue-900/5'   // 🌟 Premium: เปลี่ยนเป็น Midnight Blue
            : 'hover:border-amber-400 hover:shadow-amber-900/5'; // 🌟 Pro: เปลี่ยนเป็นสีทอง Amber

    const bgClass = isVip
        ? 'bg-rose-50 group-hover:bg-rose-500 group-hover:text-white'
        : isPremium
            ? 'bg-blue-50 group-hover:bg-[#020263] group-hover:text-white'   // 🌟 Premium: เปลี่ยนเป็น Midnight Blue
            : 'bg-amber-50 group-hover:bg-amber-500 group-hover:text-white'; // 🌟 Pro: เปลี่ยนเป็นสีทอง Amber

    const textHoverClass = isVip
        ? 'group-hover:text-rose-600'
        : isPremium
            ? 'group-hover:text-blue-700'   // 🌟 Premium: เปลี่ยนเป็นโทนสีน้ำเงิน
            : 'group-hover:text-amber-600'; // 🌟 Pro: เปลี่ยนเป็นโทนสีทอง Amber

    const iconColorClass = isVip
        ? 'text-rose-500'
        : isPremium
            ? 'text-[#020263]'  // 🌟 Premium: เปลี่ยนเป็น Midnight Blue
            : 'text-amber-500'; // 🌟 Pro: เปลี่ยนเป็นสีทอง Amber

    return (
        <button onClick={onClick} className={`w-full bg-white flex items-center justify-between p-5 border border-slate-100 rounded-2xl transition-all group ${hoverBorderClass}`}>
            <div className="flex items-center gap-4">
                {/* ตรงนี้ยุบมาใช้ iconColorClass ตรงๆ ตัวหนังสือกับไอคอนจะได้ไปในทิศทางเดียวกันและไม่เอ๋อครับ */}
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${bgClass} ${iconColorClass}`}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className={`text-sm font-bold text-slate-700 transition-colors ${textHoverClass}`}>{title}</p>
                    <p className="text-[11px] text-slate-400">{description}</p>
                </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-slate-200 transition-all group-hover:translate-x-1 ${textHoverClass}`} />
        </button>
    );
}
