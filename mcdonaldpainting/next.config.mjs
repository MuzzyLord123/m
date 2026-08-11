/**
 * Migration (see MIGRATION.md §2).
 *
 * The old site is a WordPress install of some age. The map below covers every
 * URL that is *known* — from the live navigation, the body copy and the brief.
 * It is deliberately not the whole map: nobody has been able to run a crawl
 * from this build environment, and an old WordPress install always has more
 * URLs than its menu shows. MIGRATION.md §1 is the crawl checklist; anything it
 * turns up gets added to KNOWN_PAGES or WORDPRESS_FURNITURE below.
 *
 * Two rules that are not negotiable:
 *   1. Nothing gets blanket-redirected to `/`. Google reads that as a soft 404
 *      and the link equity evaporates. Every old URL goes to the page that
 *      answers the same question.
 *   2. The canonical host does not change on cutover. See content/site.ts.
 */

/** Pages that exist on the live site today. */
const KNOWN_PAGES = [
  { source: '/about-mcdonald-painting-contractors', destination: '/about' },
  { source: '/projects-gallery', destination: '/projects' },
  { source: '/health-safety', destination: '/compliance' },
  { source: '/testimonials', destination: '/about#testimonials' },
  { source: '/contact-us', destination: '/contact' },
  // The FAQ answered "what do you paint / do you do commercial / are you
  // insured". Those answers are now written into the pages where the question
  // actually arises, so the FAQ lands on the capability schedule.
  { source: '/faq', destination: '/capabilities' },
  // A stranded page from the M & R Painting Contractors era, still linked from
  // the current site's body copy. It described the company, so it goes to the
  // page that does that now.
  { source: '/home-m-r-painting-contractors', destination: '/about' },
];

/**
 * The blog is retired (MIGRATION.md §4). Its most recent post was about Dulux's
 * 2020 colour of the year, so the archive is domestic decorating content: the
 * residential sector page is the honest destination for the posts, and the
 * capability schedule for the index.
 *
 * If the crawl finds a post that is genuinely about commercial work, add it to
 * BLOG_POSTS with a better destination — per-post beats the catch-all.
 */
const BLOG_POSTS = [
  // { source: '/blog/steelwork-repaint-warrington', destination: '/sectors/steelwork' },
];

/**
 * WordPress furniture: archives and feeds that exist whether or not anyone
 * linked them.
 *
 * Each prefix is listed twice — bare, and with a `:path(.*)` tail. The tail
 * form is what absorbs a trailing slash and anything under it in a single hop.
 */
const WORDPRESS_FURNITURE = [
  { source: '/blog', destination: '/capabilities' },
  { source: '/blog/:path(.*)', destination: '/sectors/residential' },
  { source: '/category', destination: '/sectors/residential' },
  { source: '/category/:path(.*)', destination: '/sectors/residential' },
  { source: '/tag', destination: '/sectors/residential' },
  { source: '/tag/:path(.*)', destination: '/sectors/residential' },
  { source: '/author', destination: '/about' },
  { source: '/author/:path(.*)', destination: '/about' },
  // Date archives: /2020/01, /2020/01/15, /2020/01/15/post-name
  { source: '/:year(\\d{4})/:month(\\d{2})', destination: '/sectors/residential' },
  { source: '/:year(\\d{4})/:month(\\d{2})/:path(.*)', destination: '/sectors/residential' },
  { source: '/feed', destination: '/sitemap.xml' },
  { source: '/comments/feed', destination: '/sitemap.xml' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // This project sits alongside other client builds in the same repository, so
  // the workspace root has to be stated or Turbopack picks the wrong lockfile.
  turbopack: { root: import.meta.dirname },

  /**
   * Every URL on the old WordPress site ends in a slash.
   *
   * Left on, Next's built-in normalisation answers `/health-safety/` with a 308
   * to `/health-safety`, and only then does the 301 to `/compliance` fire — two
   * hops for every legacy link, on every inbound link the site has. Turning it
   * off lets the redirect map below match the slashed form directly and answer
   * in one 301. The map carries both forms of every source for that reason.
   */
  skipTrailingSlashRedirect: true,

  // The capability statement reads its fonts from disk at request time, so the
  // files have to be traced into the server bundle.
  outputFileTracingIncludes: {
    '/capability-statement.pdf': ['./public/fonts/pdf/**'],
  },

  images: {
    // AVIF first. The site records are large, full-bleed, and are the only
    // heavy thing on the page, so the format matters more than usual.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920, 2560],
    imageSizes: [256, 384, 512],
  },

  async redirects() {
    // statusCode: 301 rather than `permanent: true`, which emits a 308. Google
    // treats them the same; 301 is what the inbound links and the tooling on
    // the other end of them expect.
    //
    // Sources without a parameter get a slashed twin. Sources that end in a
    // `:path(.*)` tail already absorb the slash, so they are left alone.
    const bothForms = (r) => [
      { ...r, statusCode: 301 },
      ...(r.source.includes(':') ? [] : [{ ...r, source: `${r.source}/`, statusCode: 301 }]),
    ];

    return [
      ...KNOWN_PAGES,
      ...BLOG_POSTS,
      ...WORDPRESS_FURNITURE,
      // With the built-in normalisation off, a slashed URL that is not in the
      // map above would 404 rather than resolve. This is the safety net: any
      // other path arriving with a trailing slash is sent to the same path
      // without one, which is what Next would have done anyway.
      { source: '/:path+/', destination: '/:path+', statusCode: 308 },
    ].flatMap(bothForms);
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
      {
        // The capability statement is generated per request from content/, so
        // it must never be served from a stale edge cache after Sean confirms a
        // figure and the copy changes.
        source: '/capability-statement.pdf',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default nextConfig;
