import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Check, 
  ArrowRight, 
  Globe, 
  Laptop, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Clock,
  Zap,
  Shield,
  Heart,
  Code,
  Layers,
  FileCode,
  Workflow,
  HelpCircle,
  Table2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CustomQuoteModal } from "@/components/packages/CustomQuoteModal";
import { PackageQuiz } from "@/components/packages/PackageQuiz";
import { ResponsiveComparisonTable } from "@/components/packages/ResponsiveComparisonTable";
import { PackagesStickyNav } from "@/components/packages/PackagesStickyNav";
import { TrustBadgesRow } from "@/components/packages/TrustBadgesRow";
import { SocialProofRotator } from "@/components/packages/SocialProofRotator";

import { EnhancedPackageCard } from "@/components/packages/EnhancedPackageCard";
import { EnhancedFAQ } from "@/components/packages/EnhancedFAQ";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useInViewport } from "@/hooks/useInViewport";
import { CostEstimator } from "@/components/marketing/CostEstimator";

// Import package images
import websitesImg from "@/assets/packages-websites.jpg";
import appsImg from "@/assets/packages-apps.jpg";
import dashboardsImg from "@/assets/packages-dashboards.jpg";
import inventoryImg from "@/assets/packages-inventory.jpg";
import crmImg from "@/assets/packages-crm.jpg";
import ecommerceImg from "@/assets/packages-ecommerce.jpg";

// Package Categories
const packageCategories = [
  { id: "websites", name: "Websites", icon: Globe, description: "Professional websites for every business", image: websitesImg },
  { id: "apps", name: "Web Applications", icon: Laptop, description: "Custom-built applications for complex needs", image: appsImg },
  { id: "dashboards", name: "Dashboards", icon: LayoutDashboard, description: "Data visualization & business intelligence", image: dashboardsImg },
  { id: "inventory", name: "Inventory Systems", icon: Package, description: "Stock management & warehouse solutions", image: inventoryImg },
  { id: "ecommerce", name: "E-Commerce", icon: ShoppingCart, description: "Online stores & retail platforms", image: ecommerceImg },
  { id: "crm", name: "CRM & Booking", icon: Users, description: "Customer management & scheduling", image: crmImg },
];

