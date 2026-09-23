type PromptPayQrOptions = {
  promptPayId: string;
  amount: number;
  referenceNo: string;
  merchantName?: string;
  city?: string;
};

function tlv(tag: string, value: string): string {
  return `${tag}${value.length.toString().padStart(2, '0')}${value}`;
}

function crc16Ccitt(value: string): string {
  let crc = 0xffff;

  for (let index = 0; index < value.length; index += 1) {
    crc ^= value.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function normalizeMerchantText(value: string, maxLength: number, fallback: string): string {
  const normalized = value
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9 .,&'/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);

  return normalized || fallback;
}

function normalizePromptPayId(promptPayId: string): { tag: '01' | '02'; value: string } {
  const digits = promptPayId.replace(/\D/g, '');

  if (/^0\d{9}$/.test(digits)) {
    return { tag: '01', value: `0066${digits.slice(1)}` };
  }

  if (/^\d{13}$/.test(digits)) {
    return { tag: '02', value: digits };
  }

  throw new Error('PROMPTPAY_ID ต้องเป็นเบอร์โทรศัพท์ 10 หลักหรือเลขบัตรประชาชน 13 หลัก');
}

export function buildPromptPayPayload({
  promptPayId,
  amount,
  referenceNo,
  merchantName = 'WORKSDD',
  city = 'BANGKOK',
}: PromptPayQrOptions): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('จำนวนเงินสำหรับ PromptPay QR ไม่ถูกต้อง');
  }

  const account = normalizePromptPayId(promptPayId);
  const safeReference = referenceNo.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 25) || 'PAYMENT';
  const merchantAccount = tlv('00', 'A000000677010111') + tlv(account.tag, account.value);
  const additionalData = tlv('05', safeReference);
  const amountText = amount.toFixed(2);

  const payload = [
    tlv('00', '01'),
    tlv('01', '12'),
    tlv('29', merchantAccount),
    tlv('53', '764'),
    tlv('54', amountText),
    tlv('58', 'TH'),
    tlv('59', normalizeMerchantText(merchantName, 25, 'WORKSDD')),
    tlv('60', normalizeMerchantText(city, 15, 'BANGKOK')),
    tlv('62', additionalData),
  ].join('');

  return `${payload}6304${crc16Ccitt(`${payload}6304`)}`;
}
