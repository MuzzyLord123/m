import { services } from "@/data/services";

/**
 * A full-bleed band of brand orange carrying the six trades, drifting steadily
 * to the right.
 *
 * ONE DIRECTION, ONE SPEED. This used to run on a scroll timeline, so the band
 * tracked the reader's hand: it drifted left as they scrolled down, ran
 * BACKWARDS when they scrolled up, and stopped dead whenever they stopped. That
 * is a nice idea and it reads as a fault — a band that changes direction looks
 * like it is glitching, and a band that halts looks broken. It is now a plain
 * 32s linear loop: the same direction and the same pace whatever the reader
 * does, which is the only thing a marquee has to get right. Still no
 * JavaScript, still no scroll listener, still composited off the main thread.
 *
 * The list is duplicated once, and the pair starts at -50% and runs to 0 — see
 * the keyframes in globals.css for why that particular pair of numbers is what
 * makes a RIGHTWARD loop seamless. The duplicate is aria-hidden: a screen reader
 * should hear the six trades once, not twice.
 *
 * Under prefers-reduced-motion it holds still at offset 0, where the words are
 * already on screen, so nothing is hidden by stopping it.
 */
export function TradeMarquee() {
  const words = services.map((service) => service.title);

  return (
    <div
      className="marquee-band orange-plane relative overflow-hidden py-7 lg:py-9"
      aria-label={`Trades: ${words.join(", ")}`}
    >
      {/* Both edges fade into the band so the words enter and leave rather than
          being sliced off by the viewport. */}
      <div className="marquee-track flex w-max items-center">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1 ? "true" : undefined}
            className="flex shrink-0 items-center"
          >
            {words.map((word) => (
              <li key={word} className="flex items-center">
                <span className="px-7 font-display text-[1.5rem] leading-none font-semibold tracking-[-0.03em] whitespace-nowrap text-on-accent lg:px-10 lg:text-[2rem]">
                  {word}
                </span>
                {/* A brush dot between entries, in the band's own ink. */}
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full bg-on-accent/45"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
