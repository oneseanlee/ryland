import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Printer, Check, User, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClient } from "@/hooks/useClient";
import { useToast } from "@/hooks/use-toast";
import { CopyField } from "@/components/command-center/quick-info/CopyField";
import {
  AddressBlock,
  formatAddressLine,
} from "@/components/command-center/quick-info/AddressBlock";
import { useState } from "react";

// Address interface matching the one in useClient.ts
interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
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

export default function QuickInfoCard() {
  const { id } = useParams<{ id: string }>();
  const { data: clientData, isLoading, error } = useClient(id);
  const { toast } = useToast();
  const [copiedAll, setCopiedAll] = useState(false);

  // Generate structured text for "Copy All" functionality
  const generateAllInfoText = (): string => {
    if (!clientData) return "";

    const { assignments, primary_assignment, ...client } = clientData;
    const homeAddress = client.home_address as Address | null;
    const businessAddress = client.company_address as Address | null;

    return `PERSONAL INFORMATION
Full Name: ${client.full_name || "—"}
DOB: ${formatDate(client.dob)}
SSN: ${formatSSN(client.ssn_encrypted)}
Home Address: ${homeAddress ? formatAddressLine(homeAddress) : "—"}
Phone: ${formatPhone(client.phone)}
Email: ${client.email || "—"}
Personal Income: ${formatCurrency(client.personal_income)}

BUSINESS INFORMATION
Company: ${client.company_name || "—"}
Business Address: ${businessAddress ? formatAddressLine(businessAddress) : "—"}
Business Phone: ${formatPhone(client.company_phone)}
EIN: ${client.ein || "—"}
DUNS: ${client.duns || "—"}
Website: ${client.website || "—"}
Annual Revenue: ${formatCurrency(client.business_revenue)}
Monthly Deposits: ${formatCurrency(client.monthly_deposits)}`;
  };

  const handleCopyAll = async () => {
    const text = generateAllInfoText();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      toast({
        title: "Copied!",
        description: "All client information copied to clipboard",
      });

      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  // Error state
  if (error || !clientData) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to load client
          </h2>
          <p className="text-slate-500">
            {error?.message || "Client not found"}
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/command-center/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { assignments, primary_assignment, ...client } = clientData;

  return (
    <div className="space-y-6 max-w-4xl mx-auto print:max-w-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="mb-2 -ml-2 text-slate-600"
          >
            <Link to={`/command-center/clients/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Client Detail
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">
            {client.full_name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            className="gap-2"
          >
            {copiedAll ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                Copied All
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy All
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block print:mb-8">
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {client.full_name}
          </h1>
          <p className="text-slate-600 mt-1">Client Quick Info Card</p>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-8">
        {/* Personal Information Section */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="pb-3 print:pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600 print:hidden" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <CopyField label="Full Legal Name" value={client.full_name} />
            <Separator />
            <CopyField
              label="Date of Birth"
              value={client.dob}
              format="date"
            />
            <Separator />
            <CopyField
              label="SSN"
              value={client.ssn_encrypted}
              format="ssn"
              isMasked
            />
            <Separator />
            <AddressBlock
              label="Home Address"
              address={client.home_address as Address | null}
            />
            <Separator />
            <CopyField
              label="Personal Phone"
              value={client.phone}
              format="phone"
            />
            <Separator />
            <CopyField label="Personal Email" value={client.email} />
            <Separator />
            <CopyField
              label="Stated Personal Income"
              value={client.personal_income}
              format="currency"
            />
          </CardContent>
        </Card>

        {/* Business Information Section */}
        <Card className="print:border-0 print:shadow-none">
          <CardHeader className="pb-3 print:pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600 print:hidden" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <CopyField
              label="Company Legal Name"
              value={client.company_name}
            />
            <Separator />
            <AddressBlock
              label="Business Address"
              address={client.company_address as Address | null}
            />
            <Separator />
            <CopyField
              label="Business Phone"
              value={client.company_phone}
              format="phone"
            />
            <Separator />
            <CopyField label="EIN" value={client.ein} />
            <Separator />
            <CopyField label="DUNS" value={client.duns} />
            <Separator />
            <CopyField label="Website" value={client.website} />
            <Separator />
            <CopyField
              label="Annual Revenue"
              value={client.business_revenue}
              format="currency"
            />
            <Separator />
            <CopyField
              label="Monthly Deposits"
              value={client.monthly_deposits}
              format="currency"
            />
          </CardContent>
        </Card>
      </div>

      {/* Print Footer - Only visible when printing */}
      <div className="hidden print:block print:mt-12 print:pt-4 print:border-t print:border-slate-300">
        <p className="text-sm text-slate-500 text-center">
          Generated from Command Center
        </p>
      </div>
    </div>
  );
}
