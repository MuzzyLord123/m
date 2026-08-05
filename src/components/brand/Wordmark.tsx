import Link from "next/link";
import { site } from "@/config/site";

/**
 * Type-only lockup. "Paint" carries a painted underline in the accent — the
 * one place the brush stroke sits permanently rather than on hover.
 */
export function Wordmark({
  className = "",
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-baseline gap-[0.32em] font-display text-[1.0625rem] font-semibold tracking-[-0.03em] uppercase ${
        onDark ? "text-white" : "text-ink"
      } ${className}`}
      aria-label={`${site.name} — home`}
    >
      <span className="opacity-55">The</span>
      <span className="relative">
        Paint
        <span
          aria-hidden="true"
          className={`absolute -bottom-[0.18em] left-0 h-[0.14em] w-full origin-left rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-110 ${
            onDark ? "bg-white" : "bg-accent"
          }`}
        />
      </span>
      <span>Man</span>
    </Link>
  );
}
