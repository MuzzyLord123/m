import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePortalHome } from '@/hooks/usePortalHome';
import {
  Inbox, Star, Send, FileText, Archive, Trash2, AlertTriangle, Tag,
  Search, RefreshCw, MoreVertical, ChevronDown, ChevronLeft,
  Paperclip, Reply, ReplyAll, Forward, X, Plus, Bold, Italic, Underline,
  Link, Image, Smile, Clock, Minus, Maximize2, ArrowLeft, MailOpen,
  Settings, Filter, Pen, Users, Globe,
  ExternalLink, Download, Printer, Move,
  Mail as MailIcon, Loader2, AlertCircle, CheckCircle2, Unplug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

// --- Types ---
interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  display_name: string;
  provider: 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'custom';
  color: string;
  status: string;
  error_message: string | null;
  last_sync_at: string | null;
  created_at: string;
}

interface EmailMessage {
  id: string;
  account_id: string;
  from_name: string;
  from_email: string;
  to_addresses: { name: string; email: string }[];
  subject: string;
  snippet: string;
  body_html: string;
  body_text: string;
  date: string;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  attachments: { name: string; size: string; type: string }[];
  labels: string[];
  folder: string;
  category: string;
  thread_id: string | null;
}

const FOLDERS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'sent', label: 'Sent', icon: Send },
  { id: 'drafts', label: 'Drafts', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'spam', label: 'Spam', icon: AlertTriangle },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

const PROVIDER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  gmail: { label: 'Gmail', color: '#EA4335', icon: '🔴' },
  outlook: { label: 'Outlook', color: '#0078D4', icon: '🔵' },
  yahoo: { label: 'Yahoo', color: '#6001D2', icon: '🟣' },
  icloud: { label: 'iCloud', color: '#999', icon: '⚪' },
  custom: { label: 'Custom IMAP', color: '#6366f1', icon: '⚙️' },
};

function formatEmailDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

