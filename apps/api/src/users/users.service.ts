import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertEducationDto } from './dto/upsert-education.dto';
import { UpsertWorkHistoryDto } from './dto/upsert-work-history.dto';
import { UpsertLanguagesDto } from './dto/upsert-languages.dto';
import { UpsertCertificatesDto } from './dto/upsert-certificates.dto';

@Injectable()
export class UsersService {
    constructor(
        readonly prisma: PrismaService,
        readonly uploadService: UploadService,
    ) { }

    // ===================================
    // Profile (Personal Info)
    // ===================================
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                phone: true,
                avatarUrl: true,
                profile: true,
                drivingSkills: true,
                workHistories: {
                    select: {
                        id: true,
                        company: true,
                        businessType: true,
                        position: true,
                        jobType: true,
                        startYear: true,
                        endYear: true,
                        isCurrent: true,
                    },
                    orderBy: { createdAt: 'desc' }
                },
            },
        });

        if (!user) return null;

        const { profile, ...userData } = user;
        return {
            ...userData,
            ...(profile || {}),
            isPublic: profile?.isPublic ?? true,
        };
    }

    async upsertProfile(userId: string, dto: UpdateProfileDto) {
        const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            throw new NotFoundException('ไม่พบผู้ใช้ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่');
        }

        const data: any = {
            gender: dto.gender,
            phone: dto.phone,
            lineId: dto.lineId,
            nationality: dto.nationality,
            maritalStatus: dto.maritalStatus,
            militaryStatus: dto.militaryStatus,
            address: dto.address,
            province: dto.province,
            district: dto.district,
            subDistrict: dto.subDistrict,
            postalCode: dto.postalCode,
            experience: dto.experience !== undefined ? Number(dto.experience) : undefined,
            religion: dto.religion,
            expectedSalary: dto.expectedSalary !== undefined ? Number(dto.expectedSalary) : undefined,
        };

        if (dto.isPublic !== undefined) {
            data.isPublic = dto.isPublic;
        }

        if (dto.birthDate) {
            data.birthDate = new Date(dto.birthDate);
        }
        if (dto.height !== undefined && dto.height !== null) {
            data.height = dto.height;
        }
        if (dto.weight !== undefined && dto.weight !== null) {
            data.weight = dto.weight;
        }

        const profile = await this.prisma.userProfile.upsert({
            where: { userId },
            create: { userId, ...data },
            update: data,
        });
        return profile;
    }

    // ===================================
    // Desired Provinces (สถานที่ที่ต้องการทำงาน)
    // ===================================
    async getDesiredProvinces(userId: string) {
        return this.prisma.desiredProvince.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async upsertDesiredProvinces(userId: string, provinces: string[]) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            // ลบของเก่าทั้งหมด (ท่ายอดนิยมสำหรับ Array/Multiple Select)
            await this.prisma.desiredProvince.deleteMany({ where: { userId } });

            if (!provinces || provinces.length === 0) return [];

            // กรองค่าว่างและบันทึกใหม่
            const validProvinces = provinces.filter(p => p && p.trim() !== '');

            const created = await Promise.all(
                validProvinces.map((provinceName) =>
                    this.prisma.desiredProvince.create({
                        data: {
                            userId,
                            provinceName,
                        },
                    }),
                ),
            );
            return created;
        } catch (error) {
            console.error('Service: upsertDesiredProvinces Error', error);
            throw error;
        }
    }

    // ===================================
    // Education
    // ===================================
    async getEducations(userId: string) {
        return this.prisma.education.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async upsertEducations(userId: string, dto: UpsertEducationDto) {
        console.log('Service: upsertEducations called for user', userId);
        console.log('Service: payload', JSON.stringify(dto));

        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                console.error('Service: User not found', userId);
                throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');
            }

            if (!dto.items || !Array.isArray(dto.items)) {
                console.warn('Service: Items is not an array or undefined', dto.items);
                return [];
            }

            await this.prisma.education.deleteMany({ where: { userId } });

            if (dto.items.length === 0) return [];

            const validItems = dto.items.filter(item => item.institution && item.institution.trim() !== '');

            if (validItems.length === 0) return [];

            const created = await Promise.all(
                validItems.map((item) => {
                    const graduationYear = (item.graduationYear != null && !isNaN(Number(item.graduationYear)))
                        ? Math.round(Number(item.graduationYear))
                        : null;
                    const gpa = (item.gpa != null && !isNaN(Number(item.gpa)))
                        ? Number(item.gpa)
                        : null;

                    return this.prisma.education.create({
                        data: {
                            userId,
                            institution: item.institution,
                            faculty: item.faculty || null,
                            major: item.major || null,
                            educationLevel: item.educationLevel || null,
                            degreeName: item.degreeName || null,
                            graduationYear,
                            gpa,
                            hasHonors: item.hasHonors ?? false,
                        },
                    });
                }),
            );
            return created;
        } catch (error: any) {
            console.error('Service: upsertEducations Error DETAILS:', JSON.stringify(error, null, 2));
            console.error('Service: upsertEducations Error Message:', error?.message);
            console.error('Service: upsertEducations Error Stack:', error?.stack);
            console.error('Service: upsertEducations Error Code:', error?.code);
            throw error; // Re-throw to be handled by global filter
        }
    }

    // ===================================
    // Work History
    // ===================================
    async getWorkHistories(userId: string) {
        return this.prisma.workHistory.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async upsertWorkHistories(userId: string, dto: UpsertWorkHistoryDto) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            if (!dto.items || !Array.isArray(dto.items)) return [];

            const validItems = dto.items.filter(item => item.company && item.company.trim() !== '');

            await this.prisma.workHistory.deleteMany({ where: { userId } });

            if (validItems.length === 0) return [];

            const created = await Promise.all(
                validItems.map((item) =>
                    this.prisma.workHistory.create({
                        data: {
                            userId,
                            company: item.company,
                            businessType: item.businessType,
                            position: item.position,
                            jobType: item.jobType,
                            startMonth: item.startMonth,
                            startYear: item.startYear,
                            endMonth: item.endMonth,
                            endYear: item.endYear,
                            isCurrent: item.isCurrent ?? false,
                        },
                    }),
                ),
            );
            return created;
        } catch (error) {
            console.error('Service: upsertWorkHistories Error', error);
            throw error;
        }
    }

    // ===================================
    // Languages + Tests
    // ===================================
    async getLanguages(userId: string) {
        const [languages, tests] = await Promise.all([
            this.prisma.userLanguage.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.languageTest.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        return { languages, tests };
    }

    async upsertLanguages(userId: string, dto: UpsertLanguagesDto) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            const validLangs = (dto.languages || []).filter(l => l.language && l.language.trim() !== '');
            const validTests = (dto.tests || []).filter(t => t.testName && t.testName.trim() !== '');

            await Promise.all([
                this.prisma.userLanguage.deleteMany({ where: { userId } }),
                this.prisma.languageTest.deleteMany({ where: { userId } }),
            ]);

            const [languages, tests] = await Promise.all([
                validLangs.length > 0 ? Promise.all(
                    validLangs.map((item) =>
                        this.prisma.userLanguage.create({
                            data: {
                                userId,
                                language: item.language,
                                level: item.level || null,
                                speaking: item.speaking || null,
                                reading: item.reading || null,
                                writing: item.writing || null,
                            },
                        }),
                    ),
                ) : [],
                validTests.length > 0 ? Promise.all(
                    validTests.map((item) =>
                        this.prisma.languageTest.create({
                            data: {
                                userId,
                                testName: item.testName,
                                score: item.score,
                                fileUrl: item.fileUrl || null,
                            },
                        }),
                    ),
                ) : [],
            ]);

            return { languages, tests };
        } catch (error) {
            console.error('Service: upsertLanguages Error', error);
            throw error;
        }
    }

    // ===================================
    // Driving Skills
    // ===================================
    async getDrivingSkills(userId: string) {
        return this.prisma.drivingSkill.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async upsertDrivingSkills(userId: string, skills: string[]) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            await this.prisma.drivingSkill.deleteMany({ where: { userId } });

            if (!skills || skills.length === 0) return [];

            const created = await Promise.all(
                skills.map((skillType) =>
                    this.prisma.drivingSkill.create({
                        data: {
                            userId,
                            skillType,
                            category: 'DRIVING',
                        },
                    }),
                ),
            );
            return created;
        } catch (error) {
            console.error('Service: upsertDrivingSkills Error', error);
            throw error;
        }
    }

    // ===================================
    // Certificates
    // ===================================
    async getCertificates(userId: string) {
        return this.prisma.certificate.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async upsertCertificates(userId: string, dto: UpsertCertificatesDto) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            if (!dto.items || !Array.isArray(dto.items)) return [];

            const validItems = dto.items.filter(item => item.name && item.name.trim() !== '');

            await this.prisma.certificate.deleteMany({ where: { userId } });

            if (validItems.length === 0) return [];

            const created = await Promise.all(
                validItems.map((item) =>
                    this.prisma.certificate.create({
                        data: {
                            userId,
                            name: item.name,
                            issuedBy: item.issuedBy,
                            issueYear: item.issueYear,
                            imageUrl: item.imageUrl,
                        },
                    }),
                ),
            );
            return created;
        } catch (error) {
            console.error('Service: upsertCertificates Error', error);
            throw error;
        }
    }

    // ===================================
    // Avatar Upload
    // ===================================
    async uploadAvatar(userId: string, file: Express.Multer.File) {
        if (!file) {
            throw new NotFoundException('ไม่พบไฟล์รูปภาพ');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('ไม่พบผู้ใช้');
        }

        const oldAvatarUrl = user.avatarUrl;
        const uploadResult = await this.uploadService.uploadFile({
            file,
            folder: 'avatars',
            prefix: 'avatar',
            ownerId: userId,
        });
        const avatarUrl = uploadResult.url;

        await this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });

        if (oldAvatarUrl) {
            try {
                await this.uploadService.deleteFileByUrl(oldAvatarUrl);
            } catch (err) {
                console.error('Failed to delete old avatar:', err);
            }
        }

        return { avatarUrl };
    }

    // ===================================
    // Job Preference (Desired Job)
    // ===================================
    async getJobPreferences(userId: string) {
        return this.prisma.jobPreference.findMany({
            where: { userId },
            orderBy: { order: 'asc' },
        });
    }

    async upsertJobPreferences(userId: string, items: { position: string, jobType?: string }[]) {
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) throw new NotFoundException('ไม่พบผู้ใช้ กรุณา Login ใหม่');

            const validItems = items.filter(item => item.position && item.position.trim() !== '');

            await this.prisma.jobPreference.deleteMany({ where: { userId } });

            if (validItems.length === 0) return [];

            const created = await Promise.all(
                validItems.map((item, index) =>
                    this.prisma.jobPreference.create({
                        data: {
                            userId,
                            position: item.position,
                            jobType: item.jobType,
                            order: index,
                        },
                    }),
                ),
            );
            return created;
        } catch (error) {
            console.error('Service: upsertJobPreferences Error', error);
            throw error;
        }
    }

    // ===================================
    // Candidate Directory
    // ===================================
    async getCandidateDirectory(filters: {

        query?: string;
        province?: string;
        gender?: string;
        ageMin?: string;
        ageMax?: string;
        skills?: string;
        educationLevel?: string;
        minGpa?: string;
        institution?: string;
        language?: string;
        languageLevel?: string;
        englishLevel?: string;
        businessType?: string;
        currentUserId?: string;
        desiredProvinces?: string,
        faculty?: string;
        major?: string;
        jobType?: string;
    }) {
        const { currentUserId, ...otherFilters } = filters;
        const users = await this.prisma.user.findMany({
            where: {
                role: 'JOBSEEKER',
                profile: {
                    isPublic: true,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
                desiredProvinces: true,
                resumes: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                educations: {
                    orderBy: [{ graduationYear: 'desc' }, { createdAt: 'desc' }],
                },
                workHistories: {
                    orderBy: { createdAt: 'desc' },
                },
                languages: {
                    orderBy: { createdAt: 'desc' },
                },
                languageTests: {
                    orderBy: { createdAt: 'desc' },
                },
                jobPreferences: {
                    orderBy: { order: 'asc' },
                },
                drivingSkills: true,
                bookmarks: currentUserId ? {
                    where: {
                        employerId: currentUserId
                    },
                    select: { id: true }
                } : undefined,
            },
        });


        return users
            .map((user) => {
                const summary = this.mapCandidateSummary(user);
                const isBookmarked = !!(user as any).bookmarks?.length;
                return {
                    ...summary,
                    isBookmarked
                };
            })
            .filter((candidate) => this.matchesCandidateFilters(candidate, otherFilters))
            .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }

    async getCandidateDirectoryDetail(candidateId: string, currentUserId?: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: candidateId,
                role: 'JOBSEEKER',
                profile: {
                    isPublic: true,
                },
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
                desiredProvinces: true,
                resumes: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                educations: {
                    orderBy: [{ graduationYear: 'desc' }, { createdAt: 'desc' }],
                },
                workHistories: {
                    orderBy: { createdAt: 'desc' },
                },
                languages: {
                    orderBy: { createdAt: 'desc' },
                },
                languageTests: {
                    orderBy: { createdAt: 'desc' },
                },
                jobPreferences: {
                    orderBy: { order: 'asc' },
                },
                drivingSkills: true,
            },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบข้อมูลผู้หางาน');
        }

        let isUnlocked = false;
        let contactInfo = {};
        if (currentUserId) {
            const unlockRecord = await this.prisma.unlockedCandidate.findUnique({
                where: {
                    employerId_candidateId: {
                        employerId: currentUserId,
                        candidateId: candidateId,
                    },
                },
            });
            const hasApplied = await this.prisma.application.findFirst({
                where: {
                    userId: candidateId,
                    job: { company: { ownerId: currentUserId } }
                }
            });

            if (unlockRecord || hasApplied) {
                isUnlocked = true;
                contactInfo = {
                    email: user.email,
                    phone: user.phone || user.profile?.phone,
                    lineId: user.profile?.lineId,
                };
            }
        }

        const mappedData = await this.mapCandidateDetail(user);
        return {
            ...mappedData,
            isUnlocked,
            ...contactInfo,
        };
    }



    async getCandidateContact(
        candidateId: string,
        requester: { sub: string; role: string },
        confirmUseCC: boolean = false
    ) {
        if (requester.role !== 'EMPLOYER') {
            throw new ForbiddenException('เฉพาะบัญชีนายจ้างเท่านั้นที่สามารถดูข้อมูลติดต่อได้');
        }

        const employerId = requester.sub;

        // 1. เช็คเงื่อนไขดูฟรี (เหมือนเดิม)
        const hasApplied = await this.prisma.application.findFirst({
            where: {
                userId: candidateId,
                job: { company: { ownerId: employerId } }
            }
        });

        const isAlreadyUnlocked = await this.prisma.unlockedCandidate.findUnique({
            where: {
                employerId_candidateId: { employerId, candidateId }
            }
        });

        if (hasApplied || isAlreadyUnlocked) {
            return this.fetchCandidateContactData(candidateId);
        }

        if (!confirmUseCC) {
            throw new HttpException('ต้องใช้ 1 CC ในการปลดล็อกข้อมูลติดต่อ', HttpStatus.PAYMENT_REQUIRED);
        }

        // 4. กรณีเช็คโควตารายวัน ตามเวลา startDate
        const company = await this.prisma.company.findFirst({
            where: { ownerId: employerId },
        });

        if (!company) throw new BadRequestException('ไม่พบข้อมูลบริษัทของท่าน');

        const pkg = await this.prisma.companyPackage.findUnique({
            where: { companyId: company.id }
        });

        if (!pkg || !pkg.startDate) throw new BadRequestException('ไม่พบข้อมูลแพ็กเกจการใช้งาน');

        // --- เริ่ม Logic การคำนวณรอบ 24 ชม. ตามเวลาที่ซื้อ ---
        const now = new Date();
        const purchaseDate = new Date(pkg.startDate);

        // สร้างเวลา "จุดรีเซ็ตของวันนี้" โดยอิง ชั่วโมง:นาที:วินาที จาก startDate
        const resetToday = new Date(now);
        resetToday.setHours(purchaseDate.getHours(), purchaseDate.getMinutes(), purchaseDate.getSeconds(), purchaseDate.getMilliseconds());

        let lastResetPoint: Date;
        if (now >= resetToday) {
            // ถ้าตอนนี้เลยเวลาซื้อของวันนี้ไปแล้ว จุดรีเซ็ตล่าสุดคือ "วันนี้"
            lastResetPoint = resetToday;
        } else {
            // ถ้าตอนนี้ยังไม่ถึงเวลาซื้อของวันนี้ จุดรีเซ็ตล่าสุดคือ "เมื่อวาน"
            lastResetPoint = new Date(resetToday);
            lastResetPoint.setDate(lastResetPoint.getDate() - 1);
        }

        // นับจำนวนที่ปลดล็อกไปแล้วในรอบ 24 ชม. ล่าสุด
        const usedInCycle = await this.prisma.unlockedCandidate.count({
            where: {
                employerId: employerId,
                unlockedAt: { gte: lastResetPoint }
            }
        });

        const maxQuota = pkg.ccQuotaTotal + (pkg.bonusQuotaCC || 0);

        // ดักโควตาเต็ม
        if (usedInCycle >= maxQuota) {
            const nextResetPoint = new Date(lastResetPoint);
            nextResetPoint.setDate(nextResetPoint.getDate() + 1);

            const diffMs = nextResetPoint.getTime() - now.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            throw new HttpException({
                statusCode: HttpStatus.BAD_REQUEST,
                message: `ขออภัยคุณใช้งานโควต้าหมดแล้ว กรุณารออีก ${hours} ชม. ${minutes} น. เพื่อใช้งานอีกครั้ง`,
                resetIn: { hours, minutes },
                resetAt: purchaseDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }, HttpStatus.BAD_REQUEST);
        }

        // 5. Transaction: บันทึกและอัปเดตตัวเลข
        await this.prisma.$transaction([
            this.prisma.unlockedCandidate.create({
                data: {
                    employerId: employerId,
                    candidateId: candidateId,
                    unlockedAt: new Date()
                }
            }),
            this.prisma.companyPackage.update({
                where: { id: pkg.id },
                data: { ccQuotaUsed: usedInCycle + 1 }
            })
        ]);



        return this.fetchCandidateContactData(candidateId);
    }

    private async fetchCandidateContactData(candidateId: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                id: candidateId,
                role: 'JOBSEEKER'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                // ดึงข้อมูลเบอร์โทรและ Line จาก UserProfile มาสำรองด้วย
                profile: {
                    select: {
                        phone: true,
                        lineId: true
                    }
                },
            },
        });

        if (!user) {
            throw new NotFoundException('ไม่พบข้อมูลผู้หางาน');
        }

        return {
            id: user.id,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email || '-',
            phone: user.phone || user.profile?.phone || '-',
            lineId: user.profile?.lineId || '-',
            isUnlocked: true,
        };
    }

    private mapCandidateSummary(user: any) {
        const primaryResume = user.resumes?.[0] || null;
        const highestEducation = this.getHighestEducation(user.educations || []);
        const latestWork = this.getLatestWorkHistory(user.workHistories || []);
        const skills = this.getCandidateSkills(user, primaryResume);
        const age = this.calculateAge(user.profile?.birthDate);
        const english = this.getEnglishLevelSummary(user.languages || [], user.languageTests || []);
        const allBusinessTypes = (user.workHistories || []).map((w: any) => w.businessType).filter(Boolean);
        const drivingSkills = (user.drivingSkills || []).map((s: any) => s.skillType);
        const desiredProvinces = (user.desiredProvinces || []).map((p: any) => p.provinceName);

        const preferences = user.jobPreferences || [];
        const preferredJobTypes = preferences.map((p: any) => p.jobType).filter(Boolean);
        const desiredPosition = preferences.length > 0
            ? preferences.map((p: any) => p.position).join(', ')
            : (latestWork?.position || primaryResume?.title || 'ผู้หางาน');

        const profileSalary = user.profile?.expectedSalary
            ? `${Number(user.profile.expectedSalary).toLocaleString()} บาท`
            : null;

        const resumeSalary = !profileSalary
            ? this.tryExtractSalaryFromText(primaryResume?.summary)
            : null;
        const expectedSalaryText = profileSalary || resumeSalary || 'ไม่ระบุ';

        const fullName = `${user.firstName} ${user.lastName}`.trim();

        return {
            id: user.id,
            fullName,
            gender: user.profile?.gender || 'ไม่ระบุ',
            age,
            desiredPosition,
            experience: user.profile?.experience ?? 0,
            expectedSalaryText,
            educationLevel: highestEducation?.educationLevel || highestEducation?.degreeName || 'ไม่ระบุ',
            major: highestEducation?.major || highestEducation?.faculty || 'ไม่ระบุ',
            province: user.profile?.province || 'ไม่ระบุ',
            district: user.profile?.district || '',
            subDistrict: user.profile?.subDistrict || '',
            postalCode: user.profile?.postalCode || '',
            postedAt: (primaryResume?.createdAt || user.updatedAt || user.createdAt).toISOString(),
            skills,
            institution: highestEducation?.institution || 'ไม่ระบุ',
            educationHistory: (user.educations || []).map((edu: any) => ({
                faculty: edu.faculty || '',
                major: edu.major || ''
            })),
            gpa: highestEducation?.gpa ?? null,
            englishLevelLabel: english.label,
            englishLevelScore: english.score,
            languages: user.languages || [],
            candidateType: 'ผู้หางาน',
            avatarUrl: user.avatarUrl || null,
            businessTypes: allBusinessTypes,
            drivingSkills,
            desiredProvinces,
            religion: user.profile?.religion || '-',
            expectedSalary: user.profile?.expectedSalary || null,
            jobTypes: preferredJobTypes,
        };
    }

    private mapCandidateDetail(user: any) {
        const summary = this.mapCandidateSummary(user);
        const english = this.getEnglishLevelSummary(user.languages || [], user.languageTests || []);

        return {
            ...summary,
            nationality: user.profile?.nationality || 'ไม่ระบุ',
            religion: user.profile?.religion || '-',
            workProvince: user.profile?.province || 'ไม่ระบุ',
            workDistrict: user.profile?.district || '',
            workSubDistrict: user.profile?.subDistrict || '',
            workpostalCode: user.profile?.postalCode || '',
            languages: user.languages || [],
            languageTests: user.languageTests || [],
            educationHistory: (user.educations || []).map((education: any) => ({
                id: education.id,
                educationLevel: education.educationLevel || '-',
                degreeName: education.degreeName || '-',
                major: education.major || '-',
                faculty: education.faculty || '-',
                institution: education.institution || '-',
                graduationYear: education.graduationYear || '-',
                gpa: education.gpa ?? null,
            })),
            workHistory: (user.workHistories || []).map((work: any) => ({
                id: work.id,
                position: work.position || '-',
                company: work.company || '-',
                businessType: work.businessType || '-',
                startMonth: work.startMonth || '-',
                startYear: work.startYear || '-',
                endMonth: work.endMonth || '-',
                endYear: work.endYear || '-',
                isCurrent: !!work.isCurrent,
            })),
            englishLevelLabel: english.label,
            englishStars: english.stars,
            englishDetails: english.details,
            resumeFileUrl: user.resumes?.[0]?.fileUrl || null,
            drivingSkills: (user.drivingSkills || []).map((s: any) => s.skillType),
        };
    }


    private matchesCandidateFilters(candidate: any, filters: {
        query?: string;
        province?: string;
        gender?: string;
        ageMin?: string;
        ageMax?: string;
        skills?: string;
        educationLevel?: string;
        minGpa?: string;
        institution?: string;
        language?: string;
        languageLevel?: string;
        englishLevel?: string;
        businessType?: string;
        faculty?: string;
        major?: string;
        jobType?: string;
    }) {
        const langMap: Record<string, string[]> = {
            'japanese': ['japanese', 'ญี่ปุ่น', 'n1', 'n2', 'n3', 'n4', 'n5'],
            'chinese': ['chinese', 'จีน', 'hsk', 'แมนดาริน', 'mandarin'],
            'english': ['english', 'อังกฤษ', 'toeic', 'ielts'],
            'korean': ['korean', 'เกาหลี', 'topik'],
            'ภาษาญี่ปุ่น': ['japanese', 'ญี่ปุ่น', 'n1', 'n2', 'n3', 'n4', 'n5'],
            'ภาษาจีน': ['chinese', 'จีน', 'hsk', 'แมนดาริน', 'mandarin'],
            'ภาษาอังกฤษ': ['english', 'อังกฤษ', 'toeic', 'ielts'],
            'ภาษาเกาหลี': ['korean', 'เกาหลี', 'topik']
        };

        const query = this.normalizeText(filters.query);
        const province = this.normalizeText(filters.province);
        const gender = this.normalizeText(filters.gender);
        const educationLevel = this.normalizeText(filters.educationLevel);
        const institution = this.normalizeText(filters.institution);
        const businessType = this.normalizeText(filters.businessType);
        const englishLevelFilter = this.normalizeText(filters.englishLevel);
        const facultyFilter = this.normalizeText(filters.faculty); // เพิ่มการ Normalize
        const majorFilter = this.normalizeText(filters.major);
        const jobTypeFilter = this.normalizeText(filters.jobType);

        const rawLangFilter = filters.language || "";
        const rawLevelFilter = filters.languageLevel || "";

        const workBusinessTypes = (candidate.businessTypes || []).join(' ');
        const ageMin = Number(filters.ageMin);
        const ageMax = Number(filters.ageMax);
        const minGpa = Number(filters.minGpa);

        const skillKeywords = (filters.skills || '')
            .split(',')
            .map((item) => this.normalizeText(item))
            .filter(Boolean);

        const searchableText = this.normalizeText([
            candidate.fullName,
            candidate.desiredPosition,
            candidate.major,
            candidate.educationLevel,
            candidate.province,
            candidate.institution,
            workBusinessTypes,
            ...(candidate.skills || []),
        ].join(' '));

        if (query && !searchableText.includes(query)) return false;


        if (businessType) {
            const hasMatchingBusiness = (candidate.workHistory || []).some((work: any) =>
                this.normalizeText(work.businessType).includes(businessType)
            );
            if (!hasMatchingBusiness) return false;
        }

        if (province && !this.normalizeText(candidate.province).includes(province)) return false;
        if (province) {
            const currentProvince = this.normalizeText(candidate.province || '');
            const desiredProvinces = (candidate.desiredProvinces || []).map((p: string) => this.normalizeText(p));

            const isCurrentMatch = currentProvince.includes(province);
            const isDesiredMatch = desiredProvinces.some((p: string) => p.includes(province));

            if (!isCurrentMatch && !isDesiredMatch) return false;
        }
        if (gender && !this.normalizeText(candidate.gender).includes(gender)) return false;
        if (!Number.isNaN(ageMin) && ageMin > 0 && (candidate.age == null || candidate.age < ageMin)) return false;
        if (!Number.isNaN(ageMax) && ageMax > 0 && (candidate.age == null || candidate.age > ageMax)) return false;

        if (skillKeywords.length > 0) {
            const normalizedSkills = (candidate.skills || []).map((skill: string) => this.normalizeText(skill));
            const hasMatchingSkill = skillKeywords.some((keyword) => normalizedSkills.some((skill: string) => skill.includes(keyword)));
            if (!hasMatchingSkill) return false;
        }

        if (educationLevel && !this.normalizeText(candidate.educationLevel).includes(educationLevel)) return false;
        if (!Number.isNaN(minGpa) && minGpa > 0 && (candidate.gpa == null || Number(candidate.gpa) < minGpa)) return false;
        if (institution && !this.normalizeText(candidate.institution).includes(institution)) return false;

        if (rawLangFilter) {
            const terms = langMap[rawLangFilter.toLowerCase()] || [rawLangFilter.toLowerCase()];
            const cleanTerms = terms.map(t => t.toLowerCase().trim());

            const hasInLangObject = (candidate.languages || []).some((l: any) => {
                const name = (l.language || '').toLowerCase();
                return cleanTerms.some(term => name.includes(term));
            });

            if (!hasInLangObject) return false;
        }

        if (rawLevelFilter) {
            const filterLvl = rawLevelFilter.trim().toLowerCase();
            const hasLevelMatch = (candidate.languages || []).some((l: any) => {
                const dbLevel = (l.level || '').toLowerCase();
                const dbLang = (l.language || '').toLowerCase();
                if (rawLangFilter) {
                    const terms = langMap[rawLangFilter.toLowerCase()] || [rawLangFilter.toLowerCase()];
                    if (!terms.some(term => dbLang.includes(term.toLowerCase()))) return false;
                }
                return dbLevel.includes(filterLvl);
            });
            if (!hasLevelMatch) return false;
        }

        if (englishLevelFilter) {
            const requiredScore = this.mapEnglishLevelFilterToScore(filters.englishLevel || "");
            if ((candidate.englishLevelScore || 0) < requiredScore) return false;
        }

        if (facultyFilter) {
            const hasMatchingFaculty = (candidate.educationHistory || []).some((edu: any) =>
                this.normalizeText(edu.faculty).includes(facultyFilter)
            );
            if (!hasMatchingFaculty) return false;
        }

        if (majorFilter) {
            const hasMatchingMajor = (candidate.educationHistory || []).some((edu: any) =>
                this.normalizeText(edu.major).includes(majorFilter)
            );
            if (!hasMatchingMajor) return false;
        }

        if (jobTypeFilter) {
            const hasMatchingJobType = (candidate.jobTypes || []).some((jt: string) =>
                this.normalizeText(jt).includes(jobTypeFilter)
            );

            if (!hasMatchingJobType) return false;
        }

        return true;
    }

    private calculateAge(birthDate?: Date | null) {
        if (!birthDate) return null;

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        return age;
    }

    private getHighestEducation(educations: any[]) {
        const rankMap: Record<string, number> = {
            ประถมศึกษา: 1,
            มัธยมศึกษา: 2,
            ปวช: 3,
            ปวส: 4,
            อนุปริญญา: 5,
            ปริญญาตรี: 6,
            ปริญญาโท: 7,
            ปริญญาเอก: 8,
        };

        return [...educations].sort((a, b) => {
            const rankA = rankMap[a.educationLevel || ''] || 0;
            const rankB = rankMap[b.educationLevel || ''] || 0;
            if (rankA !== rankB) return rankB - rankA;
            return Number(b.graduationYear || 0) - Number(a.graduationYear || 0);
        })[0] || null;
    }

    private getLatestWorkHistory(workHistories: any[]) {
        const currentWork = workHistories.find((work) => work.isCurrent);
        if (currentWork) return currentWork;
        return workHistories[0] || null;
    }

    private getCandidateSkills(user: any, primaryResume: any) {
        const resumeSkills = Array.isArray(primaryResume?.skills)
            ? primaryResume.skills.filter((skill: unknown) => typeof skill === 'string')
            : [];
        const workSkills = (user.workHistories || []).map((work: any) => work.position).filter(Boolean);
        const languageSkills = (user.languages || []).map((language: any) => language.language).filter(Boolean);
        const educationSkills = (user.educations || []).flatMap((education: any) => [education.major, education.faculty]).filter(Boolean);

        return Array.from(new Set([...resumeSkills, ...workSkills, ...languageSkills, ...educationSkills])).slice(0, 12);
    }

    private getEnglishLevelSummary(languages: any[], tests: any[]) {
        const englishLanguage = languages.find((language) => {
            const normalized = this.normalizeText(language.language);
            return normalized.includes('english') || normalized.includes('อังกฤษ');
        });

        const details = [englishLanguage?.level, englishLanguage?.speaking, englishLanguage?.reading, englishLanguage?.writing]
            .filter(Boolean)
            .join(' / ');
        const score = this.mapEnglishTextToScore(details || tests.map((test) => test.testName).join(' '));

        return {
            score,
            stars: score,
            label: this.mapEnglishScoreToLabel(score),
            details: details || 'ไม่ระบุ',
        };
    }

    private mapEnglishTextToScore(value?: string) {
        const normalized = this.normalizeText(value);

        if (!normalized) return 0;
        if (normalized.includes('excellent') || normalized.includes('ยอดเยี่ยม') || normalized.includes('ดีมาก')) return 5;
        if (normalized.includes('very good') || normalized.includes('good') || normalized.includes('ดี')) return 4;
        if (normalized.includes('fair') || normalized.includes('พอใช้') || normalized.includes('ปานกลาง')) return 3;
        if (normalized.includes('basic') || normalized.includes('เล็กน้อย') || normalized.includes('พื้นฐาน')) return 2;
        return 1;
    }

    private mapEnglishScoreToLabel(score: number) {
        if (score >= 5) return 'ดีมาก';
        if (score >= 4) return 'ดี';
        if (score >= 3) return 'พอใช้';
        if (score >= 2) return 'พื้นฐาน';
        return 'ไม่ระบุ';
    }

    private mapEnglishLevelFilterToScore(value: string) {
        const normalized = this.normalizeText(value);
        if (!normalized) return 0;
        if (normalized.includes('ดีมาก')) return 5;
        if (normalized.includes('ดี')) return 4;
        if (normalized.includes('พอใช้')) return 3;
        if (normalized.includes('พื้นฐาน')) return 2;
        return 1;
    }

    private normalizeText(value?: string | null) {
        return (value || '').trim().toLowerCase();
    }

    // ===================================
    // Helpers
    // ===================================
    async findById(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    private tryExtractSalaryFromText(summary?: string | null): string | null {
        if (!summary) return null;
        const rangeMatch = summary.match(/(\d{4,6})\s*[-–]\s*(\d{4,6})/);
        if (rangeMatch) return `${Number(rangeMatch[1]).toLocaleString()}-${Number(rangeMatch[2]).toLocaleString()} บาท`;
        const singleMatch = summary.match(/(\d{4,6})/);
        if (singleMatch) return `${Number(singleMatch[1]).toLocaleString()} บาท`;
        return null;
    }
}
