"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { site } from "@/config/site";
import { testimonials } from "@/data/testimonials";

/** How long each review holds before the next one comes in. */
const DWELL_MS = 7000;

/**
 * Type size, set by the length of the review.
 *
 * Every slide shares one grid cell, so the box is as tall as the LONGEST
 * review and every shorter one leaves the difference as empty space. At one
 * fixed size that difference was about 290px on a phone, because the reviews
 * run from 71 characters to 310 — the longest is more than four times the
 * shortest, and a box built for it swallowed the rest.
 *
 * Scaling the size to the length closes most of that gap and is better
 * typography besides: a twelve-word review deserves to be set large and a
 * fifty-word one does not want to be. It is the oldest trick in editorial
 * layout — fit the type to the space — and it costs nothing at runtime.
 *
 * The thresholds are character counts because that is what actually drives the
 * wrap; word counts vary too much with word length to be useful here.
 *
 * THERE ARE FOUR STEPS BECAUSE THREE STOPPED BEING ENOUGH. The bottom bucket was
 * open-ended, which was fine while the longest review was 310 characters. James
 * Churchill's is 418, and one open-ended bucket then spanned 211 to 418 — a
 * two-to-one range set at one size, so the longest review alone decided the
 * height of the box that all of them sit in. Splitting it at 300 costs one
 * branch and keeps the tallest slide roughly where it already was.
 *
 * The smallest step is 18px on a phone, which is a floor and not a starting
 * point: it is above the 16px the body text uses, and going below it to win back
 * height would be shrinking a customer's words to fit a layout. If a review ever
 * arrives long enough to need that, shorten the quote instead — see
 * src/data/testimonials.ts on excerpting.
 */
function sizeFor(quote: string): string {
  if (quote.length <= 110) {
    return "text-[1.75rem] leading-[1.25] sm:text-[2.125rem] lg:text-[2.5rem]";
  }
  if (quote.length <= 210) {
    return "text-[1.5rem] leading-[1.3] sm:text-[1.75rem] lg:text-[2rem]";
  }
  if (quote.length <= 300) {
    return "text-[1.25rem] leading-[1.4] sm:text-[1.5rem] lg:text-[1.625rem]";
  }
  return "text-[1.125rem] leading-[1.45] sm:text-[1.3125rem] lg:text-[1.4375rem]";
}

/**
 * The review switcher.
 *
 * WHAT IT IS NOT. It is not a carousel of cards. A row of review tiles with
 * arrows either side is the single most common way this goes wrong: it takes a
 * screen and a half, every card is a different length so the row never sits
 * straight, and the whole thing reads as a widget bolted on rather than part of
 * the page. The brief was explicitly that it must not bloat the home page or
 * push reviews in anyone's face, so this is ONE review at a time, in the site's
 * own editorial voice, in a band shorter than every other section on the page.
 *
 * ZERO LAYOUT SHIFT, WITHOUT A MAGIC NUMBER. Every review is in the DOM at
 * once, stacked into a single grid cell, with only the current one visible. The
 * container is therefore naturally as tall as the LONGEST review and never
 * changes height as they cycle — no min-height guessed per breakpoint, and
 * nothing to re-tune when James sends more. The quote block is centred inside
 * it so a twelve-word review does not sit at the top of a box sized for a
 * fifty-word one.
 *
 * It also means every review is in the served HTML, so they are readable by a
 * crawler and by anyone with JavaScript off — who gets the first review,
 * statically, rather than an empty box.
 *
 * A COUNTER AND ONE BAR, NOT A ROW OF TICKS. This used to show one tick per
 * review, each filling over the dwell time. That is a lovely control for eight
 * reviews and a worthless one for twenty-one: the row is a fixed width, so every
 * review added makes each tick thinner, and at twenty-one they are about 5px of
 * hairline 6px apart. Nobody can tell twenty-one of those apart, nobody is
 * aiming a thumb at one, and they stopped reading as a control at all.
 *
 * So the row is now a position-over-total counter and a single bar that fills
 * over the dwell time. The counter says where you are and how many there are,
 * which is what the ticks were really for; the bar keeps the
 * indicator-is-the-timer idea; and the previous/next buttons do the navigating,
 * which is all anyone did with the ticks anyway. None of it cares how long the
 * list gets. It also ends a WCAG 2.2 SC 2.5.8 problem rather than managing it —
 * there is no longer an undersized target to argue an exception for.
 *
 * The count in that counter is NOT the same claim as a count in the header, and
 * the difference matters — see the note in src/data/testimonials.ts. It
 * describes this rail, and anyone can check it by pressing next. A count in the
 * header would assert a total on someone else's page.
 *
 * IT STOPS WHEN IT SHOULD, which is most of the accessibility of the thing:
 *   - on hover and on focus-within, so it cannot move under a reader's eye or
 *     under someone tabbing through it
 *   - when scrolled out of view, so it is not animating to nobody
 *   - when the tab is hidden
 *   - under prefers-reduced-motion, where it does not auto-advance at all
 *   - and on demand, from the pause control. That control is not decoration:
 *     WCAG 2.2 SC 2.2.2 requires a way to pause anything that auto-updates for
 *     longer than five seconds beside other content, and hover/focus pausing
 *     alone does not satisfy it.
 *
 * The live region is `off` while it is rotating and `polite` once it is
 * paused — an auto-advancing region set to polite announces every seven seconds
 * forever, which is worse than announcing nothing.
 */
