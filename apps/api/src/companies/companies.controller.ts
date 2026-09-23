import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ForbiddenException, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(readonly companiesService: CompaniesService) { }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดึงข้อมูลบริษัทของ employer ที่ login อยู่' })
  async getMyCompany(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getMyCompany(user.sub, user.role);
  }

  @Post('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'สร้างข้อมูลบริษัทของ employer ที่ login อยู่' })
  async createMyCompany(
    @Body() body: { name?: string; industry?: string },
    @CurrentUser() user: JwtPayload,
    @Request() req: any,
  ) {
    if (req.user.role !== 'EMPLOYER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('บัญชีนี้ไม่ใช่บัญชีผู้ประกอบการ');
    }
    return this.companiesService.createMyCompany(user.sub, body.name || '', body.industry);
  }

  @Get('mine/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดึงรายการงานทั้งหมดของบริษัท' })
  async getMyJobs(@CurrentUser() user: JwtPayload) {
    return this.companiesService.getMyJobs(user.sub, user.role);
  }

  @Get('mine/jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ดึงข้อมูลงานเดี่ยวของบริษัท (ใช้สำหรับหน้าแก้ไข)' })
  async getMyJobById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.companiesService.getMyJobById(user.sub, id, user.role);
  }

  @Post()
  async create() {
    // TODO: Implement create company (Employer only)
    return { message: 'Create company endpoint' };
  }

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 20) {
    // TODO: Implement list companies
    return { message: 'List companies endpoint', page, limit };
  }

@Get('top-by-package')
async getTopCompanies() {
  return this.companiesService.getTopCompanies();
}

  
@Get(':slug/jobs')
@ApiOperation({ summary: 'ดึงรายการงานทั้งหมดของบริษัทจาก slug' })
async findCompanyJobs(@Param('slug') slug: string) {
  return this.companiesService.findJobsByCompanySlug(slug);
}

@Get(':slug')
@ApiOperation({ summary: 'ดึงข้อมูลบริษัทจาก slug' })
async findOne(@Param('slug') slug: string) {
  return this.companiesService.findBySlug(slug);
}

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'แก้ไขข้อมูลบริษัท (Owner only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companiesService.update(id, dto, user.sub);
  }

  @Patch(':id/verify-submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ส่งเอกสารเพื่อยืนยันตัวตนบริษัท (Employer)' })
  async submitVerification(
    @Param('id') id: string,
    @Body() dto: SubmitVerificationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.companiesService.submitVerification(id, dto.verificationDocs, user.sub);
  }
}
