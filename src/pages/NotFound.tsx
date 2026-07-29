import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Package, Globe, Users, HelpCircle } from "lucide-react";
import { LineDraw, DrawPath, DrawPoint } from "@/components/motion/LineDraw";

const popularPages = [
  { name: "Home", href: "/", icon: Home },
  { name: "Packages", href: "/packages", icon: Package },
  { name: "Portfolio", href: "/portfolio", icon: Globe },
  { name: "Get Started", href: "/get-started", icon: ArrowRight },
  { name: "About Us", href: "/comparison", icon: Users },
  { name: "Support", href: "/support", icon: HelpCircle },
];

function getSuggestions(pathname: string) {
  const path = pathname.toLowerCase();
  const suggestions: { label: string; href: string }[] = [];

  if (path.includes("price") || path.includes("cost") || path.includes("plan"))
    suggestions.push({ label: "View Packages", href: "/packages" });
  if (path.includes("port") || path.includes("work") || path.includes("project"))
    suggestions.push({ label: "Our Portfolio", href: "/portfolio" });
  if (path.includes("contact") || path.includes("help") || path.includes("support"))
    suggestions.push({ label: "Support & Contact", href: "/support" });
  if (path.includes("start") || path.includes("quote") || path.includes("book"))
    suggestions.push({ label: "Get Started", href: "/get-started" });
  if (path.includes("login") || path.includes("sign") || path.includes("dash") || path.includes("lounge"))
    suggestions.push({ label: "Sign In", href: "/sign-in" });

  return suggestions;
}

const NotFound = () => {
  const location = useLocation();
  const suggestions = useMemo(() => getSuggestions(location.pathname), [location.pathname]);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <section className="relative flex min-h-[78vh] items-center overflow-hidden py-20">
        <div className="hero-aurora" aria-hidden />
        <div className="container-tight relative z-10">
          <div className="max-w-2xl">
            {/* The lost-satellite moment: an orbit draws itself around the
                numeral, with one plotted point that never arrives. */}
            <div className="relative mb-10 inline-block">
              <span className="select-none font-display text-[7rem] font-semibold uppercase leading-none tracking-[-0.04em] text-foreground sm:text-[10rem]">
                404
              </span>
              <LineDraw
                viewBox="0 0 520 300"
                className="pointer-events-none absolute -inset-x-16 -inset-y-8 h-auto w-[calc(100%+8rem)]"
              >
                <DrawPath
                  d="M 40 150 A 220 105 0 1 1 480 150 A 220 105 0 1 1 40 150"
                  stroke="hsl(var(--foreground))"
                  opacity={0.18}
                  duration={1.8}
                />
                <DrawPath
                  d="M 300 52 Q 400 30 470 92"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.3}
                  opacity={0.85}
                  at={0.9}
                  duration={0.8}
                />
                <DrawPoint cx={300} cy={52} r={3} fill="hsl(var(--primary))" ring at={0.85} />
              </LineDraw>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="mono-label">Off the map</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              This page isn&rsquo;t plotted
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 max-w-md text-sm font-light text-muted-foreground sm:text-base"
            >
              The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
              {location.pathname !== "/" && (
                <span className="mt-2 block truncate font-mono text-xs text-muted-foreground/70">
                  {location.pathname}
                </span>
              )}
            </motion.p>

            {/* URL-aware suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <p className="mono-label mb-3">Were you looking for?</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Button key={s.href} variant="outline" size="sm" asChild className="rounded-full">
                      <Link to={s.href}>
                        {s.label} <ArrowRight className="ml-1 w-3 h-3" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <Button variant="premium" size="lg" asChild>
                <Link to="/">
                  <Home className="mr-2 w-4 h-4" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="mono-label mb-4">Popular pages</p>
              <div className="grid grid-cols-2 border-l border-t border-border/60 sm:grid-cols-3">
                {popularPages.map((page) => (
                  <Link
                    key={page.href}
                    to={page.href}
                    className="flex items-center gap-2 border-b border-r border-border/60 p-3.5 text-sm text-muted-foreground transition-colors duration-300 hover:bg-foreground/[0.02] hover:text-foreground"
                  >
                    <page.icon className="w-4 h-4 shrink-0 text-primary" strokeWidth={1.6} />
                    {page.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
