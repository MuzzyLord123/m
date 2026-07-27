import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink,
  Save,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { postToIframe, type VEMsg } from "@/lib/visualEditorBridge";
import { toast } from "sonner";

type Device = "desktop" | "tablet" | "mobile";

interface Selection {
  sectionKey: string;
  field: string;
  value: string;
  kind: "text" | "textarea";
  label?: string;
}

const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1280,
  tablet: 820,
  mobile: 390,
};

const MARKETING_PAGES: Array<{ label: string; path: string }> = [
  { label: "Homepage", path: "/" },
  { label: "Pricing", path: "/pricing" },
  { label: "Features", path: "/features" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Quooro Office", path: "/quooro-office" },
  { label: "Comparison", path: "/comparison" },
];

export default function AdminMarketingVisualEditor() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [page, setPage] = useState<string>("/");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);

  // Receive messages from the iframe
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data as VEMsg;
      if (!msg || typeof msg !== "object" || !("type" in msg)) return;
      if (msg.type === "ve:select") {
        setSelection({
          sectionKey: msg.sectionKey,
          field: msg.field,
          value: msg.value,
          kind: msg.kind,
          label: msg.label,
        });
        setDraft(msg.value);
      } else if (msg.type === "ve:ready") {
        // optional handshake
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selection) return;
    setSaving(true);
    try {
      // Fetch current row, merge the single field, upsert
      const { data: row } = await (supabase as any)
        .from("site_content")
        .select("data")
        .eq("section_key", selection.sectionKey)
        .maybeSingle();
      const merged = { ...(row?.data ?? {}), [selection.field]: draft };
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any)
        .from("site_content")
        .upsert(
          { section_key: selection.sectionKey, data: merged, updated_by: userData.user?.id ?? null },
          { onConflict: "section_key" }
        );
      if (error) throw error;
      setSelection({ ...selection, value: draft });
      postToIframe(iframeRef.current, { type: "ve:refresh", sectionKey: selection.sectionKey });
      toast.success("Saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [selection, draft]);

  const handleAIRewrite = useCallback(async (tone: string) => {
    if (!selection) return;
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketing-copy-rewrite", {
        body: { text: draft || selection.value, tone, field: selection.label || selection.field },
      });
      if (error) throw error;
      if (data?.text) setDraft(data.text);
    } catch (e: any) {
      toast.error(e?.message ?? "AI rewrite failed");
    } finally {
      setAiBusy(false);
    }
  }, [selection, draft]);

  const reloadIframe = () => {
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  // Stable src so the iframe doesn't reload on every keystroke / state change
  const iframeSrc = useMemo(() => `${page}?__edit=1`, [page]);

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Top bar */}
      <div className="h-14 border-b bg-background flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/marketing-site/builder")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <div className="font-display font-semibold text-sm">Visual Editor</div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded">
          Beta
        </span>

        <div className="ml-6 flex items-center gap-2">
          <Select value={page} onValueChange={setPage}>
            <SelectTrigger className="h-8 w-48 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETING_PAGES.map(p => (
                <SelectItem key={p.path} value={p.path} className="text-xs">
                  {p.label} <span className="text-muted-foreground ml-1">{p.path}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={reloadIframe} title="Reload">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1 bg-muted rounded-md p-0.5">
          {(["desktop", "tablet", "mobile"] as Device[]).map(d => {
            const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  device === d ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{d}</span>
              </button>
            );
          })}
        </div>

        <Button variant="outline" size="sm" asChild>
          <a href={page} target="_blank" rel="noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" /> View live
          </a>
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-start justify-center p-6">
          <div
            className="bg-background shadow-2xl rounded-md overflow-hidden transition-all duration-300"
            style={{
              width: DEVICE_WIDTHS[device],
              maxWidth: "100%",
              height: "calc(100vh - 7rem)",
            }}
          >
            <iframe
              ref={iframeRef}
              key={page}
              src={iframeSrc}
              title="Marketing site preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>

        {/* Inspector */}
        <div className="w-80 border-l bg-background flex flex-col shrink-0">
          <div className="px-4 py-3 border-b">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inspector
            </div>
          </div>

          {!selection ? (
            <div className="p-6 text-sm text-muted-foreground space-y-3 flex-1">
              <p className="font-medium text-foreground">Click any highlighted text in the preview to edit it.</p>
              <p>
                Elements with a dashed blue outline are wired up. Edits save to the live marketing site
                instantly.
              </p>
              <Card className="p-3 mt-4 bg-muted/30 text-xs">
                <div className="font-semibold mb-1">Tip</div>
                Not seeing edit handles on a page? That page hasn't been wrapped in editable fields yet —
                use the per-section editors back on the marketing index, or open Workshop for full canvas
                control.
              </Card>
            </div>
          ) : (
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Section
                </div>
                <div className="font-mono text-xs bg-muted rounded px-2 py-1">{selection.sectionKey}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Field
                </div>
                <div className="text-sm font-medium">{selection.label || selection.field}</div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
                  Content
                </label>
                {selection.kind === "textarea" ? (
                  <Textarea
                    rows={6}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    className="text-sm"
                  />
                ) : (
                  <Input value={draft} onChange={e => setDraft(e.target.value)} className="text-sm" />
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["Sharper", "Punchier", "More formal", "Friendlier", "Shorter"].map(t => (
                  <button
                    key={t}
                    disabled={aiBusy}
                    onClick={() => handleAIRewrite(t)}
                    className="text-[11px] px-2 py-1 rounded-full border border-border bg-background hover:bg-muted disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-primary" /> {t}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleSave}
                disabled={saving || draft === selection.value}
                className="w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "Saving…" : "Save changes"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setSelection(null);
                  setDraft("");
                }}
              >
                Deselect
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
