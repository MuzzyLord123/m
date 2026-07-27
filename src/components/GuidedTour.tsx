import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Play,
  Compass,
  Home,
  Globe,
  Megaphone,
  Eye,
  Building2,
  HeadphonesIcon,
  DollarSign,
  CheckCircle,
  Sparkles,
  Rocket,
  Monitor,
  Layers,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TourStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  dropdownKey?: string;
  scrollTarget?: string;
  items?: { name: string; description: string }[];
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Quooro",
    subtitle: "Let's explore what we offer",
    description: "I'll walk you through the key sections of our website. Watch as I highlight each area!",
    icon: Home,
  },
  {
    id: "what-we-do",
    title: "What We Do",
    subtitle: "Our 5 Core Pillars",
    description: "We handle every aspect of your digital presence across five key areas.",
    icon: Monitor,
    scrollTarget: "section-what-we-do",
    items: [
      { name: "Websites", description: "High-performance marketing sites" },
      { name: "Apps & Dashboards", description: "Custom-built applications" },
      { name: "Digital Operations", description: "Secure client platform" },
      { name: "Quooro Office", description: "Enterprise productivity suite" },
      { name: "Ongoing Management", description: "Continuous support & updates" },
    ],
  },
  {
    id: "global-reach",
    title: "Global Reach",
    subtitle: "Serving Clients Worldwide",
    description: "From local businesses to global enterprises, we deliver exceptional digital experiences anywhere.",
    icon: Globe,
    scrollTarget: "section-global-reach",
  },
  {
    id: "dashboard",
    title: "Your Dashboard",
    subtitle: "One Platform for Everything",
    description: "Every client gets a private digital operations dashboard for managing websites, apps, assets, and communication.",
    icon: Layers,
    scrollTarget: "section-dashboard",
    items: [
      { name: "Website Management", description: "Preview, status & updates" },
      { name: "Asset Centre", description: "Upload & manage files" },
      { name: "Team Messages", description: "Direct communication" },
      { name: "SEO & Marketing", description: "Analytics & campaigns" },
    ],
  },
  {
    id: "free-previews",
    title: "Free Previews",
    subtitle: "See Before You Commit",
    description: "We offer free website previews so you can experience the quality before moving forward. No risk, no obligation.",
    icon: Eye,
    scrollTarget: "section-free-previews",
  },
  {
    id: "apps",
    title: "Custom Apps",
    subtitle: "Beyond Websites",
    description: "We design and build custom web applications, dashboards, and internal systems for businesses of all sizes.",
    icon: Settings,
    scrollTarget: "section-apps",
  },
  {
    id: "development-menu",
    title: "Development",
    subtitle: "Explore Our Web Services",
    description: "Browse our complete range of website packages and application development services.",
    icon: Globe,
    dropdownKey: "development",
    items: [
      { name: "Starter Site", description: "Quick, affordable websites" },
      { name: "Business Site", description: "Professional multi-page" },
      { name: "Growth Site", description: "Scalable solutions" },
      { name: "Apps & Dashboards", description: "Custom-built systems" },
    ],
  },
  {
    id: "marketing-menu",
    title: "Marketing",
    subtitle: "Grow Your Reach",
    description: "Complete digital marketing services to amplify your brand.",
    icon: Megaphone,
    dropdownKey: "marketing",
    items: [
      { name: "Social Media", description: "Content & community management" },
      { name: "Ad Management", description: "Paid advertising campaigns" },
      { name: "SEO & Strategy", description: "Search optimization" },
    ],
  },
  {
    id: "support-menu",
    title: "Support",
    subtitle: "We're Here to Help",
    description: "Multiple ways to get assistance whenever you need it.",
    icon: HeadphonesIcon,
    dropdownKey: "support",
    items: [
      { name: "FAQs & Help Center", description: "Browse common questions" },
      { name: "AI Customer Support", description: "Chat with our AI 24/7" },
      { name: "Call Us", description: "Direct phone support" },
    ],
  },
  {
    id: "get-started",
    title: "Get Started",
    subtitle: "Your Project Awaits",
    description: "Ready to begin? Request a free preview and see what we can build for you — no commitment required!",
    icon: Rocket,
    scrollTarget: "section-cta",
  },
];

