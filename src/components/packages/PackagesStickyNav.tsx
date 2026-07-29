import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useScrollIdle } from "@/hooks/useScrollIdle";
import { 
  Globe, 
  Laptop, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  ChevronUp,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "websites", name: "Websites", icon: Globe },
  { id: "apps", name: "Applications", icon: Laptop },
  { id: "dashboards", name: "Dashboards", icon: LayoutDashboard },
  { id: "inventory", name: "Inventory", icon: Package },
  { id: "ecommerce", name: "E-Commerce", icon: ShoppingCart },
  { id: "crm", name: "CRM", icon: Users },
];

export function PackagesStickyNav() {
  const [activeSection, setActiveSection] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showHelpButton, setShowHelpButton] = useState(false);
  const isScrollIdle = useScrollIdle();

  useEffect(() => {
    const handleScroll = () => {
      const sections = categories.map(cat => ({
        id: cat.id,
        element: document.getElementById(cat.id)
      })).filter(s => s.element);

      // Find active section
      for (const section of sections) {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section.id);
            break;
          }
        }
      }

      // Show back to top after scrolling past first section
      const firstSection = document.getElementById("websites");
      if (firstSection) {
        const rect = firstSection.getBoundingClientRect();
        setShowBackToTop(rect.top < -200);
        setShowHelpButton(rect.top < -100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 150; // Account for sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Category index — a contents rail in the ledger voice, not pill chips */}
      <nav
        className="border-b border-border/60"
        aria-label="Package categories"
      >
        <div className="container-tight">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex min-w-max items-stretch gap-6 sm:gap-8">
              {categories.map((cat, i) => {
                const isActive = activeSection === cat.id;

                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={cn(
                      "group relative flex items-baseline gap-2 whitespace-nowrap py-4 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 sm:text-[11px]",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={cn("tabular-nums", isActive ? "text-primary" : "text-muted-foreground")}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{cat.name}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-px origin-left bg-primary transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                        isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Back to Top Button - bottom-left corner */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: showBackToTop && isScrollIdle ? 1 : 0, 
          scale: showBackToTop && isScrollIdle ? 1 : 0.8,
          pointerEvents: showBackToTop && isScrollIdle ? "auto" : "none"
        }}
        onClick={scrollToTop}
        className="fixed bottom-6 left-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-110 transition-transform"
        aria-label="Back to top"
      >
        <ChevronUp className="w-5 h-5" />
      </motion.button>

      {/* Need Help Floating Button - Centered */}
      <motion.div
        initial={{ opacity: 0, y: 20, x: "-50%" }}
        animate={{ 
          opacity: showHelpButton && isScrollIdle ? 1 : 0, 
          y: showHelpButton && isScrollIdle ? 0 : 20,
          x: "-50%",
          pointerEvents: showHelpButton && isScrollIdle ? "auto" : "none"
        }}
        className="fixed bottom-6 left-1/2 z-50"
      >
        {/* Was a placeholder WhatsApp number (wa.me/447000000000) — a contact
            route that went nowhere. Points at the real enquiry form instead.
            See PLACEHOLDERS.md. */}
        <Link
          to="/get-started"
          aria-label="Need help choosing? Send us an enquiry"
          className="h-12 px-5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center gap-2 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Need Help?</span>
        </Link>
      </motion.div>
    </>
  );
}
