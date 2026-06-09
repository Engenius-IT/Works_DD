import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PackagesModule } from '../packages/packages.module'; // พาธตามจริงของพี่

@Module({
    imports: [PackagesModule],
    controllers: [PaymentController],
    providers: [PaymentService],
})
export class PaymentModule { }