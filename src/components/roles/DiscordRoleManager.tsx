import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Shield, Plus, Search, Copy, Trash2, Edit2, Users, ChevronDown, ChevronRight,
  Check, X, GripVertical, Palette, Eye, Crown, UserPlus, Settings2, Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  useRBAC, RBAC_MODULES, RBAC_ACTIONS, RBAC_ACTION_LABELS, MODULE_GROUPS,
  type RBACRole,
} from '@/hooks/useRBAC';
import { RoleDashboardPreview } from './RoleDashboardPreview';

// Discord-style color palette
const ROLE_COLORS = [
  '#99AAB5', '#1ABC9C', '#2ECC71', '#3498DB', '#9B59B6',
  '#E91E63', '#F1C40F', '#E67E22', '#E74C3C', '#95A5A6',
  '#607D8B', '#11806A', '#1F8B4C', '#206694', '#71368A',
  '#AD1457', '#C27C0E', '#A84300', '#992D22', '#979C9F',
];

// Permission categories (Discord-style grouping)
const PERMISSION_CATEGORIES: { label: string; groups: string[] }[] = [
  { label: 'General', groups: ['Dashboard', 'Admin'] },
  { label: 'CRM & Sales', groups: ['CRM'] },
  { label: 'Projects', groups: ['Projects'] },
  { label: 'Marketing', groups: ['Marketing'] },
  { label: 'Finance', groups: ['Finance'] },
  { label: 'Communication', groups: ['Communication'] },
  { label: 'Tools & Files', groups: ['Tools', 'Files'] },
  { label: 'Support', groups: ['Support'] },
  { label: 'Automation', groups: ['Automation'] },
];

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

