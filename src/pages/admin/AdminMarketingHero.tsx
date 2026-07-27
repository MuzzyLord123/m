import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_HERO_DEFAULTS, type HomeHeroContent } from "@/lib/siteContentSchemas";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { FloatingScreenshotHero } from "@/components/marketing/FloatingScreenshotHero";

export default function AdminMarketingHero() {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { data, setData, save, loading, saving } = useSiteContent<HomeHeroContent>(
    "home_hero",
    HOME_HERO_DEFAULTS
  );
  const [showPreview, setShowPreview] = useState(false);

  if (roleLoading || loading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }
  if (!isAdmin) {
    return <div className="p-8 text-destructive">Admins only.</div>;
  }

  const update = <K extends keyof HomeHeroContent>(key: K, value: HomeHeroContent[K]) =>
    setData({ ...data, [key]: value });

  const handleSave = async () => {
    try {
      await save(data);
      toast.success("Hero content saved");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-display font-semibold">Homepage · Hero Section</h1>
              <p className="text-xs text-muted-foreground">Edit the hero shown on quooro.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(p => !p)}>
              <Eye className="w-4 h-4 mr-1" /> {showPreview ? "Hide preview" : "Preview"}
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm">
              <Save className="w-4 h-4 mr-1" /> {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Reflects unsaved changes once you save.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              <div className="relative h-[600px] overflow-hidden">
                <FloatingScreenshotHero />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Headline</CardTitle>
            <CardDescription>Top eyebrow, main title, and the rotating italic words.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label>Eyebrow text</Label>
              <Input value={data.eyebrow} onChange={e => update("eyebrow", e.target.value)} />
            </div>
            <div>
              <Label>Title line 1</Label>
              <Input value={data.titleLine1} onChange={e => update("titleLine1", e.target.value)} />
            </div>
            <div>
              <Label>Title line 2 prefix (italic)</Label>
              <Input
                value={data.titleLine2Prefix}
                onChange={e => update("titleLine2Prefix", e.target.value)}
                placeholder="crafted for"
              />
            </div>
            <div>
              <Label>Rotating words (one per line)</Label>
              <Textarea
                rows={4}
                value={data.rotatingWords.join("\n")}
                onChange={e =>
                  update(
                    "rotatingWords",
                    e.target.value.split("\n").map(s => s.trim()).filter(Boolean)
                  )
                }
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea rows={4} value={data.subtitle} onChange={e => update("subtitle", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call-to-action buttons</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Primary button label</Label>
              <Input value={data.primaryCtaLabel} onChange={e => update("primaryCtaLabel", e.target.value)} />
            </div>
            <div>
              <Label>Primary button link</Label>
              <Input value={data.primaryCtaHref} onChange={e => update("primaryCtaHref", e.target.value)} />
            </div>
            <div>
              <Label>Secondary button label</Label>
              <Input value={data.secondaryCtaLabel} onChange={e => update("secondaryCtaLabel", e.target.value)} />
            </div>
            <div>
              <Label>Secondary button link</Label>
              <Input value={data.secondaryCtaHref} onChange={e => update("secondaryCtaHref", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trust badges</CardTitle>
            <CardDescription>
              Icon names are <a className="underline" href="https://lucide.dev/icons/" target="_blank" rel="noreferrer">Lucide icon names</a> (e.g. Shield, Heart, Zap, Check).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.badges.map((b, i) => (
              <div key={i} className="grid grid-cols-[150px_1fr_40px] gap-2 items-center">
                <Input
                  value={b.icon}
                  onChange={e => {
                    const next = [...data.badges];
                    next[i] = { ...b, icon: e.target.value };
                    update("badges", next);
                  }}
                  placeholder="Shield"
                />
                <Input
                  value={b.label}
                  onChange={e => {
                    const next = [...data.badges];
                    next[i] = { ...b, label: e.target.value };
                    update("badges", next);
                  }}
                  placeholder="Enterprise-grade security"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update("badges", data.badges.filter((_, j) => j !== i))}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => update("badges", [...data.badges, { icon: "Sparkles", label: "" }])}
            >
              <Plus className="w-4 h-4 mr-1" /> Add badge
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stat strip</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.stats.map((s, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_40px] gap-2 items-center">
                <Input
                  value={s.value}
                  onChange={e => {
                    const next = [...data.stats];
                    next[i] = { ...s, value: e.target.value };
                    update("stats", next);
                  }}
                  placeholder="100%"
                />
                <Input
                  value={s.label}
                  onChange={e => {
                    const next = [...data.stats];
                    next[i] = { ...s, label: e.target.value };
                    update("stats", next);
                  }}
                  placeholder="Ownership"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => update("stats", data.stats.filter((_, j) => j !== i))}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => update("stats", [...data.stats, { value: "", label: "" }])}
            >
              <Plus className="w-4 h-4 mr-1" /> Add stat
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
