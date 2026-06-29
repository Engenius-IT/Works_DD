'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Company {
  name: string;
  logoUrl?: string | null;
}

interface CompanyLogoProps {
  company: Company;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompanyLogo({ company, size = 'md', className = '' }: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);

  const dims = {
    xs: 'w-4 h-4 text-[9px] rounded-sm',
    sm: 'w-10 h-10 text-sm rounded-lg',
    md: 'w-14 h-14 text-xl rounded-xl',
    lg: 'w-20 h-20 text-3xl rounded-2xl',
  };

  const initial = company?.name ? company.name.charAt(0).toUpperCase() : '?';

  if (company?.logoUrl && !imageError) {
    return (
      <div className={`relative ${dims[size]} shrink-0 overflow-hidden border border-gray-100 bg-white ${className}`}>
        <Image
          src={company.logoUrl}
          alt={company.name || 'Company Logo'}
          fill
          sizes="(max-width: 768px) 80px, 80px"
          className="object-contain p-1"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims[size]} bg-[#1a1c3d] text-white flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
