import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, EyeOff, LogIn, ArrowLeft, Loader2, ShieldCheck, Building2, 
  Mail, User, KeyRound, Check, X, UserPlus, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useIPCheck } from '@/hooks/useIPCheck';
import { useSecurityLog } from '@/hooks/useSecurityLog';
import { useLoginRateLimit, usePasswordResetRateLimit } from '@/hooks/useRateLimit';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import quooroLogo from '@/assets/quooro-logo.png';
import { GENERIC_AUTH_ERROR, GENERIC_RESET_MESSAGE, checkPasswordRequirements } from '@/lib/validation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { SocialAuthDivider } from '@/components/auth/SocialAuthDivider';
import { getLastPortal, setLastPortal } from '@/hooks/useAuthSync';
import { cn } from '@/lib/utils';
import { AuthBrandPanel } from '@/components/auth/AuthBrandPanel';

type Portal = 'customer' | 'team' | 'accountant';
type Tab = 'login' | 'signup' | 'forgot';

// Form field validation states
type FieldState = {
  value: string;
  error: string | null;
  touched: boolean;
};

export default function UnifiedSignIn() {
  const navigate = useNavigate();
  const { signIn, signOut, session, user, getLastLoginInfo, clearLastLoginInfo } = useAuth();
  const { checkIP, addKnownIP } = useIPCheck();
  const { logSecurityEvent } = useSecurityLog();
  
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  // Portal selection - always default to customer tab
  const [selectedPortal, setSelectedPortal] = useState<Portal>('customer');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('login');
  
  // Form fields with validation state
  const [email, setEmail] = useState<FieldState>({ value: '', error: null, touched: false });
  const [password, setPassword] = useState<FieldState>({ value: '', error: null, touched: false });
  const [showPassword, setShowPassword] = useState(false);
  
  // Signup fields
  const [signupEmail, setSignupEmail] = useState<FieldState>({ value: '', error: null, touched: false });
  const [signupPassword, setSignupPassword] = useState<FieldState>({ value: '', error: null, touched: false });
  const [confirmPassword, setConfirmPassword] = useState<FieldState>({ value: '', error: null, touched: false });
  const [fullName, setFullName] = useState<FieldState>({ value: '', error: null, touched: false });
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  
  // Forgot password
  const [forgotEmail, setForgotEmail] = useState<FieldState>({ value: '', error: null, touched: false });
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  // Welcome back state
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
  const [hasSavedEmail, setHasSavedEmail] = useState(false);
  
  // Rate limiting
  const loginRateLimit = useLoginRateLimit();
  const passwordResetRateLimit = usePasswordResetRateLimit();

  // Auto-redirect if user already has an active session
  useEffect(() => {
    if (session && user && !loading && !checkingAuth) {
      const checkRoleAndRedirect = async () => {
        setCheckingAuth(true);
        try {
          // Verify the session is still valid before redirecting
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (!currentSession) {
            setCheckingAuth(false);
            return;
          }

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const destination = roleData?.role === 'admin' ? '/dashboard' : '/lounge';
          navigate(destination, { replace: true });
        } catch {
          setCheckingAuth(false);
        }
      };
      checkRoleAndRedirect();
    }
  }, [session, user, loading, checkingAuth, navigate]);

  // Load saved login info and cache on mount
  useEffect(() => {
    const lastLogin = getLastLoginInfo();
    if (lastLogin.email) {
      setEmail({ value: lastLogin.email, error: null, touched: false });
      setHasSavedEmail(true);
      setSavedName(lastLogin.name);
      
      // Load cached avatar
      const cachedAvatar = localStorage.getItem('cachedAvatarUrl');
      if (cachedAvatar) {
        setSavedAvatar(cachedAvatar);
      }
      
      // Auto-focus password field after brief delay for animation
      requestAnimationFrame(() => {
        setTimeout(() => passwordRef.current?.focus(), 150);
      });
    } else {
      // Focus email field with highlight animation
      requestAnimationFrame(() => {
        setTimeout(() => emailRef.current?.focus(), 150);
      });
    }
  }, [getLastLoginInfo]);

  // Save portal preference when changed
  useEffect(() => {
    if (selectedPortal !== 'accountant') setLastPortal(selectedPortal);
  }, [selectedPortal]);

  // Convert an accountant Login ID (no @) to the internal email used by auth.
  const toAuthEmail = useCallback((value: string): string => {
    const v = value.trim();
    if (!v) return v;
    if (v.includes('@')) return v.toLowerCase();
    return `${v.toLowerCase()}@acct.quooro.app`;
  }, []);

  // Real-time email / login-id validation (accountant tab accepts plain IDs)
  const validateEmail = useCallback((value: string): string | null => {
    if (!value) return selectedPortal === 'accountant' ? 'Login ID is required' : 'Email is required';
    if (selectedPortal === 'accountant' && !value.includes('@')) {
      if (!/^[a-zA-Z0-9._-]{3,}$/.test(value)) return 'Login ID: letters, numbers, . _ - (min 3 chars)';
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return selectedPortal === 'accountant' ? 'Enter a valid login ID' : 'Please enter a valid email';
    return null;
  }, [selectedPortal]);

  // Real-time password validation
  const validatePassword = useCallback((value: string): string | null => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    return null;
  }, []);

  // Real-time signup password validation
  const validateSignupPassword = useCallback((value: string): string | null => {
    if (!value) return 'Password is required';
    const check = checkPasswordRequirements(value);
    if (!check.isValid) {
      if (!check.minLength) return 'At least 8 characters required';
      if (!check.hasUppercase) return 'Include at least one uppercase letter';
      if (!check.hasNumber) return 'Include at least one number';
    }
    return null;
  }, []);

  // Handle field changes with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail({
      value,
      error: email.touched ? validateEmail(value) : null,
      touched: email.touched
    });
  };

  const handleEmailBlur = () => {
    setEmail(prev => ({
      ...prev,
      error: validateEmail(prev.value),
      touched: true
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword({
      value,
      error: password.touched ? validatePassword(value) : null,
      touched: password.touched
    });
  };

  const handlePasswordBlur = () => {
    // Don't validate on blur - only validate on submit
  };

  // Clear saved email
  const handleClearSavedEmail = () => {
    clearLastLoginInfo();
    setEmail({ value: '', error: null, touched: false });
    setSavedName(null);
    setSavedAvatar(null);
    setHasSavedEmail(false);
    localStorage.removeItem('cachedAvatarUrl');
    setTimeout(() => emailRef.current?.focus(), 50);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    const emailError = validateEmail(email.value);
    const passwordError = validatePassword(password.value);
    
    if (emailError || passwordError) {
      setEmail(prev => ({ ...prev, error: emailError, touched: true }));
      setPassword(prev => ({ ...prev, error: passwordError, touched: true }));
      return;
    }
    
    // Check rate limit
    if (loginRateLimit.checkLimit()) {
      toast.error(`Too many attempts. Please wait ${Math.ceil(loginRateLimit.remainingTime / 60)} minutes.`);
      return;
    }
    
    setLoading(true);
    setCheckingAuth(true);

    try {
      const authEmail = selectedPortal === 'accountant' ? toAuthEmail(email.value) : email.value;
      const { error } = await signIn(authEmail, password.value, true);
      
      if (error) {
        loginRateLimit.recordAttempt();
        await logSecurityEvent({
          event_type: `${selectedPortal}_login_failed`,
          portal_attempted: selectedPortal,
          details: { email: email.value },
        });
        toast.error(GENERIC_AUTH_ERROR);
        setLoading(false);
        setCheckingAuth(false);
        
        // Shake animation on password field
        passwordRef.current?.classList.add('animate-shake');
        setTimeout(() => passwordRef.current?.classList.remove('animate-shake'), 500);
        return;
      }
      
      loginRateLimit.reset();

      // Get the authenticated user directly
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Authentication failed.');
        setLoading(false);
        setCheckingAuth(false);
        return;
      }

      // Check user role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUser.id)
        .maybeSingle();

      const userRole = roleData?.role || 'user';
      const isAdmin = userRole === 'admin';

      // Portal validation
      let portal = selectedPortal;
      if (portal === 'team' && !isAdmin) {
        await logSecurityEvent({
          event_type: 'unauthorized_team_portal_login',
          portal_attempted: 'team',
          actual_role: userRole,
          details: { email: authUser.email },
        });
        toast.error('Access denied. Administrator access only.');
        await signOut();
        setLoading(false);
        setCheckingAuth(false);
        return;
      }

      if (portal === 'customer' && isAdmin) {
        toast.info('Admin accounts should use Team Portal.');
        portal = 'team';
        setSelectedPortal('team');
      }

      // Cache profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, two_factor_enabled')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (profile) {
        if (profile.full_name) localStorage.setItem('lastLoggedInName', profile.full_name);
        if (profile.avatar_url) localStorage.setItem('cachedAvatarUrl', profile.avatar_url);
      }

      // Log successful login
      await logSecurityEvent({
        event_type: `${portal}_login_success`,
        portal_attempted: portal,
        actual_role: userRole,
        details: { email: authUser.email },
      });

      // Check IP
      const ipResult = await checkIP();
      const destination = portal === 'team' ? '/dashboard' : portal === 'accountant' ? '/accountant/dashboard' : '/lounge';

      if (ipResult?.requiresVerification) {
        if (ipResult.hasTwoFactorSetup) {
          navigate('/verify-new-ip', { state: { from: destination, currentIP: ipResult.currentIP } });
          return;
        }
        await addKnownIP();
      }

      if (profile?.two_factor_enabled) {
        navigate('/verify-2fa', { state: { from: destination } });
        return;
      }

      // Success! Show checkmark briefly then navigate
      setAuthSuccess(true);
      toast.success(`Welcome back${savedName ? `, ${savedName.split(' ')[0]}` : ''}!`);
      
      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 300);
      
    } catch (err) {
      console.error('Login error:', err);
      loginRateLimit.recordAttempt();
      toast.error(GENERIC_AUTH_ERROR);
    } finally {
      setLoading(false);
      setCheckingAuth(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateEmail(forgotEmail.value);
    if (error) {
      setForgotEmail(prev => ({ ...prev, error, touched: true }));
      return;
    }
    
    if (passwordResetRateLimit.checkLimit()) {
      toast.error(`Too many requests. Please wait ${Math.ceil(passwordResetRateLimit.remainingTime / 60)} minutes.`);
      return;
    }
    
    setLoading(true);
    passwordResetRateLimit.recordAttempt();

    try {
      await supabase.auth.resetPasswordForEmail(forgotEmail.value.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setForgotSuccess(true);
      toast.success(GENERIC_RESET_MESSAGE);
    } catch {
      setForgotSuccess(true);
      toast.success(GENERIC_RESET_MESSAGE);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (activeTab === 'forgot') {
        setActiveTab('login');
        setForgotSuccess(false);
      }
    }
  };

  // Portal tab styling — a segmented hairline control rather than glowing pills
  const portalTabClass = (portal: Portal) => cn(
    "flex-1 min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 px-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer whitespace-nowrap",
    selectedPortal === portal
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:text-foreground"
  );

  return (
    <div
      className="relative min-h-screen bg-background lg:grid lg:grid-cols-[1.1fr_1fr]"
      onKeyDown={handleKeyDown}
    >
      {/* ── Brand panel — presentation only, hidden below lg ─────────────── */}
      <AuthBrandPanel />

      {/* ── Form panel ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:py-6"
      >
        <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to website
          </Link>
          <span className="mono-label lg:hidden">52.13° N · 3.78° W</span>
        </div>

        <div className="space-y-5">
          {/* Masthead */}
          <div className="space-y-2">
            <motion.img 
              src={quooroLogo} 
              alt="Quooro" 
              className="h-7 w-auto dark:brightness-0 dark:invert"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            />
            <div className="flex items-center gap-3 pt-1">
              <span className="h-px w-8 bg-primary" />
              <p className="mono-label">Sign in to your account</p>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">Welcome back</h1>
          </div>

          {/* Portal Selection Tabs */}
          <div className="relative">
            <div className="flex gap-1 rounded-full border border-border p-1">
              <motion.button
                type="button"
                onClick={() => setSelectedPortal('customer')}
                className={portalTabClass('customer')}
                whileTap={{ scale: 0.98 }}
              >
                <Building2 className="w-4 h-4" />
                Customer
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setSelectedPortal('team')}
                className={portalTabClass('team')}
                whileTap={{ scale: 0.98 }}
              >
                <ShieldCheck className="w-4 h-4" />
                Team
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setSelectedPortal('accountant')}
                className={portalTabClass('accountant')}
                whileTap={{ scale: 0.98 }}
              >
                <Calculator className="w-4 h-4" />
                Accountant
              </motion.button>
            </div>
          </div>

          {/* Portal context banner - always renders to prevent layout shift */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPortal}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "text-xs rounded-xl p-3 text-center border",
                selectedPortal === 'team'
                  ? "text-warning bg-warning/10 border-warning/30"
                  : selectedPortal === 'accountant'
                  ? "text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)] border-[hsl(var(--success)/0.3)]"
                  : "text-muted-foreground bg-muted/30 border-border/50"
              )}
            >
              {selectedPortal === 'team'
                ? "Administrator access only. All attempts are logged."
                : selectedPortal === 'accountant'
                ? "Sign in to access your client's accounting."
                : "Access your projects, billing, and business tools."}
            </motion.div>
          </AnimatePresence>

          {/* Success State */}
          <AnimatePresence>
            {authSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-16 h-16 bg-[hsl(var(--success)/0.18)] rounded-full flex items-center justify-center"
                >
                  <Check className="w-8 h-8 text-[hsl(var(--success))]" />
                </motion.div>
                <p className="mt-4 text-sm text-muted-foreground">Redirecting...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          {!authSuccess && (
            <AnimatePresence mode="wait">
              {activeTab === 'forgot' ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {forgotSuccess ? (
                    <div className="text-center space-y-4 py-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-16 h-16 bg-[hsl(var(--success)/0.18)] rounded-full flex items-center justify-center mx-auto"
                      >
                        <Check className="w-8 h-8 text-[hsl(var(--success))]" />
                      </motion.div>
                      <div>
                        <h2 className="text-lg font-semibold">Check your email</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          We've sent a password reset link to <strong>{forgotEmail.value}</strong>
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setActiveTab('login');
                          setForgotSuccess(false);
                          setForgotEmail({ value: '', error: null, touched: false });
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to sign in
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Enter your email and we'll send you a reset link.
                      </p>
                      
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email" className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Email</Label>
                      <div className="relative">
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="you@example.com"
                            value={forgotEmail.value}
                            onChange={(e) => setForgotEmail({ 
                              value: e.target.value, 
                              error: forgotEmail.touched ? validateEmail(e.target.value) : null,
                              touched: forgotEmail.touched 
                            })}
                            onBlur={() => setForgotEmail(prev => ({ ...prev, error: validateEmail(prev.value), touched: true }))}
                            className={cn("pr-10 h-11 rounded-xl border-border/60 bg-foreground/[0.03] text-[15px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]", forgotEmail.error && forgotEmail.touched && "border-destructive")}
                            disabled={loading}
                          />
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                        <AnimatePresence>
                          {forgotEmail.error && forgotEmail.touched && (
                            <motion.p
                              initial={{ opacity: 0, y: -10, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -10, height: 0 }}
                              className="text-xs text-destructive"
                            >
                              {forgotEmail.error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <Button type="submit" className="w-full h-11 rounded-xl" disabled={loading}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <KeyRound className="w-4 h-4" />
                            Send Reset Link
                          </span>
                        )}
                      </Button>
                      
                      <Button 
                        type="button"
                        variant="ghost" 
                        onClick={() => setActiveTab('login')}
                        className="w-full"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to sign in
                      </Button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Google Sign In - not available for accountant portal */}
                  {selectedPortal !== 'accountant' && (
                    <>
                      <GoogleSignInButton 
                        redirectTo={selectedPortal === 'team' ? '/dashboard' : '/lounge'} 
                        disabled={loading || checkingAuth} 
                      />
                      <SocialAuthDivider text="or continue with email" />
                    </>
                  )}

                  {/* Welcome back banner */}
                  <AnimatePresence>
                    {hasSavedEmail && savedName && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center gap-3">
                          {savedAvatar ? (
                            <img 
                              src={savedAvatar} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium">Welcome back, {savedName.split(' ')[0]}!</p>
                            <p className="text-xs text-muted-foreground">
                              {selectedPortal === 'accountant' ? `Login ID: ${email.value}` : email.value}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearSavedEmail}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                        >
                          Not you?
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{selectedPortal === 'accountant' ? 'Login ID' : 'Email'}</Label>
                      <div className="relative">
                        <Input
                          ref={emailRef}
                          id="email"
                          type={selectedPortal === 'accountant' ? 'text' : 'email'}
                          placeholder={selectedPortal === 'accountant' ? 'your-login-id' : 'you@example.com'}
                          value={email.value}
                          onChange={handleEmailChange}
                          onBlur={handleEmailBlur}
                          className={cn(
                            "pr-10 h-11 rounded-xl border-border/60 bg-foreground/[0.03] text-[15px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]",
                            email.error && email.touched && "border-destructive focus-visible:ring-destructive",
                            hasSavedEmail && "pr-16"
                          )}
                          disabled={loading || checkingAuth}
                          autoComplete={selectedPortal === 'accountant' ? 'username' : 'email'}
                          autoCapitalize="none"
                          spellCheck={false}
                        />
                        {selectedPortal === 'accountant'
                          ? <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          : <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
                        {hasSavedEmail && (
                          <button
                            type="button"
                            onClick={handleClearSavedEmail}
                            className="absolute right-9 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <AnimatePresence>
                        {email.error && email.touched && (
                          <motion.p
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="text-xs text-destructive"
                          >
                            {email.error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Password</Label>
                      <div className="relative">
                        <Input
                          ref={passwordRef}
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password.value}
                          onChange={handlePasswordChange}
                          onBlur={handlePasswordBlur}
                          className={cn(
                            "pr-10 h-11 rounded-xl border-border/60 bg-foreground/[0.03] text-[15px] shadow-none transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]",
                            password.error && password.touched && "border-destructive focus-visible:ring-destructive"
                          )}
                          disabled={loading || checkingAuth}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={loading || checkingAuth}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {password.error && password.touched && (
                          <motion.p
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            className="text-xs text-destructive"
                          >
                            {password.error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remember" 
                          checked={true}
                          disabled
                        />
                        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-muted-foreground">
                          Keep me signed in
                        </Label>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('forgot')}
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 rounded-xl" 
                      disabled={loading || checkingAuth}
                    >
                      {loading || checkingAuth ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {checkingAuth ? 'Verifying...' : 'Signing in...'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <LogIn className="w-4 h-4" />
                          Sign In
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Signup link - always rendered to prevent layout shift */}
                  <p className={cn(
                    "text-center text-sm text-muted-foreground",
                    selectedPortal !== 'customer' && "invisible"
                  )}>
                    Don't have an account?{' '}
                    <Link 
                      to="/customer-login?tab=signup" 
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Need help? <a href="mailto:support@quooro.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
        </div>
      </motion.div>
    </div>
  );
}
