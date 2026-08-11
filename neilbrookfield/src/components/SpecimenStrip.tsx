import type { Colour } from '@/lib/projects';

/**
 * The specimen strip: the actual colours used, as unrounded squares with the
 * paint name beneath in small caps.
 *
 * Only colours Neil has confirmed appear here. In front of an audience that
 * knows its paint ranges, a wrong name is worse than no name — so an unknown
 * colour is left out of the file entirely rather than approximated.
 */
export function SpecimenStrip({ colours }: { colours: Colour[] }) {
  if (!colours.length) return null;

  return (
    <div>
      <hr className="hairline mb-6 max-w-24" />
      <p className="eyebrow">Colours used</p>

      <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-8">
        {colours.map((colour) => (
          <li key={`${colour.name}-${colour.hex}`} className="max-w-[16ch]">
            <div
              className="size-16 border border-slate md:size-20"
              style={{ backgroundColor: colour.hex }}
              // The name and product beneath carry the meaning; the square is
              // decorative, so it is not announced twice.
              aria-hidden
            />
            <p className="eyebrow mt-3 text-[color:var(--tone-fg)]">{colour.name}</p>
            {colour.product ? <p className="eyebrow eyebrow-muted mt-1">{colour.product}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
