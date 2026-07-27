import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, LogOut, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { quickSignOut } from '@/hooks/useAuthSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import quooroLogo from '@/assets/quooro-logo.png';

export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const state = location.state as { attemptedPortal?: string; actualRole?: string } | null;
  const attemptedPortal = state?.attemptedPortal || 'unknown';
  const actualRole = state?.actualRole || 'unknown';

  const handleLogout = async () => {
    navigate('/sign-in', { replace: true });
    await quickSignOut();
  };

  const handleGoHome = () => {
    navigate('/', { replace: true });
  };

  const getPortalName = (portal: string) => {
    switch (portal) {
      case 'team':
        return 'Team Portal';
      case 'customer':
        return 'Customer Lounge';
      default:
        return 'this portal';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'user':
        return 'Customer';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/10" />
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--destructive) / 0.3) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--destructive) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-destructive/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-destructive/20 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto"
            >
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <ShieldX className="w-10 h-10 text-destructive" />
              </div>
            </motion.div>
            
            <div>
              <img 
                src={quooroLogo} 
                alt="Quooro" 
                className="h-8 w-auto mx-auto mb-4 dark:brightness-0 dark:invert opacity-50"
              />
              <CardTitle className="text-2xl text-destructive">Access Denied</CardTitle>
              <CardDescription className="mt-2">
                You don't have permission to access this area
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Unauthorized Access Attempt</p>
                  <p className="text-muted-foreground">
                    You attempted to access the <strong>{getPortalName(attemptedPortal)}</strong>, 
                    but your account role is <strong>{getRoleName(actualRole)}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {user && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Logged in as: <strong>{user.email}</strong></p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                {actualRole === 'user' 
                  ? 'Customers can only access the Customer Lounge.'
                  : actualRole === 'admin'
                  ? 'Administrators should access the Team Portal.'
                  : 'Please contact support if you believe this is an error.'}
              </p>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out & Switch Account
                </Button>
                
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              This security event has been logged for audit purposes.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
