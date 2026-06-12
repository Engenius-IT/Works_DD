'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, LayoutGrid, Home } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/* ─── Types ─── */
type GroupItem = {
  id: string;
  name: string;
  count: number;
  href: string;
  icon: React.ReactNode;
};

type JobGroup = {
  id: string;
  title: string;
  subtitle: string;
  headerIcon: React.ReactNode;
  headerGradient: string;
  cardAccent: string;
  cardHoverBorder: string;
  cardCountColor: string;
  items: GroupItem[];
};

type ApiGroupItem = {
  id: string;
  name: string;
  count: number;
  href: string;
};

type ApiJobGroup = {
  id: string;
  title: string;
  subtitle: string;
  items: ApiGroupItem[];
};

type ApiStats = {
  groupCount: number;
  categoryCount: number;
  totalJobs: number;
};

/* ─── SVG Icons for Storefront ─── */
const SalesIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="20" width="32" height="22" rx="3" fill="#FED7AA" />
    <rect x="12" y="6" width="24" height="16" rx="2" fill="#FB923C" />
    <path d="M20 28h8v14h-8z" fill="#FDBA74" />
    <circle cx="24" cy="14" r="4" fill="#FFF7ED" />
    <path
      d="M6 20l18-14 18 14"
      stroke="#EA580C"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
const FoodIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <ellipse cx="24" cy="36" rx="18" ry="6" fill="#FED7AA" />
    <path d="M6 30c0-10 8-20 18-20s18 10 18 20" fill="#FB923C" />
    <path d="M6 30h36" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="16" cy="24" r="2" fill="#FFF7ED" />
    <circle cx="24" cy="22" r="2" fill="#FFF7ED" />
    <circle cx="32" cy="24" r="2" fill="#FFF7ED" />
  </svg>
);
const ServiceIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="18" r="10" fill="#FB923C" />
    <circle cx="24" cy="18" r="6" fill="#FFF7ED" />
    <path d="M14 34c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="#FED7AA" />
    <path
      d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16"
      stroke="#EA580C"
      strokeWidth="2.5"
      fill="none"
    />
  </svg>
);
const StoreIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="18" width="36" height="24" rx="2" fill="#FED7AA" />
    <path d="M4 18h40l-4-12H8L4 18z" fill="#FB923C" />
    <rect x="18" y="28" width="12" height="14" rx="1" fill="#FFF7ED" />
    <rect x="10" y="24" width="6" height="6" rx="1" fill="#FDBA74" />
    <rect x="32" y="24" width="6" height="6" rx="1" fill="#FDBA74" />
  </svg>
);
const HotelIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="12" width="32" height="28" rx="3" fill="#FED7AA" />
    <rect x="12" y="4" width="24" height="10" rx="2" fill="#FB923C" />
    <rect x="14" y="18" width="8" height="6" rx="1" fill="#FFF7ED" />
    <rect x="26" y="18" width="8" height="6" rx="1" fill="#FFF7ED" />
    <rect x="14" y="28" width="8" height="6" rx="1" fill="#FFF7ED" />
    <rect x="26" y="28" width="8" height="6" rx="1" fill="#FFF7ED" />
    <rect x="20" y="34" width="8" height="8" rx="1" fill="#FDBA74" />
  </svg>
);

/* ─── SVG Icons for Office ─── */
const MarketingIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="10" width="28" height="28" rx="4" fill="#BFDBFE" />
    <path
      d="M14 30l6-8 5 5 9-13"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="36" cy="14" r="8" fill="#3B82F6" />
    <path
      d="M33 14l2 2 4-4"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);
const TechIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="8" width="40" height="26" rx="3" fill="#BFDBFE" />
    <rect x="8" y="12" width="32" height="18" rx="1" fill="#1E40AF" />
    <path
      d="M16 20l-4 4 4 4"
      stroke="#60A5FA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M32 20l4 4-4 4"
      stroke="#60A5FA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path d="M22 28l4-12" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" fill="none" />
    <rect x="16" y="36" width="16" height="3" rx="1.5" fill="#93C5FD" />
  </svg>
);
const AccountingIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="6" y="6" width="36" height="36" rx="4" fill="#BFDBFE" />
    <rect x="10" y="10" width="28" height="28" rx="2" fill="#EFF6FF" />
    <path d="M18 18h12M18 24h12M18 30h8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="13" cy="18" r="2" fill="#3B82F6" />
    <circle cx="13" cy="24" r="2" fill="#60A5FA" />
    <circle cx="13" cy="30" r="2" fill="#93C5FD" />
  </svg>
);
const FactoryIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="24" width="40" height="18" rx="2" fill="#BFDBFE" />
    <path
      d="M4 24l10-16v16l10-12v12l10-12v12"
      stroke="#2563EB"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="8" y="30" width="6" height="6" rx="1" fill="#EFF6FF" />
    <rect x="18" y="30" width="6" height="6" rx="1" fill="#EFF6FF" />
    <rect x="28" y="30" width="6" height="6" rx="1" fill="#EFF6FF" />
  </svg>
);
const DocumentIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="4" width="24" height="32" rx="3" fill="#BFDBFE" />
    <rect x="14" y="8" width="16" height="24" rx="1" fill="#EFF6FF" />
    <path d="M18 14h8M18 19h8M18 24h5" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="16" y="32" width="20" height="12" rx="2" fill="#3B82F6" />
    <path d="M22 38h8M22 41h5" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const HRIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <circle cx="18" cy="16" r="8" fill="#BFDBFE" />
    <circle cx="18" cy="16" r="4" fill="#3B82F6" />
    <circle cx="34" cy="16" r="6" fill="#93C5FD" />
    <circle cx="34" cy="16" r="3" fill="#3B82F6" />
    <path d="M4 40c0-8 6-14 14-14s14 6 14 14" fill="#BFDBFE" stroke="#2563EB" strokeWidth="2" />
    <path d="M24 40c0-6 4-10 10-10s10 4 10 10" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
  </svg>
);
const EngineerIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="20" width="32" height="22" rx="2" fill="#BFDBFE" />
    <path
      d="M6 20l18-14 18 14"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <rect x="16" y="28" width="6" height="6" rx="1" fill="#EFF6FF" />
    <rect x="26" y="28" width="6" height="6" rx="1" fill="#EFF6FF" />
    <path d="M36 8l4 4-8 8-4-4z" fill="#3B82F6" />
    <path d="M38 6l4 4" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const FreelanceIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" fill="#BFDBFE" />
    <circle cx="24" cy="24" r="14" fill="#EFF6FF" />
    <path
      d="M24 10v14l8 8"
      stroke="#2563EB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="24" r="2" fill="#3B82F6" />
  </svg>
);
const ExecutiveIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="8" width="28" height="32" rx="3" fill="#BFDBFE" />
    <rect x="14" y="4" width="20" height="8" rx="2" fill="#3B82F6" />
    <circle cx="24" cy="22" r="6" fill="#EFF6FF" />
    <path d="M15 36c0-5 4-9 9-9s9 4 9 9" fill="#DBEAFE" />
    <path
      d="M21 20l3 3 5-5"
      stroke="#2563EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const MedicalIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="8" y="8" width="32" height="32" rx="8" fill="#BFDBFE" />
    <rect x="20" y="14" width="8" height="20" rx="2" fill="#3B82F6" />
    <rect x="14" y="20" width="20" height="8" rx="2" fill="#3B82F6" />
    <rect x="22" y="16" width="4" height="16" rx="1" fill="#EFF6FF" />
    <rect x="16" y="22" width="16" height="4" rx="1" fill="#EFF6FF" />
  </svg>
);
const EducationIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M24 6L4 18l20 12 20-12L24 6z" fill="#BFDBFE" />
    <path d="M24 6L4 18l20 12 20-12L24 6z" stroke="#2563EB" strokeWidth="2" fill="none" />
    <path d="M10 22v12c0 4 6 8 14 8s14-4 14-8V22" stroke="#3B82F6" strokeWidth="2" fill="none" />
    <rect x="38" y="18" width="3" height="16" rx="1.5" fill="#3B82F6" />
    <circle cx="39.5" cy="36" r="3" fill="#60A5FA" />
  </svg>
);
const EntertainmentIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="18" fill="#BFDBFE" />
    <path d="M20 16v16l14-8-14-8z" fill="#3B82F6" />
    <path
      d="M20 16v16l14-8-14-8z"
      stroke="#1E40AF"
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="24" r="18" stroke="#2563EB" strokeWidth="2" fill="none" />
  </svg>
);

