import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOMEPAGE_HEADERS, type SectionHeaderContent } from "@/lib/siteContentSchemas";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

function HeaderEditor({ sectionKey }: { sectionKey: string }) {
  const meta = HOMEPAGE_HEADERS[sectionKey];
  const fallback: SectionHeaderContent = {
    eyebrow: meta.eyebrow,
    titlePrefix: meta.titlePrefix,
    titleHighlight: meta.titleHighlight,
    subtitle: meta.subtitle,
  };
  const { data, setData, save, saving } = useSiteContent<SectionHeaderContent>(sectionKey, fallback);

  const update = <K extends keyof SectionHeaderContent>(k: K, v: SectionHeaderContent[K]) =>
    setData({ ...data, [k]: v });

  const handleSave = async () => {
    try {
      await save(data);
      toast.success(`${meta.label} saved`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{meta.label}</CardTitle>
          <CardDescription className="font-mono text-[11px]">{sectionKey}</CardDescription>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div>
          <Label className="text-xs">Eyebrow</Label>
          <Input value={data.eyebrow} onChange={(e) => update("eyebrow", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Title prefix</Label>
            <Input value={data.titlePrefix} onChange={(e) => update("titlePrefix", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Title highlight (gradient)</Label>
            <Input value={data.titleHighlight} onChange={(e) => update("titleHighlight", e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs">Subtitle</Label>
          <Textarea rows={3} value={data.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminMarketingHeaders() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/marketing-site")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-display font-semibold">Homepage · Section Headers</h1>
              <p className="text-xs text-muted-foreground">
                Edit eyebrow, headline and subtitle for every remaining homepage section.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-4 pb-16">
        {Object.keys(HOMEPAGE_HEADERS).map((key) => (
          <HeaderEditor key={key} sectionKey={key} />
        ))}
      </div>
    </div>
  );
}
