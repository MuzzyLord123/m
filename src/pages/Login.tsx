import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, ArrowLeft, Loader2, ShieldAlert, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useIPCheck } from '@/hooks/useIPCheck';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { useLoginRateLimit } from '@/hooks/useRateLimit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import quooroLogo from '@/assets/quooro-logo.png';
import { GENERIC_AUTH_ERROR } from '@/lib/validation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { SocialAuthDivider } from '@/components/auth/SocialAuthDivider';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signOut, session, user, getLastLoginInfo, clearLastLoginInfo } = useAuth();
  const { checkIP, addKnownIP } = useIPCheck();
  const { logSecurityEvent } = useSecurityLog();
  const passwordRef = useRef<HTMLInputElement>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingIP, setCheckingIP] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Welcome back state
  const [savedName, setSavedName] = useState<string | null>(null);
  const [hasSavedEmail, setHasSavedEmail] = useState(false);
  
  // Rate limiting
  const loginRateLimit = useLoginRateLimit();

  // Load saved login info on mount
  useEffect(() => {
    const lastLogin = getLastLoginInfo();
    if (lastLogin.email) {
      setEmail(lastLogin.email);
      setHasSavedEmail(true);
      setSavedName(lastLogin.name);
      setRememberMe(lastLogin.rememberMe);
      // Auto-focus password field when email is pre-filled
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, []);

  const handleClearSavedEmail = () => {
    clearLastLoginInfo();
    setEmail('');
    setSavedName(null);
    setHasSavedEmail(false);
    setRememberMe(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit before proceeding
    if (loginRateLimit.checkLimit()) {
      toast.error(`Too many login attempts. Please wait ${Math.ceil(loginRateLimit.remainingTime / 60)} minutes.`);
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await signIn(email, password, rememberMe);
      if (error) {
        loginRateLimit.recordAttempt();
        // Log failed login attempt
        await logSecurityEvent({
          event_type: 'team_login_failed',
          portal_attempted: 'team',
          details: { email },
        });
        // Use generic error message to prevent user enumeration
        toast.error(GENERIC_AUTH_ERROR);
        setLoading(false);
        return;
      }
      
      // Login successful - reset rate limit
      loginRateLimit.reset();
      toast.success('Checking authorization...');
    } catch (err) {
      loginRateLimit.recordAttempt();
      toast.error(GENERIC_AUTH_ERROR);
      setLoading(false);
    }
  };

  // Check role and IP after successful login
  useEffect(() => {
    const performSecurityChecks = async () => {
      if (!session?.access_token || !user?.id || checkingIP || checkingRole) return;
      
      setCheckingRole(true);
      
      try {
        // CRITICAL: Check if user has admin role - only admins can access team portal
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !roleData) {
          // No role found - deny access
          await logSecurityEvent({
            event_type: 'team_login_no_role',
            portal_attempted: 'team',
            actual_role: 'none',
            details: { email: user.email },
          });
          toast.error('Access denied. No role assigned to this account.');
          await signOut('team');
          setLoading(false);
          setCheckingRole(false);
          return;
        }

        // Check if user is admin
        if (roleData.role !== 'admin') {
          // Log unauthorized access attempt
          await logSecurityEvent({
            event_type: 'unauthorized_team_portal_login',
            portal_attempted: 'team',
            actual_role: roleData.role,
            details: { 
              email: user.email,
              message: 'Non-admin attempted to access team portal'
            },
          });
          
          toast.error('Access denied. This portal is for administrators only.');
          await signOut('team');
          setLoading(false);
          setCheckingRole(false);
          return;
        }

        // User is admin - proceed with IP check
        setCheckingIP(true);
        
        // Log successful admin login attempt
        await logSecurityEvent({
          event_type: 'team_login_success',
          portal_attempted: 'team',
          actual_role: 'admin',
          details: { email: user.email },
        });

        // Check if user has 2FA enabled
        const { data: profile } = await supabase
          .from('profiles')
          .select('two_factor_enabled')
          .single();
        
        // Check if IP is known
        const ipResult = await checkIP();
        
        if (!ipResult) {
          toast.success('Welcome back, Admin!');
          navigate('/dashboard');
          return;
        }

        if (ipResult.requiresVerification) {
          if (ipResult.hasTwoFactorSetup) {
            toast.info('New device detected. Please verify your identity.');
            navigate('/verify-new-ip', { 
              state: { from: '/dashboard', currentIP: ipResult.currentIP } 
            });
          } else {
            toast.warning('New device detected. Please set up 2FA in security settings.');
            await addKnownIP();
            navigate('/dashboard');
          }
        } else {
          if (profile?.two_factor_enabled) {
            toast.success('Please verify with your authenticator app');
            navigate('/verify-2fa', { state: { from: '/dashboard' } });
          } else {
            toast.success('Welcome back, Admin!');
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('Security check error:', err);
        toast.error('Security check failed');
        await signOut('team');
      } finally {
        setLoading(false);
        setCheckingIP(false);
        setCheckingRole(false);
      }
    };

    if (loading && session?.access_token && user?.id) {
      performSecurityChecks();
    }
  }, [session?.access_token, user?.id, loading]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand/[0.04] via-transparent to-brand/[0.06]" />
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--brand) / 0.2) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--brand) / 0.2) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand/[0.06] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-brand/[0.04] rounded-full blur-[100px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <Link 
          to="/sign-in" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-150 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in options
        </Link>
        <div className="glass-strong rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <img 
              src={quooroLogo} 
              alt="Quooro" 
              className="h-16 w-auto mx-auto mb-4 dark:brightness-0 dark:invert"
            />
            <h1 className="text-3xl font-bold font-display tracking-tight">Team Portal</h1>
            <p className="text-muted-foreground text-sm">Administrator access only</p>
          </div>

          {/* Welcome back message */}
          <AnimatePresence>
            {hasSavedEmail && savedName && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Welcome back, {savedName.split(' ')[0]}!</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearSavedEmail}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Not you?
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Security notice */}
          <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg text-sm">
            <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-warning-foreground">
              This portal is restricted to authorized administrators. All access attempts are logged.
            </p>
          </div>

          {/* Google Sign In */}
          <GoogleSignInButton redirectTo="/dashboard" disabled={loading} />
          
          <SocialAuthDivider text="or sign in with email" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@quooro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                {hasSavedEmail && (
                  <button
                    type="button"
                    onClick={handleClearSavedEmail}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {checkingRole ? 'Verifying authorization...' : checkingIP ? 'Checking security...' : 'Signing in...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Authorized administrators only. Contact your system admin for access.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
