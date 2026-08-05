import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { socialPosts } from "@/data/social";
import { blurTone } from "@/lib/images";
import { site } from "@/config/site";

const formatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
});

/**
 * "Fresh off the brush" — designed cards from a file the client owns, not an
 * embedded feed wall. No API token to expire and nothing to pay for.
 */
export function SocialFeed() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="social-heading">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Fresh off the brush"
            title={<span id="social-heading">Work in progress, most weeks.</span>}
            align="wide"
            className="max-w-2xl"
          />
          <div className="flex gap-3">
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/20 px-5 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-[border-color,color,background-color] duration-200 hover:border-accent hover:bg-accent-wash hover:text-accent"
            >
              Instagram
              <ArrowUpRight weight="light" className="size-4" />
            </a>
            <a
              href={site.social.facebook}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/20 px-5 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-[border-color,color,background-color] duration-200 hover:border-accent hover:bg-accent-wash hover:text-accent"
            >
              Facebook
              <ArrowUpRight weight="light" className="size-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Edge-to-edge scroll strip on mobile, uneven grid on desktop */}
      <ul className="mt-12 flex snap-x snap-mandatory scroll-pl-[var(--shell-pad)] gap-4 overflow-x-auto px-[var(--shell-pad)] pb-2 lg:mx-auto lg:grid lg:max-w-[var(--spacing-shell)] lg:grid-cols-3 lg:gap-6 lg:overflow-visible">
        {socialPosts.slice(0, 6).map((post, index) => (
          <Reveal
            as="li"
            key={post.image}
            delay={0.04 * index}
            className={`w-[74vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto ${
              index % 3 === 1 ? "lg:mt-12" : ""
            }`}
          >
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer noopener"
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden rounded-[4px] bg-plaster">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 30vw, 74vw"
                  placeholder="blur"
                  blurDataURL={blurTone(post.tone)}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
                <span className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-paper/90 text-accent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <ArrowUpRight weight="light" className="size-4" />
                </span>
              </div>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{post.caption}</p>
              <p className="mt-2 text-[0.8125rem] text-ink-mute">
                {formatter.format(new Date(post.date))} · {post.network === "instagram" ? "Instagram" : "Facebook"}
              </p>
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
