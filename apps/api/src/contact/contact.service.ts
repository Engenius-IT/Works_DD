import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { ContactFormDto } from './dto/contact-form.dto';

@Injectable()
export class ContactService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // กำหนดค่า transporter สำหรับส่งอีเมล
    // หมายเหตุ: ในการใช้งานจริงควรดึงค่าจาก ConfigService หรือ Environment Variables
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get('MAIL_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
  }

  async sendContactEmail(dto: ContactFormDto) {
    const { name, email, phone, subject, message } = dto;
    const recipient = 'hr@engenius.co.th';

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
      // ตรวจสอบว่ามีการตั้งค่า SMTP หรือไม่ ถ้าไม่มีให้ Log แทน (เพื่อไม่ให้ Error ใน dev)
      if (!this.configService.get('MAIL_USER') || !this.configService.get('MAIL_PASS')) {
        console.log('--- Contact Email Simulation ---');
        console.log('To:', recipient);
        console.log('Subject:', mailOptions.subject);
        console.log('Body:', mailOptions.text);
        console.log('-------------------------------');
        return { success: true, message: 'Email logged (SMTP not configured)' };
      }

      await this.transporter.sendMail(mailOptions);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Failed to send contact email:', error);
      throw new InternalServerErrorException('ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาลองใหม่อีกครั้งภายหลัง');
    }
  }
}
