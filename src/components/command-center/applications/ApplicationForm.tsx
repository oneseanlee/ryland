import { useState, useEffect } from "react";
import { Building2, Calendar, Link2, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type {
  Bank,
  ProductType,
  BureauType,
  BureauStatus,
} from "@/hooks/useClientApplications";

interface ApplicationFormProps {
  banks: Bank[];
  bureauStatus: BureauStatus[];
  onSubmit: (data: {
    bankId: string;
    productType: ProductType;
    applicationUrl: string;
    appliedDate: string;
    bureauPulled: BureauType;
    notes: string | null;
  }) => void;
  isSubmitting: boolean;
  trigger?: React.ReactNode;
}

const productTypes: ProductType[] = ["CreditCard", "LOC", "TermLoan"];
const bureaus: BureauType[] = ["Experian", "Equifax", "TransUnion"];

const productTypeLabels: Record<string, string> = {
  CreditCard: "Credit Card",
  LOC: "Line of Credit",
  TermLoan: "Term Loan",
};

export function ApplicationForm({
  banks,
  bureauStatus,
  onSubmit,
  isSubmitting,
  trigger,
}: ApplicationFormProps) {
  const [open, setOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [productType, setProductType] = useState<ProductType | "">("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [appliedDate, setAppliedDate] = useState<Date>(new Date());
  const [bureauPulled, setBureauPulled] = useState<BureauType | "">("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedBank(null);
      setProductType("");
      setApplicationUrl("");
      setAppliedDate(new Date());
      setBureauPulled("");
      setNotes("");
    }
  }, [open]);

  // Auto-populate fields when bank is selected
  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank);
    setBankOpen(false);

    if (bank.product_type) {
      setProductType(bank.product_type);
    }
    if (bank.application_url) {
      setApplicationUrl(bank.application_url);
    }
    if (bank.bureau_pulled) {
      setBureauPulled(bank.bureau_pulled);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !productType || !bureauPulled) return;

    onSubmit({
      bankId: selectedBank.id,
      productType,
      applicationUrl,
      appliedDate: appliedDate.toISOString().split("T")[0],
      bureauPulled,
      notes: notes || null,
    });

    setOpen(false);
  };

  // Check if selected bureau is paused
  const selectedBureauStatus = bureauStatus.find(
    (b) => b.bureau === bureauPulled
  );
  const isBureauPaused = selectedBureauStatus?.is_paused || false;
  const inquiryCount = selectedBureauStatus?.inquiry_count || 0;
  const willBePaused = inquiryCount + 1 >= 2;

  const isFormValid =
    selectedBank && productType && bureauPulled && appliedDate;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Log Application</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Log New Application</DialogTitle>
            <DialogDescription>
              Record a new funding application for this client. The bureau
              inquiry count will be automatically updated.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Bank Selection */}
            <div className="grid gap-2">
              <Label htmlFor="bank">Bank *</Label>
              <Popover open={bankOpen} onOpenChange={setBankOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={bankOpen}
                    className="w-full justify-between"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {selectedBank.name}
                        {selectedBank.product_name && (
                          <span className="text-xs text-slate-500">
                            ({selectedBank.product_name})
                          </span>
                        )}
                      </div>
                    ) : (
                      "Select a bank..."
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search banks..." />
                    <CommandList>
                      <CommandEmpty>No banks found.</CommandEmpty>
                      <CommandGroup>
                        {banks.map((bank) => (
                          <CommandItem
                            key={bank.id}
                            value={bank.name}
                            onSelect={() => handleBankSelect(bank)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{bank.name}</span>
                              {bank.product_name && (
                                <span className="text-xs text-slate-500">
                                  {bank.product_name} •{" "}
                                  {productTypeLabels[bank.product_type || ""] ||
                                    bank.product_type}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Product Type */}
            <div className="grid gap-2">
              <Label htmlFor="product-type">Product Type *</Label>
              <div className="flex flex-wrap gap-2">
                {productTypes.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={productType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProductType(type)}
                  >
                    {productTypeLabels[type]}
                  </Button>
                ))}
              </div>
            </div>

            {/* Application URL */}
            <div className="grid gap-2">
              <Label htmlFor="application-url">Application URL</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="application-url"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                  placeholder="https://..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Applied Date */}
            <div className="grid gap-2">
              <Label htmlFor="applied-date">Applied Date *</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !appliedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {appliedDate ? (
                      format(appliedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={appliedDate}
                    onSelect={(date) => {
                      if (date) {
                        setAppliedDate(date);
                        setCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Bureau Pulled */}
            <div className="grid gap-2">
              <Label htmlFor="bureau">Bureau Pulled *</Label>
              <div className="flex flex-wrap gap-2">
                {bureaus.map((bureau) => {
                  const bureauStatusItem = bureauStatus.find(
                    (b) => b.bureau === bureau
                  );
                  const isPaused = bureauStatusItem?.is_paused || false;
                  const count = bureauStatusItem?.inquiry_count || 0;

                  return (
                    <Button
                      key={bureau}
                      type="button"
                      variant={bureauPulled === bureau ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBureauPulled(bureau)}
                      className={cn(
                        isPaused &&
                          "border-red-300 text-red-600 hover:bg-red-50"
                      )}
                    >
                      {bureau}
                      {count > 0 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 text-xs"
                        >
                          {count}
                        </Badge>
                      )}
                      {isPaused && (
                        <AlertTriangle className="ml-1 h-3 w-3 text-red-500" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Bureau Warning */}
            {bureauPulled && (
              <div
                className={cn(
                  "rounded-md p-3 text-sm",
                  isBureauPaused
                    ? "bg-red-50 text-red-800 border border-red-200"
                    : willBePaused
                    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                    : "bg-blue-50 text-blue-800 border border-blue-200"
                )}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      {isBureauPaused
                        ? `${bureauPulled} is currently paused`
                        : willBePaused
                        ? `${bureauPulled} will be paused after this application`
                        : `${bureauPulled} inquiry count: ${inquiryCount}`}
                    </p>
                    <p className="text-xs mt-1">
                      {isBureauPaused
                        ? "This bureau has reached the inquiry threshold (2+). Consider completing inquiry removal before applying."
                        : willBePaused
                        ? "This will be the 2nd inquiry for this bureau, which will trigger a pause."
                        : "Bureaus are automatically paused after 2 inquiries to prevent over-exposure."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this application..."
                  className="pl-9 min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Log Application"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
