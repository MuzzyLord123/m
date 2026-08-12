/**
 * Migration (see MIGRATION.md).
 *
 * The old site is WordPress on a bought theme called `decorator-pro`. Its URLs
 * are the only thing worth keeping from it, so every one of them lands
 * somewhere deliberate here. Nothing 404s: the catch-alls at the bottom of
 * OLD_URLS make sure of it.
 *
 * Two kinds of entry below:
 *   CONFIRMED — the old page title was read and matches the new page.
 *   INFERRED  — the old slug is opaque (`project-1`) and the mapping is a
 *               reasonable guess. Each one is listed in MIGRATION.md under
 *               "check before cutover". Correct them there, not from memory.
 */

/** Pages that moved one-for-one. Both titles read off the live site. */
export const PAGES = [
  { source: '/about-us', destination: '/about' }, // CONFIRMED
  { source: '/contact-us', destination: '/contact' }, // CONFIRMED
  { source: '/pages', destination: '/' }, // CONFIRMED — theme's page index, no equivalent
];

/**
 * The `recent_work` custom post type. Slugs read off the live site; titles in
 * the comments are the theme's own H1s.
 *
 * Only three jobs are written up in the rebuild, because only three had a
 * write-up worth carrying across. The rest point at the page that covers the
 * same kind of work — a visitor who followed a link about a living room should
 * land on interior decorating, not on an archive index that makes them start
 * again. If those jobs are later written up with photographs, repoint these at
 * the project pages; MIGRATION.md says so too.
 */
export const RECENT_WORK = [
  // CONFIRMED — "ReAgent Project"
  { source: '/recent_work/reagent-project', destination: '/projects/reagent-offices-and-warehouse' },
  // INFERRED — "Damaged Window". The only exterior window job on the old site,
  // and its write-up describes the masonry-and-windows job we kept.
  { source: '/recent_work/project-1', destination: '/projects/external-masonry-and-windows' },
  // INFERRED — one of project-2 / project-3 is the hall, stairs and landing job
  // we kept; the old site had two similar ones and the slugs do not say which.
  { source: '/recent_work/project-2', destination: '/projects/hall-stairs-and-landing' },
  { source: '/recent_work/project-3', destination: '/projects/hall-stairs-and-landing' },
  // CONFIRMED titles, not written up — sent to the matching service page.
  { source: '/recent_work/project-4', destination: '/interior' }, // "Living Room"
  { source: '/recent_work/project-5', destination: '/commercial' }, // "Coffee Shop"
  { source: '/recent_work/project-6', destination: '/interior' }, // "Home Makeover"
];

/**
 * The blog is retired, not rebuilt (MIGRATION.md §3). Three posts, last one
 * 2022, one from 2017 — all three are job write-ups rather than articles, so
 * they go where that work now lives. An empty blog is worse than no blog.
 */
export const BLOG = [
  { source: '/2022/02/08/home-makeover', destination: '/interior' },
  { source: '/2022/02/08/living-room', destination: '/interior' },
  { source: '/2017/02/08/coffee-shop', destination: '/commercial' },
];

/** Anything else under a retired prefix, so no old link can dead-end. */
export const CATCH_ALLS = [
  { source: '/recent_work/:slug*', destination: '/projects' },
  { source: '/category/:slug*', destination: '/projects' },
  { source: '/tag/:slug*', destination: '/projects' },
  { source: '/author/:slug*', destination: '/about' },
  // Dated permalinks: /YYYY/MM/DD/slug. Any post not named above.
  { source: '/:year(\\d{4})/:month(\\d{2})/:day(\\d{2})/:slug*', destination: '/projects' },
  // Testimonials were stored on dummy slugs (/testimonials/john-doe/ and the
  // like) with real customers' words attached. The slugs die with the theme;
  // the words live on /about and /commercial.
  { source: '/testimonials/:slug*', destination: '/about' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STATIC_EXPORT ? { output: 'export', images: { unoptimized: true } } : {}),
  reactStrictMode: true,
  poweredByHeader: false,

  // This site lives in a sub-directory of a repository that holds several. Say
  // so explicitly, or Next walks up, finds the parent lockfile and infers the
  // wrong workspace root.
  turbopack: {
    root: import.meta.dirname,
    // Static hosting has no server, so Next refuses to export a Server Action
    // at all. For that build only, the enquiry action is swapped for a stub
    // that says so. See DEPLOY.md for which bundle to use.
    ...(process.env.STATIC_EXPORT
      ? { resolveAlias: { '@/app/contact/actions': './src/lib/enquiry-static-stub.ts' } }
      : {}),
  },

  images: {
    // The comparisons are the site. AVIF first, WebP behind it.
    formats: ['image/avif', 'image/webp'],
    // Widths tuned to the layout: full-bleed comparison, half-width split
    // column, and the small stack on a project page.
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [256, 384, 512, 768],
  },

  /**
   * Every URL on the old WordPress site ends in a slash. Left to itself Next
   * would normalise `/about-us/` to `/about-us` with a 308 and only then apply
   * our 301 — a two-hop chain on one hundred per cent of the inbound links.
   *
   * So trailing-slash handling is taken over here: each named old URL is
   * registered in both forms and answers in a single 301, and a general
   * cleanup at the bottom of the list catches everything else.
   */
  skipTrailingSlashRedirect: true,

  async redirects() {
    // statusCode: 301 rather than `permanent: true`, which emits a 308.
    // WordPress inbound links and every SEO tool in use expect a 301.
    const named = [...PAGES, ...RECENT_WORK, ...BLOG].flatMap((r) => [
      r,
      { ...r, source: `${r.source}/` },
    ]);

    return [
      ...named,
      ...CATCH_ALLS,
      // Anything else that arrives with a trailing slash — including the new
      // URLs — loses it here. Last in the list, so it never pre-empts a
      // specific rule above.
      { source: '/:path+/', destination: '/:path+' },
    ].map((r) => ({ ...r, statusCode: 301 }));
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
