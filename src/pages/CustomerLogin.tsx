import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, UserPlus, Building2, Phone, Mail, User, Check, Loader2, Users, Crown, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import quooroLogo from '@/assets/quooro-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PasswordStrengthIndicator } from '@/components/ui/PasswordStrengthIndicator';
import { checkPasswordRequirements } from '@/lib/validation';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { SocialAuthDivider } from '@/components/auth/SocialAuthDivider';
import { IndustryCombobox } from '@/components/ui/IndustryCombobox';

type AccountType = 'primary' | 'team_member';

export default function CustomerLogin() {
  const navigate = useNavigate();
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  
  // Account type selection
  const [accountType, setAccountType] = useState<AccountType>('primary');
  const [teamCode, setTeamCode] = useState('');
  const [teamCodeValid, setTeamCodeValid] = useState<boolean | null>(null);
  const [checkingTeamCode, setCheckingTeamCode] = useState(false);

  // Validate team code when user types it
  const validateTeamCode = async (code: string) => {
    if (!code || code.length < 8) {
      setTeamCodeValid(null);
      return;
    }
    
    setCheckingTeamCode(true);
    try {
      const { data, error } = await supabase
        .from('client_teams')
        .select('id, team_name')
        .eq('team_code', code.toUpperCase())
        .single();
      
      if (error || !data) {
        setTeamCodeValid(false);
      } else {
        setTeamCodeValid(true);
      }
    } catch {
      setTeamCodeValid(false);
    } finally {
      setCheckingTeamCode(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (teamCode) {
        validateTeamCode(teamCode);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [teamCode]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (signupPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    // Enhanced password validation
    const passwordCheck = checkPasswordRequirements(signupPassword);
    if (!passwordCheck.isValid) {
      toast.error('Password does not meet requirements');
      return;
    }
    
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!industry) {
      toast.error('Please select your industry');
      return;
    }
    
    // If joining a team, validate team code first
    if (accountType === 'team_member') {
      if (!teamCode.trim()) {
        toast.error('Please enter your team code');
        return;
      }
      
      // Verify team exists
      const { data: teamData, error: teamError } = await supabase
        .from('client_teams')
        .select('id')
        .eq('team_code', teamCode.toUpperCase())
        .single();
      
      if (teamError || !teamData) {
        toast.error('Invalid team code. Please check and try again.');
        return;
      }
    }
    
    setSignupLoading(true);

    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          // Ensure verification links land on our in-app handler
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: { 
            full_name: fullName.trim()
          }
        }
      });
      
      if (authError) {
        toast.error(authError.message);
        return;
      }
      
      if (authData.user) {
        // Check if this is a repeated signup (user already exists)
        // Supabase returns empty identities array for repeated signups for security
        const isRepeatedSignup = !authData.user.identities || authData.user.identities.length === 0;
        
        if (isRepeatedSignup) {
          // User already exists - send verification email using email lookup
          try {
            const { error } = await supabase.functions.invoke('send-verification-email', {
              body: {
                email: signupEmail,
                is_resend: true,
              },
            });

            if (error) {
              const msg = (error as { message?: string })?.message || '';
              if (msg.includes('Email is already verified')) {
                toast.error('This email is already verified. Please sign in instead.');
                navigate('/sign-in');
                return;
              }
              console.error('Failed to send verification email:', error);
              toast.info('An account with this email already exists. Please check your inbox or sign in.');
            } else {
              toast.success('Verification email sent! Check your inbox.');
            }
          } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            toast.info('An account with this email already exists. Please sign in or check your inbox.');
          }
          
          navigate('/check-email');
          return;
        }
        
        // New user signup - proceed with full setup
        // Generate customer ID
        const { data: customerIdData, error: customerIdError } = await supabase
          .rpc('generate_customer_id');
        
        if (customerIdError) {
          console.error('Error generating customer ID:', customerIdError);
        }
        
        // Ensure a profile row exists (trigger should create it, but don't rely on it)
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              user_id: authData.user.id,
              email: signupEmail,
              full_name: fullName.trim(),
              company: company.trim() || null,
              phone: phone.trim() || null,
              industry: industry || null,
              customer_id: customerIdData || null,
              status: 'active',
              website_status: accountType === 'primary' ? 'pending' : null,
            },
            { onConflict: 'user_id' }
          );
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
        
        if (accountType === 'primary') {
          // Create a new client team for primary accounts
          const { data: teamCodeData } = await supabase.rpc('generate_team_code');
          
          const { data: newTeam, error: teamCreateError } = await supabase
            .from('client_teams')
            .insert({
              primary_account_id: authData.user.id,
              team_code: teamCodeData || `TEAM${Date.now().toString(36).toUpperCase()}`,
              team_name: company.trim() || `${fullName.trim()}'s Team`
            })
            .select()
            .single();
          
          if (teamCreateError) {
            console.error('Error creating team:', teamCreateError);
          } else if (newTeam) {
            // Add primary account as owner in team_memberships
            await supabase.from('team_memberships').insert({
              team_id: newTeam.id,
              user_id: authData.user.id,
              member_role: 'owner',
              display_name: fullName.trim()
            });
          }
        } else {
          // Join existing team as team member
          const { data: teamData } = await supabase
            .from('client_teams')
            .select('id')
            .eq('team_code', teamCode.toUpperCase())
            .single();
          
          if (teamData) {
            await supabase.from('team_memberships').insert({
              team_id: teamData.id,
              user_id: authData.user.id,
              member_role: 'member',
              display_name: fullName.trim()
            });
          }
        }
        
        // Generate verification token and save to profile
        const verificationToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
        
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            verification_token: verificationToken,
            verification_expires_at: expiresAt,
            email_verified: false
          })
          .eq('user_id', authData.user.id);
        
        if (profileUpdateError) {
          console.error('Failed to save verification token:', profileUpdateError);
        }
        
        // Send verification email via backend function (token generation happens server-side)
        try {
          const { error } = await supabase.functions.invoke('send-verification-email', {
            body: { email: signupEmail },
          });

          if (error) {
            console.error('Failed to send verification email:', error);
            toast.error('Account created but failed to send verification email. Please try resending.');
          } else {
            toast.success('Account created! Check your email to verify your account.');
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
          toast.error('Account created but failed to send verification email. Please try resending.');
        }
        
        // Redirect to check-email page
        navigate('/check-email');
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setSignupLoading(false);
    }
  };

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
        
        <div className="glass-strong rounded-2xl p-8 sm:p-10 space-y-6">
          <div className="text-center space-y-3">
            <img 
              src={quooroLogo} 
              alt="Quooro" 
              className="h-14 sm:h-16 w-auto mx-auto mb-4 dark:brightness-0 dark:invert"
            />
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join Quooro Lounge today</p>
          </div>

          {/* Google Sign Up */}
          <GoogleSignInButton redirectTo="/lounge" disabled={signupLoading} />
          
          <SocialAuthDivider text="or sign up with email" />

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Account Type Selection */}
            <div className="space-y-3">
              <Label>Account Type *</Label>
              <RadioGroup 
                value={accountType} 
                onValueChange={(v) => setAccountType(v as AccountType)}
                className="grid grid-cols-2 gap-3"
              >
                <div>
                  <RadioGroupItem value="primary" id="primary" className="sr-only peer" />
                  <Label
                    htmlFor="primary"
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <Crown className="h-6 w-6 text-primary" />
                    <span className="font-semibold text-sm">Primary Account</span>
                    <span className="text-xs text-muted-foreground text-center">Create your own team</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="team_member" id="team_member" className="sr-only peer" />
                  <Label
                    htmlFor="team_member"
                    className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                  >
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <span className="font-semibold text-sm">Team Member</span>
                    <span className="text-xs text-muted-foreground text-center">Join an existing team</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Team Code Input (for team members only) */}
            <AnimatePresence>
              {accountType === 'team_member' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="team-code">Team Code *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="team-code"
                      type="text"
                      placeholder="ABCD1234"
                      value={teamCode}
                      onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                      className={`pl-10 font-mono tracking-wider uppercase ${
                        teamCodeValid === true ? 'border-green-500 focus-visible:ring-green-500' : 
                        teamCodeValid === false ? 'border-destructive focus-visible:ring-destructive' : ''
                      }`}
                      maxLength={8}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingTeamCode && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingTeamCode && teamCodeValid === true && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {!checkingTeamCode && teamCodeValid === false && (
                        <span className="text-xs text-destructive">Invalid</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ask your team admin for the 8-character team code
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="full-name"
                  type="text"
                  placeholder="John Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            {accountType === 'primary' && (
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company Ltd"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Industry Selector */}
            <div className="space-y-2">
              <Label>Industry / Business Type *</Label>
              <IndustryCombobox value={industry} onChange={setIndustry} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password *</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthIndicator password={signupPassword} className="mt-2" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={signupLoading || (accountType === 'team_member' && teamCodeValid !== true)}
            >
              {signupLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {accountType === 'primary' ? 'Create Account' : 'Join Team'}
                </span>
              )}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              {accountType === 'primary' 
                ? 'Create your account to access your exclusive project dashboard and manage your team.'
                : 'Join your team to collaborate on projects and view shared resources.'
              }
            </p>
          </form>
          
          {/* Sign in link */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
