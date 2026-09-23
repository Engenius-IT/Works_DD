import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateJobDto {
    @ApiProperty({ example: 'Senior Frontend Developer' })
    @IsString()
    @IsNotEmpty()
    @MinLength(5, { message: 'ชื่อตำแหน่งต้องมีอย่างน้อย 5 ตัวอักษร' })
    @MaxLength(200)
    title!: string;

    @ApiProperty({ example: 'รับสมัคร Senior Frontend Developer ที่มีประสบการณ์ React...' })
    @IsString()
    @MinLength(20, { message: 'รายละเอียดงานต้องมีอย่างน้อย 20 ตัวอักษร' })
    description!: string;

    @ApiProperty({ example: 'ประสบการณ์ React 3 ปีขึ้นไป, TypeScript, Next.js' })
    @IsString()
    @MinLength(20, { message: 'คุณสมบัติต้องมีอย่างน้อย 20 ตัวอักษร' })
    requirements!: string;

    @ApiPropertyOptional({ example: ['ประกันสังคม', 'โบนัส', 'WFH 2 วัน/สัปดาห์'] })
    @IsOptional()
    benefits?: any;

    @ApiPropertyOptional({ example: 40000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    salaryMin?: number;

    @ApiPropertyOptional({ example: 80000 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    salaryMax?: number;

    @ApiPropertyOptional({ default: true })
    @IsOptional()
    @IsBoolean()
    salaryVisible?: boolean;

    @ApiProperty({ enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'], example: 'FULL_TIME' })
    @IsEnum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'])
    jobType!: string;

    @ApiProperty({ enum: ['ONSITE', 'REMOTE', 'HYBRID'], example: 'HYBRID' })
    @IsEnum(['ONSITE', 'REMOTE', 'HYBRID'])
    workModel!: string;

    @ApiPropertyOptional({ example: 'กรุงเทพมหานคร' })
    @IsOptional()
    @IsString()
    locationProvince?: string;

    @ApiPropertyOptional({ example: 'วัฒนา' })
    @IsOptional()
    @IsString()
    locationDistrict?: string;

    @ApiPropertyOptional({ description: 'ที่อยู่บริษัท (ข้อความเต็ม)', example: '111 หมู่ 9 อุทยานวิทยาศาสตร์ประเทศไทย ชั้น 2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120' })
    @IsOptional()
    @IsString()
    companyAddress?: string;

    @ApiPropertyOptional({ description: 'ลิงก์แผนที่ Google Map', example: 'https://maps.app.goo.gl/...' })
    @IsOptional()
    @IsString()
    mapUrl?: string;

    @ApiProperty({ example: ['React', 'TypeScript', 'Next.js'], type: [String] })
    @IsArray()
    @IsString({ each: true })
    requiredSkills!: string[];

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    positions?: number;

    @ApiPropertyOptional({ example: '5 วัน/สัปดาห์' })
    @IsOptional()
    @IsString()
    workingDays?: string;

    @ApiPropertyOptional({ example: '09:00' })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiPropertyOptional({ example: '18:00' })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    canOnlineInterview?: boolean;

    @ApiPropertyOptional({ default: false, description: 'สมัครด่วน' })
    @IsOptional()
    @IsBoolean()
    isQuickApply?: boolean;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    welcomeRecentGrads?: boolean;

    @ApiPropertyOptional({
        description: 'วุฒิการศึกษาขั้นต่ำ',
        enum: ['ต่ำกว่ามัธยมศึกษา', 'มัธยมศึกษา', 'ปวช/ปวส', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก'],
        example: 'ปริญญาตรี',
    })
    @IsOptional()
    @IsString()
    education?: string;

    @ApiPropertyOptional({ description: 'สาขาอาชีพ/ตำแหน่งงาน', example: 'งานไอที งานเทคโนโลยีสื่อสาร' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ description: 'ประเภทงานที่อยากทำ', example: 'พัฒนาซอฟต์แวร์' })
    @IsOptional()
    @IsString()
    jobFunction?: string;

    @ApiPropertyOptional({ description: 'เพศที่ต้องการ', example: 'ไม่จำกัดเพศ' })
    @IsOptional()
    @IsString()
    qualificationGender?: string;

    @ApiPropertyOptional({ description: 'อายุขั้นต่ำ', example: 22 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    qualificationAgeMin?: number;

    @ApiPropertyOptional({ description: 'อายุสูงสุด', example: 35 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    qualificationAgeMax?: number;

    @ApiPropertyOptional({ description: 'ประสบการณ์ขั้นต่ำ (ปี)', example: 2 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    qualificationExperience?: number;

    @ApiPropertyOptional({ description: 'คุณสมบัติเพิ่มเติม', example: ['ยินดีรับนักศึกษาจบใหม่'] })
    @IsOptional()
    additionalQualifications?: any;

    @ApiPropertyOptional({ description: 'ชื่อผู้ติดต่อ', example: 'คุณสมชาย' })
    @IsOptional()
    @IsString()
    contactName?: string;

    @ApiPropertyOptional({ description: 'เบอร์ผู้ติดต่อ', example: '081-234-5678' })
    @IsOptional()
    @IsString()
    contactPhone?: string;

    @ApiPropertyOptional({ description: 'การเดินทาง', example: ['BTS', 'MRT'] })
    @IsOptional()
    transportation?: any;

    @ApiPropertyOptional({ description: 'รูปภาพบริษัท (สูงสุด 5 รูป)', example: ['https://your-project-ref.supabase.co/storage/v1/object/public/jobsabuy-assets/images/company-image.webp'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    companyImages?: string[];

    @ApiProperty({ description: 'Company ID ของผู้สร้าง', example: 'uuid-of-company' })
    @IsString()
    @IsNotEmpty()
    companyId!: string;
}
