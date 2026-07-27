import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, ArrowRight, KeyRound, Plus, Search, Copy, Eye, EyeOff,
  Shield, ShieldCheck, Globe, Lock, FolderLock, QrCode, Fingerprint,
  Users, Star, StarOff, MoreHorizontal, Edit3, Trash2, RefreshCw,
  AlertTriangle, CheckCircle2, CreditCard, Wifi, Server, X, Key
} from 'lucide-react';

// ─── Crypto helpers (same as Secure Vault) ───
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(password: string, salt: string): Promise<string> {
  const first = await sha256(password + salt);
  return sha256(first + salt + 'vault_v1');
}

function generateMasterKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let key = '';
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 16; i++) {
    key += chars[arr[i] % chars.length];
    if (i === 3 || i === 7 || i === 11) key += '-';
  }
  return key;
}

function generateTOTPSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const arr = new Uint32Array(20);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 20; i++) secret += chars[arr[i] % chars.length];
  return secret;
}

function generateTOTPUri(secret: string, email: string, vaultName: string): string {
  return `otpauth://totp/Quooro%20Password%20Vault%20(${encodeURIComponent(vaultName)}):${encodeURIComponent(email)}?secret=${secret}&issuer=Quooro%20Password%20Vault&digits=6&period=30`;
}

async function encryptText(text: string, password: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password.padEnd(32, '0').slice(0, 32)), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyMaterial, enc.encode(text));
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(ciphertext: string, password: string): Promise<string> {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password.padEnd(32, '0').slice(0, 32)), 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyMaterial, encrypted);
  return dec.decode(decrypted);
}

function generatePassword(length = 20): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => chars[v % chars.length]).join('');
}

const SECURITY_QUESTION_OPTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite movie?",
  "What was the make of your first car?",
  "What street did you grow up on?",
  "What is your favorite book?",
  "What was your childhood nickname?",
  "What is the name of your best friend from childhood?",
];

const CAPTCHA_CHALLENGES = [
  { question: "What is 7 + 5?", answer: "12" },
  { question: "What is 15 - 8?", answer: "7" },
  { question: "What is 3 × 4?", answer: "12" },
  { question: "What is 18 ÷ 3?", answer: "6" },
  { question: "What is 9 + 6?", answer: "15" },
  { question: "What is 20 - 13?", answer: "7" },
  { question: "What is 5 × 3?", answer: "15" },
  { question: "What is 24 ÷ 6?", answer: "4" },
];

type VaultPhase = 'loading' | 'list' | 'setup' | 'unlock' | 'dashboard';
type SetupStep = 'name' | 'password' | 'totp' | 'questions' | 'captcha' | 'masterkey';
type PasswordCategory = 'all' | 'logins' | 'cards' | 'servers' | 'wifi';

const CATEGORIES: { id: PasswordCategory; label: string; icon: any }[] = [
  { id: 'all', label: 'All Items', icon: KeyRound },
  { id: 'logins', label: 'Logins', icon: Globe },
  { id: 'cards', label: 'Cards', icon: CreditCard },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
];

