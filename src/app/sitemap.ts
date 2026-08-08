import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { site } from "@/config/site";
import { isBuilt, previewMode } from "@/config/preview";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, frequency: "monthly" },
    { path: "/work", priority: 0.9, frequency: "monthly" },
    { path: "/videos", priority: 0.8, frequency: "monthly" },
    { path: "/services", priority: 0.9, frequency: "monthly" },
    { path: "/quote", priority: 0.9, frequency: "yearly" },
    { path: "/about", priority: 0.7, frequency: "yearly" },
    { path: "/contact", priority: 0.8, frequency: "yearly" },
    { path: "/blog", priority: 0.7, frequency: "weekly" },
    { path: "/privacy", priority: 0.2, frequency: "yearly" },
  ];

  /* A sitemap that lists pages the site is currently refusing to serve is a
     crawl error waiting to happen, so in preview mode it lists only what is
     actually reachable. */
  const reachable = pages.filter((page) => isBuilt(page.path || "/"));

  return [
    ...reachable.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: now,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...(previewMode ? [] : posts).map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
