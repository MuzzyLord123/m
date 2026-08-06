import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ArticleStructuredData } from "@/components/seo/StructuredData";
import { formatPostDate, getNeighbours, getPost, posts } from "@/lib/blog";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      /* siteName and locale have to be restated. Setting `openGraph` on a page
         REPLACES the parent object rather than merging into it, so without
         these a shared blog post loses the business name and the en_GB locale
         that every other page carries. */
      siteName: site.name,
      locale: "en_GB",
      url: `${site.url}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      // Dimensions let a preview reserve the right box instead of reflowing.
      images: [{ url: post.image, width: 1600, height: 1200, alt: post.title }],
    },
  };
}

export default async function BlogPost({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { previous, next } = getNeighbours(slug);
  const { Content } = post;

  return (
    <article className="pt-[7.5rem] pb-24 lg:pt-[10rem] lg:pb-32">
      <ArticleStructuredData
        title={post.title}
        description={post.description}
        slug={post.slug}
        date={post.date}
        image={post.image}
      />
      <div className="shell">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 text-[0.875rem] font-medium text-ink-soft transition-colors duration-200 hover:text-accent"
        >
          <ArrowLeft
            weight="light"
            className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-x-1"
          />
          All advice
        </Link>

        <header className="mt-8 max-w-3xl">
          <div className="flex flex-wrap items-center gap-3 text-[0.8125rem]">
            <span className="rounded-full bg-accent-wash px-3 py-1 font-medium text-accent-ink">
              {post.category}
            </span>
            <time dateTime={post.date} className="text-ink-mute">
              {formatPostDate(post.date)}
            </time>
            <span className="text-ink-mute">{post.minutes} min read</span>
          </div>

          <h1 className="mt-6 font-display text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[2.875rem]">
            {post.title}
          </h1>
          <p className="measure mt-5 text-[1.125rem] leading-relaxed text-ink-soft">
            {post.description}
          </p>
        </header>

        <div className="relative mt-12 aspect-[3/2] w-full overflow-hidden rounded-[4px] bg-plaster lg:aspect-[21/9]">
          <Image
            src={post.image}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 88rem, 100vw"
            placeholder="blur"
            blurDataURL={blurTone(post.tone)}
            className="object-cover"
          />
        </div>

        {/* The measure is set on every element in mdx-components */}
        <div className="mt-14">
          <Content />
        </div>

        {/* One CTA at the foot, in the site's only contact-intent wording */}
        <aside className="measure mt-16 rounded-[4px] bg-plaster p-7 sm:p-9">
          <h2 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
            Want a price for your own house?
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
            Four questions and two minutes. A written, itemised price follows within 48 hours,
            anywhere across {site.serviceArea}.
          </p>
          <Link
            href={CTA_HREF}
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-semibold whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 hover:bg-accent-bright active:translate-y-px active:scale-[0.98]"
          >
            {CTA_LABEL}
          </Link>
        </aside>

        {(previous || next) && (
          <nav
            aria-label="More advice"
            className="mt-16 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-2"
          >
            {previous ? (
              <Link href={`/blog/${previous.slug}`} className="group">
                <span className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">
                  Previous
                </span>
                <span className="mt-2 flex items-start gap-2 font-display text-[1.125rem] leading-snug font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 group-hover:text-accent">
                  <ArrowLeft weight="light" className="mt-1 size-4 shrink-0" />
                  {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/blog/${next.slug}`} className="group sm:text-right">
                <span className="text-[0.75rem] tracking-[0.12em] text-ink-mute uppercase">
                  Next
                </span>
                <span className="mt-2 flex items-start gap-2 font-display text-[1.125rem] leading-snug font-semibold tracking-[-0.02em] text-ink transition-colors duration-200 group-hover:text-accent sm:justify-end">
                  {next.title}
                  <ArrowRight weight="light" className="mt-1 size-4 shrink-0" />
                </span>
              </Link>
            )}
          </nav>
        )}
      </div>
    </article>
  );
}
