import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import { Public } from '../auth/decorators/public.decorator'; // ตรวจสอบ path นี้

@ApiTags('packages') // เพิ่ม Tag สำหรับ Swagger
@Controller('packages') // URL จะเป็น /packages
export class PackagesController {
    constructor(private readonly packagesService: PackagesService) { }

    @Public() // อนุญาตให้ยิงผ่านได้โดยไม่ต้องติด JWT Guard (สำคัญมากสำหรับการทำ Bypass)
    @Post('upgrade')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Bypass upgrade company package' })
    async upgrade(@Body() body: { companyId: string; planName: string }) {
        const { companyId, planName } = body;
        return await this.packagesService.MultipleUpgrade(companyId, planName);
    }

    @Get('status/:companyId') // เพิ่มส่วนนี้เพื่อให้ Frontend ยิงมา Get ได้
    @ApiOperation({ summary: 'Get company package status' })
    async getStatus(@Param('companyId') companyId: string) {
        return await this.packagesService.getPackageStatus(companyId);
    }
}