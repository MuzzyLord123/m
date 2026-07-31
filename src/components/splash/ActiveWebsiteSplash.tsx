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

const CACHE_PREFIX = 'quooro-splash-config';

export type SplashSurface = 'website' | 'lounge' | 'team';

const FALLBACK: Record<SplashSurface, Partial<SplashConfig>> = {
  website: {},
  lounge: { motif: 'aurora', sub: 'Lounge', line: 'Your lounge', ink: '#F4F4F5' },
  team: { motif: 'console', sub: 'Team', line: 'Team portal', bg: '#08080B', grain: false },
};

function cached(surface: SplashSurface): SplashConfig {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}-${surface}`);
    if (raw) return { ...DEFAULT_SPLASH, ...FALLBACK[surface], ...JSON.parse(raw) };
  } catch { /* unreadable */ }
  return { ...DEFAULT_SPLASH, ...FALLBACK[surface] } as SplashConfig;
}

export function ActiveWebsiteSplash({
  onComplete,
  surface = 'website',
}: { onComplete: () => void; surface?: SplashSurface }) {
  const [config] = useState<SplashConfig>(() => cached(surface));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('splash_screens' as any)
        .select('config')
        .eq('is_active', true)
        .eq('surface', surface)
        .limit(1);
      if (cancelled) return;
      const next = ((data as any[]) || [])[0]?.config;
      if (next && typeof next === 'object') {
        try { localStorage.setItem(`${CACHE_PREFIX}-${surface}`, JSON.stringify(next)); } catch { /* refused */ }
      }
    })();
    return () => { cancelled = true; };
  }, [surface]);

  return <WebsiteSplash config={config} onComplete={onComplete} />;
}

export default ActiveWebsiteSplash;
