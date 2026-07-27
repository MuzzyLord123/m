import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import WebsiteEditor from "@/pages/lounge/WebsiteEditor";

const MARKETING_SITE_NAME = "Quooro Marketing Site";
const LS_KEY = "admin:marketing-site:id";

/**
 * Admin route that opens the existing Workshop editor on a dedicated
 * marketing-site project. Auto-creates the project (and a Home page) on
 * first launch, then redirects to a sub-route that mounts WebsiteEditor
 * with the resolved siteId, all within /admin/.
 */
export default function AdminMarketingWorkshop() {
  const { siteId } = useParams<{ siteId?: string }>();
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  const [resolving, setResolving] = useState(!siteId);

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) return;
    if (siteId) return;

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("Please sign in");
          navigate("/admin/marketing-site/builder");
          return;
        }
        const uid = userData.user.id;

        // 1. Cached id
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const { data: cachedRow } = await supabase
            .from("designer_sites")
            .select("id")
            .eq("id", cached)
            .eq("user_id", uid)
            .maybeSingle();
          if (cachedRow) {
            navigate(`/admin/marketing-site/workshop/${cachedRow.id}`, { replace: true });
            return;
          }
        }

        // 2. Look up by site_name
        const { data: existing } = await supabase
          .from("designer_sites")
          .select("id")
          .eq("user_id", uid)
          .eq("site_name", MARKETING_SITE_NAME)
          .order("created_at", { ascending: true })
          .maybeSingle();

        if (existing?.id) {
          localStorage.setItem(LS_KEY, existing.id);
          navigate(`/admin/marketing-site/workshop/${existing.id}`, { replace: true });
          return;
        }

        // 3. Create a fresh marketing site + Home page
        const { data: site, error: createErr } = await supabase
          .from("designer_sites")
          .insert({ site_name: MARKETING_SITE_NAME, user_id: uid })
          .select("id")
          .single();
        if (createErr || !site) throw createErr || new Error("Create failed");

        await supabase.from("designer_pages").insert([
          {
            site_id: site.id,
            user_id: uid,
            page_name: "Home",
            slug: "/",
            is_homepage: true,
          },
        ]);

        localStorage.setItem(LS_KEY, site.id);
        navigate(`/admin/marketing-site/workshop/${site.id}`, { replace: true });
      } catch (e: any) {
        toast.error(e?.message ?? "Could not open Workshop");
        navigate("/admin/marketing-site/builder");
      } finally {
        setResolving(false);
      }
    })();
  }, [loading, isAdmin, siteId, navigate]);

  if (loading || resolving) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <div className="text-sm text-muted-foreground">Loading marketing workshop…</div>
      </div>
    );
  }
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  // Once siteId is in the URL, mount the real editor (it reads useParams itself).
  return <WebsiteEditor />;
}
