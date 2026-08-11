"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Live chat on Tawk.to's free plan, wearing our clothes.
 *
 * Tawk's own bubble is hidden through its JS API and this button opens the
 * chat instead, so the only thing a visitor sees before they engage is a paint
 * blob in the brand colour.
 *
 * The script is not on the page at load, and it is not warmed up in the
 * background either. It is injected when someone presses this button and at no
 * other moment — so live chat contributes nothing to LCP, and a visitor who
 * never wants to chat never meets Tawk.to at all.
 *
 * Note: on the free plan the chat *window* carries a small "powered by
 * tawk.to" line. That is the trade for a chat that costs nothing to run. The
 * launcher, which is what people see 99% of the time, is entirely ours.
 */

declare global {
  interface Window {
    Tawk_API?: {
      maximize?: () => void;
      hideWidget?: () => void;
      onLoad?: () => void;
      onChatMinimized?: () => void;
      onChatHidden?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

type Status = "idle" | "loading" | "ready";

export function ChatLauncher() {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID;
  const [status, setStatus] = useState<Status>("idle");
  const wantsOpen = useRef(false);

  const load = useCallback(() => {
    if (!propertyId || !widgetId || window.Tawk_API) return;

    setStatus("loading");
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Hide Tawk's bubble the moment it is able to listen, and again whenever
    // the visitor closes the window, so it never appears alongside ours.
    window.Tawk_API.onLoad = () => {
      window.Tawk_API?.hideWidget?.();
      setStatus("ready");
      if (wantsOpen.current) {
        wantsOpen.current = false;
        window.Tawk_API?.maximize?.();
      }
    };
    window.Tawk_API.onChatMinimized = () => window.Tawk_API?.hideWidget?.();
    window.Tawk_API.onChatHidden = () => window.Tawk_API?.hideWidget?.();

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);
  }, [propertyId, widgetId]);

  /* THE SCRIPT LOADS ON THE BUTTON, AND ONLY ON THE BUTTON.
     There used to be a warm-up here: a one-shot pointerdown/keydown/touchstart
     listener that injected Tawk during idle time after the visitor's FIRST
     interaction anywhere on the page. It was a performance idea and it was a
     privacy bug, because the first interaction is a tap on a photograph or the
     menu — not a decision about live chat. In practice it loaded Tawk for
     essentially every visitor, which hands a third party the visitor's IP and
     lets it set its own storage before anyone has asked for chat.

     It also made the privacy page untrue. That page says, in the client's name,
     "It loads only when you choose to open it — the script is not on the page
     until then." That is now what the code does.

     The cost is real and small: the first open waits for the script instead of
     finding it already there, which the button covers with its loading label.
     A second or two on a deliberate action is a fair trade for not loading a
     third-party script into the page of someone who never wanted it. */

  // With no Tawk credentials configured, nothing renders and nothing loads.
  if (!propertyId || !widgetId) return null;

  function open() {
    if (window.Tawk_API?.maximize) {
      window.Tawk_API.maximize();
      return;
    }
    wantsOpen.current = true;
    load();
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label={status === "loading" ? "Opening live chat" : "Open live chat"}
      className="fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[85] grid size-14 place-items-center rounded-full text-on-accent transition-transform duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.06] hover:-rotate-6 active:scale-95 lg:right-6 lg:bottom-6 lg:size-16"
    >
      {/* The blob is the button — paint does not land in perfect rounds */}
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full drop-shadow-[0_10px_26px_rgb(29_79_216/0.45)]" aria-hidden="true">
        <path
          d="M32 2c9.6 0 18.5 4.4 24 12.6 5.2 7.8 5.9 18.4 1.8 27C53.6 50.2 44.6 56.6 34.6 58c-9.6 1.4-20.2-2-26.4-9.2C2.4 41.9.6 30.6 3.7 21.4 6.8 12.2 15.3 5.4 22.8 3.4A38 38 0 0 1 32 2Z"
          fill="var(--color-accent-bright)"
        />
      </svg>

      {/* A brush leaving a mark, drawn in the icon system's weight */}
      <svg
        viewBox="0 0 24 24"
        className="relative size-6 lg:size-7"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16H10l-4.2 3.2a.6.6 0 0 1-1-.5V16a2.5 2.5 0 0 1-.3-1.2v-8.3Z"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M8.5 8.75h7M8.5 11.75h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {status === "loading" && (
        <span className="sr-only" role="status">
          Connecting you to the chat
        </span>
      )}
    </button>
  );
}
