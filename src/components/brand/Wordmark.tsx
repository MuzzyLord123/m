import Link from "next/link";
import { site } from "@/config/site";

/**
 * The logo lockup. One component, used by the desktop bar, the mobile bar and
 * the flood menu, so the mark can never drift between them.
 *
 * DRAWN, NOT AN IMAGE — for now. The client's logo arrived as a mockup render
 * on a dark textured plate rather than as a logo asset, and the PNG stand-ins
 * that replaced it were worse on this ground than nothing: the "white" one
 * averaged mid-grey, so its "PAINTING SERVICES" line sank into the near-black
 * header and the mark shipped with half its words missing.
 *
 * This is the same lockup set in the site's own display face with the brush
 * gesture inline: sharp at every size, correct on both the near-black page and
 * the orange flood panel, nothing to load, and no stand-in that reads as a
 * placeholder.
 *
 * TO SWAP IN THE REAL MARK: get a transparent PNG or SVG from whoever made the
 * logo, drop it at public/brand/logo-white.svg, and replace the <span> block
 * below with next/image. Everything else — sizing, the home link, the
 * accessible name — stays as it is. See PHOTO-MAP.md.
 */
export function Wordmark({
  className = "",
  onAccent = false,
}: {
  className?: string;
  /** True where the mark sits on the orange flood panel rather than the page. */
  onAccent?: boolean;
}) {
  // On the page the brush is orange and the words are light; on the orange
  // panel both invert to near-black so the lockup stays one weight throughout.
  const wordColour = onAccent ? "text-on-accent" : "text-ink";
  const subColour = onAccent ? "text-on-accent/70" : "text-ink-mute";
  const brushColour = onAccent ? "text-on-accent" : "text-accent";

  return (
    <Link
      href="/"
      aria-label={`${site.name} — painter and decorator, home`}
      className={`inline-flex shrink-0 items-center gap-2.5 transition-opacity duration-200 hover:opacity-85 ${className}`}
    >
      <svg
        viewBox="0 0 64 64"
        aria-hidden="true"
        className={`size-9 shrink-0 lg:size-10 ${brushColour}`}
        fill="none"
      >
        {/* The logo's gesture: a curved stroke with the drip off its tail. */}
        <path
          d="M46 14c-13.3 0-24 9.1-24 20.4 0 7.1 4.2 13.2 10.5 16.6"
          stroke="currentColor"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        <path
          d="M32.5 51c3.8 2 8.3 3.1 13.1 3.1"
          stroke="currentColor"
          strokeWidth="7.5"
          strokeLinecap="round"
        />
        <circle cx="51.5" cy="53.5" r="3.6" fill="currentColor" />
      </svg>

      <span className="flex flex-col justify-center leading-none">
        <span
          className={`font-display text-[1.0625rem] leading-none font-bold tracking-[0.02em] whitespace-nowrap sm:text-[1.1875rem] ${wordColour}`}
        >
          THEPAINTMEN
        </span>
        <span
          className={`mt-[0.28em] text-[0.5rem] leading-none font-medium tracking-[0.28em] whitespace-nowrap sm:text-[0.5625rem] ${subColour}`}
        >
          PAINTING SERVICES
        </span>
      </span>
    </Link>
  );
}
