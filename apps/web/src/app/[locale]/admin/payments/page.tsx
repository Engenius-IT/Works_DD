'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  ExternalLink,
  Filter,
  Hash,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface PendingPayment {
  chargeId: string;
  planName: string;
  amount: number;
  status: string;
  verificationStatus: string;
  verificationMessage?: string | null;
  slipUrl?: string | null;
  slipAmount?: number | null;
  slipReference?: string | null;
  slipRecipientName?: string | null;
  slipTransactionAt?: string | null;
  createdAt: string;
  expiresAt?: string | null;
  company?: {
    name: string;
    owner?: { email?: string; firstName?: string; lastName?: string } | null;
  } | null;
  verificationChecks?: {
    amount?: { expected?: number | null; actual?: number | null; matches?: boolean | null };
    reference?: { expected?: string | null; actual?: string | null; matches?: boolean | null; duplicate?: boolean };
    date?: { expected?: string | null; actual?: string | null; matches?: boolean | null };
    recipientName?: { expected?: string | null; actual?: string | null; matches?: boolean | null; matchMode?: string };
  } | null;
}

type FilterKey = 'ALL' | 'MISMATCH' | 'PROVIDER' | 'VERIFIED';

const mismatchStatuses = new Set([
  'AMOUNT_MISMATCH',
  'REFERENCE_MISMATCH',
  'REFERENCE_DUPLICATE',
  'DATE_MISMATCH',
  'RECIPIENT_NAME_MISMATCH',
]);

