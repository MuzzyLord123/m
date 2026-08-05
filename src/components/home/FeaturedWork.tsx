import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { featuredProjects } from "@/data/projects";
import { blurTone } from "@/lib/images";

/** Mixed aspect ratios and staggered baselines — magazine, not gallery grid. */
const OFFSETS = ["lg:mt-0", "lg:mt-16", "lg:mt-6", "lg:mt-24", "lg:mt-10"];

export function FeaturedWork() {
  const shown = featuredProjects.slice(0, 5);

  return (
    <section className="shell py-20 lg:py-28" aria-labelledby="work-heading">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Recent work"
          title={<span id="work-heading">Jobs finished this year.</span>}
          align="wide"
          className="max-w-2xl"
        />
        <Link
          href="/work"
          className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-accent"
        >
          All projects
          <ArrowRight
            weight="light"
            className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
          />
        </Link>
      </div>

      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((project, index) => {
          const image = project.images[0];
          return (
            <Reveal
              as="li"
              key={project.slug}
              delay={0.05 * index}
              className={`${OFFSETS[index] ?? "lg:mt-0"} ${index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}`}
            >
              <Link href={`/work#${project.slug}`} className="group block">
                <div className="relative overflow-hidden rounded-[4px] bg-plaster">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={1200}
                    height={image.ratio === "16:9" ? 675 : image.ratio === "1:1" ? 1200 : 1500}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                    placeholder="blur"
                    blurDataURL={blurTone(image.tone)}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-4 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[1.1875rem] leading-snug font-semibold tracking-[-0.02em] text-ink">
                    {project.title}
                  </h3>
                  <span className="shrink-0 text-[0.8125rem] text-ink-mute">{project.area}</span>
                </div>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
                  {project.scope}
                </p>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
