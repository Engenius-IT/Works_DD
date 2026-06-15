import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus, } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { getRegionProvinces, REGION_PROVINCES } from './job-regions';

type HomeCategoryItem = {
  id: string;
  title: string;
  count: number;
  href: string;
};

type HomeCategorySection = {
  id: string;
  title: string;
  items: HomeCategoryItem[];
};

type AllGroupCategoryItem = {
  id: string;
  name: string;
  count: number;
  href: string;
};

type AllGroupCategorySection = {
  id: string;
  title: string;
  subtitle: string;
  items: AllGroupCategoryItem[];
};

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Create a new job listing
   */
  async create(dto: CreateJobDto, userId: string) {
    // Verify the user owns the company
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException('ไม่พบบริษัท');
    }

    if (company.ownerId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์โพสต์งานในบริษัทนี้');
    }

    // Generate slug from title
    const slug = this.generateSlug(dto.title);

    const createData: any = {
      title: dto.title,
      slug,
      description: dto.description,
      requirements: dto.requirements,
      benefits: dto.benefits,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryVisible: dto.salaryVisible ?? true,
      jobType: dto.jobType as any,
      workModel: dto.workModel as any,
      locationProvince: dto.locationProvince,
      locationDistrict: dto.locationDistrict,
      companyAddress: dto.companyAddress,
      mapUrl: dto.mapUrl,
      requiredSkills: dto.requiredSkills,
      positions: dto.positions,
      workingDays: dto.workingDays,
      startTime: dto.startTime,
      endTime: dto.endTime,
      canOnlineInterview: dto.canOnlineInterview ?? false,
      isQuickApply: dto.isQuickApply ?? false,
      welcomeRecentGrads: dto.welcomeRecentGrads ?? false,
      education: dto.education,
      category: dto.category,
      jobFunction: dto.jobFunction,
      qualificationGender: dto.qualificationGender,
      qualificationAgeMin: dto.qualificationAgeMin,
      qualificationAgeMax: dto.qualificationAgeMax,
      qualificationExperience: dto.qualificationExperience,
      additionalQualifications: dto.additionalQualifications,
      contactName: dto.contactName,
      contactPhone: dto.contactPhone,
      transportation: dto.transportation,
      companyImages: dto.companyImages,
      companyId: dto.companyId,
      status: 'DRAFT',
    };
    const job = await this.prisma.job.create({
      data: createData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
    });

    return job;
  }

  /**
   * List all active jobs with pagination
   */
  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      jobType?: string;
      workModel?: string;
      province?: string;
      region?: string;
      status?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    // Default to ACTIVE jobs for public listing
    where.status = filters?.status || 'ACTIVE';

    if (filters?.jobType) where.jobType = filters.jobType;
    if (filters?.workModel) where.workModel = filters.workModel;
    const regionProvinces = getRegionProvinces(filters?.region);
    if (filters?.province && regionProvinces?.includes(filters.province)) where.locationProvince = filters.province;
    else if (regionProvinces?.length) where.locationProvince = { in: regionProvinces };
    else if (filters?.province) where.locationProvince = filters.province;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
              verificationStatus: true,
            },
          },
          _count: { select: { savedBy: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHomepageCategories() {
    const sectionConfigs: Array<{
      id: string;
      title: string;
      items: Array<{
        id: string;
        title: string;
        href: string;
        where: any;
      }>;
    }> = [
        {
          id: 'storefront',
          title: 'งานสาขาหน้าร้าน',
          items: [
            {
              id: 'sales',
              title: 'งานขาย',
              href: '/jobs?category=' + encodeURIComponent('งานขาย'),
              where: { category: 'งานขาย' },
            },
            {
              id: 'food',
              title: 'งานอาหารและเครื่องดื่ม',
              href: '/jobs?keyword=' + encodeURIComponent('อาหาร'),
              where: {
                OR: [
                  { title: { contains: 'อาหาร' } },
                  { title: { contains: 'เครื่องดื่ม' } },
                  { category: { contains: 'อาหาร' } },
                  { jobFunction: { contains: 'อาหาร' } },
                ],
              },
            },
            {
              id: 'service',
              title: 'งานบริการลูกค้า',
              href: '/jobs?keyword=' + encodeURIComponent('บริการลูกค้า'),
              where: {
                OR: [
                  { title: { contains: 'บริการลูกค้า' } },
                  { title: { contains: 'ลูกค้าสัมพันธ์' } },
                  { category: { contains: 'บริการ' } },
                  { jobFunction: { contains: 'บริการลูกค้า' } },
                ],
              },
            },
            {
              id: 'retail',
              title: 'งานห้างสรรพสินค้า สาขาและหน้าร้าน',
              href: '/jobs?category=' + encodeURIComponent('งานสินค้าขายปลีกและอุปโภคบริโภค'),
              where: {
                OR: [
                  { category: 'งานสินค้าขายปลีกและอุปโภคบริโภค' },
                  { title: { contains: 'หน้าร้าน' } },
                  { title: { contains: 'สาขา' } },
                  { jobFunction: { contains: 'หน้าร้าน' } },
                ],
              },
            },
          ],
        },
        {
          id: 'office',
          title: 'งานออฟฟิศ',
          items: [
            {
              id: 'marketing',
              title: 'งานการตลาดและอีคอมเมิร์ช',
              href: '/jobs?category=' + encodeURIComponent('งานการตลาด งานสื่อสาร'),
              where: {
                OR: [
                  { category: 'งานการตลาด งานสื่อสาร' },
                  { title: { contains: 'อีคอมเมิร์ซ' } },
                  { title: { contains: 'อีคอมเมิร์ช' } },
                  { jobFunction: { contains: 'การตลาด' } },
                ],
              },
            },
            {
              id: 'tech',
              title: 'งาน Technology/IT และ ออกแบบ UX/UI',
              href: '/jobs?category=' + encodeURIComponent('งานไอที งานเทคโนโลยีสื่อสาร'),
              where: {
                OR: [
                  { category: 'งานไอที งานเทคโนโลยีสื่อสาร' },
                  { title: { contains: 'UX' } },
                  { title: { contains: 'UI' } },
                  { jobFunction: { contains: 'ซอฟต์แวร์' } },
                ],
              },
            },
            {
              id: 'accounting',
              title: 'งานบัญชี ธนาคารและประกันภัย',
              href: '/jobs?category=' + encodeURIComponent('งานบัญชี'),
              where: {
                OR: [
                  { category: 'งานบัญชี' },
                  { category: 'งานธนาคาร งานการเงิน' },
                  { category: 'งานประกันภัย' },
                ],
              },
            },
            {
              id: 'admin',
              title: 'งานจัดการเอกสาร (แอดมิน ธุรการ แปล ล่าม)',
              href: '/jobs?category=' + encodeURIComponent('งานธุรการ'),
              where: {
                OR: [
                  { category: 'งานธุรการ' },
                  { title: { contains: 'แอดมิน' } },
                  { title: { contains: 'ธุรการ' } },
                  { jobFunction: { contains: 'เอกสาร' } },
                ],
              },
            },
          ],
        },
      ];

    const sections = await Promise.all(
      sectionConfigs.map(async (section): Promise<HomeCategorySection> => {
        const items = await Promise.all(
          section.items.map(async (item): Promise<HomeCategoryItem> => {
            const count = await this.prisma.job.count({
              where: {
                status: 'ACTIVE',
                ...item.where,
              },
            });

            return {
              id: item.id,
              title: item.title,
              count,
              href: item.href,
            };
          }),
        );

        return {
          id: section.id,
          title: section.title,
          items,
        };
      }),
    );

    return { sections };

  }

  async getAllGroupCategories() {
    const sectionConfigs: Array<{
      id: string;
      title: string;
      subtitle: string;
      items: Array<{
        id: string;
        name: string;
        href: string;
        where: any;
      }>;
    }> = [
        {
          id: 'storefront',
          title: 'งานหน้าร้าน',
          subtitle: 'สายงานบริการ การขาย และงานประจำสาขา',
          items: [
            { id: 'sales', name: 'งานขาย', href: '/jobs?category=' + encodeURIComponent('งานขาย'), where: { category: 'งานขาย' } },
            {
              id: 'food',
              name: 'งานอาหารและเครื่องดื่ม',
              href: '/jobs?keyword=' + encodeURIComponent('อาหาร'),
              where: { OR: [{ title: { contains: 'อาหาร' } }, { title: { contains: 'เครื่องดื่ม' } }, { category: { contains: 'อาหาร' } }, { jobFunction: { contains: 'อาหาร' } }] },
            },
            {
              id: 'service',
              name: 'งานบริการลูกค้า',
              href: '/jobs?keyword=' + encodeURIComponent('บริการลูกค้า'),
              where: { OR: [{ title: { contains: 'บริการลูกค้า' } }, { title: { contains: 'ลูกค้าสัมพันธ์' } }, { category: { contains: 'บริการ' } }, { jobFunction: { contains: 'บริการลูกค้า' } }] },
            },
            {
              id: 'retail',
              name: 'งานห้างสรรพสินค้า',
              href: '/jobs?category=' + encodeURIComponent('งานสินค้าขายปลีกและอุปโภคบริโภค'),
              where: { OR: [{ category: 'งานสินค้าขายปลีกและอุปโภคบริโภค' }, { title: { contains: 'หน้าร้าน' } }, { title: { contains: 'สาขา' } }, { jobFunction: { contains: 'หน้าร้าน' } }] },
            },
            {
              id: 'hotel',
              name: 'งานธุรกิจการท่องเที่ยวและการโรงแรม',
              href: '/jobs?keyword=' + encodeURIComponent('โรงแรม'),
              where: { OR: [{ title: { contains: 'โรงแรม' } }, { title: { contains: 'ท่องเที่ยว' } }, { category: 'งานบริการ งานท่องเที่ยว' }, { jobFunction: { contains: 'โรงแรม' } }] },
            },
          ],
        },
        {
          id: 'office',
          title: 'งาน Office',
          subtitle: 'สายงานออฟฟิศ วิชาชีพเฉพาะทาง และบริหาร',
          items: [
            {
              id: 'marketing',
              name: 'งานการตลาดและอีคอมเมิร์ช',
              href: '/jobs?category=' + encodeURIComponent('งานการตลาด งานสื่อสาร'),
              where: { OR: [{ category: 'งานการตลาด งานสื่อสาร' }, { title: { contains: 'อีคอมเมิร์ซ' } }, { title: { contains: 'อีคอมเมิร์ช' } }, { jobFunction: { contains: 'การตลาด' } }] },
            },
            {
              id: 'tech',
              name: 'งาน Technology/IT และ ออกแบบ UX/UI',
              href: '/jobs?category=' + encodeURIComponent('งานไอที งานเทคโนโลยีสื่อสาร'),
              where: { OR: [{ category: 'งานไอที งานเทคโนโลยีสื่อสาร' }, { title: { contains: 'UX' } }, { title: { contains: 'UI' } }, { jobFunction: { contains: 'ซอฟต์แวร์' } }] },
            },
            {
              id: 'accounting',
              name: 'งานบัญชี ธนาคารและประกันภัย',
              href: '/jobs?category=' + encodeURIComponent('งานบัญชี'),
              where: { OR: [{ category: 'งานบัญชี' }, { category: 'งานธนาคาร งานการเงิน' }, { category: 'งานประกันภัย' }] },
            },
            {
              id: 'factory',
              name: 'อุตสาหกรรมโรงงาน ขนส่งและงานช่าง',
              href: '/jobs?category=' + encodeURIComponent('งานการผลิต งานขนส่ง'),
              where: { OR: [{ category: 'งานการผลิต งานขนส่ง' }, { title: { contains: 'โรงงาน' } }, { title: { contains: 'ช่าง' } }, { jobFunction: { contains: 'ขนส่ง' } }] },
            },
            {
              id: 'admin',
              name: 'งานจัดการเอกสาร (แอดมิน ธุรการ แปล ล่าม)',
              href: '/jobs?category=' + encodeURIComponent('งานธุรการ'),
              where: { OR: [{ category: 'งานธุรการ' }, { title: { contains: 'แอดมิน' } }, { title: { contains: 'ธุรการ' } }, { jobFunction: { contains: 'เอกสาร' } }] },
            },
            {
              id: 'hr',
              name: 'งาน HR ทรัพยากรบุคคล กฎหมาย และที่ปรึกษา',
              href: '/jobs?category=' + encodeURIComponent('งานทรัพยากรบุคคล'),
              where: { OR: [{ category: 'งานทรัพยากรบุคคล' }, { category: 'งานกฎหมาย' }, { title: { contains: 'HR' } }, { title: { contains: 'บุคคล' } }] },
            },
            {
              id: 'engineer',
              name: 'งานวิศวกรและสถาปัตยกรรม',
              href: '/jobs?category=' + encodeURIComponent('งานวิศวกรรม'),
              where: { OR: [{ category: 'งานวิศวกรรม' }, { category: 'งานออกแบบ งานสถาปัตยกรรม' }, { title: { contains: 'วิศวกร' } }, { title: { contains: 'สถาปนิก' } }] },
            },
            {
              id: 'freelance',
              name: 'งานฟรีแลนซ์ พาร์ทไทม์และรับจ้างโดยทั่วไป',
              href: '/jobs?jobType=PART_TIME,FREELANCE',
              where: { jobType: { in: ['PART_TIME', 'FREELANCE'] } },
            },
            {
              id: 'executive',
              name: 'ผู้บริหาร ผู้อำนวยการ และผู้จัดการ',
              href: '/jobs?keyword=' + encodeURIComponent('ผู้จัดการ'),
              where: { OR: [{ title: { contains: 'ผู้จัดการ' } }, { title: { contains: 'ผู้อำนวยการ' } }, { title: { contains: 'หัวหน้า' } }, { jobFunction: { contains: 'บริหาร' } }] },
            },
            {
              id: 'medical',
              name: 'งานธุรกิจการแพทย์ สุขภาพและความงาม',
              href: '/jobs?category=' + encodeURIComponent('งานการแพทย์'),
              where: { OR: [{ category: 'งานการแพทย์' }, { title: { contains: 'สุขภาพ' } }, { title: { contains: 'ความงาม' } }, { jobFunction: { contains: 'แพทย์' } }] },
            },
            {
              id: 'education',
              name: 'การศึกษา ราชการและงานวิชาการ',
              href: '/jobs?category=' + encodeURIComponent('งานการศึกษา'),
              where: { OR: [{ category: 'งานการศึกษา' }, { category: 'งานราชการ' }, { title: { contains: 'อาจารย์' } }, { title: { contains: 'วิชาการ' } }] },
            },
            {
              id: 'entertainment',
              name: 'งานบันเทิง สื่อสารมวลชน และกองถ่าย',
              href: '/jobs?keyword=' + encodeURIComponent('กองถ่าย'),
              where: { OR: [{ title: { contains: 'กองถ่าย' } }, { title: { contains: 'สื่อ' } }, { title: { contains: 'บันเทิง' } }, { jobFunction: { contains: 'สื่อ' } }] },
            },
          ],
        },
        {
          id: 'regional',
          title: 'งานตามพื้นที่',
          subtitle: 'ค้นหางานตามภูมิภาคทั่วประเทศไทย',
          items: [
            { id: 'bangkok', name: 'กรุงเทพและปริมณฑล', href: '/all_group_job/bangkok', where: { locationProvince: { in: REGION_PROVINCES.bangkok } } },
            { id: 'central', name: 'ภาคกลาง', href: '/all_group_job/central', where: { locationProvince: { in: REGION_PROVINCES.central } } },
            { id: 'west', name: 'ภาคตะวันตก', href: '/all_group_job/west', where: { locationProvince: { in: REGION_PROVINCES.west } } },
            { id: 'east', name: 'ภาคตะวันออก', href: '/all_group_job/east', where: { locationProvince: { in: REGION_PROVINCES.east } } },
            { id: 'northeast', name: 'ภาคตะวันออกเฉียงเหนือ', href: '/all_group_job/northeast', where: { locationProvince: { in: REGION_PROVINCES.northeast } } },
            { id: 'north', name: 'ภาคเหนือ', href: '/all_group_job/north', where: { locationProvince: { in: REGION_PROVINCES.north } } },
            { id: 'south', name: 'ภาคใต้', href: '/all_group_job/south', where: { locationProvince: { in: REGION_PROVINCES.south } } },
          ],
        },
      ];

    const sections = await Promise.all(
      sectionConfigs.map(async (section): Promise<AllGroupCategorySection> => {
        const items = await Promise.all(
          section.items.map(async (item): Promise<AllGroupCategoryItem> => {
            const count = await this.prisma.job.count({
              where: {
                status: 'ACTIVE',
                ...item.where,
              },
            });

            return {
              id: item.id,
              name: item.name,
              count,
              href: item.href,
            };
          }),
        );

        return {
          id: section.id,
          title: section.title,
          subtitle: section.subtitle,
          items,
        };
      }),
    );

    const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);
    const totalJobs = await this.prisma.job.count({ where: { status: 'ACTIVE' } });

    return {
      stats: {
        groupCount: sections.length,
        categoryCount: totalItems,
        totalJobs,
      },
      sections,
    };
  }

  /**
   * Get a single job by slug
   */
  async findBySlug(slug: string, userId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { slug },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            verificationStatus: true,
            description: true,
            website: true,
            industry: true,
            size: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('ไม่พบตำแหน่งงานนี้');
    }

    // Check if user has already applied
    let hasApplied = false;
    if (userId) {
      const application = await this.prisma.application.findUnique({
        where: {
          jobId_userId: {
            jobId: job.id,
            userId,
          },
        },
      });
      hasApplied = !!application;
    }

    // Increment view count (fire-and-forget)
    this.prisma.job
      .update({
        where: { id: job.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => { });

    // Increment daily view count (fire-and-forget)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.prisma.dailyJobView
      .upsert({
        where: {
          jobId_date: {
            jobId: job.id,
            date: today,
          },
        },
        update: {
          viewCount: { increment: 1 },
        },
        create: {
          jobId: job.id,
          date: today,
          viewCount: 1,
        },
      })
      .catch((err: unknown) => console.error('Error tracking daily view:', err));

    return {
      ...job,
      hasApplied,
    };
  }

  /**
   * Update a job (owner only)
   */
  async update(id: string, dto: UpdateJobDto, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException('ไม่พบตำแหน่งงานนี้');
    }

    if (job.company.ownerId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์แก้ไขงานนี้');
    }

    // If title changed, regenerate slug
    const data: any = { ...dto };
    if (dto.title && dto.title !== job.title) {
      data.slug = this.generateSlug(dto.title);
    }

    // Cast enums
    if (dto.jobType) data.jobType = dto.jobType as any;
    if (dto.workModel) data.workModel = dto.workModel as any;

    return this.prisma.job.update({
      where: { id },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
    });
  }

  /**
   * Soft delete — set status to CLOSED
   */
  async remove(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException('ไม่พบตำแหน่งงานนี้');
    }

    if (job.company.ownerId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์ลบงานนี้');
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  /**
   * Publish a job (เช็กสิทธิ์และหักโควตา AC รายเดือน - นับรวมงานทั้งหมดไม่สนสถานะ)
   */
  /**
   * Publish a job (เช็กสิทธิ์และหักโควตา AC รายเดือน - นับรวมงานทั้งหมดไม่สนสถานะ)
   */
  async publish(id: string, userId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException('ไม่พบตำแหน่งงานนี้');
    }

    if (job.company.ownerId !== userId) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เผยแพร่งานนี้');
    }

    const company = job.company;
    if (!company) {
      throw new BadRequestException('ไม่พบข้อมูลบริษัทของท่าน');
    }

    // 1. ดึงข้อมูลแพ็กเกจปัจจุบันของบริษัทมาเช็ก
    const pkg = await this.prisma.companyPackage.findUnique({
      where: { companyId: company.id },
    });

    if (!pkg || !pkg.startDate) {
      throw new BadRequestException('ไม่พบข้อมูลแพ็กเกจการใช้งาน หรือแพ็กเกจหมดอายุแล้ว');
    }

    const now = new Date();
    const purchaseDate = new Date(pkg.startDate);

    // 2. คำนวณวันตัดรอบและวันรีเซ็ตเป็น "รายเดือน"
    const currentResetPoint = new Date(purchaseDate);
    while (currentResetPoint <= now) {
      currentResetPoint.setMonth(currentResetPoint.getMonth() + 1);
    }
    const lastResetPoint = new Date(currentResetPoint);
    lastResetPoint.setMonth(lastResetPoint.getMonth() - 1);

    // 3. นับจำนวนครั้งที่ใช้ AC ไปแล้วใน "รอบเดือนนี้"
    const usedInCycle = pkg.acQuotaUsed || 0;
    const maxQuota = pkg.acQuotaTotal + (pkg.bonusQuotaAC || 0);

    // ✨ เช็คสถานะงานปัจจุบันเพื่อไม่ให้หักแต้มซ้ำซ้อนตอนแก้ไข
    const isAlreadyActive = job.status === 'ACTIVE';

    // 4. ดักกรณีโควตารายเดือนเต็ม (เช็คเฉพาะงานใหม่ หรือจาก Draft เป็น Active เท่านั้น)
    if (!isAlreadyActive && usedInCycle >= maxQuota) {
      const diffMs = currentResetPoint.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `ขออภัย คุณใช้งานโควตาลงประกาศงาน (AC) ของรอบเดือนนี้หมดแล้ว กรุณารอตัดรอบใหม่ในอีก ${daysLeft} วัน หรือติดต่อเจ้าหน้าที่เพื่อเพิ่มโควตา`,
          resetAt: currentResetPoint.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }),
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // 5. 🟢 [ตรงตามบรีฟ 100%] นับจำนวนแถวข้อมูลทั้งหมดของบริษัทนี้ในตาราง Job โดยไม่สนสถานะ
    const totalJobsCount = await this.prisma.job.count({
      where: {
        companyId: company.id,
      },
    });

    // 🚨 ดักเงื่อนไข: เปลี่ยนจาก 12 แถว เป็น 50 แถวสะสมในตารางเรียบร้อยครับ!
    if (totalJobsCount > 50) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'ขออภัย จำนวนประกาศงานสะสมของคุณเต็มพื้นที่โควตา 50 งานแล้ว ไม่สามารถทำรายการเพิ่มได้',
        },
        HttpStatus.BAD_REQUEST
      );
    }

    // 6. รันด้วยระบบ Database Transaction
    const operations: any[] = [
      // คำสั่งที่ 1: อัปเดตงานชิ้นนั้น ๆ ให้เป็น ACTIVE และดันวันเวลา (ทำเสมอไม่ว่างานเก่าหรือใหม่)
      this.prisma.job.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          publishedAt: new Date(),
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
              verificationStatus: true,
            },
          },
        },
      })
    ];

    // 🚨 [แก้ไขจุดนี้] จะสั่งหักโควตา AC +1 ก็ต่อเมื่อ "งานนี้ยังไม่เคยเป็น ACTIVE" เท่านั้น (งานเก่าที่แก้ไขจะไม่โดนหักเพิ่ม)
    if (!isAlreadyActive) {
      operations.push(
        this.prisma.companyPackage.update({
          where: { id: pkg.id },
          data: {
            acQuotaUsed: usedInCycle + 1,
          },
        })
      );
    }

    // รัน Transaction พร้อมกัน
    const results = await this.prisma.$transaction(operations);
    const updatedJob = results[0]; // ผลลัพธ์จากการอัปเดตงานจะอยู่ที่ตำแหน่งแรกเสมอ

    return updatedJob;
  }
  /**
   * Generate a URL-friendly slug from title
   * Appends timestamp suffix for uniqueness
   */
  private generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\sก-๙เแโใไ-]/g, '') // keep Thai + alphanumeric
      .replace(/[\s_]+/g, '-') // spaces/underscores to hyphens
      .replace(/-+/g, '-') // collapse multiple hyphens
      .replace(/^-|-$/g, ''); // trim leading/trailing hyphens

    // Add short timestamp suffix for uniqueness
    const suffix = Date.now().toString(36);
    return `${base}-${suffix}`;
  }

  // ─── Similar Jobs ────────────────────────────────────

  /**
   * Find similar jobs by category, jobFunction, jobType, or locationProvince
   */
  async findSimilar(slug: string) {
    const job = await this.prisma.job.findUnique({ where: { slug } });
    if (!job) {
      throw new NotFoundException('ไม่พบตำแหน่งงานนี้');
    }

    const orConditions: any[] = [];
    if (job.category) orConditions.push({ category: job.category });
    if (job.jobFunction) orConditions.push({ jobFunction: job.jobFunction });
    orConditions.push({ jobType: job.jobType });
    if (job.locationProvince) orConditions.push({ locationProvince: job.locationProvince });

    return this.prisma.job.findMany({
      where: {
        id: { not: job.id },
        status: 'ACTIVE',
        OR: orConditions,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            isVerified: true,
            verificationStatus: true,
          },
        },
      },
    });
  }

  // ─── SavedJob (Heart/Bookmark) ──────────────────────

  async toggleSave(jobId: string, userId: string) {
    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });

    if (existing) {
      await this.prisma.savedJob.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedJob.create({ data: { userId, jobId } });
    return { saved: true };
  }

  async getSavedJobIds(userId: string): Promise<string[]> {
    const saved = await this.prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    });
    return saved.map((s) => s.jobId);
  }

  async getSavedJobs(userId: string) {
    const saved = await this.prisma.savedJob.findMany({
      where: { userId },
      orderBy: { savedAt: 'desc' },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isVerified: true,
                verificationStatus: true,
              },
            },
            _count: { select: { savedBy: true, applications: true } },
          },
        },
      },
    });

    return saved.map((s) => ({
      ...s.job,
      savedAt: s.savedAt,
    }));
  }

  // ─── Recommended (Top Views Today) ───────────────────
  async getTopJobsToday(limit = 6) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Try to get jobs with the most views today
    const topDailyViews = await this.prisma.dailyJobView.findMany({
      where: {
        date: today,
        viewCount: { gt: 0 },
        job: { status: 'ACTIVE' },
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                isVerified: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    });

    let resultJobs = topDailyViews.map((dv: { job: typeof topDailyViews[0]['job'] }) => dv.job);

    // 2. If we don't have enough jobs viewed today, fallback to all-time view count
    if (resultJobs.length < limit) {
      const remainingLimit = limit - resultJobs.length;
      const excludeIds = resultJobs.map((j: { id: string }) => j.id);

      const fallbackJobs = await this.prisma.job.findMany({
        where: {
          status: 'ACTIVE',
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        },
        orderBy: [{ viewCount: 'desc' }, { createdAt: 'desc' }],
        take: remainingLimit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              slug: true,
              logoUrl: true,
              isVerified: true,
              verificationStatus: true,
            },
          },
        },
      });

      resultJobs = [...resultJobs, ...fallbackJobs];
    }

    return resultJobs;
  }
}
