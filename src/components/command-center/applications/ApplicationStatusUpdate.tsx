import { useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  ApplicationStatus,
  FundingApplication,
} from "@/hooks/useClientApplications";
import {
  APPLICATION_STATUS,
  getStatusColor,
} from "@/hooks/useClientApplications";

interface ApplicationStatusUpdateProps {
  application: FundingApplication;
  onUpdate: (params: {
    applicationId: string;
    newStatus: ApplicationStatus;
    approvalAmount: number | null;
  }) => void;
  isUpdating: boolean;
}

const statusLabels: Record<ApplicationStatus, string> = {
  Applied: "Applied",
  Pending: "Pending",
  Approved: "Approved",
  Denied: "Denied",
  NeedsFollowUp: "Needs Follow Up",
};

export function ApplicationStatusUpdate({
  application,
  onUpdate,
  isUpdating,
}: ApplicationStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(
    application.status
  );
  const [approvalAmount, setApprovalAmount] = useState<string>(
    application.approval_amount?.toString() || ""
  );
  const [showAmountInput, setShowAmountInput] = useState(
    application.status === "Approved"
  );

  const handleStatusSelect = (status: ApplicationStatus) => {
    setSelectedStatus(status);
    setShowAmountInput(status === "Approved");
    if (status !== "Approved") {
      // Auto-submit if not approved (no amount needed)
      handleSubmit(status, null);
    }
    setOpen(false);
  };

  const handleSubmit = (status: ApplicationStatus, amount: number | null) => {
    onUpdate({
      applicationId: application.id,
      newStatus: status,
      approvalAmount: amount,
    });
  };

  const handleAmountSubmit = () => {
    const amount = approvalAmount ? parseFloat(approvalAmount) : null;
    handleSubmit(selectedStatus, amount);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-[140px] justify-between",
              getStatusColor(application.status)
            )}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              statusLabels[application.status]
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandList>
              <CommandEmpty>No status found.</CommandEmpty>
              <CommandGroup>
                {APPLICATION_STATUS.map((status) => (
                  <CommandItem
                    key={status}
                    value={status}
                    onSelect={() => handleStatusSelect(status)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        application.status === status
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        getStatusColor(status)
                      )}
                    >
                      {statusLabels[status]}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Approval Amount Input - shown inline when status is Approved */}
      {application.status === "Approved" && application.approval_amount && (
        <span className="text-sm font-medium text-green-600">
          ${application.approval_amount.toLocaleString()}
        </span>
      )}

      {/* Popover for entering approval amount when changing to Approved */}
      {showAmountInput && selectedStatus === "Approved" && (
        <Popover open={showAmountInput} onOpenChange={() => setShowAmountInput(false)}>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-amount">Approval Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="approval-amount"
                    type="number"
                    placeholder="0"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(e.target.value)}
                    className="pl-7"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAmountInput(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAmountSubmit}
                  disabled={isUpdating || !approvalAmount}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
