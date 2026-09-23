import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { JobStatus } from '@prisma/client';

@Injectable()
export class AdminJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AdminAuditLogsService,
  ) {}

  async getAllJobs(page: number, limit: number, searchTerm?: string) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { name: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              logoUrl: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateJobStatus(id: string, status: JobStatus) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('ไม่พบข้อมูลงาน');

    return this.prisma.job.update({
      where: { id },
      data: { status },
    });
  }

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
    if (!job) throw new NotFoundException('ไม่พบข้อมูลงาน');
    return job;
  }

  async updateJob(id: string, dto: any, adminId: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('ไม่พบข้อมูลงาน');

    const updated = await this.prisma.job.update({
      where: { id },
      data: dto,
    });

    try {
      await this.auditLogsService.createLog({
        adminId: adminId,
        action: 'แก้ไขงาน',
        type: 'update',
        target: job.title,
        targetType: 'job',
        details: `แก้ไขงาน ID: ${id}`,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }

    return updated;
  }

  async deleteJob(id: string, adminId: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('ไม่พบข้อมูลงาน');

    const deleted = await this.prisma.job.delete({ where: { id } });

    // บันทึก Audit Log
    try {
      await this.auditLogsService.createLog({
        adminId: adminId,
        action: 'ลบงาน',
        type: 'delete',
        target: job.title,
        targetType: 'job',
        details: `ลบงาน ID: ${id}`,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }

    return deleted;
  }
}
