/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

/** Public auth base (client forgot/reset + server getAuthServiceBaseUrl fallback). Do not default to localhost in production builds or login proxies the wrong host. */
const defaultPublicAuthUrl =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://api-auth.idealweddings.space'
    : 'http://localhost:3002');

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_AUTH_SERVICE_URL: defaultPublicAuthUrl,
  },
};

module.exports = withPWA(nextConfig);