import { neededById } from '@content/needed';
import { SHOW_PLACEHOLDERS } from '@content/site';
import { cn } from '@/lib/cn';

/**
 * A labelled empty frame.
 *
 * Where a fact or a photograph is missing, the site says so plainly rather than
 * filling the space with something invented or with stock. The top line is what
 * a reader would see; the line under the hairline is the question that needs
 * asking, so the site doubles as the snagging list while it is being reviewed.
 *
 * `npm run check:launch` fails while any of these are still on the page.
 */
export function Needed({
  id,
  label,
  className,
  minHeight = '10rem',
}: {
  /** An id from content/needed.ts. */
  id: string;
  /** The dignified version, for the reader. */
  label: string;
  className?: string;
  minHeight?: string;
}) {
  // Published state: close the gap up rather than showing an empty box.
  if (!SHOW_PLACEHOLDERS) return null;

  const item = neededById(id);

  if (!item) {
    throw new Error(
      `<Needed id="${id}"> does not match anything in content/needed.ts. ` +
        `Add the question there first so it reaches CONTENT-NEEDED.md.`,
    );
  }

  return (
    <div
      data-needed={id}
      className={cn(
        'flex flex-col justify-between gap-6 border border-dashed border-slate p-6 md:p-8',
        className,
      )}
      style={{ minHeight }}
    >
      <p className="eyebrow">{label}</p>
      <div>
        <hr className="hairline mb-4" />
        <p className="secondary max-w-[52ch] text-sm leading-relaxed">{item.question}</p>
        <p className="eyebrow eyebrow-muted mt-3">CONTENT-NEEDED.md · {item.id}</p>
      </div>
    </div>
  );
}
