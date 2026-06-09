import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from './types/jwt-payload.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly config: ConfigService,
    ) { }

    @Post('register')
    @ApiOperation({ summary: 'สมัครสมาชิกแบบปกติ' })
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'เข้าสู่ระบบแบบปกติ' })
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ (ต้อง login)' })
    async getProfile(@CurrentUser() user: JwtPayload) {
        return this.authService.getProfile(user);
    }

    // ─── Google OAuth (โฟลว์ปรับปรุงใหม่ ป้องกันลูปสลับฝั่ง) ─────────────────

    @Get('google')
    @ApiOperation({ summary: 'เริ่ม Google OAuth (ไม่ต้องส่ง Role แล้ว)' })
    googleLogin(@Res() res: Response) {
        // 🟢 แก้ไข 1: ไม่ส่ง role ไปหา Google แล้ว ปล่อยให้เคลียร์สิทธิ์ด้วย Identity ก่อน
        const googleUrl = this.authService.getGoogleRedirectUrl();
        return res.redirect(googleUrl);
    }

    @Get('google/callback')
    @ApiExcludeEndpoint()
    async googleCallback(
        @Query('code') code: string,
        @Query('error') error: string,
        @Res() res: Response
    ) {
        const frontendUrl = this.config.get<string>('NEXTAUTH_URL', 'http://localhost:3000');

        if (error || !code) {
            return res.redirect(`${frontendUrl}/th/login?error=google_cancelled`);
        }

        try {
            // 🟢 แก้ไข 2: ถอดพารามิเตอร์ targetRole ออกไปจากตัวรับ Callback
            const result = await this.authService.handleGoogleCallback(code);

            // 🟢 เคสที่ 1: เป็นยูสเซอร์ใหม่ซิง ๆ ยังไม่มีใน Database 
            // ส่งกลับหน้า Login พร้อมแท็กสถานะ `new_user` และพ่วงโปรไฟล์ดิบจาก Google ไปให้หน้าบ้านเปิด Modal เลือกฝั่ง
            if (result.isNewUser) {
                const params = new URLSearchParams({
                    status: 'new_user',
                    oauthData: JSON.stringify(result.user)
                });
                return res.redirect(`${frontendUrl}/th/login?${params.toString()}`);
            }

            // 🟢 เคสที่ 2: มีบัญชีเดิมผูกบทบาทล็อกตารางอยู่แล้ว
            // ปล่อยตั๋ว Access Token และยิงพาเข้าสู่ระบบตามสิทธิ์จริงในฐานข้อมูลได้ทันที
            const params = new URLSearchParams({
                token: result.token!,
                user: JSON.stringify(result.user)
            });

            return res.redirect(`${frontendUrl}/th/login?${params.toString()}`);

        } catch (err) {
            console.error('Google Callback Error:', err);
            return res.redirect(`${frontendUrl}/th/login?error=google_failed`);
        }
    }

    @Post('google/register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'สร้างบัญชีใหม่สำหรับผู้ใช้ Google OAuth ที่กดยืนยันเลือกบทบาทจากหน้าต่างหน้าบ้านแล้ว' })
    async registerGoogleUser(
        @Body() body: { role: 'JOBSEEKER' | 'EMPLOYER'; oauthData: any; companyName?: string }
    ) {
        // 🟢 แก้ไข 3: เพิ่มเส้นทาง POST นี้ขึ้นมา เพื่อให้ป๊อปอัพยืนยันจากหน้าบ้านยิงกลับมาบันทึกลงฐานข้อมูลจริง
        return this.authService.registerGoogleUser(body);
    }
}