import { Controller, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Patch(':id/status')
  @ApiOperation({ summary: 'อัปเดตสถานะงาน (Admin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: JobStatus },
  ) {
    return this.adminJobsService.updateJobStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'ลบงาน (Admin)' })
  async deleteJob(@Param('id') id: string) {
    return this.adminJobsService.deleteJob(id);
  }
}
