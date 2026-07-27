import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Loader2, AlertTriangle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { quickSignOut } from '@/hooks/useAuthSync';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { toast } from 'sonner';
import quooroLogo from '@/assets/quooro-logo.png';

export default function Verify2FA() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { verifyCode, loading: statusLoading, error, clearError } = useTwoFactor();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const redirectTo = (location.state as { from?: string })?.from || '/lounge';

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !verifying) {
      handleVerify();
    }
  }, [code]);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) && !useBackupCode) return;
    
    const newCode = code.split('');
    newCode[index] = value.slice(-1);
    const updatedCode = newCode.join('').slice(0, useBackupCode ? 8 : 6);
    setCode(updatedCode);

    if (value && index < (useBackupCode ? 7 : 5)) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if ((!useBackupCode && code.length !== 6) || (useBackupCode && code.length !== 8)) {
      toast.error(`Please enter a ${useBackupCode ? '8-character backup' : '6-digit'} code`);
      return;
    }

    setVerifying(true);
    clearError();
    
    const result = await verifyCode(code, useBackupCode);
    
    if (result.success) {
      toast.success('Two-factor authentication verified');
      navigate(redirectTo, { replace: true });
    } else {
      toast.error(result.error || 'Invalid code. Please try again.');
      setCode('');
      inputRefs.current[0]?.focus();
    }
    
    setVerifying(false);
  };

  const handleSignOut = async () => {
    navigate('/sign-in', { replace: true });
    await quickSignOut();
  };

  const toggleBackupCode = () => {
    setUseBackupCode(!useBackupCode);
    setCode('');
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img 
            src={quooroLogo} 
            alt="Quooro" 
            className="h-12 w-auto mx-auto mb-4 dark:brightness-0 dark:invert"
          />
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-muted-foreground mt-2">
            {user?.email}
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              {useBackupCode ? (
                <Key className="h-6 w-6 text-primary" />
              ) : (
                <Shield className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle>
              {useBackupCode ? 'Enter Backup Code' : 'Enter Verification Code'}
            </CardTitle>
            <CardDescription>
              {useBackupCode 
                ? 'Enter one of your 8-character backup codes'
                : 'Open your authenticator app and enter the 6-digit code'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {(useBackupCode ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 2, 3, 4, 5]).map((index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode={useBackupCode ? "text" : "numeric"}
                  maxLength={1}
                  value={code[index] || ''}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`${useBackupCode ? 'w-9' : 'w-11'} h-12 text-center text-xl font-mono`}
                  disabled={verifying}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm justify-center">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button 
              onClick={handleVerify}
              disabled={code.length !== (useBackupCode ? 8 : 6) || verifying}
              className="w-full"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>

            <div className="text-center space-y-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleBackupCode}
                className="text-muted-foreground"
              >
                {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
              </Button>
              
              <div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground"
                >
                  Sign out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Having trouble? Contact support for help with your account.
        </p>
      </motion.div>
    </div>
  );
}
