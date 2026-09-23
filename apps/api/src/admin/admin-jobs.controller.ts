import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminJobsService } from './admin-jobs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, JobStatus } from '@prisma/client';

@ApiTags('admin-jobs')
@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminJobsController {
  constructor(private readonly adminJobsService: AdminJobsService) {}

  @Get()
  @ApiOperation({ summary: 'ดึงรายการงานทั้งหมด (Admin)' })
  async getAllJobs(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminJobsService.getAllJobs(Number(page), Number(limit), search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดึงข้อมูลงานเดี่ยว (Admin)' })
  async getJobById(@Param('id') id: string) {
    return this.adminJobsService.getJobById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'อัปเดตสถานะงาน (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: JobStatus },
  ) {
    return this.adminJobsService.updateJobStatus(id, dto.status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขงาน (Admin)' })
  async updateJob(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    const adminId = req.user?.id || req.user?.sub;
    return this.adminJobsService.updateJob(id, dto, adminId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบงาน (Admin)' })
  async deleteJob(@Param('id') id: string, @Request() req: any) {
    const adminId = req.user?.id || req.user?.sub;
    return this.adminJobsService.deleteJob(id, adminId);
  }
}
