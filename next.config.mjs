import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway runs the standalone server bundle out of the Docker image. Vercel
  // builds its own serverless output and sets VERCEL=1, where asking for
  // standalone is redundant — so it is only requested off-platform.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  pageExtensions: ["ts", "tsx", "mdx"],
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react", "motion"],
  },

  /**
   * Security headers. A brochure site is a low-value target, but it collects
   * names, phone numbers and addresses through the quote form, and the cost of
   * these is one config block.
   *
   * No CSP is set here on purpose. Next injects inline bootstrap scripts, so a
   * meaningful policy needs a per-request nonce through middleware, and a
   * half-written CSP that has to carry 'unsafe-inline' buys nothing while being
   * one deploy away from silently breaking the forms. The headers below are the
   * ones that are unambiguous. If a CSP is wanted later, do it with a nonce and
   * test the quote flow before shipping it.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stop the site being framed into someone else's page.
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
});

export default withMDX(nextConfig);
