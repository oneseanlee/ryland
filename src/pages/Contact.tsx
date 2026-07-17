import { useState, useEffect } from "react";
import InfiniteGrid from "@/components/ui/infinite-grid";
import HlsVideoBackground from "@/components/HlsVideoBackground";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import PageMeta from "@/components/PageMeta";
import JsonLd, { breadcrumbSchema } from "@/components/JsonLd";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  phone: z.string().trim().max(20, "Phone number too long").optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Please select a subject"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const Contact = () => {
  const [form, setForm] = useState<ContactForm>({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactForm, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactForm, string>> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as keyof ContactForm;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSending(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("contact_submissions" as any).insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        subject: result.data.subject,
        message: result.data.message,
      });
      if (dbError) throw dbError;

      // Fire-and-forget: sync to GoHighLevel
      supabase.functions
        .invoke("ghl-create-contact", {
          body: {
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone || undefined,
            tags: ["contact-form", `subject-${result.data.subject}`],
            source: "Contact Page",
            customFields: {
              contact_subject: result.data.subject,
              contact_message: result.data.message,
            },
          },
        })
        .then(({ error: ghlErr }) => {
          if (ghlErr) console.error("GHL sync failed:", ghlErr);
        });

      setSubmitted(true);
    } catch (err) {
      console.error("Contact submission failed:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-blue-500/30 selection:text-white antialiased text-slate-900">
      <PageMeta title="Contact Us | Ryland Partners" description="Get in touch with Ryland Partners for business funding, credit repair, or partnership inquiries. Our team responds within 24 hours." />
      

      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white pointer-events-none">
        <InfiniteGrid baseGridColor="rgba(148, 163, 184, 0.5)" activeGridColor="rgba(59, 130, 246, 0.8)" />
      </div>

      <Navbar />

      {/* HERO */}
      <section className="relative max-w-7xl mx-4 sm:mx-6 lg:mx-auto mt-4 sm:mt-8 pt-12 sm:pt-16 pb-16 sm:pb-20 px-4 sm:px-8 lg:px-20 overflow-hidden rounded-2xl border border-[#004E8C]">
        <HlsVideoBackground overlay="bg-[#003A70]/90" className="rounded-2xl" />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-[38px] leading-[0.95] sm:text-[52px] lg:text-[64px] font-medium tracking-tighter font-geist mt-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-zinc-500 animate-fade-in-up">
            Let's Build Your Empire Together
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed animate-fade-in-up animate-delay-200">
            Have a question about funding, credit, or partnerships? Our team is ready to help you take the next step.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* LEFT - Contact Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Get in touch</p>
              <h2 className="font-manrope text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">We'd Love To Hear From You</h2>
              <p className="mt-3 text-slate-500 leading-relaxed">Whether you're exploring funding options, interested in our partner program, or just have a quick question — reach out anytime.</p>
            </div>

            {[
              { icon: Mail, title: "Email Us", detail: "info@rylandpartners.com", sub: "We respond within 24 hours" },
              { icon: Phone, title: "Call Us", detail: "(786) 706-1479", sub: "Mon–Fri, 9am–6pm EST" },
              { icon: MapPin, title: "Visit Us", detail: "ST Petersburg, Florida", sub: "By appointment only" },
              { icon: Clock, title: "Business Hours", detail: "Monday – Friday", sub: "9:00 AM – 6:00 PM EST" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-[#004E8C] overflow-hidden relative p-5">
                <HlsVideoBackground overlay="bg-[#003A70]/90" staticOnly />
                <div className="relative z-10 flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/20">
                    <item.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/90 mt-0.5">{item.detail}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT - Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-[#004E8C] overflow-hidden relative">
              <HlsVideoBackground overlay="bg-[#003A70]/90" staticOnly />
              <div className="relative z-10 p-8 md:p-10">
                {submitted ? (
                  <div className="text-center py-16 animate-fade-in-up">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/30">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Message Sent Successfully</h3>
                    <p className="text-zinc-400 max-w-sm mx-auto">Thank you for reaching out. A member of our team will get back to you within 24 hours.</p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); }}
                      className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-white mb-1 font-manrope">Send Us A Message</h3>
                    <p className="text-sm text-zinc-400 mb-8">Fill out the form below and we'll get back to you promptly.</p>
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="name" className="block text-xs font-medium text-zinc-300 mb-1.5">Full Name *</label>
                          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} maxLength={100}
                            className={`w-full rounded-xl bg-white/5 border ${errors.name ? 'border-red-400/60' : 'border-white/10'} px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all`}
                            placeholder="John Smith" />
                          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-xs font-medium text-zinc-300 mb-1.5">Email Address *</label>
                          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} maxLength={255}
                            className={`w-full rounded-xl bg-white/5 border ${errors.email ? 'border-red-400/60' : 'border-white/10'} px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all`}
                            placeholder="john@company.com" />
                          {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label htmlFor="phone" className="block text-xs font-medium text-zinc-300 mb-1.5">Phone Number</label>
                          <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} maxLength={20}
                            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all"
                            placeholder="(555) 123-4567" />
                        </div>
                        <div>
                          <label htmlFor="subject" className="block text-xs font-medium text-zinc-300 mb-1.5">Subject *</label>
                          <select id="subject" name="subject" value={form.subject} onChange={handleChange}
                            className={`w-full rounded-xl bg-white/5 border ${errors.subject ? 'border-red-400/60' : 'border-white/10'} px-4 py-3 text-sm text-white outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all appearance-none`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                          >
                            <option value="" className="bg-slate-900 text-zinc-400">Select a topic...</option>
                            <option value="funding" className="bg-slate-900">Business Funding</option>
                            <option value="credit" className="bg-slate-900">Credit Repair</option>
                            <option value="partner" className="bg-slate-900">Partner Program</option>
                            <option value="community" className="bg-slate-900">Community & Academy</option>
                            <option value="consultation" className="bg-slate-900">Schedule Consultation</option>
                            <option value="other" className="bg-slate-900">Other</option>
                          </select>
                          {errors.subject && <p className="text-xs text-red-400 mt-1">{errors.subject}</p>}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-xs font-medium text-zinc-300 mb-1.5">Message *</label>
                        <textarea id="message" name="message" value={form.message} onChange={handleChange} maxLength={2000} rows={5}
                          className={`w-full rounded-xl bg-white/5 border ${errors.message ? 'border-red-400/60' : 'border-white/10'} px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all resize-none`}
                          placeholder="Tell us how we can help you..." />
                        <div className="flex items-center justify-between mt-1">
                          {errors.message ? <p className="text-xs text-red-400">{errors.message}</p> : <span />}
                          <p className="text-xs text-zinc-500">{form.message.length}/2000</p>
                        </div>
                      </div>

                      <button type="submit" disabled={sending}
                        className="shiny-cta !py-3.5 !px-8 !text-base w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed">
                        <span className="inline-flex items-center gap-2">
                          {sending ? (
                            <>
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
