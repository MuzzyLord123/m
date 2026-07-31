import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ArrowLeft, Radar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { quickSignOut } from '@/hooks/useAuthSync';

/**
 * Access refused.
 *
 * A refusal should be precise, not dramatic. The page states exactly
 * what was asked for, what the account actually is, and the one move
 * that resolves it - and says plainly that the attempt was recorded,
 * because on a platform holding client data that is the truth and it
 * belongs on the screen.
 */

const PORTAL_NAME: Record<string, string> = {
  team: 'the Team portal',
  customer: 'the Customer lounge',
};

const ROLE_NAME: Record<string, string> = {
  admin: 'Team',
  user: 'Customer',
};

export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state as { attemptedPortal?: string; actualRole?: string } | null;
  const attemptedPortal = state?.attemptedPortal || 'unknown';
  const actualRole = state?.actualRole || 'unknown';

  const portal = PORTAL_NAME[attemptedPortal] || 'an area';
  const role = ROLE_NAME[actualRole] || 'Not recognised';

  const handleLogout = async () => {
    navigate('/sign-in', { replace: true });
    await quickSignOut();
  };

  const guidance =
    actualRole === 'user'
      ? 'A customer account reaches the Customer lounge. Everything of yours lives there.'
      : actualRole === 'admin'
        ? 'A team account reaches the Team portal. Sign in there to carry on.'
        : 'If you believe this account should have access, ask an owner to check its role.';

  const kicker = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] text-foreground">
      <header className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[9px] border border-border/60 bg-card">
          <Radar className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="font-display text-[15px] font-semibold leading-tight tracking-[-0.01em]">Quooro</p>
          <p className={kicker}>Access control</p>
        </div>
      </header>
      <div aria-hidden className="mt-4 h-px bg-gradient-to-r from-risk/50 via-border to-transparent" />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-md">
          <p className={kicker}>Refused</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[38px]">
            This account cannot open {portal}.
          </h1>
          <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">{guidance}</p>

          {/* Exactly what happened, stated plainly. */}
          <dl className="mt-6 overflow-hidden rounded-[12px] border border-border/60 bg-card">
            {[
              ['Area requested', portal.replace(/^the /, '')],
              ['This account', role],
              ...(user?.email ? [['Signed in as', user.email]] : []),
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 border-b border-border/50 px-4 py-2.5 last:border-b-0"
              >
                <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
                <dd className="truncate text-right font-mono text-[11.5px]">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-primary text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogOut className="h-4 w-4" /> Sign in with another account
            </button>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[12px] border border-border/60 text-[13.5px] font-medium transition-colors hover:bg-foreground/[0.03]"
            >
              <ArrowLeft className="h-4 w-4" /> Back to the website
            </button>
          </div>

          <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
            <span aria-hidden className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-risk" />
            This attempt was recorded in the security log, with the time and the account used.
          </p>
        </div>
      </main>

      <p className="text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground/60">
        Quooro · Built in Wales
      </p>
    </div>
  );
}
