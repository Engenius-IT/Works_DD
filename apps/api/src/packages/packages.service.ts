import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesService {
    constructor(private prisma: PrismaService) { }

    async getPackageStatus(companyId: string) {
        try {
            const now = new Date();
            const twentyFourHours = 24 * 60 * 60 * 1000;

            // 1. ใช้ upsert เพื่อให้มั่นใจว่าจะมีข้อมูลใน DB เสมอ
            let pkg = await this.prisma.companyPackage.upsert({
                where: { companyId },
                update: {},
                create: {
                    companyId,
                    name: 'Free Plan',
                    type: 'standard',
                    ccQuotaTotal: 3,
                    acQuotaTotal: 1,
                    ccQuotaUsed: 0,
                    acQuotaUsed: 0,
                    startDate: now,
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
                        lastReset: now,
                        updatedAt: now
                    }
                });
                console.log(`[Quota] Daily reset for Company: ${companyId}`);
            }

            // 3. เช็ควันหมดอายุแพ็คเกจ ปรับกลับมาเป็น Free Plan
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
     * Helper ฟังก์ชันสำหรับดึง Configuration ของแพ็กเกจ
     * ✨ Pro = 10 AC, Premium = 10 AC, VIP = 10 AC
     */
    private getPlanConfig(planName: string) {
        const target = planName.toLowerCase();

        if (target.includes('vip')) {
            return {
                name: 'VIP',
                type: 'pro',
                price: 15990,
                cc: 200,
                ac: 10,
                durationDays: 365
            };
        } else if (target.includes('premium')) {
            return {
                name: 'Premium',
                type: 'pro',
                price: 5990,
                cc: 150,
                ac: 10,
                durationDays: 90
            };
        } else if (target.includes('pro')) {
            return {
                name: 'Pro',
                type: 'pro',
                price: 2990,
                cc: 100,
                ac: 10,
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
                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + config.durationDays);

                const pkg = await tx.companyPackage.upsert({
                    where: { companyId },
                    update: {
                        name: config.name,
                        type: config.type,
                        ccQuotaTotal: config.cc,
                        acQuotaTotal: config.ac, // 🟢 การันตีทับด้วยยอดใหม่ในเครื่องทันที!
                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        startDate: now,
                        endDate: expireDate,
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
                const current = await tx.companyPackage.findUnique({ where: { companyId } });

                if (!current || current.name === 'Free Plan') {
                    // หากยังไม่มีแพ็กเกจเดิม ให้ทำการอัปเกรดแบบปกติผ่านระดับ tx เดียวกัน
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
                            endDate: expireDate,
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
                        }
                    });

                    // บันทึกเงินลง Transaction & Spending
                    await tx.transaction.create({
                        data: { companyId, amount: config.price, packageType: config.name, status: 'COMPLETED' }
                    });
                    await tx.companySpending.upsert({
                        where: { companyId },
                        update: { totalSpent: { increment: config.price }, updatedAt: now },
                        create: { companyId, totalSpent: config.price }
                    });

                    return { success: true, data: pkg };
                }

                // 2. คำนวณระยะเวลาโบนัส (กรณีแพ็กเกจเดิมยังไม่หมดอายุจริง)
                let bonusDays = 0;
                if (current.endDate && current.endDate > now) {
                    const currentType = current.name.toLowerCase();
                    if (currentType.includes('pro')) bonusDays = 7;
                    else if (currentType.includes('premium')) bonusDays = 30;
                    else if (currentType.includes('vip')) bonusDays = 60;
                }

                const bonusDate = new Date();
                bonusDate.setDate(bonusDate.getDate() + bonusDays);

                const expireDate = new Date();
                expireDate.setDate(expireDate.getDate() + config.durationDays);

                // 🟢 ปรับลอจิกโบนัสใหม่: ดึงยอดมาตรฐานจากไฟล์ config เสมอ ป้องกันสารตกค้างเลข 50 เดิมใน DB
                let bonusCC = 0;
                let bonusAC = 0;
                try {
                    const currentConfig = this.getPlanConfig(current.name);
                    bonusCC = currentConfig.cc;
                    bonusAC = currentConfig.ac;
                } catch (e) {
                    // ถ้าหา config เก่าไม่เจอจริง ๆ ให้ fallback เป็น 0 แทนการหยิบเลข 50,75 ตัวปัญหามาใช้
                    bonusCC = 0;
                    bonusAC = 0;
                }

                // 4. อัปเดตแพ็คเกจลงฐานข้อมูลจริง
                const pkg = await tx.companyPackage.update({
                    where: { companyId },
                    data: {
                        name: config.name,
                        type: config.type,
                        ccQuotaTotal: config.cc + bonusCC,
                        acQuotaTotal: config.ac + bonusAC, // 🟢 ยอดรวมที่ถูกต้องตามคอนฟิกใหม่!

                        bonusQuotaCC: bonusCC,
                        bonusQuotaAC: bonusAC,
                        bonusEndsAt: bonusDays > 0 ? bonusDate : null,

                        ccQuotaUsed: 0,
                        acQuotaUsed: 0,
                        startDate: now,
                        endDate: expireDate,
                        lastReset: now,
                        updatedAt: now,
                    }
                });

                // 5. บันทึกเงินลง Transaction & Spending
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