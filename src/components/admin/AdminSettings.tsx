import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderPlus, Pencil, Trash2, X, Plus, ChevronDown, RotateCcw,
  Mail, Users, Megaphone, Share2, FileText, Calendar, Globe,
  CreditCard, MessageSquare, Shield, Settings, Workflow, BarChart3, Monitor,
  Target, HardDrive, FolderOpen, Palette, Grip, Square, RectangleHorizontal,
  Type, Sparkles, ToggleLeft, KeyRound, Lock, AlertTriangle, Clock, Smartphone,
} from 'lucide-react';
import { DeviceSettingsTab } from '@/components/lounge/DeviceSettingsTab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useTeamSidebarLayout, TEAM_FOLDER_COLORS, type TeamSidebarFolder } from '@/hooks/useTeamSidebarLayout';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'command-center': BarChart3, enquiries: Mail, leads: Target, clients: Users,
  'client-accounts': Users, apps: Globe, ads: Megaphone, social: Share2,
  content: FileText, calendar: Calendar, websites: Globe, 'website-designer': Globe,
  'cad-studio': Globe, office: Globe, invoices: FileText,
  billing: CreditCard, messages: MessageSquare, assets: HardDrive, tickets: MessageSquare,
  security: Shield, announcements: Megaphone, workflows: Workflow, resources: BarChart3,
  'live-sessions': Monitor, settings: Settings, 'knowledge-base': FolderOpen,
  'automation-rules': FolderOpen, 'team-comms': MessageSquare, 'roles-permissions': Shield,
};

const LABEL_MAP: Record<string, string> = {
  'command-center': 'Command Center', enquiries: 'Enquiries', leads: 'Leads', clients: 'Clients',
  'client-accounts': 'Client Accounts', apps: 'App Projects', ads: 'Ad Campaigns', social: 'Social Media',
  content: 'Content', calendar: 'Calendar', websites: 'Websites', 'website-designer': 'Website Designer',
  'cad-studio': 'CAD Studio', office: 'Quooro Office', invoices: 'Invoices',
  billing: 'Billing', messages: 'Messages', assets: 'Assets', tickets: 'Tickets',
  security: 'Security', announcements: 'Announcements', workflows: 'Workflows', resources: 'Resources',
  'live-sessions': 'Live Sessions', settings: 'Settings', 'knowledge-base': 'Knowledge Base',
  'automation-rules': 'Automation Rules', 'team-comms': 'Team Comms', 'roles-permissions': 'Roles & Permissions',
};

