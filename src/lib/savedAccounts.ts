// Manages a local registry of recently signed-in accounts (up to 5).
// Stores public profile info plus the Supabase session tokens needed to
// restore the account without re-entering a password.
//
// Security note: Supabase already persists the active session's refresh
// token in localStorage by default, so storing tokens for other saved
// accounts has the same security posture. Tokens are scoped to this
// browser/device only.

const KEY = 'savedAccounts';
const MAX_ACCOUNTS = 5;

export interface SavedAccountSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number | null;
}

export interface SavedAccount {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role?: 'admin' | 'team' | 'user' | string | null;
  lastUsedAt: number;
  session?: SavedAccountSession | null;
}

function read(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(a => a && a.id && a.email) : [];
  } catch {
    return [];
  }
}

function write(accounts: SavedAccount[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
    window.dispatchEvent(new CustomEvent('saved-accounts-changed'));
  } catch {
    // ignore quota errors
  }
}

export function getSavedAccounts(): SavedAccount[] {
  return read().sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

export function upsertSavedAccount(account: Omit<SavedAccount, 'lastUsedAt'>) {
  const existing = read().find(a => a.id === account.id);
  const others = read().filter(a => a.id !== account.id);
  others.unshift({
    ...existing,
    ...account,
    // Preserve existing session if no new one supplied
    session: account.session ?? existing?.session ?? null,
    lastUsedAt: Date.now(),
  });
  write(others);
}

export function removeSavedAccount(id: string) {
  write(read().filter(a => a.id !== id));
}

export function clearSavedAccounts() {
  write([]);
}
