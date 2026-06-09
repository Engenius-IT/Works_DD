"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { usePackage } from '@/hooks/usePackage';
import Script from 'next/script'; // 1. อิมพอร์ต Script เข้ามาตรงนี้

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
    const { packageInfo, isLoading } = usePackage();
    const pathname = usePathname();
    const router = useRouter();

    const isRestrictedPath = /\/(packages|checkout)(\/|$)/.test(pathname);
    const isVip = packageInfo?.name === 'VIP';

    useEffect(() => {
        if (isLoading) return;
        if (!packageInfo) return;

        if (isVip && isRestrictedPath) {
            router.replace('/employer/dashboard');
        }
    }, [packageInfo, isLoading, isRestrictedPath, isVip, router]);

    const shouldBlock = !isLoading && isVip && isRestrictedPath;

    // 2. แยก UI ของ Loading ออกมาเป็นตัวแปร เพื่อให้โครงสร้าง return ด้านล่างดูง่ายและใส่ Script ครอบได้ทำงานตลอดเวลา
    const renderContent = () => {
        if (isLoading || shouldBlock) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-white" role="status" aria-label="Loading">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#020263]"></div>
                </div>
            );
        }
        return <>{children}</>;
    };

    return (
        <>
            {/* 3. ใส่แท็ก Script ไว้ตรงนี้ เพื่อให้เริ่มโหลดทันทีที่เข้าสู่โซน Employer */}
            <Script
                src="https://cdn.omise.co/omise.js"
                strategy="afterInteractive" // แนะนำให้ใช้ afterInteractive เพื่อความเร็วในการโหลดหน้าแรก
            />

            {/* แสดงผล Content หรือ Loading */}
            {renderContent()}
        </>
    );
}