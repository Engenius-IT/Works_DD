import { Injectable, InternalServerErrorException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {}

  private getTransporter() {
    const host = this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com');
    const port = parseInt(this.configService.get<string>('MAIL_PORT', '587'), 10);
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
      // เพิ่ม timeout เพื่อป้องกันการหมุนค้าง
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });
  }

  async sendContactEmail(dto: ContactFormDto) {
    const { name, email, phone, subject, message } = dto;
    const recipient = 'hr@engenius.co.th';

    const user = this.configService.get('MAIL_USER');
    const pass = this.configService.get('MAIL_PASS');

    // ตรวจสอบการตั้งค่า SMTP ก่อนดำเนินการ
    if (!user || !pass) {
      console.error('Email configuration missing: MAIL_USER or MAIL_PASS is not defined.');
      throw new ServiceUnavailableException('ระบบส่งข้อความยังไม่ได้ถูกตั้งค่า กรุณาติดต่อผู้ดูแลระบบ');
    }

    const mailOptions = {
      from: `"${name}" <${user}>`,
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
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send contact email:', error);
      // ถ้าเป็นปัญหาเรื่องการเชื่อมต่อ ให้แจ้งชัดเจนขึ้น
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        throw new ServiceUnavailableException('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์อีเมลได้ กรุณาตรวจสอบการตั้งค่า SMTP');
      }
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง');
    }
  }
}
