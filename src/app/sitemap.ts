import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number; frequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, frequency: "monthly" },
    { path: "/work", priority: 0.9, frequency: "monthly" },
    { path: "/services", priority: 0.9, frequency: "monthly" },
    { path: "/quote", priority: 0.9, frequency: "yearly" },
    { path: "/about", priority: 0.7, frequency: "yearly" },
    { path: "/contact", priority: 0.8, frequency: "yearly" },
    { path: "/blog", priority: 0.7, frequency: "weekly" },
    { path: "/privacy", priority: 0.2, frequency: "yearly" },
  ];

  return [
    ...pages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: now,
      changeFrequency: page.frequency,
      priority: page.priority,
    })),
    ...posts.map((post) => ({
      url: `${site.url}/blog/${post.slug}`,
      lastModified: new Date(`${post.date}T00:00:00Z`),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
