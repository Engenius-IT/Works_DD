import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    // ─── Public Endpoints ──────────────────────────────

    @Get()
    @ApiOperation({ summary: 'รายการงานทั้งหมด (public)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'jobType', required: false, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'] })
    @ApiQuery({ name: 'workModel', required: false, enum: ['ONSITE', 'REMOTE', 'HYBRID'] })
    @ApiQuery({ name: 'province', required: false, type: String })
    @ApiQuery({ name: 'region', required: false, type: String })
    async findAll(
        @Query('page') page = 1,
        @Query('limit') limit = 20,
        @Query('jobType') jobType?: string,
        @Query('workModel') workModel?: string,
        @Query('province') province?: string,
        @Query('region') region?: string,
    ) {
        return this.jobsService.findAll(
            Number(page),
            Number(limit),
            { jobType, workModel, province, region },
        );
    }

    @Get('homepage-categories')
    @ApiOperation({ summary: 'หมวดงานหน้าแรกพร้อมจำนวนตำแหน่งจริง' })
    async getHomepageCategories() {
        return this.jobsService.getHomepageCategories();
    }

    @Get('all-group-categories')
    @ApiOperation({ summary: 'ข้อมูลหมวดงานทั้งหมดพร้อมจำนวนตำแหน่งจริง' })
    async getAllGroupCategories() {
        return this.jobsService.getAllGroupCategories();
    }

    @Get('saved')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดึงรายการงานที่บันทึกไว้ (full data)' })
    async getSavedJobs(@CurrentUser() user: JwtPayload) {
        return this.jobsService.getSavedJobs(user.sub);
    }

    @Get('saved/ids')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดึงรายการ ID งานที่บันทึกไว้' })
    async getSavedIds(@CurrentUser() user: JwtPayload) {
        return this.jobsService.getSavedJobIds(user.sub);
    }

    @Get(':slug/similar')
    @ApiOperation({ summary: 'งานที่ใกล้เคียง (public)' })
    async findSimilar(@Param('slug') slug: string) {
        return this.jobsService.findSimilar(slug);
    }

    @Get(':slug')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'รายละเอียดงาน (public, optionally identifying user for application status)' })
    async findOne(
        @Param('slug') slug: string,
        @CurrentUser() user?: JwtPayload,
    ) {
        return this.jobsService.findBySlug(slug, user?.sub);
    }

    @Get('recommended/today')
    @ApiOperation({ summary: 'งานแนะนำที่มีผู้เข้าชมสูงสุดของวันนี้ (public)' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTopJobsToday(@Query('limit') limit = 6) {
        return this.jobsService.getTopJobsToday(Number(limit));
    }

    // ─── Protected Endpoints (ต้อง login) ──────────────

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'สร้างประกาศงาน (Employer or Admin)' })
    async create(
        @Body() dto: CreateJobDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.jobsService.create(dto, user.sub, user.role);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'แก้ไขประกาศงาน (Owner or Admin)' })
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateJobDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.jobsService.update(id, dto, user.sub, user.role);
    }

    @Patch(':id/publish')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'เผยแพร่ประกาศงาน (Owner or Admin)' })
    async publish(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.jobsService.publish(id, user.sub, user.role);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ปิดประกาศงาน / soft delete (Owner or Admin)' })
    async remove(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.jobsService.remove(id, user.sub, user.role);
    }

    @Post(':id/save')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึก/ยกเลิกการบันทึกงาน (toggle)' })
    async toggleSave(
        @Param('id') id: string,
        @CurrentUser() user: JwtPayload,
    ) {
        return this.jobsService.toggleSave(id, user.sub);
    }
}
