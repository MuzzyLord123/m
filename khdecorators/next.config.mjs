/**
 * Migration note — read ADS-MIGRATION.md and LAUNCH.md before cutover.
 *
 * This replaces a live Google Sites site that is receiving PAID traffic. Three of the
 * old URLs change; every other slug is deliberately identical to the old one, because
 * those pages are indexed and Google Ads may already point at them.
 *
 * 301, not 308. Google treats them the same for ranking, but 301 is what the Ads
 * final-URL checker, the old inbound links and every bit of SEO tooling expect.
 */
const GOOGLE_SITES_REDIRECTS = [
  { source: '/home', destination: '/' },
  { source: '/about-us', destination: '/about' },
  { source: '/contact-us', destination: '/contact' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // This repository holds several independent sites, each with its own lockfile.
  // Without this, Turbopack walks up and picks the repository root as the workspace.
  turbopack: { root: import.meta.dirname },

  images: {
    // AVIF first, WebP fallback. The annotated photographs are the signature device
    // on this site and they are the largest thing on any page, so they get the
    // smallest modern format the browser admits to supporting.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [256, 384, 512, 768],
  },

  async redirects() {
    return GOOGLE_SITES_REDIRECTS.map((r) => ({ ...r, statusCode: 301 }))
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
