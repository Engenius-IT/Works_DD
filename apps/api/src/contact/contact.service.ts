import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class ContactService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendContactEmail(dto: ContactFormDto) {
    const { name, email, phone, subject, message } = dto;
    
    // ดึงอีเมลผู้รับจาก Environment Variable หรือใช้ค่าเริ่มต้น
    const recipient = this.configService.get<string>('CONTACT_RECIPIENT_EMAIL', 'hr@engenius.co.th');

    if (!this.resend) {
      console.error('Email configuration missing: RESEND_API_KEY is not defined.');
      throw new ServiceUnavailableException('ระบบส่งข้อความยังไม่ได้ถูกตั้งค่า กรุณาติดต่อผู้ดูแลระบบ');
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'WorksDD Contact <onboarding@resend.dev>',
        to: recipient,
        replyTo: email,
        subject: `[Contact Us] ${subject}: จากคุณ ${name}`,
        html: `
          <h3>คุณได้รับข้อความใหม่จากหน้า Contact Us ของ WorksDD</h3>
          <p><strong>ชื่อผู้ติดต่อ:</strong> ${name}</p>
          <p><strong>อีเมล:</strong> ${email}</p>
          <p><strong>เบอร์โทรศัพท์:</strong> ${phone}</p>
          <p><strong>หัวข้อ:</strong> ${subject}</p>
          <br/>
          <p><strong>ข้อความ:</strong></p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        `,
      });

      if (error) {
        console.error('Resend API Error:', error);
        throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง');
      }

      console.log('Email sent successfully via Resend:', data?.id);
      return { success: true, message: 'Email sent successfully', id: data?.id };
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง');
    }
  }
}
