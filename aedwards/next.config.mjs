import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SECURITY_HEADERS } from './hosting/headers.mjs'

/*
 * Static export mode: `npm run build:static`.
 *
 * Produces a plain folder of HTML, CSS and JS in out/ that can be dropped on
 * any host — Netlify, Cloudflare Pages, a cPanel public_html, an S3 bucket.
 * No Node, no server, no build step at the far end.
 *
 * Two things do not survive the trip, and both are in HOSTING.md:
 *
 *   - The headers below are applied by a Node server, which a static host is
 *     not. public/_headers and public/.htaccess carry the same policy for
 *     Netlify/Cloudflare and Apache respectively; anything else has to be
 *     configured on the host.
 *   - Server Actions do not exist without a server, so the enquiry form cannot
 *     work. It is already hidden until an email address is configured, so
 *     nothing is lost today — but a static host can never turn it on. If Andy
 *     wants the form, the site needs a Node host (or Vercel) instead.
 *
 * The default build is unchanged and keeps both.
 */
const STATIC_EXPORT = process.env.STATIC_EXPORT === '1'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  ...(STATIC_EXPORT
    ? {
        output: 'export',
        // There is no image optimiser on a static host. No photographs on the
        // site yet either, so this costs nothing today — but when Andy's
        // originals arrive, resize them before they go in public/photographs.
        images: { unoptimized: true },
        // Write /reviews/index.html rather than /reviews.html, so hosts that
        // do not rewrite extensionless URLs still serve the right thing.
        trailingSlash: true,
      }
    : {}),

  // This app is a sibling of two other sites in the same repository, each with
  // its own lockfile. Without this, the bundler walks up and picks whichever
  // lockfile it finds first as the workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),

    // A static export cannot contain a Server Action — not even an unused one,
    // because the 'use server' directive fails the export on sight. Swap the
    // action module for a stub; the form is not rendered on a static host
    // anyway. See src/lib/actions.static.ts.
    ...(STATIC_EXPORT ? { resolveAlias: { '@/lib/actions': './src/lib/actions.static.ts' } } : {}),
  },

  images: {
    // There is no photography on this site yet, and the site is designed to
    // stand up without any. When Andy's originals arrive they go through
    // next/image with these formats — see content/photos.ts.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [256, 384, 512],
  },

  // Served here on a Node host. On a static host the same list is written into
  // _headers and .htaccess by scripts/pack-static.mjs — see hosting/headers.mjs.
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }]
  },
}

export default nextConfig
