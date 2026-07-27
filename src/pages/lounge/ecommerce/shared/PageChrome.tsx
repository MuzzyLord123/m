/**
 * Shared primitives used by every E-commerce sub-page.
 * Premium lounge-inspired theme: card/60 surfaces, ambient brand glow, tight typography.
 */
import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, LucideIcon } from 'lucide-react';

/**
 * Page header — glassy card with breadcrumb, title, ambient brand glow, right-aligned actions.
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
  meta,
}: {
  breadcrumb?: string[];
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-4 sm:mx-6 lg:mx-8 mt-6 mb-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-6 lg:px-8 py-6 overflow-hidden"
    >
      <div className="absolute -top-16 -right-10 w-72 h-72 bg-brand/[0.06] rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-brand/[0.04] rounded-full blur-[70px] pointer-events-none" />
      <div className="relative">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground/30">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-foreground/80' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-[24px] lg:text-[26px] font-display font-bold text-foreground tracking-[-0.02em] leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-[13px] text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {meta && <div className="mt-4">{meta}</div>}
      </div>
    </motion.div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 sm:px-6 lg:px-8 pb-10 space-y-4', className)}>{children}</div>;
}


/**
 * Shopify-style empty state — large icon frame, tight copy, single primary action.
 * Used when a page has no data OR when a feature is not yet available.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  learnMoreHref,
  status = 'empty',
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
  learnMoreHref?: string;
  status?: 'empty' | 'coming-soon';
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
      <div className="py-16 sm:py-20 px-6 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/[0.03] to-transparent pointer-events-none" />
        <div className="relative mx-auto h-16 w-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-5">
          <Icon className="h-7 w-7 text-brand" />
        </div>
        {status === 'coming-soon' && (
          <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5 mb-3">
            Setting up
          </span>
        )}
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
        <p className="text-[13px] text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {primaryAction && (
              <Button size="sm" className="h-9 rounded-lg text-xs" onClick={primaryAction.onClick}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> {primaryAction.label}
              </Button>
            )}
            {secondaryAction && (
              <Button size="sm" variant="outline" className="h-9 rounded-lg text-xs" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="mt-4 inline-block text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Learn more
          </a>
        )}
      </div>
    </div>
  );
}

/** Compact stat card — used on Home dashboard */
export function StatCard({
  label, value, delta, hint,
}: { label: string; value: string; delta?: { value: string; positive?: boolean }; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-6 w-24 h-24 bg-brand/[0.05] rounded-full blur-[40px] pointer-events-none" />
      <p className="relative text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">{label}</p>
      <div className="relative flex items-baseline gap-2 mt-2">
        <p className="text-[26px] font-display font-bold tabular-nums tracking-[-0.02em]">{value}</p>
        {delta && (
          <span className={cn(
            'text-[11px] font-medium tabular-nums',
            delta.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
          )}>
            {delta.positive ? '+' : ''}{delta.value}
          </span>
        )}
      </div>
      {hint && <p className="relative text-[11px] text-muted-foreground/70 mt-1">{hint}</p>}
    </div>
  );
}
