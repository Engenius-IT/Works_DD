import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import jsQR from 'jsqr';
import sharp from 'sharp';

export type SlipInspection = {
  sha256: string;
  qrPayload: string | null;
  amount: number | null;
  referenceNo: string | null;
  recipientName: string | null;
  transactionAt: Date | null;
};

export type OneXSlipInspection = {
  provider: '1xslip';
  success: boolean;
  message: string | null;
  errorCode: string | null;
  qrPayload: string | null;
  amount: number | null;
  referenceNo: string | null;
  recipientName: string | null;
  transactionAt: Date | null;
};

type ParsedField = {
  tag: string;
  value: string;
};

@Injectable()
export class SlipVerificationService {
  isOneXSlipConfigured(): boolean {
    return Boolean(process.env.XSLIP_API_KEY?.trim());
  }

  getSha256(fileBuffer: Buffer): string {
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  async inspect(fileBuffer: Buffer): Promise<SlipInspection> {
    const sha256 = this.getSha256(fileBuffer);
    const image = await sharp(fileBuffer).rotate().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const qr = jsQR(
      new Uint8ClampedArray(image.data),
      image.info.width,
      image.info.height,
      { inversionAttempts: 'attemptBoth' },
    );

    const qrPayload = qr?.data?.trim() || null;
    const fields = qrPayload ? this.flattenFields(qrPayload) : [];

    return {
      sha256,
      qrPayload,
      amount: qrPayload ? this.extractAmount(fields) : null,
      referenceNo: qrPayload ? this.extractReferenceNo(qrPayload, fields) : null,
      recipientName: qrPayload ? this.extractRecipientName(fields) : null,
      transactionAt: qrPayload ? this.extractTransactionAt(qrPayload, fields) : null,
    };
  }

  /**
   * ตรวจสอบสลิปกับ 1xSlip จากฝั่งเซิร์ฟเวอร์เท่านั้น
   * หากยังไม่ได้ตั้งค่า API key จะคืนค่า null เพื่อให้ระบบเดิมทำงานต่อได้
   */
  async verifyWithOneXSlip(file: {
    buffer: Buffer;
    originalname?: string;
    mimetype?: string;
  }): Promise<OneXSlipInspection | null> {
    const apiKey = process.env.XSLIP_API_KEY?.trim();
    if (!apiKey) return null;

    const endpoint = process.env.XSLIP_VERIFY_URL?.trim()
      || 'https://api.1xslip.com/api/v2/verify/bank';
    const form = new FormData();
    const imageBytes = new Uint8Array(file.buffer.byteLength);
    imageBytes.set(file.buffer);
    form.append(
      'image',
      new Blob([imageBytes.buffer], { type: file.mimetype || 'image/jpeg' }),
      file.originalname || 'slip.jpg',
    );

    let body: any = null;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
      body = await response.json();
    } catch (error) {
      return {
        provider: '1xslip',
        success: false,
        message: error instanceof Error ? error.message : 'เชื่อมต่อ 1xSlip ไม่สำเร็จ',
        errorCode: 'NETWORK_ERROR',
        qrPayload: null,
        amount: null,
        referenceNo: null,
        recipientName: null,
        transactionAt: null,
      };
    }

    const data = body?.data?.rawSlip || body?.data || body?.result || body || {};
    const amount = this.toNumber(
      this.firstValue(data, [
        'amount.amount',
        'amount.local.amount',
        'amountInSlip',
        'transactionAmount',
        'amount',
      ]),
    );
    const referenceNo = this.toStringValue(this.firstValue(data, [
      'transRef',
      'transactionRef',
      'reference',
      'ref',
      'transactionId',
    ]));
    const recipientName = this.toStringValue(this.firstValue(data, [
      'receiver.account.name.th',
      'receiver.account.name.en',
      'receiver.account.name',
      'receiver.name',
      'recipientName',
    ]));
    const transactionAt = this.toDate(this.firstValue(data, [
      'date',
      'transactionDate',
      'transDate',
      'datetime',
      'timestamp',
    ]));

    return {
      provider: '1xslip',
      success: response.ok && body?.success !== false,
      message: this.toStringValue(body?.message || body?.error?.message),
      errorCode: this.toStringValue(body?.error?.code),
      qrPayload: this.toStringValue(this.firstValue(data, ['payload', 'qrPayload', 'rawPayload'])),
      amount,
      referenceNo,
      recipientName,
      transactionAt,
    };
  }

