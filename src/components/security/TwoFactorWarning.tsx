import { Shield, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * The standing reminder that an account has no second factor.
 *
 * It is a fact about the account, not an alarm, so it is stated once in
 * a hairline strip and gets out of the way. Team accounts read in the
 * risk tone because a team account reaches every client record; a
 * customer account reads in the attend tone, because the exposure is
 * their own.
 */

interface TwoFactorWarningProps {
  role: 'admin' | 'user';
  variant?: 'badge' | 'banner' | 'card';
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export default function TwoFactorWarning({
  role,
  variant = 'badge',
  onDismiss,
  showDismiss = false,
}: TwoFactorWarningProps) {
  const navigate = useNavigate();
  const isAdmin = role === 'admin';

  const tone = isAdmin
    ? { text: 'text-risk', border: 'border-risk/35', wash: 'bg-risk/[0.05]', dot: 'bg-risk' }
    : { text: 'text-attend', border: 'border-attend/35', wash: 'bg-attend/[0.05]', dot: 'bg-attend' };

  const handleClick = () => {
    navigate(isAdmin ? '/dashboard?tab=security' : '/lounge/settings?section=security');
  };

  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            aria-label="Two-factor authentication is not enabled"
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors hover:bg-foreground/[0.05]',
              tone.text,
            )}
          >
            <Shield className="h-4 w-4" />
            <span aria-hidden className={cn('absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full', tone.dot)} />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-[12px]">No second factor on this account</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[11px] border px-3.5 py-2.5 sm:flex-nowrap',
          tone.border, tone.wash,
        )}
      >
        <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', tone.dot)} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Account security
          </p>
          <p className="mt-0.5 text-[12.5px] leading-snug">
            {isAdmin
              ? 'This team account has no second factor, and a team account reaches every client record.'
              : 'Your account has no second factor yet.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleClick}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-[9px] border px-3 text-[12px] font-medium transition-colors',
              tone.border, tone.text, 'hover:bg-foreground/[0.04]',
            )}
          >
            Set it up <ArrowRight className="h-3 w-3" />
          </button>
          {showDismiss && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="flex h-8 w-8 items-center justify-center rounded-[9px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card: the same fact, given room to explain itself.
  return (
    <div className={cn('relative rounded-[12px] border p-4 sm:p-5', tone.border, tone.wash)}>
      {showDismiss && onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        Account security
      </p>
      <h3 className="mt-1.5 flex items-center gap-2 font-display text-[16px] font-semibold tracking-[-0.01em]">
        <Shield className={cn('h-4 w-4', tone.text)} />
        Add a second factor
      </h3>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
        {isAdmin
          ? 'A team account reaches every client record on the platform. A second factor means a stolen password is not enough to open any of it.'
          : 'A second factor means a stolen password on its own cannot open your files, invoices or messages.'}
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="mt-3.5 flex h-10 items-center gap-2 rounded-[10px] bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Shield className="h-3.5 w-3.5" /> Set it up
        <ArrowRight className="h-3.5 w-3.5 opacity-70" />
      </button>
      <p className="mt-2.5 text-[11px] text-muted-foreground">Takes about a minute with any authenticator app.</p>
    </div>
  );
}
