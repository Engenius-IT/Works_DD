import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['100', '300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-prompt',
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  const isEn = locale === 'en';

  const titleDefault = isEn
    ? 'WorksDD — Find Jobs, Apply Easily'
    : 'WorksDD — หางาน สมัครงาน ง่ายๆ สบายๆ';

  const description = isEn
    ? 'Thailand\'s leading job platform. Find jobs from top companies, apply easily, get hired faster. Full-time, Part-time, Remote, Freelance.'
    : 'เว็บหางานอันดับ 1 ของไทย ค้นหางานจากบริษัทชั้นนำ สมัครง่าย ได้งานไว Full-time, Part-time, Remote, Freelance';

  return {
  metadataBase: new URL('https://worksdd.com'),
  title: {
    default: titleDefault,
    template: '%s | WorksDD',
  },
  description,
  keywords: ['หางาน', 'สมัครงาน', 'งาน', 'job', 'career', 'ประกาศงาน', 'WorksDD'],
  authors: [{ name: 'WorksDD Team' }],

  icons: {
    icon: [
      {
        url: '/images/logo_jobdd_main.png',
        type: 'image/png',
      },
    ],
    shortcut: '/images/logo_jobdd_main.png',
    apple: '/images/logo_jobdd_main.png',
  },

  openGraph: {
    type: 'website',
    locale: isEn ? 'en_US' : 'th_TH',
    url: 'https://worksdd.com',
    siteName: 'WorksDD',
    title: titleDefault,
    description: isEn
      ? 'Thailand\'s leading job platform. Find jobs from top companies, apply easily, get hired faster.'
      : 'เว็บหางานอันดับ 1 ของไทย ค้นหางานจากบริษัทชั้นนำ สมัครง่าย ได้งานไว',
  },
  robots: {
    index: true,
    follow: true,
  },
};
}

import { AuthProvider } from '@/context/AuthContext';
import CookieConsent from '@/components/CookieConsent';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  // Ensure that the incoming `locale` is valid
  if (!isLocale(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} className={prompt.variable} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
