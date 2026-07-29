import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Search, Package, Globe, Users, HelpCircle, FileText } from "lucide-react";

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
      <section className="min-h-[70vh] flex items-center py-20">
        <div className="container-tight">
          <div className="max-w-2xl">
            {/* Animated 404 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <span className="text-[8rem] sm:text-[10rem] font-bold leading-none text-gradient select-none">
                404
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl sm:text-3xl font-bold mb-3"
            >
              Page Not Found
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-sm sm:text-base mb-8 max-w-md"
            >
              The page you're looking for doesn't exist or may have moved.
              {location.pathname !== "/" && (
                <span className="block mt-1 text-xs text-muted-foreground/60 font-mono truncate">
                  {location.pathname}
                </span>
              )}
            </motion.p>

            {/* URL-aware suggestions */}
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
              >
                <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                  Were you looking for?
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Button key={s.href} variant="outline" size="sm" asChild className="rounded-full">
                      <Link to={s.href}>
                        {s.label} <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Go Home CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-12"
            >
              <Button variant="premium" size="lg" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </motion.div>

            {/* Popular pages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-semibold">
                Popular Pages
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {popularPages.map((page) => (
                  <Link
                    key={page.href}
                    to={page.href}
                    className="flex items-center gap-2 p-3 rounded-xl liquid-glass-subtle hover:bg-accent/10 transition-colors text-sm text-muted-foreground hover:text-foreground"
                  >
                    <page.icon className="w-4 h-4 text-primary shrink-0" />
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
