"use client";

import { useState } from "react";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { hasMapAddress, site } from "@/config/site";

/**
 * Google Maps, the keyless way: the public `maps?q=…&output=embed` iframe. No
 * API key, no billing account, no quota to watch.
 *
 * IT IS A FAÇADE, and that is a privacy decision rather than a performance one.
 * This map sits on the HOME page (ServiceArea), so when the iframe loaded on
 * sight it meant every single visitor's IP address went to Google, and Google's
 * storage was set in their browser, before they had asked for anything and
 * without any lawful basis to point at. loading="lazy" did not help: it defers
 * the request until the box is near the viewport, and the box is near the
 * viewport on the way down every home page visit.
 *
 * It also sat oddly next to the rest of the site. The video player is
 * click-to-load, the live chat is click-to-load — the map was the one embed
 * quietly contacting a third party on arrival, which is precisely the claim the
 * privacy page makes that the site should not be breaking.
 *
 * Nothing is fetched from Google until someone presses the button. The frame,
 * the towns and the address are ours and render server-side, so what a visitor
 * who never presses it sees is a complete panel, not a placeholder.
 */
export function MapEmbed({ className = "" }: { className?: string }) {
  const query = encodeURIComponent(site.mapAddress);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Tape className="-top-3 -left-4 -rotate-[4deg]" />
      <Tape className="-right-4 -bottom-3 rotate-[3deg]" />

      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-plaster-deep ring-1 ring-hairline lg:aspect-[3/2]">
        {hasMapAddress && !loaded ? (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
          >
            <span className="grid size-14 place-items-center rounded-full bg-accent text-on-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-active:scale-95">
              <MapPin weight="fill" aria-hidden="true" className="size-6" />
            </span>
            <span className="font-display text-[1.125rem] font-semibold text-ink">
              Show the map
            </span>
            <span className="max-w-[26rem] text-[0.9375rem] leading-relaxed text-ink-mute">
              {site.serviceArea}. The map is loaded from Google, so it is only
              fetched once you ask for it.
            </span>
          </button>
        ) : hasMapAddress ? (
          <iframe
            title={`Map showing ${site.name} in ${site.town}`}
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            /* No loading="lazy" — it only exists once someone has asked for it,
               so deferring it again would just delay what they pressed for. */
            referrerPolicy="no-referrer"
            /* Google's keyless embed has no dark theme and no styling API, so the
               only way to stop a blazing white rectangle sitting in the middle
               of a near-black page is to filter it. Inverting and rotating the
               hue by 180deg is the standard trick: land and water invert to
               dark, but the hue rotation puts the greens and blues back the
               right way round, so it still reads as a map rather than a
               negative. Saturation is pulled back so it does not fight the
               orange. */
            className="absolute inset-0 h-full w-full border-0 [filter:invert(0.92)_hue-rotate(180deg)_saturate(0.7)_contrast(0.9)_brightness(1.05)]"
          />
        ) : (
          /* Google renders a grey error tile for an address it cannot resolve,
             which is what an unfilled {{MAP_ADDRESS}} produces — worse than no
             map at all, and it would ship the day the site went live. The
             towns covered are the useful half of what the map was there to
             say, so the panel keeps its place in the composition and says it
             in words until the address is set. */
          <ul className="absolute inset-0 flex flex-wrap content-center items-center justify-center gap-x-3 gap-y-2 p-8 text-center">
            {site.towns
              .filter((town) => !/\{\{/.test(town))
              .map((town) => (
                <li
                  key={town}
                  className="rounded-full bg-paper px-4 py-2 text-[0.9375rem] text-ink-soft ring-1 ring-hairline"
                >
                  {town}
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A strip of masking tape holding the panel to the page. */
function Tape({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute z-10 h-7 w-24 bg-plaster-deep/80 shadow-[0_1px_2px_rgb(60_60_50/0.12)] ${className}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0, #000 4px, #000 calc(100% - 4px), transparent 100%)",
      }}
    />
  );
}
