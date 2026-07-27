import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Graceful fallback when data fails to load.
 * Shows a friendly message with an optional retry button.
 */
export function DataErrorFallback({
  message = 'Something went wrong loading this data.',
  onRetry,
  className,
  compact = false,
}: DataErrorFallbackProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-muted-foreground py-3 px-4 rounded-lg bg-muted/50', className)}>
        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-7 px-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      <div className="p-3 rounded-full bg-destructive/10 mb-4">
        <AlertCircle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Failed to load</p>
      <p className="text-sm text-muted-foreground mb-4 max-w-xs">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}
