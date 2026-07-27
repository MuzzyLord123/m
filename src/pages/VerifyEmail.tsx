import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (verificationToken: string) => {
    try {
      const { data, error } = await supabase.rpc("verify_email_token", {
        p_token: verificationToken
      });

      if (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage("Failed to verify email. Please try again.");
        return;
      }

      const result = data as { success: boolean; error?: string; user_id?: string };

      if (result.success) {
        setStatus("success");
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified.",
        });
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setStatus("error");
      setErrorMessage("An unexpected error occurred");
    }
  };

  const handleResendEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to resend verification email.",
        variant: "destructive",
      });
      navigate("/customer-login");
      return;
    }

    try {
      const response = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, is_resend: true }
      });

      if (response.error) {
        toast({
          title: "Failed to send",
          description: response.error.message || "Could not resend verification email.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Sent",
        description: "A new verification email has been sent. Check your inbox.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "destructive",
      });
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
            <div className="mx-auto mb-4">
              {status === "loading" && (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {status === "success" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                >
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </motion.div>
              )}
              {status === "no-token" && (
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Mail className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardTitle>
              {status === "loading" && "Verifying Email..."}
              {status === "success" && "Thank You for Verifying!"}
              {status === "error" && "Verification Failed"}
              {status === "no-token" && "Verify Your Email"}
            </CardTitle>
            <CardDescription className="text-base">
              {status === "loading" && "Please wait while we verify your email address."}
              {status === "success" && "Your email has been successfully verified."}
              {status === "error" && errorMessage}
              {status === "no-token" && "Click the link in your email to verify your account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
                  <ArrowLeft className="h-6 w-6 mx-auto text-primary" />
                  <p className="text-sm font-medium">
                    Please return to the browser where you were logging in
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your session will automatically sync and log you in.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  You can safely close this tab.
                </p>
              </div>
            )}
            {(status === "error" || status === "no-token") && (
              <>
                <Button onClick={handleResendEmail} variant="outline" className="w-full">
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </Button>
                <Button onClick={() => navigate("/customer-login")} variant="ghost" className="w-full">
                  Back to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
