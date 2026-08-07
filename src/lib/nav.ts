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
  /* Photographs and films are two galleries, not one page with a section in
     it. Films were three quarters of the way down /work, behind eleven
     projects and a before-and-after block — which is no place for the thing a
     customer watches longest. */
  { href: "/work", label: "Gallery" },
  { href: "/videos", label: "Videos" },
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
