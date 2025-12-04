// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// ----------------------------------------
// next-pwa sonrası config

/* eski withPWA

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})

module.exports = withPWA({
  // diğer next.js config ayarları
})
*/

// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: false,
  skipWaiting: true,
  // Offline kuyruğunu yerelde test edeceksen false yap:
  // disable: false,
  disable: process.env.NODE_ENV === "development",
})

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:3001"

module.exports = withPWA({
  eslint: {
    // Allow production builds to successfully complete even if there are ESLint errors.
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        // Frontend’te /api/v1/... → Backend 3001’e gider
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ]
  },
})