// ============ SETTINGS PANEL ============
function SettingsPanel({ open, onClose, accounts, onConnectAccount, onRemoveAccount, onSyncAccount, userId }: {
  open: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  onConnectAccount: (provider: string) => void;
  onRemoveAccount: (id: string) => void;
  onSyncAccount: (id: string) => void;
  userId: string | undefined;
}) {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'accounts' | 'credentials'>('accounts');
  const [gmailClientId, setGmailClientId] = useState('');
  const [gmailClientSecret, setGmailClientSecret] = useState('');
  const [outlookClientId, setOutlookClientId] = useState('');
  const [outlookClientSecret, setOutlookClientSecret] = useState('');
  const [loadingCreds, setLoadingCreds] = useState(true);
  const [savingCreds, setSavingCreds] = useState<string | null>(null);

  // Load existing credentials from user_connections
  useEffect(() => {
    if (!open || !userId) return;
    const loadCreds = async () => {
      setLoadingCreds(true);
      const { data } = await supabase
        .from('user_connections')
        .select('provider, credentials')
        .eq('user_id', userId)
        .in('provider', ['gmail_oauth', 'outlook_oauth']);

      if (data) {
        for (const conn of data) {
          const creds = conn.credentials as Record<string, string> | null;
          if (conn.provider === 'gmail_oauth' && creds) {
            setGmailClientId(creds.client_id || '');
            setGmailClientSecret(creds.client_secret ? '••••••••' : '');
          }
          if (conn.provider === 'outlook_oauth' && creds) {
            setOutlookClientId(creds.client_id || '');
            setOutlookClientSecret(creds.client_secret ? '••••••••' : '');
          }
        }
      }
      setLoadingCreds(false);
    };
    loadCreds();
  }, [open, userId]);

  const saveCredentials = async (provider: 'gmail' | 'outlook') => {
    if (!userId) return;
    setSavingCreds(provider);
    try {
      const connProvider = `${provider}_oauth`;
      const clientId = provider === 'gmail' ? gmailClientId : outlookClientId;
      const clientSecret = provider === 'gmail' ? gmailClientSecret : outlookClientSecret;

      if (!clientId.trim()) {
        toast.error('Client ID is required');
        setSavingCreds(null);
        return;
      }

      // Check if masked (unchanged)
      const isMasked = clientSecret === '••••••••';

      const { data: existing } = await supabase
        .from('user_connections')
        .select('id, credentials')
        .eq('user_id', userId)
        .eq('provider', connProvider)
        .maybeSingle();

      const newCreds: Record<string, string> = { client_id: clientId.trim() };
      if (!isMasked && clientSecret.trim()) {
        newCreds.client_secret = clientSecret.trim();
      } else if (existing) {
        // Keep existing secret
        const existingCreds = existing.credentials as Record<string, string> | null;
        if (existingCreds?.client_secret) {
          newCreds.client_secret = existingCreds.client_secret;
        }
      }

      if (existing) {
        await supabase
          .from('user_connections')
          .update({ credentials: newCreds as any, is_connected: true, connected_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_connections')
          .insert({ user_id: userId, provider: connProvider, credentials: newCreds as any, is_connected: true, connected_at: new Date().toISOString() });
      }

      toast.success(`${provider === 'gmail' ? 'Gmail' : 'Outlook'} credentials saved`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save credentials');
    } finally {
      setSavingCreds(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle>Mail Settings</DialogTitle>
          <DialogDescription>Manage your connected email accounts and API credentials</DialogDescription>
        </DialogHeader>

        {/* Settings tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 mb-2">
          <button
            onClick={() => setActiveSettingsTab('accounts')}
            className={cn("flex-1 text-sm font-medium py-1.5 rounded-md transition-colors", activeSettingsTab === 'accounts' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            Accounts
          </button>
          <button
            onClick={() => setActiveSettingsTab('credentials')}
            className={cn("flex-1 text-sm font-medium py-1.5 rounded-md transition-colors", activeSettingsTab === 'credentials' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            API Credentials
          </button>
        </div>

        {activeSettingsTab === 'accounts' && (
          <div className="space-y-6 py-2">
            {/* Connected accounts */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Connected Accounts</h3>
              {accounts.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <MailIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No accounts connected yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Configure API credentials first, then connect an account</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map(acc => {
                    const config = PROVIDER_CONFIG[acc.provider];
                    return (
                      <div key={acc.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                        <span className="text-lg">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{acc.email_address}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{config.label}</span>
                            {acc.status === 'active' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            {acc.status === 'error' && (
                              <Tooltip>
                                <TooltipTrigger><AlertCircle className="h-3 w-3 text-destructive" /></TooltipTrigger>
                                <TooltipContent>{acc.error_message || 'Connection error'}</TooltipContent>
                              </Tooltip>
                            )}
                            {acc.status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onSyncAccount(acc.id)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemoveAccount(acc.id)}>
                            <Unplug className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add account */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Connect New Account</h3>
              <div className="grid grid-cols-2 gap-2">
                {(['gmail', 'outlook'] as const).map(provider => {
                  const config = PROVIDER_CONFIG[provider];
                  return (
                    <Button
                      key={provider}
                      variant="outline"
                      className="h-auto py-3 flex flex-col items-center gap-1.5"
                      onClick={() => onConnectAccount(provider)}
                    >
                      <span className="text-xl">{config.icon}</span>
                      <span className="text-xs font-medium">{config.label}</span>
                    </Button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Connect via OAuth — your password is never stored. Configure API credentials in the "API Credentials" tab first.
              </p>
            </div>
          </div>
        )}

        {activeSettingsTab === 'credentials' && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-2 pr-2">
              {loadingCreds ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Gmail credentials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔴</span>
                      <h3 className="text-sm font-semibold text-foreground">Gmail OAuth Credentials</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Create credentials at{' '}
                      <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        Google Cloud Console <ExternalLink className="h-3 w-3" />
                      </a>
                      . Add <code className="text-[11px] bg-muted px-1 rounded">{window.location.origin}/lounge/mail</code> as an authorized redirect URI.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Client ID</Label>
                        <Input
                          value={gmailClientId}
                          onChange={(e) => setGmailClientId(e.target.value)}
                          placeholder="xxxx.apps.googleusercontent.com"
                          className="text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Client Secret</Label>
                        <Input
                          type="password"
                          value={gmailClientSecret}
                          onChange={(e) => setGmailClientSecret(e.target.value)}
                          placeholder="GOCSPX-..."
                          className="text-sm mt-1"
                          onFocus={(e) => { if (e.target.value === '••••••••') setGmailClientSecret(''); }}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveCredentials('gmail')}
                        disabled={savingCreds === 'gmail' || !gmailClientId.trim()}
                        className="w-full"
                      >
                        {savingCreds === 'gmail' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Gmail Credentials
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Outlook credentials */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔵</span>
                      <h3 className="text-sm font-semibold text-foreground">Outlook OAuth Credentials</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Register an app at{' '}
                      <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                        Azure Portal <ExternalLink className="h-3 w-3" />
                      </a>
                      . Add <code className="text-[11px] bg-muted px-1 rounded">{window.location.origin}/lounge/mail</code> as a redirect URI.
                    </p>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs">Application (Client) ID</Label>
                        <Input
                          value={outlookClientId}
                          onChange={(e) => setOutlookClientId(e.target.value)}
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          className="text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Client Secret</Label>
                        <Input
                          type="password"
                          value={outlookClientSecret}
                          onChange={(e) => setOutlookClientSecret(e.target.value)}
                          placeholder="Client secret value"
                          className="text-sm mt-1"
                          onFocus={(e) => { if (e.target.value === '••••••••') setOutlookClientSecret(''); }}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => saveCredentials('outlook')}
                        disabled={savingCreds === 'outlook' || !outlookClientId.trim()}
                        className="w-full"
                      >
                        {savingCreds === 'outlook' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save Outlook Credentials
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============ COMPOSE MODAL ============
function ComposeModal({ onClose, accounts, onSend }: {
  onClose: () => void;
  accounts: EmailAccount[];
  onSend: (accountId: string, to: string, subject: string, body: string) => void;
}) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [minimized, setMinimized] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!to || !selectedAccount) return;
    setSending(true);
    await onSend(selectedAccount, to, subject, body);
    setSending(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className={cn(
        "fixed z-[60] bg-card border border-border shadow-2xl flex flex-col",
        fullScreen
          ? "inset-2 sm:inset-4 rounded-xl"
          : minimized
            ? "bottom-0 right-2 sm:right-4 w-[280px] sm:w-[320px] h-10 rounded-t-lg overflow-hidden"
            : "inset-0 sm:inset-auto sm:bottom-0 sm:right-4 sm:w-[560px] sm:h-[480px] sm:rounded-t-xl"
      )}
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/80 rounded-t-xl cursor-pointer select-none shrink-0" onClick={() => minimized && setMinimized(false)}>
        <span className="text-sm font-semibold text-foreground">New Message</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setMinimized(!minimized); }}><Minus className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFullScreen(!fullScreen); }}><Maximize2 className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="flex-1 flex flex-col overflow-hidden">
            {accounts.length > 1 && (
              <div className="border-b border-border px-4 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-10">From</span>
                  <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="flex-1 text-sm bg-transparent border-0 outline-none">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.email_address}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-10">To</span>
                <Input value={to} onChange={e => setTo(e.target.value)} className="border-0 shadow-none h-8 text-sm focus-visible:ring-0 px-0" placeholder="Recipients" />
              </div>
            </div>
            <div className="border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-10">Subj</span>
                <Input value={subject} onChange={e => setSubject(e.target.value)} className="border-0 shadow-none h-8 text-sm focus-visible:ring-0 px-0" placeholder="Subject" />
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea value={body} onChange={e => setBody(e.target.value)} className="border-0 shadow-none h-full resize-none text-sm focus-visible:ring-0 p-0" placeholder="Compose your email..." />
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border shrink-0">
            <div className="flex items-center gap-1 flex-wrap">
              <Button className="h-9 px-6 text-sm font-semibold rounded-full" onClick={handleSend} disabled={sending || !to}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Send
              </Button>
              <div className="hidden sm:flex items-center gap-0.5 ml-2">
                {[Bold, Italic, Underline, Link, Image, Smile, Paperclip].map((Icon, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-8 w-8"><Icon className="h-4 w-4" /></Button>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </>
      )}
    </motion.div>
  );
}

// ============ MAIN COMPONENT ============
export default function LoungeMail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // State
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('inbox');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('primary');
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Mobile: 'sidebar' | 'list' | 'reading'
  const [mobileView, setMobileView] = useState<'sidebar' | 'list' | 'reading'>('list');

  // Load accounts and emails
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, [searchParams]);

  // Realtime subscription for emails
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('email-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_messages', filter: `user_id=eq.${user.id}` }, () => loadEmails())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_accounts', filter: `user_id=eq.${user.id}` }, () => loadAccounts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadAccounts(), loadEmails()]);
    setLoading(false);
  };

  const loadAccounts = async () => {
    const { data } = await supabase.from('email_accounts').select('*').order('created_at');
    if (data) setAccounts(data as EmailAccount[]);
  };

  const loadEmails = async () => {
    const { data } = await supabase.from('email_messages').select('*').order('date', { ascending: false }).limit(200);
    if (data) setEmails(data as unknown as EmailMessage[]);
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    try {
      toast.loading('Connecting account...');
      const { data, error } = await supabase.functions.invoke('email-oauth', {
        body: {
          action: 'exchange_code',
          provider: state,
          code,
          redirectUri: `${window.location.origin}/lounge/mail`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.dismiss();
      toast.success(`Connected ${data.email}`);
      
      // Clean URL
      window.history.replaceState({}, '', '/lounge/mail');
      
      await loadAccounts();
      // Auto-sync
      const { data: accs } = await supabase.from('email_accounts').select('id').eq('email_address', data.email).single();
      if (accs) syncAccount(accs.id);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Failed to connect account');
      window.history.replaceState({}, '', '/lounge/mail');
    }
  };

  const connectAccount = async (provider: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-oauth', {
        body: {
          action: 'get_auth_url',
          provider,
          redirectUri: `${window.location.origin}/lounge/mail`,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      // Redirect to OAuth
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || 'Failed to start OAuth');
    }
  };

  const removeAccount = async (id: string) => {
    const { error } = await supabase.from('email_accounts').delete().eq('id', id);
    if (error) toast.error('Failed to remove account');
    else {
      toast.success('Account removed');
      await loadData();
    }
  };

  const syncAccount = async (accountId: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('email-sync', {
        body: { action: 'sync', accountId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Synced ${data.synced || 0} emails`);
      await loadEmails();
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const syncAllAccounts = async () => {
    for (const acc of accounts) {
      await syncAccount(acc.id);
    }
  };

  const sendEmail = async (accountId: string, to: string, subject: string, body: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('email-sync', {
        body: { action: 'send', accountId, updates: { to, subject, body } },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Email sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send');
    }
  };

  const toggleStar = useCallback(async (msg: EmailMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('email_messages').update({ is_starred: !msg.is_starred }).eq('id', msg.id);
    setEmails(prev => prev.map(em => em.id === msg.id ? { ...em, is_starred: !em.is_starred } : em));
  }, []);

  const markRead = useCallback(async (msg: EmailMessage) => {
    if (!msg.is_read) {
      await supabase.from('email_messages').update({ is_read: true }).eq('id', msg.id);
      setEmails(prev => prev.map(em => em.id === msg.id ? { ...em, is_read: true } : em));
    }
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Filtered emails
  const filteredEmails = useMemo(() => {
    let list = [...emails];
    if (selectedAccount) list = list.filter(e => e.account_id === selectedAccount);
    if (selectedFolder === 'starred') list = list.filter(e => e.is_starred);
    else list = list.filter(e => e.folder === selectedFolder || (selectedFolder === 'inbox' && e.folder === 'inbox'));
    if (selectedCategory && selectedFolder === 'inbox') {
      list = list.filter(e => e.category === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.subject || '').toLowerCase().includes(q) ||
        (e.from_name || '').toLowerCase().includes(q) ||
        (e.from_email || '').toLowerCase().includes(q) ||
        (e.snippet || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [emails, selectedFolder, selectedAccount, selectedCategory, searchQuery]);

  // Folder counts
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of FOLDERS) {
      if (f.id === 'starred') counts[f.id] = emails.filter(e => e.is_starred).length;
      else counts[f.id] = emails.filter(e => e.folder === f.id && !e.is_read).length;
    }
    return counts;
  }, [emails]);

  const handleSelectEmail = useCallback((email: EmailMessage) => {
    setSelectedEmail(email);
    markRead(email);
    if (isMobile) setMobileView('reading');
  }, [isMobile, markRead]);

  const handleMobileBack = useCallback(() => {
    if (mobileView === 'reading') { setSelectedEmail(null); setMobileView('list'); }
    else if (mobileView === 'sidebar') setMobileView('list');
    else navigate(portalHome);
  }, [mobileView, navigate, portalHome]);

  /* ─── Sidebar Content (shared) ─── */
  const sidebarContent = (mobile?: boolean) => (
    <div className={cn("flex flex-col h-full", !mobile && "bg-card")}>
      <div className="p-3 space-y-2 shrink-0">
        <Button
          variant="ghost"
          size={!mobile && sidebarCollapsed ? "icon" : "sm"}
          className={cn("w-full gap-2", !mobile && sidebarCollapsed && "px-0")}
          onClick={() => mobile ? setMobileView('list') : navigate(portalHome)}
        >
          <ArrowLeft className="h-4 w-4" />
          {(mobile || !sidebarCollapsed) && <span className="text-sm">Back</span>}
        </Button>
        <Button
          onClick={() => { setComposeOpen(true); if (mobile) setMobileView('list'); }}
          className={cn(
            "w-full gap-2 rounded-2xl shadow-md h-12 text-base font-semibold",
            !mobile && sidebarCollapsed && "px-0 justify-center"
          )}
          disabled={accounts.length === 0}
        >
          <Pen className="h-5 w-5" />
          {(mobile || !sidebarCollapsed) && <span>Compose</span>}
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <nav className="space-y-0.5 py-1">
          {FOLDERS.map(f => {
            const Icon = f.icon;
            const active = selectedFolder === f.id;
            const count = folderCounts[f.id] || 0;
            return (
              <button
                key={f.id}
                onClick={() => { setSelectedFolder(f.id); setSelectedEmail(null); if (mobile) setMobileView('list'); }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  !mobile && sidebarCollapsed && "justify-center px-0"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-primary")} />
                {(mobile || !sidebarCollapsed) && (
                  <>
                    <span className="flex-1 text-left truncate">{f.label}</span>
                    {count > 0 && (
                      <span className={cn("text-xs tabular-nums", active ? "text-primary font-bold" : "text-muted-foreground")}>
                        {count}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>
        {(mobile || !sidebarCollapsed) && (
          <>
            <Separator className="my-3" />
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Accounts</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSettingsOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <nav className="space-y-0.5 pb-4">
              {accounts.length === 0 ? (
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex items-center gap-2 w-full rounded-lg px-3 py-3 text-xs text-muted-foreground hover:bg-accent/50 transition-colors border border-dashed border-border"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Connect an account</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedAccount(null)}
                    className={cn(
                      "flex items-center gap-2.5 w-full rounded-full px-3 py-1.5 text-sm transition-colors",
                      !selectedAccount ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>All Accounts</span>
                  </button>
                  {accounts.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccount(selectedAccount === a.id ? null : a.id)}
                      className={cn(
                        "flex items-center gap-2.5 w-full rounded-full px-3 py-1.5 text-sm transition-colors",
                        selectedAccount === a.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                      <span className="truncate flex-1 text-left">{a.display_name || a.email_address}</span>
                      {a.status === 'error' && <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />}
                    </button>
                  ))}
                </>
              )}
            </nav>
          </>
        )}
      </ScrollArea>
      <div className="p-2 border-t border-border shrink-0">
        <Button
          variant="ghost"
          size={!mobile && sidebarCollapsed ? "icon" : "sm"}
          className={cn("w-full gap-2", !mobile && sidebarCollapsed && "px-0")}
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
          {(mobile || !sidebarCollapsed) && <span className="text-sm">Settings</span>}
        </Button>
      </div>
    </div>
  );

  /* ─── Email List Content (shared) ─── */
  const emailListContent = () => (
    <div className={cn("flex flex-col bg-background h-full", !isMobile && (selectedEmail ? "w-[380px] flex-shrink-0 border-r border-border" : "flex-1"))}>
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border shrink-0">
        {isMobile && (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setMobileView('sidebar')}>
            <MailIcon className="h-4 w-4" />
          </Button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mail"
            className="pl-10 h-9 sm:h-10 rounded-full bg-accent/50 border-0 focus-visible:ring-1 focus-visible:bg-background text-sm"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchQuery('')}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"><Filter className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Has attachment</DropdownMenuItem>
            <DropdownMenuItem>Is unread</DropdownMenuItem>
            <DropdownMenuItem>Is starred</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 sm:py-2 border-b border-border shrink-0">
        <Checkbox
          className="mr-1"
          checked={selectedIds.size === filteredEmails.length && filteredEmails.length > 0}
          onCheckedChange={(checked) => {
            if (checked) setSelectedIds(new Set(filteredEmails.map(e => e.id)));
            else setSelectedIds(new Set());
          }}
        />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={syncAllAccounts} disabled={syncing || accounts.length === 0}>
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Mark all as read</DropdownMenuItem>
            <DropdownMenuItem>Select all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground tabular-nums">
          {filteredEmails.length === 0 ? 'No emails' : `${filteredEmails.length} email${filteredEmails.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Category Tabs */}
      {selectedFolder === 'inbox' && (
        <div className="flex border-b border-border overflow-x-auto scrollbar-hide shrink-0">
          {(['primary', 'promotions', 'social', 'updates'] as const).map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex-1 min-w-[70px] flex items-center justify-center gap-1.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium capitalize transition-colors relative shrink-0",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                {cat === 'primary' && <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {cat === 'promotions' && <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {cat === 'social' && <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                {cat === 'updates' && <MailIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                <span className="hidden sm:inline">{cat}</span>
                <span className="sm:hidden">{cat.slice(0, 4)}</span>
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Email List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredEmails.map(email => {
              const isSelected = selectedEmail?.id === email.id;
              const isChecked = selectedIds.has(email.id);
              const account = accounts.find(a => a.id === email.account_id);

              return (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={cn(
                    "flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors group relative",
                    isSelected && "bg-primary/5 border-l-2 border-l-primary",
                    !isSelected && "hover:bg-accent/30",
                    !email.is_read && "bg-accent/20"
                  )}
                >
                  <div className="flex items-center gap-1.5 pt-0.5 flex-shrink-0">
                    <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(email.id)} onClick={(e) => e.stopPropagation()} className="h-4 w-4" />
                    <button onClick={(e) => toggleStar(email, e)} className="text-muted-foreground hover:text-yellow-500 transition-colors">
                      <Star className={cn("h-4 w-4", email.is_starred && "fill-yellow-400 text-yellow-400")} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm truncate", !email.is_read ? "font-semibold text-foreground" : "text-foreground/80")}>
                        {email.from_name || email.from_email}
                      </span>
                      {account && (
                        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: account.color }} />
                      )}
                      <span className="ml-auto text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
                        {formatEmailDate(email.date)}
                      </span>
                    </div>
                    <span className={cn("text-sm truncate block", !email.is_read ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {email.subject || '(no subject)'}
                    </span>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{(email.snippet || '').slice(0, 100)}</p>
                    {email.has_attachments && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded mt-1 w-fit">
                        <Paperclip className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEmails.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-20 sm:py-32 text-center px-4">
                <MailIcon className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-sm sm:text-base font-semibold text-muted-foreground/50 mb-1">
                  {accounts.length === 0 ? 'No accounts connected' : 'No emails'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground/40 mb-4">
                  {accounts.length === 0 ? 'Connect a Gmail or Outlook account to get started' : 'This folder is empty'}
                </p>
                {accounts.length === 0 && (
                  <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Connect Account
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Mobile FAB for compose */}
      {isMobile && accounts.length > 0 && (
        <Button
          onClick={() => setComposeOpen(true)}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <Pen className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

  /* ─── Reading Pane Content (shared) ─── */
  const readingPaneContent = () => {
    if (!selectedEmail) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <MailIcon className="h-20 w-20 text-muted-foreground/15 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground/60 mb-1">Quooro Mail</h3>
          <p className="text-sm text-muted-foreground/40">
            {accounts.length === 0 ? 'Connect an account to get started' : 'Select an email to read'}
          </p>
        </div>
      );
    }
    return (
      <motion.div
        key={selectedEmail.id}
        initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 flex flex-col bg-background overflow-hidden"
      >
        <div className="flex items-center gap-1 px-3 sm:px-4 py-2 border-b border-border flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedEmail(null); if (isMobile) setMobileView('list'); }}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {[Archive, AlertTriangle, Trash2, MailOpen, Clock, Move].map((Icon, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><Icon className="h-4 w-4" /></Button>
                </TooltipTrigger>
                <TooltipContent>{['Archive', 'Report spam', 'Delete', 'Mark unread', 'Snooze', 'Move to'][i]}</TooltipContent>
              </Tooltip>
            ))}
            <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex"><Printer className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex"><ExternalLink className="h-4 w-4" /></Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">{selectedEmail.subject || '(no subject)'}</h1>
            <div className="flex items-start gap-3 mb-4 sm:mb-6">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-semibold">
                  {getInitials(selectedEmail.from_name || selectedEmail.from_email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">{selectedEmail.from_name || selectedEmail.from_email}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">&lt;{selectedEmail.from_email}&gt;</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  to {(selectedEmail.to_addresses || []).map((t: any) => t.name || t.email).join(', ') || 'me'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:inline">{formatEmailDate(selectedEmail.date)}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7"><Reply className="h-4 w-4" /></Button>
              </div>
            </div>

            {selectedEmail.body_html ? (
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
            ) : (
              <div className="text-sm text-foreground whitespace-pre-wrap">{selectedEmail.body_text || selectedEmail.snippet}</div>
            )}

            {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{selectedEmail.attachments.length} Attachment{selectedEmail.attachments.length > 1 ? 's' : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((att: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 border border-border rounded-lg px-3 py-2 hover:bg-accent/30 transition-colors cursor-pointer">
                      <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/60" />
                      <div>
                        <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[160px]">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground">{att.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 sm:mt-8 border border-border rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Reply className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click here to <button className="text-primary font-medium hover:underline" onClick={() => setComposeOpen(true)}>Reply</button>,{' '}
                  <button className="text-primary font-medium hover:underline" onClick={() => setComposeOpen(true)}>Reply All</button>, or{' '}
                  <button className="text-primary font-medium hover:underline" onClick={() => setComposeOpen(true)}>Forward</button>
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </motion.div>
    );
  };

  return (
    <TooltipProvider>
      <div className="fixed inset-0 z-50 flex bg-background overflow-hidden">

        {/* ─── MOBILE LAYOUT ─── */}
        {isMobile ? (
          <>
            {mobileView === 'sidebar' && (
              <div className="w-full h-full">
                {sidebarContent(true)}
              </div>
            )}
            {mobileView === 'list' && emailListContent()}
            {mobileView === 'reading' && readingPaneContent()}
          </>
        ) : (
          /* ─── DESKTOP LAYOUT ─── */
          <>
            {/* Left Sidebar */}
            <div className={cn(
              "flex-shrink-0 border-r border-border transition-all duration-200",
              sidebarCollapsed ? "w-16" : "w-56"
            )}>
              {sidebarContent(false)}
            </div>

            {/* Email List */}
            {emailListContent()}

            {/* Reading Pane (desktop only shows inline) */}
            {selectedEmail ? readingPaneContent() : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <MailIcon className="h-20 w-20 text-muted-foreground/15 mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground/60 mb-1">Quooro Mail</h3>
                <p className="text-sm text-muted-foreground/40">
                  {accounts.length === 0 ? 'Connect an account to get started' : 'Select an email to read'}
                </p>
              </div>
            )}
          </>
        )}

        {/* Compose Modal */}
        <AnimatePresence>
          {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} accounts={accounts} onSend={sendEmail} />}
        </AnimatePresence>

        {/* Settings Dialog */}
        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          accounts={accounts}
          onConnectAccount={connectAccount}
          onRemoveAccount={removeAccount}
          onSyncAccount={syncAccount}
          userId={user?.id}
        />
      </div>
    </TooltipProvider>
  );
}
