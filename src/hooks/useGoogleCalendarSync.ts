import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type SyncStatus = 'idle' | 'checking' | 'syncing' | 'success' | 'error' | 'needs_auth';

export function useGoogleCalendarSync() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const hasAutoSynced = useRef(false);

  // Check connection status
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const check = async () => {
      setSyncStatus('checking');
      try {
        const { data } = await supabase
          .from('user_connections')
          .select('credentials, is_connected, connected_at')
          .eq('user_id', user.id)
          .eq('provider', 'google_calendar')
          .maybeSingle();

        const creds = data?.credentials as Record<string, string> | null;
        const hasCreds = !!creds?.client_id && !!creds?.client_secret;
        const hasToken = !!creds?.access_token;
        const connected = !!data?.is_connected && hasToken;

        setHasCredentials(hasCreds);
        setIsConnected(connected);
        if (data?.connected_at) setLastSyncedAt(data.connected_at);

        if (hasCreds && !hasToken) {
          setSyncStatus('needs_auth');
          setSyncMessage('Google Calendar needs authorization — click Authorize to connect');
        } else {
          setSyncStatus('idle');
        }
      } catch {
        setIsConnected(false);
        setHasCredentials(false);
        setSyncStatus('idle');
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [user]);

  const startAuth = useCallback(async () => {
    if (!user) return;
    setSyncStatus('syncing');
    setSyncMessage('Starting Google authorization...');
    try {
      const redirectUri = `${window.location.origin}/lounge/google-calendar-callback`;
      const res = await supabase.functions.invoke('google-calendar-auth', {
        body: { action: 'get_auth_url', redirect_uri: redirectUri },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      window.location.href = res.data.auth_url;
    } catch (err: any) {
      console.error('Google auth error:', err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Failed to start Google authorization');
      toast.error(err.message || 'Failed to start Google authorization');
      setTimeout(() => setSyncStatus('needs_auth'), 5000);
    }
  }, [user]);

  const importEvents = useCallback(async (onComplete?: () => void) => {
    if (!user) return;
    setSyncStatus('syncing');
    setSyncMessage('Importing events from Google Calendar...');
    try {
      const res = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'import_events' },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      const count = res.data.imported || 0;
      setSyncStatus('success');
      setSyncMessage(`Synced ${count} event${count !== 1 ? 's' : ''} from Google Calendar`);
      setLastSyncedAt(new Date().toISOString());
      toast.success(`Imported ${count} event${count !== 1 ? 's' : ''} from Google Calendar`);
      onComplete?.();

      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err: any) {
      console.error('Sync error:', err);
      setSyncStatus('error');
      setSyncMessage(err.message || 'Failed to sync Google Calendar');
      toast.error(err.message || 'Failed to sync Google Calendar');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [user]);

  const pushEvent = useCallback(async (event: any) => {
    if (!user || !isConnected) return;
    try {
      const res = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'push_event', event },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast.success('Event synced to Google Calendar');
    } catch (err: any) {
      console.error('Push event error:', err);
      toast.error('Failed to push event to Google Calendar');
    }
  }, [user, isConnected]);

  // Auto-sync on first load when fully connected
  const autoSync = useCallback((refetch?: () => void) => {
    if (!hasAutoSynced.current && isConnected && !loading) {
      hasAutoSynced.current = true;
      importEvents(refetch);
    }
  }, [isConnected, loading, importEvents]);

  return {
    isConnected,
    hasCredentials,
    syncStatus,
    syncMessage,
    lastSyncedAt,
    loading,
    importEvents,
    pushEvent,
    autoSync,
    startAuth,
  };
}
