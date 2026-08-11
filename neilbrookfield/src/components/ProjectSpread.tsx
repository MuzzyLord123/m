import Link from 'next/link';

import { Plate } from '@/components/Plate';
import { TYPE_LABELS, type Project, heroImage } from '@/lib/projects';
import { cn } from '@/lib/cn';

/**
 * The magazine spread: photograph seven columns, text four, alternating sides,
 * baselines offset so the rows never line up into a grid of cards.
 *
 * Hover does one thing — the photograph scales to 1.02 over 600ms. Nothing else
 * moves, nothing changes colour, nothing slides in.
 */
export function ProjectSpread({
  project,
  reversed = false,
  priority = false,
}: {
  project: Project;
  reversed?: boolean;
  priority?: boolean;
}) {
  const image = heroImage(project);
  const href = `/work/${project.slug}`;

  return (
    <article className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
      <Link
        href={href}
        aria-hidden
        tabIndex={-1}
        className={cn(
          'group block lg:col-span-7',
          reversed ? 'lg:order-2 lg:col-start-6' : 'lg:col-start-1',
        )}
      >
        <div className="overflow-hidden">
          <div className="transition-transform duration-[600ms] ease-[cubic-bezier(0.16,0.84,0.28,1)] group-hover:scale-[1.02]">
            {image ? (
              <Plate
                image={image}
                ratio="4 / 3"
                priority={priority}
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            ) : null}
          </div>
        </div>
      </Link>

      <div
        className={cn(
          'flex flex-col justify-center lg:col-span-4',
          reversed ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-9',
          // Offset baseline: the text sits low against the photograph.
          reversed ? 'lg:pb-16' : 'lg:pt-16',
        )}
      >
        <hr className="hairline mb-4 max-w-24" />
        <p className="eyebrow">
          {TYPE_LABELS[project.type]}
          {project.location ? ` · ${project.location}` : ''}
          {project.year ? ` · ${project.year}` : ''}
        </p>

        <h3 className="mt-4 text-[clamp(1.75rem,3.2vw,2.5rem)]">
          <Link href={href} className="hover:text-brass">
            {project.title}
          </Link>
        </h3>

        <p className="secondary mt-4 max-w-[42ch] text-base leading-relaxed">{project.brief}</p>

        <Link href={href} className="eyebrow link-rule mt-8 self-start">
          See the job
        </Link>
      </div>
    </article>
  );
}
