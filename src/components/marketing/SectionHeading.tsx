import { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";

type Align = "left" | "split" | "centre";

/**
 * The section header for the whole marketing site.
 *
 * Every section used to open the same way: centred eyebrow, centred heading,
 * centred subtitle, then a grid. Repeat six times and the page reads as one
 * template filled in six times, which is exactly the complaint.
 *
 * `split` is the default here: the heading holds the left column and the
 * supporting sentence sits in the right, so the eye travels across rather than
 * bouncing down a centre line. `centre` still exists for the one or two places a
 * section genuinely wants to be symmetrical — it should be rare.
 */
export function SectionHeading({
  eyebrow,
  title,
  /** Rendered in the accent colour, immediately after `title`. */
  highlight,
  body,
  align = "split",
  className = "",
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  highlight?: ReactNode;
  body?: ReactNode;
  align?: Align;
  className?: string;
  action?: ReactNode;
}) {
  const heading = (
    <h2 className="heading-lg">
      {typeof title === "string" ? (
        <SplitText text={title} as="span" className="block" />
      ) : (
        title
      )}
      {highlight ? <span className="text-gradient"> {highlight}</span> : null}
    </h2>
  );

  if (align === "centre") {
    return (
      <Reveal className={`mx-auto max-w-2xl text-center ${className}`}>
        {eyebrow && <span className="eyebrow justify-center">{eyebrow}</span>}
        {heading}
        {body && <p className="body-md mt-5">{body}</p>}
        {action && <div className="mt-8 flex justify-center">{action}</div>}
      </Reveal>
    );
  }

  if (align === "left") {
    return (
      <Reveal className={`max-w-2xl ${className}`}>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {heading}
        {body && <p className="body-md mt-5">{body}</p>}
        {action && <div className="mt-8">{action}</div>}
      </Reveal>
    );
  }

  return (
    <Reveal className={`grid gap-6 lg:grid-cols-12 lg:gap-16 ${className}`}>
      <div className="lg:col-span-6">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        {heading}
      </div>
      <div className="flex flex-col justify-end lg:col-span-6 lg:pb-1">
        {body && <p className="body-md max-w-xl">{body}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Reveal>
  );
}
