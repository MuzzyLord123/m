import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Package {
  name: string;
  subtitle: string;
  description: string;
  timeline: string;
  price?: string;
  idealFor: string[];
  features: string[];
  deliverables: string[];
  href: string;
  cta: string;
  popular?: boolean;
  isEnterprise?: boolean;
}

interface EnhancedPackageCardProps {
  pkg: Package;
  index: number;
  onEnterpriseClick?: (packageName: string) => void;
}

/**
 * Restyled to the hairline-matrix language: cells share borders instead of
 * floating as rounded glass cards, the popular tier carries a standing ember
 * top rule, and labels are set in the mono ledger voice. All behaviour is
 * unchanged — mobile collapsible features, enterprise click-through to the
 * quote modal.
 */
export function EnhancedPackageCard({ pkg, index, onEnterpriseClick }: EnhancedPackageCardProps) {
  const [showFeatures, setShowFeatures] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const handleClick = (e: React.MouseEvent) => {
    if (pkg.isEnterprise && onEnterpriseClick) {
      e.preventDefault();
      onEnterpriseClick(pkg.name);
    }
  };

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex h-full flex-col overflow-hidden border-b border-r border-border/60 bg-background p-6 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-7"
    >
      {/* Ember top rule: standing for the popular tier, drawn on hover elsewhere */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-0 top-0 h-px origin-left bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          pkg.popular ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        )}
      />

      <div className="mb-5 flex items-baseline justify-between gap-4">
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
        {pkg.popular ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
            Most popular
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            {pkg.timeline}
          </span>
        )}
      </div>

      <h3 className="font-display text-xl font-semibold tracking-tight">{pkg.name}</h3>
      <p className="mt-0.5 text-xs font-medium text-primary">{pkg.subtitle}</p>
      {pkg.popular && (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {pkg.timeline}
        </p>
      )}

      <p className="mt-3 text-sm font-light leading-relaxed text-muted-foreground">{pkg.description}</p>

      {/* Ideal for */}
      <div className="mt-5">
        <p className="mono-label mb-2">Ideal for</p>
        <p className="text-xs font-light leading-relaxed text-muted-foreground">
          {pkg.idealFor.slice(0, 3).join(" · ")}
          {pkg.idealFor.length > 3 && ` · +${pkg.idealFor.length - 3} more`}
        </p>
      </div>

      {/* Collapsible features section on mobile */}
      <div className="mt-5 flex-1">
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className="flex w-full items-center justify-between text-left md:cursor-default"
        >
          <p className="mono-label">What&rsquo;s included</p>
          <span className="md:hidden">
            {showFeatures ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
        </button>

        {/* Always visible on desktop, collapsible on mobile */}
        <AnimatePresence>
          <motion.ul
            initial={false}
            animate={{
              height: showFeatures ? "auto" : (typeof window !== 'undefined' && window.innerWidth >= 768) ? "auto" : 0,
              opacity: showFeatures ? 1 : (typeof window !== 'undefined' && window.innerWidth >= 768) ? 1 : 0
            }}
            className={cn(
              "mt-2 overflow-hidden",
              "md:!h-auto md:!opacity-100" // Always show on desktop
            )}
          >
            {pkg.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 border-b border-border/40 py-2 text-sm last:border-b-0"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" strokeWidth={2.2} />
                <span className="font-light text-muted-foreground">{feature}</span>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {/* Deliverables */}
      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="mono-label mb-2 text-primary">Deliverables</p>
        <ul className="space-y-1.5">
          {pkg.deliverables.slice(0, 3).map((item) => (
            <li key={item} className="flex items-center gap-2 text-xs font-light text-muted-foreground">
              <div className="h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
              <span className="line-clamp-1">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-6">
        {pkg.isEnterprise ? (
          <Button
            variant="outline"
            className="w-full transition-all duration-300 group-hover:border-primary/40"
            onClick={handleClick}
            aria-label={`Contact us about ${pkg.name}`}
          >
            Get package details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        ) : (
          <Button
            variant={pkg.popular ? "premium" : "outline"}
            className={cn(
              "w-full transition-all duration-300",
              !pkg.popular && "group-hover:border-primary/40"
            )}
            asChild
          >
            <Link to={pkg.href} aria-label={`Get details for ${pkg.name}`}>
              Get package details
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
