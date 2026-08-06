import { hasMapAddress, site } from "@/config/site";

/**
 * Google Maps, the keyless way: the public `maps?q=…&output=embed` iframe. No
 * API key, no billing account, no quota to watch.
 *
 * It is lazy-loaded and its box reserves full height up front, so nothing
 * shifts when the map arrives. The frame around it is ours — a plaster panel
 * with masking-tape corners — so the embed reads as part of the site rather
 * than a window cut into it.
 */
export function MapEmbed({ className = "" }: { className?: string }) {
  const query = encodeURIComponent(site.mapAddress);

  return (
    <div className={`relative ${className}`}>
      <Tape className="-top-3 -left-4 -rotate-[4deg]" />
      <Tape className="-right-4 -bottom-3 rotate-[3deg]" />

      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-plaster ring-1 ring-hairline lg:aspect-[3/2]">
        {hasMapAddress ? (
          <iframe
            title={`Map showing ${site.name} in ${site.town}`}
            src={`https://www.google.com/maps?q=${query}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale-[0.35] contrast-[1.05]"
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
