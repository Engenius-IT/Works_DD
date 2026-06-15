import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { ContactFormDto } from './dto/contact-form.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'ส่งข้อความติดต่อสอบถาม' })
  async submitContactForm(@Body() dto: ContactFormDto) {
    return this.contactService.sendContactEmail(dto);
  }
}
