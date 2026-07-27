import { motion } from 'framer-motion';
import { AlertTriangle, Shield, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TwoFactorWarningProps {
  role: 'admin' | 'user';
  variant?: 'badge' | 'banner' | 'card';
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export default function TwoFactorWarning({ 
  role, 
  variant = 'badge',
  onDismiss,
  showDismiss = false
}: TwoFactorWarningProps) {
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const handleClick = () => {
    navigate(isAdmin ? '/dashboard?tab=security' : '/lounge/settings?section=security');
  };

  if (variant === 'badge') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleClick}
            className={`relative p-1.5 rounded-full transition-colors ${
              isAdmin 
                ? 'text-destructive hover:bg-destructive/10' 
                : 'text-warning hover:bg-warning/10'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Enable 2FA to secure your account</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative overflow-hidden"
      >
        {/* Subtle animated gradient background */}
        <div className={`absolute inset-0 opacity-[0.03] ${
          isAdmin 
            ? 'bg-gradient-to-r from-destructive via-destructive/60 to-destructive/30' 
            : 'bg-gradient-to-r from-warning via-warning/60 to-warning/30'
        }`} />
        
        <div className={`relative flex items-center gap-3 rounded-lg border backdrop-blur-sm px-4 py-2.5 transition-all duration-200 ${
          isAdmin 
            ? 'border-destructive/20 bg-destructive/[0.06] hover:border-destructive/30 hover:bg-destructive/[0.08]' 
            : 'border-warning/20 bg-warning/[0.06] hover:border-warning/30 hover:bg-warning/[0.08]'
        }`}>
          {/* Icon with subtle pulse ring */}
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
              isAdmin ? 'bg-destructive' : 'bg-warning'
            }`} style={{ animationDuration: '3s' }} />
            <div className={`relative p-1 rounded-full ${
              isAdmin ? 'bg-destructive/10' : 'bg-warning/10'
            }`}>
              <Shield className={`h-3.5 w-3.5 ${isAdmin ? 'text-destructive' : 'text-warning'}`} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-medium tracking-wide ${
              isAdmin ? 'text-destructive' : 'text-foreground'
            }`}>
              {isAdmin 
                ? 'Security recommendation: Enable two-factor authentication'
                : 'Recommended: Protect your account with 2FA'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button 
              size="sm" 
              onClick={handleClick}
              className={`h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md transition-all duration-200 ${
                isAdmin 
                  ? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 hover:border-destructive/30 shadow-none' 
                  : 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20 hover:border-warning/30 shadow-none'
              }`}
            >
              <Shield className="h-3 w-3" />
              Enable 2FA
              <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
            {showDismiss && onDismiss && (
              <button 
                onClick={onDismiss}
                className={`p-1 rounded-md transition-colors ${
                  isAdmin 
                    ? 'text-destructive/40 hover:text-destructive hover:bg-destructive/10' 
                    : 'text-warning/40 hover:text-warning hover:bg-warning/10'
                }`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Card variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden p-5 rounded-xl border transition-all duration-200 ${
        isAdmin 
          ? 'bg-destructive/[0.04] border-destructive/15 hover:border-destructive/25' 
          : 'bg-warning/[0.04] border-warning/15 hover:border-warning/25'
      }`}
    >
      {/* Subtle corner accent */}
      <div className={`absolute top-0 right-0 w-24 h-24 opacity-[0.03] ${
        isAdmin ? 'bg-destructive' : 'bg-warning'
      }`} style={{ borderRadius: '0 0 0 100%' }} />
      
      <div className="relative flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${
          isAdmin ? 'bg-destructive/10' : 'bg-warning/10'
        }`}>
          <Shield className={`h-5 w-5 ${
            isAdmin ? 'text-destructive' : 'text-warning'
          }`} />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className={`text-sm font-semibold ${
              isAdmin ? 'text-destructive' : 'text-foreground'
            }`}>
              Enable Two-Factor Authentication
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isAdmin 
                ? 'As a team member, 2FA is strongly recommended to protect sensitive data and client information.'
                : 'Add an extra layer of security to your account to protect your data and projects.'}
            </p>
          </div>
          <Button 
            size="sm"
            onClick={handleClick}
            className={`h-8 text-xs font-medium gap-2 ${
              isAdmin 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-foreground text-background hover:bg-foreground/90'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            Enable 2FA Now
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showDismiss && onDismiss && (
          <button 
            onClick={onDismiss}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
