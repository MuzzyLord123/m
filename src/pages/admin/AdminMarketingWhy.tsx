import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_WHY_DEFAULTS, type HomeWhyContent, type DifferentiatorData } from "@/lib/siteContentSchemas";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export default function AdminMarketingWhy() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data, setData, save, loading, saving } = useSiteContent<HomeWhyContent>(
    "home_why",
    HOME_WHY_DEFAULTS
  );

  if (roleLoading || loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  const update = <K extends keyof HomeWhyContent>(k: K, v: HomeWhyContent[K]) =>
    setData({ ...data, [k]: v });

  const updateDiff = (i: number, patch: Partial<DifferentiatorData>) => {
    const next = [...data.differentiators];
    next[i] = { ...next[i], ...patch };
    update("differentiators", next);
  };

  const handleSave = async () => {
    try { await save(data); toast.success("Why Quooro section saved"); }
    catch (e: any) { toast.error(e.message ?? "Failed to save"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/marketing-site")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-display font-semibold">Homepage · Why Quooro</h1>
              <p className="text-xs text-muted-foreground">Edit the differentiator cards</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>Eyebrow, title and subtitle.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div><Label>Eyebrow</Label><Input value={data.eyebrow} onChange={e => update("eyebrow", e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title</Label><Input value={data.title} onChange={e => update("title", e.target.value)} /></div>
              <div><Label>Title highlight (gradient)</Label><Input value={data.titleHighlight} onChange={e => update("titleHighlight", e.target.value)} /></div>
            </div>
            <div><Label>Subtitle</Label><Textarea rows={3} value={data.subtitle} onChange={e => update("subtitle", e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Differentiator cards</CardTitle>
            <CardDescription>Icon names use Lucide (e.g. Shield, Code2, Infinity, Headphones).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.differentiators.map((d, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_2fr_40px] gap-3 items-start p-3 rounded-lg border border-border/40">
                <div><Label className="text-xs">Icon</Label><Input value={d.icon} onChange={e => updateDiff(i, { icon: e.target.value })} placeholder="Shield" /></div>
                <div><Label className="text-xs">Title</Label><Input value={d.title} onChange={e => updateDiff(i, { title: e.target.value })} /></div>
                <div><Label className="text-xs">Description</Label><Textarea rows={2} value={d.description} onChange={e => updateDiff(i, { description: e.target.value })} /></div>
                <Button variant="ghost" size="icon" className="mt-6" onClick={() => update("differentiators", data.differentiators.filter((_, j) => j !== i))}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update("differentiators", [...data.differentiators, { icon: "Sparkles", title: "", description: "" }])}>
              <Plus className="w-4 h-4 mr-1" /> Add card
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-12">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
