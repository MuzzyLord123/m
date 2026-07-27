import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
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
      {/* Centered Category Navigation */}
      <nav 
        className="py-6"
        aria-label="Package categories"
      >
        <div className="container-tight">
          {/* Category Links - Centered */}
          <div className="flex justify-center">
            <div className="flex gap-2 flex-wrap justify-center px-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeSection === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => scrollToSection(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{cat.name}</span>
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
        <a 
          href="https://wa.me/447000000000?text=Hi,%20I%20need%20help%20choosing%20a%20package" 
          target="_blank" 
          rel="noopener noreferrer"
          aria-label="Need help choosing? Contact us on WhatsApp"
          className="h-12 px-5 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex items-center gap-2 font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Need Help?</span>
        </a>
      </motion.div>
    </>
  );
}
