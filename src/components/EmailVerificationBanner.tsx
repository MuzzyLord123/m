import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Mail, X, RefreshCw, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

import { useAccountType } from "@/hooks/useAccountType";

export function EmailVerificationBanner({ onDismiss }: EmailVerificationBannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { suppressPrompts } = useAccountType();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    const dismissedUntil = localStorage.getItem('email-banner-dismissed-until');
    return dismissedUntil ? Date.now() < Number(dismissedUntil) : false;
  });

  if (suppressPrompts) return null;

  useEffect(() => {
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("email_verified")
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setIsVerified(data.email_verified ?? false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;

    setIsResending(true);
    try {
      const response = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, is_resend: true }
      });

      if (response.error) {
        toast({
          title: "Failed to send",
          description: "Could not resend verification email. Try again later.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent to your inbox."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    localStorage.setItem('email-banner-dismissed-until', String(Date.now() + twentyFourHours));
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if verified, still loading, or dismissed
  if (isVerified !== false || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative overflow-hidden mb-4"
      >
        {/* Subtle animated gradient background */}
        <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-r from-info via-info/60 to-info/30" />
        
        <div className="relative flex items-center gap-3 rounded-lg border border-info/20 bg-info/[0.06] backdrop-blur-sm px-4 py-2.5 transition-all duration-200 hover:border-info/30 hover:bg-info/[0.08]">
          {/* Icon with subtle pulse ring */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-info" style={{ animationDuration: '3s' }} />
            <div className="relative p-1 rounded-full bg-info/10">
              <Mail className="h-3.5 w-3.5 text-info" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium tracking-wide text-foreground">
              Please verify your email to access all features.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleResendEmail}
              disabled={isResending}
              className="h-7 px-3 text-[11px] font-medium gap-1.5 rounded-md bg-info/10 text-info border border-info/20 hover:bg-info/20 hover:border-info/30 shadow-none transition-all duration-200"
            >
              <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
              Resend
              <ChevronRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-md text-info/40 hover:text-info hover:bg-info/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
