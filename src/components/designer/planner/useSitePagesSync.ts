import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { EditorElement } from '../types';

export interface SyncedPage {
  id: string;
  page_name: string;
  slug: string;
  elements: EditorElement[];
  sort_order: number;
}

const SYNC_EVENT = 'site-pages-updated';

/** Dispatch this after any planner writes to designer_pages */
export function notifySitePagesUpdated() {
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

/**
 * Shared hook for loading designer_pages with cross-component sync.
 * When any component calls `notifySitePagesUpdated()`, all listeners reload.
 */
export function useSitePagesSync(siteId?: string) {
  const [pages, setPages] = useState<SyncedPage[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    const { data } = await supabase
      .from('designer_pages')
      .select('id, page_name, slug, elements, sort_order')
      .eq('site_id', siteId)
      .order('sort_order');
    if (data) {
      setPages(data.map(p => ({
        ...p,
        sort_order: p.sort_order ?? 0,
        elements: (p.elements as unknown as EditorElement[]) || [],
      })));
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => { loadPages(); }, [loadPages]);

  // Listen for cross-component sync events
  useEffect(() => {
    const handler = () => loadPages();
    window.addEventListener(SYNC_EVENT, handler);
    return () => window.removeEventListener(SYNC_EVENT, handler);
  }, [loadPages]);

  return { pages, loading, reload: loadPages, setPages };
}
