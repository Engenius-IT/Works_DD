import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    async getPackageStatus(companyId: string) {
        try {
            const now = new Date();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            // 1. ใช้ upsert เพื่อให้มั่นใจว่าจะมีข้อมูลใน DB เสมอ (ถ้าไม่มีให้สร้าง Free Plan)
            let pkg = await this.prisma.companyPackage.upsert({
                where: { companyId },
                update: {}, // ไม่แก้ถ้ามีอยู่แล้ว
                create: {
                    companyId,
                    name: 'Free Plan',
                    type: 'standard',
                    ccQuotaTotal: 3,
                    acQuotaTotal: 1,
                    ccQuotaUsed: 0,
                    acQuotaUsed: 0,
                    startDate: now,
                    // สำหรับ Free Plan อาจจะไม่มีวันหมดอายุ หรือตั้งไว้ไกลๆ
                    endDate: new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
                    lastReset: now,
                },
            });

            // 2. Logic การรีเซ็ตโควตา 24 ชั่วโมง
            // เช็คว่าเวลาปัจจุบัน ห่างจาก lastReset เกิน 24 ชม. หรือยัง
            const lastReset = pkg.lastReset ? new Date(pkg.lastReset).getTime() : 0;
            const isOver24Hours = (now.getTime() - lastReset) >= twentyFourHours;

            if (isOver24Hours) {
                pkg = await this.prisma.companyPackage.update({
                    where: { id: pkg.id },
                    data: {
                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        lastReset: now, // เริ่มนับ 24 ชม. ใหม่
                        updatedAt: now
                    }
                });
                console.log(`[Quota] Daily reset for Company: ${companyId}`);
            }

            // 3. เช็ควันหมดอายุแพ็คเกจ (กรณี Pro/VIP ที่ซื้อไว้หมดเวลา)
            // ถ้าหมดอายุ ให้ปรับกลับมาเป็น Free Plan
            if (pkg.name !== 'Free Plan' && pkg.endDate && now > pkg.endDate) {
                pkg = await this.prisma.companyPackage.update({
                    where: { id: pkg.id },
                    data: {
                        name: 'Free Plan',
                        type: 'standard',
                        ccQuotaTotal: 3,
                        acQuotaTotal: 1,
                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        startDate: now,
                        endDate: new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
                        lastReset: now,
                    }
                });
            }

            return { success: true, data: pkg };
        } catch (error) {
            console.error('Get Status Error:', error);
            throw new InternalServerErrorException('Failed to fetch package status');
        }
    }

    async upgradeCompanyPackage(companyId: string, planName: string) {
        const plan = planName.toLowerCase();
        let config = { name: 'Pro', type: 'pro', price: 39, cc: 15, ac: 8 };

        if (plan.includes('vip')) {
            config = { name: 'VIP', type: 'pro', price: 249, cc: 150, ac: 75 };
        } else if (plan.includes('premium')) {
            config = { name: 'Premium', type: 'pro', price: 99, cc: 50, ac: 25 };
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const now = new Date();
                const pkg = await tx.companyPackage.upsert({
                    where: { companyId },
                    update: {
                        name: config.name,
                        type: config.type,
                        ccQuotaTotal: config.cc,
                        acQuotaTotal: config.ac,
                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        startDate: now,
                        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        lastReset: now, // ซื้อใหม่เริ่มนับรอบ 24 ชม. ใหม่เลย
                        updatedAt: now,
                    },
                    create: {
                        companyId,
                        name: config.name,
                        type: config.type,
                        ccQuotaTotal: config.cc,
                        acQuotaTotal: config.ac,
                        startDate: now,
                        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                        lastReset: now,
                    },
                });

                // บันทึก Transaction และ Spending (เหมือนเดิม)
                await tx.transaction.create({
                    data: {
                        companyId,
                        amount: config.price,
                        packageType: config.name,
                        status: 'COMPLETED',
                    }
                });

                await tx.companySpending.upsert({
                    where: { companyId },
                    update: { totalSpent: { increment: config.price }, updatedAt: now },
                    create: { companyId, totalSpent: config.price }
                });

                return { success: true, data: pkg };
            });
        } catch (error) {
            console.error('Upgrade Error:', error);
            throw new InternalServerErrorException('Failed to upgrade package');
        }
    }

    async MultipleUpgrade(companyId: string, targetPlan: string) {
        const PLAN_CONFIG = {
            'pro': { name: 'Pro', price: 39, cc: 15, ac: 8 },
            'premium': { name: 'Premium', price: 99, cc: 50, ac: 25 },
            'vip': { name: 'VIP', price: 249, cc: 150, ac: 75 }
        };

        const target = targetPlan.toLowerCase();
        const config = PLAN_CONFIG[target];

        return await this.prisma.$transaction(async (tx) => {
            // 1. ดึงข้อมูลแพ็คเกจปัจจุบัน
            const current = await tx.companyPackage.findUnique({ where: { companyId } });

            if (!current) {
                // ถ้าไม่มีแพ็คเกจเก่าเลย ให้รันอัปเกรดปกติ
                return this.upgradeCompanyPackage(companyId, targetPlan);
            }

            // 2. คำนวณระยะเวลาโบนัส (ปัดเศษขึ้นตามที่พี่ต้องการ)
            let bonusDays = 7; // Default 7 วันสำหรับกรณีทั่วไป
            if (current.endDate) {
                const msLeft = current.endDate.getTime() - Date.now();
                const daysLeft = msLeft / (1000 * 60 * 60 * 24);

                if (daysLeft > 0) {
                    // ถ้าเหลือน้อยกว่า 7 วัน ให้เอาค่าที่เหลือมา "ปัดเศษขึ้น" 
                    // เช่น 5 วัน 23 ชม (5.96) -> ปัดเป็น 6
                    // ถ้าเหลือมากกว่า 7 ก็จำกัดแค่ 7 (หรือตามที่พี่ตกลงกับ Business)
                    bonusDays = Math.min(7, Math.ceil(daysLeft));
                }
            }

            const bonusDate = new Date();
            bonusDate.setDate(bonusDate.getDate() + bonusDays);

            const currentType = current.name.toLowerCase();
            const currentConfig = PLAN_CONFIG[currentType] || { cc: 0, ac: 0 };

            const bonusCC = currentConfig.cc; // ดึงค่า Standard ของตัวที่ใช้อยู่ปัจจุบัน
            const bonusAC = currentConfig.ac;

            // 4. อัปเดตแพ็คเกจใหม่
            const pkg = await tx.companyPackage.update({
                where: { companyId },
                data: {
                    name: config.name,
                    // Quota ใหม่ = ค่ามาตรฐานของแพ็คใหม่ + โบนัสจากแพ็คเก่า
                    ccQuotaTotal: config.cc + bonusCC,
                    acQuotaTotal: config.ac + bonusAC,

                    // เก็บข้อมูลโบนัสแยกไว้ เพื่อให้ระบบอื่นรู้ว่าส่วนไหนคือโบนัส
                    bonusQuotaCC: bonusCC,
                    bonusQuotaAC: bonusAC,
                    bonusEndsAt: bonusDate,

                    ccQuotaUsed: 0,
                    acQuotaUsed: 0,
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // แพ็คหลักอยู่ได้ 30 วัน
                    updatedAt: new Date(),
                }
            });

            // 5. บันทึก Transaction & Spending
            await tx.transaction.create({
                data: {
                    companyId,
                    amount: config.price,
                    packageType: config.name,
                    status: 'COMPLETED',
                }
            });

            await tx.companySpending.upsert({
                where: { companyId },
                update: { totalSpent: { increment: config.price }, updatedAt: new Date() },
                create: { companyId, totalSpent: config.price }
            });

            return { success: true, data: pkg };
        });
    }
}