/**
 * Turning whatever YouTube hands you into a video ID.
 *
 * The point of this file is that the person adding a film should not have to
 * know what a video ID is. YouTube's share button, the address bar, the mobile
 * app and the Shorts player all produce different URLs for the same video, and
 * asking a decorator to find "the part after v=" in
 *
 *   https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL9tY&index=2&t=15s
 *
 * is how a video ends up pasted in with the tracking parameters attached, or
 * not pasted in at all. Every shape below is accepted, and a bare ID still
 * works, so nothing that was already in films.ts breaks.
 */

/** The eleven-character form every YouTube video ID takes. */
const ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Path prefixes that carry the ID as the next segment.
 * /v/ and /e/ are legacy but still resolve, and cost one line to support.
 */
const PATH_FORMS = ["embed", "shorts", "live", "v", "e"];

/**
 * Extracts the video ID from a URL, or returns null if there isn't one.
 *
 * Returns null rather than throwing: a bad URL should surface as a build-time
 * audit failure with the film's title attached, not as a stack trace with a
 * regex in it.
 */
export function youTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Already an ID. The common case once someone has done this once.
  if (ID.test(value)) return value;

  let url: URL;
  try {
    // Tolerates a pasted "youtu.be/xyz" with no scheme, which is what you get
    // from copying out of a text message.
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  // youtu.be/<id>
  if (host === "youtu.be") {
    return ID.test(segments[0] ?? "") ? segments[0] : null;
  }

  if (!host.endsWith("youtube.com") && !host.endsWith("youtube-nocookie.com")) return null;

  // youtube.com/watch?v=<id>
  const v = url.searchParams.get("v");
  if (v && ID.test(v)) return v;

  // youtube.com/{embed,shorts,live,v,e}/<id>
  if (PATH_FORMS.includes((segments[0] ?? "").toLowerCase())) {
    return ID.test(segments[1] ?? "") ? segments[1] : null;
  }

  return null;
}

/**
 * The poster frame, served from OUR origin.
 *
 * This is the whole reason a poster file is no longer required. next/image
 * fetches i.ytimg.com **on the server**, optimises it and serves it from this
 * domain — so the visitor's browser never makes a request to Google, and the
 * click-to-load promise the player is built around still holds. Configured by
 * `images.remotePatterns` in next.config.mjs; without that entry Next refuses
 * the URL outright rather than proxying something unexpected.
 *
 * maxresdefault is the 1280x720 frame. Not every upload has one — YouTube only
 * generates it above a resolution threshold — so hqdefault (480x360, always
 * present) is the fallback, and FilmGallery swaps to it on error.
 */
export function youTubePoster(id: string, quality: "max" | "hq" = "max"): string {
  return `https://i.ytimg.com/vi/${id}/${quality === "max" ? "maxresdefault" : "hqdefault"}.jpg`;
}
