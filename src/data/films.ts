import { representativeImage, type CategoryId } from "./projects";
import { youTubeId, youTubePoster } from "@/lib/youtube";

/**
 * What you write when you add a film. Three required fields, and only one of
 * them needs looking up anywhere — and that one is just the address bar.
 */
export type FilmInput = {
  /**
   * The YouTube link. Paste it however you have it — the address bar, the
   * Share button, a Short, or just the ID on its own. All of these work:
   *
   *   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   *   https://youtu.be/dQw4w9WgXcQ?si=abc123
   *   https://www.youtube.com/shorts/dQw4w9WgXcQ
   *   youtu.be/dQw4w9WgXcQ
   *   dQw4w9WgXcQ
   *
   * Tracking parameters, playlist ids and timestamps are all stripped.
   */
  url: string;
  title: string;
  /** What the job was and what was carried out. Two sentences at most. */
  summary: string;

  /* ---- everything below is optional ---- */

  /**
   * Which filter the film sits under, so it lines up with the photographs of
   * the same trade. One of the ids in CATEGORIES in ./projects — interior,
   * exterior, woodwork, feature or commercial. Defaults to interior.
   */
  category?: CategoryId;
  /** Where the job was. Defaults to the service area from the site config. */
  area?: string;
  /**
   * The still shown before anyone presses play.
   *
   * LEAVE IT OUT and you get a real photograph of the same trade from the
   * gallery, with its blur-up colour already sampled. That is the default on
   * purpose: it is the client's own work, it is already on this domain, and no
   * third party is involved at any point.
   *
   * Two other options:
   *   "/work/panelled-hallway-01.jpg"  — any photograph in public/work
   *   "youtube"                        — the video's own frame, fetched from
   *                                      i.ytimg.com BY THE SERVER through
   *                                      next/image and re-served from this
   *                                      domain, so the visitor's browser still
   *                                      never talks to Google. Needs the
   *                                      i.ytimg.com entry in next.config.mjs,
   *                                      which is already there.
   */
  poster?: string;
  /** Blur-up colour, only used with a hand-picked poster. See scripts/.tones.json. */
  tone?: string;
  /** Optional, shown as a badge. Free text: "4 min", "1 min 20". */
  duration?: string;
};

/** A film after the URL has been resolved. What the gallery actually renders. */
export type Film = Omit<FilmInput, "url" | "category" | "area" | "poster" | "tone"> & {
  id: string;
  category: CategoryId;
  area: string;
  poster: string;
  tone: string;
  /** True when the poster is YouTube's own frame rather than one of ours. */
  posterFromYouTube: boolean;
};

/**
 * James's films.
 *
 * ============================================================================
 * TO ADD ONE: paste a block like this into the array below. That is the whole
 * job — the gallery, the filters, the counts, the structured data and the
 * sitemap all read from here, and both the desktop and the mobile treatments
 * build themselves.
 *
 *   {
 *     url: "https://www.youtube.com/watch?v=PASTE_THE_LINK_HERE",
 *     title: "Hall, stairs and landing in four days",
 *     summary:
 *       "Panelling set out and fitted from bare walls, then the whole hall, " +
 *       "stairs and landing decorated around it.",
 *   },
 *
 * ============================================================================
 *
 * SHIPS EMPTY ON PURPOSE, and the whole Films section renders nothing while it
 * is — the same rule the testimonials follow. An empty video gallery with a
 * "coming soon" panel is worse than a site that simply does not claim to have
 * films yet. Add one entry and the section appears.
 *
 * A link that cannot be read is a build failure, not a broken page: the
 * resolver below throws with the film's title in the message, so a mistyped
 * URL is caught by `npm run build` rather than by a customer.
 */
const input: FilmInput[] = [];

/* -------------------------------------------------------------------------- */

/** Fallback area, matching the areas the gallery projects carry. */
const DEFAULT_AREA = "the Wirral";