/* ─── SVG Icons for Regions ─── */
const BangkokIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="10" y="14" width="10" height="28" rx="1" fill="#A7F3D0" />
    <rect x="24" y="8" width="14" height="34" rx="1" fill="#6EE7B7" />
    <rect x="4" y="22" width="8" height="20" rx="1" fill="#D1FAE5" />
    <rect x="12" y="18" width="4" height="4" rx="0.5" fill="#FFF" />
    <rect x="12" y="26" width="4" height="4" rx="0.5" fill="#FFF" />
    <rect x="28" y="12" width="4" height="4" rx="0.5" fill="#FFF" />
    <rect x="28" y="20" width="4" height="4" rx="0.5" fill="#FFF" />
    <rect x="28" y="28" width="4" height="4" rx="0.5" fill="#FFF" />
    <rect x="34" y="12" width="4" height="4" rx="0.5" fill="#FFF" />
  </svg>
);
const CentralIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="32" width="40" height="8" rx="2" fill="#A7F3D0" />
    <path d="M8 32c4-8 8-20 16-20s12 12 16 20" fill="#6EE7B7" />
    <path d="M16 28c2-4 4-8 8-8s6 4 8 8" fill="#34D399" />
    <circle cx="24" cy="18" r="3" fill="#FFF" opacity="0.6" />
  </svg>
);
const WestIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M4 40L16 8l12 16L40 4v36H4z" fill="#A7F3D0" />
    <path d="M4 40L16 14l8 10 8-8 8-6v30H4z" fill="#6EE7B7" />
    <circle cx="20" cy="20" r="4" fill="#34D399" />
    <path
      d="M18 20l2 2 4-4"
      stroke="#FFF"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const EastIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M0 36c8-2 16-4 24-4s16 2 24 4v8H0v-8z" fill="#A7F3D0" />
    <path
      d="M4 34c6-1 12-2 20-2s14 1 20 2"
      stroke="#34D399"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="16" cy="20" r="6" fill="#6EE7B7" />
    <path d="M32 14l4-6 4 6" fill="#34D399" />
    <rect x="34" y="14" width="4" height="12" rx="1" fill="#A7F3D0" />
  </svg>
);
const NortheastIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <rect x="4" y="28" width="40" height="12" rx="2" fill="#A7F3D0" />
    <path d="M12 28c2-6 4-12 4-18" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
    <path d="M8 28c4-6 8-14 8-22" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
    <path d="M28 28c2-6 4-12 4-18" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
    <path d="M24 28c4-6 8-14 8-22" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="8" r="3" fill="#34D399" />
    <circle cx="26" cy="8" r="3" fill="#34D399" />
  </svg>
);
const NorthIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M4 42L24 4l20 38H4z" fill="#A7F3D0" />
    <path d="M12 42L24 14l12 28H12z" fill="#6EE7B7" />
    <path d="M18 42L24 22l6 20H18z" fill="#34D399" />
    <circle cx="24" cy="16" r="3" fill="#FFF" opacity="0.5" />
  </svg>
);
const SouthIcon = () => (
  <svg width="36" height="36" viewBox="0 0 48 48" fill="none">
    <path d="M4 36c8-4 16-8 24-4s8 4 16 4v6H4v-6z" fill="#A7F3D0" />
    <rect x="16" y="10" width="4" height="22" rx="2" fill="#6EE7B7" />
    <path
      d="M14 10c0 0 4-6 8-6s6 4 6 8-3 8-6 10"
      stroke="#34D399"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="32" cy="28" r="4" fill="#34D399" />
    <circle cx="36" cy="22" r="2" fill="#A7F3D0" />
  </svg>
);

