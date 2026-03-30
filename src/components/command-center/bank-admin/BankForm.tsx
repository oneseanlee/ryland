import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateBank,
  useUpdateBank,
  type Bank,
  type ProductType,
  type BureauType,
  type CreateBankInput,
} from "@/hooks/useBanksAdmin";

interface BankFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: Bank | null; // null = create mode, existing = edit mode
}

const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "CreditCard", label: "Credit Card" },
  { value: "LOC", label: "Line of Credit" },
  { value: "TermLoan", label: "Term Loan" },
];

const BUREAU_TYPES: { value: BureauType; label: string }[] = [
  { value: "Experian", label: "Experian" },
  { value: "Equifax", label: "Equifax" },
  { value: "TransUnion", label: "TransUnion" },
];

const initialFormState: CreateBankInput = {
  name: "",
  product_name: "",
  product_type: undefined,
  bureau_pulled: undefined,
  requires_relationship: false,
  typical_limit_min: undefined,
  typical_limit_max: undefined,
  application_url: "",
  notes: "",
  is_active: true,
  sequence_priority: 0,
};

export default function BankForm({ open, onOpenChange, bank }: BankFormProps) {
  const [form, setForm] = useState<CreateBankInput>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateBank();
  const updateMutation = useUpdateBank();
  const isEditing = bank !== null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Populate form when editing
  useEffect(() => {
    if (bank) {
      setForm({
        name: bank.name,
        product_name: bank.product_name || "",
        product_type: bank.product_type || undefined,
        bureau_pulled: bank.bureau_pulled || undefined,
        requires_relationship: bank.requires_relationship,
        typical_limit_min: bank.typical_limit_min || undefined,
        typical_limit_max: bank.typical_limit_max || undefined,
        application_url: bank.application_url || "",
        notes: bank.notes || "",
        is_active: bank.is_active,
        sequence_priority: bank.sequence_priority || 0,
      });
    } else {
      setForm(initialFormState);
    }
    setErrors({});
  }, [bank, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = "Bank name is required";
    }

    if (!form.product_type) {
      newErrors.product_type = "Product type is required";
    }

    if (!form.bureau_pulled) {
      newErrors.bureau_pulled = "Bureau pulled is required";
    }

    // Validate URL format if provided
    if (form.application_url && form.application_url.trim()) {
      try {
        new URL(form.application_url);
      } catch {
        newErrors.application_url = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && bank) {
        await updateMutation.mutateAsync({
          id: bank.id,
          ...form,
        });
        toast.success("Bank updated successfully");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Bank created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save bank"
      );
    }
  };

  const updateField = <K extends keyof CreateBankInput>(
    field: K,
    value: CreateBankInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold text-slate-900">
            {isEditing ? "Edit Bank" : "Add Bank"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the bank information below."
              : "Fill in the bank details below to add a new bank to the master list."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Bank Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g., Chase"
              className={errors.name ? "border-red-300" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product_name" className="text-sm font-medium">
              Product Name
            </Label>
            <Input
              id="product_name"
              value={form.product_name || ""}
              onChange={(e) => updateField("product_name", e.target.value)}
              placeholder="e.g., Ink Business Cash"
            />
          </div>

          {/* Product Type and Bureau Pulled */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type" className="text-sm font-medium">
                Product Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.product_type || ""}
                onValueChange={(value) =>
                  updateField("product_type", value as ProductType)
                }
              >
                <SelectTrigger
                  className={errors.product_type ? "border-red-300" : ""}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.product_type && (
                <p className="text-xs text-red-500">{errors.product_type}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bureau_pulled" className="text-sm font-medium">
                Bureau Pulled <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.bureau_pulled || ""}
                onValueChange={(value) =>
                  updateField("bureau_pulled", value as BureauType)
                }
              >
                <SelectTrigger
                  className={errors.bureau_pulled ? "border-red-300" : ""}
                >
                  <SelectValue placeholder="Select bureau" />
                </SelectTrigger>
                <SelectContent>
                  {BUREAU_TYPES.map((bureau) => (
                    <SelectItem key={bureau.value} value={bureau.value}>
                      {bureau.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bureau_pulled && (
                <p className="text-xs text-red-500">{errors.bureau_pulled}</p>
              )}
            </div>
          </div>

          {/* Requires Relationship */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires_relationship"
              checked={form.requires_relationship}
              onCheckedChange={(checked) =>
                updateField("requires_relationship", checked === true)
              }
            />
            <Label
              htmlFor="requires_relationship"
              className="text-sm font-medium cursor-pointer"
            >
              Requires Existing Relationship
            </Label>
          </div>

          {/* Limit Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="typical_limit_min" className="text-sm font-medium">
                Typical Limit Min ($)
              </Label>
              <Input
                id="typical_limit_min"
                type="number"
                min={0}
                value={form.typical_limit_min || ""}
                onChange={(e) =>
                  updateField(
                    "typical_limit_min",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="e.g., 5000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typical_limit_max" className="text-sm font-medium">
                Typical Limit Max ($)
              </Label>
              <Input
                id="typical_limit_max"
                type="number"
                min={0}
                value={form.typical_limit_max || ""}
                onChange={(e) =>
                  updateField(
                    "typical_limit_max",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="e.g., 25000"
              />
            </div>
          </div>

          {/* Application URL */}
          <div className="space-y-2">
            <Label htmlFor="application_url" className="text-sm font-medium">
              Application URL
            </Label>
            <Input
              id="application_url"
              type="url"
              value={form.application_url || ""}
              onChange={(e) => updateField("application_url", e.target.value)}
              placeholder="https://..."
              className={errors.application_url ? "border-red-300" : ""}
            />
            {errors.application_url && (
              <p className="text-xs text-red-500">{errors.application_url}</p>
            )}
          </div>

          {/* Sequence Priority */}
          <div className="space-y-2">
            <Label htmlFor="sequence_priority" className="text-sm font-medium">
              Sequence Priority
            </Label>
            <Input
              id="sequence_priority"
              type="number"
              value={form.sequence_priority || 0}
              onChange={(e) =>
                updateField("sequence_priority", Number(e.target.value) || 0)
              }
              placeholder="0"
            />
            <p className="text-xs text-slate-500">
              Lower numbers are applied first in the funding sequence
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={form.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any additional notes about this bank/product..."
              rows={3}
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) =>
                updateField("is_active", checked === true)
              }
            />
            <Label
              htmlFor="is_active"
              className="text-sm font-medium cursor-pointer"
            >
              Is Active
            </Label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  {isEditing ? "Updating..." : "Creating..."}
                </span>
              ) : isEditing ? (
                "Update Bank"
              ) : (
                "Add Bank"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
