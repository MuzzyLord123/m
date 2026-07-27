import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

type Props = {
  initialEmail?: string;
  className?: string;
};

function isProbablyEmail(value: string) {
  const v = value.trim();
  return v.length >= 5 && v.includes("@") && v.includes(".");
}

export function ResendVerificationEmailForm({ initialEmail, className }: Props) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [isSending, setIsSending] = useState(false);

  const canSend = useMemo(() => isProbablyEmail(email) && !isSending, [email, isSending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isProbablyEmail(email) || isSending) return;

    setIsSending(true);
    try {
      // Email-only resend: works even when the user isn't signed in.
      // Always show generic success messaging to avoid user enumeration.
      await supabase.functions.invoke("send-verification-email", {
        body: { email: email.trim(), is_resend: true },
      });
    } catch (err) {
      // Intentionally swallow errors for generic UX; backend already logs details.
      console.error("Resend verification email failed:", err);
    } finally {
      toast.success(
        "If an account exists for this email and is not verified, a verification email has been sent."
      );
      setIsSending(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Resend verification email</h2>
      </div>

      <form onSubmit={handleSend} className="space-y-2">
        <div className="space-y-2">
          <Label htmlFor="resend-email" className="text-xs text-muted-foreground">
            Email
          </Label>
          <Input
            id="resend-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSending}
          />
        </div>

        <Button type="submit" variant="secondary" className="w-full" disabled={!canSend}>
          {isSending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Sending…
            </span>
          ) : (
            "Resend verification email"
          )}
        </Button>
      </form>
    </div>
  );
}
