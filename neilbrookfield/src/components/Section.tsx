import { cn } from '@/lib/cn';

type Tone = 'night' | 'linen';

/**
 * A spread. Sections alternate night and linen so the eye resets between them;
 * the tone sets the accent and secondary colours for everything inside it.
 */
export function Section({
  tone = 'night',
  id,
  className,
  children,
  flush = false,
}: {
  tone?: Tone;
  id?: string;
  className?: string;
  children: React.ReactNode;
  /** Drop the horizontal gutter, for full-bleed photography. */
  flush?: boolean;
}) {
  return (
    <section
      id={id}
      data-tone={tone}
      className={cn('section-y', !flush && 'gutter-x', className)}
    >
      {children}
    </section>
  );
}

/** The wide editorial container. Wide gutters on text, per the brief. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('mx-auto w-full max-w-[100rem]', className)}>{children}</div>;
}