// Website Packages with prices
const websitePackages = [
  {
    name: "Starter Site",
    subtitle: "Essential Online Presence",
    description: "Perfect for tradesmen, local services, pubs, and small businesses needing a clean, professional online presence.",
    timeline: "3-5 days",
    price: "Custom Quote",
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
    price: "Custom Quote",
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
    price: "Custom Quote",
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
    price: "Custom Quote",
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
  { name: "MVP Application", subtitle: "Validate Your Idea", description: "Launch a minimum viable product to test your concept with real users before full-scale development.", timeline: "4-6 weeks", price: "Custom Quote", idealFor: ["Startups", "New Product Ideas", "Market Validation", "Investor Demos"], features: ["Core feature development", "User authentication system", "Basic dashboard interface", "Mobile-responsive design", "Cloud database integration", "API foundation", "User feedback mechanisms", "Analytics integration"], deliverables: ["Complete source code", "Deployment to cloud hosting", "Technical documentation", "30-day bug fix support"], href: "/apps-dashboards", cta: "Discuss MVP" },
  { name: "Business Application", subtitle: "Streamline Operations", description: "Custom-built applications to automate workflows, manage processes, and improve operational efficiency.", timeline: "8-12 weeks", price: "Custom Quote", idealFor: ["Process Automation", "Team Collaboration", "Data Management", "Customer Portals"], features: ["Custom workflow automation", "Role-based access control", "Real-time notifications", "Document management", "Reporting & exports", "Third-party integrations", "Audit logging", "Backup & recovery"], deliverables: ["Complete IP ownership", "Staff training sessions", "Admin documentation", "60-day priority support", "Maintenance plan options"], href: "/apps-dashboards", popular: true, cta: "Get Quote" },
  { name: "Advanced Application", subtitle: "Complex Solutions", description: "Feature-rich applications with advanced integrations, complex workflows, and sophisticated user interfaces.", timeline: "12-20 weeks", price: "Custom Quote", idealFor: ["SaaS Foundations", "Multi-Team Tools", "Complex Workflows", "Industry-Specific Apps"], features: ["Advanced state management", "Complex business logic", "Multiple user roles", "Offline capabilities", "Real-time collaboration", "Advanced search & filters", "Custom reporting engine", "Webhook integrations"], deliverables: ["Complete platform ownership", "Architecture documentation", "Comprehensive training", "90-day priority support", "Maintenance options"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Enterprise Platform", subtitle: "Scale Without Limits", description: "Large-scale platforms designed to handle millions of users, complex integrations, and mission-critical operations.", timeline: "20-40 weeks", price: "Custom Quote", idealFor: ["SaaS Products", "Marketplace Platforms", "Enterprise Tools", "High-Scale Systems"], features: ["Microservices architecture", "Horizontal scaling capability", "Advanced security protocols", "Multi-tenancy support", "Custom API development", "SSO integration", "Compliance features (GDPR, SOC2)", "Performance monitoring"], deliverables: ["Complete platform ownership", "Architecture documentation", "DevOps setup & training", "SLA-backed support", "Ongoing development options"], href: "/get-started", isEnterprise: true, cta: "Book Consultation" },
];

// Dashboard Packages
const dashboardPackages = [
  { name: "Analytics Dashboard", subtitle: "Visualize Your Data", description: "Transform raw data into actionable insights with beautiful, interactive dashboards tailored to your KPIs.", timeline: "3-5 weeks", price: "Custom Quote", idealFor: ["Marketing Teams", "Sales Operations", "Executive Reporting", "Performance Tracking"], features: ["Custom KPI widgets", "Interactive charts & graphs", "Real-time data updates", "Data source connections", "Export capabilities", "Mobile-responsive views", "Date range filtering", "Drill-down functionality"], deliverables: ["Complete dashboard ownership", "Data integration setup", "User training session", "30-day support period"], href: "/apps-dashboards", cta: "Discuss Dashboard" },
  { name: "Operations Dashboard", subtitle: "Command Center View", description: "Centralized operational visibility across your entire business with real-time monitoring and alerts.", timeline: "5-8 weeks", price: "Custom Quote", idealFor: ["Operations Managers", "Warehouse Teams", "Production Monitoring", "Service Delivery"], features: ["Multi-source data aggregation", "Real-time status monitoring", "Alert & notification system", "Task management integration", "Team performance metrics", "Historical trend analysis", "Custom report generation", "API data feeds"], deliverables: ["Complete source ownership", "Integration documentation", "Team training package", "45-day priority support"], href: "/apps-dashboards", popular: true, cta: "Get Quote" },
  { name: "BI Dashboard Suite", subtitle: "Multi-Department Analytics", description: "Comprehensive business intelligence dashboards connecting multiple departments and data sources.", timeline: "8-12 weeks", price: "Custom Quote", idealFor: ["Multi-Department Orgs", "Data-Driven Companies", "Regional Managers", "Business Analysts"], features: ["Cross-department data views", "Advanced filtering & slicing", "Scheduled report automation", "Embedded analytics", "Custom metric calculations", "Comparison & benchmarking", "Data governance controls", "Mobile app access"], deliverables: ["Complete BI suite ownership", "Multi-team training", "Data dictionary", "60-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Executive Dashboard", subtitle: "Strategic Overview", description: "Board-level dashboards providing comprehensive business intelligence for strategic decision-making.", timeline: "10-16 weeks", price: "Custom Quote", idealFor: ["C-Suite Executives", "Board Reporting", "Investor Updates", "Strategic Planning"], features: ["Cross-departmental metrics", "Financial KPI tracking", "Competitive benchmarking", "Predictive analytics", "Automated report scheduling", "Presentation mode", "Secure access controls", "White-label options"], deliverables: ["Complete IP ownership", "Executive training", "Monthly maintenance option", "60-day premium support"], href: "/get-started", isEnterprise: true, cta: "Schedule Call" },
];

// Inventory System Packages
const inventoryPackages = [
  { name: "Stock Manager", subtitle: "Simple Stock Control", description: "Essential inventory tracking for small businesses managing products, supplies, or equipment.", timeline: "3-5 weeks", price: "Custom Quote", idealFor: ["Retail Shops", "Small Warehouses", "Equipment Tracking", "Supply Management"], features: ["Product catalog management", "Stock level tracking", "Low stock alerts", "Barcode/QR scanning", "Basic reporting", "Multi-location support", "Supplier management", "Stock adjustment logs"], deliverables: ["Complete system ownership", "Staff training session", "Mobile app access", "30-day support period"], href: "/apps-dashboards", cta: "Get Started" },
  { name: "Inventory Pro", subtitle: "Advanced Stock Control", description: "Enhanced inventory management with automated reordering, batch tracking, and detailed analytics.", timeline: "6-10 weeks", price: "Custom Quote", idealFor: ["Growing Retailers", "Multi-Store Businesses", "Wholesale Operations", "Service Companies"], features: ["Automated reorder points", "Batch & lot tracking", "Serial number management", "Advanced reporting", "Purchase order management", "Vendor performance tracking", "Stock valuation methods", "Inventory forecasting"], deliverables: ["Complete system ownership", "Data migration support", "Team training program", "45-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Warehouse System", subtitle: "Full WMS Solution", description: "Comprehensive warehouse management with receiving, picking, packing, and shipping workflow automation.", timeline: "12-18 weeks", price: "Custom Quote", idealFor: ["Distribution Centers", "E-commerce Fulfillment", "Manufacturing", "3PL Providers"], features: ["Receiving & put-away workflows", "Pick, pack, ship automation", "Bin/location management", "Wave/batch picking", "Carrier integrations", "Returns processing", "Inventory forecasting", "Performance analytics"], deliverables: ["Complete WMS ownership", "Hardware integration support", "Team training program", "60-day priority support", "Maintenance plan options"], href: "/apps-dashboards", popular: true, cta: "Request Demo" },
  { name: "Enterprise Inventory", subtitle: "Multi-Site Control", description: "Enterprise-grade inventory management across multiple warehouses, channels, and supply chain operations.", timeline: "20-32 weeks", price: "Custom Quote", idealFor: ["Multi-Warehouse Operations", "Omnichannel Retail", "Supply Chain", "Global Operations"], features: ["Multi-warehouse sync", "Channel inventory allocation", "Demand forecasting", "Automated reordering", "ERP/accounting integrations", "Advanced analytics & BI", "Compliance & audit trails", "Custom workflow automation"], deliverables: ["Complete platform ownership", "Implementation consulting", "Comprehensive training", "SLA-backed support", "Quarterly reviews"], href: "/get-started", isEnterprise: true, cta: "Contact Us" },
];

// E-Commerce Packages
const ecommercePackages = [
  { name: "Starter Store", subtitle: "Launch Your Shop", description: "Get online quickly with a beautiful, functional e-commerce store for small product catalogs.", timeline: "4-6 weeks", price: "Custom Quote", idealFor: ["Artisan Sellers", "Small Product Lines", "Service Add-ons", "Digital Products"], features: ["Up to 50 products", "Secure payment processing", "Order management", "Customer accounts", "Basic shipping setup", "Tax calculation", "Mobile-optimized checkout", "Email notifications"], deliverables: ["Complete store ownership", "Payment gateway setup", "Training documentation", "30-day support period"], href: "/apps-dashboards", cta: "Launch Store" },
  { name: "Business Store", subtitle: "Professional Commerce", description: "Full-featured e-commerce platform with inventory management, marketing tools, and customer engagement.", timeline: "8-12 weeks", price: "Custom Quote", idealFor: ["Growing Retailers", "Product-Based Businesses", "Multi-Category Stores", "Service Providers"], features: ["Unlimited products", "Inventory management", "Discount & coupon system", "Customer segmentation", "Email marketing integration", "Product reviews & ratings", "Wishlist functionality", "Advanced shipping rules"], deliverables: ["Complete platform ownership", "Payment & shipping setup", "Staff training sessions", "45-day priority support"], href: "/apps-dashboards", cta: "Get Quote" },
  { name: "Growth Store", subtitle: "Scale Your Sales", description: "Feature-rich e-commerce platform with advanced marketing tools and customer engagement features.", timeline: "12-18 weeks", price: "Custom Quote", idealFor: ["Scaling Retailers", "Subscription Products", "B2B Commerce", "Multi-Channel Sellers"], features: ["Advanced inventory sync", "Promotion engine", "Loyalty & rewards program", "Abandoned cart recovery", "Multi-currency support", "Marketplace integrations", "Advanced analytics", "A/B testing capability"], deliverables: ["Complete platform ownership", "Marketing tool integration", "Comprehensive training", "60-day priority support"], href: "/apps-dashboards", popular: true, cta: "Request Quote" },
  { name: "Enterprise Commerce", subtitle: "Omnichannel Platform", description: "Enterprise e-commerce with marketplace capabilities, advanced integrations, and unlimited scalability.", timeline: "20-36 weeks", price: "Custom Quote", idealFor: ["High-Volume Retailers", "Marketplace Operators", "Omnichannel Brands", "B2B2C Platforms"], features: ["Multi-vendor marketplace", "Headless commerce API", "ERP & POS integrations", "Advanced personalization", "A/B testing built-in", "Customer loyalty programs", "Advanced analytics", "Custom checkout flows"], deliverables: ["Complete IP ownership", "Technical architecture docs", "Launch support team", "SLA-backed support", "Growth consulting"], href: "/get-started", isEnterprise: true, cta: "Book Consultation" },
];

// CRM & Booking Packages
const crmPackages = [
  { name: "Booking System", subtitle: "Appointment Scheduling", description: "Streamline appointment scheduling with an intuitive booking system for service-based businesses.", timeline: "3-5 weeks", price: "Custom Quote", idealFor: ["Salons & Spas", "Healthcare Practices", "Consultants", "Fitness Studios"], features: ["Online booking widget", "Calendar management", "Automated reminders", "Staff scheduling", "Service catalog", "Client history", "Payment collection", "No-show management"], deliverables: ["Complete system ownership", "Website integration", "Staff training", "30-day support period"], href: "/apps-dashboards", cta: "Get Started" },
  { name: "Client CRM", subtitle: "Relationship Management", description: "Comprehensive CRM to manage leads, clients, and sales pipelines with powerful automation.", timeline: "6-10 weeks", price: "Custom Quote", idealFor: ["Sales Teams", "Professional Services", "Real Estate", "Financial Services"], features: ["Contact management", "Sales pipeline tracking", "Email integration", "Task & activity logging", "Document storage", "Reporting & analytics", "Custom fields & stages", "Team collaboration"], deliverables: ["Complete CRM ownership", "Data migration support", "Team training program", "60-day priority support"], href: "/apps-dashboards", popular: true, cta: "Request Demo" },
  { name: "Sales Platform", subtitle: "Advanced Sales Tools", description: "Full-featured sales platform with automation, lead scoring, and advanced pipeline management.", timeline: "10-16 weeks", price: "Custom Quote", idealFor: ["Scaling Sales Teams", "Multi-Product Companies", "B2B Organizations", "Agency Teams"], features: ["Lead scoring & routing", "Sales automation workflows", "Quote & proposal builder", "Contract management", "Commission tracking", "Territory management", "Advanced forecasting", "Custom integrations"], deliverables: ["Complete platform ownership", "Sales process consulting", "Comprehensive training", "90-day priority support"], href: "/apps-dashboards", cta: "Request Quote" },
  { name: "Enterprise CRM", subtitle: "Full Customer Platform", description: "Enterprise customer relationship management with advanced automation, integrations, and intelligence.", timeline: "16-28 weeks", price: "Custom Quote", idealFor: ["Large Sales Teams", "Multi-Department CRM", "Complex Sales Cycles", "Enterprise Clients"], features: ["Advanced automation rules", "AI-powered insights", "Marketing automation", "Customer journey mapping", "Territory management", "Forecasting & quotas", "API & webhook support", "Custom integrations"], deliverables: ["Complete platform ownership", "Implementation consulting", "Enterprise training", "SLA-backed support", "Quarterly optimization"], href: "/get-started", isEnterprise: true, cta: "Contact Us" },
];

const trustSignals = [
  { icon: Shield, text: "100% Code Ownership" },
  { icon: Heart, text: "UK-Based Support" },
  { icon: Zap, text: "Built for Performance" },
  { icon: Code, text: "Modern Tech Stack" },
];

// Category Section Component with Enhanced Cards
function CategorySection({ 
  title, 
  description, 
  packages, 
  image,
  onEnterpriseClick
}: { 
  title: string; 
  description: string; 
  packages: typeof websitePackages; 
  image: string;
  onEnterpriseClick?: (packageName: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="space-y-8">
      {/* Category Header with Image */}
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="heading-md mb-4">{title}</h2>
          <p className="body-lg text-muted-foreground max-w-prose">{description}</p>
        </motion.div>
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden aspect-video"
        >
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </motion.div>
      </div>
      
      {/* Packages Grid - Equal height cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {packages.map((pkg, index) => (
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
  const [quizMinimized, setQuizMinimized] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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

      {/* Hero Section */}
      <section className="section-padding pt-32 relative overflow-hidden">
        <div className="container-tight relative">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="heading-xl mb-6"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Digital Solutions <span className="text-gradient">Tailored to You</span>
            </motion.h1>
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.15)' }}
            >
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary">Free preview included with every package</span>
            </motion.div>
            <motion.p 
              className="body-lg mb-4 max-w-prose mx-auto"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              From professional websites to enterprise applications, dashboards, inventory systems, 
              and beyond — we build digital infrastructure that scales with your business.
            </motion.p>
            
            {/* Trust Signals */}
            <motion.div 
              className="flex flex-wrap justify-center gap-3 md:gap-4 mt-8"
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {trustSignals.map((signal, index) => (
                <motion.div 
                  key={signal.text} 
                  className="flex items-center gap-2 text-sm text-muted-foreground liquid-glass-pill px-3 py-2"
                  initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <signal.icon className="w-4 h-4 text-primary" />
                  <span>{signal.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sticky Category Navigation */}
      <PackagesStickyNav />

      {/* Package Finder Quiz */}
      <section className="section-padding bg-primary/5">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="w-6 h-6 text-primary" />
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">Package Finder</span>
              </div>
              <h2 className="heading-md mb-4">
                Not Sure Which Package <span className="text-gradient">Fits Best?</span>
              </h2>
              <p className="body-lg text-muted-foreground mb-6 max-w-prose">
                Answer a few quick questions and we'll recommend the perfect package for your needs. 
                Takes less than a minute.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Personalized recommendation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Based on your business needs
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Quick 4-question quiz
                </li>
              </ul>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="liquid-glass-card-strong p-4 md:p-6 rounded-3xl border border-border/50"
            >
              <PackageQuiz />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <SocialProofRotator />

      {/* Website Packages */}
      <section id="websites" className="section-padding scroll-mt-32">
        <div className="container-tight">
          <CategorySection
            title="Professional Websites"
            description="From simple landing pages to complex multi-page sites, we craft websites that convert visitors into customers. Every site is built with modern technology, optimized for speed, and designed to grow with your business."
            packages={websitePackages}
            image={websitesImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* Website Comparison Table */}
      <section className="section-padding bg-muted/30">
        <div className="container-tight">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Table2 className="w-6 h-6 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Feature Comparison</span>
            </div>
            <h2 className="heading-md mb-4">
              Compare Website <span className="text-gradient">Packages</span>
            </h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              See exactly what's included in each tier to find the right fit for your business.
            </p>
          </motion.div>
          <ResponsiveComparisonTable />
        </div>
      </section>

      {/* Trust Badges Row */}
      <TrustBadgesRow />

      {/* Web Applications */}
      <section id="apps" className="section-padding scroll-mt-32">
        <div className="container-tight">
          <CategorySection
            title="Custom Web Applications"
            description="Transform your business with bespoke web applications. Whether you're launching a startup MVP or building enterprise-grade platforms, we create scalable solutions that solve real problems."
            packages={appPackages}
            image={appsImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* Social Proof Between Sections */}
      <SocialProofRotator />

      {/* Dashboards */}
      <section id="dashboards" className="section-padding scroll-mt-32 bg-muted/30">
        <div className="container-tight">
          <CategorySection
            title="Business Dashboards"
            description="Turn your data into actionable insights with custom dashboards. From marketing analytics to executive reporting, we build visualization tools that help you make better decisions faster."
            packages={dashboardPackages}
            image={dashboardsImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* Inventory Systems */}
      <section id="inventory" className="section-padding scroll-mt-32">
        <div className="container-tight">
          <CategorySection
            title="Inventory & Warehouse Systems"
            description="Take control of your stock with custom inventory management. From simple stock tracking to full warehouse management systems, we build solutions that optimize your operations."
            packages={inventoryPackages}
            image={inventoryImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* E-Commerce */}
      <section id="ecommerce" className="section-padding scroll-mt-32 bg-muted/30">
        <div className="container-tight">
          <CategorySection
            title="E-Commerce Platforms"
            description="Launch and scale your online store with custom e-commerce solutions. We build platforms that provide seamless shopping experiences and powerful back-office tools."
            packages={ecommercePackages}
            image={ecommerceImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* CRM & Booking */}
      <section id="crm" className="section-padding scroll-mt-32">
        <div className="container-tight">
          <CategorySection
            title="CRM & Booking Systems"
            description="Manage customer relationships and streamline scheduling with purpose-built systems. From simple booking widgets to full CRM platforms, we help you build lasting customer connections."
            packages={crmPackages}
            image={crmImg}
            onEnterpriseClick={handleEnterpriseClick}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-muted/30">
        <div className="container-tight">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">How We <span className="text-gradient">Work</span></h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              A transparent, collaborative process from concept to launch and beyond.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Workflow, step: "01", title: "Discovery & Strategy", description: "We learn about your business, goals, and requirements to create a tailored solution plan." },
              { icon: Layers, step: "02", title: "Design & Prototype", description: "Interactive designs and prototypes let you see and refine your project before development begins." },
              { icon: FileCode, step: "03", title: "Build & Refine", description: "Agile development with regular updates ensures your project evolves exactly as you envision." },
              { icon: Zap, step: "04", title: "Launch & Support", description: "Seamless deployment followed by ongoing support to ensure long-term success." },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-4 md:p-6 rounded-2xl liquid-glass-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-3xl font-bold text-primary/30">{item.step}</span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ with Search */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 md:mb-12"
          >
            <h2 className="heading-md mb-4">Frequently Asked <span className="text-gradient">Questions</span></h2>
            <p className="body-lg text-muted-foreground max-w-2xl mx-auto">
              Find quick answers to common questions about our packages and process.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <EnhancedFAQ />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-muted/30">
        <div className="container-tight text-center">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-6 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h2 className="heading-md mb-4">
              Ready to Build Something <span className="text-gradient">Exceptional?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Tell us about your project and get a tailored proposal. No commitment, no pressure — 
              just a conversation about how we can help.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Start Your Project <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cost Estimator */}
      <CostEstimator />
    </Layout>
  );
}
