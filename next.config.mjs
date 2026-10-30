/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Security headers (incl. per-request CSP nonce) are set in src/middleware.ts.
  async redirects() {
    return [
      { source: "/dashboard", destination: "/plan", permanent: true },
      { source: "/meal-plan", destination: "/plan", permanent: true },
      { source: "/budget", destination: "/plan", permanent: true },
      { source: "/cart", destination: "/list", permanent: true },
      { source: "/settings", destination: "/me", permanent: true },
      { source: "/my-templates", destination: "/dishes?tab=mine", permanent: true },
      { source: "/templates", destination: "/dishes", permanent: true },
      { source: "/templates/new", destination: "/dishes/new", permanent: true },
      { source: "/market/:slug", destination: "/m/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