export function Testimonials() {
  /* Renders nothing until there are real reviews. See src/data/testimonials.ts:
     a missing section reads as a business that has not asked for reviews yet,
     an invented one is a banned practice. */
  const count = testimonials.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // the explicit control
  const [held, setHeld] = useState(false); // hover, focus, off-screen, hidden tab
  const [reduced, setReduced] = useState(false);
  const region = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count],
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /* Off-screen and hidden-tab both count as "nobody is looking", and both are
     cheaper to honour than to explain. */
  useEffect(() => {
    const node = region.current;
    if (!node) return;
    let onScreen = true;
    const update = () => setHeld(!onScreen || document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        update();
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const running = !paused && !held && !reduced && count > 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => go(1), DWELL_MS);
    return () => window.clearInterval(timer);
  }, [running, go]);

  if (count === 0) return null;

  const current = testimonials[index];

  return (
    <section
      className="border-y border-hairline bg-accent-wash py-14 lg:py-16"
      aria-labelledby="reviews-heading"
    >
      <div className="shell">
        <Reveal>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <h2 id="reviews-heading" className="eyebrow text-ink-mute">
              What people say
            </h2>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 eyebrow text-ink-mute transition-colors duration-200 hover:text-accent"
            >
              {/* NO COUNT HERE, deliberately. "11 recommendations on Facebook"
                  asserts a total nobody has counted, from a page that also
                  carries reviews this rail does not show — a claim that is
                  unverifiable and stops being flattering the moment a visitor
                  checks. The link does the work instead: it goes to the page,
                  where all of them are, which is the honest way to publish a
                  selection. See src/data/testimonials.ts. */}
              Read them on Facebook
              <ArrowUpRight weight="bold" aria-hidden="true" className="size-3" />
            </a>
          </div>
          <div className="tape-line mt-3" aria-hidden="true" />
        </Reveal>

        <div
          ref={region}
          role="group"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setHeld(false);
          }}
          className="mt-7 lg:mt-9"
        >
          {/* Every review occupies the same grid cell, so the box is the height
              of the longest and never moves. */}
          <div className="grid" aria-live={running ? "off" : "polite"}>
            {testimonials.map((item, position) => {
              const active = position === index;
              return (
                <figure
                  key={`${item.name}-${item.date}`}
                  aria-hidden={!active}
                  inert={!active}
                  data-active={active}
                  /* justify-end, not center. Every slide shares one cell sized
                     to the LONGEST review, so a short one has slack to spend.
                     Centred, that slack splits and leaves an obvious hole
                     between the attribution and the controls below. Pushed to
                     the bottom, it all lands above the quote, where it reads as
                     air under the rule and the caption stays tight to the
                     controls it belongs with. */
                  className="review-slide col-start-1 row-start-1 flex flex-col justify-end"
                >
                  {/* Capped at 54rem. Unconstrained, a review ran the full
                      shell width — around 100 characters a line on a wide
                      screen, which is roughly double what anyone reads
                      comfortably and made a short review look like a banner. */}
                  <blockquote
                    className={`max-w-[54rem] font-display font-medium tracking-[-0.02em] text-balance text-ink ${sizeFor(item.quote)}`}
                  >
                    <span className="text-accent" aria-hidden="true">
                      “
                    </span>
                    {item.quote}
                    <span className="text-accent" aria-hidden="true">
                      ”
                    </span>
                  </blockquote>
                  <figcaption className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.9375rem]">
                    <span className="font-semibold text-ink">{item.name}</span>
                    <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
                    <span className="text-ink-mute">{item.date}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>

          {count > 1 && (
            <div className="mt-7 flex items-center gap-4">
              {/* Both are hidden from assistive tech: the sr-only live region
                  below already announces the position and the total, and a
                  timer bar has nothing to announce. */}
              <p
                className="eyebrow shrink-0 tabular-nums text-ink-mute"
                aria-hidden="true"
              >
                {index + 1} / {count}
              </p>
              {/* One hairline that fills over the dwell time — the site's own
                  rule language, and still the timer. Keyed on index so the fill
                  restarts from empty on every change, including a manual one. */}
              <div className="review-rail flex-1" data-running={running} aria-hidden="true">
                <span
                  key={index}
                  className="review-rail-fill"
                  style={{ ["--dwell" as string]: `${DWELL_MS}ms` }}
                />
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Control label="Previous review" onClick={() => go(-1)}>
                  <ArrowLeft weight="bold" aria-hidden="true" className="size-4" />
                </Control>
                <Control
                  label={paused ? "Play reviews" : "Pause reviews"}
                  onClick={() => setPaused((value) => !value)}
                >
                  {paused ? (
                    <Play weight="fill" aria-hidden="true" className="size-3.5" />
                  ) : (
                    <Pause weight="fill" aria-hidden="true" className="size-3.5" />
                  )}
                </Control>
                <Control label="Next review" onClick={() => go(1)}>
                  <ArrowRight weight="bold" aria-hidden="true" className="size-4" />
                </Control>
              </div>
            </div>
          )}
        </div>

        {/* Read by nobody who can see the section, and the only way someone on a
            screen reader knows where they are in it — the counter beside the
            bar is the visual equivalent, and is aria-hidden so this is not
            announced twice. */}
        <p className="sr-only" aria-live="polite">
          Review {index + 1} of {count}: {current.name}, {current.date}.
        </p>
      </div>
    </section>
  );
}

function Control({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-9 place-items-center rounded-full border border-ink/15 text-ink-soft transition-colors duration-200 hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}
