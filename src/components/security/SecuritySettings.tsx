import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Loader2, 
  AlertCircle,
  Key,
  MapPin,
  Trash2,
  Monitor,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { useIPCheck } from '@/hooks/useIPCheck';
import TwoFactorSetup from './TwoFactorSetup';

interface SecuritySettingsProps {
  onSetupComplete?: () => void;
}

export default function SecuritySettings({ onSetupComplete }: SecuritySettingsProps) {
  const { status, loading, disableTwoFactor, error, clearError, refetch } = useTwoFactor();
  const { getKnownIPs, removeKnownIP } = useIPCheck();
  
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disabling, setDisabling] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Trusted IPs state
  const [knownIPs, setKnownIPs] = useState<string[]>([]);
  const [currentIP, setCurrentIP] = useState<string>('');
  const [loadingIPs, setLoadingIPs] = useState(false);
  const [ipToRemove, setIpToRemove] = useState<string | null>(null);
  const [removingIP, setRemovingIP] = useState(false);

  // Fetch known IPs on mount
  useEffect(() => {
    fetchKnownIPs();
  }, []);

  const fetchKnownIPs = async () => {
    setLoadingIPs(true);
    try {
      const result: any = await getKnownIPs();
      if (result) {
        // A response without the list must not blank the security
        // screen: this renders straight into knownIPs.length.
        setKnownIPs(Array.isArray(result.knownIPs) ? result.knownIPs : []);
        setCurrentIP(result.currentIP ?? null);
      }
    } catch (err) {
      console.error('Failed to fetch known IPs:', err);
    } finally {
      setLoadingIPs(false);
    }
  };

  const handleRemoveIP = async () => {
    if (!ipToRemove) return;
    
    setRemovingIP(true);
    try {
      const success = await removeKnownIP(ipToRemove);
      if (success) {
        setKnownIPs(prev => prev.filter(ip => ip !== ipToRemove));
        toast.success('Trusted device removed');
      } else {
        toast.error('Failed to remove device');
      }
    } catch (err) {
      toast.error('Failed to remove device');
    } finally {
      setRemovingIP(false);
      setIpToRemove(null);
    }
  };

  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setDisabling(true);
    clearError();
    
    const success = await disableTwoFactor(disableCode);
    
    if (success) {
      toast.success('Two-factor authentication has been disabled');
      setShowDisableDialog(false);
      setDisableCode('');
    } else {
      toast.error(error || 'Failed to disable 2FA. Check your code and try again.');
    }
    
    setDisabling(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = disableCode.split('');
    newCode[index] = value.slice(-1);
    const updatedCode = newCode.join('').slice(0, 6);
    setDisableCode(updatedCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !disableCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup 
        onComplete={() => {
          setShowSetup(false);
          refetch();
          fetchKnownIPs(); // Refresh IPs after 2FA setup
          onSetupComplete?.();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  const isEnabled = status?.enabled;
  const isAdmin = status?.role === 'admin';

  return (
    <>
      <div className="space-y-6">
        {/* 2FA Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 2FA Status Card */}
            <div className={`p-4 rounded-xl border-2 ${
              isEnabled 
                ? 'bg-emerald-500/5 border-emerald-500/30' 
                : isAdmin 
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-amber-500/5 border-amber-500/30'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isEnabled 
                      ? 'bg-emerald-500/10' 
                      : isAdmin 
                        ? 'bg-destructive/10' 
                        : 'bg-amber-500/10'
                  }`}>
                    {isEnabled ? (
                      <ShieldCheck className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <ShieldOff className={`h-6 w-6 ${isAdmin ? 'text-destructive' : 'text-amber-500'}`} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Two-Factor Authentication</h3>
                      <Badge className={
                        isEnabled 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                          : isAdmin
                            ? 'bg-destructive/10 text-destructive border-destructive/30'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      }>
                        {isEnabled ? '✓ Enabled' : 'Not Enabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isEnabled 
                        ? `Protected since ${new Date(status.verifiedAt!).toLocaleDateString()}`
                        : isAdmin
                          ? 'Strongly recommended for team security'
                          : 'Recommended to protect your account'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                {isEnabled ? (
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => setShowDisableDialog(true)}
                  >
                    <ShieldOff className="h-4 w-4" />
                    Disable 2FA
                  </Button>
                ) : (
                  <Button 
                    className="gap-2"
                    variant={isAdmin ? 'destructive' : 'default'}
                    onClick={() => setShowSetup(true)}
                  >
                    <Shield className="h-4 w-4" />
                    🔴 Enable 2FA
                  </Button>
                )}
              </div>
            </div>

            {/* Info about 2FA */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">How it works</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  Download Google Authenticator or any TOTP app
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  Scan the QR code to link your account
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  Enter the 6-digit code to verify
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">4.</span>
                  Save your backup codes in a safe place
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Trusted Devices / IP Addresses Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Trusted Devices
                </CardTitle>
                <CardDescription>
                  IP addresses that can access your account without additional verification
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchKnownIPs}
                disabled={loadingIPs}
              >
                <RefreshCw className={`h-4 w-4 ${loadingIPs ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingIPs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : knownIPs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No trusted devices yet</p>
                <p className="text-xs mt-1">Devices are added when you verify your identity</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {knownIPs.map((ip, index) => (
                    <motion.div
                      key={ip}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        ip === currentIP 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-muted/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          ip === currentIP ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Monitor className={`h-4 w-4 ${
                            ip === currentIP ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{ip}</code>
                            {ip === currentIP && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {ip === currentIP ? 'This device' : 'Trusted device'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setIpToRemove(ip)}
                        disabled={removingIP}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <p className="text-xs text-muted-foreground mt-4">
                  Removing a device will require 2FA verification on next login from that IP address.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your current 2FA code to disable two-factor authentication. 
              This will make your account less secure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={disableCode[index] || ''}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 text-center text-xl font-mono"
                  disabled={disabling}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowDisableDialog(false);
                setDisableCode('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDisable}
              disabled={disableCode.length !== 6 || disabling}
            >
              {disabling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove IP Confirmation Dialog */}
      <AlertDialog open={!!ipToRemove} onOpenChange={() => setIpToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Trusted Device?</AlertDialogTitle>
            <AlertDialogDescription>
              Removing <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{ipToRemove}</code> will 
              require 2FA verification the next time you log in from this device.
              {ipToRemove === currentIP && (
                <span className="block mt-2 text-amber-500 font-medium">
                  ⚠️ This is your current device. You'll need to verify again on next login.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingIP}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveIP}
              disabled={removingIP}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingIP ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Device'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}