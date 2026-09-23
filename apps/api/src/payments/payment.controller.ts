import {
    Controller, Post, Body, Get, Param, Query,
    NotFoundException, InternalServerErrorException, Request, UseGuards,
    UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly prisma: PrismaService
    ) { }

    @Post('self/create')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'สร้าง PromptPay QR แบบไม่ผ่าน Payment Gateway' })
    async createSelfHostedPayment(@Body() body: { planName: string }, @Request() req: any) {
        const company = await this.prisma.company.findFirst({
            where: { ownerId: req.user.id },
            select: { id: true },
        });

        if (!company) {
            throw new NotFoundException('ไม่พบบริษัทของผู้ใช้งาน');
        }

        return this.paymentService.createSelfHostedPromptPayPayment(company.id, body.planName);
    }

    @Post('self/:chargeId/slip')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'อัปโหลดสลิปเพื่อตรวจสอบด้วย 1xSlip และเปิดแพ็กเกจอัตโนมัติเมื่อผ่าน' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 },
            fileFilter: (
                _req: Express.Request,
                file: Express.Multer.File,
                cb: (error: Error | null, acceptFile: boolean) => void,
            ) => {
                const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowed.includes(file.mimetype)) {
                    return cb(new BadRequestException('รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น'), false);
                }
                cb(null, true);
            },
        }),
    )
    async submitSelfHostedSlip(
        @Param('chargeId') chargeId: string,
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) {
            throw new BadRequestException('กรุณาแนบรูปสลิป');
        }

        return this.paymentService.submitSelfHostedSlip(charIdOrThrow(chargeId), req.user.id, file);
    }

    @Get('admin/self/pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'รายการ PromptPay ที่ยังไม่ผ่านการตรวจสอบอัตโนมัติ' })
    async getPendingSelfHostedPayments() {
        return this.paymentService.getPendingSelfHostedPayments();
    }

    @Get('admin/self/live')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ข้อมูล Live Monitor ของ PromptPay ใน 24 ชั่วโมงล่าสุด' })
    async getLiveSelfHostedPayments() {
        return this.paymentService.getLiveSelfHostedPayments();
    }

    @Get('self/live')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ข้อมูล Live Monitor ของ PromptPay ของบริษัทตัวเอง' })
    async getCompanyLiveSelfHostedPayments(@Request() req: any) {
        if (req.user.role === UserRole.ADMIN) {
            return this.paymentService.getLiveSelfHostedPayments();
        }

        const company = await this.prisma.company.findFirst({
            where: { ownerId: req.user.id },
            select: { id: true },
        });

        if (!company) {
            throw new NotFoundException('ไม่พบบริษัทของผู้ใช้งาน');
        }

        return this.paymentService.getLiveSelfHostedPayments(company.id);
    }

    @Post('admin/self/:chargeId/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'อนุมัติรายการ PromptPay หลังตรวจยอดเงินแล้ว' })
    async approveSelfHostedPayment(@Param('chargeId') chargeId: string, @Request() req: any) {
        return this.paymentService.approveSelfHostedPayment(charIdOrThrow(chargeId), req.user.id);
    }

    @Post('admin/self/:chargeId/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ปฏิเสธรายการ PromptPay' })
    async rejectSelfHostedPayment(
        @Param('chargeId') chargeId: string,
        @Body() body: { reason?: string },
        @Request() req: any,
    ) {
        return this.paymentService.rejectSelfHostedPayment(charIdOrThrow(chargeId), req.user.id, body.reason);
    }

    @Get('admin/self/:chargeId/logs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดู log การสร้าง QR และตรวจสอบเงินเข้า' })
    async getSelfHostedPaymentLogs(@Param('chargeId') chargeId: string) {
        return this.paymentService.getSelfHostedPaymentLogs(charIdOrThrow(chargeId));
    }

    /** เช็คสถานะรายการของบริษัทตัวเอง (Polling จากหน้าบ้าน) */
    @Get('status/:chargeId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getPaymentStatus(@Param('chargeId') chargeId: string, @Request() req: any) {
        try {
            const payment = await this.prisma.paymentTransaction.findUnique({
                where: { chargeId: chargeId },
                select: { status: true, companyId: true }
            });

            if (!payment) {
                throw new NotFoundException(`ไม่พบรายการชำระเงินรหัส: ${chargeId}`);
            }

            if (req.user.role !== UserRole.ADMIN) {
                const company = await this.prisma.company.findFirst({
                    where: { id: payment.companyId, ownerId: req.user.id },
                    select: { id: true },
                });
                if (!company) {
                    throw new NotFoundException(`ไม่พบรายการชำระเงินรหัส: ${chargeId}`);
                }
            }

            return this.paymentService.getSelfHostedPaymentStatus(charIdOrThrow(chargeId));
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

    /** ดึงข้อมูลรายการชำระเงินของบริษัทตัวเอง */
    @Get('company/:companyId')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    async getCompanyPayments(
        @Param('companyId') companyId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
        @Request() req?: any,
    ) {
        if (req.user.role !== UserRole.ADMIN) {
            const company = await this.prisma.company.findFirst({
                where: { id: companyId, ownerId: req.user.id },
                select: { id: true },
            });
            if (!company) {
                throw new NotFoundException('ไม่พบบริษัทหรือไม่มีสิทธิ์เข้าถึง');
            }
        }
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 5;
        return await this.paymentService.getCompanyPayments(companyId, pageNum, limitNum, status);
    }
}

function charIdOrThrow(chargeId: string): string {
    if (!chargeId?.trim()) {
        throw new BadRequestException('chargeId is required');
    }
    return chargeId.trim();
}
