import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Sparkles, Globe, Layout, FileText, Search,
  Megaphone, Share2, Calendar, HardDrive, Upload,
  Users, CreditCard, MessageSquare, Settings, Ticket,
  Paintbrush, Wand2, Package, Target, Workflow,
  BarChart3, Bell, Radio, PenTool, X, Moon, Sun, LogOut,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { haptic } from '@/hooks/useTouch';
import { useBranding } from '@/contexts/BrandingContext';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const drawerItems: NavItem[] = [
  { label: 'Dashboard', icon: Home, path: '/lounge' },
  { label: 'Quooro AI', icon: Sparkles, path: '/lounge/ai' },
  { label: 'Website', icon: Globe, path: '/lounge/website' },
  { label: 'Website Dashboard', icon: Paintbrush, path: '/lounge/website-designer' },
  { label: 'AI Builder', icon: Wand2, path: '/lounge/ai-builder' },
  { label: 'Products & CMS', icon: Package, path: '/lounge/products' },
  { label: 'App Projects', icon: Layout, path: '/lounge/apps' },
  { label: 'Quooro Office', icon: FileSpreadsheet, path: '/lounge/office' },
  { label: 'CRM', icon: Target, path: '/lounge/crm' },
  { label: 'Workflows', icon: Workflow, path: '/lounge/workflows' },
  
  { label: 'Content Requests', icon: FileText, path: '/lounge/content' },
  { label: 'SEO Checker', icon: Search, path: '/lounge/seo-checker' },
  { label: 'Ad Campaigns', icon: Megaphone, path: '/lounge/ads' },
  { label: 'Social Media', icon: Share2, path: '/lounge/social' },
  { label: 'Calendar', icon: Calendar, path: '/lounge/calendar' },
  { label: 'Asset Storage', icon: HardDrive, path: '/lounge/assets' },
  { label: 'Uploads', icon: Upload, path: '/lounge/uploads' },
  { label: 'Team', icon: Users, path: '/lounge/team' },
  { label: 'Plan & Billing', icon: CreditCard, path: '/lounge/billing' },
  { label: 'Messages', icon: MessageSquare, path: '/lounge/messages' },
  { label: 'Team Comms', icon: Radio, path: '/lounge/team-comms' },
  { label: 'Support Tickets', icon: Ticket, path: '/lounge/tickets' },
  { label: 'Notifications', icon: Bell, path: '/lounge/notifications' },
  { label: 'CAD Studio', icon: PenTool, path: '/lounge/cad-studio' },
  { label: 'Settings', icon: Settings, path: '/lounge/settings' },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  unreadCount: number;
  onSignOut: () => void;
}

export function MobileDrawer({ open, onClose, unreadCount, onSignOut }: MobileDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const branding = useBranding();

  const isPathActive = (path: string) => {
    if (path === '/lounge') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNav = (path: string) => {
    haptic(15);
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mobile-drawer-overlay lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="mobile-drawer lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto dark:brightness-0 dark:invert" />
              <button
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <div className="mobile-menu-scroll py-2 px-2 space-y-0.5 flex-1">
              {drawerItems.map((item) => {
                const isActive = isPathActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={cn(
                      'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all touch-target touch-ripple',
                      isActive
                        ? 'bg-brand/10 text-primary border-l-2 border-brand'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    )}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.path === '/lounge/messages' && unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 flex items-center justify-center text-[10px] px-1.5 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer actions */}
            <div className="border-t border-border p-3 space-y-1">
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:bg-accent/50 touch-target"
              >
                {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button
                onClick={() => { haptic(50); onSignOut(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-destructive hover:bg-destructive/10 touch-target"
              >
                <LogOut className="w-[18px] h-[18px]" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
