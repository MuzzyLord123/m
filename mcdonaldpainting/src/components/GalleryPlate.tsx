import Image from 'next/image';

import { Compare } from '@/components/Compare';
import { RATIO_CLASS, SPAN_CLASS, type ResolvedPlate } from '@/lib/gallery';

/**
 * One plate.
 *
 * A number, a photograph cropped to a declared shape, and a caption in label
 * type — the way plates are numbered and captioned in a report, rather than a
 * card with a shadow and a "View project" button.
 *
 * The number is the device that makes a long page of photographs feel ordered
 * rather than endless. It is also how somebody refers to one on the phone:
 * "plate eleven, the one with the gutter".
 */
export function GalleryPlate({
  item,
  index,
}: {
  item: ResolvedPlate;
  index: number;
}) {
  const { plate, number, sectorEntry, images, complete } = item;
  const ratioClass = RATIO_CLASS[plate.ratio] ?? 'aspect-[4/3]';
  const spanClass = SPAN_CLASS[plate.span] ?? 'md:col-span-12';

  // Wide plates get a wide sizes hint; narrow ones must not download a 2560px
  // file to sit in a third of the page.
  const sizes =
    plate.span >= 12
      ? '(min-width: 768px) 100vw, 100vw'
      : plate.span === 8
        ? '(min-width: 1024px) 66vw, (min-width: 768px) 100vw, 100vw'
        : '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';

  return (
    <figure className={`col-span-12 ${spanClass}`} data-reveal>
      {complete ? (
        plate.kind === 'comparison' ? (
          <Compare
            before={plate.before}
            after={plate.after}
            ratioClass={ratioClass}
            sizes={sizes}
            priority={index === 0}
          />
        ) : (
          <div className={`relative w-full overflow-hidden bg-steel ${ratioClass}`}>
            <Image
              src={plate.src}
              alt={plate.alt}
              fill
              sizes={sizes}
              priority={index === 0}
              className="reveal-plate object-cover"
            />
          </div>
        )
      ) : (
        <EmptyPlate item={item} ratioClass={ratioClass} />
      )}

      <figcaption className="mt-4 border-t border-line pt-3">
        <div className="flex items-baseline justify-between gap-4">
          <p className="t-label">
            Plate {number}
            {plate.kind === 'comparison' ? ' · Before and after' : ''}
          </p>
          <p className="t-label shrink-0">{sectorEntry.label}</p>
        </div>
        <p className="mt-2 text-[15px] leading-[1.5] text-bone">{plate.caption}</p>
        {plate.detail ? (
          <p className="mt-2 max-w-[54ch] text-[14px] leading-[1.55] text-concrete">
            {plate.detail}
          </p>
        ) : null}
        {plate.credit ? <p className="t-label mt-2">Photograph {plate.credit}</p> : null}
      </figcaption>
    </figure>
  );
}

/**
 * A plate whose photograph has not been uploaded yet.
 *
 * It states which file it is waiting for, because the person reading this page
 * during the build is the person who has the file. A broken image icon tells
 * them nothing; a filename tells them exactly what to drag where.
 */
function EmptyPlate({ item, ratioClass }: { item: ResolvedPlate; ratioClass: string }) {
  const missing = item.images.filter((image) => !image.present);

  return (
    <div
      className={`flex w-full flex-col justify-end border border-line border-t-[3px] border-t-hivis bg-steel p-5 ${ratioClass}`}
    >
      <p className="t-label !text-hivis">
        {missing.length > 1 ? `${missing.length} photographs to come` : 'Photograph to come'}
      </p>
      <ul className="mt-3 space-y-1.5">
        {missing.map((image) => (
          <li key={image.src} className="text-[13px] leading-[1.5] text-concrete">
            <code className="font-display font-bold text-bone">
              {image.src.split('/').pop()}
            </code>
            <span className="block">{image.alt}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
