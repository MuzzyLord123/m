import Link from 'next/link';
import { cn } from '@/lib/cn';

/**
 * The only link style on the site.
 *
 * An arrow and a rule that grows out of the seam side — leftwards in a
 * left-hand column, rightwards in a right-hand column, so the movement always
 * travels away from the centre line. There are no icons on this site; the arrow
 * is a character.
 *
 * There is no `href="#"` escape hatch. The old site had six of them — under
 * About, Why Us, Mission, Values and the services heading — and every one was a
 * dead end for whoever clicked it. A link here goes somewhere or it is not a
 * link.
 */
export function SeamLink({
  href,
  children,
  className,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}) {
  if (!href || href === '#') {
    throw new Error(
      `<SeamLink> was given href="${href}". Placeholder links are the single ` +
        `worst thing on the site this replaces. Point it somewhere or remove it.`,
    );
  }

  const content = (
    <>
      <span>{children}</span>
      <span className="link-arrow" aria-hidden="true" />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={cn('link-seam', className)}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cn('link-seam', className)}>
      {content}
    </Link>
  );
}
