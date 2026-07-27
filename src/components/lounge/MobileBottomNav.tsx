import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, Calendar, CreditCard, MessageSquare, Settings,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { haptic } from '@/hooks/useTouch';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const bottomTabs: NavItem[] = [
  { label: 'Home', icon: Home, path: '/lounge' },
  { label: 'Calendar', icon: Calendar, path: '/lounge/calendar' },
  { label: 'Billing', icon: CreditCard, path: '/lounge/billing' },
  { label: 'Messages', icon: MessageSquare, path: '/lounge/messages' },
  { label: 'Settings', icon: Settings, path: '/lounge/settings' },
];

interface MobileBottomNavProps {
  unreadCount: number;
  show2FAWarning: boolean;
  onSignOut?: () => void;
  onMenuOpen?: () => void;
}

export function MobileBottomNav({ unreadCount, onMenuOpen }: MobileBottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isPathActive = (path: string) => {
    if (path === '/lounge') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Hamburger for more items */}
          <button
            onClick={() => { haptic(20); onMenuOpen?.(); }}
            className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors text-muted-foreground active:bg-accent/50"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>

          {bottomTabs.map((item) => {
            const isActive = isPathActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { haptic(15); navigate(item.path); }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-colors relative touch-ripple min-w-[52px]",
                  isActive ? "text-primary" : "text-muted-foreground active:bg-accent/50"
                )}
                aria-label={item.label}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.path === '/lounge/messages' && unreadCount > 0 && (
                    <Badge className="absolute -top-1.5 -right-2.5 h-4 min-w-[16px] px-1 text-[9px]">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
      {/* Spacer */}
      <div className="lg:hidden h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </>
  );
}