// AI Robot Mascot Component
function QuooroAI({ speaking = false, size = "md" }: { speaking?: boolean; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="w-full h-full rounded-xl border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
        <div className="relative flex items-center justify-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={speaking ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={speaking ? { scaleY: [1, 0.3, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.1 }}
          />
        </div>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary/60 rounded-full">
          <motion.div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
}

export function GuidedTour() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourActive, setTourActive] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [triggerHovered, setTriggerHovered] = useState(false);
  const [highlightButton, setHighlightButton] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTabExpanded, setMobileTabExpanded] = useState(false);

  const shouldHide = location.pathname !== '/';

  const openNavDropdown = useCallback((dropdownKey: string | undefined) => {
    if (dropdownKey) {
      window.dispatchEvent(new CustomEvent('openNavDropdown', { detail: { dropdown: dropdownKey } }));
    } else {
      window.dispatchEvent(new CustomEvent('closeNavDropdowns'));
    }
  }, []);

  const scrollToSection = useCallback((targetId: string | undefined) => {
    if (!targetId) return;

    const el = document.getElementById(targetId);
    if (!el) return;

    // Align section starts below the fixed navbar on all breakpoints (desktop + mobile)
    const navEl = document.querySelector("nav") as HTMLElement | null;
    const navOffset = navEl ? navEl.getBoundingClientRect().height : 80;
    const extraSpacing = 16;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - navOffset - extraSpacing;

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });
  }, []);

  // Listen for mobile menu state
  useEffect(() => {
    const handleMobileMenu = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setMobileMenuOpen(detail?.open ?? false);
    };
    window.addEventListener('mobileMenuToggle', handleMobileMenu);
    return () => window.removeEventListener('mobileMenuToggle', handleMobileMenu);
  }, []);

  // Highlight trigger on first visit
  useEffect(() => {
    if (shouldHide) return;
    const hasSeenTour = localStorage.getItem("quooro-tour-seen");
    const hasSeenWelcome = sessionStorage.getItem("quooro-welcome-dismissed");
    if (!hasSeenTour && !hasSeenWelcome) {
      const timer = setTimeout(() => setHighlightButton(true), 1500);
      const fadeTimer = setTimeout(() => setHighlightButton(false), 6500);
      return () => { clearTimeout(timer); clearTimeout(fadeTimer); };
    }
  }, [shouldHide]);

  // Navigate when step changes
  useEffect(() => {
    if (!tourActive) return;
    const step = tourSteps[currentStep];
    if (!step) return;

    // Close dropdowns first
    openNavDropdown(undefined);

    if (step.scrollTarget) {
      // Small delay so dropdown closes first
      setTimeout(() => scrollToSection(step.scrollTarget), 100);
    } else if (step.dropdownKey) {
      // Scroll to top so navbar is visible, then open dropdown
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => openNavDropdown(step.dropdownKey), 400);
    } else {
      // Default: scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, tourActive, openNavDropdown, scrollToSection]);

  const handleStartTour = () => {
    setShowWelcome(false);
    setTourActive(true);
    setCurrentStep(0);
    openNavDropdown(undefined);
  };

  const handleExploreOwn = () => {
    setShowWelcome(false);
    setIsOpen(false);
    sessionStorage.setItem("quooro-welcome-dismissed", "true");
    openNavDropdown(undefined);
  };

  const handleNextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      openNavDropdown(undefined);
      localStorage.setItem("quooro-tour-seen", "true");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipTour = () => {
    setTourActive(false);
    setIsOpen(false);
    openNavDropdown(undefined);
    localStorage.setItem("quooro-tour-seen", "true");
  };

  const handleFinishTour = () => {
    setCompleted(false);
    setTourActive(false);
    setIsOpen(false);
    openNavDropdown(undefined);
  };

  const handleCloseTour = () => {
    setIsOpen(false);
    setShowWelcome(false);
    setTourActive(false);
    setCompleted(false);
    openNavDropdown(undefined);
    sessionStorage.setItem("quooro-welcome-dismissed", "true");
  };

  const handleOpenTour = () => {
    setShowWelcome(true);
    setIsOpen(true);
    setTourActive(false);
    setCompleted(false);
  };

  const currentTourStep = tourSteps[currentStep];

  if (shouldHide) return null;

  return (
    <>
      {/* Tour Trigger — desktop pill */}
      {!isOpen && !mobileMenuOpen && (
        <div
          className="hidden lg:block fixed top-24 left-4 z-[99]"
          onMouseEnter={() => setTriggerHovered(true)}
          onMouseLeave={() => setTriggerHovered(false)}
        >
          <div className="w-10 h-10 cursor-pointer" onClick={handleOpenTour}>
            <AnimatePresence>
              {(triggerHovered || highlightButton) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-border rounded-full pl-1 pr-4 py-1 shadow-lg cursor-pointer hover:bg-card transition-colors"
                  onClick={handleOpenTour}
                >
                  <QuooroAI speaking size="sm" />
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">
                    Take a Tour
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {!triggerHovered && !highlightButton && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-2 h-2 rounded-full bg-primary/40 absolute top-4 left-4"
              />
            )}
          </div>
        </div>
      )}

      {/* Tour Trigger — mobile: tiny edge handle, expands on tap */}
      {!isOpen && !mobileMenuOpen && (
        <div className="lg:hidden fixed left-0 bottom-28 z-[99]">
          <motion.div
            initial={false}
            animate={{ width: mobileTabExpanded ? "auto" : 14 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="relative h-10 overflow-hidden rounded-r-2xl bg-card/95 backdrop-blur-xl border border-l-0 border-border shadow-2xl"
          >
            {!mobileTabExpanded && (
              <button
                aria-label="Open tour"
                onClick={() => setMobileTabExpanded(true)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-1 h-5 rounded-full bg-primary/70" />
              </button>
            )}
            <AnimatePresence>
              {mobileTabExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: 0.12 }}
                  className="flex items-center gap-2 h-full pl-1.5 pr-2"
                >
                  <button
                    aria-label="Take a tour"
                    onClick={handleOpenTour}
                    className="flex items-center gap-1.5"
                  >
                    <QuooroAI speaking size="sm" />
                    <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                      Take a Tour
                    </span>
                  </button>
                  <button
                    aria-label="Hide"
                    onClick={() => setMobileTabExpanded(false)}
                    className="ml-1 p-1 rounded-full hover:bg-muted/50"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
          {/* Welcome Modal */}
          {showWelcome && !tourActive && !completed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleCloseTour}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
              >
                <button
                  onClick={handleCloseTour}
                  className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 transition-colors z-10"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <QuooroAI speaking size="lg" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Welcome to Quooro
                      </h2>
                      <p className="text-xs text-primary font-medium">Quooro AI</p>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    I'll guide you through our website, scrolling to key sections and opening our navigation menus so you can see everything we offer.
                  </p>

                  <p className="text-foreground text-sm font-medium mb-5">
                    Ready for a quick tour?
                  </p>

                  <div className="space-y-2">
                    <Button
                      onClick={handleStartTour}
                      className="w-full h-11 text-sm gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Show Me Around
                    </Button>

                    <Button
                      onClick={handleExploreOwn}
                      variant="ghost"
                      className="w-full h-10 text-sm gap-2 text-muted-foreground"
                    >
                      <Compass className="w-4 h-4" />
                      I'll explore on my own
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {tourActive && !completed && currentTourStep && (
            <motion.div
              initial={{ opacity: 0, x: -20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -20, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-6 left-4 z-[100] w-72"
            >
              <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QuooroAI speaking size="sm" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Quooro AI</p>
                      <p className="text-[10px] text-muted-foreground">Site Tour</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseTour}
                    className="p-1 rounded-full hover:bg-muted/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="px-4 pt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground">Progress</span>
                    <span className="text-[10px] font-semibold text-primary">
                      {Math.round(((currentStep + 1) / tourSteps.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                    />
                  </div>
                </div>

                {/* Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <currentTourStep.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {currentTourStep.title}
                      </h3>
                      <p className="text-[10px] text-primary font-medium">
                        {currentTourStep.subtitle}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {currentTourStep.description}
                  </p>

                  {/* Items preview */}
                  {currentTourStep.items && (
                    <div className="bg-muted/30 rounded-lg p-2 mb-2 max-h-28 overflow-y-auto">
                      <div className="space-y-1">
                        {currentTourStep.items.slice(0, 5).map((item, index) => (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex items-center gap-2"
                          >
                            <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                            <p className="text-[10px] font-medium text-foreground truncate">{item.name}</p>
                          </motion.div>
                        ))}
                        {currentTourStep.items.length > 5 && (
                          <p className="text-[9px] text-muted-foreground pl-3">
                            +{currentTourStep.items.length - 5} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Indicator for what's happening */}
                  {currentTourStep.scrollTarget && (
                    <div className="flex items-center gap-2 text-[10px] text-primary mb-2">
                      <span>👇 Scrolled to this section</span>
                    </div>
                  )}
                  {currentTourStep.dropdownKey && (
                    <div className="flex items-center gap-2 text-[10px] text-primary mb-2">
                      <span>👆 See the menu dropdown above!</span>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={handlePrevStep}
                        variant="ghost"
                        size="sm"
                        disabled={currentStep === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground px-1">
                        {currentStep + 1}/{tourSteps.length}
                      </span>
                      <Button
                        onClick={handleNextStep}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        onClick={handleSkipTour}
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] px-2 text-muted-foreground"
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={handleNextStep}
                        size="sm"
                        className="h-7 text-[10px] px-3"
                      >
                        {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Completion */}
          {completed && (
            <motion.div
              initial={{ opacity: 0, x: -20, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -20, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-24 left-4 z-[100] w-72"
            >
              <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <QuooroAI speaking size="md" />
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                      >
                        <CheckCircle className="w-3 h-3 text-primary-foreground" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Tour Complete!
                      </h3>
                      <p className="text-[10px] text-muted-foreground">
                        Now you know your way around
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    Feel free to explore each section. When you're ready, let's start your project!
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleFinishTour}
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => {
                        handleFinishTour();
                        window.location.href = "/get-started";
                      }}
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
    </>
  );
}
