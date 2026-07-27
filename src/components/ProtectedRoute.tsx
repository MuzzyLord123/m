import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GuardSkeleton } from "@/components/auth/AuthSkeleton";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

interface ProtectedRouteProps {
  children: ReactNode;
  requireVerification?: boolean;
}

export function ProtectedRoute({ children, requireVerification = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <GuardSkeleton message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <>
      {requireVerification && <EmailVerificationBanner />}
      {children}
    </>
  );
}
