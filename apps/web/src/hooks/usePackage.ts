import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export function usePackage() {
    const [packageInfo, setPackageInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    const fetchPackage = useCallback(async () => {
        if (!user) {
            setPackageInfo(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // 1. ดึง Token และข้อมูลจาก localStorage
            const token = localStorage.getItem('accessToken');

            // ดึงข้อมูลบริษัท (ควรใช้ API /companies/mine ตามหน้า Checkout จะชัวร์กว่าเลข 1 ครับ)
            const companyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const companyId = user.companyId || companyRes.data.id;
            if (!companyId) throw new Error("Company ID not found");

            // 2. เรียกไปที่ URL ตามโครงสร้าง ENV (จะกลายเป็น /api/v1/packages/status/...)
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/packages/status/${companyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. สำคัญ!! หลังบ้านพี่ส่ง { success: true, data: pkg } 
            // ต้องเข้าถึง .data.data (data แรกของ axios, data ที่สองของ NestJS)
            if (res.data.success) {
                setPackageInfo(res.data.data);
            }

        } catch (error) {
            // A missing company/package is a valid state for a new employer.
            // Treat auth/not-found responses as Free Plan instead of surfacing
            // a noisy Axios error in the browser console.
            const status = axios.isAxiosError(error) ? error.response?.status : undefined;
            if (status !== 401 && status !== 403 && status !== 404) {
                console.error("Fetch Package Error:", error);
            }
            // ถ้า Error ให้ set เป็น null เพื่อให้หน้า Packages แสดงเป็น Free Plan (Tier 0)
            setPackageInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        fetchPackage();
    }, [authLoading, fetchPackage]);

    return { packageInfo, isLoading, refresh: fetchPackage };
}
