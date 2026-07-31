import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Plus, Search, Copy, Trash2, Edit2, Users, ChevronDown, ChevronRight,
  Check, X, ToggleLeft, ToggleRight, Eye, FileText, Settings, Lock, Zap, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { SkeletonLedger } from '@/components/platform';
import { toast } from 'sonner';
import {
  useRBAC, RBAC_MODULES, RBAC_ACTIONS, RBAC_ACTION_LABELS, MODULE_GROUPS,
  type RBACRole,
} from '@/hooks/useRBAC';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  customer_id: string | null;
}

export default function AdminRoleManagement() {
  const {
    roles, permissions, userRoles, loading,
    createRole, updateRole, deleteRole, duplicateRole,
    setPermission, bulkSetModulePermissions,
    assignRole, removeUserRole,
    getRolePermissions, isModuleEnabled, getUsersForRole,
    refetch,
  } = useRBAC();

  const [activeTab, setActiveTab] = useState<'roles' | 'assignments' | 'audit'>('roles');
  const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(MODULE_GROUPS));

  // Create/edit role dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RBACRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteConfirmRole, setDeleteConfirmRole] = useState<RBACRole | null>(null);

  // Duplicate dialog
  const [duplicateSource, setDuplicateSource] = useState<RBACRole | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  // Assign role dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignTargetRole, setAssignTargetRole] = useState<string>('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Audit log
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditProfiles, setAuditProfiles] = useState<Record<string, UserProfile>>({});

  // Fetch users for assignments
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url, customer_id')
        .order('full_name');
      if (data) setAllUsers(data as any);
    };
    fetchUsers();
  }, []);

  // Fetch audit logs when tab changes
  useEffect(() => {
    if (activeTab !== 'audit') return;
    const fetchAudit = async () => {
      const { data } = await supabase
        .from('rbac_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        setAuditLogs(data as any);
        const userIds = [...new Set((data as any[]).map(l => l.performed_by).filter(Boolean))];
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name, email, avatar_url, customer_id')
            .in('user_id', userIds);
          const map: Record<string, UserProfile> = {};
          (profiles || []).forEach((p: any) => { map[p.user_id] = p; });
          setAuditProfiles(map);
        }
      }
    };
    fetchAudit();
  }, [activeTab]);

  // Select first role if none selected
  useEffect(() => {
    if (!selectedRole && roles.length > 0) setSelectedRole(roles[0]);
  }, [roles, selectedRole]);

  const handleCreateRole = async () => {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: roleName.trim(), description: roleDescription.trim() || null } as any);
        toast.success('Role updated');
        if (selectedRole?.id === editingRole.id) {
          setSelectedRole({ ...editingRole, name: roleName.trim(), description: roleDescription.trim() || null });
        }
      } else {
        await createRole(roleName.trim(), roleDescription.trim());
        toast.success('Role created');
      }
      setShowCreateDialog(false);
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save role');
    }
    setSaving(false);
  };

  const handleDeleteRole = async () => {
    if (!deleteConfirmRole) return;
    try {
      await deleteRole(deleteConfirmRole.id);
      if (selectedRole?.id === deleteConfirmRole.id) setSelectedRole(null);
      setDeleteConfirmRole(null);
      toast.success('Role deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  const handleDuplicate = async () => {
    if (!duplicateSource || !duplicateName.trim()) return;
    try {
      await duplicateRole(duplicateSource.id, duplicateName.trim());
      setDuplicateSource(null);
      setDuplicateName('');
      toast.success('Role duplicated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate role');
    }
  };

  const handleTogglePermission = async (roleId: string, module: string, action: string) => {
    const current = permissions.find(p => p.role_id === roleId && p.module === module && p.action === action);
    const newGranted = !(current?.granted);
    try {
      await setPermission(roleId, module, action, newGranted);
    } catch (err: any) {
      toast.error('Failed to update permission');
    }
  };

  const handleToggleModule = async (roleId: string, module: string) => {
    const enabled = isModuleEnabled(roleId, module);
    try {
      await bulkSetModulePermissions(roleId, module, !enabled);
      toast.success(`${module} ${!enabled ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error('Failed to toggle module');
    }
  };

  const handleAssignUser = async (userId: string) => {
    if (!assignTargetRole) return;
    try {
      await assignRole(userId, assignTargetRole);
      toast.success('Role assigned');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    }
  };

  const handleRemoveAssignment = async (userId: string, roleId: string) => {
    try {
      await removeUserRole(userId, roleId);
      toast.success('Role removed');
    } catch (err: any) {
      toast.error('Failed to remove role');
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const filteredModules = useMemo(() => {
    let modules = [...RBAC_MODULES];
    if (searchTerm) {
      modules = modules.filter(m =>
        m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.group.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (moduleFilter !== 'all') {
      modules = modules.filter(m => m.group === moduleFilter);
    }
    return modules;
  }, [searchTerm, moduleFilter]);

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof RBAC_MODULES[number][]> = {};
    filteredModules.forEach(m => {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    });
    return groups;
  }, [filteredModules]);

  // Role permission summary
  const roleSummary = useMemo(() => {
    if (!selectedRole) return null;
    const rolePerms = getRolePermissions(selectedRole.id);
    const enabledModules = new Set(rolePerms.filter(p => p.granted).map(p => p.module));
    const totalGranted = rolePerms.filter(p => p.granted).length;
    const assignedUsers = getUsersForRole(selectedRole.id);
    return { enabledModules: enabledModules.size, totalGranted, assignedUsers: assignedUsers.length };
  }, [selectedRole, getRolePermissions, getUsersForRole]);

  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return allUsers;
    return allUsers.filter(u =>
      u.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
  }, [allUsers, userSearchTerm]);

  if (loading) {
    return (
      <SkeletonLedger rows={6} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage access control, module visibility, and user permissions
          </p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: 'hsl(var(--muted))' }}>
        {[
          { key: 'roles' as const, icon: <Shield className="h-3 w-3" />, label: 'Roles & Permissions' },
          { key: 'assignments' as const, icon: <Users className="h-3 w-3" />, label: 'User Assignments' },
          { key: 'audit' as const, icon: <FileText className="h-3 w-3" />, label: 'Audit Log' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeTab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Roles & Permissions Tab */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Role List */}
          <div className="space-y-3">
            <Button onClick={() => { setEditingRole(null); setRoleName(''); setRoleDescription(''); setShowCreateDialog(true); }} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Create Role
            </Button>

            <div className="space-y-1.5">
              {roles.map(role => (
                <motion.button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all group",
                    selectedRole?.id === role.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/30 hover:bg-accent/30"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{role.name}</p>
                        {role.is_system && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">System</Badge>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                        e.stopPropagation();
                        setEditingRole(role);
                        setRoleName(role.name);
                        setRoleDescription(role.description || '');
                        setShowCreateDialog(true);
                      }}>
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {
                        e.stopPropagation();
                        setDuplicateSource(role);
                        setDuplicateName(`${role.name} (Copy)`);
                      }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      {!role.is_system && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmRole(role);
                        }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {getUsersForRole(role.id).length} users
                    </span>
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {permissions.filter(p => p.role_id === role.id && p.granted).length} permissions
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Permission Matrix */}
          {selectedRole && (
            <div className="space-y-4">
              {/* Role Summary */}
              <Card className="rounded-[12px] border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-[14px] font-semibold tracking-[-0.01em]">{selectedRole.name}</CardTitle>
                      {selectedRole.description && (
                        <CardDescription>{selectedRole.description}</CardDescription>
                      )}
                    </div>
                    {roleSummary && (
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline" className="gap-1">
                          <Eye className="w-3 h-3" /> {roleSummary.enabledModules} modules
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Check className="w-3 h-3" /> {roleSummary.totalGranted} permissions
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <Users className="w-3 h-3" /> {roleSummary.assignedUsers} users
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search modules..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {MODULE_GROUPS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Permission Matrix */}
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-2">
                  {Object.entries(groupedModules).map(([group, modules]) => (
                    <Card key={group} className="overflow-hidden">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedGroups.has(group) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          <span className="font-semibold text-sm">{group}</span>
                          <Badge variant="secondary" className="text-[10px]">{modules.length}</Badge>
                        </div>
                      </button>

                      <AnimatePresence>
                        {expandedGroups.has(group) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="border-t border-border">
                              {/* Header row */}
                              <div className="grid items-center gap-1 px-3 py-2 bg-muted/30 text-[11px] font-medium text-muted-foreground uppercase tracking-wider"
                                style={{ gridTemplateColumns: '180px 50px repeat(8, 1fr)' }}>
                                <span>Module</span>
                                <span className="text-center">All</span>
                                {RBAC_ACTIONS.map(a => (
                                  <span key={a} className="text-center">{RBAC_ACTION_LABELS[a]}</span>
                                ))}
                              </div>

                              {/* Module rows */}
                              {modules.map(mod => {
                                const moduleEnabled = isModuleEnabled(selectedRole.id, mod.id);
                                return (
                                  <div key={mod.id}
                                    className="grid items-center gap-1 px-3 py-2 border-t border-border/30 hover:bg-accent/20 transition-colors"
                                    style={{ gridTemplateColumns: '180px 50px repeat(8, 1fr)' }}>
                                    <span className="text-sm font-medium truncate">{mod.label}</span>
                                    <div className="flex justify-center">
                                      <Switch
                                        checked={moduleEnabled}
                                        onCheckedChange={() => handleToggleModule(selectedRole.id, mod.id)}
                                        className="scale-75"
                                      />
                                    </div>
                                    {RBAC_ACTIONS.map(action => {
                                      const perm = permissions.find(
                                        p => p.role_id === selectedRole.id && p.module === mod.id && p.action === action
                                      );
                                      return (
                                        <div key={action} className="flex justify-center">
                                          <Checkbox
                                            checked={perm?.granted || false}
                                            onCheckedChange={() => handleTogglePermission(selectedRole.id, mod.id, action)}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      )}

      {/* User Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowAssignDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Assign Role
            </Button>
          </div>

          {/* Users grouped by role */}
          <div className="space-y-4">
            {roles.map(role => {
              const roleAssignments = getUsersForRole(role.id);
              if (roleAssignments.length === 0) return null;
              return (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        {role.name}
                        <Badge variant="secondary" className="ml-1">{roleAssignments.length}</Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {roleAssignments.map(assignment => {
                        const profile = allUsers.find(u => u.user_id === assignment.user_id);
                        const initials = profile?.full_name
                          ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : profile?.email?.slice(0, 2).toUpperCase() || '??';
                        return (
                          <div key={assignment.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:bg-accent/20 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={profile?.avatar_url || ''} />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{profile?.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0"
                              onClick={() => handleRemoveAssignment(assignment.user_id, assignment.role_id)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Unassigned users */}
            {(() => {
              const assignedUserIds = new Set(userRoles.map(ur => ur.user_id));
              const unassigned = allUsers.filter(u => !assignedUserIds.has(u.user_id));
              if (unassigned.length === 0) return null;
              return (
                <Card className="rounded-[12px] border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      Unassigned Users
                      <Badge variant="outline">{unassigned.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {unassigned.slice(0, 12).map(user => {
                        const initials = user.full_name
                          ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                          : user.email?.slice(0, 2).toUpperCase() || '??';
                        return (
                          <div key={user.user_id} className="flex items-center justify-between p-3 rounded-lg border border-dashed border-border/50">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{user.full_name || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <Card className="rounded-[12px] border-border/60 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-[14px] font-semibold tracking-[-0.01em]">Permission Change History</CardTitle>
            <CardDescription>All role and permission modifications are logged</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No audit log entries yet</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {auditLogs.map((log: any) => {
                  const performer = auditProfiles[log.performed_by];
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:bg-accent/20 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{performer?.full_name || 'System'}</span>
                          {' '}
                          <span className="text-muted-foreground">{log.action.replace(/_/g, ' ')}</span>
                          {log.details && <span className="text-muted-foreground"> — {log.details}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
            <DialogDescription>
              {editingRole ? 'Update the role details' : 'Define a new role for your organisation'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="e.g. Marketing Manager" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={roleDescription} onChange={e => setRoleDescription(e.target.value)}
                placeholder="Describe the role's responsibilities..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={!roleName.trim() || saving}>
              {saving ? 'Saving...' : editingRole ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmRole} onOpenChange={() => setDeleteConfirmRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role: {deleteConfirmRole?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the role and all associated permissions. Users assigned this role will lose their permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRole} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Dialog */}
      <Dialog open={!!duplicateSource} onOpenChange={() => setDuplicateSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Role</DialogTitle>
            <DialogDescription>Create a copy of "{duplicateSource?.name}" with all its permissions</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label>New Role Name</Label>
            <Input value={duplicateName} onChange={e => setDuplicateName(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateSource(null)}>Cancel</Button>
            <Button onClick={handleDuplicate} disabled={!duplicateName.trim()}>Duplicate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
            <DialogDescription>Select a role and then assign it to users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={assignTargetRole} onValueChange={setAssignTargetRole}>
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {assignTargetRole && (
              <div className="space-y-2">
                <Label>Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search by name or email..." value={userSearchTerm}
                    onChange={e => setUserSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <ScrollArea className="h-[250px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {filteredUsers.map(u => {
                      const isAssigned = userRoles.some(ur => ur.user_id === u.user_id && ur.role_id === assignTargetRole);
                      const initials = u.full_name
                        ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : u.email?.slice(0, 2).toUpperCase() || '??';
                      return (
                        <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={u.avatar_url || ''} />
                              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{u.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                          </div>
                          {isAssigned ? (
                            <Badge variant="secondary" className="text-[10px]">Assigned</Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAssignUser(u.user_id)}>
                              Assign
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAssignDialog(false); setUserSearchTerm(''); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
