import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { preloadRoute } from "@/lib/routePreloader";
import { ChevronDown, LogIn, Phone, Bot, HelpCircle, Calendar, Layers, TrendingUp, MessageSquare, BarChart3, Users, Settings, FileText, Eye, Palette, Building2, Shield, Globe, Database, Rocket, Target, Sparkles, Package, Monitor, ArrowRight, ShoppingBag, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import quooroLogo from "@/assets/quooro-logo.png";

// Mega menu navigation structure
const megaMenus = {
  development: {
    label: "Development",
    columns: [
      {
        title: "Websites",
        items: [
          { name: "Starter Site", href: "/starter", icon: Rocket, description: "Perfect for local services" },
          { name: "Business Site", href: "/growth", icon: Building2, description: "For growing businesses" },
          { name: "Growth Site", href: "/professional", icon: TrendingUp, description: "Ready to scale" },
          { name: "Enterprise", href: "/enterprise", icon: Globe, description: "Complex builds" },
        ]
      },
      {
        title: "Applications",
        items: [
          { name: "Apps & Dashboards", href: "/apps-dashboards", icon: Layers, description: "Custom-built systems" },
          { name: "Custom Elite", href: "/custom-elite", icon: Sparkles, description: "Bespoke solutions" },
          { name: "Website Management", href: "/website-management", icon: Settings, description: "Ongoing support" },
          { name: "Service Level Agreement", href: "/sla", icon: FileText, description: "Our commitment" },
        ]
      },
      {
        title: "E-commerce",
        items: [
          { name: "E-commerce Overview", href: "/ecommerce", icon: ShoppingBag, description: "Sell online, fully managed" },
          { name: "↳ Subscription Websites", href: "/subscription-websites", icon: Package, description: "Managed store on a monthly plan" },
        ]
      }
    ],
    quickLinks: [
      { name: "View Packages", href: "/packages" },
      { name: "See Our Work", href: "/portfolio" },
      { name: "Get Started", href: "/get-started" },
    ]
  },
  marketing: {
    label: "Marketing",
    columns: [
      {
        title: "Social & Content",
        items: [
          { name: "Social Media", href: "/social-media", icon: MessageSquare, description: "Platform management" },
          { name: "Content Creation", href: "/content-creation", icon: Palette, description: "Professional content" },
        ]
      },
      {
        title: "Advertising",
        items: [
          { name: "Ad Management", href: "/ad-management", icon: BarChart3, description: "PPC & social ads" },
          { name: "SEO & Strategy", href: "/seo-strategy", icon: Target, description: "Growth tactics" },
        ]
      },
      {
        title: "Management",
        items: [
          { name: "Account Management", href: "/account-management", icon: Users, description: "Complete oversight" },
          { name: "Quooro Office", href: "/quooro-office", icon: Monitor, description: "Productivity suite" },
        ]
      }
    ],
    quickLinks: [
      { name: "View Packages", href: "/packages" },
      { name: "Get Started", href: "/get-started" },
    ]
  },
  company: {
    label: "Company",
    columns: [
      {
        title: "About Us",
        items: [
          { name: "Portfolio", href: "/portfolio", icon: Eye, description: "Our recent work" },
          { name: "Why Us", href: "/comparison", icon: Shield, description: "The difference" },
          { name: "Success Stories", href: "/success-stories", icon: Sparkles, description: "Client results" },
        ]
      },
      {
        title: "Platform",
        items: [
          { name: "Digital Operations Platform", href: "/client-portal", icon: Database, description: "Your dashboard" },
          { name: "Workshop", href: "/workshop", icon: Palette, description: "Visual website builder" },
          { name: "Features", href: "/features", icon: Layers, description: "Platform capabilities" },
          { name: "Ownership", href: "/ownership", icon: FileText, description: "You own everything" },
          { name: "Handover", href: "/handover", icon: Package, description: "Full project delivery" },
        ]
      },
      {
        title: "Resources",
        items: [
          { name: "Timelines", href: "/timelines", icon: Calendar, description: "Project delivery" },
          { name: "Add-Ons", href: "/add-ons", icon: Package, description: "Extra services" },
          { name: "Start-Up Support", href: "/business-startup", icon: Rocket, description: "For new businesses" },
        ]
      }
    ],
    quickLinks: [
      { name: "Free Previews", href: "/preview-portfolio" },
      { name: "Our Process", href: "/preview-process" },
      { name: "FAQ", href: "/preview-faq" },
    ]
  },
  support: {
    label: "Support",
    columns: [
      {
        title: "Help & Support",
        items: [
          { name: "FAQs & Help Center", href: "/support", icon: HelpCircle, description: "Browse common questions" },
          { name: "AI Customer Support", href: "/support", icon: Bot, description: "Chat with our assistant 24/7", action: "openChat" },
          { name: "Book a Callback", href: "/support#callback-form", icon: Calendar, description: "We call you within 24hrs" },
        ],
      },
      {
        title: "Contact",
        items: [
          { name: "Call Us (5PM–9PM)", href: "tel:07739346789", icon: Phone, description: "07739 346789" },
        ],
      },
    ],
    quickLinks: [
      { name: "Support", href: "/support" },
      { name: "Get Started", href: "/get-started" },
    ],
  }
};

type MenuKey = keyof typeof megaMenus;

const supportItems = [
  { name: "FAQs & Help Center", href: "/support", icon: HelpCircle, description: "Browse common questions" },
  { name: "AI Customer Support", href: "/support", icon: Bot, description: "Chat with our AI assistant 24/7", action: "openChat" },
  { name: "Call Us (5PM-9PM)", href: "tel:07739346789", icon: Phone, description: "07739 346789" },
  { name: "Book a Callback", href: "/support#callback-form", icon: Calendar, description: "Agent contacts you within 24hrs" },
];

// Apple-style burger icon component
function BurgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="w-5 h-4 relative flex flex-col justify-between">
      <motion.span
        animate={isOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full h-[1.5px] bg-foreground origin-center"
      />
      <motion.span
        animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full h-[1.5px] bg-foreground"
      />
      <motion.span
        animate={isOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full h-[1.5px] bg-foreground origin-center"
      />
    </div>
  );
}

// ── The website menu, phone and tablet ─────────────────────────────────
// Built for Quooro rather than inherited: editorial primary links, mono
// numbered sections over the same megaMenus data, a call strip and CTA
// block anchored at the end. Sections expand in place; everything else
// is one continuous scroll.

function MenuSection({
  index,
  title,
  items,
  isOpen,
  onToggle,
  onItemClick,
}: {
  index: number;
  title: string;
  items: any[];
  isOpen: boolean;
  onToggle: () => void;
  onItemClick: () => void;
}) {
  return (
    <motion.div
      className="border-b border-border/40"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.1 + index * 0.05 }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center gap-4 py-3 text-left"
      >
        <span className={`font-mono text-[10px] tabular-nums transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground/60'}`}>
          {String(index + 2).padStart(2, '0')}
        </span>
        <span className="flex-1 font-display text-[22px] font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/60">
          {items.length}
        </span>
        <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
            className="overflow-hidden"
          >
            <div className="grid gap-x-6 pb-4 pl-8 sm:grid-cols-2">
              {items.map((item: any) => {
                const isTel = typeof item.href === 'string' && item.href.startsWith('tel:');
                const inner = (
                  <>
                    <span className="block text-[14px] font-medium leading-tight text-foreground">{item.name}</span>
                    {item.description && (
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{item.description}</span>
                    )}
                  </>
                );
                const cls = 'block min-h-[44px] border-l border-border/40 py-2.5 pl-4 transition-colors hover:border-primary/60 active:border-primary';
                if (item.action === 'openChat') {
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => { onItemClick(); window.dispatchEvent(new CustomEvent('openChatbot')); }}
                      className={`${cls} text-left`}
                    >
                      {inner}
                    </button>
                  );
                }
                if (isTel) {
                  return (
                    <a key={item.name} href={item.href} onClick={onItemClick} className={cls}>
                      {inner}
                    </a>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onItemClick}
                    onTouchStart={() => preloadRoute(item.href)}
                    className={cls}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MobileMenu({
  isOpen,
  setIsOpen,
  user,
  navHeight,
  dashboardPath,
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  user: any;
  navHeight: number;
  dashboardPath: string;
}) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const close = () => setIsOpen(false);
  const toggle = (key: string) => setOpenSection(openSection === key ? null : key);

  const sections = [
    { key: 'development', title: 'Development', items: megaMenus.development.columns.flatMap(c => c.items) },
    { key: 'marketing', title: 'Marketing', items: megaMenus.marketing.columns.flatMap(c => c.items) },
    { key: 'company', title: 'Company', items: megaMenus.company.columns.flatMap(c => c.items) },
    { key: 'support', title: 'Support', items: supportItems },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ clipPath: 'inset(0 0 100% 0)' }}
          animate={{ clipPath: 'inset(0 0 0% 0)' }}
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          className="fixed left-0 right-0 bottom-0 z-40 flex flex-col xl:hidden"
          style={{ top: navHeight }}
        >
          <div className="absolute inset-0 bg-background" />

          <div
            className="mobile-menu-scroll relative flex-1 px-6 pb-10 pt-5 sm:px-10"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {/* Signature line + kicker */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <div aria-hidden className="h-px bg-gradient-to-r from-primary/60 via-border to-transparent" />
              <p className="flex items-baseline justify-between pt-3">
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Menu</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/50">Quooro</span>
              </p>
            </motion.div>

            {/* Primary destinations */}
            <div className="pt-2">
              {[
                { label: 'Home', href: '/', accent: false },
                { label: 'Packages', href: '/packages', accent: false },
                { label: 'Get started', href: '/get-started', accent: true },
              ].map((l, i) => (
                <motion.div
                  key={l.href}
                  className="border-b border-border/40"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1], delay: 0.06 + i * 0.04 }}
                >
                  <Link
                    to={l.href}
                    onClick={close}
                    onTouchStart={() => preloadRoute(l.href)}
                    className="group flex min-h-[56px] items-center gap-4 py-3"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={`flex-1 font-display text-[22px] font-semibold tracking-[-0.02em] ${l.accent ? 'text-primary' : 'text-foreground'}`}>
                      {l.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-active:translate-x-1" />
                  </Link>
                </motion.div>
              ))}

              {sections.map((s, i) => (
                <MenuSection
                  key={s.key}
                  index={i + 2}
                  title={s.title}
                  items={s.items}
                  isOpen={openSection === s.key}
                  onToggle={() => toggle(s.key)}
                  onItemClick={close}
                />
              ))}
            </div>

            {/* Account + contact */}
            <motion.div
              className="mt-8 space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.4 }}
            >
              <Link to="/get-started" onClick={close} className="block">
                <Button className="h-12 w-full justify-center rounded-[12px] bg-primary text-primary-foreground">
                  Start your project
                </Button>
              </Link>
              {user ? (
                <Link to={dashboardPath} onClick={close} className="block">
                  <Button variant="outline" className="h-12 w-full justify-center rounded-[12px]">
                    Open your dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/sign-in" onClick={close} className="block">
                  <Button variant="outline" className="h-12 w-full justify-center rounded-[12px]">
                    <LogIn className="mr-2 h-4 w-4" /> Sign in
                  </Button>
                </Link>
              )}

              <a
                href="tel:07739346789"
                onClick={close}
                className="flex min-h-[44px] items-center justify-between rounded-[12px] border border-border/60 px-4 text-[12.5px] text-foreground/80 transition-colors hover:text-foreground"
              >
                <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> 07739 346789</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">5pm to 9pm</span>
              </a>

              <p className="pt-3 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
                Quooro · Built in Wales
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Lightweight menu item variants — CSS-driven opacity only, no stagger overhead
const menuItemVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.12 } },
};

const columnVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

// Full-width Mega Menu Panel Component (Apple-style) with keyboard navigation
function FullWidthMegaMenu({
  menu,
  isActive,
  onClose,
  navHeight,
  onPanelHoverChange,
}: {
  menu: typeof megaMenus.development;
  isActive: boolean;
  onClose: () => void;
  navHeight: number;
  onPanelHoverChange?: (hovered: boolean) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const focusableRefs = useRef<(HTMLAnchorElement | HTMLButtonElement)[]>([]);
  const [focusIndex, setFocusIndex] = useState(-1);

  // Collect all focusable elements
  const allItems = menu.columns.flatMap(col => col.items);
  const allQuickLinks = menu.quickLinks;
  const totalItems = allItems.length + allQuickLinks.length;

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) {
      setFocusIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          if (e.shiftKey && focusIndex <= 0) {
            e.preventDefault();
            setFocusIndex(totalItems - 1);
          } else if (!e.shiftKey && focusIndex >= totalItems - 1) {
            e.preventDefault();
            setFocusIndex(0);
          } else {
            setFocusIndex(prev => e.shiftKey ? prev - 1 : prev + 1);
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusIndex(prev => (prev + 1) % totalItems);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusIndex(prev => (prev - 1 + totalItems) % totalItems);
          break;
        case "ArrowRight":
          e.preventDefault();
          setFocusIndex(prev => Math.min(prev + 3, totalItems - 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setFocusIndex(prev => Math.max(prev - 3, 0));
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, focusIndex, totalItems, onClose]);

  // Focus the current element
  useEffect(() => {
    if (focusIndex >= 0 && focusableRefs.current[focusIndex]) {
      focusableRefs.current[focusIndex]?.focus();
    }
  }, [focusIndex]);

  // Reset refs when menu changes
  useEffect(() => {
    focusableRefs.current = [];
  }, [menu]);

  let refIndex = 0;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key={menu.label}
          ref={menuRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed left-0 right-0 z-[100]"
          style={{ top: navHeight }}
          onMouseEnter={() => {
            onPanelHoverChange?.(true);
          }}
          onMouseLeave={() => {
            onPanelHoverChange?.(false);
            onClose();
          }}
          role="menu"
          aria-label={`${menu.label} navigation menu`}
        >
          
          {/* Menu panel. Edge-to-edge below xl; at xl it becomes a floating card
              sitting under the nav capsule and sharing its width, so the two
              read as one object rather than a pill balanced on a slab. */}
          <div
            className="nav-panel relative border-b border-border/50 shadow-2xl xl:mx-auto xl:mt-2 xl:max-w-[76rem] xl:rounded-3xl xl:border xl:border-foreground/10"
          >
            {/* Subtle top gradient line */}
            <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent xl:hidden" />

            <div className="container mx-auto px-6 lg:px-12 xl:max-w-none xl:px-10">
              <div className="flex py-10">
                {/* Main columns - 3 column grid */}
                <div className="flex-1 grid grid-cols-3 gap-12 lg:gap-16">
                  {menu.columns.map((column, colIdx) => {
                    return (
                      <motion.div
                        key={colIdx}
                        variants={columnVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <h3 className="mb-5 flex items-baseline gap-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          <span className="tabular-nums text-primary/70">{String(colIdx + 1).padStart(2, '0')}</span>
                          {column.title}
                        </h3>
                        <div className="space-y-1" role="group" aria-label={column.title}>
                          {column.items.map((item: any, itemIdx: number) => {
                            const currentRefIndex = refIndex++;
                            const isTel = typeof item.href === "string" && item.href.startsWith("tel:");
                            
                            const Content = (
                              <>
                                <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 group-hover:scale-110 group-focus:bg-primary/15 group-focus:scale-110 transition-all duration-200">
                                  <item.icon className="w-5 h-5 text-primary/70 group-hover:text-primary transition-colors duration-200" />
                                </div>
                                <div className="pt-0.5 flex-1">
                                  <span className="text-sm font-medium text-foreground block leading-tight group-hover:text-foreground transition-colors duration-150">{item.name}</span>
                                  <span className="text-xs text-muted-foreground mt-0.5 block group-hover:text-muted-foreground/80 transition-colors duration-150">{item.description}</span>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 shrink-0" />
                              </>
                            );

                            const className = "flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-muted/60 focus:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 group w-full text-left";

                            if (item.action === "openChat") {
                              return (
                                <div key={item.name}>
                                  <button
                                    ref={el => { if (el) focusableRefs.current[currentRefIndex] = el; }}
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      window.dispatchEvent(new CustomEvent("openChatbot"));
                                    }}
                                    className={className}
                                    role="menuitem"
                                  >
                                    {Content}
                                  </button>
                                </div>
                              );
                            }

                            if (isTel) {
                              return (
                                <div key={item.name}>
                                  <a
                                    ref={el => { if (el) focusableRefs.current[currentRefIndex] = el; }}
                                    href={item.href}
                                    onClick={onClose}
                                    className={className}
                                    role="menuitem"
                                  >
                                    {Content}
                                  </a>
                                </div>
                              );
                            }

                            return (
                              <div key={item.name}>
                                <Link
                                  ref={el => { if (el) focusableRefs.current[currentRefIndex] = el; }}
                                  to={item.href}
                                  onClick={onClose}
                                  onMouseEnter={() => preloadRoute(item.href)}
                                  onFocus={() => preloadRoute(item.href)}
                                  className={className}
                                  role="menuitem"
                                >
                                  {Content}
                                </Link>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick links sidebar */}
                <div className="w-52 pl-12 lg:pl-16 border-l border-border/30">
                  <h3 className="mb-5 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Quick links
                  </h3>
                  <div className="space-y-3" role="group" aria-label="Quick Links">
                    {menu.quickLinks.map((link, i) => {
                      const currentRefIndex = refIndex++;
                      return (
                        <div key={link.name}>
                          <Link
                            ref={el => { if (el) focusableRefs.current[currentRefIndex] = el; }}
                            to={link.href}
                            onClick={onClose}
                            onMouseEnter={() => preloadRoute(link.href)}
                            onFocus={() => preloadRoute(link.href)}
                            className="block text-sm text-muted-foreground hover:text-foreground focus:text-foreground focus:outline-none transition-colors duration-150 hover:translate-x-0.5 transform"
                            role="menuitem"
                          >
                            {link.name}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Navigation trigger with CSS-only animations (no framer-motion for perf)
function NavTrigger({
  menuKey,
  label,
  isActive,
  onOpen,
}: {
  menuKey: string;
  label: string;
  isActive: boolean;
  onOpen: () => void;
}) {
  const handleHover = () => {
    onOpen();
    const menu = megaMenus[menuKey as MenuKey];
    if (menu) {
      const firstItems = menu.columns[0]?.items.slice(0, 2) || [];
      firstItems.forEach((item: any) => preloadRoute(item.href));
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleHover}
    >
      <button 
        type="button"
        className={`relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
          isActive
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-expanded={isActive}
        aria-haspopup="true"
      >
        <span>{label}</span>
        <ChevronDown
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />

        {/* CSS-only underline indicator */}
        <span
          className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand rounded-full transition-all duration-200"
          style={{
            transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
            opacity: isActive ? 1 : 0,
            transformOrigin: 'center',
          }}
        />
      </button>
      
      {/* Invisible hover bridge */}
      {isActive && (
        <div 
          className="absolute left-0 right-0 h-8 top-full"
          style={{ pointerEvents: "auto" }}
        />
      )}
    </div>
  );
}

// Simple nav link with CSS-only underline (no per-instance motion)
const NavLink = memo(function NavLink({ to, label, pathname }: { to: string; label: string; pathname: string }) {
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      onMouseEnter={() => preloadRoute(to)}
      className={`relative px-4 py-2 text-[13px] font-medium transition-colors duration-150 ${
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
      <span
        className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand rounded-full transition-all duration-200"
        style={{
          transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
          opacity: isActive ? 1 : 0,
          transformOrigin: 'center',
        }}
      />
    </Link>
  );
});

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<MenuKey | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const dashboardPath = isAdmin ? '/dashboard' : '/lounge';
  const navRef = useRef<HTMLElement>(null);

  // Tracks whether the pointer is currently over the *menu panel*
  const isPanelHoveredRef = useRef(false);

  // Scroll-based navbar height: 80px → 64px
  const { scrollY } = useScroll();
  const navHeight = useTransform(scrollY, [0, 100], [80, 64]);
  const logoScale = useTransform(scrollY, [0, 100], [1, 0.9]);
  const navBlur = useTransform(scrollY, [0, 100], [0, 16]);
  
  const [currentNavHeight, setCurrentNavHeight] = useState(80);
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollYRef = useRef(0);
  
  useMotionValueEvent(navHeight, "change", (latest) => {
    setCurrentNavHeight(latest);
  });

  // Mobile-only: hide navbar on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (isOpen || activeDropdown) {
      setNavHidden(false);
      lastScrollYRef.current = latest;
      return;
    }
    const diff = latest - lastScrollYRef.current;
    if (latest < 80) {
      setNavHidden(false);
    } else if (diff > 6) {
      setNavHidden(true);
    } else if (diff < -6) {
      setNavHidden(false);
    }
    lastScrollYRef.current = latest;
  });

  // Notify GuidedTour when mobile menu opens/closes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mobileMenuToggle', { detail: { open: isOpen } }));
  }, [isOpen]);

  // Listen for tour-triggered dropdown events
  useEffect(() => {
    const handleOpenNavDropdown = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.dropdown && detail.dropdown in megaMenus) {
        setActiveDropdown(detail.dropdown as MenuKey);
      }
    };
    const handleCloseNavDropdowns = () => {
      setActiveDropdown(null);
    };

    window.addEventListener('openNavDropdown', handleOpenNavDropdown);
    window.addEventListener('closeNavDropdowns', handleCloseNavDropdowns);
    return () => {
      window.removeEventListener('openNavDropdown', handleOpenNavDropdown);
      window.removeEventListener('closeNavDropdowns', handleCloseNavDropdowns);
    };
  }, []);

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown (immediate)
  const handleDropdownClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveDropdown(null);
  }, []);

  // Delayed close — gives time for mouse to reach the next trigger or the panel
  const handleDelayedClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (!isPanelHoveredRef.current) setActiveDropdown(null);
    }, 180);
  }, []);

  const handleDesktopNavMouseLeave = useCallback(() => {
    handleDelayedClose();
  }, [handleDelayedClose]);

  const handleDropdownOpen = useCallback((key: MenuKey) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveDropdown(key);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setActiveDropdown(null);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard: close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeDropdown) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeDropdown]);

  const scrolled = currentNavHeight < 80;

  return (
    <>
      <motion.nav 
        ref={navRef}
        style={{ height: navHeight, willChange: 'transform' }}
        animate={{ y: navHidden ? '-100%' : '0%' }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ${
          // Below xl the bar still spans the full width — a floating capsule
          // does not survive being squeezed to phone width, and the burger menu
          // needs a solid edge to sit against.
          scrolled || activeDropdown
            ? "bg-background/85 backdrop-blur-2xl border-b border-foreground/[0.06] shadow-sm xl:border-b-0 xl:bg-transparent xl:shadow-none xl:backdrop-blur-none"
            : "bg-transparent backdrop-blur-none"
        }`}
      >
        <div className="container mx-auto h-full px-4 sm:px-6 xl:max-w-6xl xl:px-8">
          {/* At xl the bar becomes a capsule floating over the page. Below that
              it is a plain full-width row, so the rounding, glass and inset
              padding are all gated behind the breakpoint. */}
          <div className="relative flex h-full items-center justify-between xl:my-3 xl:h-[calc(100%-1.5rem)] xl:rounded-full xl:pl-6 xl:pr-2 nav-glass-xl">
            {/* Logo */}
            <Link to="/" className="group/logo flex items-center gap-2 shrink-0 z-10 relative">
              <span className="hidden sm:block absolute -inset-2 rounded-xl bg-foreground/[0.04] opacity-0 group-hover/logo:opacity-100 blur-md transition-opacity duration-500 pointer-events-none" />
              <motion.img 
                src={quooroLogo} 
                alt="Quooro Logo" 
                style={{ scale: logoScale }}
                className="relative h-6 sm:h-7 w-auto dark:brightness-0 dark:invert dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:group-hover/logo:scale-[1.06] sm:group-hover/logo:-rotate-[1.5deg] active:scale-[0.97] hover:scale-[1.03] sm:hover:scale-[1.06]"
              />
            </Link>


            {/* Desktop Navigation - Centered */}
            <div 
              className="hidden xl:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
              onMouseLeave={handleDesktopNavMouseLeave}
            >
              <NavLink to="/" label="Home" pathname={location.pathname} />
              <NavLink to="/packages" label="Packages" pathname={location.pathname} />

              <NavTrigger
                menuKey="development"
                label="Development"
                isActive={activeDropdown === "development"}
                onOpen={() => handleDropdownOpen("development")}
              />

              <NavTrigger
                menuKey="marketing"
                label="Marketing"
                isActive={activeDropdown === "marketing"}
                onOpen={() => handleDropdownOpen("marketing")}
              />

              <NavTrigger
                menuKey="company"
                label="Company"
                isActive={activeDropdown === "company"}
                onOpen={() => handleDropdownOpen("company")}
              />

              <NavTrigger
                menuKey="support"
                label="Support"
                isActive={activeDropdown === "support"}
                onOpen={() => handleDropdownOpen("support")}
              />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3 z-10">
              <ThemeToggle />
              
              <div className="hidden xl:flex items-center gap-2">
                {user ? (
                  <Link to={dashboardPath}>
                    <Button variant="default" size="sm" className="rounded-full px-5 shadow-sm hover:shadow-glow-sm hover:scale-[1.02] active:scale-[0.97] transition-transform duration-150">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/sign-in">
                      <Button variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground hover:text-foreground hover:scale-[1.02] active:scale-[0.97] transition-transform duration-150">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/get-started">
                      <Button variant="premium" size="sm" className="rounded-full px-5 shadow-sm hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile/Tablet menu button */}
              <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.92 }}
                className="xl:hidden p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                aria-label="Toggle menu"
              >
                <BurgerIcon isOpen={isOpen} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mega Menu Backdrop */}
      <AnimatePresence>
        {activeDropdown && (
          <motion.div
            key="mega-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-[99] bg-black/25"
            style={{ top: currentNavHeight }}
            onClick={handleDropdownClose}
          />
        )}
      </AnimatePresence>

      {/* Full-width Mega Menus */}
      {useMemo(() => (["development", "marketing", "company", "support"] as const).map((key) => (
        <FullWidthMegaMenu
          key={key}
          menu={megaMenus[key]}
          isActive={activeDropdown === key}
          onClose={handleDelayedClose}
          navHeight={currentNavHeight}
          onPanelHoverChange={(hovered) => {
            if (activeDropdown === key) isPanelHoveredRef.current = hovered;
          }}
        />
      )), [activeDropdown, handleDelayedClose, currentNavHeight])}

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        user={user}
        navHeight={currentNavHeight}
        dashboardPath={dashboardPath}
      />
    </>
  );
}
