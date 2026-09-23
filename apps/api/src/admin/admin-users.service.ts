import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogsService: AdminAuditLogsService,
  ) {}

  async getAllUsers(page: number, limit: number, searchTerm?: string, role?: UserRole) {
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (role) {
      where.role = role;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
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
      this.prisma.user.count({ where }),
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

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        companies: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verificationStatus: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: { jobs: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');

    // CompanyPackage ไม่มี Prisma relation กับ Company ใน schema ปัจจุบัน
    // จึงดึงแยกแล้วประกอบ response เพื่อให้หน้าแอดมินเห็นแพ็กเกจล่าสุดด้วย
    const companyIds = user.companies.map((company) => company.id);
    const packages = companyIds.length
      ? await this.prisma.companyPackage.findMany({
          where: { companyId: { in: companyIds } },
        })
      : [];
    const packageByCompanyId = new Map(packages.map((pkg) => [pkg.companyId, pkg]));

    return {
      ...user,
      companies: user.companies.map((company) => ({
        ...company,
        package: packageByCompanyId.get(company.id) ?? null,
      })),
    };
  }

  async updateUser(id: string, updateData: any, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');

    // Remove fields that shouldn't be updated directly via this endpoint if any
    const { id: _, createdAt: __, ...data } = updateData;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    // บันทึก Audit Log
    try {
      await this.auditLogsService.createLog({
        adminId: adminId,
        action: 'แก้ไขข้อมูลผู้ใช้',
        type: 'update',
        target: user.email,
        targetType: 'user',
        details: `แก้ไขข้อมูลผู้ใช้ ID: ${id} (${user.firstName} ${user.lastName}). ข้อมูลที่เปลี่ยน: ${JSON.stringify(data)}`,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }

    return updated;
  }

  async deleteUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('ไม่พบข้อมูลผู้ใช้');

    const deleted = await this.prisma.user.delete({ where: { id } });

    // บันทึก Audit Log
    try {
      await this.auditLogsService.createLog({
        adminId: adminId,
        action: 'ลบผู้ใช้',
        type: 'delete',
        target: user.email,
        targetType: 'user',
        details: `ลบผู้ใช้ ID: ${id} (${user.firstName} ${user.lastName})`,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }

    return deleted;
  }
}
