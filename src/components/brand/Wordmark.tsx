import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

/**
 * The logo lockup. One component, used by the desktop bar, the mobile bar and
 * the flood menu, so the mark can never drift between them.
 *
 * Two files, because the logo has to sit on both paper and a flooded accent
 * panel:
 *   public/brand/logo.png       — the full-colour mark, transparent background
 *   public/brand/logo-white.png — a white/knockout version for dark grounds
 *
 * Both are currently stand-ins. Export yours with a transparent background and
 * an aspect no wider than about 4:1 — a wider lockup has to be set so small to
 * fit the bar that the words stop being readable. SVG is better still: swap the
 * extension here and it just works. See PHOTO-MAP.md.
 *
 * The alt text carries the business name, so the mark is the accessible name of
 * the home link rather than being announced as an unlabelled image.
 */
export function Wordmark({
  className = "",
  onDark = false,
  priority = false,
}: {
  className?: string;
  onDark?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center transition-opacity duration-200 hover:opacity-85 ${className}`}
    >
      <Image
        src={onDark ? "/brand/logo-white.png" : "/brand/logo.png"}
        alt={`${site.name} — painting services, home`}
        width={900}
        height={300}
        priority={priority}
        sizes="(min-width: 1024px) 320px, 230px"
        className="h-11 w-auto sm:h-12 lg:h-14"
      />
    </Link>
  );
}
