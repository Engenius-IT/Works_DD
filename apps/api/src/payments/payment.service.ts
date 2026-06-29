import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import Omise from 'omise';

@Injectable()
export class PaymentService {
    private omise: any;

    constructor(
        private prisma: PrismaService,
        private packagesService: PackagesService,
    ) {
        this.omise = Omise({
            publicKey: process.env.OMISE_PUBLIC_KEY,
            secretKey: process.env.OMISE_SECRET_KEY,
        });
    }

    /**
     * สร้างรายการชำระเงินรองรับทั้ง PromptPay และ Mobile Banking
     */
    async createPayment(
        companyId: string,
        planName: string,
        amount: number,
        method: string = 'promptpay',
        token?: string
    ) {
        if (!companyId) {
            throw new BadRequestException('companyId is required to create a transaction');
        }

        try {

            const frontendUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

            // 🟢 2. แยก Payload ของ Omise ออกมาจัดการตามประเภทวิธีชำระเงิน
            const omisePayload: any = {
                amount: Math.round(amount * 100), // ใช้ Math.round ป้องกันปัญหาทศนิยมเอ๋อใน JavaScript
                currency: 'thb',
                return_uri: `${frontendUrl}/th/employer/status`,
            };

            if (method === 'credit_card' || token) {
                // 💳 เคสบัตรเครดิต: ใช้คีย์ card และห้ามส่ง source
                omisePayload.card = token;
            } else if (method === 'promptpay') {
                // 📲 เคส PromptPay
                omisePayload.source = { type: 'promptpay' };
            } else {
                // 🏦 เคส Mobile Banking ธนาคารต่างๆ
                omisePayload.source = { type: `mobile_banking_${method}` };
            }

            // 🟢 3. ยิงสั่ง Charge เงินกับ Omise ด้วย Payload ที่จัดเรียงถูกต้องแล้ว
            const charge = await this.omise.charges.create(omisePayload);

            // 3. บันทึกลงฐานข้อมูล PaymentTransaction
            await this.prisma.paymentTransaction.create({
                data: {
                    chargeId: charge.id,
                    companyId: companyId,
                    amount: amount,
                    planName: planName,
                    // บัตรเครดิตถ้าตัดผ่านทันทีสถานะจะเป็น 'successful' เลย แต่ถ้าติด 3D Secure จะเป็น 'pending'
                    status: charge.status === 'successful' ? 'SUCCESS' : 'PENDING',
                },
            });

            // 🟢 4. ถ้าตัดบัตรเครดิตผ่านฉลุยแบบไม่มี 3D Secure (ไม่ต้องสแกนนิ้ว/กรอก OTP) ให้ปรับแพ็กเกจทันที
            if (method === 'credit_card' && charge.status === 'successful') {
                await this.packagesService.MultipleUpgrade(companyId, planName);
            }

            // 4. สกัดหาลิงก์ภาพ QR Code ของ PromptPay อย่างละเอียด
            const qrImageUrl =
                charge.source?.scannable_code?.image?.download_uri ||
                charge.source?.references?.barcode ||
                null;

            // ส่งค่ากลับให้ Frontend
            return {
                chargeId: charge.id,
                paymentMethod: method,
                status: charge.status, // ส่งสเตตัสกลับไปให้หน้าบ้านเช็คด้วย
                qrImageUrl: qrImageUrl,
                authorizeUri: charge.authorize_uri || null, // ลิงก์สำหรับ Mobile Banking หรือ 3D Secure ของบัตรเครดิต
            };

        } catch (error) {
            console.error('Omise Create Charge Error:', error);
            const errorMsg = method === 'promptpay' ? 'ไม่สามารถสร้าง QR Code ได้' : 'ไม่สามารถเชื่อมต่อแอปธนาคารได้';
            throw new InternalServerErrorException(errorMsg);
        }
    }

    /**
     * จัดการ Webhook เมื่อการจ่ายเงินสำเร็จ
     */
    async handleWebhook(payload: any) {
        // ตรวจสอบโครงสร้าง Event จาก Omise อย่างรอบคอบ
        if (payload.key === 'charge.complete' && payload.data?.status === 'successful') {
            const chargeId = payload.data.id;

            return await this.prisma.$transaction(async (tx) => {
                const transaction = await tx.paymentTransaction.findUnique({
                    where: { chargeId },
                });

                // ตรวจสอบว่ามีรายการจริง และยังไม่ได้ถูกรันสถานะมาก่อน
                if (transaction && transaction.status === 'PENDING') {

                    // 1. อัปเกรดแพ็กเกจ (ผ่านสิทธิ์ 'tx' เพื่อให้อยู่ใน Transaction ขดลวดเดียวกัน)
                    // 💡 หมายเหตุ: ฟังก์ชัน MultipleUpgrade ใน PackagesService ของคุณ ต้องปรับเพิ่มให้รับพารามิเตอร์ tx ตัวนี้ด้วยนะครับ
                    await this.packagesService.MultipleUpgrade(
                        transaction.companyId,
                        transaction.planName,
                    );

                    // 2. อัปเดตสถานะบิลเป็น SUCCESS
                    await tx.paymentTransaction.update({
                        where: { chargeId },
                        data: { status: 'SUCCESS' },
                    });

                    console.log(`✅ Payment SUCCESS: Charge ID ${chargeId} | Plan: ${transaction.planName}`);
                    return { success: true };
                }
                return { success: false, message: 'Already processed or not found' };
            });
        }
        return { success: false, message: 'Ignored event' };
    }

    /**
     * ดึงข้อมูลรายการชำระเงินของบริษัท พร้อมระบบแบ่งหน้าและฟิลเตอร์
     */
    async getCompanyPayments(companyId: string, page: number = 1, limit: number = 5, status?: string) {
        if (!companyId) {
            throw new BadRequestException('companyId is required');
        }

        const skip = (page - 1) * limit;
        const take = limit;

        const whereClause: any = { companyId };
        if (status && status !== 'All') {
            if (status === 'Paid') {
                whereClause.status = 'SUCCESS';
            } else if (status === 'Pending') {
                whereClause.status = 'PENDING';
            } else if (status === 'Failed') {
                whereClause.status = 'FAILED';
            }
        }

        const [items, total] = await Promise.all([
            this.prisma.paymentTransaction.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.paymentTransaction.count({
                where: whereClause,
            }),
        ]);

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}