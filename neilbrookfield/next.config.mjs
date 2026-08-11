/**
 * Migration note (see MIGRATION.md §2):
 * These redirects carry the Wix URLs across. They are permanent (301) on purpose —
 * the old site has fifteen years of accumulated links pointing at it and we are not
 * throwing that away. Do not change the canonical host: it is www, and it stays www.
 */
const WIX_REDIRECTS = [
  { source: '/about-neil', destination: '/about' },
  { source: '/portfolio', destination: '/work' },
  { source: '/home-decor-workshop-lessons', destination: '/workshops' },
  { source: '/contact-me', destination: '/contact' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // AVIF first, WebP fallback. The photographs are the whole site, so they get
    // the smallest modern format the browser will admit to supporting.
    formats: ['image/avif', 'image/webp'],
    // Widths tuned for the layout: full-bleed hero, 7-col spread image, and the
    // vertical sequence on a project page. No thumbnails — there is no grid.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560, 3200],
    imageSizes: [256, 384, 512],
  },

  async redirects() {
    // statusCode: 301 rather than `permanent: true`, which emits a 308. Google
    // treats the two the same, but 301 is what the old site's inbound links and
    // fifteen years of tooling expect, and it is what the migration plan says.
    return [
      ...WIX_REDIRECTS.map((r) => ({ ...r, statusCode: 301 })),
      // Apex → www. Belt and braces: the host should do this at the edge as well
      // (see MIGRATION.md), but if traffic reaches the app on the apex we send it on.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'neilbrookfield.co.uk' }],
        destination: 'https://www.neilbrookfield.co.uk/:path*',
        statusCode: 301,
      },
    ];
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
    ];
  },
};

export default nextConfig;
