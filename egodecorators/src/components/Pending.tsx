import { neededById } from '@content/needed';
import { cn } from '@/lib/cn';

/**
 * A labelled gap.
 *
 * Where a fact or a photograph is missing, the site says which one and why,
 * rather than filling the space with something invented. That is not a
 * compromise, it is the whole argument of this rebuild: the site being replaced
 * has had Latin placeholder text, five of its theme's dummy client logos and a
 * stranger's stock photography sitting on its home page since 2022, because
 * somebody needed to fill a space and filled it.
 *
 * `npm run check:launch` fails while any of these are still on the page.
 */
export function Pending({
  id,
  label,
  className,
  minHeight = '9rem',
}: {
  /** An id from content/needed.json. */
  id: string;
  /** The version a reader sees. */
  label: string;
  className?: string;
  minHeight?: string;
}) {
  const item = neededById(id);

  if (!item) {
    throw new Error(
      `<Pending id="${id}"> does not match anything in content/needed.json. ` +
        `Add the question there first, so it reaches CONTENT-NEEDED.md and the ` +
        `launch gate knows about it.`,
    );
  }

  return (
    <div data-pending={id} className={cn('pending', className)} style={{ minHeight }}>
      <p className="meta">{label}</p>
      <div>
        <hr className="hair mb-3" />
        <p className="max-w-[52ch] text-[15px] leading-[1.5]">{item.question}</p>
        <p className="meta mt-3">CONTENT-NEEDED.md · {item.id}</p>
      </div>
    </div>
  );
}
