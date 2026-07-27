/**
 * Password Strength Indicator
 * 
 * Visual checklist showing password requirements.
 * Goes green when each requirement is met.
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
    { label: 'At least 8 characters', met: requirements.minLength },
    { label: 'One uppercase letter', met: requirements.hasUppercase },
    { label: 'One number', met: requirements.hasNumber },
  ];

  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            'flex items-center gap-2 transition-colors duration-200',
            item.met ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {item.met ? (
            <Check className="h-4 w-4" />
          ) : (
            <X className="h-4 w-4" />
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
