'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ThaiAddressFields } from '@/components/ThaiAddressFields';
import { ProvinceSelect } from '@/components/ProvinceSelect';
import { NATIONALITIES } from '@/data/nationalities';
import {
  Pencil,
  Plus,
  Check,
  ChevronDown,
  Lock,
  EyeOff,
  FileText,
  Trash2,
  Share2,
  User,
  GraduationCap,
  Briefcase,
  Languages,
  Award,
  Loader2,
  Car,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

interface ProfileForm {
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  height: string;
  weight: string;
  gender: string;
  phone: string;
  email: string;
  experience: string;
  lineId: string;
  nationality: string;
  maritalStatus: string;
  militaryStatus: string;
  address: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  religion: string;
  expectedSalary: string;
  desiredProvinces: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale === 'en' ? 'en' : 'th') as 'th' | 'en';

  // ใช้ Dictionary สำหรับแปลข้อความแบบ Static ป้องกันข้อมูลฟอร์มหาย
  const TRANSLATIONS: Record<string, Record<string, string>> = {
    th: {
      'ความสมบูรณ์ของโปรไฟล์': 'ความสมบูรณ์ของโปรไฟล์',
      'สำเร็จ': 'สำเร็จ',
      'เริ่มต้น': 'เริ่มต้น',
      'สมบูรณ์': 'สมบูรณ์',
      'กำลังบันทึก...': 'กำลังบันทึก...',
      'บันทึกและถัดไป': 'บันทึกและถัดไป',
      'ข้อมูลส่วนบุคคล': 'ข้อมูลส่วนบุคคล',
      'ประวัติการศึกษา': 'ประวัติการศึกษา',
      'ประวัติการทำงาน': 'ประวัติการทำงาน',
      'ความสามารถทางภาษา': 'ความสามารถทางภาษา',
      'ทักษะการขับขี่': 'ทักษะการขับขี่',
      'ใบประกาศนียบัตร': 'ใบประกาศนียบัตร',
      'เปลี่ยนรูป': 'เปลี่ยนรูป',
      'เพิ่มชื่อของคุณ': 'เพิ่มชื่อของคุณ',
      'วัน/เดือน/ปีที่เกิด': 'วัน/เดือน/ปีที่เกิด',
      'วัน': 'วัน',
      'เดือน': 'เดือน',
      'ปี': 'ปี',
      'ส่วนสูง (ซม.)': 'ส่วนสูง (ซม.)',
      'น้ำหนัก (กก.)': 'น้ำหนัก (กก.)',
      'ประสบการณ์ (ปี)': 'ประสบการณ์ (ปี)',
      'โปรดระบุ': 'โปรดระบุ',
      'เงินเดือนที่ต้องการ': 'เงินเดือนที่ต้องการ',
      'ระบุเป็นตัวเลข (เช่น 25000)': 'ระบุเป็นตัวเลข (เช่น 25000)',
      'เพศ': 'เพศ',
      'โปรดเลือก': 'โปรดเลือก',
      'ชาย': 'ชาย',
      'หญิง': 'หญิง',
      'อื่นๆ': 'อื่นๆ',
      'เบอร์โทรศัพท์มือถือ': 'เบอร์โทรศัพท์มือถือ',
      'LINE ID': 'LINE ID',
      '(ไม่บังคับ)': '(ไม่บังคับ)',
      'สัญชาติ': 'สัญชาติ',
      'พิมพ์เพื่อค้นหา...': 'พิมพ์เพื่อค้นหา...',
      'ศาสนา': 'ศาสนา',
      'สถานภาพสมรส': 'สถานภาพสมรส',
      'โสด': 'โสด',
      'สมรส': 'สมรส',
      'สถานภาพทางทหาร': 'สถานภาพทางทหาร',
      'ได้รับการยกเว้น': 'ได้รับการยกเว้น',
      'ผ่านการเกณฑ์ทหารแล้ว': 'ผ่านการเกณฑ์ทหารแล้ว',
      'ยังไม่ผ่านการเกณฑ์ทหาร': 'ยังไม่ผ่านการเกณฑ์ทหาร',
      'จังหวัดที่สนใจทำงาน (เลือกได้หลายที่)': 'จังหวัดที่สนใจทำงาน (เลือกได้หลายที่)',
      'จังหวัด': 'Province',
      'อำเภอ / เขต': 'District',
      'ตำบล / แขวง': 'Sub-district',
      'รหัสไปรษณีย์': 'Postal Code',
      'อัพโหลดรูปภาพโปรไฟล์สำเร็จ ✓': 'อัพโหลดรูปภาพโปรไฟล์สำเร็จ ✓',
      'บันทึกข้อมูลเรียบร้อยแล้ว ✓': 'บันทึกข้อมูลเรียบร้อยแล้ว ✓',
      'มกราคม': 'มกราคม',
      'กุมภาพันธ์': 'กุมภาพันธ์',
      'มีนาคม': 'มีนาคม',
      'เมษายน': 'เมษายน',
      'พฤษภาคม': 'พฤษภาคม',
      'มิถุนายน': 'มิถุนายน',
      'กรกฎาคม': 'กรกฎาคม',
      'สิงหาคม': 'สิงหาคม',
      'กันยายน': 'กันยายน',
      'ตุลาคม': 'ตุลาคม',
      'พฤศจิกายน': 'พฤศจิกายน',
      'ธันวาคม': 'ธันวาคม',
      'ไทย': 'ไทย',
      'กัมพูชา': 'กัมพูชา',
      'เกาหลีใต้': 'เกาหลีใต้',
      'เกาหลีเหนือ': 'เกาหลีเหนือ',
      'จีน': 'จีน',
      'ญี่ปุ่น': 'ญี่ปุ่น',
      'เนปาล': 'เนปาล',
      'บังกลาเทศ': 'บังกลาเทศ',
      'บรูไน': 'บรูไน',
      'ปากีสถาน': 'ปากีสถาน',
      'พม่า': 'พม่า',
      'ฟิลิปปินส์': 'ฟิลิปปินส์',
      'มองโกเลีย': 'มองโกเลีย',
      'มาเลเซีย': 'มาเลเซีย',
      'ลาว': 'ลาว',
      'เวียดนาม': 'เวียดนาม',
      'ศรีลังกา': 'ศรีลังกา',
      'สิงคโปร์': 'สิงคโปร์',
      'อัฟกานิสถาน': 'อัฟกานิสถาน',
      'อินเดีย': 'อินเดีย',
      'อินโดนีเซีย': 'อินโดนีเซีย',
      'อเมริกัน': 'อเมริกัน',
      'อังกฤษ': 'อังกฤษ',
      'ออสเตรเลีย': 'ออสเตรเลีย',
      'แคนาดา': 'แคนาดา',
      'ฝรั่งเศส': 'ฝรั่งเศส',
      'เยอรมัน': 'เยอรมัน',
      'รัสเซีย': 'รัสเซีย',
      'แอลเบเนีย': 'แอลเบเนีย',
      'แอลจีเรีย': 'แอลจีเรีย',
      'อันดอร์รา': 'อันดอร์รา',
      'แองโกลา': 'แองโกลา',
      'แอนติกาและบาร์บูดา': 'แอนติกาและบาร์บูดา',
      'อาร์เจนตินา': 'อาร์เจนตินา',
      'อาร์เมเนีย': 'อาร์เมเนีย',
      'ออสเตรีย': 'ออสเตรีย',
      'อาเซอร์ไบจาน': 'อาเซอร์ไบจาน',
      'บาฮามาส': 'บาฮามาส',
      'บาห์เรน': 'บาห์เรน',
      'บาร์เบโดส': 'บาร์เบโดส',
      'เบลารุส': 'เบลารุส',
      'เบลเยียม': 'เบลเยียม',
      'เบลีซ': 'เบลีซ',
      'เบนิน': 'เบนิน',
      'ภูฏาน': 'ภูฏาน',
      'โบลิเวีย': 'โบลิเวีย',
      'บอสเนียและเฮอร์เซโกวีนา': 'บอสเนียและเฮอร์เซโกวีนา',
      'บอตสวานา': 'บอตสวานา',
      'บราซิล': 'บราซิล',
      'บัลแกเรีย': 'บัลแกเรีย',
      'บูร์กินาฟาโซ': 'บูร์กินาฟาโซ',
      'บุรุนดี': 'บุรุนดี',
      'กาบูเวร์ดี': 'กาบูเวร์ดี',
      'แคเมอรูน': 'แคเมอรูน',
      'สาธารณรัฐแอฟริกากลาง': 'สาธารณรัฐแอฟริกากลาง',
      'ชาด': 'ชาด',
      'ชิลี': 'ชิลี',
      'โคลอมเบีย': 'โคลอมเบีย',
      'คอโมโรส': 'คอโมโรส',
      'คองโก': 'คองโก',
      'สาธารณรัฐประชาธิปไตยคองโก': 'สาธารณรัฐประชาธิปไตยคองโก',
      'คอสตาริกา': 'คอสตาริกา',
      'โกตดิวัวร์': 'โกตดิวัวร์',
      'โครเอเชีย': 'โครเอเชีย',
      'คิวบา': 'คิวบา',
      'ไซปรัส': 'ไซปรัส',
      'เช็ก': 'เช็ก',
      'เดนมาร์ก': 'เดนมาร์ก',
      'จิบูตี': 'จิบูตี',
      'โดมินิกา': 'โดมินิกา',
      'สาธารณรัฐโดมินิกัน': 'สาธารณรัฐโดมินิกัน',
      'เอกวาดอร์': 'เอกวาดอร์',
      'อียิปต์': 'อียิปต์',
      'เอลซัลวาดอร์': 'เอลซัลวาดอร์',
      'อิเควทอเรียลกินี': 'อิเควทอเรียลกินี',
      'เอริเทรีย': 'เอริเทรีย',
      'เอสโตเนีย': 'เอสโตเนีย',
      'เอสวาตีนี': 'Swazi',
      'เอธิโอเปีย': 'Ethiopian',
      'ฟิจิ': 'Fijian',
      'ฟินแลนด์': 'Finnish',
      'กาบอง': 'Gabonese',
      'แกมเบีย': 'Gambian',
      'จอร์เจีย': 'Georgian',
      'กานา': 'Ghanaian',
      'กรีซ': 'Greek',
      'เกรเนดา': 'Grenadian',
      'กัวเตมาลา': 'Guatemalan',
      'กินี': 'Guinean',
      'กินี-บิสเซา': 'Bissau-Guinean',
      'กายอานา': 'Guyanese',
      'เฮติ': 'Haitian',
      'ฮอนดูรัส': 'Honduran',
      'ฮังการี': 'Hungarian',
      'ไอซ์แลนด์': 'Icelandic',
      'อิหร่าน': 'Iranian',
      'อิรัก': 'Iraqi',
      'ไอร์แลนด์': 'Irish',
      'อิสราเอล': 'Israeli',
      'อิตาลี': 'Italian',
      'จาเมกา': 'Jamaican',
      'จอร์แดน': 'Jordanian',
      'คาซัคสถาน': 'Kazakhstani',
      'เคนยา': 'Kenyan',
      'คิริบาส': 'I-Kiribati',
      'โคโซโว': 'Kosovar',
      'คูเวต': 'Kuwaiti',
      'คีร์กีซสถาน': 'Kyrgyzstani',
      'ลัตเวีย': 'Latvian',
      'เลบานอน': 'Lebanese',
      'เลโซโท': 'Basotho',
      'ไลบีเรีย': 'Liberian',
      'ลิเบีย': 'Libyan',
      'ลิกเตนสไตน์': 'Liechtensteiner',
      'ลิทัวเนีย': 'Lithuanian',
      'ลักเซมเบิร์ก': 'Luxembourgish',
      'มาดากัสการ์': 'Malagasy',
      'มาลาวี': 'Malawian',
      'มัลดีฟส์': 'Maldivian',
      'มาลี': 'Malian',
      'มอลตา': 'Maltese',
      'หมู่เกาะมาร์แชลล์': 'Marshallese',
      'มอริเตเนีย': 'Mauritanian',
      'มอริเชียส': 'Mauritian',
      'เม็กซิโก': 'Mexican',
      'ไมโครนีเซีย': 'Micronesian',
      'มอลโดวา': 'Moldovan',
      'โมนาโก': 'Monégasque',
      'มอนเตเนโกร': 'Montenegrin',
      'โมร็อกโก': 'Moroccan',
      'โมซัมบิก': 'Mozambican',
      'นามิเบีย': 'Namibian',
      'นาอูรู': 'Nauruan',
      'เนเธอร์แลนด์': 'Dutch',
      'นิวซีแลนด์': 'New Zealand',
      'นิการากัว': 'Nicaraguan',
      'ไนเจอร์': 'Nigerien',
      'ไนจีเรีย': 'Nigerian',
      'มาซิโดเนียเหนือ': 'Macedonian',
      'นอร์เวย์': 'Norwegian',
      'โอมาน': 'Omani',
      'ปาเลา': 'Palauan',
      'ปาเลสไตน์': 'Palestinian',
      'ปานามา': 'Panamanian',
      'ปาปัวนิวกินี': 'Papua New Guinean',
      'ปารากวัย': 'Paraguayan',
      'เปรู': 'Peruvian',
      'โปแลนด์': 'Polish',
      'โปรตุเกส': 'Portuguese',
      'กาตาร์': 'Qatari',
      'โรมาเนีย': 'Romanian',
      'รวันดา': 'Rwandan',
      'เซนต์คิตส์และเนวิส': 'Saint Kitts and Nevis',
      'เซนต์ลูเชีย': 'Saint Lucian',
      'เซนต์วินเซนต์และเกรนาดีนส์': 'Vincentian',
      'ซามัว': 'Samoan',
      'ซานมารีโน': 'Sammarinese',
      'เซาตูเมและปรินซิปี': 'São Toméan',
      'ซาอุดีอาระเบีย': 'Saudi Arabian',
      'เซเนกัล': 'Senegalese',
      'เซอร์เบีย': 'Serbian',
      'เซเชลส์': 'Seychellois',
      'เซียร์ราลีโอน': 'Sierra Leonean',
      'สโลวาเกีย': 'Slovak',
      'สโลวีเนีย': 'Slovenian',
      'หมู่เกาะโซโลมอน': 'Solomon Islander',
      'โซมาเลีย': 'Somali',
      'แอฟริกาใต้': 'South African',
      'ซูดานใต้': 'South Sudanese',
      'สเปน': 'Spanish',
      'ซูดาน': 'Sudanese',
      'ซูรินาม': 'Surinamese',
      'สวีเดน': 'Swedish',
      'สวิตเซอร์แลนด์': 'Swiss',
      'ซีเรีย': 'Syrian',
      'ไต้หวัน': 'Taiwanese',
      'ทาจิกิสถาน': 'Tajikistani',
      'แทนซาเนีย': 'Tanzanian',
      'ติมอร์-เลสเต': 'East Timorese',
      'โตโก': 'Togolese',
      'ตองกา': 'Tongan',
      'ตรินิแดดและโตเบโก': 'Trinidadian and Tobagonian',
      'ตูนิเซีย': 'Tunisian',
      'ตุรกี': 'Turkish',
      'เติร์กเมนิสถาน': 'Turkmen',
      'ตูวาลู': 'Tuvaluan',
      'ยูกันดา': 'Ugandan',
      'ยูเครน': 'Ukrainian',
      'สหรัฐอาหรับเอมิเรตส์': 'Emirati',
      'อุรุกวัย': 'Uruguayan',
      'อุซเบกิสถาน': 'Uzbekistani',
      'วานูอาตู': 'Vanuatuan',
      'นครรัฐวาติกัน': 'Vatican", "Vatican City',
      'เวเนซุเอลา': 'Venezuelan',
      'เยเมน': 'Yemeni',
      'แซมเบีย': 'Zambian',
      'ซิมบับเว': 'Zimbabwean',
    },
    en: {
      'ความสมบูรณ์ของโปรไฟล์': 'Profile Completion',
      'สำเร็จ': 'Success',
      'เริ่มต้น': 'Start',
      'สมบูรณ์': 'Complete',
      'กำลังบันทึก...': 'Saving...',
      'บันทึกและถัดไป': 'Save & Next',
      'ข้อมูลส่วนบุคคล': 'Personal Information',
      'ประวัติการศึกษา': 'Education History',
      'ประวัติการทำงาน': 'Work History',
      'ความสามารถทางภาษา': 'Language Skills',
      'ทักษะการขับขี่': 'Driving Skills',
      'ใบประกาศนียบัตร': 'Certificates',
      'เปลี่ยนรูป': 'Change Photo',
      'เพิ่มชื่อของคุณ': 'Add your name',
      'วัน/เดือน/ปีที่เกิด': 'Date of Birth',
      'วัน': 'Day',
      'เดือน': 'Month',
      'ปี': 'Year',
      'ส่วนสูง (ซม.)': 'Height (cm.)',
      'น้ำหนัก (กก.)': 'Weight (kg.)',
      'ประสบการณ์ (ปี)': 'Experience (years)',
      'โปรดระบุ': 'Please specify',
      'เงินเดือนที่ต้องการ': 'Expected Salary',
      'ระบุเป็นตัวเลข (เช่น 25000)': 'Enter numbers only (e.g. 25000)',
      'เพศ': 'Gender',
      'โปรดเลือก': 'Please select',
      'ชาย': 'Male',
      'หญิง': 'Female',
      'อื่นๆ': 'Other',
      'เบอร์โทรศัพท์มือถือ': 'Mobile Phone Number',
      'LINE ID': 'LINE ID',
      '(không bắt buộc)': '(Optional)',
      '(ไม่บังคับ)': '(Optional)',
      'สัญชาติ': 'Nationality',
      'พิมพ์เพื่อค้นหา...': 'Type to search...',
      'ศาสนา': 'Religion',
      'สถานภาพสมรส': 'Marital Status',
      'โสด': 'Single',
      'สมรส': 'Married',
      'สถานภาพทางทหาร': 'Military Status',
      'ได้รับการยกเว้น': 'Exempted',
      'ผ่านการเกณฑ์ทหารแล้ว': 'Completed',
      'ยังไม่ผ่านการเกณฑ์ทหาร': 'Not yet completed',
      'จังหวัดที่สนใจทำงาน (เลือกได้หลายที่)': 'Preferred Work Locations (Multiple choices)',
      'อัพโหลดรูปภาพโปรไฟล์สำเร็จ ✓': 'Profile picture uploaded successfully ✓',
      'บันทึกข้อมูลเรียบร้อยแล้ว ✓': 'Data saved successfully ✓',
      'มกราคม': 'January',
      'กุมภาพันธ์': 'February',
      'มีนาคม': 'March',
      'เมษายน': 'April',
      'พฤษภาคม': 'May',
      'มิถุนายน': 'June',
      'กรกฎาคม': 'July',
      'สิงหาคม': 'August',
      'กันยายน': 'September',
      'ตุลาคม': 'October',
      'พฤศจิกายน': 'November',
      'ธันวาคม': 'December',
      'ไทย': 'Thai',
      'กัมพูชา': 'Cambodian',
      'เกาหลีใต้': 'South Korean',
      'เกาหลีเหนือ': 'North Korean',
      'จีน': 'Chinese',
      'ญี่ปุ่น': 'Japanese',
      'เนปาล': 'Nepalese',
      'บังกลาเทศ': 'Bangladeshi',
      'บรูไน': 'Bruneian',
      'ปากีสถาน': 'Pakistani',
      'พม่า': 'Myanmar',
      'ฟิลิปปินส์': 'Filipino',
      'มองโกเลีย': 'Mongolian',
      'มาเลเซีย': 'Malaysian',
      'ลาว': 'Lao',
      'เวียดนาม': 'Vietnamese',
      'ศรีลังกา': 'Sri Lankan',
      'สิงคโปร์': 'Singaporean',
      'อัฟกานิสถาน': 'Afghan',
      'อินเดีย': 'Indian',
      'อินโดนีเซีย': 'Indonesian',
      'อเมริกัน': 'American',
      'อังกฤษ': 'British',
      'ออสเตรเลีย': 'Australian',
      'แคนาดา': 'Canadian',
      'ฝรั่งเศส': 'French',
      'เยอรมัน': 'German',
      'รัสเซีย': 'Russian',
      'แอลเบเนีย': 'Albanian',
      'แอลจีเรีย': 'Algerian',
      'อันดอร์รา': 'Andorran',
      'แองโกลา': 'Angolan',
      'แอนติกาและบาร์บูดา': 'Antiguan and Barbudan',
      'อาร์เจนตินา': 'Argentine',
      'อาร์เมเนีย': 'Armenian',
      'ออสเตรีย': 'Austrian',
      'อาเซอร์ไบจาน': 'Azerbaijani',
      'บาฮามาส': 'Bahamian',
      'บาห์เรน': 'Bahraini',
      'บาร์เบโดส': 'Barbadian',
      'เบลารุส': 'Belarusian',
      'เบลเยียม': 'Belgian',
      'เบลีซ': 'Belizean',
      'เบนิน': 'Beninese',
      'ภูฏาน': 'Bhutanese',
      'โบลิเวีย': 'Bolivian',
      'บอสเนียและเฮอร์เซโกวีนา': 'Bosnian and Herzegovinian',
      'บอตสวานา': 'Botswanan',
      'บราซิล': 'Brazilian',
      'บัลแกเรีย': 'Bulgarian',
      'บูร์กินาฟาโซ': 'Burkinabé',
      'บุรุนดี': 'Burundian',
      'กาบูเวร์ดี': 'Cape Verdean',
      'แคเมอรูน': 'Cameroonian',
      'สาธารณรัฐแอฟริกากลาง': 'Central African',
      'ชาด': 'Chadian',
      'ชิลี': 'Chilean',
      'โคลอมเบีย': 'Colombian',
      'คอโมโรส': 'Comoran',
      'คองโก': 'Congolese',
      'สาธารณรัฐประชาธิปไตยคองโก': 'Congolese',
      'คอสตาริกา': 'Costa Rican',
      'โกตดิวัวร์': 'Ivorian',
      'โครเอเชีย': 'Croatian',
      'คิวบา': 'Cuban',
      'ไซปรัส': 'Cypriot',
      'เช็ก': 'Czech',
      'เดนมาร์ก': 'Danish',
      'จิบูตี': 'Djiboutian',
      'โดมินิกา': 'Dominican',
      'สาธารณรัฐโดมินิกัน': 'Dominican',
      'เอกวาดอร์': 'Ecuadorean',
      'อียิปต์': 'Egyptian',
      'เอลซัลวาดอร์': 'Salvadoran',
      'อิเควทอเรียลกินี': 'Equatoguinean',
      'เอริเทรีย': 'Eritrean',
      'เอสโตเนีย': 'Estonian',
      'เอสวาตีนี': 'Swazi',
      'เอธิโอเปีย': 'Ethiopian',
      'ฟิจิ': 'Fijian',
      'ฟินแลนด์': 'Finnish',
      'กาบอง': 'Gabonese',
      'แกมเบีย': 'Gambian',
      'จอร์เจีย': 'Georgian',
      'กานา': 'Ghanaian',
      'กรีซ': 'Greek',
      'เกรเนดา': 'Grenadian',
      'กัวเตมาลา': 'Guatemalan',
      'กินี': 'Guinean',
      'กินี-บิสเซา': 'Bissau-Guinean',
      'กายอานา': 'Guyanese',
      'เฮติ': 'Haitian',
      'ฮอนดูรัส': 'Honduran',
      'ฮังการี': 'Hungarian',
      'ไอซ์แลนด์': 'Icelandic',
      'อิหร่าน': 'Iranian',
      'อิรัก': 'Iraqi',
      'ไอร์แลนด์': 'Irish',
      'อิสราเอล': 'Israeli',
      'อิตาลี': 'Italian',
      'จาเมกา': 'Jamaican',
      'จอร์แดน': 'Jordanian',
      'คาซัคสถาน': 'Kazakhstani',
      'เคนยา': 'Kenyan',
      'คิริบาส': 'I-Kiribati',
      'โคโซโว': 'Kosovar',
      'คูเวต': 'Kuwaiti',
      'คีร์กีซสถาน': 'Kyrgyzstani',
      'ลัตเวีย': 'Latvian',
      'เลบานอน': 'Lebanese',
      'เลโซโท': 'Basotho',
      'ไลบีเรีย': 'Liberian',
      'ลิเบีย': 'Libyan',
      'ลิกเตนสไตน์': 'Liechtensteiner',
      'ลิทัวเนีย': 'Lithuanian',
      'ลักเซมเบิร์ก': 'Luxembourgish',
      'มาดากัสการ์': 'Malagasy',
      'มาลาวี': 'Malawian',
      'มัลดีฟส์': 'Maldivian',
      'มาลี': 'Malian',
      'มอลตา': 'Maltese',
      'หมู่เกาะมาร์แชลล์': 'Marshallese',
      'มอริเตเนีย': 'Mauritanian',
      'มอริเชียส': 'Mauritian',
      'เม็กซิโก': 'Mexican',
      'ไมโครนีเซีย': 'Micronesian',
      'มอลโดวา': 'Moldovan',
      'โมนาโก': 'Monégasque',
      'มอนเตเนโกร': 'Montenegrin',
      'โมร็อกโก': 'Moroccan',
      'โมซัมบิก': 'Mozambican',
      'นามิเบีย': 'Namibian',
      'นาอูรู': 'Nauruan',
      'เนเธอร์แลนด์': 'Dutch',
      'นิวซีแลนด์': 'New Zealand',
      'นิการากัว': 'Nicaraguan',
      'ไนเจอร์': 'Nigerien',
      'ไนจีเรีย': 'Nigerian',
      'มาซิโดเนียเหนือ': 'Macedonian',
      'นอร์เวย์': 'Norwegian',
      'โอมาน': 'Omani',
      'ปาเลา': 'Palauan',
      'ปาเลสไตน์': 'Palestinian',
      'ปานามา': 'Panamanian',
      'ปาปัวนิวกินี': 'Papua New Guinean',
      'ปารากวัย': 'Paraguayan',
      'เปรู': 'Peruvian',
      'โปแลนด์': 'Polish',
      'โปรตุเกส': 'Portuguese',
      'กาตาร์': 'Qatari',
      'โรมาเนีย': 'Romanian',
      'รวันดา': 'Rwandan',
      'เซนต์คิตส์และเนวิส': 'Saint Kitts and Nevis',
      'เซนต์ลูเชีย': 'Saint Lucian',
      'เซนต์วินเซนต์และเกรนาดีนส์': 'Vincentian',
      'ซามัว': 'Samoan',
      'ซานมารีโน': 'Sammarinese',
      'เซาตูเมและปรินซิปี': 'São Toméan',
      'ซาอุดีอาระเบีย': 'Saudi Arabian',
      'เซเนกัล': 'Senegalese',
      'เซอร์เบีย': 'Serbian',
      'เซเชลส์': 'Seychellois',
      'เซียร์ราลีโอน': 'Sierra Leonean',
      'สโลวาเกีย': 'Slovak',
      'สโลวีเนีย': 'Slovenian',
      'หมู่เกาะโซโลมอน': 'Solomon Islander',
      'โซมาเลีย': 'Somali',
      'แอฟริกาใต้': 'South African',
      'ซูดานใต้': 'South Sudanese',
      'สเปน': 'Spanish',
      'ซูดาน': 'Sudanese',
      'ซูรินาม': 'Surinamese',
      'สวีเดน': 'Swedish',
      'สวิตเซอร์แลนด์': 'Swiss',
      'ซีเรีย': 'Syrian',
      'ไต้หวัน': 'Taiwanese',
      'ทาจิกิสถาน': 'Tajikistani',
      'แทนซาเนีย': 'Tanzanian',
      'ติมอร์-เลสเต': 'East Timorese',
      'โตโก': 'Togolese',
      'ตองกา': 'Tongan',
      'ตรินิแดดและโตเบโก': 'Trinidadian and Tobagonian',
      'ตูนิเซีย': 'Tunisian',
      'ตุรกี': 'Turkish',
      'เติร์กเมนิสถาน': 'Turkmen',
      'ตูวาลู': 'Tuvaluan',
      'ยูกันดา': 'Ugandan',
      'ยูเครน': 'Ukrainian',
      'สหรัฐอาหรับเอมิเรตส์': 'Emirati',
      'อุรุกวัย': 'Uruguayan',
      'อุซเบกิสถาน': 'Uzbekistani',
      'วานูอาตู': 'Vanuatuan',
      'นครรัฐวาติกัน': 'Vatican", "Vatican City',
      'เวเนซุเอลา': 'Venezuelan',
      'เยเมน': 'Yemeni',
      'แซมเบีย': 'Zambian',
      'ซิมบับเว': 'Zimbabwean',
    }
  };

  const t = (key: string) => {
    return TRANSLATIONS[locale]?.[key] || key;
  };

  const { user, loading: authLoading, setUser } = useAuth();

  const [form, setForm] = useState<ProfileForm>({
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    height: '',
    weight: '',
    gender: '',
    phone: '',
    email: '',
    experience: '',
    lineId: '',
    nationality: '',
    maritalStatus: '',
    militaryStatus: '',
    address: '',
    province: '',
    district: '',
    subDistrict: '',
    postalCode: '',
    religion: '',
    expectedSalary: '',
    desiredProvinces: [],
  });

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => 2567 - i);

  const profileSteps = [
    { icon: User, label: t('ข้อมูลส่วนบุคคล'), completed: true, active: true, path: '/profile' },
    { icon: GraduationCap, label: t('ประวัติการศึกษา'), completed: false, active: false, path: '/profile/education' },
    { icon: Briefcase, label: t('ประวัติการทำงาน'), completed: false, active: false, path: '/profile/work-history' },
    { icon: Languages, label: t('ความสามารถทางภาษา'), completed: false, active: false, path: '/profile/languages' },
    { icon: Car, label: t('ทักษะการขับขี่'), completed: false, active: false, path: '/profile/driving' },
    { icon: Award, label: t('ใบประกาศนียบัตร'), completed: false, active: false, path: '/profile/certificates' },
  ];


  const stepRoutes = [
    '/profile',
    '/profile/education',
    '/profile/work-history',
    '/profile/languages',
    '/profile/driving',
    '/profile/certificates',
  ];

  const [completionPercent, setCompletionPercent] = useState(0);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (completionPercent / 100) * circumference;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (!authLoading && user && user.role === 'EMPLOYER') {
      router.push('/');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/users/me/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        const resProv = await fetch(`${API_URL}/users/me/desired-provinces`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const provData = await resProv.json();

        let provincesArray: string[] = [];
        const rawData = Array.isArray(provData) ? provData : (provData?.provinces || []);

        provincesArray = rawData.map((p: any) => {
          if (typeof p === 'string') return p;
          return p.provinceName;
        });

        const p = data?.profile || data;

        if (p) {
          let bDay = '', bMonth = '', bYear = '';
          if (p.birthDate) {
            const d = new Date(p.birthDate);
            if (!isNaN(d.getTime())) {
              bDay = String(d.getDate());
              bMonth = String(d.getMonth() + 1);
              bYear = String(d.getFullYear() + 543);
            }
          }

          setForm({
            birthDay: bDay,
            birthMonth: bMonth,
            birthYear: bYear,
            height: p.height !== null && p.height !== undefined ? String(p.height) : '',
            weight: p.weight !== null && p.weight !== undefined ? String(p.weight) : '',
            gender: p.gender || '',
            phone: p.phone || '',
            email: user?.email || '',
            experience: p.experience !== null && p.experience !== undefined ? String(p.experience) : '',
            lineId: p.lineId || '',
            nationality: p.nationality || '',
            maritalStatus: p.maritalStatus || '',
            militaryStatus: p.militaryStatus || '',
            address: p.address || '',
            province: p.province || '',
            district: p.district || '',
            subDistrict: p.subDistrict || '',
            postalCode: p.postalCode || '',
            religion: p.religion || '',
            expectedSalary: p.expectedSalary !== null && p.expectedSalary !== undefined ? String(p.expectedSalary) : '',
            desiredProvinces: provincesArray,
          });
        }
      } catch (err) {
        console.error("Load error:", err);
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB' });
      return;
    }

    setUploadingAvatar(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `อัพโหลดไม่สำเร็จ (${res.status})`);
      }

      const data = await res.json();
      setMessage({ type: 'success', text: t('อัพโหลดรูปภาพโปรไฟล์สำเร็จ ✓') });

      if (user) {
        setUser({ ...user, avatarUrl: data.avatarUrl });
      }
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'เกิดข้อผิดพลาดในการอัพโหลดรูป') });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setMessage(null);
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    let birthDate: string | undefined;
    if (form.birthDay && form.birthMonth && form.birthYear) {
      const ceYear = Number(form.birthYear) - 543;
      const month = String(form.birthMonth).padStart(2, '0');
      const day = String(form.birthDay).padStart(2, '0');
      birthDate = `${ceYear}-${month}-${day}`;
    }

    const body = {
      birthDate,
      height: form.height !== '' ? Number(form.height) : null,
      weight: form.weight !== '' ? Number(form.weight) : null,
      gender: form.gender || null,
      phone: form.phone || null,
      lineId: form.lineId || null,
      experience: form.experience !== '' ? Number(form.experience) : 0,
      nationality: form.nationality || null,
      maritalStatus: form.maritalStatus || null,
      militaryStatus: form.militaryStatus || null,
      address: form.address || null,
      province: form.province || null,
      district: form.district || null,
      subDistrict: form.subDistrict || null,
      postalCode: form.postalCode || null,
      religion: form.religion || null,
      expectedSalary: form.expectedSalary !== '' ? Number(form.expectedSalary) : null,
    };

    try {
      const res = await fetch(`${API_URL}/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('accessToken');
          router.push('/login');
          return;
        }
        throw new Error(err.message || `บันทึกไม่สำเร็จ (${res.status})`);
      }

      const resProvince = await fetch(`${API_URL}/users/me/desired-provinces`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provinces: form.desiredProvinces }),
      });

      if (!resProvince.ok) throw new Error('บันทึกจังหวัดที่สนใจไม่สำเร็จ');

      setMessage({ type: 'success', text: t('บันทึกข้อมูลเรียบร้อยแล้ว ✓') });
      setCompletionPercent(17);
      setTimeout(() => router.push('/profile/education'), 1000);
    } catch (error: unknown) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'เกิดข้อผิดพลาด') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      {/* Progress Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #0e2a5e 40%, #1a3a7a 70%, #243b82 100%)',
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }}
          />
          <div
            className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03]"
            style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }}
          />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-linear-to-b from-blue-400 to-cyan-400" />
              <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-semibold tracking-wide">
                {t('ความสมบูรณ์ของโปรไฟล์')}
              </h2>
            </div>


          </div>

          {/* Main Glass Card */}
          <div
            className="rounded-2xl border border-white/10 p-6 md:p-8"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}
          >
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Progress Ring */}
              <div className="relative shrink-0">
                <div className="relative w-32 h-32 md:w-36 md:h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" />
                        <stop offset="50%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#22d3ee" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {completionPercent}%
                    </span>
                    <span className="text-[10px] text-blue-300/80 mt-0.5">{t('สำเร็จ')}</span>
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-full opacity-20 blur-xl"
                  style={{ background: 'radial-gradient(circle, #38bdf8, transparent)' }}
                />
              </div>

              {/* Steps */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-2">
                  {profileSteps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => router.push(stepRoutes[index])}
                        className={`group relative flex sm:flex-col items-center gap-3 sm:gap-2.5 p-3 sm:p-4 rounded-xl transition-all duration-300 cursor-pointer
                          ${step.active
                            ? 'bg-white/15 border border-white/20 shadow-lg shadow-blue-500/10'
                            : 'hover:bg-white/6 border border-transparent'
                          }`}
                      >
                        <div
                          className={`relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300
                          ${step.completed
                              ? 'bg-linear-to-br from-blue-400 to-cyan-400 shadow-md shadow-cyan-400/20'
                              : step.active
                                ? 'bg-white/15 border border-white/20'
                                : 'bg-white/6 border border-white/10'
                            }`}
                        >
                          {step.completed ? (
                            <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                          ) : (
                            <Icon
                              className={`w-5 h-5 ${step.active ? 'text-blue-300' : 'text-white/30'}`}
                            />
                          )}
                        </div>

                        <span
                          className={`text-xs sm:text-[11px] sm:text-center leading-tight font-medium transition-colors
                          ${step.active || step.completed ? 'text-white' : 'text-white/40 group-hover:text-white/60'}`}
                        >
                          {t(step.label)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden sm:block mt-5">
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${completionPercent}%`,
                        background: 'linear-gradient(90deg, #60a5fa, #38bdf8, #22d3ee)',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-white/30">
                    <span>{t('เริ่มต้น')}</span>
                    <span>{t('สมบูรณ์')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 pb-20">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div
            className="relative mx-auto md:mx-0 group cursor-pointer"
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            <div className="w-32 h-32 bg-gray-200 rounded-2xl flex items-center justify-center border-4 border-white shadow-md overflow-hidden relative">
              {uploadingAvatar ? (
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-gray-400">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-semibold">{t('เปลี่ยนรูป')}</span>
              </div>
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-10">
              <Plus className="w-5 h-5 pointer-events-none" />
            </button>
            <input
              type="file"
              id="avatar-upload"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="flex items-center gap-2 pt-4 md:pt-12 text-gray-700">
            <span className="text-lg font-medium">
              {user ? `${user.firstName} ${user.lastName}` : t('เพิ่มชื่อของคุณ')}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        </div>

        // Card: Personal Info
        <div className="bg-white rounded-xl shadow-2xl border border-gray-300 p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-800 mb-6">{t('ข้อมูลส่วนบุคคล')}</h2>

          {/* Row 1: Birthdate, Height, Weight, Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('วัน/เดือน/ปีที่เกิด')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <SearchableSelect
                  placeholder={t('วัน')}
                  value={form.birthDay}
                  onChange={(val) => setForm({ ...form, birthDay: val })}
                  options={days.map((d) => ({ value: String(d), label: String(d) }))}
                />
                <SearchableSelect
                  placeholder={t('เดือน')}
                  value={form.birthMonth}
                  onChange={(val) => setForm({ ...form, birthMonth: val })}
                  options={months.map((m, i) => ({ value: String(i + 1), label: t(m) }))}
                />
                <SearchableSelect
                  placeholder={t('ปี')}
                  value={form.birthYear}
                  onChange={(val) => setForm({ ...form, birthYear: val })}
                  options={years.map((y) => ({ value: String(y), label: String(y) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Height (cm.)</label>
                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleChange}
                  placeholder={t('โปรดระบุ')}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">Weight (kg.)</label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder={t('โปรดระบุ')}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 whitespace-nowrap">
                  {t('ประสบการณ์ (ปี)')}
                </label>
                <input
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  placeholder={t('โปรดระบุ')}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Gender, Phone */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('เงินเดือนที่ต้องการ')}</label>
              <input
                type="number"
                name="expectedSalary"
                value={form.expectedSalary}
                onChange={handleChange}
                placeholder={t('ระบุเป็นตัวเลข (เช่น 25000)')}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('เพศ')}</label>
              <div className="relative">
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">{t('โปรดเลือก')}</option>
                  <option value="male">{t('ชาย')}</option>
                  <option value="female">{t('หญิง')}</option>
                  <option value="other">{t('อื่นๆ')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('เบอร์โทรศัพท์มือถือ')}
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('โปรดระบุ')}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Row 3: LINE ID, Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t('LINE ID')} <span className="text-gray-500 font-normal ml-1">{t('(ไม่บังคับ)')}</span>
              </label>
              <input
                type="text"
                name="lineId"
                value={form.lineId}
                onChange={handleChange}
                placeholder={t('โปรดระบุ')}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('สัญชาติ')}</label>
              <SearchableSelect
                placeholder={t('พิมพ์เพื่อค้นหา...')}
                value={form.nationality}
                onChange={(val) => setForm({ ...form, nationality: val })}
                options={NATIONALITIES.map((n) => ({ value: n, label: t(n) }))} // <--- ตรงนี้เรียก t(n) เพื่อแปล label ของแต่ละสัญชาติ
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('ศาสนา')}</label>
              <input
                type="text"
                name="religion"
                value={form.religion}
                onChange={handleChange}
                placeholder={t('โปรดระบุ')}
                className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Row 4: Marital, Military */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('สถานภาพสมรส')}</label>
              <div className="relative">
                <select
                  name="maritalStatus"
                  value={form.maritalStatus}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">{t('โปรดเลือก')}</option>
                  <option value="โสด">{t('โสด')}</option>
                  <option value="สมรส">{t('สมรส')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('สถานภาพทางทหาร')}</label>
              <div className="relative">
                <select
                  name="militaryStatus"
                  value={form.militaryStatus}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">{t('โปรดเลือก')}</option>
                  <option value="ได้รับการยกเว้น">{t('ได้รับการยกเว้น')}</option>
                  <option value="ผ่านการเกณฑ์ทหารแล้ว">{t('ผ่านการเกณฑ์ทหารแล้ว')}</option>
                  <option value="ยังไม่ผ่านการเกณฑ์ทหาร">{t('ยังไม่ผ่านการเกณฑ์ทหาร')}</option>
                </select>
                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 5: Location */}
          <ThaiAddressFields
            locale={locale}
            province={form.province}
            district={form.district}
            subDistrict={form.subDistrict}
            postalCode={form.postalCode}
            onChange={(fields) => setForm(prev => ({ ...prev, ...fields }))}
          />

          {/* Row 6: Interest Province */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('จังหวัดที่สนใจทำงาน (เลือกได้หลายที่)')}
            </label>
            <ProvinceSelect
              locale={locale}
              selectedProvinces={form.desiredProvinces || []}
              onChange={(provinces) => setForm(prev => ({ ...prev, desiredProvinces: provinces }))}
            />
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm font-medium ${message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
                }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-center mb-8">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-[#d32f2f] hover:bg-[#b71c1c] text-white px-12 py-3 rounded-lg font-bold text-lg shadow-md transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('กำลังบันทึก...')}
                </>
              ) : (
                t('บันทึกและถัดไป')
              )}
            </button>
          </div>
        </div>

        <div className="absolute top-0 right-0 p-4 hidden">
          <div className="flex items-center gap-2 text-gray-500">
            <EyeOff className="w-5 h-5 cursor-pointer" />
            <Lock className="w-5 h-5 cursor-pointer" />
            <FileText className="w-5 h-5 cursor-pointer" />
            <Trash2 className="w-5 h-5 cursor-pointer" />
            <Share2 className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}