'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Hash,
  Loader2,
  RefreshCw,
  ScanLine,
  UserRound,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

type PaymentEvent = {
  id: string;
  eventType: string;
  status?: string | null;
  amount?: number | null;
  message?: string | null;
  createdAt: string;
};

type LivePayment = {
  chargeId: string;
  planName: string;
  amount: number;
  status: string;
  verificationStatus: string;
  verificationMessage?: string | null;
  slipAmount?: number | null;
  slipReference?: string | null;
  slipRecipientName?: string | null;
  slipTransactionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | null;
  cancelledAt?: string | null;
  scanDetected: boolean;
  scanStatus: string;
  paymentDetected: boolean;
  paymentDetectionSource: string;
  moneyReceivedAmount?: number | null;
  company?: {
    name: string;
    owner?: { email?: string; firstName?: string; lastName?: string } | null;
  } | null;
  events: PaymentEvent[];
};

function money(value?: number | null) {
  return value == null ? '-' : `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

function dateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('th-TH') : '-';
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    PENDING: 'รอการชำระ',
    SLIP_SUBMITTED: 'ส่งสลิปแล้ว',
    APPROVING: 'กำลังยืนยัน',
    SUCCESS: 'เงินเข้าแล้ว',
    FAILED: 'ถูกปฏิเสธ',
    CANCELLED: 'หมดอายุ/ยกเลิก',
  };
  return labels[status] || status;
}

function statusClass(status: string) {
  if (status === 'SUCCESS') return 'bg-emerald-100 text-emerald-700';
  if (status === 'CANCELLED' || status === 'FAILED') return 'bg-rose-100 text-rose-700';
  if (status === 'SLIP_SUBMITTED' || status === 'APPROVING') return 'bg-amber-100 text-amber-700';
  return 'bg-blue-100 text-blue-700';
}

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    QR_CREATED: 'สร้าง QR',
    STATUS_CHECK: 'ตรวจสอบสถานะ',
    SLIP_SUBMITTED: 'ส่งสลิป',
    PAYMENT_APPROVED: 'ยืนยันเงินเข้า',
    PAYMENT_AUTO_APPROVING: 'กำลังเปิดแพ็กเกจอัตโนมัติ',
    PAYMENT_AUTO_APPROVED: '1xSlip ยืนยันอัตโนมัติ',
    PAYMENT_REJECTED: 'ปฏิเสธรายการ',
    QR_EXPIRED: 'QR หมดอายุ',
  };
  return labels[eventType] || eventType;
}

export default function PaymentLiveMonitorPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<LivePayment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadLivePayments = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const liveEndpoint = user?.role === 'ADMIN' ? '/payments/admin/self/live' : '/payments/self/live';
      const response = await fetch(`${API_URL}${liveEndpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'โหลดข้อมูล Live Monitor ไม่สำเร็จ');
      setPayments(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (loadError: any) {
      setError(loadError.message || 'เชื่อมต่อ Live Monitor ไม่สำเร็จ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadLivePayments();
    const timer = window.setInterval(() => loadLivePayments(true), 3000);
    return () => window.clearInterval(timer);
  }, [loadLivePayments]);

  useEffect(() => {
    if (!selectedId && payments[0]) setSelectedId(payments[0].chargeId);
    if (selectedId && !payments.some((payment) => payment.chargeId === selectedId)) {
      setSelectedId(payments[0]?.chargeId || null);
    }
  }, [payments, selectedId]);

  const selectedPayment = payments.find((payment) => payment.chargeId === selectedId) || payments[0];
  const stats = useMemo(() => ({
    total: payments.length,
    active: payments.filter((payment) => ['PENDING', 'SLIP_SUBMITTED', 'APPROVING'].includes(payment.status)).length,
    slips: payments.filter((payment) => payment.status === 'SLIP_SUBMITTED').length,
    success: payments.filter((payment) => payment.paymentDetected).length,
    cancelled: payments.filter((payment) => payment.status === 'CANCELLED').length,
  }), [payments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#020263] p-3 text-white shadow-lg shadow-blue-200"><Activity className="h-6 w-6" /></div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">PromptPay Live Monitor</p>
              <h1 className="mt-1 text-3xl font-black text-slate-900">ติดตาม QR แบบเรียลไทม์</h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">ระบบรีเฟรชข้อมูลทุก 3 วินาที แสดงเหตุการณ์ที่ระบบรับรู้ของ QR, สลิป และการยืนยันยอดเงิน</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> LIVE
          </div>
          <button type="button" onClick={() => loadLivePayments(true)} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-300 hover:text-blue-700">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> รีเฟรช
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <p><span className="font-black">การยืนยัน:</span> เมื่อ 1xSlip ตรวจสอบยอดเงิน รหัสอ้างอิง วันเวลา และชื่อผู้รับเงินผ่านครบ ระบบจะเปิดแพ็กเกจให้อัตโนมัติ ส่วนรายการที่ข้อมูลไม่ครบยังต้องตรวจสอบเพิ่มเติม</p>
      </div>

      {error && <div className="rounded-xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'QR ใน 24 ชม.', value: stats.total, icon: <WalletCards className="h-5 w-5" />, iconClass: 'bg-blue-50 text-blue-600' },
          { label: 'รายการที่ยังทำงาน', value: stats.active, icon: <Clock3 className="h-5 w-5" />, iconClass: 'bg-amber-50 text-amber-600' },
          { label: 'ส่งสลิปแล้ว', value: stats.slips, icon: <ScanLine className="h-5 w-5" />, iconClass: 'bg-violet-50 text-violet-600' },
          { label: 'ยืนยันเงินเข้า', value: stats.success, icon: <CheckCircle2 className="h-5 w-5" />, iconClass: 'bg-emerald-50 text-emerald-600' },
          { label: 'หมดอายุ/ยกเลิก', value: stats.cancelled, icon: <XCircle className="h-5 w-5" />, iconClass: 'bg-rose-50 text-rose-600' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>{card.icon}</div>
            <p className="text-xs font-bold text-slate-400">{card.label}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-black text-slate-900">รายการ QR ล่าสุด</h2>
              <p className="mt-1 text-xs text-slate-400">อัปเดตล่าสุด {lastUpdated ? dateTime(lastUpdated.toISOString()) : '-'}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">สูงสุด 50 รายการ</span>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : payments.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-center text-slate-400"><WalletCards className="h-12 w-12 text-slate-200" /><p className="font-bold">ยังไม่มี QR ในช่วง 24 ชั่วโมงล่าสุด</p></div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <button key={payment.chargeId} type="button" onClick={() => setSelectedId(payment.chargeId)} className={`w-full p-5 text-left transition hover:bg-blue-50/50 ${selectedPayment?.chargeId === payment.chargeId ? 'bg-blue-50/70' : 'bg-white'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${payment.paymentDetected ? 'bg-emerald-500' : payment.status === 'CANCELLED' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="font-black text-slate-900">{payment.planName} Plan</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${statusClass(payment.status)}`}>{statusLabel(payment.status)}</span></div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Hash className="h-3 w-3" />{payment.chargeId}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.company?.name || '-'} · สร้าง {dateTime(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="text-xl font-black text-[#020263]">{money(payment.amount)}</p><p className="mt-1 text-[11px] font-bold text-slate-400">ยอดในคำสั่งซื้อ</p></div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">การสแกน</p><p className="mt-1 text-xs font-bold text-amber-700">ตรวจไม่ได้จาก QR</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">เงินเข้า</p><p className={`mt-1 text-xs font-bold ${payment.paymentDetected ? 'text-emerald-700' : 'text-slate-500'}`}>{payment.paymentDetected ? money(payment.moneyReceivedAmount) : 'ยังไม่ยืนยัน'}</p></div>
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-black uppercase text-slate-400">สลิป</p><p className="mt-1 text-xs font-bold text-slate-700">{payment.slipAmount == null ? 'ยังไม่มี' : money(payment.slipAmount)}</p></div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-900">รายละเอียดและ Log</h2><p className="mt-1 text-xs text-slate-400">เลือก QR เพื่อดูข้อมูลล่าสุด</p></div>
          {!selectedPayment ? <div className="flex min-h-80 items-center justify-center p-6 text-center text-sm text-slate-400">ยังไม่มีรายการให้ตรวจสอบ</div> : (
            <div className="space-y-5 p-5">
              <div className="rounded-2xl bg-gradient-to-br from-[#020263] to-[#3030bd] p-5 text-white shadow-lg"><div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-widest text-white/60">{selectedPayment.planName} Plan</span><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">{statusLabel(selectedPayment.status)}</span></div><p className="mt-4 text-3xl font-black">{money(selectedPayment.amount)}</p><p className="mt-1 text-xs text-white/60">ยอดเงินในคำสั่งซื้อ</p></div>
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><ScanLine className="h-4 w-4" /> มีคนสแกนหรือยัง</span><b className="text-amber-700">ตรวจไม่ได้</b></div>
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><WalletCards className="h-4 w-4" /> เงินเข้าหรือยัง</span><b className={selectedPayment.paymentDetected ? 'text-emerald-700' : 'text-slate-500'}>{selectedPayment.paymentDetected ? `เข้าแล้ว ${money(selectedPayment.moneyReceivedAmount)}` : 'ยังไม่ยืนยัน'}</b></div>
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><UserRound className="h-4 w-4" /> ผู้ชำระ/บริษัท</span><b className="max-w-[55%] truncate text-right text-slate-700">{selectedPayment.company?.name || '-'}</b></div>
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><CalendarDays className="h-4 w-4" /> QR หมดอายุ</span><b className="text-right text-slate-700">{dateTime(selectedPayment.expiresAt)}</b></div>
                <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><Eye className="h-4 w-4" /> แหล่งยืนยัน</span><b className="text-right text-slate-700">{selectedPayment.paymentDetectionSource === 'AUTO_1XSLIP' ? '1xSlip ยืนยันอัตโนมัติ' : selectedPayment.paymentDetectionSource === 'ADMIN_APPROVAL' ? 'แอดมินยืนยัน' : 'ยังไม่มี Bank API'}</b></div>
              </div>
              <div><h3 className="mb-3 flex items-center gap-2 font-black text-slate-900"><Activity className="h-4 w-4 text-blue-600" /> เหตุการณ์ล่าสุด</h3><div className="space-y-3">{selectedPayment.events.length === 0 ? <p className="text-sm text-slate-400">ยังไม่มี log</p> : selectedPayment.events.map((event, index) => <div key={event.id} className="relative flex gap-3"><div className="flex flex-col items-center"><span className={`mt-1 h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-slate-300'}`} />{index < selectedPayment.events.length - 1 && <span className="mt-1 h-full w-px bg-slate-200" />}</div><div className="min-w-0 pb-2"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-700">{eventLabel(event.eventType)}</p><span className="text-[10px] text-slate-400">{dateTime(event.createdAt)}</span></div><p className="mt-1 text-xs leading-relaxed text-slate-500">{event.message || `สถานะ ${event.status || '-'}`} {event.amount != null ? `· ${money(event.amount)}` : ''}</p></div></div>)}</div></div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
