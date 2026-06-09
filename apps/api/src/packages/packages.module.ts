import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PackagesService } from './packages.service';
import { PackagesCronService } from './packages-cron.service'; // 1. Import เข้ามาก่อน
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PackagesController],
    providers: [
        PackagesService,
        PackagesCronService
    ],
    exports: [PackagesService],
})
export class PackagesModule { }