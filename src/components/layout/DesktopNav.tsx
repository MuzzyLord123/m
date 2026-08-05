"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { BrushStroke } from "@/components/brand/BrushStroke";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { primaryNav } from "@/lib/nav";

/**
 * Desktop navigation (≥1024px).
 *
 * At rest it sits transparent over the hero. Across the first 80px of scroll it
 * condenses — height down ~20%, paper background fades up behind a light blur,
 * a hairline and tinted shadow arrive. Every one of those is interpolated from
 * a single scroll motion value, so it is a continuous condense rather than a
 * class-swap jump at a threshold.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();

  const range = [0, 80] as const;
  const height = useTransform(scrollY, [...range], [96, 76]);
  const background = useTransform(
    scrollY,
    [...range],
    ["rgba(250, 250, 248, 0)", "rgba(250, 250, 248, 0.9)"],
  );
  const backdropFilter = useTransform(scrollY, [...range], ["blur(0px)", "blur(6px)"]);
  const chromeOpacity = useTransform(scrollY, [40, 80], [0, 1]);

  return (
    <motion.div
      style={{ height, background, backdropFilter, WebkitBackdropFilter: backdropFilter }}
      className="relative hidden lg:block"
    >
      {/* Hairline + tinted shadow fade in together as the bar condenses. */}
      <motion.div
        aria-hidden="true"
        style={{ opacity: chromeOpacity }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline shadow-[0_10px_30px_-16px_rgb(60_60_50/0.45)]"
      />

      <nav aria-label="Primary" className="shell flex h-full items-center">
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-8">
          <Wordmark />

          <ul className="flex items-center gap-9">
            {primaryNav.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <li key={link.href}>
                  <motion.span
                    initial="rest"
                    animate={active ? "drawn" : "rest"}
                    whileHover="drawn"
                    whileFocus="drawn"
                    className="relative inline-block"
                  >
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className="block px-0.5 py-1 text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:text-accent"
                    >
                      {link.label}
                    </Link>
                    <BrushStroke
                      colour="var(--color-accent)"
                      className="pointer-events-none absolute -bottom-0.5 left-0 h-[7px] w-full"
                    />
                  </motion.span>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-end gap-6">
            <a
              href={`tel:${site.phoneHref}`}
              className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-ink-soft transition-colors duration-200 hover:text-accent"
            >
              <Phone
                weight="light"
                className="size-[1.15rem] text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12"
              />
              {site.phone}
            </a>

            <Link
              href={CTA_HREF}
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-medium whitespace-nowrap text-white shadow-accent transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-deep active:translate-y-px active:scale-[0.98]"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      </nav>
    </motion.div>
  );
}
