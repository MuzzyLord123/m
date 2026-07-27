import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';

interface LoungePageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function LoungePageHeader({ 
  title, 
  description, 
  icon: Icon, 
  iconColor = 'text-brand',
  badge,
  actions,
  children 
}: LoungePageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-6 lg:p-8 mb-6"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand/[0.04] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-brand/[0.03] rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {Icon && (
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-8 w-8 rounded-xl bg-brand/10 flex items-center justify-center">
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              {badge && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground tracking-[-0.02em]">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </motion.div>
  );
}
