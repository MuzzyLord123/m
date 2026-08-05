import { site } from "@/config/site";

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
        <iframe
          title={`Map showing ${site.name} in ${site.town}`}
          src={`https://www.google.com/maps?q=${query}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0 grayscale-[0.35] contrast-[1.05]"
        />
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
