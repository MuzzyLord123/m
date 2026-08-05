import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { formatPostDate, posts } from "@/lib/blog";
import { blurTone } from "@/lib/images";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Advice",
  description: `Straight answers on decorating costs, colour and materials from a working painter and decorator in ${site.town}.`,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const [lead, ...rest] = posts;

  return (
    <section className="pt-[7.5rem] pb-24 lg:pt-[11rem] lg:pb-32">
      <div className="shell">
        <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
          Advice
        </p>
        <h1 className="mt-5 max-w-3xl font-display text-[2.75rem] leading-[1.02] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.5rem]">
          What we would tell you on the{" "}
          <em className="inline-block pb-[0.06em] leading-[1.1] italic">doorstep</em>.
        </h1>
        <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
          Prices, colours and materials, written the way we would explain them at a quote.
          Nothing here is trying to sell you anything.
        </p>

        {/* Lead article runs wide with its photograph beside it */}
        {lead && (
          <Reveal className="mt-16">
            <Link href={`/blog/${lead.slug}`} className="group grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
              <div className="relative aspect-[3/2] overflow-hidden rounded-[4px] bg-plaster">
                <Image
                  src={lead.image}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  placeholder="blur"
                  blurDataURL={blurTone(lead.tone)}
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3 text-[0.8125rem]">
                  <span className="rounded-full bg-accent-wash px-3 py-1 font-medium text-accent-ink">
                    {lead.category}
                  </span>
                  <span className="text-ink-mute">{formatPostDate(lead.date)}</span>
                  <span className="text-ink-mute">{lead.minutes} min read</span>
                </div>
                <h2 className="mt-5 font-display text-[1.875rem] leading-tight font-semibold tracking-[-0.03em] text-balance text-ink sm:text-[2.25rem]">
                  {lead.title}
                </h2>
                <p className="measure mt-4 text-[1.0625rem] leading-relaxed text-ink-soft">
                  {lead.description}
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-[0.9375rem] font-medium text-accent">
                  Read it
                  <ArrowRight
                    weight="light"
                    className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                  />
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <hr className="tape-line mt-16 mb-12" />

        <ul className="grid gap-10 sm:grid-cols-2 lg:gap-12">
          {rest.map((post, index) => (
            <Reveal as="li" key={post.slug} delay={index * 0.07} className={index % 2 === 1 ? "lg:mt-14" : ""}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] bg-plaster">
                  <Image
                    src={post.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 45vw, 100vw"
                    placeholder="blur"
                    blurDataURL={blurTone(post.tone)}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.8125rem]">
                  <span className="rounded-full bg-accent-wash px-3 py-1 font-medium text-accent-ink">
                    {post.category}
                  </span>
                  <span className="text-ink-mute">{formatPostDate(post.date)}</span>
                  <span className="text-ink-mute">{post.minutes} min read</span>
                </div>
                <h2 className="mt-4 font-display text-[1.375rem] leading-snug font-semibold tracking-[-0.025em] text-ink">
                  {post.title}
                </h2>
                <p className="measure mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {post.description}
                </p>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
