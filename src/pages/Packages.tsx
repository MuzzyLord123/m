import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ArrowRight,
  Zap,
  Layers,
  FileCode,
  Workflow,
  HelpCircle,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { CustomQuoteModal } from "@/components/packages/CustomQuoteModal";
import { PackageQuiz } from "@/components/packages/PackageQuiz";
import { ResponsiveComparisonTable } from "@/components/packages/ResponsiveComparisonTable";
import { PackagesStickyNav } from "@/components/packages/PackagesStickyNav";
import { TrustBadgesRow } from "@/components/packages/TrustBadgesRow";
import { EnhancedPackageCard } from "@/components/packages/EnhancedPackageCard";
import { EnhancedFAQ } from "@/components/packages/EnhancedFAQ";
import { CostEstimator } from "@/components/marketing/CostEstimator";

/**
 * The full catalogue, rebuilt as a drafting sheet. The old page opened every
 * category with a stock render and floated 24 rounded glass cards; this one
 * numbers the six categories like chapters, sets the cards into shared-hairline
 * matrices, and keeps every working part — quiz, quote modal, comparison
 * table, scroll-spy contents rail, cost estimator — exactly as it was wired.
 */

// Website Packages
const websitePackages = [
  {
    name: "Starter Site",
    subtitle: "Essential Online Presence",
    description: "Perfect for tradesmen, local services, pubs, and small businesses needing a clean, professional online presence.",
    timeline: "3-5 days",
    idealFor: ["Tradesmen & Contractors", "Local Pubs & Cafés", "Freelancers", "Small Service Businesses"],
    features: ["1-2 page responsive website", "Mobile-first design approach", "Contact form with email notifications", "Google Maps integration", "Basic SEO setup", "Fast-loading optimized build", "Clear call-to-action placement", "Social media links"],
    deliverables: ["Complete source code ownership", "Deployment to your hosting", "30-day post-launch support", "Documentation & training"],
    href: "/starter",
    cta: "Get Started",
  },
  {
    name: "Business Site",
    subtitle: "Growing Your Credibility",
    description: "For established local businesses ready to expand their digital footprint with a professional, conversion-focused website.",
    timeline: "1-2 weeks",
    idealFor: ["Growing SMEs", "Professional Services", "Healthcare Practices", "Hospitality Venues"],
    features: ["2-5 page bespoke website", "Custom brand-aligned design", "CMS for easy content updates", "Advanced contact forms", "Blog or news section", "Image galleries", "Testimonials section", "Lead capture integration"],
    deliverables: ["Complete source code ownership", "CMS training session", "SEO optimization package", "60-day post-launch support", "Performance monitoring setup"],
    href: "/growth",
    popular: true,
    cta: "Request Quote",
  },
  {
    name: "Growth Site",
    subtitle: "Scaling Your Business",
    description: "Comprehensive websites for businesses ready to scale, with advanced functionality and conversion optimization.",
    timeline: "2-4 weeks",
    idealFor: ["Multi-Location Businesses", "E-commerce Ready", "Lead Generation Focused", "High-Traffic Sites"],
    features: ["6-12 page dynamic website", "Advanced SEO architecture", "Lead capture & automation", "Content marketing hub", "Analytics dashboard integration", "A/B testing capability", "Speed & performance optimization", "Accessibility compliance (WCAG)"],
    deliverables: ["Complete source code ownership", "Comprehensive documentation", "SEO strategy document", "90-day priority support", "Monthly performance reports"],
    href: "/professional",
    cta: "Book Strategy Call",
  },
  {
    name: "Enterprise",
    subtitle: "Complex & Large-Scale",
    description: "Tailored solutions for enterprises requiring complex functionality, integrations, and ongoing development support.",
    timeline: "4-12 weeks",
    idealFor: ["Large Organizations", "Multi-National Companies", "Complex Integrations", "Custom Requirements"],
    features: ["Unlimited pages & sections", "Custom functionality development", "Third-party API integrations", "Multi-language support", "Advanced security features", "Load balancing & CDN setup", "Custom admin panels", "Ongoing development retainer"],
    deliverables: ["Complete IP & code ownership", "Technical documentation", "Dedicated account manager", "SLA-backed support", "Quarterly strategy reviews"],
    href: "/get-started",
    isEnterprise: true,
    cta: "Contact Us",
  },
];

