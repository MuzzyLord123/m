import Image from "next/image";
import { blurTone } from "@/lib/images";

/** A line worth stopping on, set large with a painted rule beside it. */
export function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-10 border-l-2 border-accent pl-6 font-display text-[1.375rem] leading-[1.3] font-medium tracking-[-0.02em] text-balance text-ink sm:text-[1.625rem]">
      {children}
    </blockquote>
  );
}

/** Image with a caption. Dimensions declared, so nothing reflows. */
export function Figure({
  src,
  alt,
  caption,
  tone = "#d9d6cd",
  ratio = "3/2",
}: {
  src: string;
  alt: string;
  caption?: string;
  tone?: string;
  ratio?: string;
}) {
  return (
    <figure className="my-10">
      <div
        className="relative w-full overflow-hidden rounded-[4px] bg-plaster"
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 45rem, 100vw"
          placeholder="blur"
          blurDataURL={blurTone(tone)}
          className="object-cover"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 text-[0.875rem] leading-relaxed text-ink-mute">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
