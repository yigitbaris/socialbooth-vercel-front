// next.config.js - PWA enabled with runtime caching
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
  cacheStartUrl: true,
  dynamicStartUrl: true,
    buildExcludes: [
    /app-build-manifest\.json$/,
    /build-manifest\.json$/,
    /react-loadable-manifest\.json$/
  ],

  runtimeCaching: [
    // Cache specific dynamic pages (payment, photo) ignoring search params
    {
      urlPattern: ({ url }) => {
        const isPayment = url.pathname.startsWith('/payment');
        const isPhoto = url.pathname.startsWith('/photo');
        return isPayment || isPhoto;
      },
      handler: "NetworkFirst",
      options: {
        cacheName: "dynamic-pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        matchOptions: {
          ignoreSearch: true,
        },
      },
    },
    // Cache page navigations (HTML)
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "pages",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    // Cache static assets
    {
      urlPattern: /^https?.*\.(png|jpg|jpeg|webp|svg|gif|ico|woff|woff2)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Cache Next.js static files
    {
      urlPattern: /^\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Cache fonts
    {
      urlPattern: /^https?:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    // Cache flag images
    {
      urlPattern: /^https:\/\/flagcdn\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "flag-images",
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Network first for API calls (will fallback to app's offline handler)
    {
      urlPattern: /\/api\/v1\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
      },
    },
    // Cache backgrounds and filters from local public folder
    {
      urlPattern: /^\/(backgrounds|filters)\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "media-assets",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    // Cache mediapipe models
    {
      urlPattern: /^\/mediapipe\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "mediapipe-models",
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Cache ML models
    {
      urlPattern: /^\/models\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "ml-models",
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    // Default handler for other requests
    {
      urlPattern: /.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "others",
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
})

const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_ORIGIN || "http://booth-api.cloud.solucharger.com"

module.exports = withPWA({
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push("canvas")
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ]
  },
})
