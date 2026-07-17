import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoDark from "@/assets/logo-dark.png";
import PageMeta from "@/components/PageMeta";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let resolved = false;

    // Listen for the PASSWORD_RECOVERY event from the auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (resolved) return;
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        // Either event means we have a valid session from the recovery link
        if (session) {
          resolved = true;
          setSessionReady(true);
        }
      }
    });

    // Fallback: check if there's already an active session (e.g. token was
    // already exchanged before our listener attached). This covers the case
    // where the redirect already completed and the session is stored.
    const checkExistingSession = async () => {
      // Give the auth listener a moment to fire first
      await new Promise((r) => setTimeout(r, 1500));
      if (resolved) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        resolved = true;
        setSessionReady(true);
      } else {
        // Also check the URL hash for tokens that haven't been exchanged
        const hash = window.location.hash;
        if (hash && (hash.includes("access_token") || hash.includes("type=recovery"))) {
          // Token is in the URL but wasn't auto-exchanged — wait a bit more
          await new Promise((r) => setTimeout(r, 3000));
          if (resolved) return;
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            resolved = true;
            setSessionReady(true);
            return;
          }
        }
        // After all retries, show expiration message
        if (!resolved) {
          setExpired(true);
        }
      }
    };

    checkExistingSession();

    return () => {
      resolved = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "Failed to set password. Please try again.");
      return;
    }

    setSuccess(true);
    toast({ title: "Password set successfully!", description: "You can now log in to your portal." });

    setTimeout(() => {
      navigate("/portal/login", { replace: true });
    }, 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <PageMeta
        title="Set Your Password | Ryland Partners"
        description="Create your portal password to access the Ryland Partners affiliate dashboard."
        noindex
      />

      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logoDark} alt="Ryland Partners" className="h-8" />
        </div>

        <Card className="border-border/60 shadow-lg shadow-black/[0.03]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {success ? "You're All Set!" : "Create Your Password"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {success
                ? "Your password has been set. Redirecting you to login..."
                : expired
                  ? "Your reset link has expired or is invalid."
                  : "Set a password to access your partner portal."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center py-6 gap-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting to login...
                </p>
              </div>
            ) : expired ? (
              <div className="flex flex-col items-center py-8 gap-4">
                <p className="text-sm text-muted-foreground text-center">
                  Please request a new password reset link from the login page.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/portal/login", { replace: true })}
                >
                  Go to Login
                </Button>
              </div>
            ) : !sessionReady ? (
              <div className="flex flex-col items-center py-8 gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  Verifying your link...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="pl-10"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="pl-10"
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Set Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
