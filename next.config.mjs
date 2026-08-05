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
};

const withMDX = createMDX({
  extension: /\.mdx$/,
});

export default withMDX(nextConfig);
