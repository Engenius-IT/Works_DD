# WorksDD: แพลตฟอร์มหางานยุคใหม่


WorksDD คือแพลตฟอร์มหางานและสมัครงานที่ทันสมัย สร้างขึ้นเพื่อเชื่อมโยงผู้หางานกับบริษัทชั้นนำ ด้วยฟีเจอร์ที่ครบครันและเทคโนโลยีที่ล้ำสมัย WorksDD มุ่งมั่นที่จะทำให้กระบวนการหางานและการสรรหาบุคลากรเป็นไปอย่างราบรื่นและมีประสิทธิภาพ

## เทคโนโลยีหลักที่ใช้

โปรเจกต์นี้ถูกพัฒนาด้วยเทคโนโลยีที่ทันสมัยและมีประสิทธิภาพสูง:

*   **Next.js 15 (App Router)**: เฟรมเวิร์ก React สำหรับการสร้างเว็บแอปพลิเคชันที่รวดเร็วและปรับขนาดได้ รองรับ Server Components และ Client Components
*   **TypeScript**: ภาษาที่เพิ่มความแข็งแกร่งให้กับ JavaScript ช่วยลดข้อผิดพลาดและเพิ่มความสามารถในการบำรุงรักษาโค้ด
*   **Tailwind CSS 4**: เฟรมเวิร์ก CSS แบบ Utility-first สำหรับการสร้าง UI ที่สวยงามและปรับแต่งได้ง่าย
*   **`next-intl`**: ไลบรารีสำหรับการจัดการ Internationalization (i18n) ใน Next.js ทำให้รองรับหลายภาษาได้อย่างมีประสิทธิภาพ (ไทยและอังกฤษ)
*   **NestJS 11**: เฟรมเวิร์ก Node.js สำหรับการสร้าง Backend API ที่มีโครงสร้างและปรับขนาดได้
*   **Prisma 5**: ORM (Object-Relational Mapper) ที่ทันสมัยสำหรับการจัดการฐานข้อมูล ทำให้การโต้ตอบกับฐานข้อมูลเป็นเรื่องง่ายและปลอดภัย
*   **Supabase**: แพลตฟอร์ม Backend-as-a-Service (BaaS) ที่ให้บริการฐานข้อมูล PostgreSQL, Authentication, Storage และ Realtime Capabilities
*   **Bun 1.3+**: Runtime และ Package Manager ที่รวดเร็วสำหรับ JavaScript และ TypeScript
*   **Turbo (Turborepo)**: Build System สำหรับ Monorepo ช่วยให้การพัฒนาโปรเจกต์ที่มีหลาย Workspaces มีประสิทธิภาพยิ่งขึ้น
*   **Google Gemini (`@google/genai`)**: ใช้สำหรับ resume parsing แบบ AI

## โครงสร้างโปรเจกต์

```text
WorksDD/
├── apps/
│   ├── web/                   # Next.js frontend
│   └── api/                   # NestJS API + Prisma
├── packages/
│   ├── shared-types/          # shared TypeScript types
│   └── validators/            # shared Zod validators
├── .env.example               # environment template
├── package.json               # root scripts + workspaces
└── turbo.json                 # Turborepo task config
```

## ฟีเจอร์เด่น

*   **ระบบสมาชิก**: รองรับผู้ใช้งาน 3 ประเภท: ผู้หางาน (Jobseeker), ผู้ประกอบการ (Employer) และผู้ดูแลระบบ (Admin)
*   **ค้นหางาน**: ระบบค้นหางานที่มีประสิทธิภาพ พร้อมตัวกรองที่หลากหลาย
*   **AI Job Matching**: ระบบจับคู่งานด้วย AI เพื่อแนะนำงานที่เหมาะสมกับผู้หางาน
*   **จัดการเรซูเม่**: ผู้หางานสามารถสร้างและจัดการเรซูเม่ของตนเองได้
*   **โปรไฟล์บริษัท**: ผู้ประกอบการสามารถสร้างและจัดการโปรไฟล์บริษัท รวมถึงประกาศงานได้
*   **Internationalization**: รองรับการแสดงผลหลายภาษา (ไทยและอังกฤษ)
*   **ระบบจัดการรูปภาพ/ไฟล์**: ใช้ Supabase Storage สำหรับการจัดเก็บไฟล์อย่างมีประสิทธิภาพ

## Prerequisites

*   **Node.js 20+**
*   **Bun 1.3+**
*   **Supabase project** ที่มี Postgres และ Storage bucket พร้อมใช้งาน
*   **Google OAuth credentials** ถ้าต้องการใช้ login ผ่าน Google
*   **GEMINI_API_KEY** ถ้าต้องการใช้ resume parsing แบบ AI

## การเริ่มต้นใช้งาน (Getting Started)

รันคำสั่งทั้งหมดจาก root ของโปรเจกต์

### 1. ติดตั้ง Dependencies

ใช้ Bun เพื่อติดตั้งแพ็กเกจทั้งหมด:

```bash
bun install
```

### 2. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory โดยคัดลอกเนื้อหาจาก `.env.example` และกรอกค่าที่จำเป็น:

