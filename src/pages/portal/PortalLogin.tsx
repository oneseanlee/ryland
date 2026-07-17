import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoDark from "@/assets/logo-dark.png";
import PageMeta from "@/components/PageMeta";

export default function PortalLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError("Invalid email or password. Please try again.");
    } else {
      // Always navigate to portal — AdminGuard handles admin routing separately
      navigate("/portal", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <PageMeta
        title="Partner Login | Ryland Partners"
        description="Log in to the Ryland Partners affiliate portal to manage your referrals, commissions, and resources."
        noindex
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logoDark} alt="Ryland Partners" className="h-8" />
        </div>

        <Card className="border-border/60 shadow-lg shadow-black/[0.03]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">Partner Portal</CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in to access your affiliate dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>

              <button
                type="button"
                disabled={forgotLoading}
                onClick={async () => {
                  if (!email) {
                    setError("Enter your email address, then click Forgot Password.");
                    return;
                  }
                  setForgotLoading(true);
                  setError("");
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  setForgotLoading(false);
                  if (resetError) {
                    setError("Unable to send reset email. Please try again.");
                  } else {
                    toast({ title: "Check your email", description: "We sent a password reset link to your inbox." });
                  }
                }}
                className="w-full text-sm text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
              >
                {forgotLoading ? "Sending..." : "Forgot password?"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Don't have an account?{" "}
              <a href="/partners" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Apply to become a partner
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
