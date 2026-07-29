import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Globe, 
  Laptop, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users,
  Building2,
  Briefcase,
  Rocket,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

interface QuizOption {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  scores: Record<string, number>;
}

interface PackageResult {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  features: string[];
}

const questions: QuizQuestion[] = [
  {
    id: "primary-need",
    question: "What's your primary digital need?",
    subtitle: "Choose the option that best describes what you're looking for",
    options: [
      {
        id: "website",
        label: "Professional Website",
        description: "Establish online presence and attract customers",
        icon: Globe,
        scores: { starter: 3, business: 3, growth: 3, enterprise: 1 },
      },
      {
        id: "app",
        label: "Custom Application",
        description: "Build a tool to automate or streamline operations",
        icon: Laptop,
        scores: { mvp: 3, businessApp: 3, enterprisePlatform: 2 },
      },
      {
        id: "dashboard",
        label: "Data Dashboard",
        description: "Visualize data and track key metrics",
        icon: LayoutDashboard,
        scores: { analytics: 3, operations: 3, executive: 2 },
      },
      {
        id: "ecommerce",
        label: "Online Store",
        description: "Sell products or services online",
        icon: ShoppingCart,
        scores: { starterStore: 3, growthStore: 3, enterpriseCommerce: 2 },
      },
      {
        id: "inventory",
        label: "Inventory / Warehouse",
        description: "Manage stock, products, or warehouse operations",
        icon: Package,
        scores: { stockManager: 3, warehouse: 3, enterpriseInventory: 2 },
      },
      {
        id: "crm",
        label: "CRM / Booking System",
        description: "Manage customers and appointments",
        icon: Users,
        scores: { booking: 3, clientCrm: 3, enterpriseCrm: 2 },
      },
    ],
  },
  {
    id: "business-size",
    question: "What best describes your business?",
    subtitle: "This helps us understand the scale of your needs",
    options: [
      {
        id: "solo",
        label: "Solo / Freelancer",
        description: "Just me or a very small team",
        icon: Briefcase,
        scores: { starter: 2, mvp: 2, analytics: 1, starterStore: 2, stockManager: 2, booking: 2 },
      },
      {
        id: "small",
        label: "Small Business",
        description: "1-10 employees",
        icon: Building2,
        scores: { business: 2, mvp: 1, businessApp: 1, operations: 1, growthStore: 1, warehouse: 1, clientCrm: 1 },
      },
      {
        id: "growing",
        label: "Growing Company",
        description: "11-50 employees",
        icon: Rocket,
        scores: { growth: 2, businessApp: 2, operations: 2, growthStore: 2, warehouse: 2, clientCrm: 2 },
      },
      {
        id: "enterprise",
        label: "Enterprise",
        description: "50+ employees or complex requirements",
        icon: Globe,
        scores: { enterprise: 3, enterprisePlatform: 3, executive: 3, enterpriseCommerce: 3, enterpriseInventory: 3, enterpriseCrm: 3 },
      },
    ],
  },
  {
    id: "complexity",
    question: "How complex is your project?",
    subtitle: "Consider the features and integrations you'll need",
    options: [
      {
        id: "simple",
        label: "Simple & Straightforward",
        description: "Basic features, minimal customization",
        icon: CheckCircle,
        scores: { starter: 2, mvp: 1, analytics: 2, starterStore: 2, stockManager: 2, booking: 2 },
      },
      {
        id: "moderate",
        label: "Moderate Complexity",
        description: "Custom features, some integrations",
        icon: Briefcase,
        scores: { business: 2, businessApp: 2, operations: 2, growthStore: 2, warehouse: 2, clientCrm: 2 },
      },
      {
        id: "complex",
        label: "Complex Requirements",
        description: "Advanced features, multiple integrations",
        icon: Rocket,
        scores: { growth: 2, businessApp: 1, enterprisePlatform: 1, executive: 1, enterpriseCommerce: 1, enterpriseInventory: 1, enterpriseCrm: 1 },
      },
      {
        id: "enterprise-grade",
        label: "Enterprise-Grade",
        description: "Mission-critical, highly scalable",
        icon: Building2,
        scores: { enterprise: 3, enterprisePlatform: 3, executive: 3, enterpriseCommerce: 3, enterpriseInventory: 3, enterpriseCrm: 3 },
      },
    ],
  },
  {
    id: "timeline",
    question: "When do you need this completed?",
    subtitle: "Timeline affects which packages are suitable",
    options: [
      {
        id: "urgent",
        label: "As Soon As Possible",
        description: "Within 2 weeks",
        icon: Rocket,
        scores: { starter: 3, mvp: 2, analytics: 2, starterStore: 2, stockManager: 2, booking: 2 },
      },
      {
        id: "normal",
        label: "Standard Timeline",
        description: "2-6 weeks",
        icon: Briefcase,
        scores: { business: 2, businessApp: 2, operations: 2, growthStore: 2, warehouse: 2, clientCrm: 2 },
      },
      {
        id: "extended",
        label: "Extended Timeline",
        description: "1-3 months",
        icon: Building2,
        scores: { growth: 2, businessApp: 1, operations: 1, growthStore: 1, warehouse: 1, clientCrm: 1 },
      },
      {
        id: "flexible",
        label: "Flexible / Large Project",
        description: "3+ months or ongoing",
        icon: Globe,
        scores: { enterprise: 2, enterprisePlatform: 2, executive: 2, enterpriseCommerce: 2, enterpriseInventory: 2, enterpriseCrm: 2 },
      },
    ],
  },
];

