import { useState, useEffect, useCallback } from "react";
import { format, startOfMonth, endOfMonth, addMonths, isBefore, startOfDay } from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";

// Use direct fetch instead of supabase.functions.invoke() to avoid SDK AbortError
async function invokeEdgeFunction(name: string, body: Record<string, unknown>) {
  const url = `${SUPABASE_URL}/functions/v1/${name}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        "apikey": SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error("Edge function error:", err);
    throw err;
  }
}
import { ArrowLeft, CheckCircle2, Loader2, Clock, CalendarDays, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Step = "select" | "details" | "confirmed";

interface SlotMap {
  [date: string]: { slots: string[] };
}

interface ConsultationCalendarProps {
  calendarType?: "consultation" | "partner" | "affiliate";
  prefillFromKey?: string;
}

export default function ConsultationCalendar({
  calendarType = "consultation",
  prefillFromKey = "funnel_lead",
}: ConsultationCalendarProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isFunnel = location.pathname.startsWith("/funnel");
  const [step, setStep] = useState<Step>("select");
  const [month, setMonth] = useState(startOfMonth(new Date()));
  const [slots, setSlots] = useState<SlotMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [name, setName] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(prefillFromKey) || "{}").name || ""; } catch { return ""; }
  });
  const [email, setEmail] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(prefillFromKey) || "{}").email || ""; } catch { return ""; }
  });
  const [phone, setPhone] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(prefillFromKey) || "{}").phone || ""; } catch { return ""; }
  });
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fetchSlots = useCallback(async (monthStart: Date) => {
    setLoading(true);
    setError(null);
    try {
      const start = startOfMonth(monthStart);
      const end = endOfMonth(monthStart);
      const data = await invokeEdgeFunction("ghl-calendar", {
        action: "get-slots",
        startDate: start.getTime(),
        endDate: end.getTime(),
        timezone,
        calendarType,
      });
      const slotData: SlotMap = data || {};
      setSlots(slotData);
    } catch (e: unknown) {
      console.error("Failed to fetch slots:", e);
      setError("Unable to load availability. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [timezone, calendarType]);

  useEffect(() => {
    fetchSlots(month);
  }, [month, fetchSlots]);

  const availableDates = new Set(
    Object.entries(slots)
      .filter(([, v]) => v.slots && v.slots.length > 0)
      .map(([k]) => k)
  );

  const today = startOfDay(new Date());

  const isDayDisabled = (date: Date) => {
    if (isBefore(date, today)) return true;
    const key = format(date, "yyyy-MM-dd");
    return !availableDates.has(key);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const timeSlotsForDate = selectedDate
    ? slots[format(selectedDate, "yyyy-MM-dd")]?.slots || []
    : [];

  const formatSlotTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const handleBook = async () => {
    if (!name.trim() || !email.trim() || !selectedSlot) return;
    setBooking(true);
    setError(null);

    try {
      const startTime = selectedSlot;
      const endDate = new Date(new Date(selectedSlot).getTime() + 30 * 60 * 1000);
      const endTime = endDate.toISOString();

      const data = await invokeEdgeFunction("ghl-calendar", {
        action: "book",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        startTime,
        endTime,
        timezone,
        calendarType,
      });
      if (data?.error) throw new Error(data.error);
      if (!isFunnel && selectedDate && selectedSlot) {
        navigate("/booking-confirmed", {
          state: {
            date: format(selectedDate, "EEEE, MMMM d, yyyy"),
            time: formatSlotTime(selectedSlot),
            name: name.trim(),
          },
        });
      } else {
        setStep("confirmed");
      }
    } catch (e: unknown) {
      console.error("Booking failed:", e);
      setError("Booking failed. Please try again or contact us directly.");
    } finally {
      setBooking(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center gap-2 px-6 pt-5 pb-2">
      {[
        { key: "select", icon: CalendarDays, label: "Date & Time" },
        { key: "details", icon: User, label: "Details" },
      ].map((s, i) => {
        const steps: Step[] = ["select", "details", "confirmed"];
        const currentIdx = steps.indexOf(step);
        const thisIdx = i;
        const isActive = thisIdx === currentIdx;
        const isDone = thisIdx < currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div className={cn("w-6 h-px", isDone ? "bg-cyan-400" : "bg-white/10")} />
            )}
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 transition-colors",
                isActive && "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30",
                isDone && "bg-cyan-500/10 text-cyan-400",
                !isActive && !isDone && "bg-white/5 text-white/30"
              )}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40 border border-white/10"
      style={{
        background: "linear-gradient(180deg, hsl(210 100% 8%) 0%, hsl(210 100% 14%) 100%)",
      }}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h3 className="text-lg font-bold text-white font-[Geist,sans-serif]">
          Book Your Free Strategy Session
        </h3>
        <p className="text-blue-200/50 text-sm mt-1">Choose a time that works for you</p>
      </div>

      {step !== "confirmed" && stepIndicator}

      <AnimatePresence mode="wait">
        {/* ── STEP 1: DATE & TIME SIDE-BY-SIDE ── */}
        {step === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col p-4"
          >
            {loading ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-8 w-48 bg-white/5" />
                <Skeleton className="h-64 w-full bg-white/5" />
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-400 text-sm mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-white/70 hover:bg-white/5"
                  onClick={() => fetchSlots(month)}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 flex-1">
                {/* Calendar */}
                <div className="lg:border-r lg:border-white/10 lg:pr-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    month={month}
                    onMonthChange={(m) => setMonth(startOfMonth(m))}
                    disabled={isDayDisabled}
                    fromDate={today}
                    toDate={endOfMonth(addMonths(today, 2))}
                    className="p-3 pointer-events-auto mx-auto"
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-7 w-7 bg-white/5 border border-white/10 rounded-md p-0 text-white/60 hover:text-white hover:bg-white/10 inline-flex items-center justify-center",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-blue-200/40 rounded-md w-9 font-normal text-[0.8rem]",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal rounded-md text-white/70 hover:bg-white/10 hover:text-white inline-flex items-center justify-center transition-colors aria-selected:opacity-100",
                      day_range_end: "day-range-end",
                      day_selected:
                        "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 hover:text-cyan-200",
                      day_today: "bg-cyan-500/10 text-cyan-300 border border-cyan-400/20",
                      day_outside: "day-outside text-white/20 opacity-50",
                      day_disabled: "text-white/10 opacity-30 hover:bg-transparent hover:text-white/10 cursor-not-allowed",
                      day_range_middle: "aria-selected:bg-white/5 aria-selected:text-white/70",
                      day_hidden: "invisible",
                    }}
                  />
                </div>

                {/* Time Slots */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-white">
                      {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
                    </span>
                  </div>

                  {!selectedDate ? (
                    <p className="text-white/30 text-sm text-center py-8">← Pick a date to see times</p>
                  ) : timeSlotsForDate.length === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">No slots available for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1 flex-1">
                      {timeSlotsForDate.map((slot) => (
                        <Button
                          key={slot}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-sm border-white/10 transition-all",
                            selectedSlot === slot
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30"
                              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          )}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatSlotTime(slot)}
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedSlot && (
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 border-0"
                      onClick={() => setStep("details")}
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STEP 2: DETAILS ── */}
        {step === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="p-6 space-y-4 flex-1"
          >
            <button
              onClick={() => setStep("select")}
              className="flex items-center gap-1 text-sm text-blue-200/50 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedDate && format(selectedDate, "MMM d")} at{" "}
              {selectedSlot && formatSlotTime(selectedSlot)}
            </button>

            <div className="space-y-3">
              <div>
                <Label htmlFor="cal-name" className="text-white/70 text-sm">
                  Full Name *
                </Label>
                <Input
                  id="cal-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Smith"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-400/40"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="cal-email" className="text-white/70 text-sm">
                  Email *
                </Label>
                <Input
                  id="cal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-400/40"
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="cal-phone" className="text-white/70 text-sm">
                  Phone
                </Label>
                <Input
                  id="cal-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-400/40"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="cal-notes" className="text-white/70 text-sm">
                  Anything we should know?
                </Label>
                <Textarea
                  id="cal-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Current credit score, funding goals, etc."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-cyan-400/40"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <Button
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 border-0"
              disabled={!name.trim() || !email.trim() || booking}
              onClick={handleBook}
            >
              {booking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Booking…
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </motion.div>
        )}

        {/* ── STEP 3: CONFIRMED ── */}
        {step === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 text-center space-y-4 flex-1 flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            >
              <CheckCircle2 className="w-16 h-16 text-cyan-400 mx-auto" />
            </motion.div>
            <h4 className="text-xl font-bold text-white">You're Booked!</h4>
            <p className="text-blue-200/60 text-sm max-w-xs mx-auto">
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")} at{" "}
              {selectedSlot && formatSlotTime(selectedSlot)}
            </p>
            <p className="text-white/30 text-xs">
              Check your email for confirmation details. We look forward to speaking with you!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
