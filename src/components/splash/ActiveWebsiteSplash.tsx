import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WebsiteSplash, DEFAULT_SPLASH, type SplashConfig } from './WebsiteSplash';

/**
 * The splash the website is currently wearing.
 *
 * The screen has to be on the glass in the first frame, long before a
 * network round trip could answer, so the last known design is kept in
 * local storage and used immediately. The live design is fetched in the
 * background and stored for next time - which means changing the splash
 * takes effect on a visitor's next visit rather than mid-animation,
 * where a swap would be visible and cheap-looking.
 */

const CACHE_KEY = 'quooro-splash-config';

function cached(): SplashConfig {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return { ...DEFAULT_SPLASH, ...JSON.parse(raw) };
  } catch { /* unreadable */ }
  return DEFAULT_SPLASH;
}

export function ActiveWebsiteSplash({ onComplete }: { onComplete: () => void }) {
  const [config] = useState<SplashConfig>(cached);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('splash_screens' as any)
        .select('config')
        .eq('is_active', true)
        .limit(1);
      if (cancelled) return;
      const next = ((data as any[]) || [])[0]?.config;
      if (next && typeof next === 'object') {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* refused */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <WebsiteSplash config={config} onComplete={onComplete} />;
}

export default ActiveWebsiteSplash;
