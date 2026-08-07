import { services } from "@/data/services";

/**
 * A full-bleed band of brand orange carrying the six trades, drifting sideways.
 *
 * WHY IT MOVES WITH THE SCROLL RATHER THAN ON A TIMER.
 * The usual marquee runs on its own clock: it is moving before you arrive, it
 * is still moving after you leave, and it says nothing about where you are.
 * This one is on a scroll timeline — the band tracks the reader's own hand,
 * accelerating when they flick and settling when they stop. It reads as part
 * of the page rather than as an ornament bolted onto it, and it costs nothing:
 * no JavaScript, no scroll listener, composited off the main thread.
 *
 * Where scroll timelines are unsupported (Safari at the time of writing) it
 * falls back to a slow continuous drift, which is the ordinary marquee — worse,
 * but never broken. Under prefers-reduced-motion it simply holds still, and the
 * words are all still on screen because the strip starts at its natural offset.
 *
 * The list is duplicated once and the pair translated by exactly -50%, which is
 * what makes the loop seamless. The duplicate is aria-hidden: a screen reader
 * should hear the six trades once.
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
