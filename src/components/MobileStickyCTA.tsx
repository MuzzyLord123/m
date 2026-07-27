import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollIdle } from "@/hooks/useScrollIdle";

export function MobileStickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isNearCTA, setIsNearCTA] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isScrollIdle = useScrollIdle();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Observe all page-level CTA sections to hide sticky when near them
    const ctaSections = document.querySelectorAll('[id*="cta"], [id*="get-started"], section:last-of-type');
    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some(e => e.isIntersecting);
        setIsNearCTA(anyVisible);
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    ctaSections.forEach(el => observer.observe(el));

    const handleScroll = () => {
      const heroHeight = window.innerHeight * 0.8;
      setIsVisible(window.scrollY > heroHeight);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const shouldShow = isVisible && isScrollIdle && !isNearCTA;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1, scale: 0.8, x: "-50%" } : { opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
          exit={prefersReducedMotion ? { opacity: 0, x: "-50%" } : { opacity: 0, scale: 0.8, y: 20, x: "-50%" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <Link to="/get-started">
            <Button 
              variant="hero" 
              size="default" 
              className="rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-shadow"
            >
              Book Free Consultation
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
