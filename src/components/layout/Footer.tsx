import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import quooroLogo from "@/assets/quooro-logo.png";

const footerLinks = {
  services: [
    { name: "Starter Sites", href: "/starter" },
    { name: "Business Site", href: "/growth" },
    { name: "Growth Site", href: "/professional" },
    { name: "Enterprise", href: "/enterprise" },
    { name: "Custom Elite", href: "/custom-elite" },
    { name: "Apps & Dashboards", href: "/apps-dashboards" },
    { name: "Subscription Websites", href: "/subscription-websites" },
    { name: "Website Management", href: "/website-management" },
    { name: "Service Level Agreement", href: "/sla" },
  ],
  marketing: [
    { name: "Social Media", href: "/social-media" },
    { name: "Ad Management", href: "/ad-management" },
    { name: "Account Management", href: "/account-management" },
    { name: "Content Creation", href: "/content-creation" },
    { name: "SEO & Strategy", href: "/seo-strategy" },
    { name: "Quooro Office", href: "/quooro-office" },
  ],
  company: [
    { name: "Packages", href: "/packages" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Why Choose Us", href: "/comparison" },
    { name: "Success Stories", href: "/success-stories" },
    { name: "Timelines", href: "/timelines" },
    { name: "Features", href: "/features" },
    { name: "Ownership", href: "/ownership" },
    { name: "Handover", href: "/handover" },
    { name: "Platform", href: "/client-portal" },
    { name: "Add-Ons", href: "/add-ons" },
    { name: "Start-Up Support", href: "/business-startup" },
    { name: "Get Started", href: "/get-started" },
  ],
  previews: [
    { name: "Preview Portfolio", href: "/preview-portfolio" },
    { name: "Preview Process", href: "/preview-process" },
    { name: "Preview Packages", href: "/preview-pricing" },
    { name: "Preview Guarantee", href: "/preview-guarantee" },
    { name: "Preview Stories", href: "/preview-stories" },
    { name: "Preview FAQ", href: "/preview-faq" },
  ],
  support: [
    { name: "FAQs & Help Center", href: "/support" },
    { name: "Book a Callback", href: "/support#callback-form" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
    { name: "Trust Center", href: "/trust-center" },
    { name: "Terms of Service", href: "/terms-of-service" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/30">
      <div className="container-tight section-padding">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-6 sm:gap-8 lg:gap-6">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Link to="/" className="inline-block mb-4 sm:mb-6">
              <img 
                src={quooroLogo} 
                alt="Quooro" 
                className="h-8 sm:h-10 md:h-12 w-auto dark:brightness-0 dark:invert"
              />
            </Link>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-sm">
              Quooro is a digital operations hub that designs, builds, and manages websites, apps, dashboards, and internal systems — delivered through one secure platform.
            </p>
            <div className="flex gap-2 sm:gap-3">
              {[
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Facebook, href: "#", label: "Facebook" },
              ].map((social, index) => (
                <a 
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="group w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/50 flex items-center justify-center text-muted-foreground transition-all duration-200 hover:text-brand hover:bg-brand/10 hover:-translate-y-1"
                >
                  <social.icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:scale-110" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4 tracking-tight">Web Services</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Marketing */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Marketing</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.marketing.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Previews */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Previews</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.previews.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Support</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h4 className="font-display font-semibold text-foreground text-sm sm:text-base mb-3 sm:mb-4">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link to={link.href} className="text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 text-center">
            <a href="mailto:Support@quooro.com" className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
              Support@quooro.com
            </a>
            <a href="tel:+447739346789" className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground transition-colors duration-300 hover:text-primary">
              <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
              07739 346789
            </a>
            <span className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
              Wales, United Kingdom
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground text-center md:text-right">
            <p>© 2025 Quooro Ltd. All rights reserved.</p>
          </div>
        </div>

        {/* Business Identity - Legal Imprint */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/20">
          <div className="text-center text-[10px] sm:text-xs text-muted-foreground space-y-1">
            <p><strong>Quooro Ltd</strong> - Registered in England and Wales</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
