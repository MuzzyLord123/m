import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComparisonFeature {
  name: string;
  category: string;
  starter: boolean | string;
  business: boolean | string;
  growth: boolean | string;
  enterprise: boolean | string;
}

const comparisonFeatures: ComparisonFeature[] = [
  // Pages & Structure
  { name: "Number of Pages", category: "Pages & Structure", starter: "1-2", business: "2-5", growth: "6-12", enterprise: "Unlimited" },
  { name: "Custom Page Layouts", category: "Pages & Structure", starter: false, business: true, growth: true, enterprise: true },
  { name: "Blog / Content Hub", category: "Pages & Structure", starter: false, business: false, growth: true, enterprise: true },
  
  // Design & UX
  { name: "Mobile-Responsive Design", category: "Design & UX", starter: true, business: true, growth: true, enterprise: true },
  { name: "Bespoke Brand Design", category: "Design & UX", starter: false, business: true, growth: true, enterprise: true },
  { name: "Custom Animations", category: "Design & UX", starter: false, business: false, growth: true, enterprise: true },
  { name: "Accessibility (WCAG)", category: "Design & UX", starter: false, business: false, growth: true, enterprise: true },
  
  // Functionality
  { name: "Contact Form", category: "Functionality", starter: true, business: true, growth: true, enterprise: true },
  { name: "CMS for Easy Edits", category: "Functionality", starter: false, business: true, growth: true, enterprise: true },
  { name: "Lead Capture & Automation", category: "Functionality", starter: false, business: false, growth: true, enterprise: true },
  { name: "Custom Functionality", category: "Functionality", starter: false, business: false, growth: false, enterprise: true },
  { name: "Third-Party Integrations", category: "Functionality", starter: false, business: false, growth: "Basic", enterprise: "Advanced" },
  
  // SEO & Performance
  { name: "Basic SEO Setup", category: "SEO & Performance", starter: true, business: true, growth: true, enterprise: true },
  { name: "Advanced SEO Architecture", category: "SEO & Performance", starter: false, business: false, growth: true, enterprise: true },
  { name: "Performance Optimization", category: "SEO & Performance", starter: true, business: true, growth: "Advanced", enterprise: "Advanced" },
  { name: "A/B Testing Capability", category: "SEO & Performance", starter: false, business: false, growth: true, enterprise: true },
  
  // Support & Delivery
  { name: "Typical Delivery Time", category: "Support & Delivery", starter: "3-5 days", business: "1-2 weeks", growth: "2-4 weeks", enterprise: "4-12 weeks" },
  { name: "Post-Launch Support", category: "Support & Delivery", starter: "30 days", business: "60 days", growth: "90 days", enterprise: "SLA-backed" },
  { name: "Documentation & Training", category: "Support & Delivery", starter: true, business: true, growth: true, enterprise: true },
  { name: "Dedicated Account Manager", category: "Support & Delivery", starter: false, business: false, growth: false, enterprise: true },
  
  // Ownership
  { name: "Complete Code Ownership", category: "Ownership", starter: true, business: true, growth: true, enterprise: true },
  { name: "GitHub Repository Transfer", category: "Ownership", starter: true, business: true, growth: true, enterprise: true },
];

const packages = [
  { id: "starter", name: "Starter Site", price: "Custom Quote", href: "/starter", subtitle: "Essential" },
  { id: "business", name: "Business Site", price: "Custom Quote", href: "/growth", subtitle: "Growing", popular: true },
  { id: "growth", name: "Growth Site", price: "Custom Quote", href: "/professional", subtitle: "Scaling" },
  { id: "enterprise", name: "Enterprise", price: "Custom Quote", href: "/get-started", subtitle: "Complex" },
];

// Group features by category
const groupedFeatures = comparisonFeatures.reduce((acc, feature) => {
  if (!acc[feature.category]) {
    acc[feature.category] = [];
  }
  acc[feature.category].push(feature);
  return acc;
}, {} as Record<string, ComparisonFeature[]>);

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-primary mx-auto" aria-label="Included" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" aria-label="Not included" />
    );
  }
  return <span className="text-sm font-medium text-center block">{value}</span>;
}

