import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, CheckCircle2, BookOpen, Loader2, Mail } from "lucide-react";
import { motion } from "framer-motion";

interface OrderItem {
  id: string;
  product_title: string;
  download_token?: string; // only present after email verification
  downloaded_at: string | null;
}

interface Order {
  id: string;
  shopify_order_number: string;
  customer_name: string;
  created_at: string;
  order_items: OrderItem[];
}

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");

  // Email verification state
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [order, setOrder] = useState<Order | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollCount = useRef(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 1: On mount, look up the order (without tokens) to confirm it exists
  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async (verifiedEmail?: string) => {
      try {
        const { data, error: fetchErr } = await supabase.functions.invoke(
          "fetch-order",
          { body: { shopify_order_id: orderId, customer_email: verifiedEmail ?? email } }
        );

        if (fetchErr) throw fetchErr;

        if (data?.found && data.order) {
          setOrder(data.order as Order);
          setEmailVerified(!!data.email_verified);
          setLoading(false);
          return;
        }

        // Order not found yet — webhook may still be processing
        pollCount.current += 1;
        if (pollCount.current < MAX_POLL_ATTEMPTS) {
          pollTimer.current = setTimeout(() => fetchOrder(verifiedEmail), POLL_INTERVAL_MS);
        } else {
          setError(
            "Your order is still being processed. Check your email shortly for download links."
          );
          setLoading(false);
        }
      } catch {
        setError("Something went wrong. Check your email for download links.");
        setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Step 2: User submits their email to verify ownership and unlock download tokens
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    setEmailError(null);
    setVerifying(true);

    try {
      const { data, error: fetchErr } = await supabase.functions.invoke(
        "fetch-order",
        { body: { shopify_order_id: orderId, customer_email: emailInput.trim() } }
      );

      if (fetchErr) throw fetchErr;

      if (data?.email_verified && data.order) {
        setEmail(emailInput.trim());
        setOrder(data.order as Order);
        setEmailVerified(true);
      } else {
        setEmailError(
          "That email doesn't match the one used during checkout. Please try again."
        );
      }
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const downloadUrl = (token: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook?token=${token}`;

  return (
    <>
      <PageMeta
        title="Thank You for Your Purchase | Ryland"
        description="Download your purchased e-books immediately."
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Thank You for Your Purchase!
            </h1>
            <p className="text-muted-foreground text-lg">
              {loading
                ? "Loading your downloads…"
                : emailVerified
                ? "Your e-books are ready to download. We've also sent download links to your email."
                : "Verify your email to access your downloads."}
            </p>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preparing your downloads…</p>
            </div>

          ) : error ? (
            <div className="bg-muted rounded-xl p-8 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link to="/my-orders">
                <Button variant="outline">Go to My Downloads</Button>
              </Link>
            </div>

          ) : order && !emailVerified ? (
            /* ── Email verification gate ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-8"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <Mail className="h-10 w-10 text-primary mb-3" />
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  Confirm your email to download
                </h2>
                <p className="text-sm text-muted-foreground">
                  Enter the email address you used at checkout to access your files.
                </p>
              </div>
              <form onSubmit={handleVerifyEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="verify-email">Email address</Label>
                  <Input
                    id="verify-email"
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    autoComplete="email"
                    disabled={verifying}
                  />
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={verifying}>
                  {verifying ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying…</>
                  ) : (
                    "Access My Downloads"
                  )}
                </Button>
              </form>
            </motion.div>

          ) : order && emailVerified ? (
            /* ── Download list (tokens now available) ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-border">
                <p className="text-sm text-muted-foreground">
                  Order #{order.shopify_order_number}
                </p>
                <p className="font-medium text-foreground">
                  Hi {order.customer_name}, here are your downloads:
                </p>
              </div>
              <div className="divide-y divide-border">
                {order.order_items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="p-6 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="font-medium text-foreground truncate">
                        {item.product_title}
                      </span>
                    </div>
                    {item.download_token ? (
                      <a
                        href={downloadUrl(item.download_token)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="gap-2 flex-shrink-0">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="flex-shrink-0">
                        Unavailable
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

          ) : (
            <div className="bg-muted rounded-xl p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No order ID provided. Check your email for download links.
              </p>
              <Link to="/my-orders">
                <Button variant="outline">Go to My Downloads</Button>
              </Link>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/my-orders"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Access your download library anytime →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ThankYou;
