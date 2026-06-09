'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function PaymentStatusPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale;

    useEffect(() => {
        // รอสักพักให้ Webhook ทำงานเสร็จ แล้วค่อยพากลับหน้า Dashboard
        const timer = setTimeout(() => {
            router.push(`/${locale}/employer/dashboard?upgrade=success`);
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-bold">กำลังตรวจสอบรายการชำระเงิน...</h2>
            <p className="text-slate-500">กรุณาอย่าปิดหน้าต่างนี้</p>
        </div>
    );
}