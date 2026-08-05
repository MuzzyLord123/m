import { DripAccent } from "@/components/motion/DripAccent";

/**
 * One heading treatment across the site: an eyebrow above a tape-line rule,
 * then the display line. The rule can carry the drip — used once, on services.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  drip = false,
  align = "left",
  onDark = false,
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  drip?: boolean;
  align?: "left" | "wide";
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div>
        <p
          className={`text-[0.75rem] font-semibold tracking-[0.16em] uppercase ${
            onDark ? "text-white/80" : "text-ink-mute"
          }`}
        >
          {eyebrow}
        </p>
        {/* The rule is the drip's anchor — it hangs off the underside of it. */}
        <div
          className={`relative mt-3 h-px w-full ${onDark ? "bg-white/25" : "bg-hairline"}`}
          aria-hidden="true"
        >
          {drip && <DripAccent className="absolute top-full left-[13%]" />}
        </div>
      </div>

      <div className={align === "wide" ? "mt-8" : "mt-8 lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-16"}>
        <h2
          className={`font-display text-[2.25rem] leading-[1.02] font-semibold tracking-[-0.03em] text-balance sm:text-[2.75rem] lg:text-[3.25rem] ${
            onDark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {lead && (
          <p
            className={`measure mt-5 text-[1.0625rem] leading-relaxed lg:mt-2 ${
              onDark ? "text-white/80" : "text-ink-soft"
            }`}
          >
            {lead}
          </p>
        )}
      </div>
    </div>
  );
}
