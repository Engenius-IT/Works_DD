
# JobSabuy — Job Board Platform

เว็บไซต์หางานสัญชาติไทยแบบ Monorepo ที่ประกอบด้วย Frontend บน Next.js และ Backend บน NestJS โดยปัจจุบันใช้ Supabase ทั้งฝั่งฐานข้อมูล PostgreSQL และไฟล์บน Storage

## Tech Stack ปัจจุบัน

| Layer | Technology | Notes |
| --- | --- | --- |
| **Frontend** | Next.js 15, React 19, next-intl | App Router และ multilingual routing |
| **Styling** | Tailwind CSS 4 | ใช้สำหรับ UI styling ฝั่งเว็บ |
| **Backend** | NestJS 11 | REST API พร้อม Swagger |
| **Language** | TypeScript | ใช้ทั้ง web, api และ shared packages |
| **ORM** | Prisma 5 | เชื่อมกับ PostgreSQL / Supabase |
| **Database** | Supabase Postgres | ใช้ `DATABASE_URL` และ `DIRECT_URL` |
| **File Storage** | Supabase Storage | ใช้สำหรับ resume, company docs, avatars, images |
| **Auth** | JWT + Google OAuth ผ่าน NestJS | ไม่มี NextAuth package ใน runtime ปัจจุบัน |
| **Search** | Prisma portable search | ปัจจุบันไม่ต้องพึ่ง Elasticsearch / Meilisearch สำหรับ core flow |
| **AI (optional)** | Google Gemini (`@google/genai`) | ใช้กับ resume parsing |
| **Monorepo Tooling** | Bun Workspaces + Turborepo | จัดการหลาย package ใน repo เดียว |

## โครงสร้างโปรเจค

```text
JobDD/
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

## Prerequisites

- **Node.js 20+**
- **Bun 1.3+**
- **Supabase project** ที่มี Postgres และ Storage bucket พร้อมใช้งาน
- **Google OAuth credentials** ถ้าต้องการใช้ login ผ่าน Google
- **GEMINI_API_KEY** ถ้าต้องการใช้ resume parsing แบบ AI

## Environment Setup

สร้างไฟล์ `.env` ที่ root ของโปรเจคจาก `.env.example`

```bash
cp .env.example .env
```

ตัวแปรหลักที่ใช้กับระบบปัจจุบันมีดังนี้

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma pooled connection ไปยัง Supabase Postgres |
| `DIRECT_URL` | Yes | direct connection สำหรับ Prisma migrations |
| `SUPABASE_URL` | Yes | base URL ของ Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | ใช้ upload / delete / download ไฟล์จาก Supabase Storage |
| `SUPABASE_STORAGE_BUCKET` | Yes | bucket หลักของระบบ เช่น `jobsabuy-assets` |
| `JWT_SECRET` | Yes | secret สำหรับ access token |
| `JWT_EXPIRES_IN` | No | อายุของ JWT เช่น `7d` |
| `NEXTAUTH_URL` | Yes | ใช้เป็น frontend base URL สำหรับ CORS และ OAuth redirect |
| `NEXT_PUBLIC_API_URL` | Yes | public API base URL สำหรับ frontend |
| `PORT` | No | พอร์ตของ API, default คือ `3001` |
| `GOOGLE_CLIENT_ID` | No | ใช้สำหรับ Google OAuth |
| `GOOGLE_CLIENT_SECRET` | No | ใช้สำหรับ Google OAuth |
| `GEMINI_API_KEY` | No | ใช้กับ resume parsing |

หมายเหตุ:

- **`NEXTAUTH_URL` ยังถูกใช้งานอยู่แม้ระบบไม่ได้ใช้ NextAuth package โดยตรง** เพราะ backend ใช้ค่านี้สำหรับ OAuth redirect และ CORS origin
- `.env.example` ยังมีบางตัวแปรเก่า/เสริมสำหรับ migration หรือการทดลองระบบ แต่ไม่จำเป็นกับ core app ทุกส่วน

## Getting Started

รันคำสั่งทั้งหมดจาก root ของโปรเจค

### 1. ติดตั้ง dependencies

```bash
bun install
```

### 2. Generate Prisma client

```bash
bun run --filter @jobsabuy/api prisma:generate
```

### 3. เตรียมฐานข้อมูล

ถ้าเป็นฐานข้อมูลใหม่ ให้รัน migration ก่อน

```bash
bun run db:migrate
```

ถ้าต้องการข้อมูลตัวอย่าง ให้ seed เพิ่ม

```bash
bun run db:seed
```

### 4. รันระบบแบบ development

```bash
bun run dev
```

## Local URLs

- **Web:** `http://localhost:3000`
- **API:** `http://localhost:3001/api/v1`
- **Swagger Docs:** `http://localhost:3001/api/docs`
- **Prisma Studio:** `bun run db:studio`

