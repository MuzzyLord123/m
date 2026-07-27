import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

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
  { id: "starter", name: "Starter Site", href: "/starter", subtitle: "Essential" },
  { id: "business", name: "Business Site", href: "/growth", subtitle: "Growing", popular: true },
  { id: "growth", name: "Growth Site", href: "/professional", subtitle: "Scaling" },
  { id: "enterprise", name: "Enterprise", href: "/get-started", subtitle: "Complex" },
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
      <Check className="w-5 h-5 text-primary mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

export function ComparisonTable() {
  return (
    <div className="space-y-6">
      {/* Header - sticky on scroll */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr>
              <th className="text-left py-4 px-4 w-[280px]">
                <span className="text-sm text-muted-foreground font-normal">Compare Features</span>
              </th>
              {packages.map((pkg) => (
                <th key={pkg.id} className="text-center py-4 px-2 w-[150px]">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`p-4 rounded-2xl ${
                      pkg.popular 
                        ? "bg-primary/10 border-2 border-primary" 
                        : "bg-muted/50 border border-border/50"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                        Popular
                      </span>
                    )}
                    <p className="font-display font-bold text-sm">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.subtitle}</p>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedFeatures).map(([category, features], categoryIndex) => (
              <>
                {/* Category Header */}
                <tr key={`category-${category}`}>
                  <td 
                    colSpan={5} 
                    className="py-4 px-4 bg-muted/30 font-display font-semibold text-sm"
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
                    className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm">{feature.name}</td>
                    <td className="py-3 px-2 text-center">
                      <FeatureValue value={feature.starter} />
                    </td>
                    <td className="py-3 px-2 text-center bg-primary/5">
                      <FeatureValue value={feature.business} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <FeatureValue value={feature.growth} />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <FeatureValue value={feature.enterprise} />
                    </td>
                  </motion.tr>
                ))}
              </>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="py-6 px-4"></td>
              {packages.map((pkg) => (
                <td key={pkg.id} className="py-6 px-2 text-center">
                  <Button
                    variant={pkg.popular ? "hero" : "outline"}
                    size="sm"
                    asChild
                    className="w-full"
                  >
                    <Link to={pkg.href}>
                      {pkg.id === "enterprise" ? "Contact Us" : "Learn More"}
                    </Link>
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile-friendly cards below table */}
      <div className="lg:hidden text-center pt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Scroll horizontally to view all packages →
        </p>
      </div>
    </div>
  );
}
