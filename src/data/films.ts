import type { CategoryId } from "./projects";

export type Film = {
  /**
   * The YouTube video ID — the part after `v=` or after `youtu.be/`.
   * For https://www.youtube.com/watch?v=dQw4w9WgXcQ that is `dQw4w9WgXcQ`.
   */
  id: string;
  title: string;
  /** What the job was and what was carried out. Two sentences at most. */
  summary: string;
  category: CategoryId;
  area: string;
  /**
   * A still from OUR OWN photographs, not YouTube's thumbnail.
   *
   * YouTube's thumbnail would mean a request to Google on every page load,
   * before anyone has asked to watch anything — which is exactly what the
   * click-to-load player exists to avoid. Any path from public/work works.
   */
  poster: string;
  /** Sampled from the poster so the blur-up matches. See scripts/.tones.json. */
  tone: string;
  /** Optional, shown as a badge. Free text: "4 min", "1 min 20". */
  duration?: string;
};

/**
 * James's films.
 *
 * SHIPS EMPTY ON PURPOSE, and the whole Films section renders nothing while it
 * is — the same rule the testimonials follow. An empty video gallery with a
 * "coming soon" panel is worse than a site that simply does not claim to have
 * films yet.
 *
 * TO ADD ONE: paste the entry below. Nothing else needs touching — the gallery,
 * the filters, the counts, the structured data and the sitemap all read from
 * this array, and both the desktop and mobile treatments build themselves.
 *
 *   {
 *     id: "dQw4w9WgXcQ",
 *     title: "Hall, stairs and landing in four days",
 *     summary:
 *       "Panelling set out and fitted from bare walls, then the whole hall, " +
 *       "stairs and landing decorated around it.",
 *     category: "interior",
 *     area: "Wirral",
 *     poster: "/work/panelled-hallway-01.jpg",
 *     tone: "#737070",
 *     duration: "4 min",
 *   },
 *
 * `category` must be one of the ids in CATEGORIES in ./projects — interior,
 * exterior, woodwork, feature or commercial — so a film sits under the same
 * filter as the photographs of the same trade.
 */
export const films: Film[] = [];

/** True when there is anything to show. Used to hide the section and its nav. */
export const hasFilms = films.length > 0;
