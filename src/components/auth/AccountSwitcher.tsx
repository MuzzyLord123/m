import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  getSavedAccounts,
  removeSavedAccount,
  type SavedAccount,
} from '@/lib/savedAccounts';
import { cn } from '@/lib/utils';

interface AccountSwitcherProps {
  /** Where to send the user after sign-out for re-auth. Defaults to /sign-in */
  signInPath?: string;
  /** Portal type, forwarded to signOut for analytics/last-portal tracking */
  portal?: 'customer' | 'team';
  /** Called after a switch is initiated (so the parent can close popovers) */
  onSwitch?: () => void;
}

const LAST_EMAIL_KEY = 'lastLoggedInEmail';

export function AccountSwitcher({
  signInPath = '/sign-in',
  portal,
  onSwitch,
}: AccountSwitcherProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    const refresh = () => setAccounts(getSavedAccounts());
    refresh();
    window.addEventListener('saved-accounts-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('saved-accounts-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const getInitials = (a: SavedAccount) => {
    if (a.fullName) {
      const parts = a.fullName.trim().split(/\s+/);
      return (
        ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || 'U'
      );
    }
    return a.email.substring(0, 2).toUpperCase();
  };

  const handleSwitch = async (account: SavedAccount) => {
    if (account.id === user?.id || switching) return;
    onSwitch?.();

    // If we have a saved session, swap accounts silently and replay the
    // initial splash by doing a full reload (App.tsx shows the splash on mount).
    if (account.session?.access_token && account.session?.refresh_token) {
      setSwitching(true);
      try {
        const { error } = await supabase.auth.setSession({
          access_token: account.session.access_token,
          refresh_token: account.session.refresh_token,
        });

        if (error) throw error;

        // Trigger the splash on the next load
        sessionStorage.setItem('force-splash', '1');
        window.location.assign('/');
        return;
      } catch (err: any) {
        // Session expired or revoked — fall back to password sign-in
        toast({
          title: 'Session expired',
          description: 'Please sign in again to switch to this account.',
        });
        removeSavedAccount(account.id);
        setSwitching(false);
      }
    }

    // Fallback: prefill email and require password
    localStorage.setItem(LAST_EMAIL_KEY, account.email);
    await signOut(portal);
    navigate(signInPath, { replace: true });
  };

  const handleAddAccount = async () => {
    localStorage.removeItem(LAST_EMAIL_KEY);
    onSwitch?.();
    await signOut(portal);
    navigate(signInPath, { replace: true });
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSavedAccount(id);
    setAccounts(getSavedAccounts());
  };

  const others = accounts.filter(a => a.id !== user?.id);

  return (
    <div className="space-y-0.5">
      <div className="px-2 pt-1 pb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-semibold">
          Switch account
        </p>
      </div>

      {others.length === 0 && (
        <p className="px-3 py-2 text-[11px] text-muted-foreground/70">
          No other accounts saved yet.
        </p>
      )}

      {others.map(account => {
        const hasSession = !!account.session?.refresh_token;
        return (
          <button
            key={account.id}
            onClick={() => handleSwitch(account)}
            disabled={switching}
            className={cn(
              'group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md',
              'hover:bg-accent/60 transition-colors text-left disabled:opacity-50'
            )}
          >
            <Avatar className="h-7 w-7 border border-border/40 shrink-0">
              <AvatarImage src={account.avatarUrl || ''} alt={account.fullName || account.email} />
              <AvatarFallback className="bg-muted text-foreground/80 text-[10px] font-semibold">
                {getInitials(account)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate leading-tight">
                {account.fullName || account.email.split('@')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">
                {account.email}
                {!hasSession && (
                  <span className="ml-1 text-[9px] text-muted-foreground/60">· password</span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={e => handleRemove(e, account.id)}
              className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"
              title="Remove from saved accounts"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={handleAddAccount}
        disabled={switching}
        className="w-full justify-start text-muted-foreground hover:text-foreground text-[12px] h-8 rounded-md mt-0.5"
      >
        <UserPlus className="w-3.5 h-3.5 mr-2" />
        Add another account
      </Button>
    </div>
  );
}