## Scripts ที่ใช้บ่อย

### Root Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | รันทุก app ในโหมด development ผ่าน Turborepo |
| `bun run build` | build ทุก package สำหรับ production |
| `bun run lint` | รัน lint tasks ของแต่ละ workspace |
| `bun run clean` | ลบ build artifacts และ cache |
| `bun run db:migrate` | รัน Prisma migration ของ API |
| `bun run db:seed` | seed ข้อมูลผ่าน Prisma |
| `bun run db:studio` | เปิด Prisma Studio |

### API Scripts

| Command | Description |
| --- | --- |
| `bun run --filter @jobsabuy/api build` | build NestJS API |
| `bun run --filter @jobsabuy/api start:prod` | รัน API จาก `dist/main` |
| `bun run --filter @jobsabuy/api prisma:generate` | generate Prisma client |
| `bun run --filter @jobsabuy/api data:export:dry-run` | preview การ export จาก legacy MySQL / dump |
| `bun run --filter @jobsabuy/api data:export:apply` | export ข้อมูลจาก legacy source เป็น JSON |
| `bun run --filter @jobsabuy/api data:migration:dry-run` | preview การ import JSON เข้า Supabase |
| `bun run --filter @jobsabuy/api data:migration:apply` | import ข้อมูลเข้า Supabase |
| `bun run --filter @jobsabuy/api data:migration:verify` | ตรวจความครบถ้วนของข้อมูลหลัง import |
| `bun run --filter @jobsabuy/api storage:backfill:dry-run` | preview การย้าย URL เก่าจาก localhost ไป Supabase Storage |
| `bun run --filter @jobsabuy/api storage:backfill:apply` | ย้าย URL เก่าไป Supabase Storage จริง |

## สถานะสถาปัตยกรรมปัจจุบัน

- **Database** ใช้ Supabase Postgres แล้ว
- **Storage** ใช้ Supabase Storage แล้ว
- **Uploads ใหม่** ถูกเก็บบน Supabase Storage
- **Local `/uploads` serving** ถูกถอดออกจาก API แล้ว
- **Search** ใช้ Prisma-based search เพื่อให้ portable กับฐานข้อมูลปัจจุบัน

## หมายเหตุสำหรับการ Deploy

- ปัจจุบัน repo นี้ **ยังไม่มี Dockerfile / docker-compose / CI deploy config ที่ใช้งานจริงใน repo**
- การ deploy ควรกำหนดค่า env สำหรับ production ให้ครบ โดยเฉพาะ `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_*`, และ `JWT_SECRET`
- ฝั่ง frontend หลายหน้ามี fallback ไป `localhost` ถ้า `NEXT_PUBLIC_API_URL` ไม่ถูกตั้งค่า ดังนั้น production ต้องตั้ง env นี้เสมอ

## เอกสารอ้างอิงในโปรเจค

- `apps/api/prisma/schema.prisma` — schema หลักของระบบ
- `apps/api/src/main.ts` — global prefix, CORS, Swagger, ValidationPipe
- `apps/api/src/upload/upload.service.ts` — integration กับ Supabase Storage
- `apps/api/src/search/search.service.ts` — Prisma portable search
- `.env.example` — ตัวอย่าง environment variables



bunx kill-port 3000 3001 3002 3003
