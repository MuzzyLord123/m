import { useMemo } from 'react';
import {
  Home, Globe, Paintbrush, Package, Layout, Target, Workflow, FileText, Search,
  Megaphone, Share2, Calendar, HardDrive, Upload, Users, CreditCard, Mail,
  MessageSquare, Radio, Ticket, Bell, PenTool, Boxes, FileSpreadsheet, BarChart3,
  Palette, Sparkles, Settings, Wand2, X, Eye,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RBAC_MODULES, type RBACPermission } from '@/hooks/useRBAC';

// Map RBAC module IDs to sidebar nav items
const MODULE_TO_NAV: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  'command-center': { label: 'Dashboard', icon: Home },
  'websites': { label: 'Website', icon: Globe },
  'website-designer': { label: 'Website Designer', icon: Paintbrush },
  'apps': { label: 'App Projects', icon: Layout },
  'content': { label: 'Content Requests', icon: FileText },
  'ads': { label: 'Ad Campaigns', icon: Megaphone },
  'social': { label: 'Social Media', icon: Share2 },
  'calendar': { label: 'Calendar', icon: Calendar },
  'assets': { label: 'Asset Storage', icon: HardDrive },
  'clients': { label: 'CRM', icon: Target },
  'leads': { label: 'Leads', icon: Target },
  'enquiries': { label: 'Enquiries', icon: Target },
  'client-accounts': { label: 'Client Accounts', icon: Users },
  'invoices': { label: 'Invoices', icon: CreditCard },
  'billing': { label: 'Plan & Billing', icon: CreditCard },
  'messages': { label: 'Messages', icon: MessageSquare },
  'team-comms': { label: 'Team Comms', icon: Radio },
  'tickets': { label: 'Support Tickets', icon: Ticket },
  'cad-studio': { label: 'CAD Studio', icon: PenTool },
  'office': { label: 'Quooro Office', icon: FileSpreadsheet },
  'workflows': { label: 'Workflows', icon: Workflow },
  'security': { label: 'Security', icon: Settings },
  'announcements': { label: 'Announcements', icon: Bell },
  'knowledge-base': { label: 'Knowledge Base', icon: FileText },
  'automation-rules': { label: 'Automation Rules', icon: Workflow },
  'settings': { label: 'Settings', icon: Settings },
  'live-sessions': { label: 'Live Sessions', icon: Radio },
};

interface RoleDashboardPreviewProps {
  open: boolean;
  onClose: () => void;
  roleName: string;
  roleColor: string;
  permissions: RBACPermission[];
}

export function RoleDashboardPreview({ open, onClose, roleName, roleColor, permissions }: RoleDashboardPreviewProps) {
  const viewableModules = useMemo(() => {
    const modules = new Set<string>();
    permissions.forEach(p => {
      if (p.action === 'view' && p.granted) modules.add(p.module);
    });
    return modules;
  }, [permissions]);

  const allModules = RBAC_MODULES.map(m => ({
    ...m,
    nav: MODULE_TO_NAV[m.id],
    enabled: viewableModules.has(m.id),
  }));

  const enabledModules = allModules.filter(m => m.enabled && m.nav);
  const disabledModules = allModules.filter(m => !m.enabled && m.nav);

  // Group enabled by RBAC group
  const groupedEnabled = useMemo(() => {
    const groups = new Map<string, typeof enabledModules>();
    enabledModules.forEach(m => {
      const arr = groups.get(m.group) || [];
      arr.push(m);
      groups.set(m.group, arr);
    });
    return groups;
  }, [enabledModules]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <DialogTitle className="text-base">
              Viewing Dashboard as{' '}
              <span className="font-bold" style={{ color: roleColor }}>{roleName}</span>
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            This preview shows the sidebar modules a team member with this role would see.
          </p>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {/* Simulated Sidebar */}
          <div className="w-[220px] border-r border-border bg-muted/30 flex flex-col">
            <div className="p-3 border-b border-border">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Sidebar Preview
              </p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {/* Always-visible items */}
                <SidebarItem icon={Home} label="Dashboard" enabled />
                <SidebarItem icon={Sparkles} label="Quooro AI" enabled />

                {enabledModules.map(m => (
                  <SidebarItem
                    key={m.id}
                    icon={m.nav!.icon}
                    label={m.nav!.label}
                    enabled
                    accentColor={roleColor}
                  />
                ))}

                <div className="pt-2 mt-2 border-t border-border">
                  <SidebarItem icon={Settings} label="Settings" enabled />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main area summary */}
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Visible Modules" value={enabledModules.length} color={roleColor} />
                <StatCard label="Hidden Modules" value={disabledModules.length} color="hsl(var(--muted-foreground))" />
                <StatCard label="Total Permissions" value={permissions.filter(p => p.granted).length} color={roleColor} />
              </div>

              {/* Accessible modules by group */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Accessible Modules
                </h4>
                {enabledModules.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No modules enabled for this role. Members won't see any sidebar items.</p>
                ) : (
                  <div className="space-y-3">
                    {Array.from(groupedEnabled.entries()).map(([group, modules]) => (
                      <div key={group}>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{group}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {modules.map(m => (
                            <Badge
                              key={m.id}
                              variant="secondary"
                              className="gap-1.5 text-xs"
                              style={{ borderColor: roleColor, borderWidth: 1 }}
                            >
                              {m.nav && <m.nav.icon className="w-3 h-3" />}
                              {m.nav?.label || m.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden modules */}
              {disabledModules.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                    Hidden Modules
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {disabledModules.map(m => (
                      <Badge key={m.id} variant="outline" className="gap-1.5 text-xs opacity-50">
                        {m.nav && <m.nav.icon className="w-3 h-3" />}
                        {m.nav?.label || m.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Permission breakdown */}
              <div>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Permission Actions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'manage_settings'].map(action => {
                    const count = permissions.filter(p => p.action === action && p.granted).length;
                    return (
                      <div key={action} className="rounded-lg border border-border p-2.5 text-center">
                        <p className="text-lg font-bold" style={{ color: count > 0 ? roleColor : undefined }}>
                          {count}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground capitalize">
                          {action.replace('_', ' ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SidebarItem({ icon: Icon, label, enabled, accentColor }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  enabled: boolean;
  accentColor?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
      enabled ? "text-foreground hover:bg-muted/50" : "text-muted-foreground/30"
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-lg border border-border p-3 text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
