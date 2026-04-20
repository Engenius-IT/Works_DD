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
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './types/jwt-payload.interface';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  /**
   * Register a new user
   */
  async register(dto: RegisterDto) {
    try {
      // Check if email already exists
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing) {
        throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // Create user first
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

      // Create company if user is EMPLOYER and companyName is provided
      if (dto.role === 'EMPLOYER' && dto.companyName) {
        try {
          await this.prisma.company.create({
            data: {
              ownerId: user.id,
              name: dto.companyName,
              industry: dto.industry || undefined,
              slug: this.generateSlug(dto.companyName),
              isVerified: false,
              verificationStatus: VerificationStatus.UNVERIFIED,
            },
          });
        } catch (error: any) {
          // console.error('Company creation failed:', error); // Logged in outer catch
          // Rollback user creation
          await this.prisma.user.delete({ where: { id: user.id } });
          throw error;
        }
      }

      // Generate JWT
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
          companyName: dto.companyName,
        },
      };
    } catch (error: any) {
      // Simple logger or use Console
      console.error(
        `[${new Date().toISOString()}] Register Error:`,
        JSON.stringify(error, null, 2),
      );
      console.error(error.stack);

      // Re-throw NestJS HTTP exceptions as-is (ConflictException, etc.)
      if (error?.status) {
        throw error;
      }
      // Only wrap unexpected errors as 500
      throw new InternalServerErrorException(`Registration Failed: ${error.message}`);
    }
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9ก-๙]+/g, '-') // Allow Thai characters and alphanumeric
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
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
        include: { companies: true },
      });

      if (!user) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      if (dto.role && user.role !== dto.role && user.role !== 'ADMIN') {
        const roleName = dto.role === 'JOBSEEKER' ? 'ผู้สมัครงาน' : 'นายจ้าง/บริษัท';
        throw new UnauthorizedException(`บัญชีนี้ไม่ได้ลงทะเบียนในฐานะ${roleName}`);
      }

      // OAuth-only users have no password
      if (!user.passwordHash) {
        throw new UnauthorizedException(
          'บัญชีนี้ลงทะเบียนผ่าน Google หรือ Line กรุณาใช้ปุ่ม OAuth เพื่อเข้าสู่ระบบ',
        );
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

      if (!isPasswordValid) {
        throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      }

      // Generate JWT
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
      throw error; // Re-throw to maintain behavior
    }
  }

  /**
   * Get current user profile from JWT payload
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
        companies: { select: { name: true, logoUrl: true } },
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
    };
  }

  /**
   * Get Google OAuth redirect URL
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
   * Handle Google OAuth callback — exchange code for user info, create/find user
   */
  async handleGoogleCallback(code: string): Promise<{ token: string; user: object }> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.getApiCallbackUrl('google');

    // Exchange code for access token
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

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userRes.json()) as any;

    return this.findOrCreateOAuthUser({
      email: googleUser.email,
      googleId: googleUser.id,
      firstName: googleUser.given_name || 'Google',
      lastName: googleUser.family_name || 'User',
      avatarUrl: googleUser.picture,
    });
  }

  /**
   * Find existing user by OAuth ID or email, or create a new one
   */
  private async findOrCreateOAuthUser(data: {
    email?: string;
    googleId?: string;
    lineId?: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  }): Promise<{ token: string; user: object }> {
    const { email, googleId, lineId, firstName, lastName, avatarUrl } = data;

    // Try to find existing user by OAuth ID first
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(googleId ? [{ googleId }] : []),
          ...(lineId ? [{ lineId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: email || null,
          googleId: googleId || null,
          lineId: lineId || null,
          firstName,
          lastName,
          avatarUrl: avatarUrl || null,
          role: 'JOBSEEKER',
        },
      });
    } else {
      // Link OAuth ID if not already linked
      const updateData: Record<string, any> = {};
      if (googleId && !user.googleId) updateData.googleId = googleId;
      if (lineId && !user.lineId) updateData.lineId = lineId;
      if (avatarUrl && !user.avatarUrl) updateData.avatarUrl = avatarUrl;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    const token = await this.signToken(user.id, user.email ?? '', user.role);
    const userPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };
    return { token, user: userPayload };
  }

  /**
   * Build the API OAuth callback URL for a provider
   */
  private getApiCallbackUrl(provider: string): string {
    const apiUrl = this.config.get<string>('API_URL', 'http://localhost:3001');
    return `${apiUrl}/api/v1/auth/${provider}/callback`;
  }

  /**
   * Sign a JWT token
   */
  private async signToken(userId: string, email: string, role: string): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload);
  }
}
