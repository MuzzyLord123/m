import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_PROCESS_DEFAULTS, type HomeProcessContent, type ProcessStepData } from "@/lib/siteContentSchemas";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export default function AdminMarketingProcess() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data, setData, save, loading, saving } = useSiteContent<HomeProcessContent>(
    "home_process",
    HOME_PROCESS_DEFAULTS
  );

  if (roleLoading || loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  const update = <K extends keyof HomeProcessContent>(k: K, v: HomeProcessContent[K]) =>
    setData({ ...data, [k]: v });

  const updateStep = (i: number, patch: Partial<ProcessStepData>) => {
    const next = [...data.steps];
    next[i] = { ...next[i], ...patch };
    update("steps", next);
  };

  const handleSave = async () => {
    try { await save(data); toast.success("Process section saved"); }
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
              <h1 className="text-lg font-display font-semibold">Homepage · Process Section</h1>
              <p className="text-xs text-muted-foreground">Edit the "Our Process" steps</p>
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
            <CardDescription>Eyebrow, title and intro paragraph.</CardDescription>
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

        {data.steps.map((step, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Step {step.step || i + 1}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => update("steps", data.steps.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Number</Label><Input value={step.step} onChange={e => updateStep(i, { step: e.target.value })} /></div>
                <div><Label>Title</Label><Input value={step.title} onChange={e => updateStep(i, { title: e.target.value })} /></div>
                <div><Label>Lucide icon</Label><Input value={step.icon} onChange={e => updateStep(i, { icon: e.target.value })} placeholder="Target" /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={3} value={step.description} onChange={e => updateStep(i, { description: e.target.value })} /></div>
              <div>
                <Label>Detail pills (one per line)</Label>
                <Textarea rows={4} value={step.details.join("\n")} onChange={e => updateStep(i, { details: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" size="sm" onClick={() => update("steps", [...data.steps, { step: String(data.steps.length + 1).padStart(2, "0"), title: "", description: "", icon: "Sparkles", details: [] }])}>
          <Plus className="w-4 h-4 mr-1" /> Add step
        </Button>

        <div className="flex justify-end pb-12">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
