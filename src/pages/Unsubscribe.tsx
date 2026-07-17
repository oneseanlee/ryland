import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Loader2, MailX, CheckCircle, AlertCircle } from "lucide-react";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "valid" | "already" | "invalid" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <PageMeta title="Unsubscribe | Ryland" description="Manage your email preferences."
        noindex />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-md mx-auto px-4 text-center">
          {status === "loading" && (
            <div className="py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground mt-4">Validating…</p>
            </div>
          )}
          {status === "valid" && (
            <div className="py-16 space-y-6">
              <MailX className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
              <p className="text-muted-foreground">
                Click below to unsubscribe from future emails.
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirm Unsubscribe
              </Button>
            </div>
          )}
          {status === "success" && (
            <div className="py-16 space-y-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">You've been unsubscribed</h1>
              <p className="text-muted-foreground">You will no longer receive emails from us.</p>
            </div>
          )}
          {status === "already" && (
            <div className="py-16 space-y-4">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Already unsubscribed</h1>
              <p className="text-muted-foreground">This email has already been unsubscribed.</p>
            </div>
          )}
          {status === "invalid" && (
            <div className="py-16 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Invalid link</h1>
              <p className="text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
            </div>
          )}
          {status === "error" && (
            <div className="py-16 space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">Please try again later.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Unsubscribe;
