import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Globe,
  Layout,
  FileText,
  Search,
  Megaphone,
  Share2,
  Calendar,
  HardDrive,
  Upload,
  Users,
  CreditCard,
  MessageSquare,
  Settings
} from 'lucide-react';

type SectionGroup = 'projects' | 'marketing' | 'files' | 'manage';

interface TabItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sectionTabs: Record<SectionGroup, TabItem[]> = {
  projects: [
    { label: 'Website', path: '/lounge/website', icon: Globe },
    { label: 'App Projects', path: '/lounge/apps', icon: Layout },
    { label: 'Content Requests', path: '/lounge/content', icon: FileText },
  ],
  marketing: [
    { label: 'SEO Checker', path: '/lounge/seo-checker', icon: Search },
    { label: 'Ad Campaigns', path: '/lounge/ads', icon: Megaphone },
    { label: 'Social Media', path: '/lounge/social', icon: Share2 },
    { label: 'Calendar', path: '/lounge/calendar', icon: Calendar },
  ],
  files: [
    { label: 'Asset Storage', path: '/lounge/assets', icon: HardDrive },
    { label: 'Uploads', path: '/lounge/uploads', icon: Upload },
  ],
  manage: [
    { label: 'Team', path: '/lounge/team', icon: Users },
    { label: 'Plan & Billing', path: '/lounge/billing', icon: CreditCard },
    { label: 'Messages', path: '/lounge/messages', icon: MessageSquare },
    { label: 'Settings', path: '/lounge/settings', icon: Settings },
  ],
};

const pathToSection: Record<string, SectionGroup> = {
  '/lounge/website': 'projects',
  '/lounge/apps': 'projects',
  '/lounge/content': 'projects',
  '/lounge/seo-checker': 'marketing',
  '/lounge/ads': 'marketing',
  '/lounge/social': 'marketing',
  '/lounge/calendar': 'marketing',
  '/lounge/assets': 'files',
  '/lounge/uploads': 'files',
  '/lounge/team': 'manage',
  '/lounge/billing': 'manage',
  '/lounge/messages': 'manage',
  '/lounge/settings': 'manage',
};

interface SectionTabsProps {
  className?: string;
}

export function SectionTabs({ className }: SectionTabsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Determine which section we're in
  const currentSection = pathToSection[currentPath];
  
  // Don't show tabs on dashboard or if section not found
  if (!currentSection) {
    return null;
  }

  const tabs = sectionTabs[currentSection];

  return (
    <div className={cn("border-b border-border/50 bg-background/80 backdrop-blur-sm", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none -mb-px" aria-label="Section navigation">
          {tabs.map((tab) => {
            const isActive = currentPath === tab.path;
            const TabIcon = tab.icon;
            
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="section-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
