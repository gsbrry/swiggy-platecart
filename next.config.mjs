/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Security headers are applied in src/middleware.ts so they cover all responses
  // (including API routes) with a single source of truth.
};

export default nextConfig;