const packageResults: Record<string, PackageResult> = {
  starter: {
    id: "starter",
    name: "Starter Site",
    category: "Websites",
    description: "Perfect for establishing your online presence quickly with a clean, professional website.",
    icon: Globe,
    href: "/starter",
    features: ["1-2 pages", "Mobile-responsive", "Contact form", "Fast delivery"],
  },
  business: {
    id: "business",
    name: "Business Site",
    category: "Websites",
    description: "A comprehensive website for growing businesses with CMS and custom design.",
    icon: Globe,
    href: "/growth",
    features: ["2-5 pages", "Custom design", "CMS for edits", "SEO optimized"],
  },
  growth: {
    id: "growth",
    name: "Growth Site",
    category: "Websites",
    description: "Advanced website with lead capture, blog, and performance optimization.",
    icon: Globe,
    href: "/professional",
    features: ["6-12 pages", "Lead capture", "Blog/content hub", "Analytics"],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Website",
    category: "Websites",
    description: "Complex, large-scale websites with custom functionality and integrations.",
    icon: Globe,
    href: "/get-started",
    features: ["Unlimited pages", "Custom development", "API integrations", "Dedicated support"],
  },
  mvp: {
    id: "mvp",
    name: "MVP Application",
    category: "Web Applications",
    description: "Launch quickly with a minimum viable product to validate your idea.",
    icon: Laptop,
    href: "/apps-dashboards",
    features: ["Core features", "User auth", "Cloud database", "Fast iteration"],
  },
  businessApp: {
    id: "businessApp",
    name: "Business Application",
    category: "Web Applications",
    description: "Custom application to streamline operations and automate workflows.",
    icon: Laptop,
    href: "/apps-dashboards",
    features: ["Workflow automation", "Role-based access", "Integrations", "Reports"],
  },
  enterprisePlatform: {
    id: "enterprisePlatform",
    name: "Enterprise Platform",
    category: "Web Applications",
    description: "Large-scale platform designed for millions of users and mission-critical operations.",
    icon: Laptop,
    href: "/get-started",
    features: ["Microservices", "Horizontal scaling", "SSO", "Compliance"],
  },
  analytics: {
    id: "analytics",
    name: "Analytics Dashboard",
    category: "Dashboards",
    description: "Transform data into actionable insights with custom KPI tracking.",
    icon: LayoutDashboard,
    href: "/apps-dashboards",
    features: ["Custom KPIs", "Interactive charts", "Real-time data", "Exports"],
  },
  operations: {
    id: "operations",
    name: "Operations Dashboard",
    category: "Dashboards",
    description: "Centralized visibility across your entire business operations.",
    icon: LayoutDashboard,
    href: "/apps-dashboards",
    features: ["Multi-source data", "Alerts", "Team metrics", "Historical trends"],
  },
  executive: {
    id: "executive",
    name: "Executive Dashboard",
    category: "Dashboards",
    description: "Board-level business intelligence for strategic decision-making.",
    icon: LayoutDashboard,
    href: "/get-started",
    features: ["Cross-department", "Predictive analytics", "Presentation mode", "White-label"],
  },
  starterStore: {
    id: "starterStore",
    name: "Starter Store",
    category: "E-Commerce",
    description: "Get online quickly with a beautiful, functional e-commerce store.",
    icon: ShoppingCart,
    href: "/apps-dashboards",
    features: ["Up to 50 products", "Secure payments", "Order management", "Mobile checkout"],
  },
  growthStore: {
    id: "growthStore",
    name: "Growth Store",
    category: "E-Commerce",
    description: "Feature-rich platform with advanced marketing and customer tools.",
    icon: ShoppingCart,
    href: "/apps-dashboards",
    features: ["Unlimited products", "Promotions", "Abandoned cart", "Multi-currency"],
  },
  enterpriseCommerce: {
    id: "enterpriseCommerce",
    name: "Enterprise Commerce",
    category: "E-Commerce",
    description: "Enterprise e-commerce with marketplace capabilities and unlimited scalability.",
    icon: ShoppingCart,
    href: "/get-started",
    features: ["Multi-vendor", "Headless API", "ERP integration", "A/B testing"],
  },
  stockManager: {
    id: "stockManager",
    name: "Stock Manager",
    category: "Inventory",
    description: "Essential inventory tracking for small businesses.",
    icon: Package,
    href: "/apps-dashboards",
    features: ["Product catalog", "Low stock alerts", "Barcode scanning", "Basic reports"],
  },
  warehouse: {
    id: "warehouse",
    name: "Warehouse System",
    category: "Inventory",
    description: "Full warehouse management with picking, packing, and shipping workflows.",
    icon: Package,
    href: "/apps-dashboards",
    features: ["Receiving workflows", "Pick/pack/ship", "Carrier integration", "Forecasting"],
  },
  enterpriseInventory: {
    id: "enterpriseInventory",
    name: "Enterprise Inventory",
    category: "Inventory",
    description: "Multi-warehouse control across channels and supply chain.",
    icon: Package,
    href: "/get-started",
    features: ["Multi-warehouse", "Demand forecasting", "ERP sync", "Audit trails"],
  },
  booking: {
    id: "booking",
    name: "Booking System",
    category: "CRM & Booking",
    description: "Streamline appointment scheduling for service-based businesses.",
    icon: Users,
    href: "/apps-dashboards",
    features: ["Online booking", "Reminders", "Staff scheduling", "Payment collection"],
  },
  clientCrm: {
    id: "clientCrm",
    name: "Client CRM",
    category: "CRM & Booking",
    description: "Comprehensive CRM to manage leads and sales pipelines.",
    icon: Users,
    href: "/apps-dashboards",
    features: ["Contact management", "Pipeline tracking", "Email integration", "Reports"],
  },
  enterpriseCrm: {
    id: "enterpriseCrm",
    name: "Enterprise CRM",
    category: "CRM & Booking",
    description: "Full customer platform with advanced automation and AI insights.",
    icon: Users,
    href: "/get-started",
    features: ["AI insights", "Marketing automation", "Territory management", "Custom integrations"],
  },
};

