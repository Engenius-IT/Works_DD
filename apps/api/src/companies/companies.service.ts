import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  VerificationStatus,
  JobStatus,
} from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(readonly prisma: PrismaService) {}

  async getMyCompany(userId: string, userRole?: string) {
    let company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company && userRole === 'ADMIN') {
      company = await this.prisma.company.findFirst();
      if (!company) {
        company = await this.prisma.company.create({
          data: {
            ownerId: userId,
            name: 'บริษัท (Admin Default)',
            industry: 'IT & Technology',
            slug: 'admin-default-company-' + Date.now(),
            isVerified: true,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        });
      }
    }
    if (!company) {
      throw new NotFoundException('ไม่พบข้อมูลบริษัท กรุณาตั้งค่าข้อมูลบริษัทก่อน');
    }
    return company;
  }

  async createMyCompany(userId: string, name: string, industry?: string) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('กรุณาระบุชื่อบริษัท');
    }

    const existing = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (existing) return existing;

    const baseSlug = normalizedName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'company';

    return this.prisma.company.create({
      data: {
        ownerId: userId,
        name: normalizedName,
        industry: industry?.trim() || undefined,
        slug: `${baseSlug}-${randomUUID().slice(0, 8)}`,
        isVerified: false,
        verificationStatus: VerificationStatus.UNVERIFIED,
      },
    });
  }

  async update(id: string, dto: any, userId: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('ไม่พบข้อมูลบริษัท');
    if (company.ownerId !== userId)
      throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขข้อมูลบริษัทนี้');
    return this.prisma.company.update({ where: { id }, data: dto });
    console.log(dto);
  }

  async getMyJobs(userId: string, userRole?: string) {
    let company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company && userRole === 'ADMIN') {
      company = await this.prisma.company.findFirst();
    }
    if (!company) return [];
    return this.prisma.job.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      include: {
        company: { select: { id: true, name: true, logoUrl: true } },
        _count: { select: { applications: true, savedBy: true } },
      },
    });
  }

  async getMyJobById(userId: string, jobId: string, userRole?: string) {
    let company = await this.prisma.company.findFirst({
      where: { ownerId: userId },
    });
    if (!company && userRole === 'ADMIN') {
      company = await this.prisma.company.findFirst();
    }

    const job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        ...(userRole === 'ADMIN' ? {} : { companyId: company?.id }),
      },
      include: {
        company: true,
      },
    });

    if (!job) {
      throw new NotFoundException('ไม่พบประกาศงานนี้ หรือคุณไม่มีสิทธิ์เข้าถึง');
    }

    return job;
  }

  async submitVerification(id: string, verificationDocs: string[], userId: string) {
    const normalizedDocs = Array.isArray(verificationDocs)
      ? verificationDocs.map((doc) => doc?.trim()).filter((doc): doc is string => Boolean(doc))
      : [];

    if (normalizedDocs.length === 0) {
      throw new BadRequestException('กรุณาแนบเอกสารยืนยันตัวตนอย่างน้อย 1 รายการ');
    }

    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('ไม่พบข้อมูลบริษัทสำหรับการส่งเอกสารยืนยันตัวตน');
    if (company.ownerId !== userId) {
      throw new ForbiddenException('บริษัทที่กำลังส่งเอกสารไม่ตรงกับบัญชีที่ล็อกอิน กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง');
    }

    return this.prisma.company.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.PENDING_REVIEW,
        verificationDocs: normalizedDocs,
      },
    });
  }
  async getTopCompanies() {
  return this.prisma.company.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      logoUrl: true,
      bgUrl: true,
      description: true,
    },
  });
}

  async findBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('ไม่พบข้อมูลบริษัทนี้');
    }

    return company;
  }

  async findJobsByCompanySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException('ไม่พบข้อมูลบริษัทนี้');
    }

   return this.prisma.job.findMany({
  where: {
    companyId: company.id,
    status: JobStatus.ACTIVE,
  },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            applications: true,
            savedBy: true,
          },
        },
      },
    });
  }
}