  private firstValue(source: any, paths: string[]): any {
    for (const path of paths) {
      const value = path.split('.').reduce((current, key) => current?.[key], source);
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return null;
  }

  private toNumber(value: any): number | null {
    if (value && typeof value === 'object') {
      return this.toNumber(value.amount ?? value.value ?? value.local);
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return null;
  }

  private toStringValue(value: any): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return null;
  }

  private toDate(value: any): Date | null {
    if (typeof value === 'number') {
      const milliseconds = value < 10_000_000_000 ? value * 1000 : value;
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value !== 'string' || !value.trim()) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseTlv(payload: string): ParsedField[] {
    const fields: ParsedField[] = [];
    let cursor = 0;

    while (cursor + 4 <= payload.length) {
      const tag = payload.slice(cursor, cursor + 2);
      const length = Number(payload.slice(cursor + 2, cursor + 4));

      if (!Number.isInteger(length) || length < 0 || cursor + 4 + length > payload.length) {
        break;
      }

      fields.push({
        tag,
        value: payload.slice(cursor + 4, cursor + 4 + length),
      });
      cursor += 4 + length;
    }

    return fields;
  }

  private flattenFields(payload: string): ParsedField[] {
    const flattened: ParsedField[] = [];
    const containerTags = new Set(['26', '27', '28', '29', '30', '31', '32', '62', '64']);

    const visit = (fields: ParsedField[]) => {
      for (const field of fields) {
        flattened.push(field);
        if (containerTags.has(field.tag)) {
          visit(this.parseTlv(field.value));
        }
      }
    };

    visit(this.parseTlv(payload));
    return flattened;
  }

  private extractAmount(fields: ParsedField[]): number | null {
    const value = fields.find((field) => field.tag === '54')?.value;
    if (!value || !/^\d+(\.\d+)?$/.test(value)) return null;

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
  }

  private extractReferenceNo(payload: string, fields: ParsedField[]): string | null {
    const explicitReference = payload.match(/self_[A-Za-z0-9_-]+/i)?.[0];
    if (explicitReference) return explicitReference;

    // EMVCo additional data commonly stores a bill/reference label in tag 05.
    const reference = fields
      .filter((field) => field.tag === '05')
      .map((field) => field.value.trim())
      .find(Boolean);

    return reference || null;
  }

  private extractRecipientName(fields: ParsedField[]): string | null {
    // Tag 59 is the EMVCo merchant/recipient name field.
    return fields.find((field) => field.tag === '59')?.value.trim() || null;
  }

  private extractTransactionAt(payload: string, fields: ParsedField[]): Date | null {
    const values = [...fields.map((field) => field.value), payload];

    for (const value of values) {
      const compact = value.match(/(20\d{2}|25\d{2})(\d{2})(\d{2})(?:[T ]?(\d{2})(\d{2})(\d{2}))?/);
      if (compact) {
        const year = Number(compact[1]) > 2400 ? Number(compact[1]) - 543 : Number(compact[1]);
        return this.createBangkokDate(year, Number(compact[2]), Number(compact[3]), compact[4], compact[5], compact[6]);
      }

      const separated = value.match(/(\d{2})[/-](\d{2})[/-](19\d{2}|20\d{2}|25\d{2})/);
      if (separated) {
        const yearValue = Number(separated[3]);
        const year = yearValue > 2400 ? yearValue - 543 : yearValue;
        return this.createBangkokDate(year, Number(separated[2]), Number(separated[1]));
      }
    }

    return null;
  }

  private createBangkokDate(
    year: number,
    month: number,
    day: number,
    hour?: string,
    minute?: string,
    second?: string,
  ): Date | null {
    const date = new Date(Date.UTC(
      year,
      month - 1,
      day,
      Number(hour || 0) - 7,
      Number(minute || 0),
      Number(second || 0),
    ));

    return Number.isNaN(date.getTime()) ? null : date;
  }
}
