import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

/**
 * The logo lockup. One component, used by the desktop bar, the mobile bar and
 * the flood menu, so the mark can never drift between them.
 *
 * This is the CLIENT'S OWN ARTWORK, not a recreation. What he supplied was a
 * mockup render of the logo sitting on a dark textured plate — not a logo file.
 * Lifting the artwork off that plate failed while the site was light, because
 * whatever plate texture survived the key showed as grey haze on white. Once
 * the site went black the same extraction became clean: the plate is estimated
 * with a heavy blur and subtracted, then the result is unpremultiplied, so any
 * residue lands at very low alpha against a ground that is nearly black anyway.
 *
 *   public/brand/logo.png          — the extracted lockup, transparent
 *   public/brand/logo-knockout.png — the same artwork as a near-black stencil,
 *                                    for the orange flood menu, where the
 *                                    full-colour mark would be orange on orange
 *   public/brand/logo-source.jpg   — the original mockup, kept for reference
 *
 * The brush handle is thinner than in the original: it is a dark grey object
 * that sat at almost exactly the plate's own value, so it could not be fully
 * separated. At the sizes this renders — 40 to 56px tall — it is not visible.
 *
 * If a proper transparent PNG or SVG ever arrives from the designer, drop it
 * over public/brand/logo.png and nothing here needs to change.
 */
export function Wordmark({
  className = "",
  onAccent = false,
  priority = false,
}: {
  className?: string;
  /** True where the mark sits on the orange flood panel. */
  onAccent?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center transition-opacity duration-200 hover:opacity-85 ${className}`}
    >
      <Image
        src={onAccent ? "/brand/logo-knockout.png" : "/brand/logo.png"}
        alt={`${site.name} — painter and decorator, home`}
        width={669}
        height={280}
        priority={priority}
        sizes="(min-width: 1024px) 260px, 190px"
        className="h-10 w-auto sm:h-11 lg:h-12"
      />
    </Link>
  );
}
