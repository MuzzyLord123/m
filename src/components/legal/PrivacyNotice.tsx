"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CaretDown, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { POLICY_UPDATED, policySections, policySummary } from "@/data/privacy";
import { site } from "@/config/site";

const KEY = "tpm-privacy-ack";

/**
 * The privacy notice.
 *
 * IT IS A NOTICE, NOT A COOKIE BANNER, and that distinction is the whole design.
 * A consent dialogue exists to get permission for tracking. This site does none:
 * no analytics, no advertising tag, no cookie of its own. A fake "manage your
 * preferences" panel governing nothing is worse than none at all, because it
 * trains people to click through the ones that matter. So it says what actually
 * happens and gets out of the way.
 *
 * THE WHOLE POLICY IS INSIDE IT. "Read the full policy" used to be a link and
 * nothing else, which broke the moment it mattered: on the shared preview,
 * /privacy was gated like every other page, so the one link on a privacy notice
 * led to "this page has not been built yet". Two fixes, both kept — /privacy is
 * no longer gated (see BUILT_PAGES), AND the policy expands in place, so it is
 * readable without a navigation at all. The text comes from src/data/privacy.ts,
 * the same array the /privacy page renders, so the two cannot drift.
 *
 * IT SITS ON THE BOTTOM EDGE. It was a floating card with a margin all round,
 * and the gap under it — between the card and the action bar — read as a
 * mistake rather than as spacing. Flush to the bottom, full width, with only
 * the top corners rounded, it reads as part of the frame instead of something
 * dropped on top of it. Its own padding clears the action bar and the safe area,
 * so the two never collide.
 *
 * WHAT IT STORES, which it also says out loud: one key in localStorage,
 * "tpm-privacy-ack", so it does not ask twice. Not a cookie — never sent to the
 * server, and nothing reads it but this component.
 *
 * WHEN IT APPEARS. Not during the splash: on a first visit the splash owns the
 * screen for ~2.4s, and a second panel arriving underneath would be two things
 * competing before anyone has read a word. It never blocks — the page stays
 * readable and operable behind it, which is why it is aria-modal="false" and
 * does not trap focus.
 */
export function PrivacyNotice() {
  const [state, setState] = useState<"hidden" | "shown" | "leaving">("hidden");
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let acknowledged = false;
    try {
      acknowledged = localStorage.getItem(KEY) === "1";
    } catch {
      /* Storage throws outright in some private modes and locked-down webviews.
         The honest fallback is to show it — showing it twice is an annoyance,
         never showing it is a compliance gap. */
    }
    if (acknowledged) return;

    /* The splash sets data-splash="seen" before first paint on a repeat view,
       so its absence means the splash is about to play its full ~2.4s. */
    const splashRunning = document.documentElement.dataset.splash !== "seen";
    const timer = window.setTimeout(() => setState("shown"), splashRunning ? 2900 : 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (state !== "shown") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      /* Escape closes the policy first and the notice second. Collapsing what
         you just opened is the expected step back; dismissing the whole thing
         from under someone mid-read is not. */
      if (expanded) setExpanded(false);
      else dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* It will ask again next time, which is the safe direction to fail in. */
    }
    setState("leaving");
    window.setTimeout(() => setState("hidden"), 300);
  }

  if (state === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="privacy-notice-title"
      data-leaving={state === "leaving" ? "true" : undefined}
      data-expanded={expanded ? "true" : undefined}
      className="privacy-notice"
    >
      <span className="privacy-notice-rule" aria-hidden="true" />

      <div className="privacy-notice-inner">
        <div className="flex items-start gap-3">
          <span className="mt-px grid size-8 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
            <ShieldCheck weight="light" aria-hidden="true" className="size-[1.1rem]" />
          </span>

          <div className="min-w-0 flex-1">
            <h2
              id="privacy-notice-title"
              className="font-display text-[1.0625rem] leading-tight font-semibold tracking-[-0.02em] text-ink"
            >
              No cookies, no tracking, no <em className="italic">clever stuff</em>.
            </h2>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-ink-soft">
              {policySummary}
            </p>

            {/* The actions sit on one row with the text on a wide screen and
                wrap under it on a phone, so the sheet stays two or three lines
                tall either way. */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex h-10 items-center justify-center rounded-full bg-accent px-5 text-[0.875rem] font-semibold text-on-accent transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Got it
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpanded((v) => !v);
                  if (!expanded) {
                    window.setTimeout(() => bodyRef.current?.focus(), 60);
                  }
                }}
                aria-expanded={expanded}
                aria-controls="privacy-notice-policy"
                className="inline-flex items-center gap-1.5 text-[0.875rem] font-medium text-accent underline decoration-accent/35 underline-offset-4 transition-colors hover:decoration-accent"
              >
                {expanded ? "Hide the policy" : "Read the policy"}
                <CaretDown
                  weight="bold"
                  aria-hidden="true"
                  className={`size-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* The policy itself. Scrollable rather than pushing the sheet up past
            the top of the screen, and only in the DOM when it is open so it
            never lands in the tab order behind a collapsed panel. */}
        {expanded && (
          <div
            id="privacy-notice-policy"
            ref={bodyRef}
            tabIndex={-1}
            className="privacy-notice-policy mt-4 border-t border-hairline pt-4 outline-none"
          >
            <p className="text-[0.75rem] text-ink-mute">
              Last updated {POLICY_UPDATED} · {site.legalName}
            </p>
            <div className="mt-3 grid gap-4">
              {policySections.map((section) => (
                <section key={section.heading}>
                  <h3 className="font-display text-[0.9375rem] leading-tight font-semibold text-ink">
                    {section.heading}
                  </h3>
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-1.5 text-[0.8125rem] leading-relaxed text-ink-soft"
                    >
                      {paragraph}
                    </p>
                  ))}
                </section>
              ))}
            </div>
            <p className="mt-4 text-[0.8125rem] text-ink-mute">
              There is a full-page version at{" "}
              <Link
                href="/privacy"
                className="text-accent underline decoration-accent/35 underline-offset-4"
              >
                /privacy
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
