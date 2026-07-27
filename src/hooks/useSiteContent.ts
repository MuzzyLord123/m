import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Read/write structured content for a public marketing site section.
 * Falls back to the provided default if no row exists yet.
 */
export function useSiteContent<T extends Record<string, any>>(
  sectionKey: string,
  fallback: T
) {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: row } = await (supabase as any)
      .from("site_content")
      .select("data")
      .eq("section_key", sectionKey)
      .maybeSingle();
    if (row?.data) setData({ ...fallback, ...(row.data as T) });
    else setData(fallback);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Visual editor: when the parent inspector saves a change, it posts
  // { type: 've:refresh', sectionKey } so the live preview re-reads the row.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data;
      if (msg && msg.type === "ve:refresh" && msg.sectionKey === sectionKey) {
        refresh();
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [sectionKey, refresh]);

  const save = useCallback(
    async (next: T) => {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        section_key: sectionKey,
        data: next,
        updated_by: userData.user?.id ?? null,
      };
      const { error } = await (supabase as any)
        .from("site_content")
        .upsert(payload, { onConflict: "section_key" });
      setSaving(false);
      if (error) throw error;
      setData(next);
    },
    [sectionKey]
  );

  return { data, setData, save, loading, saving, refresh };
}
