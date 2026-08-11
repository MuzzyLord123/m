import { fileURLToPath } from 'node:url'
import path from 'node:path'

/*
 * The site loads nothing from anywhere else — both typefaces are self-hosted by
 * next/font, there are no analytics, no embeds, no CDN and no third-party
 * anything. So everything can be locked to 'self'.
 *
 * script-src and style-src carry 'unsafe-inline' and it is worth being straight
 * about what that costs. Next inlines its own bootstrap script, the JSON-LD
 * block is an inline script, and the first field's colours are an inline style
 * tag. The alternative is a per-request nonce, which requires middleware and
 * makes every page dynamic — trading the entire static prerender, and the
 * performance budget with it, for a hardening measure on a brochure site that
 * renders no user input back to the page.
 *
 * What the policy still buys, and buys cheaply: no script can be loaded from
 * another origin, no plugin content at all, no <base> rewrite, and the form
 * cannot be pointed at somebody else's server.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  'upgrade-insecure-requests',
].join('; ')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // This app is a sibling of two other sites in the same repository, each with
  // its own lockfile. Without this, the bundler walks up and picks whichever
  // lockfile it finds first as the workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },

  images: {
    // There is no photography on this site yet, and the site is designed to
    // stand up without any. When Andy's originals arrive they go through
    // next/image with these formats — see content/photos.ts.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [256, 384, 512],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Nothing on this site needs a camera, a microphone or a location.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
          // Two years, subdomains included. Deliberately NOT preloaded: preload
          // is a one-way door and the domain has not even been registered yet.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          { key: 'Content-Security-Policy', value: CSP },
        ],
      },
    ]
  },
}

export default nextConfig
