import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FieldCopyButtonProps {
  value: string | number | null | undefined;
  label?: string;
  className?: string;
}

export function FieldCopyButton({
  value,
  label,
  className = "",
}: FieldCopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    if (!value) return;

    const textToCopy = String(value);

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: "Copied!",
        description: label
          ? `${label} copied to clipboard`
          : "Value copied to clipboard",
      });

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!value) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-slate-400" />
      )}
    </Button>
  );
}
