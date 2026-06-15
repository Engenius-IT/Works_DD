'use client';

import { useState, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';

interface ThaiAddress {
  district: string; // ตำบล
  amphoe: string;   // อำเภอ
  province: string; // จังหวัด
  zipcode: number;
}

interface ThaiAddressFieldsProps {
  locale: 'th' | 'en';
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  onChange: (fields: {
    province: string;
    district: string;
    subDistrict: string;
    postalCode: string;
  }) => void;
}

const DATA_URL =
  'https://cdn.jsdelivr.net/gh/earthchie/jquery.Thailand.js@master/jquery.Thailand.js/database/raw_database/raw_database.json';

// 1. ดิกชันนารีแปลชื่อจังหวัด (77 จังหวัด แบบทางการ)
const PROVINCE_EN_MAP: Record<string, string> = {
  'กรุงเทพมหานคร': 'Bangkok', 'กระบี่': 'Krabi', 'กาญจนบุรี': 'Kanchanaburi', 
  'กาฬสินธุ์': 'Kalasin', 'กำแพงเพชร': 'Kamphaeng Phet', 'ขอนแก่น': 'Khon Kaen', 
  'จันทบุรี': 'Chanthaburi', 'ฉะเชิงเทรา': 'Chachoengsao', 'ชลบุรี': 'Chonburi', 
  'ชัยนาท': 'Chainat', 'ชัยภูมิ': 'Chaiyaphum', 'ชุมพร': 'Chumphon', 
  'เชียงราย': 'Chiang Rai', 'เชียงใหม่': 'Chiang Mai', 'ตรัง': 'Trang', 
  'ตราด': 'Trat', 'ตาก': 'Tak', 'นครนายก': 'Nakhon Nayok', 
  'นครปฐม': 'Nakhon Pathom', 'นครพนม': 'Nakhon Phanom', 'นครราชสีมา': 'Nakhon Ratchasima', 
  'นครศรีธรรมราช': 'Nakhon Si Thammarat', 'นครสวรรค์': 'Nakhon Sawan', 'นนทบุรี': 'Nonthaburi', 
  'นราธิวาส': 'Narathiwat', 'น่าน': 'Nan', 'บึงกาฬ': 'Bueng Kan', 
  'บุรีรัมย์': 'Buri Ram', 'ปทุมธานี': 'Pathum Thani', 'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan', 
  'ปราจีนบุรี': 'Prachin Buri', 'ปัตตานี': 'Pattani', 'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya', 
  'พะเยา': 'Phayao', 'พังงา': 'Phang Nga', 'พัทลุง': 'Phatthalung', 
  'พิจิตร': 'Phichit', 'พิษณุโลก': 'Phitsanulok', 'เพชรบุรี': 'Phetchaburi', 
  'เพชรบูรณ์': 'Phetchabun', 'แพร่': 'Phrae', 'ภูเก็ต': 'Phuket', 
  'มหาสารคาม': 'Maha Sarakham', 'มุกดาหาร': 'Mukdahan', 'แม่ฮ่องสอน': 'Mae Hong Son', 
  'ยโสธร': 'Yasothon', 'ยะลา': 'Yala', 'ร้อยเอ็ด': 'Roi Et', 
  'ระนอง': 'Ranong', 'ระยอง': 'Rayong', 'ราชบุรี': 'Ratchaburi', 
  'ลพบุรี': 'Lopburi', 'ลำปาง': 'Lampang', 'ลำพูน': 'Lamphun', 'เลย': 'Loei', 
  'ศรีสะเกษ': 'Si Sa Ket', 'สกลนคร': 'Sakon Nakhon', 'สงขลา': 'Songkhla', 
  'สตูล': 'Satun', 'สมุทรปราการ': 'Samut Prakan', 
  'สมุทรสงคราม': 'Samut Songkhram', 'สมุทรสาคร': 'Samut Sakhon', 'สระแก้ว': 'Sa Kaeo', 
  'สระบุรี': 'Saraburi', 'สิงห์บุรี': 'Sing Buri', 'สุโขทัย': 'Sukhothai', 
  'สุพรรณบุรี': 'Suphan Buri', 'สุราษฎร์ธานี': 'Surat Thani', 'สุรินทร์': 'Surin', 
  'หนองคาย': 'Nong Khai', 'หนองบัวลำภู': 'Nong Bua Lamphu', 'อ่างทอง': 'Ang Thong', 
  'อำนาจเจริญ': 'Amnat Charoen', 'อุดรธานี': 'Udon Thani', 'อุตรดิตถ์': 'Uttaradit', 
  'อุทัยธานี': 'Uthai Thani', 'อุบลราชธานี': 'Ubon Ratchathani'
};

// ฟังก์ชันถอดเสียงคาราโอเกะแบบเบาและแม่นยำ (ไม่หน่วงเว็บ)
const phoneticTranslate = (text: string): string => {
  if (!text) return '';
  
  // ดิกชันนารีคำศัพท์เฉพาะที่พบบ่อย
  const commonWords: Record<string, string> = {
    'เมือง': 'Mueang', 'อำเภอ': 'District', 'เขต': 'District',
    'ตำบล': 'Sub-district', 'แขวง': 'Sub-district'
  };

  // แปลงคำศัพท์เฉพาะก่อน
  if (commonWords[text]) return commonWords[text];

  // ตารางเทียบพยัญชนะและสระเบื้องต้น
  const charMap: Record<string, string> = {
    'ก': 'k', 'ข': 'kh', 'ค': 'kh', 'ง': 'ng', 'จ': 'ch',
    'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ญ': 'y', 'ด': 'd',
    'ต': 't', 'ถ': 'th', 'ท': 'th', 'น': 'n', 'บ': 'b',
    'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f',
    'ภ': 'ph', 'ม': 'm', 'ย': 'y', 'ร': 'r', 'ล': 'l',
    'ว': 'w', 'ศ': 's', 'ส': 's', 'ห': 'h', 'อ': '',
    'เ': 'e', 'แ': 'ae', 'า': 'a', 'ิ': 'i', 'ี': 'i',
    'ุ': 'u', 'ู': 'u', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai'
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // ตัดวรรณยุกต์และการันต์ออก
    if (['่', '้', '๊', '๋', '์', '็'].includes(char)) continue;

    // ตรวจสอบว่าเป็นอักขระภาษาไทยหรือไม่ (รหัสยูนิโค้ด 0E00-0E7F)
    const isThai = char.charCodeAt(0) >= 0x0E00 && char.charCodeAt(0) <= 0x0E7F;

    if (charMap[char] !== undefined) {
      result += charMap[char];
    } else if (isThai) {
      // ถ้าเป็นตัวอักษรไทยแต่ไม่มีใน map ให้ข้ามทิ้งไปเลย (ป้องกันสระ/อักษรลอยติดมา)
      continue;
    } else {
      // อักขระอื่นๆ (เช่น ช่องว่าง, วงเล็บ) ให้คงไว้ตามเดิม
      result += char;
    }
  }

  // ปรับตัวอักษรตัวแรกให้เป็นพิมพ์ใหญ่
  return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
};

function unique(arr: string[]): string[] {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'th'));
}

