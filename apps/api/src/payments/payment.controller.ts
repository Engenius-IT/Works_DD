import {
    Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Query,
    NotFoundException, InternalServerErrorException
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly prisma: PrismaService
    ) { }

    /**
     * 1. หน้าบ้านเรียกตอนกดปุ่มชำระเงิน
     */
    @Post('create')
    async createPayment(@Body() body: any) {
        const { companyId, planName, amount, method, token, card } = body;
        const creditCardToken = token || card;
        return await this.paymentService.createPayment(companyId, planName, amount, method, creditCardToken);
    }

    /**
     * 2. รับ Webhook จาก Omise (จุดปรับปรุง: เพิ่มความปลอดภัยและการพ่น Log เช็คระบบ)
     */
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() payload: any) {
        try {
            console.log(`📥 Received Webhook Event: ${payload?.key}`);

            // ส่งไปให้ Service ประมวลผลอัปเกรดแพ็กเกจ
            const result = await this.paymentService.handleWebhook(payload);

            // ส่งกลับสถานะสำเร็จให้ Omise รับทราบ จะได้ไม่ยิงซ้ำ
            return { received: true, ...result };
        } catch (error) {
            // ถ้าระบบหลังบ้านทำงานพลาด พ่น Log ออกมาดูทันทีเพื่อเอาไว้ไล่บั๊ก
            console.error('❌ Webhook Processing Error:', error.message);
            // ยังคงต้องตอบกลับ OK (200) เพื่อป้องกันไม่ให้ Omise ยิงกระหน่ำซ้ำ ๆ จนเซิร์ฟเวอร์คราศ
            return { received: true, error: error.message };
        }
    }

    /**
     * 3. เช็คสถานะการชำระเงิน (Polling จากหน้าบ้าน)
     */
    @Get('status/:chargeId')
    async getPaymentStatus(@Param('chargeId') chargeId: string) {
        try {
            const payment = await this.prisma.paymentTransaction.findUnique({
                where: { chargeId: chargeId },
                select: { status: true }
            });

            if (!payment) {
                throw new NotFoundException(`ไม่พบรายการชำระเงินรหัส: ${chargeId}`);
            }

            // ส่งสถานะกลับไป (PENDING หรือ SUCCESS)
            return { status: payment.status };
        } catch (error) {
            console.error('❌ Check Status Error:', error.message);

            // เช็ครหัสสเตตัสเผื่อกรณีรูปแบบ Object เพี้ยน ถ้าเป็น 404 ให้โยนออกไปตรง ๆ เพื่อรักษามาตรฐาน HTTP Status
            if (error instanceof NotFoundException || error.status === 404) {
                throw error;
            }

            // เปลี่ยนจากส่ง Object สเตตัสหลอก ให้โยนเป็นระบบ Internal Server Error 500 แท้ ๆ ไปเลยครับ
            throw new InternalServerErrorException({
                status: 'ERROR',
                message: error.message
            });
        }
    }

    /**
     * 4. ดึงข้อมูลรายการชำระเงินของบริษัท
     */
    @Get('company/:companyId')
    async getCompanyPayments(
        @Param('companyId') companyId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 5;
        return await this.paymentService.getCompanyPayments(companyId, pageNum, limitNum, status);
    }
}