/* ─── Group Data Helper ─── */
const getInitialGroups = (t: any): JobGroup[] => [
  {
    id: 'storefront',
    title: t("groups.storefront.title"),
    subtitle: t("groups.storefront.subtitle"),
    headerGradient: 'bg-gradient-to-r from-[#020263] via-[#1a1a8a] to-[#E71F29]',
    headerIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
        <path d="M3 21V8l9-5 9 5v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 21v-6h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cardAccent: 'bg-gradient-to-r from-[#E71F29] to-[#F97316]',
    cardHoverBorder: 'hover:border-[#E71F29]/40',
    cardCountColor: 'text-[#E71F29]',
    items: [
      { id: 'sales', name: t("groups.storefront.items.sales"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%82%E0%B8%B2%E0%B8%A2', icon: <SalesIcon /> },
      { id: 'food', name: t("groups.storefront.items.food"), count: 0, href: '/jobs?keyword=%E0%B8%AD%E0%B8%B2%E0%B8%AB%E0%B8%B2%E0%B8%A3', icon: <FoodIcon /> },
      { id: 'service', name: t("groups.storefront.items.service"), count: 0, href: '/jobs?keyword=%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A5%E0%B8%B9%E0%B8%81%E0%B8%84%E0%B9%89%E0%B8%B2', icon: <ServiceIcon /> },
      { id: 'retail', name: t("groups.storefront.items.retail"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AA%E0%B8%B4%E0%B8%99%E0%B8%84%E0%B9%89%E0%B8%B2%E0%B8%82%E0%B8%B2%E0%B8%A2%E0%B8%9B%E0%B8%A5%E0%B8%B5%E0%B8%81%E0%B9%81%E0%B8%A5%E0%B8%B0%E0%B8%AD%E0%B8%B8%E0%B8%9B%E0%B9%82%E0%B8%A0%E0%B8%84%E0%B8%9A%E0%B8%A3%E0%B8%B4%E0%B9%82%E0%B8%A0%E0%B8%84', icon: <StoreIcon /> },
      { id: 'hotel', name: t("groups.storefront.items.hotel"), count: 0, href: '/jobs?keyword=%E0%B9%82%E0%B8%A3%E0%B8%87%E0%B9%81%E0%B8%A3%E0%B8%A1', icon: <HotelIcon /> },
    ],
  },
  {
    id: 'office',
    title: t("groups.office.title"),
    subtitle: t("groups.office.subtitle"),
    headerGradient: 'bg-gradient-to-r from-[#020263] via-[#1a1a8a] to-[#3B82F6]',
    headerIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M9 22v-4h6v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8.5" cy="7" r="1" fill="currentColor" /><circle cx="12" cy="7" r="1" fill="currentColor" /><circle cx="15.5" cy="7" r="1" fill="currentColor" />
        <circle cx="8.5" cy="11" r="1" fill="currentColor" /><circle cx="12" cy="11" r="1" fill="currentColor" /><circle cx="15.5" cy="11" r="1" fill="currentColor" />
      </svg>
    ),
    cardAccent: 'bg-gradient-to-r from-[#3B82F6] to-[#6366F1]',
    cardHoverBorder: 'hover:border-[#3B82F6]/40',
    cardCountColor: 'text-[#3B82F6]',
    items: [
      { id: 'marketing', name: t("groups.office.items.marketing"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%20%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%AA%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%AA%E0%B8%B2%E0%B8%A3', icon: <MarketingIcon /> },
      { id: 'tech', name: t("groups.office.items.tech"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%84%E0%B8%AD%E0%B8%97%E0%B8%B5%20%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B9%80%E0%B8%97%E0%B8%84%E0%B9%82%E0%B8%99%E0%B9%82%E0%B8%A5%E0%B8%A2%E0%B8%B5%E0%B8%AA%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%AA%E0%B8%B2%E0%B8%A3', icon: <TechIcon /> },
      { id: 'accounting', name: t("groups.office.items.accounting"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%9A%E0%B8%B1%E0%B8%8D%E0%B8%8A%E0%B8%B5', icon: <AccountingIcon /> },
      { id: 'factory', name: t("groups.office.items.factory"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%9C%E0%B8%A5%E0%B8%B4%E0%B8%95%20%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%20%E0%B8%82%E0%B8%99%E0%B8%AA%E0%B9%88%E0%B8%87', icon: <FactoryIcon /> },
      { id: 'admin', name: t("groups.office.items.admin"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%98%E0%B8%B8%E0%B8%A3%E0%B8%81%E0%B8%B2%E0%B8%A3', icon: <DocumentIcon /> },
      { id: 'hr', name: t("groups.office.items.hr"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%74%E0%B8%A3%E0%B8%B1%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B8%A3%E0%B8%9A%E0%B8%B8%E0%B8%84%E0%B8%84%E0%B8%A5', icon: <HRIcon /> },
      { id: 'engineer', name: t("groups.office.items.engineer"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%A7%E0%B8%B4%E0%B8%A8%E0%B8%A7%E0%B8%81%E0%B8%A3%E0%B8%A3%E0%B8%A1', icon: <EngineerIcon /> },
      { id: 'freelance', name: t("groups.office.items.freelance"), count: 0, href: '/jobs?jobType=PART_TIME,FREELANCE', icon: <FreelanceIcon /> },
      { id: 'executive', name: t("groups.office.items.executive"), count: 0, href: '/jobs?keyword=%E0%B8%9C%E0%B8%B9%E0%B9%89%E0%B8%88%E0%B8%B1%E0%B8%94%E0%B8%81%E0%B8%B2%E0%B8%A3', icon: <ExecutiveIcon /> },
      { id: 'medical', name: t("groups.office.items.medical"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B9%81%E0%B8%9E%E0%B8%97%E0%B8%A2%E0%B9%8C', icon: <MedicalIcon /> },
      { id: 'education', name: t("groups.office.items.education"), count: 0, href: '/jobs?category=%E0%B8%87%E0%B8%B2%E0%B8%99%E0%B8%81%E0%B8%B2%E0%B8%A3%E0%B8%A8%E0%B8%B6%E0%B8%81%E0%B8%A9%E0%B8%B2', icon: <EducationIcon /> },
      { id: 'entertainment', name: t("groups.office.items.entertainment"), count: 0, href: '/jobs?keyword=%E0%B8%81%E0%B8%AD%E0%B8%87%E0%B8%96%E0%B9%88%E0%B8%B2%E0%B8%A2', icon: <EntertainmentIcon /> },
    ],
  },
  {
    id: 'regional',
    title: t("groups.regional.title"),
    subtitle: t("groups.regional.subtitle"),
    headerGradient: 'bg-gradient-to-r from-[#020263] via-[#065f46] to-[#059669]',
    headerIcon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="9" r="3" fill="currentColor" opacity="0.5" /><circle cx="12" cy="9" r="1.5" fill="currentColor" />
      </svg>
    ),
    cardAccent: 'bg-gradient-to-r from-[#059669] to-[#10B981]',
    cardHoverBorder: 'hover:border-[#059669]/40',
    cardCountColor: 'text-[#059669]',
    items: [
      { id: 'bangkok', name: t("groups.regional.items.bangkok"), count: 0, href: '/resumes?desiredProvince=vicinity', icon: <BangkokIcon /> },
      { id: 'central', name: t("groups.regional.items.central"), count: 0, href: '/resumes?region=central', icon: <CentralIcon /> },
      { id: 'west', name: t("groups.regional.items.west"), count: 0, href: '/resumes?region=west', icon: <WestIcon /> },
      { id: 'east', name: t("groups.regional.items.east"), count: 0, href: '/resumes?region=east', icon: <EastIcon /> },
      { id: 'northeast', name: t("groups.regional.items.northeast"), count: 0, href: '/resumes?region=northeast', icon: <NortheastIcon /> },
      { id: 'north', name: t("groups.regional.items.north"), count: 0, href: '/resumes?region=north', icon: <NorthIcon /> },
      { id: 'south', name: t("groups.regional.items.south"), count: 0, href: '/resumes?region=south', icon: <SouthIcon /> },
    ],
  },
];

const groupIconMap: Record<string, Record<string, React.ReactNode>> = {
  storefront: { sales: <SalesIcon />, food: <FoodIcon />, service: <ServiceIcon />, retail: <StoreIcon />, hotel: <HotelIcon /> },
  office: { marketing: <MarketingIcon />, tech: <TechIcon />, accounting: <AccountingIcon />, factory: <FactoryIcon />, admin: <DocumentIcon />, hr: <HRIcon />, engineer: <EngineerIcon />, freelance: <FreelanceIcon />, executive: <ExecutiveIcon />, medical: <MedicalIcon />, education: <EducationIcon />, entertainment: <EntertainmentIcon /> },
  regional: { bangkok: <BangkokIcon />, central: <CentralIcon />, west: <WestIcon />, east: <EastIcon />, northeast: <NortheastIcon />, north: <NorthIcon />, south: <SouthIcon /> },
};

function formatJobCount(count: number) {
  return new Intl.NumberFormat('th-TH').format(count);
}

function mergeGroupsWithApiData(fallbackGroups: JobGroup[], apiGroups: ApiJobGroup[]): JobGroup[] {
  const apiGroupsById = new Map(apiGroups.map((group) => [group.id, group]));

  return fallbackGroups.map((group) => {
    const apiGroup = apiGroupsById.get(group.id);
    if (!apiGroup) return group;
    const fallbackItemMap = new Map(group.items.map((item) => [item.id, item]));
    const iconMap = groupIconMap[group.id] ?? {};


    return {
      ...group,
      //title: apiGroup.title || group.title,
      //subtitle: apiGroup.subtitle || group.subtitle,
      items: apiGroup.items.map((item) => {
        const fallbackItem = fallbackItemMap.get(item.id);
        return {
          id: item.id,
          //name: item.name,
          name: fallbackItem?.name || item.name,
          count: item.count,
          //href: item.href,
          href: fallbackItem?.href || item.href,
          icon: iconMap[item.id] || fallbackItemMap.get(item.id)?.icon || <SalesIcon />,
        }
      }),
    };
  });
}

/* ─── UI Components ─── */
function SectionHeader({ title, subtitle, icon, gradient }: { title: string; subtitle: string; icon: React.ReactNode; gradient: string }) {
  return (
    <div className={`relative flex items-center gap-3 px-6 py-4 rounded-xl mb-6 overflow-hidden ${gradient}`}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-8 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
      <div className="relative z-10">{icon}</div>
      <div className="relative z-10">
        <h2 className="text-xl sm:text-[1.35rem] font-bold text-white tracking-wide">{title}</h2>
        <p className="text-white/70 text-xs sm:text-sm mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ItemCard({ item, accentColor, hoverBorderColor, countColor }: { item: GroupItem; accentColor: string; hoverBorderColor: string; countColor: string }) {
  const t = useTranslations('all_group_job');
  return (
    <Link href={item.href} className={`group relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 border-gray-100 bg-white ${hoverBorderColor} hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />
      <div className="shrink-0 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
      <span className="flex-1 font-semibold text-gray-700 text-[14px] sm:text-[15px] group-hover:text-gray-900 transition-colors leading-snug">{item.name}</span>
      <div className="shrink-0 text-right">
        <div className={`text-lg sm:text-xl font-black leading-none ${countColor}`}>{formatJobCount(item.count)}</div>
        <div className="text-[11px] sm:text-xs text-gray-400 font-medium mt-1">{t("groups.resume")}</div>
      </div>
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0"><ChevronRight className="w-4 h-4 text-gray-400" /></div>
    </Link>
  );
}

/* ─── Main Page ─── */
export default function AllGroupJobPage() {
  const t = useTranslations('all_group_job');

  const baseGroups = useMemo(() => getInitialGroups(t), [t]);

  const [pageGroups, setPageGroups] = useState<JobGroup[]>(baseGroups);
  const [, setStats] = useState<ApiStats>({
    groupCount: baseGroups.length,
    categoryCount: baseGroups.reduce((sum, group) => sum + group.items.length, 0),
    totalJobs: 0,
  });

  useEffect(() => {
    setPageGroups(baseGroups);
  }, [baseGroups]);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/jobs/all-group-categories`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (!active) return;
        const apiGroups = Array.isArray(data?.sections) ? data.sections : [];
        setPageGroups(mergeGroupsWithApiData(baseGroups, apiGroups));
        if (data?.stats) setStats(data.stats);
      })
      .catch(() => {
        if (active) setPageGroups(baseGroups);
      });
    return () => { active = false; };
  }, [baseGroups]);


  return (
    <div className="min-h-screen flex flex-col bg-white font-sans selection:bg-blue-100">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 max-w-7xl py-10 sm:py-14">
          <div className="flex flex-col gap-10 sm:gap-14">
            {pageGroups
              .filter((group) => group.id === 'regional')
              .map((group) => (
              <section key={group.id}>
                <SectionHeader title={group.title} subtitle={group.subtitle} icon={group.headerIcon} gradient={group.headerGradient} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.items.map((item) => (
                    <ItemCard key={item.id} item={item} accentColor={group.cardAccent} hoverBorderColor={group.cardHoverBorder} countColor={group.cardCountColor} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-gray-700 font-bold border-2 border-gray-200 hover:border-[#020263]/30 hover:shadow-lg transition-all hover:-translate-y-0.5">
              <Home className="w-5 h-5 stroke-2" />
              {t('buttons.back_home')}
            </Link>
            <Link href="/resumes" className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#020263] text-white font-bold hover:bg-[#0a0a7a] hover:shadow-lg hover:shadow-[#020263]/20 transition-all hover:-translate-y-0.5">
              <LayoutGrid className="w-5 h-5 stroke-2 group-hover:rotate-90 transition-transform duration-300" />
              {t('buttons.view_all_jobs')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>);
}