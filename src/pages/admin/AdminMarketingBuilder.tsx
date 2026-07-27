import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Wand2, Sparkles, Paintbrush, Code2, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";

export default function AdminMarketingBuilder() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/marketing-site")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-lg font-display font-semibold">Full Visual Builder</h1>
            <p className="text-xs text-muted-foreground">Two ways to edit quooro.com — both stay in admin</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Visual Editor — new */}
          <Card className="border-primary/40 relative overflow-hidden">
            <div className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded">
              New
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                  <MousePointer2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Visual Editor</CardTitle>
                  <CardDescription>Click any text on the live site and edit it inline</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Loads the real marketing site in an editable canvas. Hover to highlight, click to edit copy
                with AI tone presets. Changes save instantly to all visitors.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>· Inline text editing on every wired section</li>
                <li>· Desktop / tablet / mobile preview</li>
                <li>· AI rewrite (sharper, friendlier, shorter…)</li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/admin/marketing-site/visual-editor">
                  <MousePointer2 className="w-4 h-4 mr-1" /> Open Visual Editor
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Workshop Studio */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-foreground/70" />
                </div>
                <div>
                  <CardTitle>Workshop Studio</CardTitle>
                  <CardDescription>Full drag-and-drop canvas control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Opens the Workshop on a dedicated marketing project — auto-created on first launch.
                Re-order sections, add new blocks, design freely with full layout control.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>· Drag, drop, reorder, add new sections</li>
                <li>· Full style controls per element</li>
                <li>· Stays inside the admin shell</li>
              </ul>
              <Button variant="outline" asChild className="w-full">
                <Link to="/admin/marketing-site/workshop">
                  <Sparkles className="w-4 h-4 mr-1" /> Open Workshop
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm">
                <Code2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">Section editors</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Edit Hero, Process and Why-Quooro copy in structured form fields.</p>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link to="/admin/marketing-site">Open section editors →</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-primary" />
                <CardTitle className="text-base">View live</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Open the public homepage in a new tab.</p>
              <Button variant="ghost" size="sm" asChild className="mt-2">
                <Link to="/" target="_blank">Open quooro.com →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
