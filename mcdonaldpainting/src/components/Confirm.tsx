import { neededById } from '@content/needed';

/**
 * An outstanding fact, shown in place.
 *
 * This is the component that lets the site be honest in a meeting. Where a
 * figure is missing, the page carries a visibly marked question instead of a
 * plausible number — so a reader can tell in half a second that they are
 * looking at something nobody has answered yet, not at a claim.
 *
 * It always renders on its own graphite block with a hi-vis rule down the left,
 * whatever ground it is sitting on. Two reasons: it reads as an insert rather
 * than as body copy, and hi-vis on a concrete ground is 1.5:1 and effectively
 * invisible, so the marker brings its own ground with it.
 *
 * When the question is answered, the entry comes out of content/needed.json and
 * every instance of it disappears from the site at once.
 */
export function Confirm({
  id,
  note,
  className = '',
}: {
  /** An id from content/needed.json. */
  id: string;
  /** What is missing here specifically, if the registry question is broader. */
  note?: string;
  className?: string;
}) {
  const needed = neededById(id);

  // The question has been answered and deleted from the registry. The fact it
  // was standing in for is now in content/, so the marker removes itself.
  if (!needed) return null;

  return (
    <div
      data-ground="graphite"
      className={`border-l-[3px] border-hivis px-4 py-3 ${className}`}
    >
      <p className="t-label !text-hivis">Confirm</p>
      <p className="mt-1.5 text-[15px] leading-[1.5] text-bone">
        {note ?? needed.question}
      </p>
    </div>
  );
}

/**
 * The inline form, for a missing value inside a table cell or a caption block
 * where a whole block would break the row.
 */
export function ConfirmInline({ id, label }: { id: string; label?: string }) {
  const needed = neededById(id);
  if (!needed) return null;

  return (
    <span className="inline-flex items-baseline gap-2 border-l-[3px] border-hivis bg-graphite px-2 py-0.5">
      <span className="t-label !text-hivis">Confirm</span>
      {label ? <span className="text-[13px] text-bone">{label}</span> : null}
    </span>
  );
}
