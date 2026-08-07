import { services } from "@/data/services";

export type NavLink = { href: string; label: string };

/**
 * The pages that earn a place in the top nav. Nothing else.
 *
 * Home is listed explicitly rather than left to the logo. A wordmark that
 * happens to be clickable is a convention designers know and visitors do not —
 * and on a phone, where the logo is small and the menu is a full screen of
 * words, there was no visible way back to the home page at all.
 */
export const primaryNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export const footerNav: NavLink[] = [
  ...primaryNav,
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
];

/**
 * Derived from the services themselves, never hand-listed. The hard-coded
 * version had drifted: it still offered Wallpapering and Spray finishing after
 * both were dropped, so two of the five links in the footer and the desktop
 * mega-menu pointed at anchors that no longer existed on the page.
 */
export const serviceLinks: NavLink[] = services.map((service) => ({
  href: `/services#${service.id}`,
  label: service.title,
}));
