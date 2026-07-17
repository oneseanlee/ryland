import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, BookOpen, Loader2, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  product_title: string;
  shopify_product_handle: string;
  download_token: string;
  downloaded_at: string | null;
}

interface Order {
  id: string;
  shopify_order_number: string;
  customer_name: string;
  created_at: string;
  order_items: OrderItem[];
}

const MyOrders = () => {
  const [step, setStep] = useState<"email" | "code" | "library">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const downloadUrl = (token: string) =>
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-ebook?token=${token}`;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-orders", {
        body: { email: email.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success("Verification code sent to your email!");
        setStep("code");
      }
    } catch {
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-orders", {
        body: { email: email.trim(), code: code.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setOrders(data.orders || []);
        setStep("library");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="My Downloads | Ryland"
        description="Access your purchased e-books and digital products."
        noindex
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              My Downloads
            </h1>
            <p className="text-muted-foreground">
              Access your purchased e-books anytime.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.form
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSendCode}
                className="bg-card border border-border rounded-xl p-8 space-y-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Enter your email address
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  We'll send you a verification code to access your downloads.
                </p>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-base"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Verification Code
                </Button>
              </motion.form>
            )}

            {step === "code" && (
              <motion.form
                key="code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleVerifyCode}
                className="bg-card border border-border rounded-xl p-8 space-y-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Enter verification code
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
                <Input
                  type="text"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify & View Downloads
                </Button>
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Use a different email
                </button>
              </motion.form>
            )}

            {step === "library" && (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {orders.length === 0 ? (
                  <div className="bg-muted rounded-xl p-8 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No purchases found for this email address.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-border bg-muted/50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              Order #{order.shopify_order_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="divide-y divide-border">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">
                                  {item.product_title}
                                </span>
                              </div>
                              <a
                                href={downloadUrl(item.download_token)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" variant="outline" className="gap-2 flex-shrink-0">
                                  <Download className="h-3 w-3" />
                                  Download
                                </Button>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setStep("email");
                        setEmail("");
                        setCode("");
                        setOrders([]);
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
                    >
                      <ArrowLeft className="h-3 w-3" /> Look up a different email
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default MyOrders;
