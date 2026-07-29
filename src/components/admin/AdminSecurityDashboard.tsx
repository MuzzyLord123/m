import { useState, useEffect } from 'react';
import {
  Send,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import SecuritySettings from '@/components/security/SecuritySettings';
import SecurityLogsPanel from '@/components/admin/SecurityLogsPanel';
import IPManagementPanel from '@/components/admin/IPManagementPanel';
import {
  Panel, DataTable, StatusBadge, StatusDot, AvatarID, SkeletonBlock, SkeletonTable,
  type Column,
} from '@/components/platform';

interface UserStats {
  userId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  twoFactorEnabled: boolean;
  lastLogin: string | null;
}

interface AdminStats {
  totalUsers: number;
  usersWithTwoFactor: number;
  adminCount: number;
  adminsWithTwoFactor: number;
  usersList: UserStats[];
}

export default function AdminSecurityDashboard() {
  const { status: myStatus, loading: myStatusLoading, getAdminStats } = useTwoFactor();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getAdminStats();
    if (data) {
      setStats(data);
      setIsAdmin(true);
    } else {
      // Non-admin users will get null from getAdminStats
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Wait for the initial status fetch to complete before deciding
    if (myStatusLoading) {
      return;
    }

    // Only fetch admin stats if the user is an admin
    if (myStatus?.role === 'admin') {
      fetchStats();
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, [myStatus?.role, myStatusLoading]);

  const sendSecurityReminder = async (userId: string, email: string) => {
    setSendingReminder(userId);
    // Simulate sending reminder - in production this would trigger an email
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Security reminder sent to ${email}`);
    setSendingReminder(null);
  };

  const adoptionPercentage = stats
    ? Math.round((stats.usersWithTwoFactor / stats.totalUsers) * 100)
    : 0;

  const adminAdoptionPercentage = stats && stats.adminCount > 0
    ? Math.round((stats.adminsWithTwoFactor / stats.adminCount) * 100)
    : 0;

  const columns: Column<UserStats>[] = [
    {
      key: 'user',
      header: 'User',
      sortValue: (u) => (u.fullName || u.email).toLowerCase(),
      render: (user) => (
        <div className="flex items-center gap-2 py-1">
          <AvatarID name={user.fullName} email={user.email} size="md" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{user.fullName || 'Unknown'}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      hideBelowMd: true,
      sortValue: (u) => u.role,
      render: (user) => (
        <StatusBadge
          tone={user.role === 'admin' ? 'accent' : 'neutral'}
          label={user.role === 'admin' ? 'Team' : 'Customer'}
        />
      ),
    },
    {
      key: 'twofactor',
      header: '2FA',
      sortValue: (u) => (u.twoFactorEnabled ? 1 : 0),
      render: (user) =>
        user.twoFactorEnabled ? (
          <StatusBadge tone="ok" label="Enabled" />
        ) : (
          <StatusBadge tone="attend" label="Not enabled" />
        ),
    },
    {
      key: 'lastLogin',
      header: 'Last login',
      hideBelowMd: true,
      mono: true,
      sortValue: (u) => u.lastLogin || '',
      render: (user) =>
        user.lastLogin ? (
          <span className="text-muted-foreground">{format(new Date(user.lastLogin), 'd MMM yyyy')}</span>
        ) : (
          <span className="text-muted-foreground/60">Never</span>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (user) =>
        !user.twoFactorEnabled ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => sendSecurityReminder(user.userId, user.email)}
            disabled={sendingReminder === user.userId}
            className="h-7 gap-2 rounded-md px-2.5 text-xs"
          >
            {sendingReminder === user.userId ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Send reminder</span>
          </Button>
        ) : null,
    },
  ];

  if (loading || myStatusLoading) {
    return (
      <div className="space-y-4" aria-busy>
        <SkeletonBlock className="h-[120px] rounded-[10px]" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonBlock key={i} className="h-[64px] rounded-[10px]" />
          ))}
        </div>
        <Panel>
          <SkeletonTable cols={4} rows={5} />
        </Panel>
      </div>
    );
  }

  // For non-admin users, just show their personal security settings
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <SecuritySettings />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* IP Management - Team-wide blacklist/whitelist */}
      <IPManagementPanel />

      {/* Security Event Logs */}
      <SecurityLogsPanel />

      {/* Your 2FA Status */}
      <SecuritySettings />

      {/* Adoption Stats */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total users', value: `${stats?.totalUsers || 0}`, tone: 'neutral' as const },
          { label: '2FA enabled', value: `${stats?.usersWithTwoFactor || 0}`, tone: 'ok' as const },
          { label: 'Without 2FA', value: `${(stats?.totalUsers || 0) - (stats?.usersWithTwoFactor || 0)}`, tone: 'attend' as const },
          { label: 'Overall adoption', value: `${adoptionPercentage}%`, tone: 'neutral' as const },
        ].map((s) => (
          <Panel key={s.label} className="p-3">
            <div className="flex items-center gap-1.5">
              <StatusDot tone={s.tone} />
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
            </div>
            <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-[-0.01em]">{s.value}</p>
          </Panel>
        ))}
      </div>

      {/* Adoption Progress */}
      <Card className="rounded-[10px] border-border/60 shadow-none">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-[15px] font-semibold tracking-[-0.01em]">2FA adoption rate</CardTitle>
          <CardDescription className="text-[12px]">
            Track security adoption across the organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-4 pb-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span>All users</span>
              <span className="font-mono font-medium tabular-nums">{adoptionPercentage}%</span>
            </div>
            <Progress value={adoptionPercentage} className="h-1.5 bg-sunken" />
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {stats?.usersWithTwoFactor || 0} of {stats?.totalUsers || 0} users have 2FA enabled
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[13px]">
              <span className="flex items-center gap-2">
                Team members
                {adminAdoptionPercentage < 100 && <StatusDot tone="risk" />}
              </span>
              <span className="font-mono font-medium tabular-nums">{adminAdoptionPercentage}%</span>
            </div>
            <Progress
              value={adminAdoptionPercentage}
              className={`h-1.5 bg-sunken ${adminAdoptionPercentage < 100 ? '[&>div]:bg-risk' : ''}`}
            />
            <p className="text-[11px] tabular-nums text-muted-foreground">
              {stats?.adminsWithTwoFactor || 0} of {stats?.adminCount || 0} team members have 2FA enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card className="rounded-[10px] border-border/60 shadow-none">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[15px] font-semibold tracking-[-0.01em]">Security status by user</CardTitle>
              <CardDescription className="text-[12px]">
                View 2FA status and send security reminders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} className="h-8 gap-2 rounded-lg border-border/60 px-3 text-xs">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-hidden rounded-lg border border-border/60">
            <DataTable
              rows={stats?.usersList || []}
              columns={columns}
              rowKey={(u) => u.userId}
              aria-label="Security status by user"
              defaultSort={{ key: 'twofactor', dir: 'asc' }}
              empty={{ title: 'No users found', body: 'Users appear here once accounts exist.' }}
              mobileCard={(user) => (
                <div className="flex items-center gap-3 px-3 py-3">
                  <AvatarID name={user.fullName} email={user.email} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{user.fullName || 'Unknown'}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  {user.twoFactorEnabled ? (
                    <StatusBadge tone="ok" label="Enabled" className="shrink-0 text-[10.5px]" />
                  ) : (
                    <StatusBadge tone="attend" label="Not enabled" className="shrink-0 text-[10.5px]" />
                  )}
                </div>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
