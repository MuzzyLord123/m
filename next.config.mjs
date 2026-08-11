import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

/**
 * The Content-Security-Policy, composed from what this site can actually reach.
 *
 * WHY THERE IS NO NONCE, which is what the old comment here said was needed.
 * A nonce is resolved when a page RENDERS, and every page on this site is
 * prerendered at build time — all fourteen of them. The shipped HTML proves it:
 * `.next/server/app/index.html` already contains `"nonce":"$undefined"`, and
 * carries 65 inline flight scripts that no middleware-generated nonce will ever
 * reach. Making a nonce work means `export const dynamic = "force-dynamic"` in
 * the root layout, which opts every route out of prerendering and turns
 * fourteen CDN-served documents into per-request function calls. On a brochure
 * site with no personalised content that trades away more than it buys.
 *
 * So this is an ORIGIN ALLOWLIST instead, and it is exact: every entry below
 * was read out of the source rather than guessed.
 *
 * 'unsafe-inline' IN script-src IS NOT AN OVERSIGHT. Without a nonce there is
 * no alternative — Next's own bootstrap is inline. It is worth being honest
 * about what remains: this policy will not stop injected inline script. What it
 * does stop is the part that turns an injection into a breach — connect-src
 * bounds where data can be sent, form-action bounds where the quote form can
 * post, base-uri stops one injected <base> tag repointing every root-relative
 * URL in the document, and frame-src keeps embeds to four known players.
 *
 * i.ytimg.com IS DELIBERATELY ABSENT from img-src. The browser never contacts
 * it: Next fetches YouTube poster frames server-side and serves them from this
 * origin. Adding it "because YouTube" would quietly undo the click-to-load
 * privacy promise the whole VideoFacade is built on.
 *
 * IF THE LIVE CHAT MISBEHAVES, this is the first thing to suspect. Tawk pulls
 * further *.tawk.to hosts at runtime and opens websockets, and that fan-out is
 * documented by Tawk rather than derivable from this repo. The Tawk origins are
 * only included when the widget is actually configured, so a site without chat
 * carries the tighter policy. To diagnose: change the header key below to
 * "Content-Security-Policy-Report-Only" and read the console — nothing will be
 * blocked while you look.
 */