export function PackageQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<PackageResult | null>(null);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleOptionSelect = (optionId: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionId }));
    
    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    } else {
      // Calculate result
      calculateResult({ ...answers, [currentQuestion.id]: optionId });
    }
  };

  const calculateResult = (allAnswers: Record<string, string>) => {
    const scores: Record<string, number> = {};

    // Calculate scores from all answers
    questions.forEach(question => {
      const selectedOptionId = allAnswers[question.id];
      const selectedOption = question.options.find(opt => opt.id === selectedOptionId);
      
      if (selectedOption) {
        Object.entries(selectedOption.scores).forEach(([packageId, score]) => {
          scores[packageId] = (scores[packageId] || 0) + score;
        });
      }
    });

    // Find highest scoring package
    let topPackage = "";
    let topScore = 0;
    
    Object.entries(scores).forEach(([packageId, score]) => {
      if (score > topScore) {
        topScore = score;
        topPackage = packageId;
      }
    });

    setResult(packageResults[topPackage] || packageResults.business);
    setShowResult(true);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
    setResult(null);
  };

  return (
    // Frame is provided by the page (hairline border) — no card chrome here.
    <div className="p-2 md:p-4">
      <AnimatePresence mode="wait">
        {!showResult ? (
          <motion.div
            key={`question-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentStep + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <div className="mb-6">
              <h3 className="font-display font-bold text-xl md:text-2xl mb-2">
                {currentQuestion.question}
              </h3>
              <p className="text-muted-foreground">
                {currentQuestion.subtitle}
              </p>
            </div>

            {/* Options */}
            <div className="grid sm:grid-cols-2 gap-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const Icon = option.icon;
                const isSelected = answers[currentQuestion.id] === option.id;
                
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleOptionSelect(option.id)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">{option.label}</p>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Navigation */}
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            {/* Result Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>

            <h3 className="font-display font-bold text-2xl mb-2">
              Your Recommended Package
            </h3>
            <p className="text-muted-foreground mb-6">
              Based on your answers, we think this is the best fit
            </p>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-primary/5 border border-primary/20 mb-6"
              >
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <result.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider">
                      {result.category}
                    </p>
                    <h4 className="font-display font-bold text-xl">{result.name}</h4>
                  </div>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {result.description}
                </p>

                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {result.features.map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="hero" asChild>
                    <Link to={result.href}>
                      Learn More <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={handleRestart} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retake Quiz
                  </Button>
                </div>
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground">
              Not quite right? <Link to="/get-started" className="text-primary hover:underline">Contact us</Link> for a personalized recommendation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
