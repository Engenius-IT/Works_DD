'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Crown,
  Edit,
  Gem,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  UserRound,
  X,
  Zap,
} from 'lucide-react';

interface CompanyPackage {
  id: string;
  companyId: string;
  name: string;
  type: string;
  ccQuotaUsed: number;
  ccQuotaTotal: number;
  acQuotaUsed: number;
  acQuotaTotal: number;
  startDate?: string | null;
  endDate?: string | null;
}

interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  verificationStatus: string;
  isVerified: boolean;
  createdAt: string;
  _count: { jobs: number };
  package: CompanyPackage | null;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'JOBSEEKER' | 'EMPLOYER' | 'ADMIN';
  createdAt: string;
  emailVerified: boolean;
  companies: CompanySummary[];
}

type PlanName = 'Free Plan' | 'Pro' | 'Premium' | 'VIP';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const plans: Array<{
  name: PlanName;
  label: string;
  price: string;
  description: string;
  icon: typeof Zap;
  accent: string;
}> = [
  { name: 'Free Plan', label: 'Free', price: 'เริ่มต้น', description: 'เหมาะสำหรับเริ่มใช้งาน', icon: Zap, accent: 'from-slate-500 to-slate-700' },
  { name: 'Pro', label: 'Pro', price: '฿2,990 / 30 วัน', description: 'สำหรับธุรกิจที่กำลังเติบโต', icon: Sparkles, accent: 'from-blue-500 to-indigo-600' },
  { name: 'Premium', label: 'Premium', price: '฿5,990 / 90 วัน', description: 'โควตาเพิ่มและใช้งานต่อเนื่อง', icon: Gem, accent: 'from-violet-500 to-fuchsia-600' },
  { name: 'VIP', label: 'VIP', price: '฿15,990 / 365 วัน', description: 'สิทธิ์สูงสุดสำหรับองค์กร', icon: Crown, accent: 'from-amber-400 to-orange-600' },
];

const roleLabels: Record<UserData['role'], string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  EMPLOYER: 'ผู้ประกอบการ',
  JOBSEEKER: 'ผู้สมัครงาน',
};

