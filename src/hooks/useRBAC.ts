import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

// Module definitions
export const RBAC_MODULES = [
  { id: 'command-center', label: 'Command Center', group: 'Dashboard' },
  { id: 'enquiries', label: 'Enquiries', group: 'CRM' },
  { id: 'leads', label: 'Business Relationships', group: 'CRM' },
  { id: 'clients', label: 'Clients', group: 'CRM' },
  { id: 'client-accounts', label: 'Client Accounts', group: 'CRM' },
  { id: 'apps', label: 'App Projects', group: 'Projects' },
  { id: 'ads', label: 'Ad Campaigns', group: 'Marketing' },
  { id: 'social', label: 'Social Media', group: 'Marketing' },
  { id: 'content', label: 'Content', group: 'Marketing' },
  { id: 'calendar', label: 'Calendar', group: 'Tools' },
  { id: 'websites', label: 'Websites', group: 'Projects' },
  { id: 'website-designer', label: 'Website Designer', group: 'Projects' },
  { id: 'office', label: 'Quooro Office', group: 'Tools' },
  { id: 'invoices', label: 'Invoices', group: 'Finance' },
  { id: 'billing', label: 'Billing', group: 'Finance' },
  { id: 'messages', label: 'Messages', group: 'Communication' },
  { id: 'assets', label: 'Assets', group: 'Files' },
  { id: 'tickets', label: 'Tickets', group: 'Support' },
  { id: 'security', label: 'Security', group: 'Admin' },
  { id: 'announcements', label: 'Announcements', group: 'Communication' },
  { id: 'workflows', label: 'Workflows', group: 'Automation' },
  { id: 'live-sessions', label: 'Live Sessions', group: 'Admin' },
  { id: 'settings', label: 'Settings', group: 'Admin' },
  { id: 'knowledge-base', label: 'Knowledge Base', group: 'Support' },
  { id: 'automation-rules', label: 'Automation Rules', group: 'Automation' },
  { id: 'team-comms', label: 'Team Comms', group: 'Communication' },
] as const;

export const RBAC_ACTIONS = [
  'view', 'create', 'edit', 'delete', 'export', 'approve', 'assign', 'manage_settings',
] as const;

export const RBAC_ACTION_LABELS: Record<string, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  approve: 'Approve',
  assign: 'Assign',
  manage_settings: 'Manage Settings',
};

export const MODULE_GROUPS = [...new Set(RBAC_MODULES.map(m => m.group))];

export interface RBACRole {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RBACPermission {
  id: string;
  role_id: string;
  module: string;
  action: string;
  granted: boolean;
}

export interface RBACUserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

// Permission cache with 5-minute TTL
const permissionCache = new Map<string, { data: RBACPermission[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export function useRBAC() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [permissions, setPermissions] = useState<RBACPermission[]>([]);
  const [userRoles, setUserRoles] = useState<RBACUserRole[]>([]);
  const [myPermissions, setMyPermissions] = useState<RBACPermission[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    const { data } = await supabase
      .from('rbac_roles')
      .select('*')
      .order('is_system', { ascending: false })
      .order('name');
    if (data) setRoles(data as any);
  }, []);

  // Fetch permissions for all roles (admin view)
  const fetchAllPermissions = useCallback(async () => {
    const { data } = await supabase
      .from('rbac_permissions')
      .select('*');
    if (data) setPermissions(data as any);
  }, []);

  // Fetch user role assignments
  const fetchUserRoles = useCallback(async () => {
    const { data } = await supabase
      .from('rbac_user_roles')
      .select('*');
    if (data) setUserRoles(data as any);
  }, []);

  // Fetch my permissions (for non-admin users)
  const fetchMyPermissions = useCallback(async () => {
    if (!user?.id) return;
    const cacheKey = user.id;
    const cached = permissionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMyPermissions(cached.data);
      return;
    }

    const { data: myRoleAssignments } = await supabase
      .from('rbac_user_roles')
      .select('role_id')
      .eq('user_id', user.id);

    if (myRoleAssignments && myRoleAssignments.length > 0) {
      const roleIds = myRoleAssignments.map(r => r.role_id);
      const { data: perms } = await supabase
        .from('rbac_permissions')
        .select('*')
        .in('role_id', roleIds)
        .eq('granted', true);
      const result = (perms || []) as any;
      setMyPermissions(result);
      permissionCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }
  }, [user?.id]);

