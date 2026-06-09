import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';

const pdfParse = require('pdf-parse');

@Injectable()
export class ResumesService {
    constructor(
        readonly prisma: PrismaService,
        readonly uploadService: UploadService,
        private configService: ConfigService,
    ) { }

    async create(userId: string, title: string) {
        return this.prisma.resume.create({
            data: {
                userId,
                title,
                isPrimary: true,
            },
        });
    }


    async findAllByUser(userId: string) {
        return this.prisma.resume.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const resume = await this.prisma.resume.findUnique({ where: { id } });
        if (!resume) throw new NotFoundException('ไม่พบ Resume');
        return resume;
    }

    async uploadFile(userId: string, file: Express.Multer.File) {
        let resume = await this.prisma.resume.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        const fileNameUtf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
        const displayTitle = fileNameUtf8.replace(/\.pdf$/i, '') || 'My Resume';

        const uploadResult = await this.uploadService.uploadFile({
            file,
            folder: 'resumes',
            prefix: 'resume',
            ownerId: userId,
        });
        const fileUrl = uploadResult.url;

        if (resume) {
            if (resume.fileUrl) {
                await this.uploadService.deleteFileByUrl(resume.fileUrl);
            }

            resume = await this.prisma.resume.update({
                where: { id: resume.id },
                data: {
                    fileUrl,
                    title: displayTitle,
                    parsedData: null,
                    fileHash: null,
                    skills: [],
                    experience: [],
                    education: [],
                    summary: 'ไฟล์ได้รับการอัปเดต - รอการวิเคราะห์ข้อมูลใหม่...',
                },
            });
        } else {
            resume = await this.prisma.resume.create({
                data: {
                    userId,
                    title: displayTitle,
                    fileUrl,
                    isPrimary: true,
                },
            });
        }
        return resume;
    }

    async remove(id: string, userId: string) {
        const resume = await this.prisma.resume.findUnique({ where: { id } });
        if (!resume) throw new NotFoundException('ไม่พบ Resume');
        if (resume.userId !== userId) throw new ForbiddenException('ไม่มีสิทธิ์');

        if (resume.fileUrl) {
            await this.uploadService.deleteFileByUrl(resume.fileUrl);
        }

        await this.prisma.resume.update({
            where: { id },
            data: {
                fileUrl: null,
                title: 'ยังไม่ได้อัปโหลดไฟล์ (ถูกลบโดยผู้สมัคร)',
                parsedData: null,
                fileHash: null,
                skills: [],
                experience: [],
                education: [],
                summary: 'ข้อมูล Resume นี้ถูกลบออกแล้วโดยผู้สมัครงาน',
            },
        });

        return { message: 'ลบไฟล์และล้างข้อมูลเรียบร้อยแล้ว แต่อ้างอิงเดิมยังคงอยู่' };
    }

