import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
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
                    // สำหรับ Free Plan ตั้งหมดอายุไว้ไกลๆ 100 ปี
                    endDate: new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000),
                    lastReset: now,
                },
            });

            // 2. Logic การรีเซ็ตโควตาประจำวัน (24 ชั่วโมง)
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

            // 3. เช็ควันหมดอายุแพ็คเกจ (กรณี Pro/Premium/VIP ที่ซื้อไว้หมดเวลา)
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

    /**
     * Helper ฟังก์ชันสำหรับดึง Configuration ของแพ็กเกจตามเงื่อนไขใหม่
     * ✨ 299 บาท = 1 เดือน (30 วัน)
     * ✨ 599 บาท = 3 เดือน (90 วัน)
     * ✨ 1599 บาท = 1 ปี (365 วัน)
     */
    private getPlanConfig(planName: string) {
        const target = planName.toLowerCase();
        // ❌ ลบ const now = new Date(); ออกจากตรงนี้แล้วครับ เพราะไม่ได้ใช้

        if (target.includes('vip')) {
            // VIP: 1599 บาท / 1 ปี (365 วัน)
            return {
                name: 'VIP',
                type: 'pro',
                price: 1599,
                cc: 200,
                ac: 100,
                durationDays: 365
            };
        } else if (target.includes('premium')) {
            // Premium: 599 บาท / 3 เดือน (90 วัน)
            return {
                name: 'Premium',
                type: 'pro',
                price: 599,
                cc: 150,
                ac: 75,
                durationDays: 90
            };
        } else if (target.includes('pro')) {
            // Pro: 299 บาท / 1 เดือน (30 วัน)
            return {
                name: 'Pro',
                type: 'pro',
                price: 299,
                cc: 100,
                ac: 50,
                durationDays: 30
            };
        }

        throw new BadRequestException('Invalid plan name configuration');
    }

    async upgradeCompanyPackage(companyId: string, planName: string) {
        const config = this.getPlanConfig(planName);

        try {
            return await this.prisma.$transaction(async (tx) => {
                const now = new Date();
                // คำนวณวันหมดอายุตาม durationDays ของแต่ละแพ็กเกจ
                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + config.durationDays);

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
                        endDate: expireDate, // 30, 90, หรือ 365 วัน ตามแพ็กเกจ
                        lastReset: now,
                        updatedAt: now,
                    },
                    create: {
                        companyId,
                        name: config.name,
                        type: config.type,
                        ccQuotaTotal: config.cc,
                        acQuotaTotal: config.ac,
                        startDate: now,
                        endDate: expireDate,
                        lastReset: now,
                    },
                });

                // บันทึก Transaction และ Spending
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
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Failed to upgrade package');
        }
    }

    async MultipleUpgrade(companyId: string, targetPlan: string) {
        try {
            const config = this.getPlanConfig(targetPlan);

            return await this.prisma.$transaction(async (tx) => {
                const now = new Date();

                // 1. ดึงข้อมูลแพ็คเกจปัจจุบันมาตรวจสอบสถานะและวันหมดอายุ
                const current = await tx.companyPackage.findUnique({ where: { companyId } });

                if (!current || current.name === 'Free Plan') {
                    // ถ้าไม่มีแพ็คเกจเก่าเลย หรือเป็นแค่ Free Plan ให้รันอัปเกรดแบบปกติทั่วไป (ไม่แจกโบนัส)
                    return this.upgradeCompanyPackage(companyId, targetPlan);
                }

                // 2. ⚡ คำนวณระยะเวลาโบนัสตามเงื่อนไขใหม่ (ตรวจสอบว่าแพ็กเกจเดิมยังไม่หมดอายุ)
                let bonusDays = 0;
                if (current.endDate && current.endDate > now) {
                    const currentType = current.name.toLowerCase();

                    if (currentType.includes('pro')) {
                        bonusDays = 7; // อัปจาก 1 เดือน บวก 7 วัน
                    } else if (currentType.includes('premium')) {
                        bonusDays = 30; // อัปจาก 3 เดือน บวก 1 เดือน (30 วัน)
                    } else if (currentType.includes('vip')) {
                        bonusDays = 60; // อัปจาก 1 ปี เผื่อโบนัสให้ 60 วัน (ปรับแก้เลขตามชอบได้ครับ)
                    }
                }

                // 3. กำหนดวันหมดอายุโบนัส และวันหมดอายุของแพ็กเกจใหม่
                const bonusDate = new Date();
                bonusDate.setDate(bonusDate.getDate() + bonusDays);

                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + config.durationDays);

                // ดึงข้อมูลโควตามาตรฐานของแพ็กเก่ามาเป็นโบนัสทบให้ลูกค้า
                let currentConfig = { cc: 0, ac: 0 };
                try {
                    currentConfig = this.getPlanConfig(current.name);
                } catch (e) {
                    currentConfig = { cc: current.ccQuotaTotal, ac: current.acQuotaTotal };
                }

                const bonusCC = currentConfig.cc;
                const bonusAC = currentConfig.ac;

                // 4. อัปเดตแพ็คเกจใหม่ลงฐานข้อมูล
                const pkg = await tx.companyPackage.update({
                    where: { companyId },
                    data: {
                        name: config.name,
                        type: config.type,
                        // Quota ใหม่ = ค่ามาตรฐานของแพ็กใหม่ + โบนัสทบจากแพ็กเก่า
                        ccQuotaTotal: config.cc + bonusCC,
                        acQuotaTotal: config.ac + bonusAC,

                        // เก็บ log ข้อมูลโบนัสแยกไว้ใน Record เพื่อความโปร่งใสในการตรวจสอบ
                        bonusQuotaCC: bonusCC,
                        bonusQuotaAC: bonusAC,
                        bonusEndsAt: bonusDays > 0 ? bonusDate : null,

                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        startDate: now,
                        endDate: expireDate, // สิ้นสุดตามระยะเวลาแพ็กเกจใหม่ (30 / 90 / 365 วัน)
                        lastReset: now,     // รีเซ็ตรอบ 24 ชั่วโมงให้ใหม่ทันที
                        updatedAt: now,
                    }
                });

                // 5. บันทึกเงินลง Transaction & Spending ล็อกยอดรายได้
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
            console.error('Multiple Upgrade Error:', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Failed to process multiple upgrade package');
        }
    }
}