import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const partnerSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required").max(50),
    last_name: z.string().trim().min(1, "Last name is required").max(50),
    email: z.string().trim().email("Enter a valid email").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirm_password: z.string(),
    phone: z.string().trim().max(20).optional().or(z.literal("")),
    business_name: z.string().trim().max(100).optional().or(z.literal("")),
    referral_source: z.string().trim().max(200).optional().or(z.literal("")),
    message: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerSignupFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PartnerSignupForm({ open, onOpenChange }: PartnerSignupFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      phone: "",
      business_name: "",
      referral_source: "",
      message: "",
    },
  });

  const onSubmit = async (data: PartnerFormData) => {
    setSubmitting(true);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("create-partner-account", {
        body: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          business_name: data.business_name || undefined,
          referral_source: data.referral_source || undefined,
          message: data.message || undefined,
        },
      });

      if (fnError) {
        let message = "Please try again later.";
        try {
          const context = (fnError as any).context;
          if (context && typeof context.json === "function") {
            const body = await context.json();
            if (body?.error) message = body.error;
          }
        } catch {
          // ignore
        }
        toast({ title: "Unable to create account", description: message, variant: "destructive" });
        return;
      }

      if (result?.error) {
        toast({ title: "Unable to create account", description: result.error, variant: "destructive" });
        return;
      }

      setSubmitted(true);
    } catch {
      toast({ title: "Something went wrong", description: "Please check your connection and try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setTimeout(() => {
        setSubmitted(false);
        form.reset();
      }, 300);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-slate-950 border-slate-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight font-manrope">
            {submitted ? "You're In! 🎉" : "Become A Partner"}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {submitted
              ? "Your partner account is ready — you can log in with the password you just set."
              : "Fill out the form below and our team will get you set up — it's 100% free."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center py-6 gap-5">
            <p className="text-slate-300 text-center text-sm max-w-xs">
              Head to the partner portal and sign in with your email and password to access your dashboard and referral link.
            </p>
            <a href="/portal/login" className="shiny-cta !py-3 !px-8 !text-sm mt-1">
              <span>Go to Partner Login</span>
            </a>
          </div>
        ) : (
          <Form {...form}>
            <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-xs text-blue-100 leading-relaxed">
              <span className="font-semibold text-blue-200">Heads up:</span> Partners also earn on our{" "}
              <span className="font-semibold">Credit Repair &amp; Credit Optimization</span> services — not just funding. You can refer clients to any of our offerings.
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="first_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">First Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="John" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="last_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Last Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="Doe" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Email *</FormLabel>
                  <FormControl><Input {...field} type="email" autoComplete="email" placeholder="john@example.com" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Password *</FormLabel>
                    <FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="At least 8 characters" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirm_password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Confirm Password *</FormLabel>
                    <FormControl><Input {...field} type="password" autoComplete="new-password" placeholder="Re-enter password" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Phone</FormLabel>
                    <FormControl><Input {...field} placeholder="(555) 123-4567" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="business_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Business Name</FormLabel>
                    <FormControl><Input {...field} placeholder="Your company" className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="referral_source" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">How did you hear about us?</FormLabel>
                  <FormControl><Input {...field} placeholder="Social media, friend, etc." className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-xs uppercase tracking-widest">Anything else?</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Tell us about your network..." rows={3} className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-blue-500 resize-none" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <button type="submit" disabled={submitting} className="shiny-cta !py-3.5 !px-10 !text-base w-full mt-2">
                <span className="flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Creating account..." : "Create Partner Account"}
                </span>
              </button>
              <p className="text-slate-500 text-xs text-center">100% free · No selling required · Uncapped earnings</p>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
