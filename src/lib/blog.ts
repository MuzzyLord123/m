import type { ComponentType } from "react";

import * as costPost from "@/content/blog/cost-to-paint-a-three-bed-house.mdx";
import * as whitePost from "@/content/blog/choosing-the-right-white.mdx";
import * as paperPost from "@/content/blog/wallpaper-versus-paint.mdx";

export type PostMeta = {
  title: string;
  description: string;
  category: string;
  /** ISO date. */
  date: string;
  /** Reading time in minutes, set per post when it is written. */
  minutes: number;
  image: string;
  tone: string;
};

export type Post = PostMeta & {
  slug: string;
  Content: ComponentType;
};

/**
 * The blog is a small, hand-kept set of SEO assets rather than a CMS. Posts are
 * MDX files imported here, so everything is typed, statically rendered and
 * checked at build time — a missing field is a build error, not a blank page.
 *
 * To add a post: drop the .mdx file in src/content/blog with a `meta` export
 * and add three lines here.
 */
const registry: { slug: string; module: { meta: PostMeta; default: ComponentType } }[] = [
  { slug: "cost-to-paint-a-three-bed-house", module: costPost as never },
  { slug: "choosing-the-right-white", module: whitePost as never },
  { slug: "wallpaper-versus-paint", module: paperPost as never },
];

export const posts: Post[] = registry
  .map(({ slug, module }) => ({ slug, ...module.meta, Content: module.default }))
  .sort((a, b) => b.date.localeCompare(a.date));

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** Neighbours for the prev/next control at the foot of an article. */
export function getNeighbours(slug: string): { previous?: Post; next?: Post } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return { previous: posts[index + 1], next: posts[index - 1] };
}

export function formatPostDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