function contentSecurityPolicy() {
  const chatEnabled = Boolean(process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID);

  const tawk = {
    script: chatEnabled ? " https://embed.tawk.to" : "",
    style: chatEnabled ? " https://embed.tawk.to" : "",
    img: chatEnabled ? " https://*.tawk.to https://tawk.link" : "",
    font: chatEnabled ? " https://embed.tawk.to" : "",
    connect: chatEnabled ? " https://*.tawk.to wss://*.tawk.to" : "",
    frame: chatEnabled ? " https://*.tawk.to" : "",
    media: chatEnabled ? " https://embed.tawk.to" : "",
  };

  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${tawk.script}`,
    /* Nonces do not apply to style ATTRIBUTES — those are style-src-attr, which
       has no nonce mechanism at all — and this site renders 95 of them on the
       home page alone: the menu's stagger delays, the before/after slider's
       --ba-pos, the splash band indices, and next/image's own
       style="color:transparent". Hashes are impossible too, since the values
       are computed per render. */
    `style-src 'self' 'unsafe-inline'${tawk.style}`,
    /* data: covers the blurDataURL placeholders, the grain texture and the hero
       brush mask, which is a data: URL used as a CSS mask. */
    `img-src 'self' data:${tawk.img}`,
    `font-src 'self'${tawk.font}`,
    /* 'self' is what the Server Action POSTs and the RSC prefetches need. */
    `connect-src 'self'${tawk.connect}`,
    /* youtube.com as well as the nocookie host: the nocookie player navigates
       its own frame there on age-gates and some error paths. */
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com" +
      ` https://www.google.com https://maps.google.com${tawk.frame}`,
    `media-src 'self'${tawk.media}`,
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway runs the standalone server bundle out of the Docker image. Vercel
  // builds its own serverless output and sets VERCEL=1, where asking for
  // standalone is redundant — so it is only requested off-platform.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
  /* Next sends `X-Powered-By: Next.js` on every response by default. It is not
     a vulnerability on its own — but it names the framework and therefore the
     CVE list worth trying, for free, to anyone running a scanner. There is no
     reason to answer that question. */
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    /**
     * YouTube poster frames, and nothing else.
     *
     * This entry is what lets a film be added with nothing but its URL. Next
     * fetches the frame from i.ytimg.com ON THE SERVER, optimises it and serves
     * it from this domain — so a visitor who never presses play still never
     * makes a request to Google, which is the promise the click-to-load player
     * is built around.
     *
     * Scoped to the one host and the one path shape on purpose: a wildcard here
     * turns the image optimiser into an open proxy that anyone can point at any
     * URL and bill to this project.
     */
    /* `search: ""` REQUIRES AN EMPTY QUERY STRING, and it is not decoration.
       Next only enforces a pattern's `search` when the pattern declares one, so
       without it the query was unconstrained — and the optimiser's cache key is
       the FULL url including its query. That made an infinite key space out of
       one allowed host: ...maxresdefault.jpg?a=1, ?a=2, ?a=3 all fetch the same
       JPEG from YouTube and all miss the cache, so every request re-fetched and
       re-encoded at 3840px in AVIF. On Vercel that is metered transformations
       billed to this project; on the standalone/Docker path the encodes run in
       the same container that serves the quote form. */
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**", search: "" },
    ],
    /* And this closes the other multiplier. With no list, any q=1..100 is
       accepted and each value is its own cache entry — a free 100x on the work
       above. The site only ever asks for 75. */
    qualities: [75],
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "motion"],
  },

  /**
   * Security headers. A brochure site is a low-value target, but it collects
   * names, phone numbers and addresses through the quote form, and the cost of
   * these is one config block.
   *
   * The CSP is built by contentSecurityPolicy() at the top of this file — see
   * there for why it is an origin allowlist rather than the nonce this comment
   * used to promise, and what it does and does not protect against.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stop the site being framed into someone else's page.
          { key: "Content-Security-Policy", value: contentSecurityPolicy() },
          /* Kept alongside frame-ancestors, not replaced by it. frame-ancestors
             is the modern control and every current browser honours it, but
             X-Frame-Options costs one line and still covers the older ones. */
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // No MIME sniffing — an uploaded file cannot be coaxed into script.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Send the origin off-site, never the full path a visitor was reading.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Nothing here needs a camera, a microphone or a location.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HTTPS only, once the domain is live. Vercel and Railway both serve
          // TLS by default, so this is safe from the first deploy.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          /* Severs window.opener between this page and anything it opens
             cross-origin, so a page opened from here cannot reach back and
             navigate it. `same-origin-allow-popups` rather than plain
             `same-origin` on purpose: the live chat opens its own window, and
             the strict value would cut that off from the widget that opened it.
             NOTE — deliberately no Cross-Origin-Embedder-Policy. COEP requires
             every cross-origin subresource to opt in with CORP, and the YouTube
             player and the Google Maps embed do not. Adding it would silently
             blank both. */
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          // Legacy Flash/Acrobat cross-domain policy files. None exist here, and
          // this says so rather than leaving the question open.
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          // Asks the browser to key this origin's agent cluster by origin, so a
          // same-site but cross-origin document cannot share a process with it.
          { key: "Origin-Agent-Cluster", value: "?1" },
        ],
      },
      {
        // Fingerprinted build output never changes under the same URL.
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Photographs are replaced by filename, not by hash, so they get a day
        // in the browser and a month on the CDN with revalidation behind it.
        source: "/:dir(work|social|brand)/:file*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx$/,
  options: {
    /* Without GFM, MDX is CommonMark only — and CommonMark has no pipe tables.
       The room-by-room price table in the costs post was rendering as one
       run-on paragraph of pipe characters, on the single most linkable block
       on the site. The table/th/td components in src/mdx-components.tsx were
       unreachable dead code until this was added. */
    remarkPlugins: [remarkGfm],
  },
});

export default withMDX(nextConfig);
