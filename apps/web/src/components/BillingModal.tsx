'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useTranslations, useLocale } from 'next-intl';
import { X, ArrowLeft, HelpCircle, CreditCard, Wallet, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  packageInfo: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const BillingModal: React.FC<BillingModalProps> = ({
  isOpen,
  onClose,
  companyId,
  packageInfo,
}) => {
  const t = useTranslations('Billing');
  const locale = useLocale() as 'th' | 'en';
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Paid' | 'Pending' | 'Failed'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!isOpen || !companyId) return;

    const fetchBillingHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get(`${API_URL}/payments/company/${companyId}`, {
          params: {
            page: currentPage,
            limit: itemsPerPage,
            status: activeFilter,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        
        const dataObj = res.data;
        const items = dataObj?.items || [];
        const total = dataObj?.total || 0;
        const pages = dataObj?.totalPages || 1;

        // Map database records to match table format
        const mappedData = items.map((item: any) => ({
          id: `INV-${item.chargeId ? item.chargeId.substring(6, 10).toUpperCase() : item.id.substring(0, 4).toUpperCase()}`,
          createdAt: item.createdAt,
          planName: item.planName,
          description: item.planName.includes('Credit') || item.planName.includes('Boost') ? 'Ad Services' : 'Subscription',
          amount: item.amount,
          method: 'credit_card', 
          cardDigits: '1234',
          status: item.status, 
        }));

        setTransactions(mappedData);
        setTotalItems(total);
        setTotalPages(pages);
      } catch (err) {
        console.error('❌ Failed to fetch billing history:', err);
        setTransactions([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingHistory();
  }, [isOpen, companyId, currentPage, activeFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  if (!isOpen) return null;

  // Formatting date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Quotas calculations with Division by Zero Protection
  const totalCredits = packageInfo?.acQuotaTotal ?? 0;
  const usedCredits = packageInfo?.acQuotaUsed ?? 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);
  const creditsPercentage = totalCredits <= 0 ? 0 : Math.round((remainingCredits / totalCredits) * 100);

  const planName = packageInfo?.name || 'Free Plan';
  const isFreePlan = planName === 'Free Plan';

  // Handle outside click overlay
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const startRange = totalItems === 0 ? 0 : startIndex + 1;
  const endRange = totalItems === 0 ? 0 : Math.min(startIndex + transactions.length, totalItems);

  return createPortal(
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm transition-all animate-fade-in"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .glass-background {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .status-badge {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .row-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }
        .transition-standard {
          transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-hero-card {
          background: linear-gradient(135deg, #1e0b4f 0%, #2b1263 50%, #3e1b7d 100%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15), inset 0 1px rgba(255, 255, 255, 0.1);
        }
        .ambient-glow {
          position: absolute;
          width: 200px;
          height: 200px;
          background: #7B61FF;
          filter: blur(80px);
          opacity: 0.15;
          pointer-events: none;
        }
        .progress-bar-fill {
          background: linear-gradient(90deg, #7B61FF 0%, #A685FF 100%);
          box-shadow: 0 0 12px rgba(123, 97, 255, 0.25);
          animation: shimmer 3s infinite linear;
          background-size: 200% 100%;
        }
        @keyframes shimmer {
          0% { background-position: 100% 0%; }
          100% { background-position: -100% 0%; }
        }
        .glass-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 200ms ease;
        }
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: translateY(-1px);
        }
      `}} />

      {/* Main Modal Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-background w-full h-[850px] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/60 text-slate-800 animate-scale-up"
        style={{ maxWidth: '1000px' }}
      >
        <main className="flex-grow flex flex-col min-w-0 overflow-y-auto">
          {/* Header */}
          <header className="sticky top-0 z-20 bg-white/60 backdrop-blur-xl px-8 py-5 border-b border-gray-200/50 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={onClose}
                className="group flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-standard font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>{t('back')}</span>
              </button>
              <h2 className="font-bold text-xl text-slate-900 tracking-tight">{t('title')}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-standard text-slate-400 hover:text-slate-600">
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-standard text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="p-8 space-y-8 max-w-5xl mx-auto w-full flex-1">
            {/* Section 1: Redesigned Premium Hero Card */}
            <section>
              <div className="premium-hero-card p-10 relative overflow-hidden flex items-center">
                {/* Ambient glows */}
                <div className="ambient-glow -left-20 -top-20"></div>
                <div className="ambient-glow -right-10 -bottom-10"></div>
                
                <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-12 text-white">
                  {/* LEFT: Subscription Info */}
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-[28px] font-bold tracking-tight leading-none">
                        {isFreePlan ? t('freePlan') : planName}
                      </h3>
                      <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                        isFreePlan 
                          ? 'bg-white/10 text-white/80 border-white/10' 
                          : 'bg-[#00ffaa]/10 text-[#4DFFB3] border-[#00ffaa]/20'
                      }`}>
                        {isFreePlan ? 'Trial' : 'Active'}
                      </span>
                    </div>
                    <p className="text-white/70 text-[14px] font-medium">
                      {isFreePlan 
                        ? t('noExpiry') 
                        : t('renewsOn', { date: formatDate(packageInfo?.endDate) })}
                    </p>
                  </div>

                  {/* MIDDLE: Credits Section */}
                  <div className="flex-1 w-full max-w-xs space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[14px] font-semibold text-white/90">
                        {t('creditsRemaining', { remaining: remainingCredits })}
                      </span>
                      <span className="text-[13px] font-bold text-white/60">{creditsPercentage}%</span>
                    </div>
                    <div className="w-full h-[6px] bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="progress-bar-fill h-full rounded-full transition-standard"
                        style={{ width: `${creditsPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* RIGHT: Actions */}
                  <div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
                    <button className="glass-button w-full px-6 py-2.5 rounded-xl text-white font-bold text-sm tracking-wide">
                      {t('upgradePlan')}
                    </button>
                    {!isFreePlan && (
                      <button className="text-white/50 hover:text-white transition-standard text-[13px] font-semibold">
                        {t('cancelSubscription')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Billing History */}
            <section className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="font-bold text-lg text-slate-900">{t('billingHistory')}</h3>
                {/* Filter Chips */}
                <div className="flex p-1 bg-gray-100 rounded-xl border border-gray-200/50">
                  {(['All', 'Paid', 'Pending', 'Failed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-standard ${
                        activeFilter === filter
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {t(`filter${filter}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                {loading ? (
                  <div className="p-12 text-center text-sm text-slate-400">{t('loading')}</div>
                ) : transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Receipt className="w-16 h-16 text-[#c6c6cf]/80 mb-4" />
                    <h4 className="font-bold text-base text-slate-700 mb-1">{t('emptyTitle')}</h4>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">{t('emptyDesc')}</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-slate-400 bg-gray-50/50">
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[15%]">{t('invoiceId')}</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[15%]">{t('date')}</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-1/3">{t('description')}</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right min-w-[120px]">{t('amount')}</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider w-[15%]">{t('method')}</th>
                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-center w-[10%]">{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((row) => (
                        <tr key={row.id} className="row-hover transition-standard bg-white">
                          <td className="px-6 py-5 font-bold text-sm text-slate-900">{row.id}</td>
                          <td className="px-6 py-5 text-slate-500 text-sm">{formatDate(row.createdAt)}</td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900">{row.planName}</span>
                              <span className="text-xs text-slate-400">{row.description}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right font-semibold text-sm text-slate-900">
                            {row.amount.toLocaleString()} THB
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-slate-500">
                              {row.method === 'credit_card' ? (
                                <>
                                  <CreditCard className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-medium">•••• {row.cardDigits || '1234'}</span>
                                </>
                              ) : (
                                <>
                                  <Wallet className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-medium">PromptPay</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`status-badge ${
                              row.status === 'SUCCESS'
                                ? 'bg-emerald-50 text-emerald-700'
                                : row.status === 'PENDING'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}>
                              {row.status === 'SUCCESS' 
                                ? t('filterPaid') 
                                : row.status === 'PENDING' 
                                ? t('filterPending') 
                                : t('filterFailed')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {(totalPages > 1 || totalItems === 0) && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2 px-2">
                  <p className="text-xs font-semibold text-slate-400">
                    {t('showing', {
                      start: startRange,
                      end: endRange,
                      total: totalItems,
                    })}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1 || totalItems === 0}
                      className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-standard cursor-pointer border-0 bg-transparent disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('previous')}
                    </button>
                    <div className="h-4 w-[1px] bg-gray-200"></div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages || totalItems === 0}
                      className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 disabled:opacity-30 transition-standard cursor-pointer border-0 bg-transparent disabled:cursor-not-allowed"
                    >
                      {t('next')}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Help Link */}
            <div className="flex justify-center pt-8 pb-12 border-t border-gray-100">
              <a
                className="group text-slate-500 hover:text-slate-800 transition-standard font-medium text-sm flex items-center gap-2"
                href="#"
              >
                <span>{t('supportText')}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>,
    document.body
  );
};
