import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CopyFieldProps {
  label: string;
  value: string | number | null | undefined;
  format?: "currency" | "phone" | "ssn" | "date" | "default";
  className?: string;
  isMasked?: boolean;
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value;
}

function formatSSN(value: string | null | undefined): string {
  if (!value) return "—";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return value;
}

function maskSSN(value: string | null | undefined): string {
  if (!value) return "—";
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length === 9) {
    return `***-**-${cleaned.slice(5)}`;
  }
  return "***-**-****";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function getDisplayValue(
  value: string | number | null | undefined,
  format: CopyFieldProps["format"],
  masked: boolean
): string {
  if (value === null || value === undefined || value === "") return "—";

  switch (format) {
    case "currency":
      return formatCurrency(value as number);
    case "phone":
      return formatPhone(String(value));
    case "ssn":
      return masked ? maskSSN(String(value)) : formatSSN(String(value));
    case "date":
      return formatDate(String(value));
    default:
      return String(value);
  }
}

function getCopyValue(
  value: string | number | null | undefined,
  format: CopyFieldProps["format"]
): string {
  if (value === null || value === undefined || value === "") return "";

  switch (format) {
    case "currency":
      return formatCurrency(value as number);
    case "phone":
      return formatPhone(String(value));
    case "ssn":
      return formatSSN(String(value));
    case "date":
      return formatDate(String(value));
    default:
      return String(value);
  }
}

export function CopyField({
  label,
  value,
  format = "default",
  className = "",
  isMasked = false,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const { toast } = useToast();

  const displayValue = getDisplayValue(value, format, isMasked && !revealed);
  const copyValue = getCopyValue(value, format);
  const hasValue = value !== null && value !== undefined && value !== "";

  const handleCopy = async () => {
    if (!hasValue) return;

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const toggleReveal = () => {
    setRevealed(!revealed);
  };

  return (
    <div className={`group flex items-center justify-between py-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate">
          {displayValue}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-2 print:hidden">
        {isMasked && hasValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={toggleReveal}
            title={revealed ? "Hide" : "Reveal"}
          >
            {revealed ? (
              <EyeOff className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <Eye className="h-3.5 w-3.5 text-slate-400" />
            )}
          </Button>
        )}
        {hasValue && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-400" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
