import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      pendingCompanies,
      newUsersThisMonth,
      newJobsThisMonth,
      newApplicationsThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.company.count(),
      this.prisma.job.count(),
      this.prisma.application.count(),
      this.prisma.company.count({
        where: { verificationStatus: VerificationStatus.PENDING_REVIEW },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      this.prisma.job.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      this.prisma.application.count({
        where: { appliedAt: { gte: firstDayOfMonth } },
      }),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalJobs,
      totalApplications,
      pendingCompanies,
      newUsersThisMonth,
      newJobsThisMonth,
      newApplicationsThisMonth,
    };
  }
}
