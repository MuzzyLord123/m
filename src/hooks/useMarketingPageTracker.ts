import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'quooro_visit_session';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

// Do not track authenticated portal areas
const EXCLUDED_PREFIXES = ['/dashboard', '/lounge', '/admin', '/executive', '/sign-in', '/verify', '/reset-password', '/customer-login'];

export function useMarketingPageTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (EXCLUDED_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) return;

    const payload = {
      path,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      country: (typeof navigator !== 'undefined' && (navigator as any).language) || null,
      session_id: getSessionId(),
    };

    // Fire-and-forget
    (supabase as any)
      .from('marketing_page_views')
      .insert(payload)
      .then(() => {}, () => {});
  }, [location.pathname]);
}
