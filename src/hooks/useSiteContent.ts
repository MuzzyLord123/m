import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SITE_CONTENT_KEY = ["site_content"] as const;

type SiteContentMap = Record<string, Record<string, any>>;

/**
 * The whole `site_content` table in one request.
 *
 * The homepage renders ~11 editable sections, and a per-section query meant 11
 * round-trips before the marketing copy settled. The table holds one small row per
 * marketing section, so fetching all of it once and letting React Query dedupe and
 * cache it costs a single request for the entire page.
 */
async function fetchAllSiteContent(): Promise<SiteContentMap> {
  const { data, error } = await (supabase as any)
    .from("site_content")
    .select("section_key, data");
  if (error) throw error;

  const map: SiteContentMap = {};
  for (const row of data ?? []) {
    if (row?.section_key) map[row.section_key] = row.data ?? {};
  }
  return map;
}

/**
 * Read/write structured content for a public marketing site section.
 * Falls back to the provided default if no row exists yet.
 */
export function useSiteContent<T extends Record<string, any>>(
  sectionKey: string,
  fallback: T
) {
  const queryClient = useQueryClient();

  // Callers pass a fresh object literal each render; keeping it in a ref avoids
  // recomputing on an identity change that carries no new data.
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const { data: map, isLoading } = useQuery({
    queryKey: SITE_CONTENT_KEY,
    queryFn: fetchAllSiteContent,
  });

  // Unsaved edits from the admin editor. Null means "show what the server has".
  const [draft, setDraft] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  const serverRow = map?.[sectionKey];
  const resolved = useMemo(
    () =>
      (serverRow
        ? { ...fallbackRef.current, ...(serverRow as T) }
        : fallbackRef.current) as T,
    [serverRow]
  );

  // Switching sections must not carry the previous section's unsaved edits across.
  useEffect(() => {
    setDraft(null);
  }, [sectionKey]);

  const data = draft ?? resolved;

  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  const setData = useCallback<Dispatch<SetStateAction<T>>>((value) => {
    setDraft((prev) => {
      const base = prev ?? resolvedRef.current;
      return typeof value === "function" ? (value as (p: T) => T)(base) : value;
    });
  }, []);

  const refresh = useCallback(async () => {
    setDraft(null);
    await queryClient.invalidateQueries({ queryKey: SITE_CONTENT_KEY });
  }, [queryClient]);

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

      queryClient.setQueryData<SiteContentMap>(SITE_CONTENT_KEY, (prev) => ({
        ...(prev ?? {}),
        [sectionKey]: next,
      }));
      setDraft(null);
    },
    [sectionKey, queryClient]
  );

  return { data, setData, save, loading: isLoading, saving, refresh };
}