const PINNED = ['command-center'];
const ALL_DRAGGABLE = Object.keys(LABEL_MAP).filter(id => !PINNED.includes(id));

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function AdminSettings() {
  const {
    layout, loaded, createFolder, renameFolder, deleteFolder, changeFolderColor,
    moveToFolder, moveOutOfFolder, resetToPresets, clearAllFolders,
  } = useTeamSidebarLayout();

  const { preferences, updatePreference, resetPreferences } = useUIPreferences();

  const [createOpen, setCreateOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<TeamSidebarFolder | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [settingsTab, setSettingsTab] = useState<'ui' | 'sidebar' | 'device' | 'vaults'>('ui');
  const [vaultConfigs, setVaultConfigs] = useState<any[]>([]);
  const [passwordVaultConfigs, setPasswordVaultConfigs] = useState<any[]>([]);
  const [vaultProfiles, setVaultProfiles] = useState<Record<string, any>>({});
  const [loadingVaults, setLoadingVaults] = useState(false);

  useEffect(() => {
    if (settingsTab === 'vaults') loadVaultData();
  }, [settingsTab]);

  const loadVaultData = async () => {
    setLoadingVaults(true);
    const [vcRes, pvRes] = await Promise.all([
      (supabase.from('vault_configs').select('*') as any).order('created_at', { ascending: false }),
      (supabase.from('password_vault_configs').select('*') as any).order('created_at', { ascending: false }),
    ]);
    const allVaults = [...(vcRes.data || []), ...(pvRes.data || [])];
    setVaultConfigs(vcRes.data || []);
    setPasswordVaultConfigs(pvRes.data || []);

    // Fetch profiles for user names
    const userIds = [...new Set(allVaults.map((v: any) => v.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email, customer_id').in('user_id', userIds);
      const map: Record<string, any> = {};
      (profiles || []).forEach((p: any) => { map[p.user_id] = p; });
      setVaultProfiles(map);
    }
    setLoadingVaults(false);
  };

  const allFolderItemIds = new Set(layout.folders.flatMap(f => f.itemIds));
  const ungroupedItems = ALL_DRAGGABLE.filter(id => !allFolderItemIds.has(id));

  const handleCreate = () => {
    if (!newName.trim()) return;
    createFolder(newName.trim(), newColor);
    setCreateOpen(false); setNewName(''); setNewColor('#3b82f6');
    toast.success(`Folder "${newName.trim()}" created`);
  };

  const handleEdit = () => {
    if (!editFolder || !newName.trim()) return;
    renameFolder(editFolder.id, newName.trim());
    changeFolderColor(editFolder.id, newColor);
    setEditFolder(null); setNewName('');
    toast.success('Folder updated');
  };

  const handleDelete = (folderId: string) => {
    deleteFolder(folderId); setDeleteConfirm(null);
    toast.success('Folder deleted, items returned to sidebar');
  };

  const handleRemoveItem = (itemId: string, folderId: string) => {
    moveOutOfFolder(itemId, folderId);
    toast.success(`${LABEL_MAP[itemId] || itemId} moved to sidebar`);
  };

  const handleAddItem = (itemId: string, folderId: string) => {
    moveToFolder(itemId, folderId);
    toast.success(`${LABEL_MAP[itemId] || itemId} added to folder`);
  };

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {[
          { key: 'ui' as const, icon: <Palette className="h-3 w-3" />, label: 'UI Preferences' },
          { key: 'sidebar' as const, icon: <FolderOpen className="h-3 w-3" />, label: 'Sidebar Organization' },
          { key: 'device' as const, icon: <Smartphone className="h-3 w-3" />, label: 'Device' },
          { key: 'vaults' as const, icon: <KeyRound className="h-3 w-3" />, label: 'Vaults' },
        ].map(t => (
          <button key={t.key} onClick={() => setSettingsTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              settingsTab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {settingsTab === 'ui' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Reset */}
          <motion.div variants={cardVariants} className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => { resetPreferences(); toast.success('UI preferences reset'); }} className="gap-2 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" />Reset All
            </Button>
          </motion.div>

          {/* Dashboard Density */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Grip className="w-4 h-4" /> Dashboard Density</CardTitle>
                <CardDescription>Control the spacing and size of elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'compact' as const, label: 'Compact', desc: 'Dense layout' },
                    { value: 'comfortable' as const, label: 'Comfortable', desc: 'Balanced' },
                    { value: 'spacious' as const, label: 'Spacious', desc: 'Lots of space' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => updatePreference('dashboardDensity', opt.value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                        preferences.dashboardDensity === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}>
                      <div className={`flex gap-0.5 ${opt.value === 'compact' ? 'gap-px' : opt.value === 'spacious' ? 'gap-1.5' : 'gap-1'}`}>
                        {[1,2,3].map(i => <div key={i} className={`rounded bg-muted-foreground/20 ${opt.value === 'compact' ? 'w-3 h-3' : opt.value === 'spacious' ? 'w-5 h-5' : 'w-4 h-4'}`} />)}
                      </div>
                      <p className={`text-xs font-medium ${preferences.dashboardDensity === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card Style */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Square className="w-4 h-4" /> Card Style</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'bordered' as const, label: 'Bordered', cls: 'border-2 border-muted-foreground/20' },
                    { value: 'elevated' as const, label: 'Elevated', cls: 'shadow-md border-0' },
                    { value: 'flat' as const, label: 'Flat', cls: 'bg-muted/40 border-0' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => updatePreference('cardStyle', opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        preferences.cardStyle === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}>
                      <div className={`w-12 h-8 rounded-md ${opt.cls}`} />
                      <p className={`text-xs font-medium ${preferences.cardStyle === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card Radius */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><RectangleHorizontal className="w-4 h-4" /> Card Corners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {([
                    { value: 'none' as const, label: 'Sharp', r: 'rounded-none' },
                    { value: 'sm' as const, label: 'Small', r: 'rounded-sm' },
                    { value: 'md' as const, label: 'Medium', r: 'rounded-md' },
                    { value: 'lg' as const, label: 'Large', r: 'rounded-xl' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => updatePreference('cardRadius', opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        preferences.cardRadius === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}>
                      <div className={`w-10 h-7 border-2 border-muted-foreground/30 ${opt.r}`} />
                      <p className={`text-xs font-medium ${preferences.cardRadius === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Font Size */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Type className="w-4 h-4" /> Font Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {([
                    { value: 'small' as const, label: 'Small', size: 'text-xs' },
                    { value: 'medium' as const, label: 'Medium', size: 'text-sm' },
                    { value: 'large' as const, label: 'Large', size: 'text-base' },
                  ]).map(opt => (
                    <button key={opt.value} onClick={() => updatePreference('fontSize', opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        preferences.fontSize === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}>
                      <span className={`font-medium ${opt.size} ${preferences.fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>Aa</span>
                      <p className={`text-xs font-medium ${preferences.fontSize === opt.value ? 'text-foreground' : 'text-muted-foreground'}`}>{opt.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Animations */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4" /> Animations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Enable Animations</p>
                    <p className="text-xs text-muted-foreground">Smooth transitions and motion effects</p>
                  </div>
                  <Switch checked={preferences.animationsEnabled} onCheckedChange={(v) => updatePreference('animationsEnabled', v)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {settingsTab === 'sidebar' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Expand All Toggle */}
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" /> Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Expand all folders</p>
                    <p className="text-xs text-muted-foreground">Keep all sidebar folders open by default</p>
                  </div>
                  <Switch checked={preferences.sidebarExpandAll} onCheckedChange={(checked) => updatePreference('sidebarExpandAll', checked)} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions bar */}
          <motion.div variants={cardVariants} className="flex flex-wrap gap-2">
            <Button onClick={() => { setNewName(''); setNewColor('#3b82f6'); setCreateOpen(true); }} className="gap-2">
              <FolderPlus className="w-4 h-4" />Create New Folder
            </Button>
            <Button variant="outline" onClick={() => { resetToPresets(); toast.success('Folders reset to defaults'); }} className="gap-2 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" />Reset to Default
            </Button>
            {layout.folders.length > 0 && (
              <Button variant="outline" onClick={() => { clearAllFolders(); toast.success('All folders removed'); }}
                className="gap-2 text-muted-foreground hover:text-destructive hover:border-destructive/50">
                <Trash2 className="w-3.5 h-3.5" />Remove All
              </Button>
            )}
          </motion.div>

          {/* Folder cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {layout.folders.map((folder) => {
                const availableToAdd = ungroupedItems.filter(id => !folder.itemIds.includes(id));
                return (
                  <motion.div key={folder.id} variants={cardVariants} layout exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}>
                    <Card className="overflow-hidden border-border/60 bg-card hover:border-border transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-4 h-4 rounded-full shrink-0 ring-2 ring-offset-2 ring-offset-card ring-border/40" style={{ backgroundColor: folder.color }} />
                            <CardTitle className="text-sm font-semibold truncate">{folder.name}</CardTitle>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">{folder.itemIds.length}</Badge>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => { setEditFolder(folder); setNewName(folder.name); setNewColor(folder.color); }}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteConfirm(folder.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                        <div className="space-y-1">
                          <AnimatePresence mode="popLayout">
                            {folder.itemIds.map(itemId => {
                              const Icon = ICON_MAP[itemId] || FileText;
                              return (
                                <motion.div key={itemId} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 8, transition: { duration: 0.15 } }}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg bg-muted/40 group">
                                  <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span className="text-xs font-medium text-foreground truncate flex-1">{LABEL_MAP[itemId] || itemId}</span>
                                  <button onClick={() => handleRemoveItem(itemId, folder.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-destructive/10 hover:text-destructive">
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                          {folder.itemIds.length === 0 && <p className="text-xs text-muted-foreground/60 text-center py-3">No items</p>}
                        </div>
                        {availableToAdd.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full mt-2 gap-2 text-xs text-muted-foreground h-8">
                                <Plus className="w-3 h-3" />Add Item<ChevronDown className="w-3 h-3 ml-auto" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                              {availableToAdd.map(itemId => {
                                const Icon = ICON_MAP[itemId] || FileText;
                                return (
                                  <DropdownMenuItem key={itemId} onClick={() => handleAddItem(itemId, folder.id)} className="gap-2.5">
                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm">{LABEL_MAP[itemId] || itemId}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {layout.folders.length === 0 && (
            <motion.div variants={cardVariants}>
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
                  <FolderOpen className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No folders yet. Create one to organize your sidebar.</p>
                  <Button size="sm" onClick={() => { setNewName(''); setNewColor('#3b82f6'); setCreateOpen(true); }} className="gap-2">
                    <FolderPlus className="w-4 h-4" />Create Folder
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Ungrouped items */}
          {ungroupedItems.length > 0 && (
            <motion.div variants={cardVariants}>
              <Card className="border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    Ungrouped Items<Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{ungroupedItems.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5">
                    {ungroupedItems.map(itemId => {
                      const Icon = ICON_MAP[itemId] || FileText;
                      return (
                        <motion.div key={itemId} layout className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/30">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">{LABEL_MAP[itemId] || itemId}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      )}

      {settingsTab === 'device' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={cardVariants}>
            <DeviceSettingsTab />
          </motion.div>
        </motion.div>
      )}

      {settingsTab === 'vaults' && (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Lock className="w-4 h-4" /> Secure Vaults</CardTitle>
                <CardDescription>All secure file vaults created by users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVaults ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : vaultConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No secure vaults created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {vaultConfigs.map((v: any) => {
                      const profile = vaultProfiles[v.user_id];
                      return (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50">
                          <div className="p-2 rounded-lg bg-primary/10"><Lock className="w-4 h-4 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{v.vault_name || 'Unnamed Vault'}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile?.full_name || 'Unknown'} {profile?.customer_id ? `(${profile.customer_id})` : ''} · {profile?.email || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {v.failed_attempts > 0 && (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="w-3 h-3" /> {v.failed_attempts} failed
                              </Badge>
                            )}
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
                              <p className="text-xs font-medium">{new Date(v.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><KeyRound className="w-4 h-4" /> Password Vaults</CardTitle>
                <CardDescription>All password vaults created by users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingVaults ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : passwordVaultConfigs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No password vaults created yet.</p>
                ) : (
                  <div className="space-y-2">
                    {passwordVaultConfigs.map((v: any) => {
                      const profile = vaultProfiles[v.user_id];
                      return (
                        <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card/50">
                          <div className="p-2 rounded-lg bg-amber-500/10"><KeyRound className="w-4 h-4 text-amber-500" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{v.vault_name || 'Unnamed Vault'}</p>
                            <p className="text-xs text-muted-foreground">
                              {profile?.full_name || 'Unknown'} {profile?.customer_id ? `(${profile.customer_id})` : ''} · {profile?.email || ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {v.failed_attempts > 0 && (
                              <Badge variant="destructive" className="text-[10px] gap-1">
                                <AlertTriangle className="w-3 h-3" /> {v.failed_attempts} failed
                              </Badge>
                            )}
                            <div className="text-right">
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
                              <p className="text-xs font-medium">{new Date(v.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Create Folder Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>Name your folder and pick a color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. CRM, Finance, Admin"
                maxLength={30} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_FOLDER_COLORS.map(c => (
                  <button key={c.value} onClick={() => setNewColor(c.value)}
                    className={cn("w-8 h-8 rounded-full transition-all duration-200 ring-offset-2 ring-offset-background",
                      newColor === c.value ? "ring-2 ring-primary scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                    )} style={{ backgroundColor: c.value }} title={c.name} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={!!editFolder} onOpenChange={(open) => !open && setEditFolder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>Rename or change the folder color.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Folder Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()} />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {TEAM_FOLDER_COLORS.map(c => (
                  <button key={c.value} onClick={() => setNewColor(c.value)}
                    className={cn("w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background",
                      newColor === c.value ? "ring-2 ring-primary scale-110" : "hover:scale-105 opacity-70 hover:opacity-100"
                    )} style={{ backgroundColor: c.value }} title={c.name} />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditFolder(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!newName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>Items will be moved back to the sidebar. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
