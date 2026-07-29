import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        // Night Shift. Bricolage carries display, Geist carries text, JetBrains
        // Mono carries micro-labels and figures. Instrument Serif is retained
        // only as a rare editorial accent, never as the brand face.
        display: ["'Bricolage Grotesque Variable'", "'Geist Variable'", "system-ui", "sans-serif"],
        body: ["'Geist Variable'", "system-ui", "sans-serif"],
        sans: ["'Geist Variable'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
        serif: ["'Instrument Serif'", "ui-serif", "Georgia", "serif"],
        editorial: ["'Instrument Serif'", "ui-serif", "Georgia", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        /* App-semantic layer (platform surfaces) — see PLATFORM-DIRECTION.md */
        sunken: "hsl(var(--surface-sunken))",
        "ink-2": "hsl(var(--text-secondary))",
        "ink-4": "hsl(var(--text-disabled))",
        ok: "hsl(var(--ok))",
        attend: "hsl(var(--attend))",
        risk: "hsl(var(--risk))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        info: "hsl(var(--info))",
        cyan: {
          glow: "hsl(var(--cyan-glow))",
        },
        navy: {
          deep: "hsl(var(--navy-deep))",
        },
        slate: {
          600: "hsl(var(--slate-600))",
          700: "hsl(var(--slate-700))",
          800: "hsl(var(--slate-800))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Premium accent system */
        "brand": {
          DEFAULT: "hsl(var(--brand))",
          foreground: "hsl(var(--brand-foreground))",
          muted: "hsl(var(--brand) / 0.15)",
          subtle: "hsl(var(--brand) / 0.08)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      boxShadow: {
        "glow-sm": "0 0 20px hsl(var(--brand) / 0.15)",
        "glow": "0 0 40px hsl(var(--brand) / 0.2)",
        "glow-lg": "0 0 60px hsl(var(--brand) / 0.25)",
        "premium-sm": "0 1px 2px rgba(0,0,0,0.4)",
        "premium": "0 4px 16px rgba(0,0,0,0.5)",
        "premium-lg": "0 12px 40px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)", filter: "blur(4px)" },
          to: { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(8px)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          from: { opacity: "0", transform: "translateY(-20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.92)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "blur-in": {
          from: { opacity: "0", filter: "blur(12px)" },
          to: { opacity: "1", filter: "blur(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px hsl(var(--brand) / 0.15)" },
          "50%": { boxShadow: "0 0 24px hsl(var(--brand) / 0.35)" },
        },
        "bounce-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg)" },
          "75%": { transform: "rotate(3deg)" },
        },
        "btn-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "ambient-glow": {
          "0%, 100%": { opacity: "0.04" },
          "50%": { opacity: "0.07" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "fade-out": "fade-out 0.3s ease-out both",
        "slide-up": "slide-up 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "slide-down": "slide-down 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "slide-in-left": "slide-in-left 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "scale-in": "scale-in 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both",
        "blur-in": "blur-in 0.6s ease-out both",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "bounce-gentle": "bounce-gentle 2s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        wiggle: "wiggle 0.5s ease-in-out",
        "btn-shimmer": "btn-shimmer 4s ease-in-out infinite",
        "ambient-glow": "ambient-glow 20s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
