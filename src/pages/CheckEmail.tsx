import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function CheckEmail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  // Poll for email verification status
  useEffect(() => {
    if (!user) return;

    const checkVerification = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('email_verified')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.email_verified) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Redirecting to your dashboard...",
        });
        
        // Short delay for user to see the success state
        setTimeout(() => {
          navigate("/lounge");
        }, 1500);
      }
    };

    // Check immediately
    checkVerification();

    // Then poll every 3 seconds
    const interval = setInterval(checkVerification, 3000);

    return () => clearInterval(interval);
  }, [user, navigate, toast]);

  // Fallback: fetch current token so users can verify even if inbox delivery is blocked.
  useEffect(() => {
    if (!user) return;

    const loadToken = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('verification_token')
        .eq('user_id', user.id)
        .maybeSingle();

      setDevToken(data?.verification_token ?? null);
    };

    loadToken();
  }, [user]);

  const handleResendEmail = async () => {
    if (!user || resendCooldown > 0) return;

    setIsResending(true);
    try {
      const response = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, is_resend: true }
      });

      if (response.error) {
        const errorData = response.error as { message?: string };
        toast({
          title: "Failed to send",
          description: errorData.message || "Could not resend verification email.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent. Check your inbox.",
      });

      // Start cooldown timer (60 seconds)
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`mx-auto mb-4 w-20 h-20 rounded-full flex items-center justify-center ${
                isVerified ? "bg-green-100 dark:bg-green-900/30" : "bg-primary/10"
              }`}
            >
              {isVerified ? (
                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              ) : (
                <Mail className="h-10 w-10 text-primary" />
              )}
            </motion.div>
            <CardTitle className="text-2xl">
              {isVerified ? "Email Verified!" : "Check Your Email"}
            </CardTitle>
            <CardDescription className="text-base">
              {isVerified ? (
                "Redirecting to your dashboard..."
              ) : (
                <>
                  We've sent a verification link to{" "}
                  <span className="font-medium text-foreground">{user?.email}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isVerified && (
              <>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-medium text-sm">What's next?</h4>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Open your email inbox</li>
                    <li>Find the email from Quooro</li>
                    <li>Click the verification link</li>
                    <li>You'll be redirected to your dashboard</li>
                  </ol>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleResendEmail} 
                    variant="outline" 
                    className="w-full"
                    disabled={isResending || resendCooldown > 0}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                    {resendCooldown > 0 
                      ? `Resend in ${resendCooldown}s` 
                      : "Resend Verification Email"
                    }
                  </Button>

                  <Button 
                    onClick={() => navigate("/customer-login")} 
                    variant="ghost" 
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try resending.
                  <br />
                  You can resend up to 3 times within 24 hours.
                </p>

                {devToken && (
                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Not receiving the email? You can verify your account directly using the button below.
                    </p>
                    <Button
                      onClick={() => navigate(`/verify-email?token=${encodeURIComponent(devToken)}`)}
                      variant="secondary"
                      className="w-full"
                    >
                      Verify Directly
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