  // Load data - always fetch roles/permissions so team owners can manage them
  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    const load = async () => {
      await Promise.all([fetchRoles(), fetchAllPermissions(), fetchUserRoles(), fetchMyPermissions()]);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  // Check if current user has permission
  const hasPermission = useCallback((module: string, action: string): boolean => {
    if (isAdmin) return true; // Admins bypass all checks
    return myPermissions.some(p => p.module === module && p.action === action && p.granted);
  }, [isAdmin, myPermissions]);

  // Get accessible modules for current user
  const accessibleModules = useMemo((): string[] => {
    if (isAdmin) return RBAC_MODULES.map(m => m.id);
    const modules = new Set<string>();
    myPermissions.forEach(p => {
      if (p.action === 'view' && p.granted) modules.add(p.module);
    });
    return Array.from(modules);
  }, [isAdmin, myPermissions]);

  // CRUD Operations (admin only)
  const createRole = useCallback(async (name: string, description: string) => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('rbac_roles')
      .insert({ name, description, created_by: user.id } as any)
      .select()
      .single();
    if (error) throw error;
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'create_role', entity_type: 'role',
      entity_id: (data as any).id, new_value: { name, description },
    } as any);
    await fetchRoles();
    return data;
  }, [user?.id, fetchRoles]);

  const updateRole = useCallback(async (id: string, updates: Partial<RBACRole>) => {
    if (!user?.id) return;
    const old = roles.find(r => r.id === id);
    const { error } = await supabase
      .from('rbac_roles')
      .update(updates as any)
      .eq('id', id);
    if (error) throw error;
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'update_role', entity_type: 'role',
      entity_id: id, old_value: old, new_value: updates,
    } as any);
    await fetchRoles();
  }, [user?.id, roles, fetchRoles]);

  const deleteRole = useCallback(async (id: string) => {
    if (!user?.id) return;
    const old = roles.find(r => r.id === id);
    const { error } = await supabase
      .from('rbac_roles')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'delete_role', entity_type: 'role',
      entity_id: id, old_value: old,
    } as any);
    await fetchRoles();
    await fetchAllPermissions();
  }, [user?.id, roles, fetchRoles, fetchAllPermissions]);

  const duplicateRole = useCallback(async (roleId: string, newName: string) => {
    if (!user?.id) return;
    const original = roles.find(r => r.id === roleId);
    if (!original) return;
    const { data: newRole } = await supabase
      .from('rbac_roles')
      .insert({ name: newName, description: `Copy of ${original.name}`, created_by: user.id } as any)
      .select()
      .single();
    if (!newRole) return;
    // Copy permissions
    const rolePerms = permissions.filter(p => p.role_id === roleId);
    if (rolePerms.length > 0) {
      await supabase.from('rbac_permissions').insert(
        rolePerms.map(p => ({ role_id: (newRole as any).id, module: p.module, action: p.action, granted: p.granted })) as any
      );
    }
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'duplicate_role', entity_type: 'role',
      entity_id: (newRole as any).id, details: `Duplicated from ${original.name}`,
    } as any);
    await Promise.all([fetchRoles(), fetchAllPermissions()]);
  }, [user?.id, roles, permissions, fetchRoles, fetchAllPermissions]);

  const setPermission = useCallback(async (roleId: string, module: string, action: string, granted: boolean) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('rbac_permissions')
      .upsert({ role_id: roleId, module, action, granted } as any, { onConflict: 'role_id,module,action' });
    if (error) throw error;
    await fetchAllPermissions();
    // Invalidate cache
    permissionCache.clear();
  }, [user?.id, fetchAllPermissions]);

  const bulkSetModulePermissions = useCallback(async (roleId: string, module: string, granted: boolean) => {
    if (!user?.id) return;
    const rows = RBAC_ACTIONS.map(action => ({
      role_id: roleId, module, action, granted,
    }));
    await supabase.from('rbac_permissions').upsert(rows as any, { onConflict: 'role_id,module,action' });
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: granted ? 'enable_module' : 'disable_module',
      entity_type: 'permission', entity_id: roleId,
      new_value: { module, granted },
    } as any);
    await fetchAllPermissions();
    permissionCache.clear();
  }, [user?.id, fetchAllPermissions]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('rbac_user_roles')
      .upsert({ user_id: userId, role_id: roleId, assigned_by: user.id } as any, { onConflict: 'user_id,role_id' });
    if (error) throw error;
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'assign_role', entity_type: 'user_role',
      new_value: { user_id: userId, role_id: roleId },
    } as any);
    await fetchUserRoles();
  }, [user?.id, fetchUserRoles]);

  const removeUserRole = useCallback(async (userId: string, roleId: string) => {
    if (!user?.id) return;
    await supabase.from('rbac_user_roles').delete().eq('user_id', userId).eq('role_id', roleId);
    await supabase.from('rbac_audit_log').insert({
      performed_by: user.id, action: 'remove_role', entity_type: 'user_role',
      old_value: { user_id: userId, role_id: roleId },
    } as any);
    await fetchUserRoles();
  }, [user?.id, fetchUserRoles]);

  // Get permissions for a specific role
  const getRolePermissions = useCallback((roleId: string) => {
    return permissions.filter(p => p.role_id === roleId);
  }, [permissions]);

  // Check if a module is enabled for a role
  const isModuleEnabled = useCallback((roleId: string, module: string) => {
    const modulePerms = permissions.filter(p => p.role_id === roleId && p.module === module);
    return modulePerms.some(p => p.granted);
  }, [permissions]);

  // Get users assigned to a role
  const getUsersForRole = useCallback((roleId: string) => {
    return userRoles.filter(ur => ur.role_id === roleId);
  }, [userRoles]);

  // Refetch everything
  const refetch = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchRoles(), fetchAllPermissions(), fetchUserRoles(), fetchMyPermissions()]);
    setLoading(false);
  }, [fetchRoles, fetchAllPermissions, fetchUserRoles, fetchMyPermissions]);

  return {
    roles, permissions, userRoles, myPermissions,
    loading, hasPermission, accessibleModules,
    createRole, updateRole, deleteRole, duplicateRole,
    setPermission, bulkSetModulePermissions,
    assignRole, removeUserRole,
    getRolePermissions, isModuleEnabled, getUsersForRole,
    refetch,
  };
}
