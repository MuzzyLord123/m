import { useState, useEffect, useMemo } from 'react';
import {
  Shield, Plus, Copy, Trash2, Pencil, Search, Check, Loader2, UserPlus,
  History, Lock, X, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Panel, PanelHeader, EmptyState, SkeletonLedger, AvatarID, RelativeTime,
} from '@/components/platform';
import {
  useRBAC, RBAC_MODULES, RBAC_ACTIONS, RBAC_ACTION_LABELS, MODULE_GROUPS,
  type RBACRole,
} from '@/hooks/useRBAC';

/**
 * Access control.
 *
 * A role is only ever a shape of permissions, so the matrix is the page
 * rather than something behind a tab: modules down, actions across,
 * every cell a fact you can change. Groups keep it navigable, the row
 * switch grants a whole module at once, and view is called out because
 * a role that cannot view a module cannot use it at all.
 *
 * Every figure is counted from the real grant table, so "12 of 224"
 * means twelve grants exist, not twelve things were configured.
 */

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  customer_id: string | null;
}

type Tab = 'permissions' | 'people' | 'audit';

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';
const TOTAL_CELLS = RBAC_MODULES.length * RBAC_ACTIONS.length;

export default function AdminRoleManagement() {
  const {
    roles, permissions, userRoles, loading,
    createRole, updateRole, deleteRole, duplicateRole,
    setPermission, bulkSetModulePermissions,
    assignRole, removeUserRole, isModuleEnabled, getUsersForRole,
  } = useRBAC();

  const [tab, setTab] = useState<Tab>('permissions');
  const [selectedRole, setSelectedRole] = useState<RBACRole | null>(null);
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(MODULE_GROUPS));

  const [showCreate, setShowCreate] = useState(false);
  const [editingRole, setEditingRole] = useState<RBACRole | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RBACRole | null>(null);
  const [duplicateSource, setDuplicateSource] = useState<RBACRole | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditProfiles, setAuditProfiles] = useState<Record<string, UserProfile>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles')
        .select('user_id, full_name, email, avatar_url, customer_id').order('full_name');
      if (data) setAllUsers(data as any);
    })();
  }, []);

  useEffect(() => {
    if (tab !== 'audit') return;
    (async () => {
      const { data } = await supabase.from('rbac_audit_log')
        .select('*').order('created_at', { ascending: false }).limit(100);
      if (!data) return;
      setAuditLogs(data as any);
      const ids = [...new Set((data as any[]).map(l => l.performed_by).filter(Boolean))];
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles')
          .select('user_id, full_name, email, avatar_url, customer_id').in('user_id', ids);
        const map: Record<string, UserProfile> = {};
        (profiles || []).forEach((p: any) => { map[p.user_id] = p; });
        setAuditProfiles(map);
      }
    })();
  }, [tab]);

  useEffect(() => {
    if (!selectedRole && roles.length) setSelectedRole(roles[0]);
  }, [roles, selectedRole]);

  // Keep the open role in step with the freshly fetched list.
  const activeRole = useMemo(
    () => roles.find(r => r.id === selectedRole?.id) || null,
    [roles, selectedRole],
  );

  const granted = (roleId: string, module: string, action: string) =>
    !!permissions.find(p => p.role_id === roleId && p.module === module && p.action === action)?.granted;

  const grantCount = (roleId: string) =>
    permissions.filter(p => p.role_id === roleId && p.granted).length;

  const figures = useMemo(() => ({
    roles: roles.length,
    system: roles.filter(r => r.is_system).length,
    assigned: new Set(userRoles.map((u: any) => u.user_id)).size,
    grants: activeRole ? grantCount(activeRole.id) : 0,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [roles, userRoles, permissions, activeRole]);

  const modulesByGroup = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MODULE_GROUPS.map(group => ({
      group,
      modules: RBAC_MODULES.filter(m => m.group === group && (!q || m.label.toLowerCase().includes(q))),
    })).filter(g => g.modules.length);
  }, [search]);

  async function saveRole() {
    if (!roleName.trim()) return;
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name: roleName.trim(), description: roleDescription.trim() || null } as any);
        toast.success('Role updated');
      } else {
        await createRole(roleName.trim(), roleDescription.trim());
        toast.success('Role created');
      }
      setShowCreate(false); setEditingRole(null); setRoleName(''); setRoleDescription('');
    } catch (e: any) { toast.error(e.message || 'Failed to save the role'); }
    setSaving(false);
  }

  async function togglePermission(roleId: string, module: string, action: string) {
    try { await setPermission(roleId, module, action, !granted(roleId, module, action)); }
    catch { toast.error('That permission did not change'); }
  }

  async function toggleModule(roleId: string, module: string, label: string) {
    const on = isModuleEnabled(roleId, module);
    try {
      await bulkSetModulePermissions(roleId, module, !on);
      toast.success(`${label} ${on ? 'closed' : 'opened'} for this role`);
    } catch { toast.error('That module did not change'); }
  }

  if (loading) {
    return <div className="p-4 sm:p-6"><SkeletonLedger rows={8} /></div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1500px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={KICKER}>Access control</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Roles and permissions
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              What each role can reach, and who holds it. A role that cannot view a module cannot use it at all.
            </p>
          </div>
          <Button
            size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs"
            onClick={() => { setEditingRole(null); setRoleName(''); setRoleDescription(''); setShowCreate(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> New role
          </Button>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border/60 bg-border/60 sm:grid-cols-4">
          {[
            { label: 'Roles', value: figures.roles, meta: `${figures.system} built in` },
            { label: 'People assigned', value: figures.assigned, meta: 'Holding at least one role' },
            { label: 'Grants on this role', value: figures.grants, meta: `of ${TOTAL_CELLS} possible`, tone: 'primary' },
            { label: 'Modules', value: RBAC_MODULES.length, meta: `${RBAC_ACTIONS.length} actions each` },
          ].map(f => (
            <div key={f.label} className="bg-card px-4 py-3.5">
              <p className={KICKER}>{f.label}</p>
              <p className={cn(
                'mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
                f.tone === 'primary' && 'text-primary',
              )}>{f.value}</p>
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{f.meta}</p>
            </div>
          ))}
        </div>

        <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            {([
              { key: 'permissions', label: 'Permissions', icon: Shield },
              { key: 'people', label: 'People', icon: UserPlus },
              { key: 'audit', label: 'Changes', icon: History },
            ] as const).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors',
                  tab === t.key ? 'border border-border/70 bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
          {/* The roles themselves */}
          <aside>
            <Panel>
              <PanelHeader label={`${roles.length} roles`} />
              <ul className="divide-y divide-border/60">
                {roles.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3.5 py-3 text-left transition-colors',
                        activeRole?.id === r.id ? 'bg-primary/[0.06]' : 'hover:bg-foreground/[0.025]',
                      )}
                    >
                      <Shield className={cn('h-3.5 w-3.5 shrink-0', r.is_system ? 'text-muted-foreground' : 'text-primary')} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">{r.name}</span>
                        <span className="block font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                          {r.is_system ? 'Built in' : 'Custom'} · {grantCount(r.id)} grants
                        </span>
                      </span>
                      {getUsersForRole(r.id).length > 0 && (
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                          {getUsersForRole(r.id).length}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            {activeRole && !activeRole.is_system && (
              <div className="mt-2 flex gap-1.5">
                <Button
                  variant="outline" size="sm" className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
                  onClick={() => {
                    setEditingRole(activeRole);
                    setRoleName(activeRole.name);
                    setRoleDescription(activeRole.description || '');
                    setShowCreate(true);
                  }}
                >
                  <Pencil className="h-3 w-3" /> Rename
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs"
                  onClick={() => { setDuplicateSource(activeRole); setDuplicateName(`${activeRole.name} copy`); }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs text-risk"
                  onClick={() => setDeleteTarget(activeRole)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </aside>

          {/* The matrix */}
          <section>
            {!activeRole ? (
              <EmptyState title="No role selected" body="Pick a role to see what it can reach." />
            ) : tab === 'permissions' ? (
              <Panel>
                <PanelHeader label={activeRole.name}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Find a module"
                      className="h-8 w-[150px] rounded-lg pl-8 text-xs sm:w-[190px]"
                    />
                  </div>
                </PanelHeader>

                {activeRole.is_system && (
                  <p className="flex items-center gap-2 border-b border-border/60 bg-sunken/40 px-4 py-2 text-[11.5px] text-muted-foreground">
                    <Lock className="h-3 w-3 shrink-0" />
                    This is a built-in role. Duplicate it if you need a version of your own.
                  </p>
                )}

                <div className="overflow-x-auto">
                  <div className="min-w-[720px]">
                    {/* Column headings, once */}
                    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border/60 bg-card px-4 py-2">
                      <span className="w-[190px] shrink-0 font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Module
                      </span>
                      {RBAC_ACTIONS.map(a => (
                        <span
                          key={a}
                          className="flex-1 text-center font-mono text-[8.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                        >
                          {RBAC_ACTION_LABELS[a]?.split(' ')[0] || a}
                        </span>
                      ))}
                    </div>

                    {modulesByGroup.map(({ group, modules }) => {
                      const open = openGroups.has(group);
                      return (
                        <div key={group}>
                          <button
                            type="button"
                            onClick={() => setOpenGroups(prev => {
                              const next = new Set(prev);
                              next.has(group) ? next.delete(group) : next.add(group);
                              return next;
                            })}
                            className="flex w-full items-center gap-2 border-b border-border/50 bg-sunken/30 px-4 py-1.5 text-left"
                          >
                            <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', !open && '-rotate-90')} />
                            <span className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                              {group}
                            </span>
                            <span className="font-mono text-[9px] tabular-nums text-muted-foreground/70">{modules.length}</span>
                          </button>

                          {open && modules.map(m => {
                            const moduleOn = isModuleEnabled(activeRole.id, m.id);
                            const canView = granted(activeRole.id, m.id, 'view');
                            return (
                              <div
                                key={m.id}
                                className="flex items-center gap-3 border-b border-border/40 px-4 py-1.5 transition-colors last:border-b-0 hover:bg-foreground/[0.02]"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleModule(activeRole.id, m.id, m.label)}
                                  className="flex w-[190px] shrink-0 items-center gap-2 text-left"
                                  title={moduleOn ? 'Close this module for the role' : 'Open this module for the role'}
                                >
                                  <span aria-hidden className={cn(
                                    'h-1.5 w-1.5 shrink-0 rounded-full',
                                    moduleOn ? 'bg-ok' : 'bg-muted-foreground/30',
                                  )} />
                                  <span className={cn(
                                    'truncate text-[12.5px]',
                                    canView ? 'text-foreground' : 'text-muted-foreground',
                                  )}>
                                    {m.label}
                                  </span>
                                </button>

                                {RBAC_ACTIONS.map(a => {
                                  const on = granted(activeRole.id, m.id, a);
                                  return (
                                    <button
                                      key={a}
                                      type="button"
                                      onClick={() => togglePermission(activeRole.id, m.id, a)}
                                      aria-label={`${RBAC_ACTION_LABELS[a]} ${m.label}`}
                                      aria-pressed={on}
                                      className="flex flex-1 items-center justify-center py-1"
                                    >
                                      <span className={cn(
                                        'flex h-5 w-5 items-center justify-center rounded-[5px] border transition-colors',
                                        on
                                          ? 'border-primary/60 bg-primary/[0.14] text-primary'
                                          : 'border-border/60 text-transparent hover:border-border',
                                      )}>
                                        <Check className="h-3 w-3" />
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            ) : tab === 'people' ? (
              <Panel>
                <PanelHeader label={`${getUsersForRole(activeRole.id).length} hold ${activeRole.name}`}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Find someone"
                      className="h-8 w-[150px] rounded-lg pl-8 text-xs sm:w-[190px]"
                    />
                  </div>
                </PanelHeader>
                <div className="max-h-[520px] overflow-y-auto">
                  <ul className="divide-y divide-border/60">
                    {allUsers
                      .filter(u => {
                        const q = userSearch.trim().toLowerCase();
                        return !q || (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
                      })
                      .map(u => {
                        const has = getUsersForRole(activeRole.id).some((x: any) => x.user_id === u.user_id);
                        return (
                          <li key={u.user_id} className="flex items-center gap-3 px-4 py-2.5">
                            <AvatarID name={u.full_name} email={u.email} src={u.avatar_url} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium">{u.full_name || u.email}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                            </div>
                            <Button
                              variant={has ? 'outline' : 'default'}
                              size="sm"
                              className="h-8 shrink-0 gap-1.5 rounded-lg text-xs"
                              onClick={async () => {
                                try {
                                  if (has) { await removeUserRole(u.user_id, activeRole.id); toast.success('Role removed'); }
                                  else { await assignRole(u.user_id, activeRole.id); toast.success('Role assigned'); }
                                } catch (e: any) { toast.error(e.message || 'That did not change'); }
                              }}
                            >
                              {has ? <><X className="h-3 w-3" /> Remove</> : <><Plus className="h-3 w-3" /> Assign</>}
                            </Button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              </Panel>
            ) : (
              <Panel>
                <PanelHeader label={`${auditLogs.length} recent changes`} />
                {auditLogs.length === 0 ? (
                  <EmptyState compact title="Nothing changed yet" body="Every change to a role or a permission is recorded here." />
                ) : (
                  <div className="max-h-[560px] overflow-y-auto">
                    <ul className="divide-y divide-border/60">
                      {auditLogs.map(l => {
                        const who = auditProfiles[l.performed_by];
                        return (
                          <li key={l.id} className="flex items-start gap-3 px-4 py-2.5">
                            <AvatarID name={who?.full_name} email={who?.email} src={who?.avatar_url} size="md" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[12.5px] leading-snug">
                                <span className="font-medium">{who?.full_name || who?.email || 'Someone'}</span>{' '}
                                <span className="text-muted-foreground">{String(l.action || '').replace(/_/g, ' ')}</span>
                              </p>
                              {l.details && (
                                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                                  {typeof l.details === 'string' ? l.details : JSON.stringify(l.details).slice(0, 90)}
                                </p>
                              )}
                            </div>
                            <RelativeTime date={l.created_at} className="shrink-0" />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </Panel>
            )}
          </section>
        </div>
      </div>

      {/* Naming a role */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingRole ? 'Rename role' : 'New role'}</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              A role starts with nothing granted. Open what it needs from the matrix.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className={KICKER}>Name</label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Account manager" className="mt-1.5 h-10 text-[13px]" autoFocus />
            </div>
            <div>
              <label className={KICKER}>What it is for</label>
              <Textarea value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Handles their own clients end to end" className="mt-1.5 min-h-[70px] text-[13px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="h-10 gap-2 rounded-[10px]" disabled={saving || !roleName.trim()} onClick={saveRole}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editingRole ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicating */}
      <Dialog open={!!duplicateSource} onOpenChange={(v) => { if (!v) setDuplicateSource(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Duplicate {duplicateSource?.name}</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              The copy starts with the same grants, and can be changed freely.
            </DialogDescription>
          </DialogHeader>
          <Input value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} className="h-10 text-[13px]" autoFocus />
          <DialogFooter>
            <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setDuplicateSource(null)}>Cancel</Button>
            <Button
              className="h-10 gap-2 rounded-[10px]"
              disabled={!duplicateName.trim()}
              onClick={async () => {
                try {
                  await duplicateRole(duplicateSource!.id, duplicateName.trim());
                  setDuplicateSource(null); setDuplicateName('');
                  toast.success('Role duplicated');
                } catch (e: any) { toast.error(e.message || 'Failed to duplicate'); }
              }}
            >
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Anyone holding this role loses everything it granted. Their account is not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await deleteRole(deleteTarget!.id);
                  if (selectedRole?.id === deleteTarget!.id) setSelectedRole(null);
                  setDeleteTarget(null);
                  toast.success('Role deleted');
                } catch (e: any) { toast.error(e.message || 'Failed to delete'); }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