const packageToPlan = (packageName?: string | null): PlanName => {
  const name = packageName?.toLowerCase() || '';
  if (name.includes('vip')) return 'VIP';
  if (name.includes('premium')) return 'Premium';
  if (name.includes('pro')) return 'Pro';
  return 'Free Plan';
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatNumber = (value?: number | null) => typeof value === 'number' ? value.toLocaleString('th-TH') : '-';

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [packageSubmitting, setPackageSubmitting] = useState(false);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Free Plan');

  const selectedCompany = useMemo(
    () => userData?.companies.find((company) => company.id === selectedCompanyId) ?? userData?.companies[0],
    [selectedCompanyId, userData],
  );

  const fetchUser = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถโหลดข้อมูลผู้ใช้ได้');

      const nextUser = data as UserData;
      setUserData(nextUser);
      setFormData({ email: nextUser.email, firstName: nextUser.firstName, lastName: nextUser.lastName, phone: nextUser.phone, role: nextUser.role });

      const firstCompany = nextUser.companies?.[0];
      const companyStillExists = nextUser.companies?.some((company) => company.id === selectedCompanyId);
      const nextCompanyId = companyStillExists ? selectedCompanyId : firstCompany?.id || '';
      setSelectedCompanyId(nextCompanyId);
      setSelectedPlan(packageToPlan(nextUser.companies?.find((company) => company.id === nextCompanyId)?.package?.name));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(message);
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
    // fetchUser intentionally runs when the route id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSave = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถบันทึกข้อมูลได้');

      await fetchUser();
      setEditing(false);
      setPackageMessage('บันทึกข้อมูลผู้ใช้แล้ว');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailVerification = async (verified: boolean) => {
    if (!confirm(verified ? 'ยืนยันอีเมลของผู้ใช้นี้หรือไม่?' : 'ยกเลิกการยืนยันอีเมลหรือไม่?')) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const endpoint = verified ? 'verify-email' : 'unverify-email';
      const response = await fetch(`${API_URL}/admin/users/${userId}/${endpoint}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถเปลี่ยนสถานะอีเมลได้');

      await fetchUser();
      setPackageMessage(verified ? 'ยืนยันอีเมลแล้ว' : 'ยกเลิกการยืนยันอีเมลแล้ว');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนสถานะอีเมลได้');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePackageChange = async (planName: PlanName) => {
    if (!selectedCompany) {
      setError('บัญชีนี้ยังไม่มีบริษัท จึงยังจัดการแพ็กเกจไม่ได้');
      return;
    }
    if (packageToPlan(selectedCompany.package?.name) === planName) {
      setPackageMessage(`บริษัทนี้ใช้แพ็กเกจ ${planName} อยู่แล้ว`);
      return;
    }
    if (!confirm(`ยืนยันเปลี่ยนแพ็กเกจของ ${selectedCompany.name} เป็น ${planName} หรือไม่?`)) return;

    setPackageSubmitting(true);
    setError(null);
    setPackageMessage(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/packages/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyId: selectedCompany.id, planName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'ไม่สามารถเปลี่ยนแพ็กเกจได้');

      setSelectedPlan(planName);
      setPackageMessage(`เปลี่ยนแพ็กเกจเป็น ${planName} เรียบร้อยแล้ว`);
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถเปลี่ยนแพ็กเกจได้');
    } finally {
      setPackageSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-[520px] items-center justify-center rounded-3xl bg-slate-50"><div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-slate-600 shadow-sm"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /> กำลังโหลดข้อมูลผู้ใช้...</div></div>;
  }

  if (error && !userData) {
    return <div className="mx-auto max-w-xl rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500"><X className="h-7 w-7" /></div><h1 className="mt-4 text-xl font-bold text-slate-900">ไม่สามารถเปิดข้อมูลผู้ใช้ได้</h1><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={() => void fetchUser()} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700">ลองอีกครั้ง</button></div>;
  }

  if (!userData) return null;

  const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'ไม่ระบุชื่อ';
  const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const currentPackage = selectedCompany?.package;
  const currentPlan = packageToPlan(currentPackage?.name);
  const ccPercent = currentPackage ? Math.min((currentPackage.ccQuotaUsed / Math.max(currentPackage.ccQuotaTotal, 1)) * 100, 100) : 0;
  const acPercent = currentPackage ? Math.min((currentPackage.acQuotaUsed / Math.max(currentPackage.acQuotaTotal, 1)) * 100, 100) : 0;

  return (
    <div className="min-h-full bg-[#f5f7fb] px-4 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> กลับไปจัดการผู้ใช้</Link>

        <section className="relative overflow-hidden rounded-[28px] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 md:p-8">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" /><div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-xl font-black shadow-lg shadow-indigo-950/50">{initials}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-black tracking-tight md:text-3xl">{fullName}</h1><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">{roleLabels[userData.role]}</span></div><p className="mt-1 flex items-center gap-2 text-sm text-slate-300"><Mail className="h-4 w-4" /> {userData.email}</p><p className="mt-2 text-xs text-slate-400">สมาชิกตั้งแต่ {formatDate(userData.createdAt)}</p></div></div>
            <div className="flex flex-wrap gap-3">{!editing ? <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"><Pencil className="h-4 w-4" /> แก้ไขข้อมูล</button> : <><button onClick={() => void handleSave()} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} บันทึก</button><button onClick={() => { setEditing(false); setFormData({ email: userData.email, firstName: userData.firstName, lastName: userData.lastName, phone: userData.phone, role: userData.role }); }} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-60"><X className="h-4 w-4" /> ยกเลิก</button></>}</div>
          </div>
          <div className="relative mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-xs text-slate-400">สถานะอีเมล</p><p className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-300"><BadgeCheck className="h-4 w-4" /> {userData.emailVerified ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}</p></div><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-xs text-slate-400">บริษัทที่ดูแล</p><p className="mt-2 text-xl font-black">{userData.companies?.length || 0} <span className="text-sm font-medium text-slate-400">บริษัท</span></p></div><div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4"><p className="text-xs text-slate-400">งานที่ประกาศ</p><p className="mt-2 text-xl font-black">{formatNumber(userData.companies?.reduce((sum, company) => sum + company._count.jobs, 0) || 0)} <span className="text-sm font-medium text-slate-400">ตำแหน่ง</span></p></div></div>
        </section>

        {error && <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {packageMessage && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{packageMessage}</div>}

        {editing && <section className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm md:p-7"><div className="mb-6 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><Edit className="h-5 w-5" /></div><div><h2 className="text-lg font-black text-slate-900">แก้ไขข้อมูลบัญชี</h2><p className="text-sm text-slate-500">ปรับข้อมูลพื้นฐานและสิทธิ์ของผู้ใช้</p></div></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{([['firstName', 'ชื่อจริง', 'text'], ['lastName', 'นามสกุล', 'text'], ['email', 'อีเมล', 'email'], ['phone', 'เบอร์โทรศัพท์', 'text']] as const).map(([name, label, type]) => <label key={name} className="text-sm font-semibold text-slate-600">{label}<input name={name} type={type} value={(formData[name as keyof UserData] as string) || ''} onChange={handleInputChange} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" /></label>)}<label className="text-sm font-semibold text-slate-600">บทบาท<select name="role" value={formData.role || ''} onChange={handleInputChange} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"><option value="JOBSEEKER">ผู้สมัครงาน</option><option value="EMPLOYER">ผู้ประกอบการ</option><option value="ADMIN">แอดมิน</option></select></label></div></section>}

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-black text-slate-900">ข้อมูลบัญชี</h2><p className="mt-1 text-sm text-slate-500">ข้อมูลสำคัญและสถานะการเข้าถึงของผู้ใช้</p></div><div className="rounded-xl bg-slate-100 p-3 text-slate-500"><UserRound className="h-5 w-5" /></div></div><div className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2"><InfoItem icon={Mail} label="อีเมล" value={userData.email} trailing={userData.emailVerified ? <StatusPill icon={ShieldCheck} label="ยืนยันแล้ว" tone="green" /> : <StatusPill icon={ShieldOff} label="ยังไม่ยืนยัน" tone="red" />} /><InfoItem icon={Phone} label="เบอร์โทรศัพท์" value={userData.phone || 'ยังไม่ได้ระบุ'} /><InfoItem icon={BriefcaseBusiness} label="บทบาทในระบบ" value={roleLabels[userData.role]} /><InfoItem icon={Calendar} label="สร้างบัญชีเมื่อ" value={formatDate(userData.createdAt)} /></div><div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5"><button onClick={() => void handleEmailVerification(!userData.emailVerified)} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-60">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}{userData.emailVerified ? 'ยกเลิกการยืนยันอีเมล' : 'ยืนยันอีเมล'}</button></div></section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black text-slate-900">บริษัทของผู้ใช้</h2><p className="mt-1 text-sm text-slate-500">เลือกบริษัทเพื่อจัดการแพ็กเกจทางด้านขวา</p></div>{userData.companies.length > 1 && <div className="relative"><select value={selectedCompanyId} onChange={(event) => { setSelectedCompanyId(event.target.value); setSelectedPlan(packageToPlan(userData.companies.find((company) => company.id === event.target.value)?.package?.name)); }} className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400"><option value="">เลือกบริษัท</option>{userData.companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-slate-400" /></div>}</div>{selectedCompany ? <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white text-indigo-600 shadow-sm">{selectedCompany.logoUrl ? <img src={selectedCompany.logoUrl} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6" />}</div><div><p className="font-bold text-slate-900">{selectedCompany.name}</p><p className="mt-1 text-xs text-slate-500">/{selectedCompany.slug} · {formatNumber(selectedCompany._count.jobs)} ตำแหน่ง</p></div></div><StatusPill icon={selectedCompany.isVerified ? BadgeCheck : ShieldOff} label={selectedCompany.isVerified ? 'ยืนยันบริษัทแล้ว' : 'รอตรวจสอบบริษัท'} tone={selectedCompany.isVerified ? 'green' : 'amber'} /></div> : <EmptyState icon={Building2} title="ยังไม่มีข้อมูลบริษัท" description="ผู้ใช้นี้ยังไม่มีบริษัทสำหรับจัดการแพ็กเกจ" />}</section>
          </div>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-800 p-6 text-white"><div className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-2xl" /><div className="relative flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-200">Package control</p><h2 className="mt-2 text-2xl font-black">จัดการแพ็กเกจ</h2><p className="mt-1 text-sm text-indigo-200">เพิ่ม ลด หรือเปลี่ยนแพ็กเกจของบริษัท</p></div><div className="rounded-2xl bg-white/10 p-3"><Crown className="h-6 w-6 text-amber-300" /></div></div>{selectedCompany && <div className="relative mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4"><div><p className="text-xs text-indigo-200">แพ็กเกจปัจจุบัน</p><p className="mt-1 text-xl font-black">{currentPackage?.name || 'Free Plan'}</p></div><span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">ACTIVE</span></div>}</div>

            <div className="p-5 md:p-6">{selectedCompany ? <><div className="grid grid-cols-2 gap-3"><QuotaCard label="โควตา CC" used={currentPackage?.ccQuotaUsed} total={currentPackage?.ccQuotaTotal} percent={ccPercent} color="bg-indigo-500" /><QuotaCard label="โควตา AC" used={currentPackage?.acQuotaUsed} total={currentPackage?.acQuotaTotal} percent={acPercent} color="bg-fuchsia-500" /></div><div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-3"><span className="text-slate-500">เริ่มใช้งาน</span><span className="font-semibold text-slate-700">{formatDate(currentPackage?.startDate)}</span></div><div className="mt-3 flex justify-between gap-3"><span className="text-slate-500">หมดอายุ</span><span className="font-semibold text-slate-700">{formatDate(currentPackage?.endDate)}</span></div></div><div className="mt-7"><p className="text-sm font-black text-slate-900">เลือกแพ็กเกจใหม่</p><div className="mt-3 space-y-2">{plans.map((plan) => { const Icon = plan.icon; const isCurrent = currentPlan === plan.name; const isSelected = selectedPlan === plan.name; return <button key={plan.name} type="button" onClick={() => setSelectedPlan(plan.name)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-100' : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${plan.accent} text-white`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-black text-slate-900">{plan.label}{isCurrent && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">ปัจจุบัน</span>}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{plan.description} · {plan.price}</span></span>{isSelected && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><Check className="h-4 w-4" /></span>}</button>; })}</div></div><button type="button" disabled={packageSubmitting || selectedPlan === currentPlan} onClick={() => void handlePackageChange(selectedPlan)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0">{packageSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังเปลี่ยนแพ็กเกจ...</> : <><Zap className="h-4 w-4" /> ยืนยันเปลี่ยนเป็น {selectedPlan}</>}</button><p className="mt-3 text-center text-[11px] leading-5 text-slate-400">การเปลี่ยนจากหน้านี้เป็นการตั้งค่าแพ็กเกจโดยแอดมินโดยตรง<br />ไม่มีการเรียกเก็บเงินซ้ำจากผู้ใช้</p></> : <EmptyState icon={Crown} title="ยังจัดการแพ็กเกจไม่ได้" description="ต้องมีบริษัทที่เชื่อมกับบัญชีนี้ก่อน" />}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, trailing }: { icon: typeof Mail; label: string; value: string; trailing?: React.ReactNode }) {
  return <div className="flex gap-3"><div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-500"><Icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-xs font-semibold text-slate-400">{label}</p><div className="mt-1 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-800"><span className="break-all">{value}</span>{trailing}</div></div></div>;
}

function StatusPill({ icon: Icon, label, tone }: { icon: typeof ShieldCheck; label: string; tone: 'green' | 'red' | 'amber' }) {
  const styles = { green: 'bg-emerald-50 text-emerald-700', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-700' };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${styles[tone]}`}><Icon className="h-3 w-3" /> {label}</span>;
}

function QuotaCard({ label, used, total, percent, color }: { label: string; used?: number; total?: number; percent: number; color: string }) {
  return <div className="rounded-2xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">{label}</span><span className="text-xs font-black text-slate-800">{formatNumber(used)} / {formatNumber(total)}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percent}%` }} /></div><p className="mt-2 text-[10px] text-slate-400">ใช้ไป {Math.round(percent)}%</p></div>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Building2; title: string; description: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm"><Icon className="h-6 w-6" /></div><p className="mt-3 text-sm font-bold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-400">{description}</p></div>;
}
