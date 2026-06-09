import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // แนะนำให้ใช้ axios เพราะพี่ตั้งค่า NEXT_PUBLIC_API_URL ไว้แล้ว

export function usePackage() {
    const [packageInfo, setPackageInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPackage = useCallback(async () => {
        try {
            setIsLoading(true);

            // 1. ดึง Token และข้อมูลจาก localStorage
            const token = localStorage.getItem('accessToken');

            // ดึงข้อมูลบริษัท (ควรใช้ API /companies/mine ตามหน้า Checkout จะชัวร์กว่าเลข 1 ครับ)
            const companyRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/companies/mine`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const companyId = companyRes.data.id;
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
            console.error("Fetch Package Error:", error);
            // ถ้า Error ให้ set เป็น null เพื่อให้หน้า Packages แสดงเป็น Free Plan (Tier 0)
            setPackageInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPackage();
    }, [fetchPackage]);

    return { packageInfo, isLoading, refresh: fetchPackage };
}