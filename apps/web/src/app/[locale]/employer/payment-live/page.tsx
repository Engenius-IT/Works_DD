'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import PaymentLiveMonitorPage from '@/components/PaymentLiveMonitorPage';

export default function EmployerPaymentLivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN'))) {
      router.replace('/login');
    }
  }, [loading, router, user]);

  if (loading || !user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <PaymentLiveMonitorPage />
      </main>
    </div>
  );
}
