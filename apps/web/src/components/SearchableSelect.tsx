'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  // เพิ่ม 2 บรรทัดนี้เข้าไปครับ
  locale?: 'th' | 'en'; 
  isMulti?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'พิมพ์เพื่อค้นหา...',
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  
  // ใส่นำค้นหาที่ผู้ใช้กำลังพิมพ์จริง
  const [typedSearch, setTypedSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ค้นหาวัตถุ option ปัจจุบันที่ตรงกับ value เพื่อเอาฉลาก (Label) มาแสดงผลให้ถูกภาษา
  const currentOption = options.find((o) => o.value === value);

  // กำหนดข้อความที่จะแสดงในช่อง Input: ถ้ากำลังพิมพ์ให้ใช้ค่าที่พิมพ์ ถ้าไม่ได้พิมพ์ให้ดึง Label ของค่านั้นๆ มาแสดง
  const displayInputValue = isTyping ? typedSearch : (currentOption?.label || value);

  // ตัวกรอง Logic: ถ้ากำลังพิมพ์และมีคำค้นหา ให้ค้นหาจาก label ในตัวเลือก
  const filtered = isTyping && typedSearch
    ? options.filter((o) => o.label.toLowerCase().includes(typedSearch.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // เมื่อปิด Dropdown ให้รีเซ็ตสถานะกลับมาโหมดปกติ (ไม่ใช่โหมดกำลังพิมพ์)
  useEffect(() => {
    if (!open) {
      setIsTyping(false);
      setTypedSearch('');
    }
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setIsTyping(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setTypedSearch(inputValue);
    setIsTyping(true);
    
    // พยายามหาว่าสิ่งที่พิมพ์ตรงกับ option ไหนไหม ถ้าใช่ให้ส่งค่านั้นไป ถ้าไม่ใช่ให้ส่งค่าดิบๆ ไปก่อน
    const matchedOption = options.find((o) => o.label.toLowerCase() === inputValue.toLowerCase());
    onChange(matchedOption ? matchedOption.value : inputValue);
    
    if (!open) setOpen(true);
  };

  const handleFocus = () => {
    setOpen(true);
    setIsTyping(false); // ตอนคลิกเข้ามาดึงรายการทั้งหมดขึ้นมาก่อน ไม่ต้องกรอง
    
    // ไฮไลต์ข้อความอัตโนมัติเพื่อให้พิมพ์ทับได้ง่ายๆ
    setTimeout(() => {
      inputRef.current?.select();
    }, 50);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={displayInputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className="w-full bg-gray-100 border border-gray-300 text-gray-700 py-2.5 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400 cursor-text pr-8"
      />
      <ChevronDown
        className={`absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
      />

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 italic">
              ไม่มีในรายการ (ระบบจะใช้ค่าที่คุณพิมพ์)
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${opt.value === value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                  }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}