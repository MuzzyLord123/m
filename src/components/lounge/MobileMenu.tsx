import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Moon, Sun, LogOut, Radar } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useTouch';
import { useBranding } from '@/contexts/BrandingContext';
import { useAccountType } from '@/hooks/useAccountType';
import { AvatarID, StatusDot } from '@/components/platform';
import { ALL_NAV_ITEMS, type NavItemDef } from './PortalSidebar';

/**
 * The Lounge mobile menu, built for this platform rather than inherited
 * from it: identity up top, the workspace mapped into named sections
 * beneath, theme and sign out anchored at the bottom. Destinations come
 * straight from the sidebar registry (ALL_NAV_ITEMS) filtered by the
 * same account-type visibility, so this menu can never drift from the
 * desktop navigation. Swipe left or tap the scrim to dismiss.
 */

const SECTIONS: { label: string; ids: string[] }[] = [
  { label: 'Home', ids: ['dashboard', 'ai-assistant'] },
  { label: 'Studio', ids: ['website', 'website-designer', 'products', 'apps', 'crm', 'workflows', 'office'] },
  { label: 'Growth', ids: ['content', 'seo', 'ads', 'social', 'calendar', 'bookings'] },
  { label: 'Files', ids: ['assets', 'uploads', 'inventory'] },
  { label: 'Business', ids: ['team', 'billing', 'invoices', 'mail', 'messages', 'team-comms', 'tickets', 'notifications'] },
  { label: 'Platform', ids: ['white-label', 'automations-pro', 'planner', 'settings'] },
];

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  profile: { full_name: string | null; company: string | null; avatar_url: string | null } | null;
  user: { email?: string; id?: string } | null;
  unreadCount: number;
  show2FAWarning: boolean;
  onSignOut: () => void;
}

export function MobileMenu({ open, onClose, profile, user, unreadCount, show2FAWarning, onSignOut }: MobileMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const branding = useBranding();
  const { canSee } = useAccountType();
  const reduceMotion = useReducedMotion();

  const itemMap = useMemo(() => new Map(ALL_NAV_ITEMS.map(i => [i.id, i])), []);

  // Registry-driven sections; anything new in the registry that no
  // section claims lands in Platform so it is never invisible here.
  const sections = useMemo(() => {
    const claimed = new Set(SECTIONS.flatMap(s => s.ids));
    const orphans = ALL_NAV_ITEMS.filter(i => !claimed.has(i.id)).map(i => i.id);
    return SECTIONS.map((s, i) => ({
      ...s,
      ids: i === SECTIONS.length - 1 ? [...s.ids, ...orphans] : s.ids,
    }))
      .map(s => ({ ...s, items: s.ids.map(id => itemMap.get(id)).filter((it): it is NavItemDef => !!it && canSee(it.id)) }))
      .filter(s => s.items.length > 0);
  }, [itemMap, canSee]);

  const isPathActive = (path: string) => {
    if (path === '/lounge') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const go = (path: string) => {
    haptic(15);
    navigate(path);
    onClose();
  };

  const displayName = profile?.full_name || user?.email || 'Your account';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/55 lg:hidden"
            onClick={onClose}
            aria-hidden
          />
          <motion.nav
            role="dialog"
            aria-label="Menu"
            initial={{ x: reduceMotion ? 0 : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag={reduceMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.6, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 || info.velocity.x < -400) onClose();
            }}
            className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(360px,88vw)] flex-col border-r border-border/60 bg-background lg:hidden"
          >
            {/* Identity header */}
            <header className="shrink-0 px-5 pt-[max(16px,env(safe-area-inset-top))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {branding.isCustomLogo ? (
                    <img src={branding.logoUrl} alt="Logo" className="h-8 w-8 rounded-[9px] object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border/60 bg-card">
                      <Radar className="h-4 w-4 text-primary" />
                    </span>
                  )}
                  <div>
                    <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">
                      {branding.isCustomLogo ? 'Workspace' : 'Quooro'}
                    </p>
                    <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Client lounge
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => go('/lounge/settings')}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-3 text-left transition-colors hover:bg-foreground/[0.025]"
              >
                <AvatarID name={profile?.full_name ?? null} email={user?.email ?? null} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium leading-tight">{displayName}</span>
                  <span className="block truncate font-mono text-[10.5px] leading-tight text-muted-foreground">
                    {user?.email}
                  </span>
                </span>
                {show2FAWarning && (
                  <span className="flex shrink-0 items-center gap-1.5">
                    <StatusDot tone="attend" />
                    <span className="text-[10.5px] text-attend">2FA off</span>
                  </span>
                )}
              </button>

              <div aria-hidden className="mt-4 h-px bg-gradient-to-r from-primary/50 via-border to-transparent" />
            </header>

            {/* Destinations */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {sections.map((section, si) => (
                <motion.section
                  key={section.label}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + si * 0.045, duration: 0.25, ease: 'easeOut' }}
                  className="pb-1.5 pt-2.5"
                >
                  <p className="flex items-baseline justify-between px-2.5 pb-1">
                    <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {section.label}
                    </span>
                    <span className="font-mono text-[8.5px] tabular-nums text-muted-foreground/50">
                      {String(si + 1).padStart(2, '0')}
                    </span>
                  </p>
                  <div className="space-y-px">
                    {section.items.map(item => {
                      const active = isPathActive(item.path);
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => go(item.path)}
                          className={cn(
                            'relative flex min-h-[44px] w-full items-center gap-3 rounded-lg px-2.5 text-left text-[13.5px] transition-colors duration-150',
                            active
                              ? 'bg-foreground/[0.045] font-medium text-foreground'
                              : 'text-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground',
                          )}
                        >
                          {active && (
                            <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                          )}
                          <Icon className={cn('h-[17px] w-[17px] shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.id === 'messages' && unreadCount > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] tabular-nums text-primary-foreground">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.section>
              ))}
            </div>

            {/* Anchored actions */}
            <footer className="shrink-0 border-t border-border/60 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2.5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 text-[12.5px] text-foreground/80 transition-colors hover:text-foreground"
                >
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  type="button"
                  onClick={() => { haptic(50); onSignOut(); }}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 text-[12.5px] text-risk transition-colors hover:bg-risk/[0.06]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
              <p className="pt-2 text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
                Quooro · Built in Wales
              </p>
            </footer>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
