import { useState } from "react";
import { Copy, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface AddressBlockProps {
  label: string;
  address: Address | null | undefined;
  className?: string;
}

function formatAddressLine(address: Address): string {
  const parts = [address.street, address.city, address.state, address.zip].filter(
    Boolean
  );
  return parts.join(", ");
}

function formatMultilineAddress(address: Address): string {
  const line1 = address.street || "";
  const line2 = [address.city, address.state, address.zip].filter(Boolean).join(", ");
  return [line1, line2].filter(Boolean).join("\n");
}

export function AddressBlock({
  label,
  address,
  className = "",
}: AddressBlockProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const hasAddress = address && (address.street || address.city || address.state || address.zip);

  const handleCopy = async (field: string, value: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });

      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyFullAddress = async () => {
    if (!hasAddress) return;
    await handleCopy("Full Address", formatAddressLine(address as Address));
  };

  if (!hasAddress) {
    return (
      <div className={`py-2 ${className}`}>
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-900">—</p>
      </div>
    );
  }

  const CopyButton = ({ field, value }: { field: string; value: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
      onClick={() => handleCopy(field, value)}
      title={`Copy ${field}`}
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-emerald-500" />
      ) : (
        <Copy className="h-3 w-3 text-slate-400" />
      )}
    </Button>
  );

  return (
    <div className={`py-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
          onClick={handleCopyFullAddress}
        >
          {copiedField === "Full Address" ? (
            <>
              <Check className="h-3 w-3 mr-1 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy Full
            </>
          )}
        </Button>
      </div>

      <div className="space-y-1">
        {/* Street */}
        {address?.street && (
          <div className="group flex items-center justify-between">
            <p className="text-sm font-medium text-slate-900 truncate">
              {address.street}
            </p>
            <CopyButton field="Street" value={address.street} />
          </div>
        )}

        {/* City, State, Zip */}
        <div className="group flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {[address?.city, address?.state, address?.zip].filter(Boolean).join(", ")}
          </p>
          <CopyButton
            field="City/State/ZIP"
            value={[address?.city, address?.state, address?.zip].filter(Boolean).join(", ")}
          />
        </div>
      </div>
    </div>
  );
}

export { formatAddressLine, formatMultilineAddress };
export type { Address };
