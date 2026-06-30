import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './types/jwt-payload.interface';
import { VerificationStatus, NotificationType } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  /**
   * Register a new user (แบบปกติ กรอกฟอร์ม)
   */
  async register(dto: RegisterDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
      }

      const passwordHash = await bcrypt.hash(dto.password, 12);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: dto.role,
          phone: dto.phone,
        },
      });

      let companyName: string | undefined = dto.companyName;
      let companySlug: string | undefined;

      if (dto.role === 'EMPLOYER' && dto.companyName) {
        try {
          const company = await this.prisma.company.create({
            data: {
              ownerId: user.id,
              name: dto.companyName,
              industry: dto.industry || undefined,
              slug: this.generateSlug(dto.companyName),
              isVerified: false,
              verificationStatus: VerificationStatus.UNVERIFIED,
            },
          });

          companyName = company.name;
          companySlug = company.slug;
        } catch (error: any) {
          await this.prisma.user.delete({ where: { id: user.id } });
          throw error;
        }
      }

      await this.createRegisterNotification({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName,
      });

      const token = await this.signToken(user.id, user.email ?? '', user.role);

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          companyName,
          companySlug,
        },
      };
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Register Error:`, JSON.stringify(error, null, 2));
      if (error?.status) throw error;
      throw new InternalServerErrorException(`Registration Failed: ${error.message}`);
    }
  }

  private async createRegisterNotification(data: {
    userId: string;
    firstName: string;
    lastName: string;
    role: string;
    companyName?: string | null;
  }) {
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const displayName = data.role === 'EMPLOYER' ? data.companyName || fullName : fullName;

    await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: NotificationType.GENERAL,
        title: 'Notifications.title_register_success',
        message: JSON.stringify({
          key:
            data.role === 'EMPLOYER'
              ? 'Notifications.msg_register_success_employer'
              : 'Notifications.msg_register_success_jobseeker',
          params: {
            name: displayName,
          },
        }),
        linkUrl: data.role === 'EMPLOYER' ? '/employer/dashboard' : '/jobs',
        isRead: false,
      },
    });
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 7)
    );
  }

  /**
   * Login with email & password
   */
  async login(dto: LoginDto) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { companies: true },
      });

      if (!user) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      if (dto.role && user.role !== dto.role) {
        if (user.role === 'ADMIN') {
          throw new UnauthorizedException('บัญชีผู้ดูแลระบบ กรุณาเข้าสู่ระบบผ่านหน้า Admin Dashboard');
        }
        const roleName = dto.role === 'JOBSEEKER' ? 'ผู้สมัครงาน' : 'นายจ้าง/บริษัท';
        throw new UnauthorizedException(`บัญชีนี้ไม่ได้ลงทะเบียนในฐานะ${roleName}`);
      }

      if (!user.passwordHash) {
        throw new UnauthorizedException(
          'บัญชีนี้ลงทะเบียนผ่าน Google หรือ Line กรุณาใช้ปุ่ม OAuth เพื่อเข้าสู่ระบบ',
        );
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      const token = await this.signToken(user.id, user.email ?? '', user.role);

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          companyName: user.companies?.[0]?.name,
          companyLogo: user.companies?.[0]?.logoUrl,
          companySlug: user.companies?.[0]?.slug,
        },
      };
    } catch (error: any) {
      const fs = require('fs');
      const path = require('path');
      const logPath = path.join(process.cwd(), 'api_error.log');
      fs.appendFileSync(
        logPath,
        `[${new Date().toISOString()}] Login Error: ${JSON.stringify(error, null, 2)}\nStack: ${error.stack}\n`,
      );
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        companies: { select: { name: true, logoUrl: true, slug: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('ไม่พบผู้ใช้');
    }

    const { companies, ...restUser } = user;

    return {
      ...restUser,
      companyName: companies?.[0]?.name,
      companyLogo: companies?.[0]?.logoUrl,
      companySlug: companies?.[0]?.slug,
    };
  }

  // ─── 🟢 GOOGLE OAUTH FLOW ปรับปรุงใหม่ ─────────────────────────────────────────

  /**
   * Get Google OAuth redirect URL (ถอดพารามิเตอร์ role ออกแล้ว)
   */
  getGoogleRedirectUrl(): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.getApiCallbackUrl('google');
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Handle Google OAuth callback (ไม่ล็อกบทบาทล่วงหน้าจากภายนอก)
   */
  async handleGoogleCallback(code: string): Promise<{ isNewUser: boolean; token?: string; user: object }> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.getApiCallbackUrl('google');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = (await tokenRes.json()) as any;

    if (!tokenData.access_token) {
      throw new UnauthorizedException('Google OAuth ล้มเหลว');
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userRes.json()) as any;

    // ส่งต่อไปเช็คประวัติในฐานข้อมูล
    return this.checkOAuthUser({
      email: googleUser.email,
      googleId: googleUser.id,
      firstName: googleUser.given_name || 'Google',
      lastName: googleUser.family_name || 'User',
      avatarUrl: googleUser.picture,
    });
  }

  /**
   * ตรวจสอบสิทธิ์บัญชี OAuth (แก้ลอจิก: ถ้าไม่มีประวัติ ห้ามบันทึกทันที ให้เด้งไปให้หน้าบ้านเลือกฝั่ง)
   */
  private async checkOAuthUser(data: {
    email?: string;
    googleId?: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<{ isNewUser: boolean; token?: string; user: object }> {
    const { email, googleId, firstName, lastName, avatarUrl } = data;

    // ค้นหายูสเซอร์เดิม
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(googleId ? [{ googleId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      include: { companies: true },
    });

    // ❌ เคสเด็กใหม่: คืนธง isNewUser=true กลับไปเพื่อให้ฝั่ง Controller เตะส่งไปให้ป๊อปอัพหน้าบ้านคัดกรอง
    if (!user) {
      return {
        isNewUser: true,
        user: { email, googleId, firstName, lastName, avatarUrl },
      };
    }

    // เคสคนเก่า: ถ้ายังไม่เคยลิงก์ ID หรืออัปเดตรูป ให้ปรับปรุงตารางเล็กน้อย
    const updateData: Record<string, any> = {};
    if (googleId && !user.googleId) updateData.googleId = googleId;
    if (avatarUrl && !user.avatarUrl) updateData.avatarUrl = avatarUrl;
    if (Object.keys(updateData).length > 0) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { companies: true },
      });
    }

    // เจนเนอเรต Token ปล่อยผ่านเข้าระบบตามบทบาทจริงในฐานข้อมูล
    const token = await this.signToken(user.id, user.email ?? '', user.role);
    return {
      isNewUser: false,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        companyName: user.companies?.[0]?.name || null,
        companyLogo: user.companies?.[0]?.logoUrl || null,
        companySlug: user.companies?.[0]?.slug || null,
      },
    };
  }

  /**
   * 🟢 ฟังก์ชันเพิ่มใหม่: รับไม้ต่อเพื่อบันทึกยูสเซอร์ Google ลงตารางจริงหลังเลือกบทบาทเสร็จสิ้น
   */
  async registerGoogleUser(body: { role: 'JOBSEEKER' | 'EMPLOYER'; oauthData: any; companyName?: string }) {
    const { role, oauthData, companyName } = body;
    const { email, googleId, firstName, lastName, avatarUrl } = oauthData;

    try {
      // ดักซ้ำอีกรอบเพื่อความปลอดภัย 
      const existing = await this.prisma.user.findFirst({
        where: {
          OR: [
            ...(googleId ? [{ googleId }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });

      if (existing) {
        throw new ConflictException('บัญชีอีเมลหรือสิทธิ์การใช้งานนี้ลงทะเบียนไว้แล้ว');
      }

      // 1. สร้างบัญชีผู้ใช้ลงตาราง User จริง ๆ 
      let user = await this.prisma.user.create({
        data: {
          email: email || null,
          googleId: googleId || null,
          firstName,
          lastName,
          avatarUrl: avatarUrl || null,
          role: role,
        },
        include: { companies: true },
      });

      // 2. ถ้าผู้ใช้กดเลือกเป็น 'EMPLOYER' (นายจ้าง) ให้ผูกข้อมูลบริษัทให้ตามชื่อที่ส่งมาจากป๊อปอัพ
      let finalCompanyName: string | null = null;

      if (role === 'EMPLOYER') {
        finalCompanyName = companyName || `${firstName} Company`;

        await this.prisma.company.create({
          data: {
            ownerId: user.id,
            name: finalCompanyName,
            slug: this.generateSlug(finalCompanyName),
            isVerified: false,
            verificationStatus: VerificationStatus.UNVERIFIED,
          },
        });

        // ดึงข้อมูลผู้ใช้ซ้ำเพื่อให้ Array โครงสร้างบริษัทอัปเดตออกมาสมบูรณ์
        user = await this.prisma.user.findUnique({
          where: { id: user.id },
          include: { companies: true },
        }) as any;
      }

      await this.createRegisterNotification({
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyName: user.companies?.[0]?.name || finalCompanyName,
      });

      // 3. เจน Access Token ปล่อยล็อกอินเข้าใช้งานทันทีหลังลงทะเบียนเสร็จ
      const token = await this.signToken(user.id, user.email ?? '', user.role);

      return {
        accessToken: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          companyName: user.companies?.[0]?.name || null,
          companyLogo: user.companies?.[0]?.logoUrl || null,
          companySlug: user.companies?.[0]?.slug || null,
        },
      };

    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Google Register Error:`, error);
      if (error?.status) throw error;
      throw new InternalServerErrorException(`Google Registration Failed: ${error.message}`);
    }
  }

  private getApiCallbackUrl(provider: string): string {
    const apiUrl = this.config.get<string>('API_URL', 'http://localhost:3001');
    return `${apiUrl}/api/v1/auth/${provider}/callback`;
  }

  private async signToken(userId: string, email: string, role: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException(
        'ไม่พบผู้ใช้หรือบัญชีนี้ไม่ได้ลงทะเบียนด้วยรหัสผ่าน (อาจลงทะเบียนผ่าน Google/Line)',
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('รหัสผ่านเดิมไม่ถูกต้อง');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  }
}