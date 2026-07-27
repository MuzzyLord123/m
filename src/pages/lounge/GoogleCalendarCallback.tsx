import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function GoogleCalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(`Google authorization denied: ${error}`);
      setTimeout(() => navigate('/lounge/settings'), 3000);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received');
      setTimeout(() => navigate('/lounge/settings'), 3000);
      return;
    }

    exchangeCode(code);
  }, [searchParams]);

  const exchangeCode = async (code: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const redirectUri = `${window.location.origin}/lounge/google-calendar-callback`;

      const res = await supabase.functions.invoke('google-calendar-auth', {
        body: {
          action: 'exchange_code',
          code,
          redirect_uri: redirectUri,
        },
      });

      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);

      setStatus('success');
      setTimeout(() => navigate('/lounge/settings'), 2000);
    } catch (err: any) {
      console.error('Token exchange error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Failed to connect Google Calendar');
      setTimeout(() => navigate('/lounge/settings'), 4000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4 max-w-md p-8">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <h2 className="text-lg font-semibold">Connecting Google Calendar...</h2>
            <p className="text-sm text-muted-foreground">Please wait while we complete the authorization.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold">Google Calendar Connected!</h2>
            <p className="text-sm text-muted-foreground">Redirecting you back to settings...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-lg font-semibold">Connection Failed</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">Redirecting back to settings...</p>
          </>
        )}
      </div>
    </div>
  );
}
