import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const pathLabels: Record<string, string> = {
  '/lounge': 'Dashboard',
  '/lounge/website': 'Website',
  '/lounge/apps': 'App Projects',
  '/lounge/content': 'Content Requests',
  '/lounge/seo-checker': 'SEO Checker',
  '/lounge/ads': 'Ad Campaigns',
  '/lounge/social': 'Social Media',
  '/lounge/calendar': 'Marketing Calendar',
  '/lounge/assets': 'Asset Storage',
  '/lounge/uploads': 'Uploads',
  '/lounge/team': 'Team',
  '/lounge/billing': 'Plan & Billing',
  '/lounge/messages': 'Messages',
  '/lounge/settings': 'Settings',
};

const pathCategories: Record<string, { label: string; firstPath: string }> = {
  '/lounge/website': { label: 'Projects', firstPath: '/lounge/website' },
  '/lounge/apps': { label: 'Projects', firstPath: '/lounge/website' },
  '/lounge/content': { label: 'Projects', firstPath: '/lounge/website' },
  '/lounge/seo-checker': { label: 'Marketing', firstPath: '/lounge/seo-checker' },
  '/lounge/ads': { label: 'Marketing', firstPath: '/lounge/seo-checker' },
  '/lounge/social': { label: 'Marketing', firstPath: '/lounge/seo-checker' },
  '/lounge/calendar': { label: 'Marketing', firstPath: '/lounge/seo-checker' },
  '/lounge/assets': { label: 'Files', firstPath: '/lounge/assets' },
  '/lounge/uploads': { label: 'Files', firstPath: '/lounge/assets' },
  '/lounge/team': { label: 'Manage', firstPath: '/lounge/team' },
  '/lounge/billing': { label: 'Manage', firstPath: '/lounge/team' },
  '/lounge/messages': { label: 'Manage', firstPath: '/lounge/team' },
  '/lounge/settings': { label: 'Manage', firstPath: '/lounge/team' },
};

interface PortalBreadcrumbProps {
  className?: string;
}

export function PortalBreadcrumb({ className }: PortalBreadcrumbProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show breadcrumb on dashboard
  if (currentPath === '/lounge') {
    return null;
  }

  const items: BreadcrumbItem[] = [
    { label: 'Lounge', path: '/lounge' },
  ];

  // Add category with proper first path
  const categoryConfig = pathCategories[currentPath];
  if (categoryConfig) {
    items.push({ label: categoryConfig.label, path: categoryConfig.firstPath });
  }

  // Add current page only if different from category first path
  const currentLabel = pathLabels[currentPath];
  if (currentLabel && categoryConfig && currentPath !== categoryConfig.firstPath) {
    items.push({ label: currentLabel, path: currentPath });
  } else if (currentLabel && !categoryConfig) {
    items.push({ label: currentLabel, path: currentPath });
  }

  return (
    <nav 
      className={cn("flex items-center text-sm", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={`${item.path}-${index}`} className="flex items-center gap-1.5">
              {index === 0 && (
                <Home className="w-4 h-4 text-muted-foreground" />
              )}
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              )}
              {isLast ? (
                <span className="font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
