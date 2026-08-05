export type NavLink = { href: string; label: string };

/** The four pages that earn a place in the top nav. Nothing else. */
export const primaryNav: NavLink[] = [
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

export const serviceLinks: NavLink[] = [
  { href: "/services#interior", label: "Interior decorating" },
  { href: "/services#exterior", label: "Exterior painting" },
  { href: "/services#wallpapering", label: "Wallpapering" },
  { href: "/services#spray", label: "Spray finishing" },
  { href: "/services#commercial", label: "Commercial" },
];
