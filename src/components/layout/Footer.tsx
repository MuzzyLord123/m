import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import quooroLogo from "@/assets/quooro-logo.png";

/**
 * Site footer.
 *
 * The previous one was an eight-column link dump with a paragraph of boilerplate
 * and four social icons pointing at `href="#"` — buttons that look like profiles
 * and go nowhere. Those are removed rather than restyled; see PLACEHOLDERS.md.
 *
 * This version opens with the studio's position stated once at display size,
 * then drops into a hairline-ruled directory with mono column headers. The
 * contact details get their own row rather than being crushed into a strip.
 */

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

const columns: { heading: string; links: { name: string; href: string }[] }[] = [
  { heading: "Web services", links: footerLinks.services },
  { heading: "Marketing", links: footerLinks.marketing },
  { heading: "Company", links: footerLinks.company },
  { heading: "Previews", links: footerLinks.previews },
  { heading: "Support", links: footerLinks.support },
  { heading: "Legal", links: footerLinks.legal },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      {/* ── Sign-off line ──────────────────────────────────────────────── */}
      <div className="container-tight border-b border-border/60 py-16 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="mono-label mb-6">Wales, United Kingdom</p>
            <p className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
              A studio that designs, builds and quietly runs the systems a
              business depends on.
            </p>
          </div>
          <div className="flex items-end lg:col-span-4">
            <Link
              to="/get-started"
              className="group inline-flex items-center gap-3 text-base font-medium text-foreground transition-colors hover:text-primary"
            >
              <span className="link-underline">Start a project</span>
              <ArrowUpRight
                className="h-5 w-5 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                strokeWidth={1.6}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Directory ──────────────────────────────────────────────────── */}
      <div className="container-tight py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h4 className="mono-label mb-5 border-b border-border/60 pb-3">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-[13px] font-light text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <div className="container-tight border-t border-border/60 py-10">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          <div>
            <dt className="mono-label mb-2">Email</dt>
            <dd>
              <a
                href="mailto:Support@quooro.com"
                className="group inline-flex items-center gap-2 text-sm text-foreground/85 transition-colors hover:text-primary"
              >
                <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
                <span className="link-underline">Support@quooro.com</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className="mono-label mb-2">Telephone</dt>
            <dd>
              <a
                href="tel:+447739346789"
                className="group inline-flex items-center gap-2 text-sm text-foreground/85 transition-colors hover:text-primary"
              >
                <Phone className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
                <span className="link-underline">07739 346789</span>
              </a>
            </dd>
          </div>
          <div>
            <dt className="mono-label mb-2">Studio</dt>
            <dd className="inline-flex items-center gap-2 text-sm text-foreground/85">
              <MapPin className="h-3.5 w-3.5 text-primary" strokeWidth={1.6} />
              Wales, United Kingdom
            </dd>
          </div>
        </dl>
      </div>

      {/* ── Imprint ────────────────────────────────────────────────────── */}
      <div className="container-tight flex flex-col gap-4 border-t border-border/60 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" aria-label="Quooro home" className="inline-block">
          <img
            src={quooroLogo}
            alt="Quooro"
            className="h-7 w-auto dark:brightness-0 dark:invert sm:h-8"
          />
        </Link>
        <p className="mono-label normal-case tracking-normal">
          Quooro Ltd · Registered in England and Wales · © 2025
        </p>
      </div>
    </footer>
  );
}
