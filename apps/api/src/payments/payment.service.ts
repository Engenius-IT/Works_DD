import {
    Injectable,
    Logger,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PackagesService } from '../packages/packages.service';
import { UploadService } from '../upload/upload.service';
import { buildPromptPayPayload } from './promptpay-qr';
import { SlipVerificationService } from './slip-verification.service';

function normalizeComparable(value: string | null | undefined): string {
    return (value || '')
        .normalize('NFKC')
        .toUpperCase()
        .replace(/[^\p{L}\p{N}]+/gu, '');
}

function matchesProviderTruncatedName(actual: string | null | undefined, expected: string): boolean {
    const actualNormalized = normalizeComparable(actual);
    const expectedNormalized = normalizeComparable(expected);
    if (!actualNormalized || !expectedNormalized) return false;
    if (actualNormalized === expectedNormalized) return true;

    // ธนาคาร/ผู้ให้บริการบางรายส่งชื่อผู้รับกลับมาแบบตัดท้าย
    // อนุญาตเฉพาะกรณีที่ค่าที่ได้เป็น prefix ที่ยาวพอของชื่อเต็มเท่านั้น
    return actualNormalized.length >= 8 && expectedNormalized.startsWith(actualNormalized);
}

function bangkokDateKey(value: Date): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(value);
    const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private readonly qrLifetimeMinutes = 5;

    constructor(
        private prisma: PrismaService,
        private packagesService: PackagesService,
        private uploadService: UploadService,
        private slipVerificationService: SlipVerificationService,
    ) { }

    private async recordPaymentEvent(
        paymentTransactionId: string,
        eventType: string,
        details: {
            status?: string;
            amount?: number;
            message?: string;
            metadata?: Record<string, unknown>;
        } = {},
    ) {
        await this.prisma.paymentTransactionEvent.create({
            data: {
                paymentTransactionId,
                eventType,
                status: details.status,
                amount: details.amount,
                message: details.message,
                metadata: details.metadata as any,
            },
        });
    }

    /** ยกเลิกรายการที่ QR หมดอายุแบบกัน race condition */
    private async cancelExpiredPayment(chargeId: string, now = new Date()) {
        const payment = await this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
        if (!payment || !payment.expiresAt || payment.expiresAt > now) {
            return payment;
        }
        if (!['PENDING', 'SLIP_SUBMITTED'].includes(payment.status)) {
            return payment;
        }

        const cancelled = await this.prisma.paymentTransaction.updateMany({
            where: {
                chargeId,
                status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
                expiresAt: { lte: now },
            },
            data: {
                status: 'CANCELLED',
                cancelledAt: now,
                verificationStatus: 'EXPIRED',
                verificationMessage: `QR หมดอายุหลัง ${this.qrLifetimeMinutes} นาที ระบบยกเลิกคำสั่งซื้อแล้ว`,
                lastCheckedAt: now,
            },
        });

        if (cancelled.count === 1) {
            await this.recordPaymentEvent(payment.id, 'QR_EXPIRED', {
                status: 'CANCELLED',
                amount: payment.amount,
                message: `QR หมดอายุหลัง ${this.qrLifetimeMinutes} นาที ระบบยกเลิกคำสั่งซื้อแล้ว`,
            });
            this.logger.warn(`[PaymentExpiry] chargeId=${chargeId} status=CANCELLED amount=${payment.amount}`);
        }

        return this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
    }

    /** ตรวจ QR ที่หมดอายุทุกนาที แม้ผู้ใช้จะปิดหน้าเว็บไปแล้ว */
    @Cron(CronExpression.EVERY_MINUTE)
    async cancelExpiredPayments() {
        const now = new Date();
        const payments = await this.prisma.paymentTransaction.findMany({
            where: {
                status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
                expiresAt: { lte: now },
            },
            select: { chargeId: true },
        });

        for (const payment of payments) {
            await this.cancelExpiredPayment(payment.chargeId, now);
        }
    }

    /**
     * สร้าง PromptPay QR ด้วยระบบของเราเอง ไม่ผ่าน Payment Gateway
     */
    async createSelfHostedPromptPayPayment(companyId: string, planName: string) {
        if (!companyId) {
            throw new BadRequestException('companyId is required to create a transaction');
        }

        const promptPayId = process.env.PROMPTPAY_ID;
        if (!promptPayId) {
            throw new InternalServerErrorException('ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน API .env');
        }

        const amount = this.packagesService.getPaymentPrice(planName);
        const chargeId = `self_${randomUUID()}`;
        const expiresAt = new Date(Date.now() + this.qrLifetimeMinutes * 60 * 1000);

        let qrPayload: string;
        try {
            qrPayload = buildPromptPayPayload({
                promptPayId,
                amount,
                referenceNo: chargeId,
                merchantName: process.env.PROMPTPAY_MERCHANT_NAME || 'WORKSDD',
                city: process.env.PROMPTPAY_CITY || 'BANGKOK',
            });
        } catch (error) {
            throw new BadRequestException(error instanceof Error ? error.message : 'สร้าง PromptPay QR ไม่สำเร็จ');
        }

        const transaction = await this.prisma.paymentTransaction.create({
            data: {
                chargeId,
                companyId,
                planName,
                amount,
                paymentMethod: 'promptpay_self',
                qrPayload,
                status: 'PENDING',
                verificationStatus: 'NOT_SUBMITTED',
                expiresAt,
            },
        });

        await this.recordPaymentEvent(transaction.id, 'QR_CREATED', {
            status: 'PENDING',
            amount,
            message: `สร้าง PromptPay QR สำเร็จ อายุ ${this.qrLifetimeMinutes} นาที`,
            metadata: { expiresAt: expiresAt.toISOString() },
        });
        this.logger.log(`[PaymentCreated] chargeId=${chargeId} status=PENDING amount=${amount} expiresAt=${expiresAt.toISOString()}`);

        return {
            chargeId,
            paymentMethod: 'promptpay_self',
            status: 'PENDING',
            planName,
            amount,
            qrPayload,
            expiresAt: expiresAt.toISOString(),
            expiresInSeconds: this.qrLifetimeMinutes * 60,
            merchantName: process.env.PROMPTPAY_MERCHANT_NAME || 'WORKSDD',
        };
    }

    /** รับสลิป ตรวจสอบด้วย 1xSlip และเปิดแพ็กเกจอัตโนมัติเมื่อข้อมูลผ่านครบทุกเงื่อนไข */
    async submitSelfHostedSlip(chargeId: string, userId: string, file: Express.Multer.File) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: userId },
            select: { id: true },
        });

        if (!company) {
            throw new NotFoundException('ไม่พบบริษัทของผู้ใช้งาน');
        }

        let transaction = await this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
        if (!transaction) {
            throw new NotFoundException('ไม่พบรายการชำระเงิน');
        }
        if (transaction.companyId !== company.id) {
            throw new ForbiddenException('ไม่มีสิทธิ์ส่งสลิปของรายการนี้');
        }
        transaction = await this.cancelExpiredPayment(chargeId);
        if (!transaction) {
            throw new NotFoundException('ไม่พบรายการชำระเงิน');
        }
        if (transaction.paymentMethod !== 'promptpay_self') {
            throw new BadRequestException('รายการนี้ไม่ได้ใช้ PromptPay แบบระบบภายใน');
        }
        if (transaction.status === 'CANCELLED') {
            throw new BadRequestException('QR หมดอายุแล้ว กรุณาสร้างคำสั่งซื้อใหม่');
        }
        if (transaction.status === 'SUCCESS') {
            throw new BadRequestException('รายการนี้ชำระเงินสำเร็จแล้ว');
        }
        if (!['PENDING', 'SLIP_SUBMITTED'].includes(transaction.status)) {
            throw new BadRequestException('รายการนี้ไม่อยู่ในสถานะที่ส่งสลิปได้');
        }

        if (!this.slipVerificationService.isOneXSlipConfigured()) {
            throw new InternalServerErrorException('ยังไม่ได้ตั้งค่า 1xSlip API Key');
        }

        const providerInspection = await this.slipVerificationService.verifyWithOneXSlip({
            buffer: file.buffer,
            originalname: file.originalname,
            mimetype: file.mimetype,
        });
        const slipSha256 = this.slipVerificationService.getSha256(file.buffer);
        const verifiedAmount = providerInspection?.amount ?? null;
        const verifiedReference = providerInspection?.referenceNo ?? null;
        const verifiedRecipientName = providerInspection?.recipientName ?? null;
        const verifiedTransactionAt = providerInspection?.transactionAt ?? null;
        const duplicate = await this.prisma.paymentTransaction.findFirst({
            where: {
                slipSha256,
                NOT: { chargeId },
            },
            select: { chargeId: true },
        });

        if (duplicate) {
            throw new ConflictException('สลิปนี้ถูกใช้กับรายการอื่นแล้ว');
        }
        if (transaction.slipSha256 === slipSha256) {
            throw new ConflictException('สลิปนี้เคยส่งตรวจสำหรับรายการนี้แล้ว');
        }

        const normalizedReference = verifiedReference
            ? normalizeComparable(verifiedReference)
            : null;
        const duplicateReference = normalizedReference
            ? await this.prisma.paymentTransaction.findFirst({
                where: {
                    slipReference: normalizedReference,
                    NOT: { chargeId },
                },
                select: { chargeId: true },
            })
            : null;

        const upload = await this.uploadService.uploadFile({
            file,
            folder: 'payment-slips',
            prefix: 'slip',
            ownerId: company.id,
        });

        const amountMatches = verifiedAmount !== null
            && Math.abs(verifiedAmount - transaction.amount) < 0.01;
        // 1xSlip เป็นแหล่งตรวจสลิปหลัก และให้รหัสอ้างอิงธุรกรรมจากธนาคาร
        const referenceMatches = providerInspection?.success === true
            && verifiedReference !== null;
        const referenceIsDuplicate = Boolean(duplicateReference);
        const expectedRecipientName = process.env.PROMPTPAY_EXPECTED_NAME
            || process.env.PROMPTPAY_MERCHANT_NAME
            || 'WORKSDD';
        const recipientNameMatches = matchesProviderTruncatedName(verifiedRecipientName, expectedRecipientName);
        const recipientNameMatchMode = normalizeComparable(verifiedRecipientName)
            === normalizeComparable(expectedRecipientName)
            ? 'EXACT'
            : recipientNameMatches
                ? 'PROVIDER_TRUNCATED_PREFIX'
                : 'MISMATCH';
        const dateMatches = verifiedTransactionAt !== null
            && bangkokDateKey(verifiedTransactionAt) === bangkokDateKey(transaction.createdAt)
            && verifiedTransactionAt.getTime() <= Date.now() + 5 * 60 * 1000;

        const verificationChecks = {
            amount: {
                expected: transaction.amount,
                actual: verifiedAmount,
                matches: amountMatches,
            },
            reference: {
                expected: providerInspection ? 'ต้องไม่ซ้ำกับรายการอื่นในระบบ' : transaction.chargeId,
                actual: verifiedReference,
                matches: referenceMatches,
                duplicate: referenceIsDuplicate,
                duplicateChargeId: duplicateReference?.chargeId || null,
            },
            date: {
                expected: transaction.createdAt.toISOString(),
                actual: verifiedTransactionAt?.toISOString() || null,
                matches: dateMatches,
            },
            recipientName: {
                expected: expectedRecipientName,
                actual: verifiedRecipientName,
                matches: recipientNameMatches,
                matchMode: recipientNameMatchMode,
            },
            provider: {
                name: providerInspection?.provider || '1xslip',
                success: providerInspection?.success || false,
                message: providerInspection?.message || null,
                errorCode: providerInspection?.errorCode || null,
            },
        };

        let verificationStatus = 'NEEDS_REVIEW';
        let verificationMessage = 'ระบบยังยืนยันเงินเข้าจริงไม่ได้ ต้องให้แอดมินตรวจสอบ';

        if (providerInspection && !providerInspection.success) {
            verificationStatus = 'PROVIDER_REJECTED';
            verificationMessage = `1xSlip ไม่ยืนยันสลิป: ${providerInspection.message || providerInspection.errorCode || 'ตรวจสอบไม่สำเร็จ'}`;
        } else if (verifiedAmount === null) {
            verificationStatus = 'PROVIDER_REJECTED';
            verificationMessage = '1xSlip ตรวจพบสลิป แต่ไม่พบยอดเงินที่อ่านได้';
        } else if (!amountMatches) {
            verificationStatus = 'AMOUNT_MISMATCH';
            verificationMessage = `ยอดในสลิป ฿${verifiedAmount.toFixed(2)} ไม่ตรงกับรายการ ฿${transaction.amount.toFixed(2)}`;
        } else if (!verifiedReference) {
            verificationStatus = 'REFERENCE_NOT_FOUND';
            verificationMessage = 'ไม่พบรหัสอ้างอิงในสลิป';
        } else if (referenceIsDuplicate) {
            verificationStatus = 'REFERENCE_DUPLICATE';
            verificationMessage = `รหัสอ้างอิงนี้เคยถูกใช้กับรายการ ${duplicateReference?.chargeId} แล้ว`;
        } else if (!referenceMatches) {
            verificationStatus = 'REFERENCE_MISMATCH';
            verificationMessage = `รหัสอ้างอิงในสลิป ${verifiedReference} ไม่ตรงกับรายการ ${transaction.chargeId}`;
        } else if (!verifiedTransactionAt) {
            verificationStatus = 'DATE_NOT_FOUND';
            verificationMessage = 'ไม่พบวันเวลาทำรายการในข้อมูล QR ของสลิป';
        } else if (!dateMatches) {
            verificationStatus = 'DATE_MISMATCH';
            verificationMessage = 'วันเวลาทำรายการในสลิปไม่ตรงกับวันที่สร้างคำสั่งซื้อ';
        } else if (!verifiedRecipientName) {
            verificationStatus = 'RECIPIENT_NAME_NOT_FOUND';
            verificationMessage = 'ไม่พบชื่อผู้รับเงินในข้อมูล QR ของสลิป';
        } else if (!recipientNameMatches) {
            verificationStatus = 'RECIPIENT_NAME_MISMATCH';
            verificationMessage = `ชื่อผู้รับเงินในสลิป ${verifiedRecipientName} ไม่ตรงกับชื่อที่ตั้งไว้ (${expectedRecipientName})`;
        } else {
            verificationStatus = 'VERIFIED_FIELDS';
            verificationMessage = '1xSlip ยืนยันยอดเงิน รหัสอ้างอิง วันเวลา และชื่อผู้รับเงินครบแล้ว ระบบกำลังเปิดแพ็กเกจให้อัตโนมัติ';
        }

        const slipData = {
            slipUrl: upload.url,
            slipSha256,
            slipQrPayload: providerInspection?.qrPayload || null,
            slipAmount: verifiedAmount,
            slipReference: normalizedReference,
            slipRecipientName: verifiedRecipientName,
            slipTransactionAt: verifiedTransactionAt,
            verificationChecks: verificationChecks as any,
            verificationStatus,
            verificationMessage,
        };

        // เมื่อ 1xSlip ผ่านครบทุกช่อง ให้ยึดรายการเป็น APPROVING ก่อน
        // เพื่อป้องกันการอัปเกรดแพ็กเกจซ้ำจากการอัปโหลดพร้อมกันหลายคำขอ
        if (verificationStatus === 'VERIFIED_FIELDS') {
            const claim = await this.prisma.paymentTransaction.updateMany({
                where: {
                    chargeId,
                    paymentMethod: 'promptpay_self',
                    status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
                },
                data: {
                    ...slipData,
                    status: 'APPROVING',
                },
            });

            if (claim.count !== 1) {
                throw new ConflictException('รายการกำลังถูกยืนยันหรือชำระเงินสำเร็จแล้ว');
            }

            const approvingPayment = await this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
            if (!approvingPayment) {
                throw new NotFoundException('ไม่พบรายการชำระเงินหลังตรวจสอบสลิป');
            }

            await this.recordPaymentEvent(approvingPayment.id, 'PAYMENT_AUTO_APPROVING', {
                status: approvingPayment.status,
                amount: approvingPayment.amount,
                message: verificationMessage,
                metadata: { verificationStatus, verificationChecks, source: '1XSLIP' },
            });

            try {
                await this.packagesService.MultipleUpgrade(approvingPayment.companyId, approvingPayment.planName);
                const approvedAt = new Date();
                const updated = await this.prisma.paymentTransaction.update({
                    where: { chargeId },
                    data: {
                        status: 'SUCCESS',
                        verificationStatus: 'APPROVED',
                        verificationMessage: '1xSlip ยืนยันข้อมูลครบแล้ว ระบบเปิดแพ็กเกจให้อัตโนมัติเรียบร้อย',
                        reviewedBy: null,
                        reviewedAt: approvedAt,
                    },
                });

                await this.recordPaymentEvent(updated.id, 'PAYMENT_AUTO_APPROVED', {
                    status: updated.status,
                    amount: updated.amount,
                    message: updated.verificationMessage || undefined,
                    metadata: { verificationStatus: 'APPROVED', verificationChecks, source: '1XSLIP' },
                });
                this.logger.log(`[PaymentCheck] chargeId=${chargeId} provider=${providerInspection?.provider || '1xslip'} status=SUCCESS paymentDetected=true source=AUTO_1XSLIP slipAmount=${verifiedAmount ?? 'unknown'} expectedAmount=${transaction.amount}`);

                return {
                    success: true,
                    chargeId: updated.chargeId,
                    status: updated.status,
                    verificationStatus: updated.verificationStatus,
                    verificationMessage: updated.verificationMessage,
                    amountMatches,
                    verificationChecks,
                    slipUrl: updated.slipUrl,
                };
            } catch (error) {
                await this.prisma.paymentTransaction.updateMany({
                    where: { chargeId, status: 'APPROVING' },
                    data: {
                        status: 'SLIP_SUBMITTED',
                        verificationStatus: 'VERIFIED_FIELDS',
                        verificationMessage: '1xSlip ตรวจสอบผ่านแล้ว แต่เปิดแพ็กเกจอัตโนมัติไม่สำเร็จ กรุณาลองใหม่หรือติดต่อผู้ดูแลระบบ',
                    },
                });
                this.logger.error(`[PaymentCheck] chargeId=${chargeId} auto approval failed`, error instanceof Error ? error.stack : String(error));
                throw error;
            }
        }

        const submitted = await this.prisma.paymentTransaction.updateMany({
            where: {
                chargeId,
                paymentMethod: 'promptpay_self',
                status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
            },
            data: {
                ...slipData,
                status: 'SLIP_SUBMITTED',
            },
        });

        if (submitted.count !== 1) {
            throw new ConflictException('รายการกำลังถูกยืนยันหรือชำระเงินสำเร็จแล้ว');
        }

        const updated = await this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
        if (!updated) {
            throw new NotFoundException('ไม่พบรายการชำระเงินหลังตรวจสอบสลิป');
        }

        await this.recordPaymentEvent(updated.id, 'SLIP_SUBMITTED', {
            status: updated.status,
            amount: updated.amount,
            message: verificationMessage,
            metadata: { verificationStatus, verificationChecks },
        });
        this.logger.log(`[PaymentCheck] chargeId=${chargeId} provider=${providerInspection?.provider || 'local'} status=${updated.status} slipAmount=${verifiedAmount ?? 'unknown'} expectedAmount=${transaction.amount}`);

        return {
            success: true,
            chargeId: updated.chargeId,
            status: updated.status,
            verificationStatus,
            verificationMessage,
            amountMatches,
            verificationChecks,
            slipUrl: updated.slipUrl,
        };
    }

    async getPendingSelfHostedPayments() {
        const payments = await this.prisma.paymentTransaction.findMany({
            where: {
                paymentMethod: 'promptpay_self',
                status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
            },
            orderBy: { createdAt: 'asc' },
        });

        const companyIds = [...new Set(payments.map((payment) => payment.companyId))];
        const companies = await this.prisma.company.findMany({
            where: { id: { in: companyIds } },
            select: {
                id: true,
                name: true,
                owner: { select: { email: true, firstName: true, lastName: true } },
            },
        });
        const companyMap = new Map(companies.map((company) => [company.id, company]));

        return payments.map((payment) => ({
            ...payment,
            company: companyMap.get(payment.companyId) || null,
        }));
    }

    /** ข้อมูลสำหรับหน้า Live Payment Monitor โดยจำกัดรายการตามบริษัทเมื่อเป็นผู้ประกอบการ */
    async getLiveSelfHostedPayments(companyId?: string) {
        await this.cancelExpiredPayments();

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const payments = await this.prisma.paymentTransaction.findMany({
            where: {
                paymentMethod: 'promptpay_self',
                createdAt: { gte: since },
                ...(companyId ? { companyId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        const companyIds = [...new Set(payments.map((payment) => payment.companyId))];
        const companies = await this.prisma.company.findMany({
            where: { id: { in: companyIds } },
            select: {
                id: true,
                name: true,
                owner: { select: { email: true, firstName: true, lastName: true } },
            },
        });
        const companyMap = new Map(companies.map((company) => [company.id, company]));
        const paymentIds = payments.map((payment) => payment.id);
        const events = paymentIds.length === 0
            ? []
            : await this.prisma.paymentTransactionEvent.findMany({
                where: { paymentTransactionId: { in: paymentIds } },
                orderBy: { createdAt: 'desc' },
                take: 500,
            });
        const eventsByPayment = new Map<string, typeof events>();
        for (const event of events) {
            const existing = eventsByPayment.get(event.paymentTransactionId) || [];
            if (existing.length < 20) existing.push(event);
            eventsByPayment.set(event.paymentTransactionId, existing);
        }

        return payments.map((payment) => {
            const paymentDetected = payment.status === 'SUCCESS';
            return {
                chargeId: payment.chargeId,
                planName: payment.planName,
                amount: payment.amount,
                status: payment.status,
                verificationStatus: payment.verificationStatus,
                verificationMessage: payment.verificationMessage,
                slipAmount: payment.slipAmount,
                slipReference: payment.slipReference,
                slipRecipientName: payment.slipRecipientName,
                slipTransactionAt: payment.slipTransactionAt,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt,
                expiresAt: payment.expiresAt,
                cancelledAt: payment.cancelledAt,
                company: companyMap.get(payment.companyId) || null,
                scanDetected: false,
                scanStatus: 'UNKNOWN_NO_BANK_API',
                paymentDetected,
                paymentDetectionSource: paymentDetected
                    ? (payment.verificationStatus === 'APPROVED' ? 'AUTO_1XSLIP' : 'ADMIN_APPROVAL')
                    : 'NO_BANK_API',
                moneyReceivedAmount: paymentDetected ? payment.amount : null,
                events: eventsByPayment.get(payment.id) || [],
            };
        });
    }

    async approveSelfHostedPayment(chargeId: string, adminId: string) {
        const payment = await this.cancelExpiredPayment(chargeId);
        if (!payment || payment.paymentMethod !== 'promptpay_self') {
            throw new NotFoundException('ไม่พบรายการ PromptPay ภายในระบบ');
        }
        if (payment.status === 'CANCELLED') {
            throw new BadRequestException('QR หมดอายุแล้ว ไม่สามารถอนุมัติรายการนี้ได้');
        }
        if (payment.status === 'SUCCESS') {
            return { success: true, message: 'รายการนี้อนุมัติไปแล้ว' };
        }
        if (!payment.slipUrl) {
            throw new BadRequestException('รายการนี้ยังไม่มีสลิป');
        }

        const claim = await this.prisma.paymentTransaction.updateMany({
            where: {
                chargeId,
                paymentMethod: 'promptpay_self',
                status: { in: ['PENDING', 'SLIP_SUBMITTED'] },
            },
            data: { status: 'APPROVING' },
        });

        if (claim.count !== 1) {
            throw new ConflictException('รายการกำลังถูกดำเนินการหรืออนุมัติไปแล้ว');
        }

        try {
            await this.packagesService.MultipleUpgrade(payment.companyId, payment.planName);
            const updated = await this.prisma.paymentTransaction.update({
                where: { chargeId },
                data: {
                    status: 'SUCCESS',
                    verificationStatus: 'APPROVED',
                    verificationMessage: 'แอดมินยืนยันยอดเงินแล้ว',
                    reviewedBy: adminId,
                    reviewedAt: new Date(),
                },
            });

            await this.recordPaymentEvent(updated.id, 'PAYMENT_APPROVED', {
                status: updated.status,
                amount: updated.amount,
                message: 'แอดมินยืนยันยอดเงินแล้ว เงินเข้าตามการตรวจสอบของแอดมิน',
                metadata: { reviewedBy: adminId },
            });
            this.logger.log(`[PaymentCheck] chargeId=${chargeId} paymentDetected=true status=SUCCESS source=ADMIN_APPROVAL`);

            return { success: true, status: updated.status };
        } catch (error) {
            await this.prisma.paymentTransaction.update({
                where: { chargeId },
                data: { status: 'SLIP_SUBMITTED' },
            });
            throw error;
        }
    }

    async rejectSelfHostedPayment(chargeId: string, adminId: string, reason?: string) {
        const payment = await this.cancelExpiredPayment(chargeId);
        if (!payment || payment.paymentMethod !== 'promptpay_self') {
            throw new NotFoundException('ไม่พบรายการ PromptPay ภายในระบบ');
        }
        if (payment.status === 'SUCCESS') {
            throw new BadRequestException('รายการที่สำเร็จแล้วไม่สามารถปฏิเสธได้');
        }
        if (payment.status === 'CANCELLED') {
            throw new BadRequestException('QR หมดอายุและถูกยกเลิกไปแล้ว');
        }

        const updated = await this.prisma.paymentTransaction.update({
            where: { chargeId },
            data: {
                status: 'FAILED',
                verificationStatus: 'REJECTED',
                verificationMessage: reason || 'แอดมินปฏิเสธรายการ',
                reviewedBy: adminId,
                reviewedAt: new Date(),
            },
        });

        await this.recordPaymentEvent(updated.id, 'PAYMENT_REJECTED', {
            status: updated.status,
            amount: updated.amount,
            message: reason || 'แอดมินปฏิเสธรายการ',
            metadata: { reviewedBy: adminId },
        });
        this.logger.warn(`[PaymentCheck] chargeId=${chargeId} paymentDetected=false status=FAILED source=ADMIN_REJECTION`);

        return { success: true, status: updated.status };
    }

    /**
     * ตรวจสถานะสำหรับหน้า checkout และบันทึก log เป็นระยะ ๆ
     * รายการที่ 1xSlip ตรวจสอบข้อมูลครบจะถูกเปิดแพ็กเกจอัตโนมัติ
     */
    async getSelfHostedPaymentStatus(chargeId: string) {
        const payment = await this.cancelExpiredPayment(chargeId);
        if (!payment) {
            throw new NotFoundException(`ไม่พบรายการชำระเงินรหัส: ${chargeId}`);
        }

        const now = new Date();
        const shouldLogCheck = payment.status === 'PENDING'
            || payment.status === 'SLIP_SUBMITTED';
        const lastCheckedAt = payment.lastCheckedAt?.getTime() || 0;
        const shouldPersistCheck = shouldLogCheck && now.getTime() - lastCheckedAt >= 30_000;
        const effectiveLastCheckedAt = shouldPersistCheck ? now : payment.lastCheckedAt;

        if (shouldPersistCheck) {
            const updated = await this.prisma.paymentTransaction.update({
                where: { id: payment.id },
                data: { lastCheckedAt: now },
            });
            await this.recordPaymentEvent(updated.id, 'STATUS_CHECK', {
                status: updated.status,
                amount: updated.amount,
                message: 'ตรวจสอบสถานะ QR แล้ว แต่ยังไม่มีการเชื่อมต่อธนาคารเพื่อยืนยันเงินเข้าอัตโนมัติ',
                metadata: { paymentDetected: false, checkedAt: now.toISOString() },
            });
        }

        const paymentDetected = payment.status === 'SUCCESS';
        this.logger.log(`[PaymentCheck] chargeId=${chargeId} status=${payment.status} paymentDetected=${paymentDetected} expiresAt=${payment.expiresAt?.toISOString() || 'none'}`);

        return {
            status: payment.status,
            amount: payment.amount,
            expiresAt: payment.expiresAt?.toISOString() || null,
            cancelledAt: payment.cancelledAt?.toISOString() || null,
            paymentDetected,
            detectionSource: paymentDetected
                ? (payment.verificationStatus === 'APPROVED' ? 'AUTO_1XSLIP' : 'ADMIN_APPROVAL')
                : 'NO_BANK_API',
            bankApiConnected: false,
            lastCheckedAt: effectiveLastCheckedAt?.toISOString() || null,
        };
    }

    async getSelfHostedPaymentLogs(chargeId: string) {
        const payment = await this.prisma.paymentTransaction.findUnique({ where: { chargeId } });
        if (!payment) {
            throw new NotFoundException(`ไม่พบรายการชำระเงินรหัส: ${chargeId}`);
        }

        return this.prisma.paymentTransactionEvent.findMany({
            where: { paymentTransactionId: payment.id },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
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
                whereClause.status = { in: ['PENDING', 'SLIP_SUBMITTED', 'APPROVING'] };
            } else if (status === 'Failed') {
                whereClause.status = { in: ['FAILED', 'CANCELLED'] };
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
