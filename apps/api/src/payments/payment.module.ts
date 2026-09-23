import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PackagesModule } from '../packages/packages.module'; // พาธตามจริงของพี่
import { UploadModule } from '../upload/upload.module';
import { SlipVerificationService } from './slip-verification.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PackagesModule, UploadModule, AuthModule],
    controllers: [PaymentController],
    providers: [PaymentService, SlipVerificationService],
})
export class PaymentModule { }