// Mobile Accordion Card for each package
function MobilePackageAccordion({ 
  pkg, 
  features 
}: { 
  pkg: typeof packages[0]; 
  features: ComparisonFeature[];
}) {
  const [isOpen, setIsOpen] = useState(pkg.popular);

  const getFeatureValue = (feature: ComparisonFeature) => {
    const key = pkg.id as keyof Pick<ComparisonFeature, 'starter' | 'business' | 'growth' | 'enterprise'>;
    return feature[key];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-300",
        pkg.popular 
          ? "border-primary/50 shadow-lg shadow-primary/10" 
          : "border-border/50"
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full p-4 flex items-center justify-between text-left",
          pkg.popular ? "bg-primary/10" : "bg-muted/30"
        )}
        aria-expanded={isOpen}
        aria-label={`${pkg.name} features`}
      >
        <div>
          {pkg.popular && (
            <span className="inline-block px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-1 animate-pulse">
              Most Popular
            </span>
          )}
          <h3 className="font-display font-bold text-lg">{pkg.name}</h3>
          <p className="text-primary font-semibold">{pkg.price}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {category}
                  </h4>
                  <ul className="space-y-2">
                    {categoryFeatures.map((feature) => {
                      const value = getFeatureValue(feature);
                      const isIncluded = value === true || (typeof value === "string" && value.length > 0);
                      
                      return (
                        <li 
                          key={feature.name}
                          className={cn(
                            "flex items-center justify-between py-2 px-3 rounded-lg text-sm",
                            isIncluded ? "bg-primary/5" : "bg-muted/30"
                          )}
                        >
                          <span className={isIncluded ? "text-foreground" : "text-muted-foreground"}>
                            {feature.name}
                          </span>
                          <span className="flex-shrink-0 ml-2">
                            {typeof value === "boolean" ? (
                              value ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <X className="w-4 h-4 text-muted-foreground/30" />
                              )
                            ) : (
                              <span className="text-primary font-medium text-xs">{value}</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <Button
                variant={pkg.popular ? "hero" : "outline"}
                className="w-full mt-4"
                asChild
              >
                <Link to={pkg.href} aria-label={`Get ${pkg.name} package details`}>
                  Get Package Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ResponsiveComparisonTable() {
  return (
    <div className="space-y-6">
      {/* Mobile: Accordion Cards */}
      <div className="lg:hidden space-y-4">
        {packages.map((pkg) => (
          <MobilePackageAccordion 
            key={pkg.id} 
            pkg={pkg} 
            features={comparisonFeatures}
          />
        ))}
      </div>

      {/* Desktop: Sticky Header Table */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border/50">
        <table className="w-full min-w-[900px]">
          <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
            <tr className="border-b border-border/50">
              <th className="text-left py-4 px-6 w-[280px] sticky left-0 bg-background/95 backdrop-blur-sm z-20">
                <span className="text-sm text-muted-foreground font-normal">Compare Features</span>
              </th>
              {packages.map((pkg) => (
                <th key={pkg.id} className="text-center py-4 px-4 w-[180px]">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={cn(
                      "p-4 rounded-2xl relative",
                      pkg.popular 
                        ? "bg-primary/10 border-2 border-primary shadow-lg shadow-primary/20" 
                        : "bg-muted/50 border border-border/50"
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap shadow-lg animate-pulse">
                        Most Popular
                      </span>
                    )}
                    <p className="font-display font-bold text-base mt-1">{pkg.name}</p>
                    <p className="text-primary font-semibold text-sm">{pkg.price}</p>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedFeatures).map(([category, features]) => (
              <>
                {/* Category Header */}
                <tr key={`category-${category}`}>
                  <td 
                    colSpan={5} 
                    className="py-3 px-6 bg-muted/50 font-display font-semibold text-sm sticky left-0"
                  >
                    {category}
                  </td>
                </tr>
                {/* Features */}
                {features.map((feature, featureIndex) => (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: featureIndex * 0.02 }}
                    className={cn(
                      "border-b border-border/20 transition-colors",
                      featureIndex % 2 === 0 ? "bg-transparent" : "bg-muted/20"
                    )}
                  >
                    <td className="py-3 px-6 text-sm sticky left-0 bg-inherit">{feature.name}</td>
                    <td className="py-3 px-4 text-center">
                      <FeatureValue value={feature.starter} />
                    </td>
                    <td className="py-3 px-4 text-center bg-primary/5">
                      <FeatureValue value={feature.business} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FeatureValue value={feature.growth} />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <FeatureValue value={feature.enterprise} />
                    </td>
                  </motion.tr>
                ))}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-muted/30">
              <td className="py-6 px-6 sticky left-0 bg-muted/30"></td>
              {packages.map((pkg) => (
                <td key={pkg.id} className="py-6 px-4 text-center">
                  <Button
                    variant={pkg.popular ? "hero" : "outline"}
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link to={pkg.href} aria-label={`Get ${pkg.name} package details`}>
                      Get Details
                    </Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
