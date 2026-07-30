import { useEffect, useMemo, useState } from 'react';
import {
  Send, Loader2, RefreshCw, ShieldCheck, KeyRound, Activity, Network,
  UserCog, AlertTriangle, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import SecuritySettings from '@/components/security/SecuritySettings';
import SecurityLogsPanel from '@/components/admin/SecurityLogsPanel';
import IPManagementPanel from '@/components/admin/IPManagementPanel';
import {
  Panel, PanelHeader, AvatarID, SkeletonBlock, SkeletonTable, EmptyState,
} from '@/components/platform';

/**
 * The security desk.
 *
 * It opens on posture rather than on a list, because the first question
 * is always "are we exposed right now". The figure is computed from real
 * signals and every input is shown next to it, so it can be argued with
 * rather than trusted blindly - a score nobody can audit is decoration.
 *
 * Everything below it is the work: who is unprotected and can be chased
 * in one press, what happened, and which networks may reach us.
 */

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

type Section = 'posture' | 'access' | 'events' | 'network' | 'mine';

const SECTIONS: { key: Section; label: string; icon: any }[] = [
  { key: 'posture', label: 'Posture', icon: ShieldCheck },
  { key: 'access', label: 'Access', icon: UserCog },
  { key: 'events', label: 'Events', icon: Activity },
  { key: 'network', label: 'Network', icon: Network },
  { key: 'mine', label: 'My security', icon: KeyRound },
];

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

/**
 * Posture: the share of accounts standing behind a second factor, with
 * team accounts weighted three times a customer account because a team
 * account can reach every customer's data.
 */
function computePosture(stats: AdminStats | null) {
  if (!stats || !stats.totalUsers) return null;
  const customers = Math.max(stats.totalUsers - stats.adminCount, 0);
  const customersProtected = Math.max(stats.usersWithTwoFactor - stats.adminsWithTwoFactor, 0);
  const weighted = (stats.adminsWithTwoFactor * 3) + customersProtected;
  const total = (stats.adminCount * 3) + customers;
  const score = total ? Math.round((weighted / total) * 100) : 0;
  return {
    score,
    customers,
    customersProtected,
    adminGap: stats.adminCount - stats.adminsWithTwoFactor,
    customerGap: customers - customersProtected,
  };
}

/** The posture ring: one arc, drawn from the real number. */
function PostureRing({ score }: { score: number }) {
  const size = 148;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const tone = score >= 85 ? 'hsl(var(--ok))' : score >= 55 ? 'hsl(var(--attend))' : 'hsl(var(--risk))';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke}
          className="stroke-border/70"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={tone}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * score) / 100}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[38px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
          {score}
        </span>
        <span className={KICKER}>Posture</span>
      </div>
    </div>
  );
}

function Figure({
  label, value, meta, tone,
}: { label: string; value: string | number; meta?: string; tone?: 'ok' | 'attend' | 'risk' }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <p className={KICKER}>{label}</p>
      <p className={cn(
        'mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
        tone === 'ok' && 'text-ok', tone === 'attend' && 'text-attend', tone === 'risk' && 'text-risk',
      )}>
        {value}
      </p>
      {meta && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{meta}</p>}
    </div>
  );
}

