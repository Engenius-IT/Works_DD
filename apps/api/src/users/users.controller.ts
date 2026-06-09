import { Controller, Get, Patch, Put, Post, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertEducationDto } from './dto/upsert-education.dto';
import { UpsertWorkHistoryDto } from './dto/upsert-work-history.dto';
import { UpsertLanguagesDto } from './dto/upsert-languages.dto';
import { UpsertCertificatesDto } from './dto/upsert-certificates.dto';
import { UpsertJobPreferenceDto } from './dto/upsert-job-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.interface';
import { Req } from '@nestjs/common';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = await this.jwtService.verifyAsync(token);
                request.user = payload;
            } catch {

                request.user = null;
            }
        }
        return true;
    }
}

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(readonly usersService: UsersService) { }


    // ===============================
    // Candidate Directory
    // ===============================
    @Get('candidate-directory')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ค้นหารายชื่อผู้หางาน' })
    async getCandidateDirectory(
        @Req() req: Request,
        @Query('query') query?: string,
        @Query('province') province?: string,
        @Query('language') language?: string,
        @Query('languageLevel') languageLevel?: string,
        @Query('gender') gender?: string,
        @Query('ageMin') ageMin?: string,
        @Query('ageMax') ageMax?: string,
        @Query('skills') skills?: string,
        @Query('educationLevel') educationLevel?: string,
        @Query('minGpa') minGpa?: string,
        @Query('institution') institution?: string,
        @Query('englishLevel') englishLevel?: string,
        @Query('businessType') businessType?: string,
        @Query('jobType') jobType?: string,
    ) {
        const user = (req as any).user;
        return this.usersService.getCandidateDirectory({
            query,
            province,
            language,
            languageLevel,
            gender,
            ageMin,
            ageMax,
            skills,
            educationLevel,
            minGpa,
            institution,
            englishLevel,
            businessType,
            jobType,
            currentUserId: user?.sub,
        });
    }

    // --- 1. เพิ่มฟังก์ชันปลดล็อกข้อมูลติดต่อ (สำคัญมาก เพื่อแก้ 404) ---
    @Post('candidate-directory/:id/contact')
    @UseGuards(OptionalJwtAuthGuard) // ใช้ Optional เพื่อให้ Guard แกะ user.sub ออกมา
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ปลดล็อกข้อมูลติดต่อผู้สมัคร' })
    async getCandidateContact(
        @Param('id') id: string,
        @Req() req: Request,
        @Body('confirmUseCC') confirmUseCC: boolean, // รับค่าจาก Frontend ว่ากดยืนยันจ่ายแต้มหรือยัง
    ) {
        const user = (req as any).user;
        if (!user) throw new BadRequestException('กรุณาเข้าสู่ระบบก่อนทำรายการ');

        return this.usersService.getCandidateContact(
            id,
            { sub: user.sub, role: user.role },
            confirmUseCC
        );
    }

    // --- 2. ตรวจสอบ getCandidateDirectoryDetail (มีอยู่แล้วแต่ต้องเช็ค Parameter) ---
    @Get('candidate-directory/:id')
    @UseGuards(OptionalJwtAuthGuard)
    @ApiBearerAuth()
    async getCandidateDirectoryDetail(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const user = (req as any).user;
        // ตรวจสอบว่าใน UsersService รับ 2 arguments (id, currentUserId) ตามที่เราคุยกันก่อนหน้า
        return this.usersService.getCandidateDirectoryDetail(id, user?.sub);
    }

    // ===============================
    // Profile (Personal Info)
    // ===============================
    @Get('me/profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูข้อมูลโปรไฟล์ส่วนบุคคล (ต้อง login)' })
    async getProfile(@CurrentUser() user: JwtPayload) {
        return this.usersService.getProfile(user.sub);
    }

    @Patch('me/profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'อัพเดตข้อมูลโปรไฟล์ (ต้อง login)' })
    async updateProfile(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.upsertProfile(user.sub, dto);
    }

    @Post('me/avatar')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'อัพโหลดรูปโปรไฟล์ (ต้อง login)' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                if (!allowed.includes(file.mimetype)) {
                    return cb(new BadRequestException('รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadAvatar(
        @CurrentUser() user: JwtPayload,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new BadRequestException('ไม่พบไฟล์ที่อัพโหลด');
        return this.usersService.uploadAvatar(user.sub, file);
    }

    // ===============================
    // Desired Provinces (สถานที่ที่สนใจทำงาน)
    // ===============================
    @Get('me/desired-provinces')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูจังหวัดที่สนใจทำงาน' })
    async getDesiredProvinces(@CurrentUser() user: JwtPayload) {
        return this.usersService.getDesiredProvinces(user.sub);
    }

    @Put('me/desired-provinces')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกจังหวัดที่สนใจทำงาน (replace all)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                provinces: { type: 'array', items: { type: 'string' }, example: ['กรุงเทพมหานคร', 'นนทบุรี'] }
            }
        }
    })
    async upsertDesiredProvinces(
        @CurrentUser() user: JwtPayload,
        @Body() dto: { provinces: string[] },
    ) {
        return this.usersService.upsertDesiredProvinces(user.sub, dto.provinces);
    }

    // ===============================
    // Education
    // ===============================
    @Get('me/educations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูประวัติการศึกษา' })
    async getEducations(@CurrentUser() user: JwtPayload) {
        return this.usersService.getEducations(user.sub);
    }

    @Put('me/educations')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกประวัติการศึกษา (replace all)' })
    async upsertEducations(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpsertEducationDto,
    ) {
        console.log('Received UpsertEducationDto:', JSON.stringify(dto));
        return this.usersService.upsertEducations(user.sub, dto);
    }

    // ===============================
    // Work History
    // ===============================
    @Get('me/work-histories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูประวัติการทำงาน' })
    async getWorkHistories(@CurrentUser() user: JwtPayload) {
        return this.usersService.getWorkHistories(user.sub);
    }

    @Put('me/work-histories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกประวัติการทำงาน (replace all)' })
    async upsertWorkHistories(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpsertWorkHistoryDto,
    ) {
        return this.usersService.upsertWorkHistories(user.sub, dto);
    }

    // ===============================
    // Languages
    // ===============================
    @Get('me/languages')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูความสามารถทางภาษาและผลสอบ' })
    async getLanguages(@CurrentUser() user: JwtPayload) {
        return this.usersService.getLanguages(user.sub);
    }

    @Put('me/languages')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกความสามารถทางภาษาและผลสอบ (replace all)' })
    async upsertLanguages(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpsertLanguagesDto,
    ) {
        return this.usersService.upsertLanguages(user.sub, dto);
    }

    // ===============================
    // Driving Skills
    // ===============================
    @Get('me/driving-skills')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูทักษะการขับขี่' })
    async getDrivingSkills(@CurrentUser() user: JwtPayload) {
        return this.usersService.getDrivingSkills(user.sub);
    }

    @Put('me/driving-skills')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกทักษะการขับขี่ (replace all)' })
    async upsertDrivingSkills(
        @CurrentUser() user: JwtPayload,
        @Body() dto: { skills: string[] },
    ) {
        return this.usersService.upsertDrivingSkills(user.sub, dto.skills);
    }

    // ===============================
    // Certificates
    // ===============================
    @Get('me/certificates')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูใบประกาศนียบัตร' })
    async getCertificates(@CurrentUser() user: JwtPayload) {
        return this.usersService.getCertificates(user.sub);
    }

    @Put('me/certificates')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกใบประกาศนียบัตร (replace all)' })
    async upsertCertificates(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpsertCertificatesDto,
    ) {
        return this.usersService.upsertCertificates(user.sub, dto);
    }

    // ===============================
    // Job Preferences
    // ===============================
    @Get('me/job-preferences')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ดูตำแหน่งงานที่สนใจ' })
    async getJobPreferences(@CurrentUser() user: JwtPayload) {
        return this.usersService.getJobPreferences(user.sub);
    }

    @Put('me/job-preferences')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'บันทึกตำแหน่งงานที่สนใจ (replace all)' })
    async upsertJobPreferences(
        @CurrentUser() user: JwtPayload,
        @Body() dto: UpsertJobPreferenceDto,
    ) {
        return this.usersService.upsertJobPreferences(user.sub, dto.items);
    }
}