export function ThaiAddressFields({
  locale,
  province,
  district,   
  subDistrict, 
  postalCode,
  onChange,
}: ThaiAddressFieldsProps) {
  const [data, setData] = useState<ThaiAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => r.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load address database:', err);
        setLoading(false);
      });
  }, []);

  const provinces = unique(data.map((item) => item.province));

  const amphoes = unique(
    data.filter((item) => item.province === province).map((item) => item.amphoe)
  );

  const subDistricts = unique(
    data
      .filter((item) => item.province === province && item.amphoe === district)
      .map((item) => item.district) 
  );

  const getProvinceLabel = (val: string) => {
    if (!val) return '';
    return locale === 'en' ? PROVINCE_EN_MAP[val] || val : val;
  };

  const getLabel = (val: string) => {
    if (!val) return '';
    return locale === 'en' ? phoneticTranslate(val) : val;
  };

  const t = {
    province: locale === 'en' ? 'Province' : 'จังหวัด',
    district: locale === 'en' ? 'District' : 'เขต / อำเภอ',
    subDistrict: locale === 'en' ? 'Sub-district' : 'แขวง / ตำบล',
    postalCode: locale === 'en' ? 'Postal Code' : 'รหัสไปรษณีย์',
    load: locale === 'en' ? 'Loading...' : 'กำลังโหลด...',
    searchProvince: locale === 'en' ? 'Select Province' : 'เลือกจังหวัด',
    searchDistrict: locale === 'en' ? 'Select District' : 'เลือกเขต / อำเภอ',
    searchSubDistrict: locale === 'en' ? 'Select Sub-district' : 'เลือกแขวง / ตำบล',
    selectProvinceFirst: locale === 'en' ? 'Please select province first' : 'กรุณาเลือกจังหวัดก่อน',
    selectDistrictFirst: locale === 'en' ? 'Please select district first' : 'กรุณาเลือกเขต / อำเภอก่อน',
  };

  const handleProvince = (val: string) => {
    onChange({ province: val, district: '', subDistrict: '', postalCode: '' });
  };

  const handleAmphoe = (val: string) => {
    onChange({ province, district: val, subDistrict: '', postalCode: '' });
  };

  const handleSubDistrict = (val: string) => {
    const selectedZip = data.find(
      (item) =>
        item.province === province &&
        item.amphoe === district &&
        item.district === val
    )?.zipcode;

    onChange({
      province,
      district,
      subDistrict: val,
      postalCode: selectedZip ? String(selectedZip) : '',
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.province}</label>
        <SearchableSelect
          locale={locale}
          placeholder={loading ? t.load : t.searchProvince}
          value={getProvinceLabel(province)} 
          onChange={handleProvince}
          options={provinces.map((p) => ({ value: p, label: getProvinceLabel(p) }))}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.district}</label>
        <SearchableSelect
          locale={locale}
          placeholder={!province ? t.selectProvinceFirst : t.searchDistrict}
          value={getLabel(district)}
          onChange={handleAmphoe}
          options={amphoes.map((a) => ({ value: a, label: getLabel(a) }))}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.subDistrict}</label>
        <SearchableSelect
          locale={locale}
          placeholder={!district ? t.selectDistrictFirst : t.searchSubDistrict}
          value={getLabel(subDistrict)}
          onChange={handleSubDistrict}
          options={subDistricts.map((s) => ({ value: s, label: getLabel(s) }))}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-2">{t.postalCode}</label>
        <input
          type="text"
          disabled
          value={postalCode}
          className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none cursor-not-allowed"
        />
      </div>
    </div>
  );
}