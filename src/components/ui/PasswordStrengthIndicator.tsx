/**
 * Password Strength Indicator
 *
 * Requirements as a single quiet line — each turns ember as it's met.
 * Same checks as before, a third of the height.
 */

import { Check, X } from 'lucide-react';
import { checkPasswordRequirements } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const requirements = checkPasswordRequirements(password);

  const items = [
    { label: '8+ chars', met: requirements.minLength },
    { label: 'Uppercase', met: requirements.hasUppercase },
    { label: 'Number', met: requirements.hasNumber },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200',
            item.met ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {item.met ? (
            <Check className="h-3 w-3" strokeWidth={2.4} />
          ) : (
            <X className="h-3 w-3" strokeWidth={2} />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
