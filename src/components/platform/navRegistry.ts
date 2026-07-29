import { ALL_NAV_ITEMS } from '@/components/lounge/PortalSidebar';
import { ALL_TEAM_NAV_ITEMS } from '@/components/layout/TeamSidebar';

/**
 * The single source of truth for "everywhere you can go". The Lounge and
 * Team entries are IMPORTED from the live sidebars (not copied), so the
 * palette can never drift from the menus — if it's in a sidebar, it's in
 * the palette. Full-screen apps and admin surfaces that don't live in a
 * sidebar are added below with verified routes only.
 */
export interface Destination {
  id: string;
  label: string;
  path: string;
  group: 'Lounge' | 'Apps & studios' | 'Quooro Office' | 'Admin';
  keywords?: string;
  /** Which app roles see this destination in the palette. */
  roles: ReadonlyArray<'user' | 'admin' | 'executive'>;
}

const CLIENT: Destination['roles'] = ['user'];
const SHARED: Destination['roles'] = ['user', 'admin'];
const TEAM: Destination['roles'] = ['admin'];

/** Paths where CustomerGuard lets admins through (shared full-screen apps). */
const SHARED_PREFIXES = [
  '/lounge/office',
  '/lounge/creative',
  '/lounge/editor',
  '/lounge/cad-studio',
  '/lounge/ai-builder',
  '/lounge/site-settings',
  '/lounge/crm',
];

const isShared = (path: string) => SHARED_PREFIXES.some((p) => path.startsWith(p));

const loungeDestinations: Destination[] = ALL_NAV_ITEMS.map((item) => ({
  id: `lounge:${item.id}`,
  label: item.label,
  path: item.path,
  group: 'Lounge',
  roles: isShared(item.path) ? SHARED : CLIENT,
}));

const appDestinations: Destination[] = [
  { id: 'app:word', label: 'Word', path: '/lounge/office/word-home', keywords: 'document write' },
  { id: 'app:excel', label: 'Excel', path: '/lounge/office/excel-home', keywords: 'spreadsheet' },
  { id: 'app:sheets', label: 'Sheets', path: '/lounge/office/sheets-home', keywords: 'spreadsheet' },
  { id: 'app:powerpoint', label: 'PowerPoint', path: '/lounge/office/powerpoint-home', keywords: 'slides deck' },
  { id: 'app:onenote', label: 'OneNote', path: '/lounge/office/onenote-home', keywords: 'notes' },
  { id: 'app:onedrive', label: 'Drive', path: '/lounge/office/onedrive', keywords: 'files storage' },
  { id: 'app:whiteboard', label: 'Whiteboard', path: '/lounge/office/whiteboard-home', keywords: 'draw' },
  { id: 'app:forms', label: 'Forms', path: '/lounge/office/forms-home', keywords: 'survey' },
  { id: 'app:pdf', label: 'PDF studio', path: '/lounge/office/pdf-home', keywords: 'documents' },
  { id: 'app:tasks', label: 'Tasks', path: '/lounge/office/tasks', keywords: 'todo' },
  { id: 'app:calculator', label: 'Calculator', path: '/lounge/office/calculator' },
  { id: 'app:pomodoro', label: 'Pomodoro', path: '/lounge/office/pomodoro', keywords: 'timer focus' },
  { id: 'app:polls', label: 'Polls', path: '/lounge/office/polls-home', keywords: 'vote' },
  { id: 'app:bookmarks', label: 'Bookmarks', path: '/lounge/office/bookmarks', keywords: 'links' },
  { id: 'app:sticky-wall', label: 'Sticky wall', path: '/lounge/office/sticky-wall-home', keywords: 'notes board' },
  { id: 'app:operations', label: 'Operations', path: '/lounge/office/operations' },
  { id: 'app:accounting', label: 'Accounting', path: '/lounge/office/accounting', keywords: 'ledger vat payroll invoices' },
  { id: 'app:ecommerce', label: 'E-commerce', path: '/lounge/office/ecommerce', keywords: 'shop products orders' },
  { id: 'app:invoices', label: 'Invoices', path: '/lounge/office/invoices', keywords: 'billing' },
  { id: 'app:analytics', label: 'Analytics studio', path: '/lounge/office/analytics', keywords: 'charts reports' },
  { id: 'app:hr', label: 'HR', path: '/lounge/office/hr', keywords: 'people payroll' },
  { id: 'app:expenses', label: 'Expenses', path: '/lounge/office/expenses', keywords: 'receipts' },
  { id: 'app:contracts', label: 'Contracts', path: '/lounge/office/contracts', keywords: 'legal' },
  { id: 'app:time-tracker', label: 'Time tracker', path: '/lounge/office/time-tracker' },
  { id: 'app:wiki', label: 'Wiki', path: '/lounge/office/wiki', keywords: 'knowledge docs' },
  { id: 'app:design-studio', label: 'Design studio', path: '/lounge/office/design-studio', keywords: 'canva graphics' },
  { id: 'app:photo-studio', label: 'Photo studio', path: '/lounge/creative/photo-studio', keywords: 'images editing' },
  { id: 'app:cad', label: 'CAD studio', path: '/lounge/cad-studio', keywords: 'drawing technical' },
  { id: 'app:ai-builder', label: 'AI builder', path: '/lounge/ai-builder', keywords: 'website generate' },
].map((d) => ({ ...d, group: 'Apps & studios' as const, roles: SHARED }));

const teamDestinations: Destination[] = ALL_TEAM_NAV_ITEMS.map((item) => ({
  id: `team:${item.id}`,
  label: item.label,
  path: item.path,
  group: 'Quooro Office',
  roles: item.id === 'executive' ? (['admin', 'executive'] as const) : TEAM,
}));

const adminDestinations: Destination[] = [
  {
    id: 'admin:marketing-site',
    label: 'Marketing site editor',
    path: '/admin/marketing-site',
    group: 'Admin',
    keywords: 'website content hero',
    roles: TEAM,
  },
];

export const DESTINATIONS: Destination[] = [
  ...loungeDestinations,
  ...appDestinations,
  ...teamDestinations,
  ...adminDestinations,
];

export function destinationsForRole(role: string | null | undefined): Destination[] {
  const r = role === 'admin' || role === 'executive' ? role : 'user';
  return DESTINATIONS.filter((d) => (d.roles as readonly string[]).includes(r));
}
