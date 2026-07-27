import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Sparkles, Wand2, Workflow, Building2, LayoutTemplate } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

const sections = [
  {
    key: "home_hero",
    title: "Homepage · Hero",
    description: "Eyebrow, headline, rotating words, CTAs, trust badges, stat strip.",
    href: "/admin/marketing-site/hero",
    icon: Sparkles,
    status: "Editable",
  },
  {
    key: "home_process",
    title: "Homepage · Process",
    description: "The 4-step delivery process and its supporting copy.",
    href: "/admin/marketing-site/process",
    icon: Workflow,
    status: "Editable",
  },
  {
    key: "home_why",
    title: "Homepage · Why Quooro",
    description: "Differentiator cards and the section header copy.",
    href: "/admin/marketing-site/why",
    icon: Building2,
    status: "Editable",
  },
  {
    key: "home_headers",
    title: "Homepage · All section headers",
    description: "Eyebrow, headline & subtitle for What We Do, Global Reach, Dashboard, Free Previews, Apps, Services, Built for and the bottom CTA.",
    href: "/admin/marketing-site/headers",
    icon: LayoutTemplate,
    status: "Editable",
  },
  {
    key: "builder",
    title: "Full visual builder",
    description: "Open the Website Designer to design any page of quooro.com visually.",
    href: "/admin/marketing-site/builder",
    icon: Wand2,
    status: "Beta",
  },
];

export default function AdminMarketingSiteIndex() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();
  if (loading) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return <div className="p-8 text-destructive">Admins only.</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
            </Button>
            <div>
              <h1 className="text-lg font-display font-semibold">Marketing site</h1>
              <p className="text-xs text-muted-foreground">Edit the public Quooro website</p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/" target="_blank">
              <ExternalLink className="w-4 h-4 mr-1" /> View live
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Edit the content of the public Quooro homepage directly from here. Changes go live the
          moment you hit save.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map(s => {
            const Icon = s.icon;
            return (
              <Link key={s.key} to={s.href} className="block group">
                <Card className="h-full transition-colors group-hover:border-primary/40">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{s.title}</CardTitle>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {s.status}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{s.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