export default function OfficePasswordVault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<VaultPhase>('loading');
  const [allVaults, setAllVaults] = useState<any[]>([]);
  const [activeVault, setActiveVault] = useState<any>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);

  // Setup state
  const [setupStep, setSetupStep] = useState<SetupStep>('name');
  const [vaultName, setVaultName] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [securityAnswers, setSecurityAnswers] = useState<{question: string; answer: string}[]>(
    Array(5).fill(null).map((_, i) => ({ question: SECURITY_QUESTION_OPTIONS[i], answer: '' }))
  );
  const [captchaIdx, setCaptchaIdx] = useState(0);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [masterKeyCopied, setMasterKeyCopied] = useState(false);
  const [masterKeyConfirmed, setMasterKeyConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockTOTP, setUnlockTOTP] = useState('');
  const [unlockQuestion, setUnlockQuestion] = useState<{question: string; idx: number} | null>(null);
  const [unlockAnswer, setUnlockAnswer] = useState('');
  const [unlockStep, setUnlockStep] = useState<'password' | 'totp' | 'question'>('password');
  const [unlocking, setUnlocking] = useState(false);
  const [showUnlockPw, setShowUnlockPw] = useState(false);

  // Dashboard state
  const [passwordItems, setPasswordItems] = useState<any[]>([]);
  const [decryptedItems, setDecryptedItems] = useState<Record<string, any>>({});
  const [loadingItems, setLoadingItems] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PasswordCategory>('all');
  const [revealedId, setRevealedId] = useState<string | null>(null);

  // Add dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState('logins');
  const [newHas2FA, setNewHas2FA] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Reveal Master Key
  const [revealKeyOpen, setRevealKeyOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealKeyCopied, setRevealKeyCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAllVaults();
  }, [user]);

  const loadAllVaults = async () => {
    const { data } = await (supabase.from('password_vault_configs').select('*') as any)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true });
    setAllVaults(data || []);
    setPhase('list');
  };

  const startNewVault = () => {
    setVaultName('');
    setSetupPassword('');
    setSetupPasswordConfirm('');
    setTotpSecret(generateTOTPSecret());
    setTotpCode('');
    setSecurityAnswers(Array(5).fill(null).map((_, i) => ({ question: SECURITY_QUESTION_OPTIONS[i], answer: '' })));
    setCaptchaIdx(Math.floor(Math.random() * CAPTCHA_CHALLENGES.length));
    setCaptchaAnswer('');
    setMasterKey('');
    setMasterKeyCopied(false);
    setMasterKeyConfirmed(false);
    setSetupStep('name');
    setPhase('setup');
  };

  const openVault = (vault: any) => {
    setActiveVault(vault);
    setSessionKey(null);
    setUnlockPassword('');
    setUnlockTOTP('');
    setUnlockAnswer('');
    setUnlockStep('password');
    setPhase('unlock');
  };

  // ─── SETUP FLOW ───
  const setupSteps: SetupStep[] = ['name', 'password', 'totp', 'questions', 'captcha', 'masterkey'];
  const stepIdx = setupSteps.indexOf(setupStep);

  const canProceedName = vaultName.trim().length >= 2;
  const canProceedPassword = setupPassword.length >= 12 && setupPassword === setupPasswordConfirm;
  const canProceedTOTP = totpCode.length === 6;
  const canProceedQuestions = securityAnswers.every(a => a.answer.trim().length >= 2);
  const canProceedCaptcha = captchaAnswer.trim() === CAPTCHA_CHALLENGES[captchaIdx].answer;

  const handleSetupNext = async () => {
    if (setupStep === 'name' && canProceedName) setSetupStep('password');
    else if (setupStep === 'password' && canProceedPassword) setSetupStep('totp');
    else if (setupStep === 'totp' && canProceedTOTP) setSetupStep('questions');
    else if (setupStep === 'questions' && canProceedQuestions) setSetupStep('captcha');
    else if (setupStep === 'captcha' && canProceedCaptcha) {
      const key = generateMasterKey();
      setMasterKey(key);
      setSetupStep('masterkey');
    }
  };

  const handleSetupBack = () => {
    const idx = setupSteps.indexOf(setupStep);
    if (idx > 0 && setupStep !== 'masterkey') setSetupStep(setupSteps[idx - 1]);
    else if (setupStep === 'name') setPhase('list');
  };

  const handleFinalizeSetup = async () => {
    if (!masterKeyConfirmed) {
      toast.error('You must confirm you have saved your master key');
      return;
    }
    setSaving(true);
    try {
      const salt = user!.id;
      const passwordHash = await deriveKey(setupPassword, salt);
      const masterKeyHash = await deriveKey(masterKey.replace(/-/g, ''), salt);
      const totpEncrypted = await encryptText(totpSecret, setupPassword);
      const masterKeyEncrypted = await encryptText(masterKey, setupPassword);
      const answersWithHash = [];
      for (const q of securityAnswers) {
        answersWithHash.push({ question: q.question, answerHash: await sha256(q.answer.toLowerCase().trim()) });
      }

      const { data, error } = await (supabase.from('password_vault_configs').insert({
        user_id: user!.id,
        vault_name: vaultName.trim(),
        password_hash: passwordHash,
        totp_secret_encrypted: totpEncrypted,
        security_questions: answersWithHash,
        master_key_hash: masterKeyHash,
        master_key_encrypted: masterKeyEncrypted,
      }) as any).select().single();

      if (error) throw error;
      toast.success('Password Vault created successfully!');
      setActiveVault(data);
      setSessionKey(setupPassword);
      setPhase('dashboard');
      loadVaultItems(data.id);
      loadAllVaults();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create vault');
    } finally {
      setSaving(false);
    }
  };

  // ─── UNLOCK FLOW ───
  const handleUnlockPassword = async () => {
    setUnlocking(true);
    try {
      const salt = user!.id;
      const hash = await deriveKey(unlockPassword, salt);
      if (hash !== activeVault.password_hash) {
        toast.error('Incorrect vault password');
        await (supabase.from('password_vault_configs').update({
          failed_attempts: (activeVault.failed_attempts || 0) + 1,
          last_failed_at: new Date().toISOString()
        }) as any).eq('id', activeVault.id);
        return;
      }
      setUnlockStep('totp');
    } catch {
      toast.error('Verification failed');
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockTOTP = async () => {
    setUnlocking(true);
    try {
      if (unlockTOTP.length !== 6 || !/^\d{6}$/.test(unlockTOTP)) {
        toast.error('Enter a valid 6-digit code');
        return;
      }
      const questions = activeVault.security_questions as {question: string; answerHash: string}[];
      const idx = Math.floor(Math.random() * questions.length);
      setUnlockQuestion({ question: questions[idx].question, idx });
      setUnlockStep('question');
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockQuestion = async () => {
    setUnlocking(true);
    try {
      const questions = activeVault.security_questions as {question: string; answerHash: string}[];
      const expected = questions[unlockQuestion!.idx].answerHash;
      const provided = await sha256(unlockAnswer.toLowerCase().trim());
      if (provided !== expected) {
        toast.error('Incorrect security answer');
        return;
      }
      setSessionKey(unlockPassword);
      setPhase('dashboard');
      loadVaultItems(activeVault.id);
      await (supabase.from('password_vault_configs').update({ failed_attempts: 0 }) as any).eq('id', activeVault.id);
      toast.success('Password Vault unlocked');
    } catch {
      toast.error('Verification failed');
    } finally {
      setUnlocking(false);
    }
  };

  // ─── DASHBOARD ───
  const loadVaultItems = async (vaultId: string) => {
    setLoadingItems(true);
    const { data } = await (supabase.from('password_vault_items').select('*') as any)
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });
    setPasswordItems(data || []);
    setLoadingItems(false);
  };

  // Decrypt items for display
  useEffect(() => {
    if (!sessionKey || passwordItems.length === 0) return;
    (async () => {
      const items: Record<string, any> = {};
      for (const item of passwordItems) {
        try {
          const title = item.title_encrypted ? await decryptText(item.title_encrypted, sessionKey) : '';
          const username = item.username_encrypted ? await decryptText(item.username_encrypted, sessionKey) : '';
          const url = item.url_encrypted ? await decryptText(item.url_encrypted, sessionKey) : '';
          items[item.id] = { title, username, url };
        } catch {
          items[item.id] = { title: '***', username: '***', url: '' };
        }
      }
      setDecryptedItems(items);
    })();
  }, [sessionKey, passwordItems]);

  const handleAddItem = async () => {
    if (!sessionKey || !activeVault || !newTitle.trim()) return;
    setAddingItem(true);
    try {
      const titleEnc = await encryptText(newTitle, sessionKey);
      const usernameEnc = newUsername ? await encryptText(newUsername, sessionKey) : null;
      const passwordEnc = newPassword ? await encryptText(newPassword, sessionKey) : null;
      const urlEnc = newUrl ? await encryptText(newUrl, sessionKey) : null;
      const notesEnc = newNotes ? await encryptText(newNotes, sessionKey) : null;

      const { error } = await (supabase.from('password_vault_items').insert({
        user_id: user!.id,
        vault_id: activeVault.id,
        title_encrypted: titleEnc,
        username_encrypted: usernameEnc,
        password_encrypted: passwordEnc,
        url_encrypted: urlEnc,
        notes_encrypted: notesEnc,
        category: newCategory,
        has_2fa: newHas2FA,
      }) as any);
      if (error) throw error;
      toast.success('Password saved to vault');
      setAddDialogOpen(false);
      setNewTitle(''); setNewUsername(''); setNewPassword(''); setNewUrl(''); setNewNotes(''); setNewCategory('logins'); setNewHas2FA(false);
      loadVaultItems(activeVault.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const { error } = await (supabase.from('password_vault_items').delete() as any).eq('id', itemId);
    if (!error) {
      toast.success('Item deleted');
      loadVaultItems(activeVault.id);
    }
  };

  const handleToggleStar = async (item: any) => {
    await (supabase.from('password_vault_items').update({ starred: !item.starred }) as any).eq('id', item.id);
    loadVaultItems(activeVault.id);
  };

  const copyDecryptedPassword = async (item: any) => {
    if (!sessionKey || !item.password_encrypted) return;
    try {
      const pw = await decryptText(item.password_encrypted, sessionKey);
      await navigator.clipboard.writeText(pw);
      toast.success('Password copied');
    } catch {
      toast.error('Failed to decrypt');
    }
  };

  const revealPassword = async (item: any) => {
    if (revealedId === item.id) {
      setRevealedId(null);
      return;
    }
    setRevealedId(item.id);
    // Auto-hide after 10 seconds
    setTimeout(() => setRevealedId(null), 10000);
  };

  const handleRevealKey = async () => {
    if (!sessionKey || !activeVault?.master_key_encrypted) return;
    try {
      const key = await decryptText(activeVault.master_key_encrypted, sessionKey);
      setRevealedKey(key);
      setRevealKeyCopied(false);
      setRevealKeyOpen(true);
    } catch {
      toast.error('Failed to reveal master key');
    }
  };

  const lockVault = () => {
    setSessionKey(null);
    setActiveVault(null);
    setPasswordItems([]);
    setDecryptedItems({});
    setRevealedId(null);
    setPhase('list');
  };

  const filteredItems = passwordItems.filter(item => {
    const dec = decryptedItems[item.id];
    if (!dec) return true;
    const matchSearch = !search || dec.title?.toLowerCase().includes(search.toLowerCase()) || dec.username?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const stats = {
    total: passwordItems.length,
    with2FA: passwordItems.filter(i => i.has_2fa).length,
    starred: passwordItems.filter(i => i.starred).length,
  };

  // ─── RENDER ───

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── VAULT LIST ───
  if (phase === 'list') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
            <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            <KeyRound className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">Password Vault</span>
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-500/10">
            <Lock className="h-2.5 w-2.5 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500">AES-256-GCM</span>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Password Vaults</h2>
                <p className="text-xs text-muted-foreground">AES-GCM encrypted · Google Authenticator · 16-digit Master Key</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground">{allVaults.length} vault{allVaults.length !== 1 ? 's' : ''}</p>
              <Button onClick={startNewVault} size="sm" className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" /> Create Vault
              </Button>
            </div>

            {allVaults.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                  <FolderLock className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-sm">No password vaults yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm text-center">Create your first vault with AES-GCM encryption, Google Authenticator, security questions, and an unrecoverable 16-digit Master Key.</p>
                  <Button onClick={startNewVault} variant="outline" size="sm" className="gap-1 mt-2">
                    <Plus className="w-4 h-4" /> Create Your First Vault
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {allVaults.map(vault => (
                  <Card key={vault.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openVault(vault)}>
                    <CardContent className="flex items-center gap-4 py-4 px-5">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <FolderLock className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{vault.vault_name || 'Password Vault'}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(vault.created_at).toLocaleDateString()}
                          {vault.failed_attempts > 0 && (
                            <span className="text-destructive ml-2">· {vault.failed_attempts} failed attempt(s)</span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Lock className="w-3 h-3" /> Locked
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── SETUP WIZARD ───
  if (phase === 'setup') {
    const stepLabels = ['Name', 'Password', 'Authenticator', 'Questions', 'Verify', 'Master Key'];
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => setPhase('list')}>
            <ArrowLeft className="h-3.5 w-3.5" /> All Vaults
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <span className="text-sm font-bold">Create Password Vault</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full">
            {/* Progress */}
            <div className="flex items-center gap-1 mb-6">
              {stepLabels.map((label, i) => (
                <div key={label} className="flex items-center gap-1 flex-1">
                  <div className={cn("h-2 rounded-full flex-1 transition-colors", i <= stepIdx ? 'bg-primary' : 'bg-muted')} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mb-6">
              Step {stepIdx + 1} of {stepLabels.length}: {stepLabels[stepIdx]}
            </p>

            <AnimatePresence mode="wait">
              <motion.div key={setupStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <Card className="border-primary/20">
                  <CardContent className="pt-6 space-y-5">

                    {setupStep === 'name' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10"><FolderLock className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">Name Your Vault</h3>
                            <p className="text-xs text-muted-foreground">Give your password vault a descriptive name.</p>
                          </div>
                        </div>
                        <div>
                          <Label>Vault Name</Label>
                          <Input value={vaultName} onChange={e => setVaultName(e.target.value)} placeholder="e.g. Work Passwords, Personal Logins" />
                          {vaultName.length > 0 && vaultName.trim().length < 2 && (
                            <p className="text-xs text-destructive mt-1">Name must be at least 2 characters</p>
                          )}
                        </div>
                      </>
                    )}

                    {setupStep === 'password' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10"><Lock className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">Create Vault Password</h3>
                            <p className="text-xs text-muted-foreground">Minimum 12 characters. Separate from your account password.</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label>Vault Password</Label>
                            <div className="relative">
                              <Input type={showPassword ? 'text' : 'password'} value={setupPassword} onChange={e => setSetupPassword(e.target.value)} placeholder="Enter vault password (min 12 chars)" className="pr-10" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {setupPassword.length > 0 && setupPassword.length < 12 && (
                              <p className="text-xs text-destructive mt-1">Password must be at least 12 characters</p>
                            )}
                          </div>
                          <div>
                            <Label>Confirm Password</Label>
                            <Input type="password" value={setupPasswordConfirm} onChange={e => setSetupPasswordConfirm(e.target.value)} placeholder="Re-enter vault password" />
                            {setupPasswordConfirm && setupPassword !== setupPasswordConfirm && (
                              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {setupStep === 'totp' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10"><QrCode className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">Link Google Authenticator</h3>
                            <p className="text-xs text-muted-foreground">Scan the QR code or enter the key manually.</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-xl border">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateTOTPUri(totpSecret, user?.email || '', vaultName))}`}
                              alt="QR Code"
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Manual entry key:</p>
                            <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded select-all">{totpSecret}</code>
                          </div>
                          <div className="w-full max-w-xs">
                            <Label>Enter 6-digit code from app</Label>
                            <Input value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.3em] font-mono" maxLength={6} />
                          </div>
                        </div>
                      </>
                    )}

                    {setupStep === 'questions' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10"><Fingerprint className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">Security Questions</h3>
                            <p className="text-xs text-muted-foreground">Answer 5 questions used to verify your identity.</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {securityAnswers.map((qa, i) => (
                            <div key={i} className="space-y-1">
                              <Label className="text-xs">{i + 1}. {qa.question}</Label>
                              <select
                                value={qa.question}
                                onChange={e => {
                                  const updated = [...securityAnswers];
                                  updated[i] = { ...updated[i], question: e.target.value };
                                  setSecurityAnswers(updated);
                                }}
                                className="w-full text-xs bg-muted/50 border border-border rounded-md px-2 py-1 mb-1"
                              >
                                {SECURITY_QUESTION_OPTIONS.map(q => (
                                  <option key={q} value={q} disabled={securityAnswers.some((a, j) => j !== i && a.question === q)}>{q}</option>
                                ))}
                              </select>
                              <Input
                                value={qa.answer}
                                onChange={e => {
                                  const updated = [...securityAnswers];
                                  updated[i] = { ...updated[i], answer: e.target.value };
                                  setSecurityAnswers(updated);
                                }}
                                placeholder="Your answer..."
                                className="text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {setupStep === 'captcha' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                          <div>
                            <h3 className="font-semibold">Human Verification</h3>
                            <p className="text-xs text-muted-foreground">Solve this challenge to prove you're not a bot.</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <div className="bg-muted/50 border border-border rounded-xl p-6 text-center min-w-[250px]">
                            <p className="text-lg font-semibold mb-4">{CAPTCHA_CHALLENGES[captchaIdx].question}</p>
                            <Input value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} placeholder="Your answer" className="text-center text-lg max-w-[150px] mx-auto" />
                          </div>
                          {captchaAnswer && !canProceedCaptcha && (
                            <p className="text-xs text-destructive">Incorrect answer, try again</p>
                          )}
                          {canProceedCaptcha && (
                            <div className="flex items-center gap-2 text-primary">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {setupStep === 'masterkey' && (
                      <>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-destructive/10"><Key className="w-5 h-5 text-destructive" /></div>
                          <div>
                            <h3 className="font-semibold">Your Master Key</h3>
                            <p className="text-xs text-destructive font-medium">Save this key — it is UNRECOVERABLE. Losing it means permanent loss of access.</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-4 py-4">
                          <div className="bg-muted/50 border-2 border-destructive/30 rounded-xl p-6 text-center">
                            <code className="text-xl font-mono font-bold tracking-[0.15em] select-all text-foreground">{masterKey}</code>
                          </div>
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                            navigator.clipboard.writeText(masterKey);
                            setMasterKeyCopied(true);
                            toast.success('Master Key copied');
                          }}>
                            {masterKeyCopied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                            {masterKeyCopied ? 'Copied' : 'Copy Master Key'}
                          </Button>
                          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 max-w-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                              <p className="text-xs text-destructive">Write this key down and store it in a safe place. If you lose this key, you will <strong>permanently lose access</strong> to this vault. It cannot be recovered.</p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input type="checkbox" checked={masterKeyConfirmed} onChange={e => setMasterKeyConfirmed(e.target.checked)} className="rounded" />
                            <span className="text-xs text-muted-foreground">I have saved my Master Key in a secure location</span>
                          </label>
                        </div>
                      </>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <Button variant="ghost" size="sm" onClick={handleSetupBack} disabled={setupStep === 'masterkey'}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      {setupStep === 'masterkey' ? (
                        <Button size="sm" onClick={handleFinalizeSetup} disabled={saving || !masterKeyConfirmed} className="gap-1.5">
                          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                          {saving ? 'Creating...' : 'Create Vault'}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={handleSetupNext} disabled={
                          (setupStep === 'name' && !canProceedName) ||
                          (setupStep === 'password' && !canProceedPassword) ||
                          (setupStep === 'totp' && !canProceedTOTP) ||
                          (setupStep === 'questions' && !canProceedQuestions) ||
                          (setupStep === 'captcha' && !canProceedCaptcha)
                        }>
                          Next <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  // ─── UNLOCK ───
  if (phase === 'unlock') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => setPhase('list')}>
            <ArrowLeft className="h-3.5 w-3.5" /> All Vaults
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <span className="text-sm font-bold">Unlock: {activeVault?.vault_name}</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-primary/20">
            <CardContent className="pt-6 space-y-5">
              {unlockStep === 'password' && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10"><Lock className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold">Step 1: Vault Password</h3>
                      <p className="text-xs text-muted-foreground">Enter your vault password to begin unlock.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Input type={showUnlockPw ? 'text' : 'password'} value={unlockPassword} onChange={e => setUnlockPassword(e.target.value)} placeholder="Vault password" className="pr-10"
                      onKeyDown={e => e.key === 'Enter' && unlockPassword && handleUnlockPassword()} />
                    <button type="button" onClick={() => setShowUnlockPw(!showUnlockPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showUnlockPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button className="w-full" onClick={handleUnlockPassword} disabled={unlocking || !unlockPassword}>
                    {unlocking ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify Password
                  </Button>
                </>
              )}

              {unlockStep === 'totp' && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10"><QrCode className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold">Step 2: Authenticator Code</h3>
                      <p className="text-xs text-muted-foreground">Enter 6-digit code from Google Authenticator.</p>
                    </div>
                  </div>
                  <Input value={unlockTOTP} onChange={e => setUnlockTOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.3em] font-mono" maxLength={6}
                    onKeyDown={e => e.key === 'Enter' && unlockTOTP.length === 6 && handleUnlockTOTP()} />
                  <Button className="w-full" onClick={handleUnlockTOTP} disabled={unlocking || unlockTOTP.length !== 6}>
                    {unlocking ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Verify Code
                  </Button>
                </>
              )}

              {unlockStep === 'question' && unlockQuestion && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10"><Fingerprint className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-semibold">Step 3: Security Question</h3>
                      <p className="text-xs text-muted-foreground">Answer this question to complete unlock.</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{unlockQuestion.question}</p>
                  <Input value={unlockAnswer} onChange={e => setUnlockAnswer(e.target.value)} placeholder="Your answer"
                    onKeyDown={e => e.key === 'Enter' && unlockAnswer && handleUnlockQuestion()} />
                  <Button className="w-full" onClick={handleUnlockQuestion} disabled={unlocking || !unlockAnswer}>
                    {unlocking ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Unlock Vault
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={lockVault}>
          <ArrowLeft className="h-3.5 w-3.5" /> Lock & Exit
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <KeyRound className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">{activeVault?.vault_name}</span>
        <div className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-md bg-emerald-500/10">
          <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
          <span className="text-[9px] font-bold text-emerald-500">Unlocked · AES-GCM</span>
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 w-8 sm:w-auto sm:gap-1.5 rounded-xl text-xs" onClick={handleRevealKey}>
          <Key className="h-3.5 w-3.5" /><span className="hidden sm:inline">Master Key</span>
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs bg-gradient-to-r from-slate-700 to-slate-900 text-white border-0 shadow-sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add Password
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex w-52 border-r border-border/20 bg-card/20 shrink-0 flex-col">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vault…" className="h-7 pl-7 text-[10px] bg-card/50 border-border/20 rounded-lg" />
            </div>
          </div>

          <div className="flex-1 px-2 space-y-0.5 overflow-auto">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? passwordItems.length : passwordItems.filter(i => i.category === cat.id).length;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={cn("w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all",
                    activeCategory === cat.id ? "bg-accent/60 shadow-sm" : "hover:bg-accent/30"
                  )}>
                  <cat.icon className={cn("h-3.5 w-3.5", activeCategory === cat.id ? "text-foreground" : "text-muted-foreground")} />
                  <span className={cn("text-[11px] font-medium flex-1", activeCategory === cat.id ? "text-foreground" : "text-muted-foreground")}>{cat.label}</span>
                  <span className="text-[9px] text-muted-foreground/50 tabular-nums">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Stats */}
          <div className="p-3 border-t border-border/15">
            <div className="rounded-xl bg-card/60 border border-border/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-foreground">Vault Status</span>
              </div>
              <div className="text-[24px] font-bold text-foreground">{stats.total}</div>
              <p className="text-[9px] text-muted-foreground">stored passwords</p>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[9px] text-emerald-500 font-medium">{stats.with2FA} 2FA</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 text-amber-500" />
                  <span className="text-[9px] text-amber-500 font-medium">{stats.starred} starred</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {/* Mobile: search + category pills */}
          <div className="flex flex-col gap-2 mb-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vault…" className="h-9 pl-8 text-sm bg-card/50 border-border/20 rounded-xl" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap shrink-0 transition-all",
                    activeCategory === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground/60 hover:text-foreground")}>
                  <cat.icon className="h-3 w-3" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          {loadingItems ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <KeyRound className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No passwords stored yet</p>
              <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" /> Add Your First Password
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, i) => {
                const dec = decryptedItems[item.id] || {};
                const catConfig = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[1];
                const CatIcon = catConfig.icon;
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="group flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                      <CatIcon className="h-4.5 w-4.5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-foreground truncate">{dec.title || '***'}</span>
                        {item.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                        {item.has_2fa && <Shield className="h-3 w-3 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/60">{dec.username || '***'}</span>
                        {dec.url && (
                          <>
                            <span className="text-[9px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/40">{dec.url}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Password field */}
                    <div className="hidden sm:flex items-center gap-1.5 bg-background/60 border border-border/20 rounded-lg px-3 py-1.5">
                      <span className="text-[11px] font-mono text-muted-foreground w-24 text-center">
                        {revealedId === item.id ? '••visible••' : '••••••••••••'}
                      </span>
                      <button onClick={() => revealPassword(item)} className="h-5 w-5 rounded flex items-center justify-center hover:bg-accent/40">
                        {revealedId === item.id ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                      </button>
                      <button onClick={() => copyDecryptedPassword(item)} className="h-5 w-5 rounded flex items-center justify-center hover:bg-accent/40">
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                    {/* Mobile copy-only button */}
                    <button onClick={() => copyDecryptedPassword(item)} className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center bg-background/60 border border-border/20 hover:bg-accent/40 shrink-0">
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>

                    <button onClick={() => handleToggleStar(item)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-accent/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {item.starred ? <StarOff className="h-3.5 w-3.5 text-amber-500" /> : <Star className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>

                    <button onClick={() => handleDeleteItem(item.id)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-destructive/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Password Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Google, GitHub, Netflix" />
            </div>
            <div>
              <Label>Username / Email</Label>
              <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="user@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" className="pr-10" />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setNewPassword(generatePassword()); setShowNewPw(true); }} className="shrink-0 text-xs">
                  Generate
                </Button>
              </div>
            </div>
            <div>
              <Label>URL</Label>
              <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Category</Label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full text-sm bg-background border border-input rounded-md px-3 py-2">
                <option value="logins">Logins</option>
                <option value="cards">Cards</option>
                <option value="servers">Servers</option>
                <option value="wifi">Wi-Fi</option>
              </select>
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional notes..." />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={newHas2FA} onChange={e => setNewHas2FA(e.target.checked)} className="rounded" />
              <span className="text-sm text-muted-foreground">This account has 2FA enabled</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={addingItem || !newTitle.trim()}>
              {addingItem ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reveal Master Key Dialog */}
      <Dialog open={revealKeyOpen} onOpenChange={setRevealKeyOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-destructive" /> Master Key
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-muted/50 border-2 border-destructive/30 rounded-xl p-4 text-center w-full">
              <code className="text-lg font-mono font-bold tracking-[0.1em] select-all text-foreground">{revealedKey}</code>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              if (revealedKey) {
                navigator.clipboard.writeText(revealedKey);
                setRevealKeyCopied(true);
                toast.success('Master Key copied');
              }
            }}>
              {revealKeyCopied ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              {revealKeyCopied ? 'Copied' : 'Copy'}
            </Button>
            <p className="text-xs text-destructive text-center">Keep this key safe. If lost, vault access is permanently gone.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
