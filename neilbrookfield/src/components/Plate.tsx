import Image from 'next/image';

import type { ProjectImage } from '@/lib/projects';
import { Reveal } from '@/components/Reveal';
import { cn } from '@/lib/cn';

/**
 * A photograph, set like a plate in a magazine: 1px slate border, no radius, no
 * shadow, caption in small caps beneath.
 *
 * If the photograph has not been supplied yet the frame is drawn empty with a
 * line saying what belongs there. That is deliberate — an empty labelled frame
 * is honest, and stock photography of somebody else's kitchen is not.
 */
export function Plate({
  image,
  sizes,
  priority = false,
  ratio = '4 / 3',
  className,
  animate = true,
}: {
  image: ProjectImage;
  sizes: string;
  priority?: boolean;
  ratio?: string;
  className?: string;
  animate?: boolean;
}) {
  const body = image.src ? (
    <div className="relative w-full overflow-hidden border border-slate" style={{ aspectRatio: ratio }}>
      <Image
        src={image.src}
        alt={image.alt ?? ''}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className="object-cover"
      />
    </div>
  ) : (
    <EmptyFrame need={image.needs ?? 'Photograph to come.'} ratio={ratio} />
  );

  return (
    <figure className={cn('m-0', className)}>
      {animate && image.src ? <Reveal>{body}</Reveal> : body}
      {image.caption ? (
        <figcaption className="eyebrow mt-4 max-w-[48ch]">{image.caption}</figcaption>
      ) : null}
    </figure>
  );
}

/**
 * The labelled empty frame. Used wherever a photograph is expected and none has
 * arrived. See content/needed.ts#photographs.
 */
export function EmptyFrame({
  need,
  ratio = '4 / 3',
  className,
}: {
  need: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      data-needed="photographs"
      className={cn(
        'flex w-full flex-col justify-between gap-6 border border-dashed border-slate p-6 md:p-8',
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <p className="eyebrow">Photograph to come</p>
      <div>
        <hr className="hairline mb-4" />
        <p className="secondary max-w-[44ch] text-sm leading-relaxed">{need}</p>
      </div>
    </div>
  );
}
