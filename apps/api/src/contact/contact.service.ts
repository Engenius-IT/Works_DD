import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendContactEmail(dto: ContactFormDto) {
    const { name, email, phone, subject, message } = dto;
    const recipient = 'hr@engenius.co.th';

    // ตรวจสอบการตั้งค่า SMTP ก่อนดำเนินการ
    if (!this.configService.get('MAIL_USER') || !this.configService.get('MAIL_PASS')) {
      console.error('Email configuration missing: MAIL_USER or MAIL_PASS is not defined.');
      throw new ServiceUnavailableException('ระบบส่งข้อความยังไม่ได้ถูกตั้งค่า กรุณาติดต่อผู้ดูแลระบบ');
    }

    const mailOptions = {
      from: `"${name}" <${this.configService.get('MAIL_USER')}>`,
      to: recipient,
      replyTo: email,
      subject: `[Contact Us] ${subject}: จากคุณ ${name}`,
      text: `
        คุณได้รับข้อความใหม่จากหน้า Contact Us ของ WorksDD
        
        ชื่อผู้ติดต่อ: ${name}
        อีเมล: ${email}
        เบอร์โทรศัพท์: ${phone}
        หัวข้อ: ${subject}
        
        ข้อความ:
        ${message}
      `,
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
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง');
    }
  }
}
