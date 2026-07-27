import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Clock, ChevronDown, ChevronUp, Users } from "lucide-react";
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
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={prefersReducedMotion ? {} : { y: -4, transition: { duration: 0.3 } }}
      className={cn(
        "relative p-4 md:p-6 rounded-3xl border transition-all duration-300 h-full flex flex-col group",
        pkg.popular 
          ? "border-primary/50 shadow-xl shadow-primary/15 bg-gradient-to-b from-primary/5 to-transparent" 
          : pkg.isEnterprise
          ? "border-border/50 bg-gradient-to-br from-background to-muted/30"
          : "border-border/50 hover:border-primary/30 hover:shadow-lg"
      )}
    >
      {/* Most Popular Badge with Glow */}
      {pkg.popular && (
        <div className="absolute -top-3 left-4 md:left-6 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-md opacity-50 rounded-full" />
            <span className="relative px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg">
              Most Popular
            </span>
          </div>
        </div>
      )}

      {/* Timeline Badge - Top Right */}
      <div className="absolute -top-2 right-4 md:right-6">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border/50 text-xs">
          <Clock className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">{pkg.timeline}</span>
        </div>
      </div>
      
      <div className="flex flex-col h-full pt-4">
        <h3 className="font-display font-bold text-xl md:text-2xl mb-1">{pkg.name}</h3>
        <p className="text-sm text-primary font-medium mb-2">{pkg.subtitle}</p>
        
        {/* Price Indicator */}
        {pkg.price && (
          <p className="text-lg font-bold text-foreground mb-3">
            {pkg.price}
          </p>
        )}
        
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{pkg.description}</p>
        
        {/* Ideal For - Pill Tags */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ideal For</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pkg.idealFor.slice(0, 3).map((item) => (
              <span 
                key={item} 
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {item}
              </span>
            ))}
            {pkg.idealFor.length > 3 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                +{pkg.idealFor.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        {/* Collapsible Features Section on Mobile */}
        <div className="mb-4 flex-1">
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="flex items-center justify-between w-full text-left md:cursor-default"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What's Included</p>
            <span className="md:hidden">
              {showFeatures ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
                "space-y-2 mt-3 overflow-hidden",
                "md:!h-auto md:!opacity-100" // Always show on desktop
              )}
            >
              {pkg.features.map((feature, idx) => (
                <li 
                  key={feature} 
                  className={cn(
                    "flex items-start gap-2 text-sm py-1.5 px-2 rounded-lg",
                    idx % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                  )}
                >
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </motion.ul>
          </AnimatePresence>
        </div>
        
        {/* Deliverables */}
        <div className="mb-4 p-3 md:p-4 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Deliverables</p>
          <ul className="space-y-1">
            {pkg.deliverables.slice(0, 3).map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                <span className="line-clamp-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* CTA Button with Hover Effect */}
        {pkg.isEnterprise ? (
          <Button
            variant="outline"
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
            onClick={handleClick}
            aria-label={`Contact us about ${pkg.name}`}
          >
            Get Package Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            variant={pkg.popular ? "hero" : "outline"}
            className={cn(
              "w-full transition-all duration-300",
              !pkg.popular && "group-hover:bg-primary group-hover:text-primary-foreground"
            )}
            asChild
          >
            <Link to={pkg.href} aria-label={`Get details for ${pkg.name}`}>
              Get Package Details
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
