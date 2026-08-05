import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Variant = "primary" | "outline" | "onPhoto";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-medium whitespace-nowrap " +
  "transition-[transform,background-color,color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] " +
  "active:translate-y-px active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const variants: Record<Variant, string> = {
  // Wet Paint Blue on paper — 6.6:1 against white text.
  primary: "bg-accent text-white shadow-accent hover:bg-accent-deep",
  // Ink outline for the quieter of two adjacent actions.
  outline:
    "border border-ink/25 text-ink hover:border-accent hover:text-accent hover:bg-accent-wash",
  // Over photography: a scrim carries the contrast, never the photo.
  onPhoto:
    "bg-ink/85 text-white backdrop-blur-[2px] hover:bg-ink [text-shadow:0_1px_2px_rgb(0_0_0/0.4)]",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-14 px-7 text-base",
};

type SharedProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: SharedProps & ComponentPropsWithoutRef<"button">) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: SharedProps & { href: string } & Omit<ComponentPropsWithoutRef<"a">, "href">) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  const external = href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");

  if (external) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...props}>
      {children}
    </Link>
  );
}