// Web Application Packages
const appPackages = [
  { name: "MVP Application", subtitle: "Validate Your Idea", description: "Launch a minimum viable product to test your concept with real users before full-scale development.", timeline: "4-6 weeks", idealFor: ["Startups", "New Product Ideas", "Market Validation", "Investor Demos"], features: ["Core feature development", "User authentication system", "Basic dashboard interface", "Mobile-responsive design", "Cloud database integration", "API foundation", "User feedback mechanisms", "Analytics integration"], deliverables: ["Complete source code", "Deployment to cloud hosting", "Technical documentation", "30-day bug fix support"], href: "/apps-dashboards", cta: "Discuss MVP" },
  { name: "Business Application", subtitle: "Streamline Operations", description: "Custom-built applications to automate workflows, manage processes, and improve operational efficiency.", timeline: "8-12 weeks", idealFor: ["Process Automation", "Team Collaboration", "Data Management", "Customer Portals"], features: ["Custom workflow automation", "Role-based access control", "Real-time notifications", "Document management", "Reporting & exports", "Third-party integrations", "Audit logging", "Backup & recovery"], deliverables: ["Complete IP ownership", "Staff training sessions", "Admin documentation", "60-day priority support", "Maintenance plan options"], href: "/apps-dashboards", popular: true, cta: "Get Quote" },
  { name: "Advanced Application", subtitle: "Complex Solutions", description: "Feature-rich applications with advanced integrations, complex workflows, and sophisticated user interfaces.", timeline: "12-20 weeks", idealFor: ["SaaS Foundations", "Multi-Team Tools", "Complex Workflows", "Industry-Specific Apps"], features: ["Advanced state management", "Complex business logic", "Multiple user roles", "Offline capabilities", "Real-time collaboration", "Advanced search & filters", "Custom reporting engine", "Webhook integrations"], deliverables: ["Complete platform ownership", "Architecture documentation", "Comprehensive training", "90-day priority support", "Maintenance options"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Enterprise Platform", subtitle: "Scale Without Limits", description: "Large-scale platforms designed to handle millions of users, complex integrations, and mission-critical operations.", timeline: "20-40 weeks", idealFor: ["SaaS Products", "Marketplace Platforms", "Enterprise Tools", "High-Scale Systems"], features: ["Microservices architecture", "Horizontal scaling capability", "Advanced security protocols", "Multi-tenancy support", "Custom API development", "SSO integration", "Compliance features (GDPR, SOC2)", "Performance monitoring"], deliverables: ["Complete platform ownership", "Architecture documentation", "DevOps setup & training", "SLA-backed support", "Ongoing development options"], href: "/get-started", isEnterprise: true, cta: "Book Consultation" },
];

// Dashboard Packages
const dashboardPackages = [
  { name: "Analytics Dashboard", subtitle: "Visualize Your Data", description: "Transform raw data into actionable insights with beautiful, interactive dashboards tailored to your KPIs.", timeline: "3-5 weeks", idealFor: ["Marketing Teams", "Sales Operations", "Executive Reporting", "Performance Tracking"], features: ["Custom KPI widgets", "Interactive charts & graphs", "Real-time data updates", "Data source connections", "Export capabilities", "Mobile-responsive views", "Date range filtering", "Drill-down functionality"], deliverables: ["Complete dashboard ownership", "Data integration setup", "User training session", "30-day support period"], href: "/apps-dashboards", cta: "Discuss Dashboard" },
  { name: "Operations Dashboard", subtitle: "Command Center View", description: "Centralized operational visibility across your entire business with real-time monitoring and alerts.", timeline: "5-8 weeks", idealFor: ["Operations Managers", "Warehouse Teams", "Production Monitoring", "Service Delivery"], features: ["Multi-source data aggregation", "Real-time status monitoring", "Alert & notification system", "Task management integration", "Team performance metrics", "Historical trend analysis", "Custom report generation", "API data feeds"], deliverables: ["Complete source ownership", "Integration documentation", "Team training package", "45-day priority support"], href: "/apps-dashboards", popular: true, cta: "Get Quote" },
  { name: "BI Dashboard Suite", subtitle: "Multi-Department Analytics", description: "Comprehensive business intelligence dashboards connecting multiple departments and data sources.", timeline: "8-12 weeks", idealFor: ["Multi-Department Orgs", "Data-Driven Companies", "Regional Managers", "Business Analysts"], features: ["Cross-department data views", "Advanced filtering & slicing", "Scheduled report automation", "Embedded analytics", "Custom metric calculations", "Comparison & benchmarking", "Data governance controls", "Mobile app access"], deliverables: ["Complete BI suite ownership", "Multi-team training", "Data dictionary", "60-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Executive Dashboard", subtitle: "Strategic Overview", description: "Board-level dashboards providing comprehensive business intelligence for strategic decision-making.", timeline: "10-16 weeks", idealFor: ["C-Suite Executives", "Board Reporting", "Investor Updates", "Strategic Planning"], features: ["Cross-departmental metrics", "Financial KPI tracking", "Competitive benchmarking", "Predictive analytics", "Automated report scheduling", "Presentation mode", "Secure access controls", "White-label options"], deliverables: ["Complete IP ownership", "Executive training", "Monthly maintenance option", "60-day premium support"], href: "/get-started", isEnterprise: true, cta: "Schedule Call" },
];

// Inventory System Packages
const inventoryPackages = [
  { name: "Stock Manager", subtitle: "Simple Stock Control", description: "Essential inventory tracking for small businesses managing products, supplies, or equipment.", timeline: "3-5 weeks", idealFor: ["Retail Shops", "Small Warehouses", "Equipment Tracking", "Supply Management"], features: ["Product catalog management", "Stock level tracking", "Low stock alerts", "Barcode/QR scanning", "Basic reporting", "Multi-location support", "Supplier management", "Stock adjustment logs"], deliverables: ["Complete system ownership", "Staff training session", "Mobile app access", "30-day support period"], href: "/apps-dashboards", cta: "Get Started" },
  { name: "Inventory Pro", subtitle: "Advanced Stock Control", description: "Enhanced inventory management with automated reordering, batch tracking, and detailed analytics.", timeline: "6-10 weeks", idealFor: ["Growing Retailers", "Multi-Store Businesses", "Wholesale Operations", "Service Companies"], features: ["Automated reorder points", "Batch & lot tracking", "Serial number management", "Advanced reporting", "Purchase order management", "Vendor performance tracking", "Stock valuation methods", "Inventory forecasting"], deliverables: ["Complete system ownership", "Data migration support", "Team training program", "45-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Warehouse System", subtitle: "Full WMS Solution", description: "Comprehensive warehouse management with receiving, picking, packing, and shipping workflow automation.", timeline: "12-18 weeks", idealFor: ["Distribution Centers", "E-commerce Fulfillment", "Manufacturing", "3PL Providers"], features: ["Receiving & put-away workflows", "Pick, pack, ship automation", "Bin/location management", "Wave/batch picking", "Carrier integrations", "Returns processing", "Inventory forecasting", "Performance analytics"], deliverables: ["Complete WMS ownership", "Hardware integration support", "Team training program", "60-day priority support", "Maintenance plan options"], href: "/apps-dashboards", popular: true, cta: "Request Demo" },
  { name: "Enterprise Inventory", subtitle: "Multi-Site Control", description: "Enterprise-grade inventory management across multiple warehouses, channels, and supply chain operations.", timeline: "20-32 weeks", idealFor: ["Multi-Warehouse Operations", "Omnichannel Retail", "Supply Chain", "Global Operations"], features: ["Multi-warehouse sync", "Channel inventory allocation", "Demand forecasting", "Automated reordering", "ERP/accounting integrations", "Advanced analytics & BI", "Compliance & audit trails", "Custom workflow automation"], deliverables: ["Complete platform ownership", "Implementation consulting", "Comprehensive training", "SLA-backed support", "Quarterly reviews"], href: "/get-started", isEnterprise: true, cta: "Contact Us" },
];

// E-Commerce Packages
const ecommercePackages = [
  { name: "Starter Store", subtitle: "Launch Your Shop", description: "Get online quickly with a beautiful, functional e-commerce store for small product catalogs.", timeline: "4-6 weeks", idealFor: ["Artisan Sellers", "Small Product Lines", "Service Add-ons", "Digital Products"], features: ["Up to 50 products", "Secure payment processing", "Order management", "Customer accounts", "Basic shipping setup", "Tax calculation", "Mobile-optimized checkout", "Email notifications"], deliverables: ["Complete store ownership", "Payment gateway setup", "Training documentation", "30-day support period"], href: "/apps-dashboards", cta: "Launch Store" },
  { name: "Business Store", subtitle: "Professional Commerce", description: "Full-featured e-commerce platform with inventory management, marketing tools, and customer engagement.", timeline: "8-12 weeks", idealFor: ["Growing Retailers", "Product-Based Businesses", "Multi-Category Stores", "Service Providers"], features: ["Unlimited products", "Inventory management", "Discount & coupon system", "Customer segmentation", "Email marketing integration", "Product reviews & ratings", "Wishlist functionality", "Advanced shipping rules"], deliverables: ["Complete platform ownership", "Payment & shipping setup", "Staff training sessions", "45-day priority support"], href: "/apps-dashboards", cta: "Get Quote" },
  { name: "Growth Store", subtitle: "Scale Your Sales", description: "Feature-rich e-commerce platform with advanced marketing tools and customer engagement features.", timeline: "12-18 weeks", idealFor: ["Scaling Retailers", "Subscription Products", "B2B Commerce", "Multi-Channel Sellers"], features: ["Advanced inventory sync", "Promotion engine", "Loyalty & rewards program", "Abandoned cart recovery", "Multi-currency support", "Marketplace integrations", "Advanced analytics", "A/B testing capability"], deliverables: ["Complete platform ownership", "Marketing tool integration", "Comprehensive training", "60-day priority support"], href: "/apps-dashboards", popular: true, cta: "Request Quote" },
  { name: "Enterprise Commerce", subtitle: "Omnichannel Platform", description: "Enterprise e-commerce with marketplace capabilities, advanced integrations, and unlimited scalability.", timeline: "20-36 weeks", idealFor: ["High-Volume Retailers", "Marketplace Operators", "Omnichannel Brands", "B2B2C Platforms"], features: ["Multi-vendor marketplace", "Headless commerce API", "ERP & POS integrations", "Advanced personalization", "A/B testing built-in", "Customer loyalty programs", "Advanced analytics", "Custom checkout flows"], deliverables: ["Complete IP ownership", "Technical architecture docs", "Launch support team", "SLA-backed support", "Growth consulting"], href: "/get-started", isEnterprise: true, cta: "Book Consultation" },
];

// CRM & Booking Packages
const crmPackages = [
  { name: "Booking System", subtitle: "Appointment Scheduling", description: "Streamline appointment scheduling with an intuitive booking system for service-based businesses.", timeline: "3-5 weeks", idealFor: ["Salons & Spas", "Healthcare Practices", "Consultants", "Fitness Studios"], features: ["Online booking widget", "Calendar management", "Automated reminders", "Staff scheduling", "Service catalog", "Client history", "Payment collection", "No-show management"], deliverables: ["Complete system ownership", "Website integration", "Staff training", "30-day support period"], href: "/apps-dashboards", cta: "Get Started" },
  { name: "Client CRM", subtitle: "Relationship Management", description: "Comprehensive CRM to manage leads, clients, and sales pipelines with powerful automation.", timeline: "6-10 weeks", idealFor: ["Sales Teams", "Professional Services", "Real Estate", "Financial Services"], features: ["Contact management", "Sales pipeline tracking", "Email integration", "Task & activity logging", "Document storage", "Reporting & analytics", "Custom fields & stages", "Team collaboration"], deliverables: ["Complete CRM ownership", "Data migration support", "Team training program", "60-day priority support"], href: "/apps-dashboards", popular: true, cta: "Request Demo" },
  { name: "Sales Platform", subtitle: "Advanced Sales Tools", description: "Full-featured sales platform with automation, lead scoring, and advanced pipeline management.", timeline: "10-16 weeks", idealFor: ["Scaling Sales Teams", "Multi-Product Companies", "B2B Organizations", "Agency Teams"], features: ["Lead scoring & routing", "Sales automation workflows", "Quote & proposal builder", "Contract management", "Commission tracking", "Territory management", "Advanced forecasting", "Custom integrations"], deliverables: ["Complete platform ownership", "Sales process consulting", "Comprehensive training", "90-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Enterprise CRM", subtitle: "Full Customer Platform", description: "Enterprise customer relationship management with advanced automation, integrations, and intelligence.", timeline: "16-28 weeks", idealFor: ["Large Sales Teams", "Multi-Department CRM", "Complex Sales Cycles", "Enterprise Clients"], features: ["Advanced automation rules", "AI-powered insights", "Marketing automation", "Customer journey mapping", "Territory management", "Forecasting & quotas", "API & webhook support", "Custom integrations"], deliverables: ["Complete platform ownership", "Implementation consulting", "Enterprise training", "SLA-backed support", "Quarterly optimization"], href: "/get-started", isEnterprise: true, cta: "Contact Us" },
];

const categories = [
  { id: "websites", no: "01", name: "Professional Websites", description: "From simple landing pages to complex multi-page sites, we craft websites that convert visitors into customers. Every site is built with modern technology, optimized for speed, and designed to grow with your business.", packages: websitePackages },
  { id: "apps", no: "02", name: "Custom Web Applications", description: "Transform your business with bespoke web applications. Whether you're launching a startup MVP or building enterprise-grade platforms, we create scalable solutions that solve real problems.", packages: appPackages },
  { id: "dashboards", no: "03", name: "Business Dashboards", description: "Turn your data into actionable insights with custom dashboards. From marketing analytics to executive reporting, we build visualization tools that help you make better decisions faster.", packages: dashboardPackages },
  { id: "inventory", no: "04", name: "Inventory & Warehouse Systems", description: "Take control of your stock with custom inventory management. From simple stock tracking to full warehouse management systems, we build solutions that optimize your operations.", packages: inventoryPackages },
  { id: "ecommerce", no: "05", name: "E-Commerce Platforms", description: "Launch and scale your online store with custom e-commerce solutions. We build platforms that provide seamless shopping experiences and powerful back-office tools.", packages: ecommercePackages },
  { id: "crm", no: "06", name: "CRM & Booking Systems", description: "Manage customer relationships and streamline scheduling with purpose-built systems. From simple booking widgets to full CRM platforms, we help you build lasting customer connections.", packages: crmPackages },
];

const processSteps = [
  { icon: Workflow, title: "Discovery & Strategy", description: "We learn about your business, goals, and requirements to create a tailored solution plan." },
  { icon: Layers, title: "Design & Prototype", description: "Interactive designs and prototypes let you see and refine your project before development begins." },
  { icon: FileCode, title: "Build & Refine", description: "Agile development with regular updates ensures your project evolves exactly as you envision." },
  { icon: Zap, title: "Launch & Support", description: "Seamless deployment followed by ongoing support to ensure long-term success." },
];

// Category section — numbered like a chapter, cards in a shared-hairline matrix.
function CategorySection({
  category,
  onEnterpriseClick,
}: {
  category: (typeof categories)[number];
  onEnterpriseClick?: (packageName: string) => void;
}) {
  return (
    <div>
      <Reveal className="mb-10 grid gap-6 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-primary">{category.no}</span>
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">The catalogue</span>
          </div>
          <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
            {category.name}
          </h2>
        </div>
        <p className="max-w-prose text-[15px] font-light leading-relaxed text-muted-foreground lg:col-span-7 lg:pt-12">
          {category.description}
        </p>
      </Reveal>

      <div className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2 xl:grid-cols-4">
        {category.packages.map((pkg, index) => (
          <EnhancedPackageCard
            key={pkg.name}
            pkg={pkg}
            index={index}
            onEnterpriseClick={onEnterpriseClick}
          />
        ))}
      </div>
    </div>
  );
}

export default function Packages() {
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("Enterprise");

  const handleEnterpriseClick = (packageName: string) => {
    setSelectedPackage(packageName);
    setQuoteModalOpen(true);
  };

  return (
    <Layout>
      {/* Custom Quote Modal */}
      <CustomQuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        packageType={selectedPackage}
      />

      <PageHero
        eyebrow="The catalogue"
        index="02"
        crumbs={[{ label: "Home", href: "/" }, { label: "Packages" }]}
        title="Digital solutions"
        highlight="tailored to you."
        body="From professional websites to enterprise applications, dashboards, inventory systems, and beyond — we build digital infrastructure that scales with your business. Free preview included with every package."
        aside={
          <PageHeroFacts
            facts={[
              { value: "06", label: "Categories" },
              { value: "24", label: "Packages" },
              { value: "£0", label: "Design preview" },
            ]}
          />
        }
      />

      {/* Scroll-spy contents rail */}
      <PackagesStickyNav />

      {/* Package Finder Quiz */}
      <section className="section-padding border-b border-border/60">
        <div className="container-tight">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-5">
              <div className="mb-6 flex items-center gap-3">
                <HelpCircle className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="eyebrow">Package finder</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Not sure which
                <span className="block text-primary">fits best?</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Answer a few quick questions and we&rsquo;ll recommend the perfect package for your
                needs. Takes less than a minute.
              </p>
              <ul className="mt-7 space-y-2.5">
                {["Personalized recommendation", "Based on your business needs", "Quick 4-question quiz"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-light text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="border border-border/60 p-4 md:p-6 lg:col-span-7">
              <PackageQuiz />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Website Packages */}
      <section id="websites" className="section-padding scroll-mt-32">
        <div className="container-tight">
          <CategorySection category={categories[0]} onEnterpriseClick={handleEnterpriseClick} />
        </div>
      </section>

      {/* Website Comparison Table */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Feature comparison</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Compare website tiers
              </h2>
              <span className="mono-label hidden sm:block">Line by line</span>
            </div>
          </Reveal>
          <ResponsiveComparisonTable />
        </div>
      </section>

      {/* Trust strip */}
      <TrustBadgesRow />

      {/* Remaining categories */}
      {categories.slice(1).map((category) => (
        <section
          key={category.id}
          id={category.id}
          className="section-padding scroll-mt-32 border-t border-border/60 first:border-t-0"
        >
          <div className="container-tight">
            <CategorySection category={category} onEnterpriseClick={handleEnterpriseClick} />
          </div>
        </section>
      ))}

      {/* How It Works */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The method</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                How we work
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                A transparent, collaborative process from concept to launch and beyond.
              </p>
            </div>
          </Reveal>

          <Matrix cols={4}>
            {processSteps.map((item, index) => (
              <MatrixCell key={item.title} icon={item.icon} index={index} title={item.title}>
                {item.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* FAQ with Search */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Straight answers</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Asked before
                <span className="block text-primary">you ask.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                Quick answers to common questions about our packages and process.
              </p>
            </Reveal>
            <div className="lg:col-span-8">
              <EnhancedFAQ />
            </div>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Ready to build something
                <span className="block text-primary">exceptional?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Tell us about your project and get a tailored proposal. No commitment, no pressure —
                just a conversation about how we can help.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Start your project
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/portfolio" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                View our work
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cost Estimator */}
      <CostEstimator />
    </Layout>
  );
}