export default function DiscordRoleManager() {
  const {
    roles, permissions, userRoles, loading,
    createRole, updateRole, deleteRole, duplicateRole,
    setPermission, bulkSetModulePermissions,
    assignRole, removeUserRole,
    getRolePermissions, isModuleEnabled, getUsersForRole,
    refetch,
  } = useRBAC();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'display' | 'permissions' | 'members'>('display');
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#99AAB5');
  const [editDescription, setEditDescription] = useState('');
  const [editHoist, setEditHoist] = useState(false);

  // Create role
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<RBACRole | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Members
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  // Expanded permission categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['General']));

  // Sort roles by position descending
  const sortedRoles = useMemo(() =>
    [...roles].sort((a, b) => ((b as any).position || 0) - ((a as any).position || 0)),
    [roles]
  );

  const selectedRole = useMemo(() =>
    roles.find(r => r.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  // Load edit state when role changes
  useEffect(() => {
    if (selectedRole) {
      setEditName(selectedRole.name);
      setEditColor((selectedRole as any).color || '#99AAB5');
      setEditDescription(selectedRole.description || '');
      setEditHoist((selectedRole as any).hoist || false);
      setHasUnsavedChanges(false);
    }
  }, [selectedRoleId, selectedRole]);

  // Auto-select first role
  useEffect(() => {
    if (!selectedRoleId && sortedRoles.length > 0) {
      setSelectedRoleId(sortedRoles[0].id);
    }
  }, [sortedRoles, selectedRoleId]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .order('full_name');
      if (data) setAllUsers(data as any);
    };
    fetchUsers();
  }, []);

  const handleSaveDisplay = async () => {
    if (!selectedRole || !editName.trim()) return;
    try {
      await updateRole(selectedRole.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      } as any);
      // Update color and hoist via direct update
      await supabase.from('rbac_roles').update({
        color: editColor,
        hoist: editHoist,
      } as any).eq('id', selectedRole.id);
      setHasUnsavedChanges(false);
      toast.success('Role updated');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const lowestPos = Math.min(...sortedRoles.map(r => (r as any).position || 0), 0);
      await createRole(newRoleName.trim(), '');
      // Set position for new role
      const { data: newRoles } = await supabase.from('rbac_roles').select('id').eq('name', newRoleName.trim()).order('created_at', { ascending: false }).limit(1);
      if (newRoles?.[0]) {
        await supabase.from('rbac_roles').update({ position: lowestPos - 10 } as any).eq('id', newRoles[0].id);
        setSelectedRoleId(newRoles[0].id);
      }
      setNewRoleName('');
      setShowCreateInput(false);
      toast.success('Role created');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRole(deleteConfirm.id);
      if (selectedRoleId === deleteConfirm.id) setSelectedRoleId(null);
      setDeleteConfirm(null);
      toast.success('Role deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  const handleTogglePermission = async (module: string, action: string) => {
    if (!selectedRole) return;
    const current = permissions.find(p => p.role_id === selectedRole.id && p.module === module && p.action === action);
    try {
      await setPermission(selectedRole.id, module, action, !current?.granted);
    } catch {
      toast.error('Failed to update permission');
    }
  };

  const handleToggleModule = async (module: string) => {
    if (!selectedRole) return;
    const enabled = isModuleEnabled(selectedRole.id, module);
    try {
      await bulkSetModulePermissions(selectedRole.id, module, !enabled);
    } catch {
      toast.error('Failed to toggle module');
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!selectedRole) return;
    try {
      await assignRole(userId, selectedRole.id);
      toast.success('Member added to role');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!selectedRole) return;
    try {
      await removeUserRole(userId, selectedRole.id);
      toast.success('Member removed from role');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const roleMembers = useMemo(() => {
    if (!selectedRole) return [];
    const assignments = getUsersForRole(selectedRole.id);
    return assignments.map(a => allUsers.find(u => u.user_id === a.user_id)).filter(Boolean) as UserProfile[];
  }, [selectedRole, getUsersForRole, allUsers]);

  const unassignedUsers = useMemo(() => {
    if (!selectedRole) return [];
    const assignedIds = new Set(getUsersForRole(selectedRole.id).map(a => a.user_id));
    return allUsers.filter(u => !assignedIds.has(u.user_id));
  }, [selectedRole, getUsersForRole, allUsers]);

  const filteredUnassigned = useMemo(() => {
    if (!memberSearch) return unassignedUsers;
    return unassignedUsers.filter(u =>
      u.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [unassignedUsers, memberSearch]);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-0 rounded-xl border bg-card overflow-hidden" style={{ minHeight: '70vh' }}>
      {/* Left Panel — Role List */}
      <div className="w-full lg:w-[260px] border-b lg:border-b-0 lg:border-r border-border bg-muted/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Roles — {roles.length}</h3>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {sortedRoles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const memberCount = getUsersForRole(role.id).length;
              const roleColor = (role as any).color || '#99AAB5';

              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-md flex items-center gap-3 transition-all group text-sm",
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: roleColor }} />
                  <span className="flex-1 truncate font-medium">{role.name}</span>
                  <span className="text-xs opacity-60">{memberCount}</span>
                  {role.is_system && (
                    <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-border">
          {showCreateInput ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Role name..."
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateRole();
                  if (e.key === 'Escape') { setShowCreateInput(false); setNewRoleName(''); }
                }}
                className="h-8 text-sm"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={handleCreateRole}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => { setShowCreateInput(false); setNewRoleName(''); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setShowCreateInput(true)}>
              <Plus className="w-4 h-4" /> Create Role
            </Button>
          )}
        </div>
      </div>

      {/* Right Panel — Role Editor */}
      {selectedRole ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: (selectedRole as any).color || '#99AAB5' }} />
              <h3 className="text-lg font-semibold truncate">Edit Role — {selectedRole.name}</h3>
              {selectedRole.is_system && <Badge variant="secondary" className="text-[10px]">System</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">View as Role</span>
              </Button>
              {!selectedRole.is_system && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5" onClick={() => setDeleteConfirm(selectedRole)}>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
            </div>
          </div>

          {/* Sub-nav tabs */}
          <div className="flex items-center gap-0 border-b border-border px-4">
            {[
              { key: 'display' as const, label: 'Display', icon: Palette },
              { key: 'permissions' as const, label: 'Permissions', icon: Shield },
              { key: 'members' as const, label: 'Members', icon: Users },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActivePanel(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activePanel === tab.key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'members' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 ml-1">{roleMembers.length}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-2xl">
              {/* Display Panel */}
              {activePanel === 'display' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Role Name</Label>
                    <Input
                      value={editName}
                      onChange={e => { setEditName(e.target.value); setHasUnsavedChanges(true); }}
                      className="max-w-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Description</Label>
                    <Textarea
                      value={editDescription}
                      onChange={e => { setEditDescription(e.target.value); setHasUnsavedChanges(true); }}
                      placeholder="What does this role do?"
                      className="max-w-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Role Colour</Label>
                    <div className="grid grid-cols-10 gap-2 max-w-sm">
                      {ROLE_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => { setEditColor(color); setHasUnsavedChanges(true); }}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all border-2",
                            editColor === color ? "border-foreground scale-110 shadow-lg" : "border-transparent hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2 max-w-sm">
                      <Input
                        value={editColor}
                        onChange={e => { setEditColor(e.target.value); setHasUnsavedChanges(true); }}
                        placeholder="#99AAB5"
                        className="w-32 font-mono text-sm"
                      />
                      <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: editColor }} />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between max-w-sm">
                    <div>
                      <p className="text-sm font-medium">Display role members separately</p>
                      <p className="text-xs text-muted-foreground">Show members with this role in their own group</p>
                    </div>
                    <Switch
                      checked={editHoist}
                      onCheckedChange={v => { setEditHoist(v); setHasUnsavedChanges(true); }}
                    />
                  </div>

                  {hasUnsavedChanges && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 max-w-sm"
                    >
                      <p className="text-sm text-muted-foreground flex-1">You have unsaved changes</p>
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (selectedRole) {
                          setEditName(selectedRole.name);
                          setEditColor((selectedRole as any).color || '#99AAB5');
                          setEditDescription(selectedRole.description || '');
                          setEditHoist((selectedRole as any).hoist || false);
                          setHasUnsavedChanges(false);
                        }
                      }}>Reset</Button>
                      <Button size="sm" onClick={handleSaveDisplay}>Save Changes</Button>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Permissions Panel */}
              {activePanel === 'permissions' && (
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {PERMISSION_CATEGORIES.map(category => {
                    const categoryModules = RBAC_MODULES.filter(m =>
                      category.groups.includes(m.group) &&
                      (!searchTerm || m.label.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    if (categoryModules.length === 0) return null;
                    const isExpanded = expandedCategories.has(category.label);

                    return (
                      <div key={category.label} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCategory(category.label)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category.label}</span>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border">
                            {categoryModules.map(mod => {
                              const moduleEnabled = isModuleEnabled(selectedRole!.id, mod.id);
                              const modulePerms = permissions.filter(p => p.role_id === selectedRole!.id && p.module === mod.id);

                              return (
                                <div key={mod.id} className="border-b border-border last:border-b-0">
                                  {/* Module header with master toggle */}
                                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                                    <div className="flex items-center gap-2">
                                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                      <span className="text-sm font-medium">{mod.label}</span>
                                    </div>
                                    <Switch
                                      checked={moduleEnabled}
                                      onCheckedChange={() => handleToggleModule(mod.id)}
                                    />
                                  </div>

                                  {/* Individual permissions */}
                                  {moduleEnabled && (
                                    <div className="px-4 py-2 space-y-1">
                                      {RBAC_ACTIONS.map(action => {
                                        const perm = modulePerms.find(p => p.action === action);
                                        const granted = perm?.granted || false;

                                        return (
                                          <div key={action} className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/30">
                                            <div>
                                              <p className="text-sm">{RBAC_ACTION_LABELS[action]}</p>
                                              <p className="text-xs text-muted-foreground">
                                                {getPermissionDescription(mod.id, action)}
                                              </p>
                                            </div>
                                            <Switch
                                              checked={granted}
                                              onCheckedChange={() => handleTogglePermission(mod.id, action)}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Members Panel */}
              {activePanel === 'members' && (
                <div className="space-y-6">
                  {/* Current Members */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Members — {roleMembers.length}
                    </h4>
                    {roleMembers.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No members have this role</p>
                    ) : (
                      <div className="space-y-1">
                        {roleMembers.map(member => (
                          <div key={member.user_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 group">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url || ''} />
                                <AvatarFallback className="text-xs">{getInitials(member.full_name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{member.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                              onClick={() => handleRemoveUser(member.user_id)}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Add Members */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Members</h4>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or email..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {filteredUnassigned.slice(0, 20).map(user => (
                        <div key={user.user_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 group">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url || ''} />
                              <AvatarFallback className="text-xs">{getInitials(user.full_name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{user.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 opacity-0 group-hover:opacity-100"
                            onClick={() => handleAssignUser(user.user_id)}
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </Button>
                        </div>
                      ))}
                      {filteredUnassigned.length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          {memberSearch ? 'No matching users found' : 'All users already have this role'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-2">
            <Shield className="w-12 h-12 mx-auto opacity-30" />
            <p className="text-sm">Select a role to edit</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? Members with this role will lose all associated permissions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View as Role Preview */}
      {selectedRole && (
        <RoleDashboardPreview
          open={showPreview}
          onClose={() => setShowPreview(false)}
          roleName={selectedRole.name}
          roleColor={(selectedRole as any).color || '#99AAB5'}
          permissions={getRolePermissions(selectedRole.id)}
        />
      )}
    </div>
  );
}

function getPermissionDescription(module: string, action: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    enquiries: {
      view: 'View incoming enquiries and messages',
      create: 'Create new enquiry records',
      edit: 'Edit enquiry details and status',
      delete: 'Remove enquiry records permanently',
      export: 'Export enquiry data to CSV/Excel',
      approve: 'Mark enquiries as approved or qualified',
      assign: 'Assign enquiries to team members',
      manage_settings: 'Configure enquiry form settings',
    },
    leads: {
      view: 'View leads and pipeline',
      create: 'Add new leads to the pipeline',
      edit: 'Update lead information and stage',
      delete: 'Remove leads permanently',
      export: 'Export lead data',
      approve: 'Approve lead qualification',
      assign: 'Assign leads to team members',
      manage_settings: 'Configure pipeline stages',
    },
    clients: {
      view: 'View client profiles and details',
      create: 'Add new client accounts',
      edit: 'Update client information',
      delete: 'Remove client records',
      export: 'Export client data',
      approve: 'Approve client onboarding',
      assign: 'Assign clients to account managers',
      manage_settings: 'Configure client portal settings',
    },
  };

  const moduleDescs = descriptions[module];
  if (moduleDescs?.[action]) return moduleDescs[action];

  const genericDescs: Record<string, string> = {
    view: 'View data in this module',
    create: 'Create new records',
    edit: 'Edit existing records',
    delete: 'Delete records permanently',
    export: 'Export data to external formats',
    approve: 'Approve or reject items',
    assign: 'Assign items to team members',
    manage_settings: 'Configure module settings',
  };
  return genericDescs[action] || '';
}