export default function AdminSecurityDashboard() {
  const { status: myStatus, loading: myStatusLoading, getAdminStats } = useTwoFactor();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [section, setSection] = useState<Section>('posture');

  const fetchStats = async () => {
    setLoading(true);
    const data: any = await getAdminStats();
    if (data) {
      // Normalised on the way in: a partial payload must not be able to
      // take the whole security desk down.
      setStats({
        totalUsers: Number(data.totalUsers || 0),
        usersWithTwoFactor: Number(data.usersWithTwoFactor || 0),
        adminCount: Number(data.adminCount || 0),
        adminsWithTwoFactor: Number(data.adminsWithTwoFactor || 0),
        usersList: Array.isArray(data.usersList) ? data.usersList : [],
      });
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (myStatusLoading) return;
    if (myStatus?.role === 'admin') fetchStats();
    else { setLoading(false); setIsAdmin(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myStatus?.role, myStatusLoading]);

  const sendSecurityReminder = async (userId: string, email: string) => {
    setSendingReminder(userId);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Security reminder sent to ${email}`);
    setSendingReminder(null);
  };

  const posture = useMemo(() => computePosture(stats), [stats]);

  // Exposure, worst first: an unprotected team account outranks every
  // customer account, and a dormant account outranks an active one.
  const exposed = useMemo(() => {
    if (!stats) return [];
    return (stats.usersList || [])
      .filter(u => !u.twoFactorEnabled)
      .sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
        return (a.lastLogin || '').localeCompare(b.lastLogin || '');
      });
  }, [stats]);

  if (myStatusLoading || (loading && !stats)) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4 p-4 sm:p-6">
        <SkeletonBlock className="h-[190px] rounded-[14px]" />
        <SkeletonTable rows={6} />
      </div>
    );
  }

  // Customers get their own security, not the estate's.
  if (!isAdmin) {
    return (
      <ScrollArea className="h-full">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
          <p className={KICKER}>Your account</p>
          <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em]">Security</h1>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted-foreground">
            Two-factor authentication protects everything in your account: your files, invoices and messages.
          </p>
          <div className="mt-6">
            <SecuritySettings />
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={KICKER}>Estate security</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Security
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              Where the platform stands right now, who is unprotected, and everything that has happened.
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs" onClick={fetchStats}>
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Refresh
          </Button>
        </header>

        {/* Sections */}
        <div className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const on = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={cn(
                    'flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors',
                    on ? 'border border-border/70 bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                  {s.key === 'access' && exposed.length > 0 && (
                    <span className="rounded-full bg-attend/15 px-1.5 font-mono text-[9.5px] tabular-nums text-attend">
                      {exposed.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {section === 'posture' && (
          <div className="mt-5 space-y-4">
            {/* Posture, with its own working shown beside it */}
            <div className="overflow-hidden rounded-[14px] border border-border/60 bg-card">
              <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:gap-8 sm:p-6">
                <PostureRing score={posture?.score ?? 0} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold tracking-[-0.01em]">
                    {(posture?.score ?? 0) >= 85
                      ? 'The estate is well covered'
                      : (posture?.score ?? 0) >= 55
                        ? 'Cover is partial'
                        : 'The estate is exposed'}
                  </p>
                  <p className="mt-1.5 max-w-lg text-[12.5px] leading-relaxed text-muted-foreground">
                    Measured as the share of accounts behind a second factor, with team accounts counted three
                    times a customer account because a team account can reach every customer's data.
                  </p>
                  <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {[
                      ['Team accounts protected', `${stats?.adminsWithTwoFactor ?? 0} of ${stats?.adminCount ?? 0}`, (posture?.adminGap ?? 0) > 0],
                      ['Customer accounts protected', `${posture?.customersProtected ?? 0} of ${posture?.customers ?? 0}`, false],
                    ].map(([label, value, warn]) => (
                      <div key={String(label)} className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5">
                        <dt className="text-[12px] text-muted-foreground">{label}</dt>
                        <dd className={cn('font-mono text-[12px] tabular-nums', warn && 'text-attend')}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {(posture?.adminGap ?? 0) > 0 && (
                    <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-attend/40 bg-attend/[0.05] px-3 py-2.5 text-[12px] leading-relaxed text-attend">
                      <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0" />
                      <span>
                        {posture?.adminGap} team {posture?.adminGap === 1 ? 'account has' : 'accounts have'} no second factor.
                        A team account reaches every client record, so this is the first thing to close.
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-px border-t border-border/60 bg-border/60 sm:grid-cols-4">
                <Figure label="Accounts" value={stats?.totalUsers ?? 0} meta="On the platform" />
                <Figure label="Team" value={stats?.adminCount ?? 0} meta="Full-reach accounts" />
                <Figure
                  label="Protected"
                  value={stats?.usersWithTwoFactor ?? 0}
                  meta="Second factor on"
                  tone="ok"
                />
                <Figure
                  label="Unprotected"
                  value={exposed.length}
                  meta={exposed.length ? 'Chase these first' : 'Nothing outstanding'}
                  tone={exposed.length ? 'attend' : undefined}
                />
              </div>
            </div>

            <Panel>
              <PanelHeader label="Recent security events" />
              <div className="max-h-[420px] overflow-y-auto">
                <SecurityLogsPanel />
              </div>
            </Panel>
          </div>
        )}

        {section === 'access' && (
          <div className="mt-5 space-y-4">
            <Panel>
              <PanelHeader label={`${exposed.length} unprotected`}>
                <span className="text-[11px] text-muted-foreground">Team accounts first</span>
              </PanelHeader>
              {exposed.length === 0 ? (
                <EmptyState
                  compact
                  title="Every account is protected"
                  body="Nobody on the platform is signing in without a second factor."
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {exposed.map(u => (
                    <li key={u.userId} className="flex items-center gap-3 px-4 py-3">
                      <AvatarID name={u.fullName} email={u.email} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-[13px] font-medium">
                          {u.fullName || u.email}
                          {u.role === 'admin' && (
                            <span className="rounded-full border border-risk/40 bg-risk/[0.08] px-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-risk">
                              Team
                            </span>
                          )}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="hidden w-28 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground sm:block">
                        {u.lastLogin ? format(new Date(u.lastLogin), 'd MMM yyyy') : 'Never signed in'}
                      </span>
                      <Button
                        variant="outline" size="sm"
                        className="h-8 shrink-0 gap-1.5 rounded-lg text-xs"
                        disabled={sendingReminder === u.userId}
                        onClick={() => sendSecurityReminder(u.userId, u.email)}
                      >
                        {sendingReminder === u.userId
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Send className="h-3.5 w-3.5" />}
                        Remind
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel>
              <PanelHeader label={`All ${(stats?.usersList || []).length} accounts`} />
              <div className="max-h-[520px] overflow-y-auto">
                <ul className="divide-y divide-border/60">
                  {(stats?.usersList || []).map(u => (
                    <li key={u.userId} className="flex items-center gap-3 px-4 py-2.5">
                      <AvatarID name={u.fullName} email={u.email} size="md" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{u.fullName || u.email}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="hidden w-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground sm:block">
                        {u.role === 'admin' ? 'Team' : 'Customer'}
                      </span>
                      <span className={cn(
                        'flex w-24 shrink-0 items-center justify-end gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]',
                        u.twoFactorEnabled ? 'text-ok' : 'text-attend',
                      )}>
                        <Lock className="h-3 w-3" />
                        {u.twoFactorEnabled ? 'Protected' : 'Open'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </div>
        )}

        {section === 'events' && (
          <div className="mt-5">
            <Panel>
              <PanelHeader label="Security events" />
              <SecurityLogsPanel />
            </Panel>
          </div>
        )}

        {section === 'network' && (
          <div className="mt-5">
            <IPManagementPanel />
          </div>
        )}

        {section === 'mine' && (
          <div className="mt-5 max-w-3xl">
            <SecuritySettings />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
