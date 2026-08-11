import { Phone as PhoneIcon } from '@phosphor-icons/react/dist/ssr';

import { phone } from '@content/site';
import { cn } from '@/lib/cn';

/**
 * The only place a telephone number is rendered anywhere on this site.
 *
 * Label and href both come from one constant in content/site.ts, so the old
 * site's bug — a displayed number and a shorter linked one — cannot recur. If
 * you need a number somewhere new, use this component. Do not type digits.
 */
export function PhoneLink({
  className,
  withIcon = false,
  label,
}: {
  className?: string;
  withIcon?: boolean;
  /** Overrides the number as the visible text. The href is unchanged. */
  label?: string;
}) {
  return (
    <a
      href={phone.href}
      className={cn('inline-flex items-center gap-2 tabular whitespace-nowrap', className)}
    >
      {withIcon ? <PhoneIcon weight="light" aria-hidden className="size-4 shrink-0" /> : null}
      <span>{label ?? phone.display}</span>
      {label ? <span className="sr-only">— {phone.display}</span> : null}
    </a>
  );
}

/** For prose: "ring me on 07944 512946". */
export function PhoneNumber() {
  return (
    <a href={phone.href} className="link-rule tabular whitespace-nowrap">
      {phone.display}
    </a>
  );
}
