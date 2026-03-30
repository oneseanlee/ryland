import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { type DocumentType, DOCUMENT_TYPE_LABELS } from "@/hooks/useClientDocuments";

interface DocumentCategoryBadgeProps {
  type: DocumentType | null;
  className?: string;
}

const TYPE_COLORS: Record<DocumentType, string> = {
  DriverLicense: "bg-blue-100 text-blue-800 border-blue-200",
  SSNCard: "bg-red-100 text-red-800 border-red-200",
  TaxReturn: "bg-purple-100 text-purple-800 border-purple-200",
  BankStatement: "bg-green-100 text-green-800 border-green-200",
  ArticlesOfOrganization: "bg-amber-100 text-amber-800 border-amber-200",
  EINLetter: "bg-teal-100 text-teal-800 border-teal-200",
  Other: "bg-slate-100 text-slate-800 border-slate-200",
};

export function DocumentCategoryBadge({ type, className }: DocumentCategoryBadgeProps) {
  if (!type) {
    return (
      <Badge variant="outline" className={cn("text-slate-500", className)}>
        Unknown
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(TYPE_COLORS[type], className)}
    >
      {DOCUMENT_TYPE_LABELS[type]}
    </Badge>
  );
}

// Export type colors for use in other components if needed
export { TYPE_COLORS };
