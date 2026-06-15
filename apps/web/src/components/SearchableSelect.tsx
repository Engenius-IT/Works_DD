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
  locale?: 'th' | 'en'; // 1. เพิ่ม prop locale
}

export function SearchableSelect({
  options = [], 
  value,
  onChange,
  placeholder = 'พิมพ์เพื่อค้นหา...',
  className = '',
  locale = 'th', // 2. กำหนดค่าเริ่มต้นเป็น 'th'
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const matchedOption = options.find((o) => o?.value === value);
    setSearchQuery(matchedOption ? matchedOption.label : value || '');
  }, [value, options]);

  const filtered = searchQuery
    ? options.filter((o) => {
        const labelText = o?.label?.toLowerCase() || '';
        const searchValue = searchQuery.toLowerCase();
        return labelText.includes(searchValue);
      })
    : options;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onChange(e.target.value); // ให้ค่าที่พิมพ์ไปอัปเดต parent โดยตรงเผื่อไม่มีในลิสต์
    if (!open) setOpen(true);
  };

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
  };

  // ปิด dropdown เมื่อคลิกพื้นที่ข้างนอก
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
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
              {locale === 'en' 
                ? 'Not in the list (system will use your typed value)' 
                : 'ไม่มีในรายการ (ระบบจะใช้ค่าที่คุณพิมพ์)'}
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer ${
                  opt.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
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