function money(value?: number | null) {
  return value == null ? '-' : `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
}

function statusMeta(status: string) {
  if (status === 'VERIFIED_FIELDS') {
    return { label: 'ตรวจข้อมูลครบ', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' };
  }
  if (status === 'PROVIDER_REJECTED') {
    return { label: '1xSlip ไม่ยืนยัน', className: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' };
  }
  if (mismatchStatuses.has(status)) {
    return { label: 'ข้อมูลไม่ตรง', className: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' };
  }
  return { label: 'รอตรวจเพิ่ม', className: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500' };
}

function checkLabel(matches?: boolean | null) {
  if (matches === true) return { label: 'ผ่าน', className: 'text-emerald-600', icon: <Check className="h-3.5 w-3.5" /> };
  if (matches === false) return { label: 'ไม่ผ่าน', className: 'text-rose-600', icon: <X className="h-3.5 w-3.5" /> };
  return { label: 'อ่านไม่ได้', className: 'text-slate-400', icon: <AlertCircle className="h-3.5 w-3.5" /> };
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/payments/admin/self/pending`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'โหลดรายการไม่สำเร็จ');
      setPayments(data);
    } catch (loadError: any) {
      setError(loadError.message || 'โหลดรายการไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const reviewPayment = async (payment: PendingPayment, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('เหตุผลที่ปฏิเสธรายการ (ไม่บังคับ)') || '';
    }

    setWorkingId(payment.chargeId);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/payments/admin/self/${payment.chargeId}/${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'ดำเนินการไม่สำเร็จ');
      await loadPayments();
    } catch (reviewError: any) {
      window.alert(reviewError.message || 'ดำเนินการไม่สำเร็จ');
    } finally {
      setWorkingId(null);
    }
  };

  const filteredPayments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const searchable = [
        payment.chargeId,
        payment.planName,
        payment.company?.name,
        payment.company?.owner?.email,
        payment.slipReference,
        payment.slipRecipientName,
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesFilter = filter === 'ALL'
        || (filter === 'MISMATCH' && mismatchStatuses.has(payment.verificationStatus))
        || (filter === 'PROVIDER' && payment.verificationStatus === 'PROVIDER_REJECTED')
        || (filter === 'VERIFIED' && payment.verificationStatus === 'VERIFIED_FIELDS');
      return matchesQuery && matchesFilter;
    });
  }, [filter, payments, query]);

  const totalPending = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const mismatchCount = payments.filter((payment) => mismatchStatuses.has(payment.verificationStatus)).length;
  const providerRejectedCount = payments.filter((payment) => payment.verificationStatus === 'PROVIDER_REJECTED').length;
  const verifiedCount = payments.filter((payment) => payment.verificationStatus === 'VERIFIED_FIELDS').length;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">PromptPay · 1xSlip</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">รายการชำระเงิน</h1>
          <p className="mt-2 text-sm text-slate-500">รายการที่ยังต้องตรวจสอบเพิ่มเติมจากระบบอัตโนมัติ</p>
        </div>
        <button type="button" onClick={loadPayments} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700">
          <RefreshCw className="h-4 w-4" /> รีเฟรช
        </button>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <p>ถ้า 1xSlip ยืนยันยอดเงิน รหัสอ้างอิง วันเวลา และชื่อผู้รับครบ ระบบจะเปิดแพ็กเกจให้อัตโนมัติ รายการที่แสดงด้านล่างคือรายการที่ต้องตรวจเพิ่มเท่านั้น</p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'รายการค้าง', value: payments.length, suffix: 'รายการ', icon: <WalletCards className="h-5 w-5" />, className: 'bg-amber-50 text-amber-700' },
          { label: 'ยอดรวมค้าง', value: money(totalPending), suffix: '', icon: <Banknote className="h-5 w-5" />, className: 'bg-blue-50 text-blue-700' },
          { label: 'ข้อมูลไม่ตรง/ซ้ำ', value: mismatchCount, suffix: 'รายการ', icon: <AlertCircle className="h-5 w-5" />, className: 'bg-rose-50 text-rose-700' },
          { label: 'ตรวจครบแล้ว', value: verifiedCount, suffix: 'รายการ', icon: <CheckCircle2 className="h-5 w-5" />, className: 'bg-emerald-50 text-emerald-700' },
        ].map((card) => (
          <div key={card.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div><p className="text-xs font-bold text-slate-400">{card.label}</p><p className="mt-1 text-2xl font-black text-slate-900">{card.value} <span className="text-xs font-bold text-slate-400">{card.suffix}</span></p></div>
            <div className={`rounded-xl p-3 ${card.className}`}>{card.icon}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาเลขรายการ บริษัท อีเมล หรือรหัสอ้างอิง" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs font-bold text-slate-400"><Filter className="h-3.5 w-3.5" /> สถานะ</span>
            {[
              { key: 'ALL' as const, label: 'ทั้งหมด', count: payments.length },
              { key: 'MISMATCH' as const, label: 'ไม่ตรง/ซ้ำ', count: mismatchCount },
              { key: 'PROVIDER' as const, label: '1xSlip ไม่ยืนยัน', count: providerRejectedCount },
              { key: 'VERIFIED' as const, label: 'ตรวจครบ', count: verifiedCount },
            ].map((item) => <button key={item.key} type="button" onClick={() => setFilter(item.key)} className={`rounded-full px-3 py-1.5 text-xs font-black transition ${filter === item.key ? 'bg-[#070755] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{item.label} <span className={filter === item.key ? 'text-cyan-200' : 'text-slate-400'}>{item.count}</span></button>)}
          </div>
        </div>
      </section>

      {error && <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}

      {loading ? <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div> : filteredPayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-black text-slate-900">{payments.length === 0 ? 'ไม่มีรายการที่ต้องตรวจสอบ' : 'ไม่พบรายการ'}</h2>
          <p className="mt-2 text-sm text-slate-500">{payments.length === 0 ? 'รายการที่ผ่าน 1xSlip จะถูกเปิดแพ็กเกจอัตโนมัติ' : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'}</p>
          {payments.length > 0 && <button type="button" onClick={() => { setQuery(''); setFilter('ALL'); }} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">ล้างตัวกรอง</button>}
        </div>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1"><div><h2 className="font-black text-slate-900">รายการรอตรวจ</h2><p className="mt-1 text-xs text-slate-400">พบ {filteredPayments.length} รายการ</p></div><span className="text-xs font-bold text-slate-400">อัปเดตด้วยปุ่มรีเฟรช</span></div>
          <div className="space-y-3">
            {filteredPayments.map((payment) => {
              const owner = payment.company?.owner;
              const busy = workingId === payment.chargeId;
              const meta = statusMeta(payment.verificationStatus);
              const checks = payment.verificationChecks;
              const checkItems = [
                { label: 'ยอดเงิน', value: checks?.amount?.actual == null ? '-' : money(Number(checks.amount.actual)), matches: checks?.amount?.matches, icon: <Banknote className="h-4 w-4" /> },
                { label: 'อ้างอิง', value: checks?.reference?.actual || '-', matches: checks?.reference?.duplicate ? false : checks?.reference?.matches, icon: <Hash className="h-4 w-4" /> },
                { label: 'วันเวลา', value: checks?.date?.actual ? dateTime(checks.date.actual) : '-', matches: checks?.date?.matches, icon: <CalendarClock className="h-4 w-4" /> },
                { label: 'ผู้รับเงิน', value: checks?.recipientName?.actual || '-', matches: checks?.recipientName?.matches, icon: <UserRound className="h-4 w-4" /> },
              ];
              const passedChecks = checkItems.filter((item) => item.matches === true).length;

              return <article key={payment.chargeId} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">{payment.planName} Plan</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${meta.className}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />{meta.label}</span></div>
                    <h3 className="mt-2 truncate text-sm font-black text-slate-900">{payment.company?.name || 'ไม่ระบุบริษัท'}</h3>
                    <p className="mt-1 truncate text-xs text-slate-400">{payment.chargeId} · {dateTime(payment.createdAt)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end"><div className="text-left sm:text-right"><p className="text-2xl font-black text-slate-900">{money(payment.amount)}</p><p className="text-xs font-bold text-slate-400">ผ่าน {passedChecks}/4 ช่อง</p></div><div className="h-10 w-px bg-slate-200" /><span className="text-xs font-bold text-slate-500">{payment.status === 'SLIP_SUBMITTED' ? 'ส่งสลิปแล้ว' : 'รอชำระ'}</span></div>
                </div>
                <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {checkItems.map((item) => { const result = checkLabel(item.matches); return <div key={item.label} className="min-w-0 rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-1"><span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">{item.icon}{item.label}</span><span className={`flex items-center gap-0.5 text-[10px] font-black ${result.className}`}>{result.icon}{result.label}</span></div><p className="mt-1.5 truncate text-xs font-bold text-slate-700" title={item.value}>{item.value}</p></div>; })}
                  </div>
                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-xs font-black text-indigo-700 outline-none">ดูรายละเอียดและดำเนินการ <span className="ml-1 inline-block transition group-open:rotate-180">⌄</span></summary>
                    <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                      <p className="leading-5 text-slate-600"><span className="font-black text-slate-700">ผลจาก 1xSlip:</span> {payment.verificationMessage || 'ยังไม่มีผลตรวจสลิป'}</p>
                      <div className="grid gap-2 sm:grid-cols-2"><p className="flex items-center gap-1.5 text-slate-600"><UserRound className="h-3.5 w-3.5 text-slate-400" />{owner?.firstName || '-'} {owner?.lastName || ''}</p><p className="flex items-center gap-1.5 truncate text-slate-600"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />{owner?.email || '-'}</p></div>
                      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-3"><a href={payment.slipUrl || '#'} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 font-black ${payment.slipUrl ? 'border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50' : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'}`}><ExternalLink className="h-3.5 w-3.5" />เปิดสลิป</a><button type="button" onClick={() => reviewPayment(payment, 'reject')} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 font-black text-rose-600 hover:bg-rose-50 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />ปฏิเสธ</button><button type="button" onClick={() => reviewPayment(payment, 'approve')} disabled={busy || !payment.slipUrl} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}อนุมัติ</button></div>
                    </div>
                  </details>
                </div>
              </article>;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
