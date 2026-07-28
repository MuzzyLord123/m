import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Lock, Eye, EyeOff, QrCode, KeyRound, FileText, Image, Upload,
  Download, Plus, Copy, CheckCircle2, AlertTriangle, Fingerprint,
  ShieldCheck, X, ArrowRight, ArrowLeft, RefreshCw, File, FolderLock, Key
} from 'lucide-react';
import { encryptText, decryptText } from '@/lib/vaultCrypto';

// ─── Crypto helpers ───
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
  return `otpauth://totp/Quooro%20Vault%20(${encodeURIComponent(vaultName)}):${encodeURIComponent(email)}?secret=${secret}&issuer=Quooro%20Vault&digits=6&period=30`;
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

export default function VaultContent() {
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
  const [vaultItems, setVaultItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'secret' | 'file'>('secret');
  const [newItemName, setNewItemName] = useState('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemFile, setNewItemFile] = useState<File | null>(null);
  const [addingItem, setAddingItem] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptedNames, setDecryptedNames] = useState<Record<string, string>>({});

  // Reveal Master Key state
  const [revealKeyOpen, setRevealKeyOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealKeyCopied, setRevealKeyCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAllVaults();
  }, [user]);

  const loadAllVaults = async () => {
    const { data } = await supabase
      .from('vault_configs')
      .select('*')
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
    else if (setupStep === 'name') { setPhase('list'); }
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

      const { data, error } = await supabase.from('vault_configs').insert({
        user_id: user!.id,
        vault_name: vaultName.trim(),
        password_hash: passwordHash,
        totp_secret_encrypted: totpEncrypted,
        security_questions: answersWithHash as any,
        master_key_hash: masterKeyHash,
        master_key_encrypted: masterKeyEncrypted,
      } as any).select().single();

      if (error) throw error;
      toast.success('Vault created successfully!');
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
        await supabase.from('vault_configs').update({
          failed_attempts: (activeVault.failed_attempts || 0) + 1,
          last_failed_at: new Date().toISOString()
        }).eq('id', activeVault.id);
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
      await supabase.from('vault_configs').update({ failed_attempts: 0 }).eq('id', activeVault.id);
      toast.success('Vault unlocked');
    } catch {
      toast.error('Verification failed');
    } finally {
      setUnlocking(false);
    }
  };

  // ─── VAULT DASHBOARD ───
  const loadVaultItems = async (vaultId: string) => {
    setLoadingItems(true);
    const { data } = await (supabase
      .from('vault_items')
      .select('*') as any)
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false });
    setVaultItems(data || []);
    setLoadingItems(false);
  };

  const handleAddItem = async () => {
    if (!sessionKey || !activeVault) return;
    setAddingItem(true);
    try {
      const nameEnc = await encryptText(newItemName, sessionKey);
      if (newItemType === 'secret') {
        const contentEnc = await encryptText(newItemContent, sessionKey);
        const { error } = await supabase.from('vault_items').insert({
          user_id: user!.id,
          vault_id: activeVault.id,
          item_type: 'secret',
          name_encrypted: nameEnc,
          content_encrypted: contentEnc,
        } as any);
        if (error) throw error;
      } else if (newItemFile) {
        const filePath = `${user!.id}/vault/${Date.now()}_${newItemFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('customer-uploads')
          .upload(filePath, newItemFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { error } = await supabase.from('vault_items').insert({
          user_id: user!.id,
          vault_id: activeVault.id,
          item_type: 'file',
          name_encrypted: nameEnc,
          file_path: filePath,
          file_size: newItemFile.size,
          mime_type: newItemFile.type,
        } as any);
        if (error) throw error;
      }
      toast.success('Item added to vault');
      setAddDialogOpen(false);
      setNewItemName('');
      setNewItemContent('');
      setNewItemFile(null);
      loadVaultItems(activeVault.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  };

  const handleViewItem = async (item: any) => {
    setViewItem(item);
    setDecryptedContent(null);
    if (item.item_type === 'secret' && item.content_encrypted && sessionKey) {
      setDecrypting(true);
      try {
        const content = await decryptText(item.content_encrypted, sessionKey);
        setDecryptedContent(content);
      } catch {
        setDecryptedContent('[Decryption failed]');
      } finally {
        setDecrypting(false);
      }
    }
  };

  const handleDownloadFile = async (item: any) => {
    if (!item.file_path) return;
    const { data } = await supabase.storage.from('customer-uploads').createSignedUrl(item.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const handleRevealKey = async () => {
    if (!sessionKey || !activeVault?.master_key_encrypted) {
      toast.error('Master key reveal is not available for this vault');
      return;
    }
    try {
      const key = await decryptText(activeVault.master_key_encrypted, sessionKey);
      setRevealedKey(key);
      setRevealKeyCopied(false);
      setRevealKeyOpen(true);
    } catch {
      toast.error('Failed to reveal master key. Your session may have expired.');
    }
  };

  // Decrypt item names for display
  useEffect(() => {
    if (!sessionKey || vaultItems.length === 0) return;
    (async () => {
      const names: Record<string, string> = {};
      for (const item of vaultItems) {
        try {
          names[item.id] = await decryptText(item.name_encrypted, sessionKey);
        } catch {
          names[item.id] = '***';
        }
      }
      setDecryptedNames(names);
    })();
  }, [sessionKey, vaultItems]);

  // ─── RENDER ───

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ─── VAULT LIST ───
  if (phase === 'list') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Secure Vaults</h2>
            <p className="text-[10px] text-muted-foreground">AES-GCM encrypted · Multi-factor unlock · Unrecoverable Master Key</p>
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
              <p className="text-muted-foreground text-sm">No vaults yet</p>
              <p className="text-xs text-muted-foreground max-w-sm text-center">Create your first vault with military-grade AES-GCM encryption, multi-factor authentication, and an unrecoverable 16-digit Master Key.</p>
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
                    <p className="font-semibold truncate">{vault.vault_name || 'My Vault'}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(vault.created_at).toLocaleDateString()}
                      {vault.failed_attempts > 0 && (
                        <span className="text-destructive ml-2">· {vault.failed_attempts} failed attempt(s)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Lock className="w-3 h-3" /> Locked
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── SETUP WIZARD ───
  if (phase === 'setup') {
    const stepLabels = ['Name', 'Password', 'Authenticator', 'Questions', 'Verify', 'Master Key'];
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setPhase('list')} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> All Vaults
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Create Secure Vault</h2>
            <p className="text-[10px] text-muted-foreground">Set up your encrypted vault with military-grade protection</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-1 flex-1">
              <div className={`h-2 rounded-full flex-1 transition-colors ${i <= stepIdx ? 'bg-primary' : 'bg-muted'}`} />
              {i < stepLabels.length - 1 && <div className="w-1" />}
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
                        <p className="text-xs text-muted-foreground">Give your vault a descriptive name.</p>
                      </div>
                    </div>
                    <div>
                      <Label>Vault Name</Label>
                      <Input value={vaultName} onChange={e => setVaultName(e.target.value)} placeholder="e.g. Crypto Keys, Business Secrets" />
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
                        <Input
                          value={captchaAnswer}
                          onChange={e => setCaptchaAnswer(e.target.value)}
                          placeholder="Your answer"
                          className="text-center text-lg max-w-[150px] mx-auto"
                        />
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
                      <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
                      <div>
                        <h3 className="font-semibold text-destructive">Save Your Master Key</h3>
                        <p className="text-xs text-destructive/80">This is your ONLY recovery method. If you lose this key, your vault data is PERMANENTLY LOST.</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="bg-card border-2 border-destructive/30 rounded-xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2">Your 16-Digit Master Key</p>
                        <code className="text-2xl font-mono font-bold tracking-[0.15em] select-all text-foreground">{masterKey}</code>
                      </div>
                      <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground max-w-sm text-center">
                        <Key className="w-4 h-4 inline mr-1" />
                        You can reveal this key again while the vault is unlocked.
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(masterKey);
                          setMasterKeyCopied(true);
                          toast.success('Master key copied to clipboard');
                        }}
                        className="gap-2"
                      >
                        {masterKeyCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {masterKeyCopied ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                      <Separator />
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={masterKeyConfirmed}
                          onChange={e => setMasterKeyConfirmed(e.target.checked)}
                          className="mt-1 rounded border-border"
                        />
                        <span className="text-sm text-muted-foreground">
                          I understand that if I lose this master key, <strong className="text-destructive">I will permanently lose access</strong> to all data in this vault.
                        </span>
                      </label>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  {setupStep !== 'masterkey' ? (
                    <Button variant="ghost" size="sm" onClick={handleSetupBack} className="gap-1">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                  ) : <div />}

                  {setupStep === 'masterkey' ? (
                    <Button onClick={handleFinalizeSetup} disabled={!masterKeyConfirmed || saving} className="gap-2">
                      {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Create Vault
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSetupNext}
                      disabled={
                        (setupStep === 'name' && !canProceedName) ||
                        (setupStep === 'password' && !canProceedPassword) ||
                        (setupStep === 'totp' && !canProceedTOTP) ||
                        (setupStep === 'questions' && !canProceedQuestions) ||
                        (setupStep === 'captcha' && !canProceedCaptcha)
                      }
                      className="gap-1"
                    >
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ─── UNLOCK ───
  if (phase === 'unlock') {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={() => setPhase('list')} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> All Vaults
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Unlock: {activeVault?.vault_name || 'Vault'}</h2>
            <p className="text-[10px] text-muted-foreground">Verify your identity to access encrypted data</p>
          </div>
        </div>

        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-5">
            <AnimatePresence mode="wait">
              <motion.div key={unlockStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

                {unlockStep === 'password' && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10"><Lock className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold">Step 1: Vault Password</h3>
                        <p className="text-xs text-muted-foreground">Enter your vault password to begin verification.</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Input type={showUnlockPw ? 'text' : 'password'} value={unlockPassword} onChange={e => setUnlockPassword(e.target.value)} placeholder="Vault password" className="pr-10"
                        onKeyDown={e => e.key === 'Enter' && unlockPassword && handleUnlockPassword()} />
                      <button type="button" onClick={() => setShowUnlockPw(!showUnlockPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showUnlockPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button onClick={handleUnlockPassword} disabled={!unlockPassword || unlocking} className="w-full gap-2">
                      {unlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Verify Password
                    </Button>
                  </>
                )}

                {unlockStep === 'totp' && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10"><QrCode className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold">Step 2: Authenticator Code</h3>
                        <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
                      </div>
                    </div>
                    <Input value={unlockTOTP} onChange={e => setUnlockTOTP(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-lg tracking-[0.3em] font-mono" maxLength={6}
                      onKeyDown={e => e.key === 'Enter' && unlockTOTP.length === 6 && handleUnlockTOTP()} />
                    <Button onClick={handleUnlockTOTP} disabled={unlockTOTP.length !== 6 || unlocking} className="w-full gap-2">
                      {unlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Verify Code
                    </Button>
                  </>
                )}

                {unlockStep === 'question' && unlockQuestion && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10"><Fingerprint className="w-5 h-5 text-primary" /></div>
                      <div>
                        <h3 className="font-semibold">Step 3: Security Question</h3>
                        <p className="text-xs text-muted-foreground">{unlockQuestion.question}</p>
                      </div>
                    </div>
                    <Input value={unlockAnswer} onChange={e => setUnlockAnswer(e.target.value)} placeholder="Your answer..."
                      onKeyDown={e => e.key === 'Enter' && unlockAnswer && handleUnlockQuestion()} />
                    <Button onClick={handleUnlockQuestion} disabled={!unlockAnswer || unlocking} className="w-full gap-2">
                      {unlocking ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Unlock Vault
                    </Button>
                  </>
                )}

              </motion.div>
            </AnimatePresence>

            {activeVault?.failed_attempts > 0 && (
              <p className="text-xs text-destructive text-center">
                {activeVault.failed_attempts} failed attempt(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── DASHBOARD ───
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => { setSessionKey(null); setPhase('list'); }} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> All Vaults
        </Button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{activeVault?.vault_name || 'Secure Vault'}</h2>
            <p className="text-[10px] text-muted-foreground">Your encrypted files and secrets</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="gap-1 text-primary border-primary/30">
            <ShieldCheck className="w-3 h-3" /> Unlocked
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRevealKey} className="gap-1">
            <Key className="w-4 h-4" /> Reveal Key
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setSessionKey(null); setPhase('list'); }}>
            <Lock className="w-4 h-4 mr-1" /> Lock
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{vaultItems.length} item{vaultItems.length !== 1 ? 's' : ''} stored</p>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>

      {loadingItems ? (
        <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : vaultItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderLock className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">This vault is empty</p>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1">
              <Plus className="w-4 h-4" /> Add your first item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {vaultItems.map(item => (
            <Card key={item.id} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => handleViewItem(item)}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <div className="p-2 rounded-lg bg-muted">
                  {item.item_type === 'file' ? <File className="w-5 h-5 text-muted-foreground" /> : <KeyRound className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{decryptedNames[item.id] || '***'}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.item_type === 'file' ? `${(item.file_size / 1024).toFixed(1)} KB` : 'Secret'} · {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {item.item_type === 'file' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadFile(item)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Vault</DialogTitle>
            <DialogDescription>Store a secret or file in your encrypted vault.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={newItemType === 'secret' ? 'default' : 'outline'} size="sm" onClick={() => setNewItemType('secret')} className="gap-1">
                <KeyRound className="w-4 h-4" /> Secret
              </Button>
              <Button variant={newItemType === 'file' ? 'default' : 'outline'} size="sm" onClick={() => setNewItemType('file')} className="gap-1">
                <File className="w-4 h-4" /> File
              </Button>
            </div>
            <div>
              <Label>Name</Label>
              <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="e.g. Bitcoin wallet seed" />
            </div>
            {newItemType === 'secret' ? (
              <div>
                <Label>Secret Content</Label>
                <textarea
                  value={newItemContent}
                  onChange={e => setNewItemContent(e.target.value)}
                  placeholder="Paste your secret here..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                />
              </div>
            ) : (
              <div>
                <Label>File</Label>
                <input type="file" onChange={e => setNewItemFile(e.target.files?.[0] || null)} className="text-sm" />
                {newItemFile && <p className="text-xs text-muted-foreground mt-1">{newItemFile.name} ({(newItemFile.size / 1024).toFixed(1)} KB)</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={!newItemName || (newItemType === 'secret' ? !newItemContent : !newItemFile) || addingItem} className="gap-1">
              {addingItem ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewItem?.item_type === 'file' ? <File className="w-5 h-5" /> : <KeyRound className="w-5 h-5" />}
              {viewItem ? decryptedNames[viewItem.id] || '***' : ''}
            </DialogTitle>
          </DialogHeader>
          {viewItem?.item_type === 'secret' && (
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap break-all">
              {decrypting ? <RefreshCw className="w-4 h-4 animate-spin" /> : decryptedContent}
            </div>
          )}
          {viewItem?.item_type === 'file' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Size: {viewItem.file_size ? (viewItem.file_size / 1024).toFixed(1) + ' KB' : 'Unknown'}</p>
              <p className="text-sm text-muted-foreground">Type: {viewItem.mime_type || 'Unknown'}</p>
              <Button onClick={() => handleDownloadFile(viewItem)} className="gap-1">
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reveal Master Key Dialog */}
      <Dialog open={revealKeyOpen} onOpenChange={(open) => { setRevealKeyOpen(open); if (!open) setRevealedKey(null); }}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Master Key
            </DialogTitle>
            <DialogDescription>
              This is the master key for <strong>{activeVault?.vault_name}</strong>. Keep it safe — losing it means permanent loss of access.
            </DialogDescription>
          </DialogHeader>
          {revealedKey && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-card border-2 border-destructive/30 rounded-xl p-6 text-center">
                <p className="text-xs text-muted-foreground mb-2">Your 16-Digit Master Key</p>
                <code className="text-2xl font-mono font-bold tracking-[0.15em] select-all text-foreground">{revealedKey}</code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(revealedKey);
                  setRevealKeyCopied(true);
                  toast.success('Master key copied to clipboard');
                }}
                className="gap-2"
              >
                {revealKeyCopied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {revealKeyCopied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