/** A neutral dark tone, only reachable when a YouTube frame is asked for. */
const YOUTUBE_TONE = "#1e1e23";

function resolve(film: FilmInput, index: number): Film {
  const id = youTubeId(film.url);
  if (!id) {
    throw new Error(
      `films.ts — could not read a YouTube video ID out of "${film.url}" ` +
        `(film: "${film.title}"). Paste the whole link from the address bar ` +
        `or the Share button, e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
    );
  }

  const category = film.category ?? "interior";
  const posterFromYouTube = film.poster === "youtube";

  /* The default is one of OUR photographs, not YouTube's frame. Both routes
     keep the visitor's browser off Google — the YouTube one is proxied
     server-side by next/image — but only this one can be verified without a
     network round trip to a third party, and it shows the client's own work
     rather than whichever frame YouTube happened to grab. */
  const fallback = representativeImage(category, index);

  return {
    id,
    title: film.title,
    summary: film.summary,
    category,
    area: film.area ?? DEFAULT_AREA,
    poster: posterFromYouTube ? youTubePoster(id) : (film.poster ?? fallback.src),
    tone: posterFromYouTube ? YOUTUBE_TONE : (film.tone ?? fallback.tone),
    posterFromYouTube,
    duration: film.duration,
  };
}

export const films: Film[] = input.map(resolve);

/** True when James has supplied at least one real film. */
export const hasFilms = films.length > 0;

/* -------------------------------------------------------------------------- */
/*                            PLACEHOLDER SLOTS                               */
/* -------------------------------------------------------------------------- */

/**
 * Empty slots, shown on /videos while there are no films.
 *
 * The rule everywhere else on this site is that a section with no content
 * renders nothing at all — an empty gallery is worse than no gallery. This is
 * the deliberate exception, and it exists so the video gallery can be reviewed
 * and signed off BEFORE the films exist, rather than the design being seen for
 * the first time on the day it goes live.
 *
 * They are honest about what they are. Each slot says "awaiting link", the play
 * control is outlined rather than filled, and nothing about them claims to be a
 * film. Nobody reading the page can mistake one for a video that failed.
 *
 * TURNING THEM OFF: add a real film to the array above and they disappear on
 * their own — real content always wins. To hide them without adding a film
 * (before the site goes to customers, say), set NEXT_PUBLIC_FILM_SLOTS=0 in the
 * host's environment variables and redeploy; /videos then says the films are
 * being put together and offers the photographs instead.
 */
export type FilmSlot = {
  slot: number;
  title: string;
  summary: string;
  poster: string;
  tone: string;
};

const SLOT_BRIEFS = [
  {
    title: "A hall, stairs and landing, start to finish",
    summary: "The room James is asked about most, filmed over the four days it takes.",
    category: "interior" as CategoryId,
  },
  {
    title: "Preparation, in real time",
    summary: "Filling, sanding, caulking and masking — the part of the job the price is mostly made of.",
    category: "woodwork" as CategoryId,
  },
  {
    title: "An exterior in a week",
    summary: "Washing down, making good and two full coats, weather permitting.",
    category: "exterior" as CategoryId,
  },
];

export const filmSlots: FilmSlot[] = SLOT_BRIEFS.map((brief, index) => {
  const image = representativeImage(brief.category, index + 1);
  return {
    slot: index + 1,
    title: brief.title,
    summary: brief.summary,
    poster: image.src,
    tone: image.tone,
  };
});

/**
 * Whether to show the slots. Real films always win; the env var only decides
 * what happens while there are none.
 *
 * Defaults to ON, so the gallery is reviewable the moment the site is deployed
 * rather than needing a variable set to become visible at all.
 */
export const showFilmSlots =
  !hasFilms && process.env.NEXT_PUBLIC_FILM_SLOTS !== "0";

/** True when /videos has anything at all to render. */
export const hasVideoPage = hasFilms || showFilmSlots;
