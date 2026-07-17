import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import logoDark from "@/assets/logo-dark.png";
import PageMeta from "@/components/PageMeta";

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const CREDIT_MONITORING_OPTIONS = [
  { value: "identityiq", label: "IdentityIQ" },
  { value: "smartcredit", label: "SmartCredit" },
  { value: "privacyguard", label: "Privacy Guard" },
  { value: "myscoreiq", label: "My Score IQ" },
  { value: "none", label: "I don't have one yet" },
];

const step1Schema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(50),
  middleName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().min(1, "Last name is required").max(50),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  dob: z.string().min(1, "Date of birth is required"),
});

const step2Schema = z.object({
  ssn: z.string().min(9, "Enter a valid SSN (9 digits)").max(11),
  creditMonitoring: z.string().min(1, "Select a credit monitoring service"),
});

const step3Schema = z.object({
  street: z.string().trim().min(1, "Street address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().min(1, "Select a state"),
  zip: z.string().trim().min(5, "Enter a valid ZIP code").max(10),
});

const STEPS_META = [
  { icon: User, title: "Personal Information", subtitle: "Let's start with your basic details." },
  { icon: Shield, title: "Credit Information", subtitle: "This is transmitted securely and never stored." },
  { icon: MapPin, title: "Your Address", subtitle: "We need your current mailing address." },
];

export default function CreditIntake() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [showSsn, setShowSsn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    ssn: "",
    creditMonitoring: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  const update = (key: string, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const progress = done ? 100 : ((step + 1) / 4) * 100;

  const validateStep = () => {
    setErrors({});
    const schemas = [step1Schema, step2Schema, step3Schema];
    const stepData =
      step === 0
        ? { firstName: form.firstName, middleName: form.middleName, lastName: form.lastName, email: form.email, phone: form.phone, dob: form.dob }
        : step === 1
        ? { ssn: form.ssn.replace(/[^0-9]/g, ""), creditMonitoring: form.creditMonitoring }
        : { street: form.street, city: form.city, state: form.state, zip: form.zip };

    const result = schemas[step].safeParse(stepData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errs[e.path[0] as string] = e.message;
      });
      setErrors(errs);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    try {
      const ssnDigits = form.ssn.replace(/[^0-9]/g, "");
      const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");

      const result = await callEdgeFunction("scorexer-intake", {
        firstName: form.firstName,
        middleName: form.middleName || "",
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        dob: form.dob,
        ssn: ssnDigits,
        creditMonitoring: form.creditMonitoring,
        street: form.street,
        city: form.city,
        state: form.state,
        zip: form.zip,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      setDone(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] via-white to-[#f1f5f9] font-[Inter,sans-serif]">
      <PageMeta
        title="Client Intake | Ryland Partners"
        description="Complete your client intake form to get started with credit restoration."
        noindex
      />
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={logoDark} alt="Ryland Partners" className="h-7 w-auto" />
          </a>
          <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
            Client Intake
          </span>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        {!done && (
          <p className="text-xs text-slate-400 mt-2 text-right font-medium">
            Step {step + 1} of 3
          </p>
        )}
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <h1 className="sr-only">Client Intake Form</h1>
        <AnimatePresence mode="wait">
          {!done && (
            <motion.div
              key={`step-${step}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {/* Step Header */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const Icon = STEPS_META[step].icon;
                    return <Icon className="w-7 h-7 text-blue-600" />;
                  })()}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[Geist,sans-serif] tracking-tight">
                  {STEPS_META[step].title}
                </h2>
                <p className="text-slate-500 mt-2 text-sm sm:text-base">
                  {STEPS_META[step].subtitle}
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (step < 2) handleNext();
                  else handleSubmit(e);
                }}
                className="space-y-4"
              >
                {/* Step 1: Personal Info */}
                {step === 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { key: "firstName", label: "First Name", placeholder: "Gene", required: true },
                        { key: "middleName", label: "Middle Name", placeholder: "(optional)", required: false },
                        { key: "lastName", label: "Last Name", placeholder: "Ryland", required: true },
                      ].map((f) => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">{f.label}</label>
                          <input
                            type="text"
                            placeholder={f.placeholder}
                            value={form[f.key as keyof typeof form]}
                            onChange={(e) => update(f.key, e.target.value)}
                            className={inputClass}
                          />
                          {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]}</p>}
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        placeholder="you@email.com"
                        value={form.email}
                        onChange={(e) => update("email", e.target.value)}
                        className={inputClass}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Cell Phone</label>
                      <input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={form.phone}
                        onChange={(e) => update("phone", formatPhone(e.target.value))}
                        className={inputClass}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => update("dob", e.target.value)}
                        className={inputClass}
                      />
                      {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                    </div>
                  </>
                )}

                {/* Step 2: Sensitive Info */}
                {step === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Social Security Number</label>
                      <div className="relative">
                        <input
                          type={showSsn ? "text" : "password"}
                          placeholder="XXX-XX-XXXX"
                          value={form.ssn}
                          onChange={(e) => update("ssn", formatSSN(e.target.value))}
                          className={inputClass}
                          autoComplete="off"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSsn(!showSsn)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showSsn ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.ssn && <p className="text-red-500 text-xs mt-1">{errors.ssn}</p>}
                      <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Encrypted & transmitted securely. Never stored.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Credit Monitoring Service
                      </label>
                      <div className="space-y-2">
                        {CREDIT_MONITORING_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => update("creditMonitoring", opt.value)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                              form.creditMonitoring === opt.value
                                ? "border-blue-500 bg-blue-50/60"
                                : "border-slate-200 bg-white hover:border-blue-300"
                            }`}
                          >
                            <span className={`font-medium text-sm ${form.creditMonitoring === opt.value ? "text-blue-700" : "text-slate-800"}`}>
                              {opt.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.creditMonitoring && (
                        <p className="text-red-500 text-xs mt-1">{errors.creditMonitoring}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Step 3: Address */}
                {step === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Street Address</label>
                      <input
                        type="text"
                        placeholder="123 Main Street"
                        value={form.street}
                        onChange={(e) => update("street", e.target.value)}
                        className={inputClass}
                      />
                      {errors.street && <p className="text-red-500 text-xs mt-1">{errors.street}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                        <input
                          type="text"
                          placeholder="City"
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          className={inputClass}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                        <select
                          value={form.state}
                          onChange={(e) => update("state", e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Select</option>
                          {US_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP Code</label>
                        <input
                          type="text"
                          placeholder="12345"
                          value={form.zip}
                          onChange={(e) => update("zip", e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))}
                          className={inputClass}
                        />
                        {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Navigation */}
                <div className="flex items-center gap-3 pt-2">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => { setErrors({}); setStep((s) => s - 1); }}
                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="shiny-cta flex-1 !text-base !py-4 disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {step < 2
                        ? <>Continue <ChevronRight className="w-4 h-4" /></>
                        : submitting
                        ? "Submitting..."
                        : <>Submit <ArrowRight className="w-4 h-4" /></>}
                    </span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center mt-2">
                  Your information is encrypted and transmitted securely.
                </p>
              </form>
            </motion.div>
          )}

          {/* Success */}
          {done && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[Geist,sans-serif] tracking-tight mb-3">
                You're All Set!
              </h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-md mx-auto">
                Your information has been submitted successfully. Our team will begin setting up your credit restoration profile. You'll receive a confirmation email shortly.
              </p>
              <div className="mt-8">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Return to Home <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
