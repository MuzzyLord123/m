import { fileURLToPath } from 'node:url'
import path from 'node:path'

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
        ],
      },
    ]
  },
}

export default nextConfig