    private async parseResumeText(text: string) {
        if (!text.trim()) {
            throw new BadRequestException('ไม่พบข้อความในไฟล์ PDF');
        }

        const apiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (!apiKey) {
            throw new InternalServerErrorException('ระบบยังไม่ได้ตั้งค่า GEMINI_API_KEY');
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    responseMimeType: "application/json",
                }
            });

            const prompt = `You are a professional resume parser. Extract information from the following text into a strict JSON format.
        
            REQUIRED JSON STRUCTURE:
            {
                "firstName": "string",
                "lastName": "string",
                "email": "string",
                "phone": "string",
                "skills": ["string"],
                "experience": [{"company": "string", "role": "string", "years": "string"}],
                "education": [{"school": "string", "degree": "string"}],
                "experienceYears": number,
                "currentPosition": "string"
            }

            INSTRUCTION:
            - Return ONLY the JSON object. 
            - For "skills", prioritize and combine:
                1. Technical/Software skills (e.g., Programming, Software Development).
                2. Professional Certifications or Language scores (e.g., TOEIC 980, IELTS 8.6).
                3. Core job-related expertise.
            - LIMIT the total skills to 10-12 most important items.
            - DO NOT include driving licenses or non-professional hobbies.
            - Ensure "currentPosition" reflect the professional title (e.g., Software Developer).

            Resume Text: ${text.substring(0, 10000)}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text();

            // ทำความสะอาดข้อมูลเบื้องต้น เผื่อ AI ใส่ Markdown Backticks มา
            const cleanedResponse = responseText
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .trim();

            try {
                // พยายามหา JSON ภายใน String อีกครั้งเพื่อความชัวร์
                const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
                if (!jsonMatch) throw new Error('NO_JSON_FOUND');

                return JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error('❌ JSON Parse Error. Raw Output:', responseText);
                throw new Error('FORMAT_ERROR');
            }

        } catch (error: any) {
            console.error('--- Gemini AI Error Details ---');
            console.dir(error, { depth: null });

            let friendlyMessage = 'การวิเคราะห์ล้มเหลว โปรดลองใหม่อีกครั้ง';
            const errMsg = error.message?.toLowerCase() || '';
            const status = error.status || error.response?.status;

            if (status === 429 || errMsg.includes('429') || errMsg.includes('quota')) {
                friendlyMessage = `โควต้าการใช้งาน AI เต็มแล้ว โปรดลองใหม่ในวันพรุ่งนี้`;
            } else if (status === 403 || status === 401) {
                friendlyMessage = 'API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน';
            } else if (errMsg.includes('safety')) {
                friendlyMessage = 'ไฟล์ถูกระงับการวิเคราะห์เนื่องจากนโยบายความปลอดภัยของ AI';
            } else if (errMsg.includes('format_error')) {
                friendlyMessage = 'AI ส่งข้อมูลกลับมาในรูปแบบที่ไม่ถูกต้อง โปรดลองใหม่อีกครั้ง';
            }

            throw new InternalServerErrorException(`AI: ${friendlyMessage}`);
        }
    }

    async parseResume(file: Express.Multer.File) {
        try {
            const data = await (pdfParse as any)(file.buffer);
            return await this.parseResumeText(data.text || '');
        } catch (error) {
            console.error('PDF Parse/AI Error:', error);
            if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new BadRequestException('ไม่สามารถดึงข้อมูลจากไฟล์ PDF ได้ โปรดลองใหม่อีกครั้ง หรือตรวจสอบไฟล์');
        }
    }

    async parseStoredResume(id: string, userId: string) {
        const resume = await this.prisma.resume.findUnique({ where: { id } });
        if (!resume) throw new NotFoundException('ไม่พบ Resume');
        if (resume.userId !== userId) throw new ForbiddenException('ไม่มีสิทธิ์วิเคราะห์ Resume นี้');
        if (!resume.fileUrl) throw new BadRequestException('Resume นี้ยังไม่มีไฟล์ PDF กรุณาอัพโหลดไฟล์ก่อน');

        try {
            const fileBuffer = await this.uploadService.downloadFileBuffer(resume.fileUrl);
            const currentFileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

            if (resume.fileHash === currentFileHash && resume.parsedData) {
                console.log('🚀 [Cache Hit] ไฟล์เดิม ข้อมูลเดิม ดึงจาก DB ทันที');
                return resume.parsedData;
            }

            console.log('🧠 [Cache Miss] กำลังส่งให้ Gemini วิเคราะห์...');
            const data = await (pdfParse as any)(fileBuffer);
            const aiResult = await this.parseResumeText(data.text || '');

            await this.prisma.resume.update({
                where: { id },
                data: {
                    parsedData: aiResult as any,
                    fileHash: currentFileHash,
                    skills: aiResult.skills || [],
                    experience: aiResult.experience || [],
                    education: aiResult.education || [],
                    summary: `Experience: ${aiResult.experienceYears} years, Position: ${aiResult.currentPosition}`,
                }
            });

            return aiResult;
        } catch (error) {
            console.error('Parse Stored Resume Error:', error);
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new BadRequestException('ไม่สามารถวิเคราะห์ไฟล์ Resume ได้ โปรดลองใหม่อีกครั้ง');
        }
    }

    async findAll(userId: string, query: { categoryId?: string; search?: string }) {
        const { categoryId, search } = query;
        const andConditions: any[] = [];

        andConditions.push({ userId });

        if (categoryId) {
            let searchKeyword = '';
            switch (categoryId) {
                case 'tech': searchKeyword = 'เทคโนโลยี'; break;
                case 'sales': searchKeyword = 'ขาย'; break;
                case 'food': searchKeyword = 'อาหาร'; break;
                case 'service': searchKeyword = 'บริการ'; break;
                case 'admin': searchKeyword = 'บริหาร'; break;
                case 'marketing': searchKeyword = 'การตลาด'; break;
                case 'accounting': searchKeyword = 'บัญชี'; break;
            }

            if (searchKeyword) {
                andConditions.push({
                    user: {
                        workHistories: {
                            some: {
                                businessType: {
                                    contains: searchKeyword,
                                    mode: 'insensitive',
                                },
                            },
                        },
                    },
                });
            } else {
                return [];
            }
        }

        if (search) {
            andConditions.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    {
                        user: {
                            OR: [
                                { firstName: { contains: search, mode: 'insensitive' } },
                                { lastName: { contains: search, mode: 'insensitive' } },
                            ]
                        }
                    }
                ],
            });
        }

        const where = { AND: andConditions };

        return this.prisma.resume.findMany({
            where: where,
            include: {
                user: {
                    include: {
                        workHistories: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getHomepageCategories() {
        const allWorkHistory = await this.prisma.workHistory.findMany({
            select: {
                businessType: true,
                userId: true,
            }
        });

        const countCategory = (keyword: string) => {
            const uniqueUsers = new Set(
                allWorkHistory
                    .filter(item =>
                        item.businessType &&
                        item.businessType.includes(keyword)
                    )
                    .map(item => item.userId)
            );
            return uniqueUsers.size;
        };

        const techCount = countCategory('เทคโนโลยี');
        const adminCount = countCategory('บริหาร') + countCategory('ธุรการ');
        const salesCount = countCategory('ขาย');
        const foodCount = countCategory('อาหาร');
        const serviceCount = countCategory('บริการ');

        return {
            sections: [
                {
                    id: 'storefront',
                    items: [
                        { id: 'sales', count: salesCount },
                        { id: 'food', count: foodCount },
                        { id: 'service', count: serviceCount },
                        { id: 'retail', count: 0 },
                    ],
                },
                {
                    id: 'office',
                    items: [
                        { id: 'tech', count: techCount },
                        { id: 'admin', count: adminCount },
                        { id: 'marketing', count: 0 },
                        { id: 'accounting', count: 0 },
                    ],
                },
            ],
        };
    }
}