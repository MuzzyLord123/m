import { Briefcase, Eye, Rocket, Shield, Star } from 'lucide-react';

export type AccountTypeKey = 'paid_client' | 'live_preview' | 'viewer_only' | 'business_management' | 'admin';

export const ACCOUNT_TYPES: {
  key: AccountTypeKey;
  label: string;
  description: string;
  icon: any;
  isAdmin?: boolean;
  hideWebsiteFields?: boolean;
}[] = [
  {
    key: 'paid_client',
    label: 'Paid Client',
    description: 'Full paying customer with access to every Quooro app and their live website.',
    icon: Star,
  },
  {
    key: 'live_preview',
    label: 'Live Preview',
    description: 'Prospect exploring the platform with an active preview site. Upgrade prompts enabled.',
    icon: Rocket,
  },
  {
    key: 'viewer_only',
    label: 'Viewer Only',
    description: 'Just looking around — no preview prompts, no billing nags, browse-only access.',
    icon: Eye,
    hideWebsiteFields: true,
  },
  {
    key: 'business_management',
    label: 'Business Management',
    description: 'Non-website client using CRM, Quooro Office, Planner, Accounting and other business apps.',
    icon: Briefcase,
    hideWebsiteFields: true,
  },
  {
    key: 'admin',
    label: 'Admin',
    description: 'Internal Quooro team member. Full Quooro Team + CRM access.',
    icon: Shield,
    isAdmin: true,
  },
];

// Feature registry for preset editor
export interface FeatureDef { key: string; label: string; group: string; }

export const FEATURES: FeatureDef[] = [
  { key: 'dashboard', label: 'Dashboard', group: 'Core' },
  { key: 'notifications', label: 'Notifications', group: 'Core' },
  { key: 'files', label: 'Files & Vault', group: 'Core' },

  { key: 'crm', label: 'CRM', group: 'Business Management' },
  { key: 'office', label: 'Quooro Office', group: 'Business Management' },
  { key: 'planner', label: 'Planner', group: 'Business Management' },
  { key: 'calendar', label: 'Calendar', group: 'Business Management' },
  { key: 'email', label: 'Email', group: 'Business Management' },
  { key: 'team-comms', label: 'Team Comms', group: 'Business Management' },
  { key: 'bookings', label: 'Bookings', group: 'Business Management' },
  { key: 'inventory', label: 'Inventory', group: 'Business Management' },
  { key: 'accounting', label: 'Accounting', group: 'Business Management' },
  { key: 'hr', label: 'HR', group: 'Business Management' },
  { key: 'ads', label: 'Ad Campaigns', group: 'Business Management' },
  { key: 'social', label: 'Social Media', group: 'Business Management' },
  { key: 'marketing-calendar', label: 'Marketing Calendar', group: 'Business Management' },
  { key: 'content', label: 'Content Requests', group: 'Business Management' },
  { key: 'tickets', label: 'Support Tickets', group: 'Business Management' },
  { key: 'reports', label: 'Reports', group: 'Business Management' },

  { key: 'website-designer', label: 'Website Designer', group: 'Website' },
  { key: 'cad-studio', label: 'CAD Studio', group: 'Website' },
  { key: 'hosted-sites', label: 'Hosted Websites', group: 'Website' },
  { key: 'subscription-sites', label: 'Subscription Websites', group: 'Website' },
  { key: 'ecommerce', label: 'E-commerce Builder', group: 'Website' },
  { key: 'preview', label: 'Live Preview Prompts', group: 'Website' },

  { key: 'billing', label: 'Billing', group: 'Billing' },
  { key: 'invoices', label: 'Invoices', group: 'Billing' },
];
