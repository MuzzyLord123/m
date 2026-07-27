import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  QrCode, 
  Copy, 
  Check, 
  Loader2, 
  Download,
  AlertCircle,
  ArrowLeft,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTwoFactor } from '@/hooks/useTwoFactor';

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export default function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const { setupTwoFactor, verifySetup, error, clearError } = useTwoFactor();
  const [step, setStep] = useState<'loading' | 'scan' | 'verify' | 'backup'>('loading');
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    initSetup();
  }, []);

  const initSetup = async () => {
    const data = await setupTwoFactor();
    if (data) {
      setSetupData(data);
      setStep('scan');
    } else {
      toast.error('Failed to initialize 2FA setup');
      onCancel();
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = code.split('');
    newCode[index] = value.slice(-1);
    const updatedCode = newCode.join('').slice(0, 6);
    setCode(updatedCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6 digits
    if (updatedCode.length === 6) {
      handleVerify(updatedCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verifyCode?: string) => {
    const codeToVerify = verifyCode || code;
    if (codeToVerify.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    clearError();

    const result = await verifySetup(codeToVerify);
    
    if (result.success && result.backupCodes) {
      setBackupCodes(result.backupCodes);
      setStep('backup');
      toast.success('2FA verified successfully!');
    } else {
      toast.error(error || 'Invalid code. Please try again.');
      setCode('');
      inputRefs.current[0]?.focus();
    }
    
    setVerifying(false);
  };

  const copySecret = async () => {
    if (setupData?.secret) {
      await navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      toast.success('Secret copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const content = `Quooro 2FA Backup Codes\n${'='.repeat(30)}\n\nKeep these codes safe. Each can only be used once.\n\n${backupCodes.join('\n')}\n\nGenerated: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quooro-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Setting up two-factor authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <Button variant="ghost" onClick={onCancel} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Button>

      <AnimatePresence mode="wait">
        {step === 'scan' && (
          <motion.div
            key="scan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Use Google Authenticator or any TOTP app to scan this code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl">
                    <img 
                      src={setupData?.qrCodeUrl} 
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {/* Manual Entry */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono text-center break-all">
                      {setupData?.secret}
                    </code>
                    <Button variant="outline" size="icon" onClick={copySecret}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={() => setStep('verify')}
                >
                  <Smartphone className="h-4 w-4" />
                  I've scanned the code
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'verify' && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Verify Setup</CardTitle>
                <CardDescription>
                  Enter the 6-digit code from your authenticator app
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 6-digit code input */}
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={code[index] || ''}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-mono"
                      disabled={verifying}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button 
                  className="w-full" 
                  onClick={() => handleVerify()}
                  disabled={code.length !== 6 || verifying}
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <Button 
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setStep('scan')}
                >
                  Back to QR Code
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'backup' && (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <CardTitle className="text-green-600 dark:text-green-400">
                  ✅ Two-Factor Authentication Active
                </CardTitle>
                <CardDescription>
                  Save these backup codes in a secure location. Each code can only be used once.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Backup codes grid */}
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((code, index) => (
                    <code 
                      key={index}
                      className="p-2 bg-muted rounded text-sm font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="h-4 w-4" />
                    Copy All
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={downloadBackupCodes}
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>

                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ <strong>Important:</strong> If you lose access to your authenticator app, 
                    you'll need these codes to sign in. Store them safely!
                  </p>
                </div>

                <Button className="w-full" onClick={onComplete}>
                  Done
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
