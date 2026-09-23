import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('packages') // เพิ่ม Tag สำหรับ Swagger
@Controller('packages') // URL จะเป็น /packages
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post('upgrade')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Set company package for admin use' })
    async upgrade(@Body() body: { companyId: string; planName: string }, @Request() req: any) {
        const { companyId, planName } = body;
        if (!companyId || !planName) {
            throw new BadRequestException('companyId and planName are required');
        }
        console.warn(`Manual package upgrade by admin ${req.user.id} for company ${companyId}`);
        return await this.packagesService.setCompanyPackage(companyId, planName);
    }

    @Public()
    @Get('status/:companyId') // เพิ่มส่วนนี้เพื่อให้ Frontend ยิงมา Get ได้
    @ApiOperation({ summary: 'Get company package status' })
    async getStatus(@Param('companyId') companyId: string) {
        return await this.packagesService.getPackageStatus(companyId);
    }
}
