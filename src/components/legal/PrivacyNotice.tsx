"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const KEY = "tpm-privacy-ack";

/**
 * The privacy notice.
 *
 * IT IS A NOTICE, NOT A COOKIE BANNER, and that distinction is the whole design.
 * A consent banner with Accept/Reject exists to get permission for tracking. This
 * site does no tracking: no analytics, no advertising tag, no cookie of its own.
 * Putting a fake "manage your cookie preferences" dialogue on it would be
 * theatre — and worse than theatre, because a consent UI that governs nothing
 * trains people to click through the ones that do. So this says what actually
 * happens, in the site's own voice, and gets out of the way.
 *
 * EVERY CLAIM ON IT IS TRUE OF THE CODE. That took two fixes to make good, both
 * shipped alongside this component:
 *   - the live chat used to inject Tawk.to after the visitor's first tap
 *     ANYWHERE on the page, which is not a decision about chat. It now loads on
 *     the chat button and nowhere else. See ChatLauncher.tsx.
 *   - the map used to load Google's iframe on sight, on the HOME page, so every
 *     visitor's IP reached Google unasked. It is a façade now. See MapEmbed.tsx.
 * If either is ever reverted, the wording here becomes a lie, so they are
 * cross-referenced in both directions.
 *
 * WHAT IT STORES, which it also says out loud: one key in localStorage,
 * "tpm-privacy-ack", so it does not ask twice. Not a cookie — it is never sent
 * to the server, and nothing reads it but this component.
 *
 * WHEN IT APPEARS. Not during the splash. On a first visit the splash owns the
 * screen for ~2.4s, and a second panel arriving underneath it would be two
 * things competing before anyone has read a word. It waits for the splash to
 * finish, and on a return view within the session — where the splash is skipped
 * — it comes in after a short beat instead. It never blocks: the page is
 * readable and operable behind it, which is also why it is aria-modal="false"
 * and does not trap focus.
 */
export function PrivacyNotice() {
  const [state, setState] = useState<"hidden" | "shown" | "leaving">("hidden");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let acknowledged = false;
    try {
      acknowledged = localStorage.getItem(KEY) === "1";
    } catch {
      /* Storage can throw outright in private modes and locked-down webviews.
         The honest fallback is to show the notice — showing it twice is a small
         annoyance, never showing it is a compliance gap. */
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
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  });

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* Nothing to do. It will ask again next time, which is the safe failure. */
    }
    /* Animate out, then unmount. Unmounting on click would make the panel
       vanish, which on a notice about trust is exactly the wrong texture. */
    setState("leaving");
    window.setTimeout(() => setState("hidden"), 320);
  }

  if (state === "hidden") return null;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="privacy-notice-title"
      data-leaving={state === "leaving" ? "true" : undefined}
      className="privacy-notice"
    >
      <span className="privacy-notice-rule" aria-hidden="true" />

      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-accent/12 text-accent">
          <ShieldCheck weight="light" aria-hidden="true" className="size-5" />
        </span>

        <div className="min-w-0">
          <p className="eyebrow text-ink-mute">Privacy</p>
          <h2
            id="privacy-notice-title"
            className="mt-1.5 font-display text-[1.25rem] leading-[1.15] font-semibold tracking-[-0.02em] text-ink"
          >
            No cookies, no tracking, no <em className="italic">clever stuff</em>.
          </h2>
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-soft">
            We set no cookies and run no analytics — nothing you do here is followed. The
            map, the videos and the live chat come from other companies, and none of them
            load until you press them.
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-mute">
            Closing this saves one flag in your browser so it does not ask twice.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-semibold text-on-accent transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] active:scale-[0.98]"
            >
              Got it
            </button>
            <Link
              href="/privacy"
              className="text-[0.9375rem] font-medium text-accent underline decoration-accent/35 underline-offset-4 transition-colors hover:decoration-accent"
            >
              Read the full policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