```ini
# ตัวอย่างจาก .env.example
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=jobsabuy-assets

NEXTAUTH_SECRET=your-secret-key-change-me
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-change-me
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=

NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
API_URL=http://localhost:3001
NODE_ENV=development
PORT=3001
```

**หมายเหตุ:**
*   `NEXTAUTH_URL` ยังคงถูกใช้งานสำหรับ OAuth redirect และ CORS origin แม้จะไม่ได้ใช้ NextAuth package โดยตรง
*   `NEXT_PUBLIC_API_URL` ต้องถูกตั้งค่าใน Production เพื่อให้ Frontend สามารถเชื่อมต่อกับ Backend ได้อย่างถูกต้อง

### 3. Generate Prisma Client

```bash
bun run --filter @worksdd/api prisma:generate
```

### 4. เตรียมฐานข้อมูล

หากเป็นฐานข้อมูลใหม่ ให้รัน migration:

```bash
bun run db:migrate
```

หากต้องการข้อมูลตัวอย่าง ให้ seed เพิ่ม:

```bash
bun run db:seed
```

### 5. รันระบบในโหมด Development

```bash
bun run dev
```

## URL สำหรับการพัฒนา (Local URLs)

*   **Web Frontend**: `http://localhost:3000`
*   **Backend API**: `http://localhost:3001/api/v1`
*   **Swagger Docs**: `http://localhost:3001/api/docs`
*   **Prisma Studio**: `bun run db:studio`

## Scripts ที่ใช้งานบ่อย

### Root Scripts

| Command           | Description                                    |
| :---------------- | :--------------------------------------------- |
| `bun run dev`     | รันทุกแอปในโหมด development ผ่าน Turborepo    |
| `bun run build`   | Build ทุก package สำหรับ production            |
| `bun run lint`    | รัน lint tasks ของแต่ละ workspace              |
| `bun run clean`   | ลบ build artifacts และ cache                   |
| `bun run db:migrate` | รัน Prisma migration ของ API                  |
| `bun run db:seed` | Seed ข้อมูลผ่าน Prisma                         |
| `bun run db:studio` | เปิด Prisma Studio                             |

### API Scripts (ใน `apps/api`)

| Command                           | Description                                            |
| :-------------------------------- | :----------------------------------------------------- |
| `bun run --filter @worksdd/api build` | Build NestJS API                                       |
| `bun run --filter @worksdd/api start:prod` | รัน API จาก `dist/main`                                |
| `bun run --filter @worksdd/api prisma:generate` | Generate Prisma client                                 |
| `bun run --filter @worksdd/api data:export:dry-run` | Preview การ export จาก legacy MySQL / dump             |
| `bun run --filter @worksdd/api data:export:apply` | Export ข้อมูลจาก legacy source เป็น JSON               |
| `bun run --filter @worksdd/api data:migration:dry-run` | Preview การ import JSON เข้า Supabase                  |
| `bun run --filter @worksdd/api data:migration:apply` | Import ข้อมูลเข้า Supabase                             |
| `bun run --filter @worksdd/api data:migration:verify` | ตรวจสอบความครบถ้วนของข้อมูลหลัง import                |
| `bun run --filter @worksdd/api storage:backfill:dry-run` | Preview การย้าย URL เก่าจาก localhost ไป Supabase Storage |
| `bun run --filter @worksdd/api storage:backfill:apply` | ย้าย URL เก่าไป Supabase Storage จริง                  |

## สถานะสถาปัตยกรรมปัจจุบัน

*   **Database**: ใช้ Supabase PostgreSQL
*   **Storage**: ใช้ Supabase Storage
*   **Uploads ใหม่**: ถูกจัดเก็บโดยตรงบน Supabase Storage
*   **Local `/uploads` serving**: ถูกถอดออกจาก API แล้ว
*   **Search**: ใช้ Prisma-based search เพื่อให้สามารถทำงานร่วมกับฐานข้อมูลปัจจุบันได้

## หมายเหตุสำหรับการ Deploy

*   ปัจจุบัน Repository นี้ **ยังไม่มี Dockerfile / docker-compose / CI deploy config ที่ใช้งานจริงใน repo**
*   การ Deploy ควรกำหนดค่า Environment Variables สำหรับ Production ให้ครบถ้วน โดยเฉพาะ `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`, และ `JWT_SECRET`
*   ฝั่ง Frontend หลายหน้ามี fallback ไปยัง `localhost` หาก `NEXT_PUBLIC_API_URL` ไม่ถูกตั้งค่า ดังนั้นใน Production ต้องตั้งค่า Environment Variable นี้เสมอ

## เอกสารอ้างอิงในโปรเจกต์

*   `apps/api/prisma/schema.prisma` — Schema หลักของระบบ
*   `apps/api/src/main.ts` — Global prefix, CORS, Swagger, ValidationPipe
*   `apps/api/src/upload/upload.service.ts` — Integration กับ Supabase Storage
*   `apps/api/src/search/search.service.ts` — Prisma portable search
*   `.env.example` — ตัวอย่าง Environment Variables
"# JobDD11_1" 
