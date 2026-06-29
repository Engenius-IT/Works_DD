import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Create a notification for a user
     */
    async create(data: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        linkUrl?: string;
        applicationId?: string;
    }) {
        return this.prisma.notification.create({ data });
    }

    /**
     * Create notification when application status changes
     */
    async createForStatusChange(
        userId: string,
        status: string,
        jobTitle: string,
        companyName: string,
        jobSlug: string,
        applicationId: string,
    ) {
        const templates: Record<string, { title: string; message: string }> = {
            REVIEWED: {
                title: '📋 ใบสมัครถูกตรวจสอบแล้ว',
                message: `บริษัท ${companyName} ได้ตรวจสอบใบสมัครตำแหน่ง "${jobTitle}" ของคุณแล้ว`,
            },
            SHORTLISTED: {
                title: '⭐ คุณผ่านรอบคัดเลือก!',
                message: `ยินดีด้วย! บริษัท ${companyName} เลือกคุณเข้ารอบถัดไปสำหรับตำแหน่ง "${jobTitle}"`,
            },
            INTERVIEW: {
                title: '🗓️ นัดสัมภาษณ์',
                message: `บริษัท ${companyName} นัดสัมภาษณ์ตำแหน่ง "${jobTitle}"`,
            },
            OFFERED: {
                title: '🎉 ได้รับข้อเสนองาน!',
                message: `ยินดีด้วย! บริษัท ${companyName} เสนอตำแหน่ง "${jobTitle}" ให้คุณ`,
            },
            REJECTED: {
                title: '❌ ผลการสมัคร',
                message: `บริษัท ${companyName} แจ้งผลการสมัครตำแหน่ง "${jobTitle}" ของคุณ`,
            },
        };

        const template = templates[status];
        if (!template) return; // Don't notify for PENDING or WITHDRAWN

        return this.create({
            userId,
            type: 'STATUS_CHANGE',
            title: template.title,
            message: template.message,
            linkUrl: `/jobs/${jobSlug}`,
            applicationId,
        });
    }

    /**
     * Create notification for interview scheduling
     */
    async createForInterview(
        userId: string,
        jobTitle: string,
        companyName: string,
        jobSlug: string,
        applicationId: string,
        interviewDate: Date,
    ) {
        const formattedDate = interviewDate.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

        return this.create({
            userId,
            type: 'INTERVIEW_SCHEDULED',
            title: '🗓️ นัดสัมภาษณ์',
            message: `บริษัท ${companyName} นัดสัมภาษณ์ตำแหน่ง "${jobTitle}" วันที่ ${formattedDate}`,
            linkUrl: `/jobs/${jobSlug}`,
            applicationId,
        });
    }

    /**
     * Get notifications for a user with pagination
     */
    async findAll(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            this.prisma.notification.findMany({
                where: { userId },
                include: {
                    application: {
                        where: { userId },
                        include: {
                            job: {
                                include: {
                                    company: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.notification.count({ where: { userId } }),
        ]);

        return {
            data: notifications,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(id: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    /**
     * Delete multiple notifications
     */
    async deleteBatch(ids: string[], userId: string) {
        return this.prisma.notification.deleteMany({
            where: {
                id: { in: ids },
                userId,
            },
        });
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAll(userId: string) {
        return this.prisma.notification.deleteMany({
            where: { userId },
        });
    }
}
