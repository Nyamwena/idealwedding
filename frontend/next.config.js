/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
    images: {
        unoptimized: true, // 🔥 fixes ECONNREFUSED issue
    },
    env: {
        NEXT_PUBLIC_API_URL:
            process.env.NEXT_PUBLIC_API_URL || 'https://idealweddings.space/',
        NEXT_PUBLIC_AUTH_SERVICE_URL:
            process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
            'https://api-gateway.idealweddings.space',
    },
};

module.exports = withPWA(nextConfig);