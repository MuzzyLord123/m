import { RefreshCw, CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncStatus } from '@/hooks/useGoogleCalendarSync';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface GoogleCalendarSyncBarProps {
  isConnected: boolean;
  hasCredentials: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  lastSyncedAt: string | null;
  onSync: () => void;
  onAuthorize: () => void;
}

export function GoogleCalendarSyncBar({
  isConnected,
  hasCredentials,
  syncStatus,
  syncMessage,
  lastSyncedAt,
  onSync,
  onAuthorize,
}: GoogleCalendarSyncBarProps) {
  const navigate = useNavigate();

  // Don't show if no credentials at all
  if (!hasCredentials && !isConnected) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-300',
        syncStatus === 'syncing' && 'bg-primary/10 text-primary',
        syncStatus === 'success' && 'bg-green-500/10 text-green-600 dark:text-green-400',
        syncStatus === 'error' && 'bg-destructive/10 text-destructive',
        syncStatus === 'needs_auth' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        syncStatus === 'idle' && 'bg-muted/50 text-muted-foreground',
        syncStatus === 'checking' && 'bg-muted/50 text-muted-foreground',
      )}
    >
      {syncStatus === 'syncing' && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
      {syncStatus === 'success' && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {syncStatus === 'error' && <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {syncStatus === 'needs_auth' && <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />}
      {(syncStatus === 'idle' || syncStatus === 'checking') && (
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      )}

      <span className="truncate">
        {syncStatus === 'syncing' && syncMessage}
        {syncStatus === 'success' && syncMessage}
        {syncStatus === 'error' && syncMessage}
        {syncStatus === 'needs_auth' && syncMessage}
        {syncStatus === 'idle' && (
          lastSyncedAt
            ? `Google Calendar · Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
            : 'Google Calendar connected'
        )}
        {syncStatus === 'checking' && 'Checking Google Calendar...'}
      </span>

      {syncStatus === 'needs_auth' && (
        <button
          onClick={onAuthorize}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 transition-colors text-xs font-semibold whitespace-nowrap"
        >
          <ExternalLink className="w-3 h-3" />
          Authorize
        </button>
      )}

      {(syncStatus === 'idle' || syncStatus === 'error') && isConnected && (
        <button
          onClick={onSync}
          className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-accent/50 transition-colors text-xs font-medium whitespace-nowrap"
        >
          <RefreshCw className="w-3 h-3" />
          Sync
        </button>
      )}
    </div>
  );
}
