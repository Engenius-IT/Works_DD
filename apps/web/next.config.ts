import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
    './src/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {

    // 1. เพิ่มส่วน Ignore Errors ตรงนี้
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    // Enable React strict mode for better development experience
    reactStrictMode: true,

    experimental: {
        allowedDevOrigins: ['192.168.1.33:3000']
    } as any,

    // Transpile workspace packages
    transpilePackages: ['@jobsabuy/shared-types', '@jobsabuy/validators'],

    // Image optimization config
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '**.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
        ],
    },

    // Environment variables exposed to the browser
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
};

export default withNextIntl(nextConfig);


