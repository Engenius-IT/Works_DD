import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PackagesCronService {
    constructor(private prisma: PrismaService) { }
    private readonly logger = new Logger(PackagesCronService.name);

    @Cron(CronExpression.EVERY_HOUR) // รันทุกๆ 1 ชั่วโมง
    async handleBonusExpiration() {
        const now = new Date();
        this.logger.log('Starting bonus expiration check...');

        // หาคนที่โบนัสหมดอายุ (bonusEndsAt < ตอนนี้) และยังมีค่าโบนัสค้างอยู่ (> 0)
        const expired = await this.prisma.companyPackage.findMany({
            where: {
                bonusEndsAt: { lt: now },
                OR: [
                    { bonusQuotaCC: { gt: 0 } },
                    { bonusQuotaAC: { gt: 0 } }
                ]
            }
        });

        for (const pkg of expired) {
            // 1. คำนวณหาว่าต้องหัก Used ออกเท่าไหร่ 
            // (หักออกเท่ากับจำนวนโบนัสที่คืนระบบไป)
            const reclaimCC = pkg.bonusQuotaCC;
            const reclaimAC = pkg.bonusQuotaAC;

            await this.prisma.companyPackage.update({
                where: { id: pkg.id },
                data: {
                    // ลดเพดานลง (ตามเดิม)
                    ccQuotaTotal: { decrement: reclaimCC },
                    acQuotaTotal: { decrement: reclaimAC },

                    // --- ส่วนที่เพิ่มเข้ามาเพื่อให้ยอดเหลือเท่าเดิม ---
                    // ลดจำนวนที่ใช้ไปแล้วลงด้วย ตามโบนัสที่หายไป
                    ccQuotaUsed: {
                        decrement: pkg.ccQuotaUsed >= reclaimCC ? reclaimCC : pkg.ccQuotaUsed
                    },
                    acQuotaUsed: {
                        decrement: pkg.acQuotaUsed >= reclaimAC ? reclaimAC : pkg.acQuotaUsed
                    },
                    // ------------------------------------------

                    bonusQuotaCC: 0,
                    bonusQuotaAC: 0,
                    bonusEndsAt: null
                }
            });
        }
    }
}