'use client';

import { useState, useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';
import { X } from 'lucide-react';

const DATA_URL = 'https://cdn.jsdelivr.net/gh/earthchie/jquery.Thailand.js@master/jquery.Thailand.js/database/raw_database/raw_database.json';

// ดิกชันนารีแปลชื่อจังหวัดเป็นภาษาอังกฤษ
const PROVINCE_EN_MAP: Record<string, string> = {
    'กรุงเทพมหานคร': 'Bangkok', 'กระบี่': 'Krabi', 'กาญจนบุรี': 'Kanchanaburi', 'กาฬสินธุ์': 'Kalasin',
    'กำแพงเพชร': 'Kamphaeng Phet', 'ขอนแก่น': 'Khon Kaen', 'จันทบุรี': 'Chanthaburi', 'ฉะเชิงเทรา': 'Chachoengsao',
    'ชลบุรี': 'Chonburi', 'ชัยนาท': 'Chainat', 'ชัยภูมิ': 'Chaiyaphum', 'ชุมพร': 'Chumphon',
    'เชียงราย': 'Chiang Rai', 'เชียงใหม่': 'Chiang Mai', 'ตรัง': 'Trang', 'ตราด': 'Trat',
    'ตาก': 'Tak', 'นครนายก': 'Nakhon Nayok', 'นครปฐม': 'Nakhon Pathom', 'นครพนม': 'Nakhon Phanom',
    'นครราชสีมา': 'Nakhon Ratchasima', 'นครศรีธรรมราช': 'Nakhon Si Thammarat', 'นครสวรรค์': 'Nakhon Sawan',
    'นนทบุรี': 'Nonthaburi', 'นราธิวาส': 'Narathiwat', 'น่าน': 'Nan', 'บึงกาฬ': 'Bueng Kan',
    'บุรีรัมย์': 'Buri Ram', 'ปทุมธานี': 'Pathum Thani', 'ประจวบคีรีขันธ์': 'Prachuap Khiri Khan',
    'ปราจีนบุรี': 'Prachin Buri', 'ปัตตานี': 'Pattani', 'พระนครศรีอยุธยา': 'Phra Nakhon Si Ayutthaya',
    'พะเยา': 'Phayao', 'พังงา': 'Phang Nga', 'พัทลุง': 'Phatthalung', 'พิจิตร': 'Phichit',
    'พิษณุโลก': 'Phitsanulok', 'เพชรบุรี': 'Phetchaburi', 'เพชรบูรณ์': 'Phetchabun', 'แพร่': 'Phrae',
    'ภูเก็ต': 'Phuket', 'มหาสารคาม': 'Maha Sarakham', 'มุกดาหาร': 'Mukdahan', 'แม่ฮ่องสอน': 'Mae Hong Son',
    'ยโสธร': 'Yasothon', 'ยะลา': 'Yala', 'ร้อยเอ็ด': 'Roi Et', 'ระนอง': 'Ranong',
    'ระยอง': 'Rayong','ราชบุรี': 'Ratchaburi', 'ลพบุรี': 'Lopburi', 'ลำปาง': 'Lampang', 'ลำพูน': 'Lamphun', 'เลย': 'Loei',
    'ศรีสะเกษ': 'Si Sa Ket', 'สกลนคร': 'Sakon Nakhon', 'สงขลา': 'Songkhla', 'สตูล': 'Satun',
    'สมุทรปราการ': 'Samut Prakan', 'สมุทรสงคราม': 'Samut Songkhram', 'สมุทรสาคร': 'Samut Sakhon',
    'สระแก้ว': 'Sa Kaeo', 'สระบุรี': 'Saraburi', 'สิงห์บุรี': 'Sing Buri', 'สุโขทัย': 'Sukhothai',
    'สุพรรณบุรี': 'Suphan Buri', 'สุราษฎร์ธานี': 'Surat Thani', 'สุรินทร์': 'Surin', 'หนองคาย': 'Nong Khai',
    'หนองบัวลำภู': 'Nong Bua Lamphu', 'อ่างทอง': 'Ang Thong', 'อำนาจเจริญ': 'Amnat Charoen',
    'อุดรธานี': 'Udon Thani', 'อุตรดิตถ์': 'Uttaradit', 'อุทัยธานี': 'Uthai Thani', 'อุบลราชธานี': 'Ubon Ratchathani'
};

interface Props {
    locale: 'th' | 'en';
    selectedProvinces: string[];
    onChange: (provinces: string[]) => void;
}

export function ProvinceSelect({ selectedProvinces = [], onChange, locale }: Props) {
    const [provinces, setProvinces] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const getLabel = (name: string) => {
        if (locale === 'en' && PROVINCE_EN_MAP[name]) {
            return PROVINCE_EN_MAP[name];
        }
        return name;
    };

    const t = {
        th: {
            loading: 'กำลังโหลด...',
            search: 'พิมพ์ชื่อจังหวัดเพื่อค้นหา...',
            empty: 'ยังไม่ได้เลือกจังหวัด (สามารถเลือกได้หลายจังหวัด)'
        },
        en: {
            loading: 'Loading...',
            search: 'Type province name to search...',
            empty: 'No province selected (multiple provinces can be selected)'
        }
    }[locale || 'th'];

    useEffect(() => {
        fetch(DATA_URL)
            .then((r) => r.json())
            .then((json: any[]) => {
                const uniqueProvinces = [...new Set(json.map((d: any) => d.province))].sort((a: any, b: any) =>
                    a.localeCompare(b, 'th')
                );
                setProvinces(uniqueProvinces);
            })
            .catch(err => console.error("Fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleSelect = (province: string) => {
        if (!selectedProvinces.includes(province)) {
            onChange([...selectedProvinces, province]);
        }
    };

    const handleRemove = (province: string) => {
        onChange(selectedProvinces.filter(p => p !== province));
    };

    return (
        <div className="space-y-3">
            <SearchableSelect
                locale={locale} // <-- ส่ง locale เข้าไปที่นี่
                placeholder={loading ? t.loading : t.search}
                value=""
                onChange={handleSelect}
                options={provinces
                    .filter(p => !selectedProvinces.includes(p))
                    .map((p) => ({ value: p, label: getLabel(p) })) // ✔️ ใช้ getLabel เพื่อแปลงชื่อจังหวัดตาม locale
                }
            />

            <div className="flex flex-wrap gap-2">
                {selectedProvinces.map((p) => (
                    <span
                        key={p}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                        {getLabel(p)}
                        <button
                            type="button"
                            onClick={() => handleRemove(p)}
                            className="hover:text-blue-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ))}
                {selectedProvinces.length === 0 && !loading && (
                    <span className="text-gray-400 text-sm">{t.empty}</span>
                )}
            </div>
        </div>
    );
}