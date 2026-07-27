import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VerificationStatus {
  isVerified: boolean | null;
  isLoading: boolean;
  error: string | null;
}

export function useEmailVerification() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VerificationStatus>({
    isVerified: null,
    isLoading: true,
    error: null,
  });

  const checkVerification = useCallback(async () => {
    if (!user) {
      setStatus({ isVerified: null, isLoading: false, error: null });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("email_verified")
        .eq("user_id", user.id)
        .single();

      if (error) {
        setStatus({ isVerified: null, isLoading: false, error: error.message });
        return;
      }

      setStatus({ 
        isVerified: data?.email_verified ?? false, 
        isLoading: false, 
        error: null 
      });
    } catch (err) {
      setStatus({ 
        isVerified: null, 
        isLoading: false, 
        error: "Failed to check verification status" 
      });
    }
  }, [user]);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  const sendVerificationEmail = async (isResend = false) => {
    if (!user) {
      return { success: false, error: "Not logged in" };
    }

    try {
      const response = await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, is_resend: isResend }
      });

      if (response.error) {
        return { success: false, error: response.error.message || "Failed to send email" };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: "Failed to send verification email" };
    }
  };

  const refreshStatus = () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    checkVerification();
  };

  return {
    ...status,
    sendVerificationEmail,
    refreshStatus,
  };
}
