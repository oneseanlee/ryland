import { useState } from "react";
import { z } from "zod";
import logoWhite from "@/assets/logo-white.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Shield, MessageSquare, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import PageMeta from "@/components/PageMeta";
import { motion } from "framer-motion";

const CONSENT_TEXT =
  "By checking this box, I agree to receive recurring automated promotional and informational text messages (e.g., updates, offers, alerts) from Ryland Partners at the phone number provided. Consent is not a condition of purchase. Message frequency varies. Message and data rates may apply. Reply STOP to cancel at any time. Reply HELP for help.";

const optInSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20)
    .regex(/^[+\d\s().-]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
  consent: z.literal(true, {
    errorMap: () => ({ message: "You must agree to receive text messages" }),
  }),
});

type OptInFormData = z.infer<typeof optInSchema>;

export default function OptIn() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<OptInFormData>({
    resolver: zodResolver(optInSchema),
    defaultValues: { name: "", phone: "", email: "", consent: undefined as unknown as true },
  });

  const onSubmit = async (data: OptInFormData) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("sms_opt_ins").insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        consent_text: CONSENT_TEXT,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="SMS Opt-In | Ryland Partners"
        description="Sign up to receive text messages from Ryland Partners with exclusive updates, tips, and offers on business education and financial literacy."
        noindex
      />

      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <img src={logoWhite} alt="Ryland Partners" className="h-10 w-auto mx-auto mb-6" />
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-5">
              <MessageSquare className="w-7 h-7 text-blue-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-manrope tracking-tight">
              Stay In The Loop
            </h1>
            <p className="text-slate-400 mt-3 text-base max-w-sm mx-auto leading-relaxed">
              Get exclusive business education tips, funding updates, and financial literacy resources delivered straight to your phone.
            </p>
          </div>

          {/* Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center py-8 gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white font-manrope">You're Subscribed!</h2>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                  You'll start receiving text messages from Ryland Partners. Reply STOP at any time to unsubscribe.
                </p>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John Doe"
                            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                              {...field}
                              type="tel"
                              placeholder="(555) 123-4567"
                              className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-12 pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">
                          Email <span className="text-slate-500 normal-case">(optional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john@example.com"
                            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 h-12"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* A2P Consent Checkbox */}
                  <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="mt-0.5 border-slate-600 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                            />
                          </FormControl>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {CONSENT_TEXT}{" "}
                            View our{" "}
                            <Link
                              to="/privacy-policy"
                              className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
                            >
                              Privacy Policy
                            </Link>{" "}
                            and{" "}
                            <Link
                              to="/terms-of-service"
                              className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors"
                            >
                              Terms of Service
                            </Link>
                            .
                          </p>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="shiny-cta !py-3.5 !px-10 !text-base w-full mt-2"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {submitting ? "Subscribing..." : "Subscribe to Updates"}
                    </span>
                  </button>
                </form>
              </Form>
            )}
          </div>

          {/* Compliance Footer */}
          <div className="mt-6 space-y-3 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-xs">Your information is secure and never shared</span>
            </div>
            <div className="text-[11px] text-slate-600 leading-relaxed max-w-sm mx-auto">
              <p>
                <strong className="text-slate-500">Ryland Partners</strong> · St. Petersburg, Florida ·{" "}
                <a href="tel:+17867061479" className="hover:text-slate-400 transition-colors">
                  (786) 706-1479
                </a>{" "}
                ·{" "}
                <a href="mailto:info@rylandpartners.com" className="hover:text-slate-400 transition-colors">
                  info@rylandpartners.com
                </a>
              </p>
              <p className="mt-1.5">
                Message frequency varies. Message &amp; data rates may apply. Reply STOP to unsubscribe. Reply HELP for
                help.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600">
              <Link to="/privacy-policy" className="hover:text-slate-400 transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link to="/terms-of-service" className="hover:text-slate-400 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
}
