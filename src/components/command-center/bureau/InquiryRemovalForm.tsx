import { useState } from "react";
import { Building2, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { BureauName } from "@/hooks/useBureauStatus";
import { BUREAUS } from "@/hooks/useBureauStatus";

interface InquiryRemovalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (bureau: BureauName, notes: string | null) => void;
  pausedBureaus: BureauName[];
  isSubmitting: boolean;
}

export function InquiryRemovalForm({
  open,
  onOpenChange,
  onSubmit,
  pausedBureaus,
  isSubmitting,
}: InquiryRemovalFormProps) {
  const [selectedBureau, setSelectedBureau] = useState<BureauName | "">("");
  const [notes, setNotes] = useState("");

  // Determine if there are paused bureaus to select
  const hasPausedBureaus = pausedBureaus.length > 0;

  // Bureau options for dropdown - only show paused bureaus
  const bureauOptions = hasPausedBureaus ? pausedBureaus : [];

  const handleSubmit = () => {
    if (!selectedBureau) return;

    onSubmit(selectedBureau, notes.trim() || null);

    // Reset form
    setSelectedBureau("");
    setNotes("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedBureau("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" />
            Request Inquiry Removal
          </DialogTitle>
          <DialogDescription>
            Submit a request to remove inquiries from a credit bureau. This will create a task and
            log the activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* No Paused Bureaus Warning */}
          {!hasPausedBureaus && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                All bureaus are currently active. There are no paused bureaus requiring inquiry
                removal.
              </AlertDescription>
            </Alert>
          )}

          {/* Bureau Select */}
          <div className="space-y-2">
            <Label htmlFor="bureau">
              Bureau <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedBureau}
              onValueChange={(value) => setSelectedBureau(value as BureauName)}
              disabled={isSubmitting || !hasPausedBureaus}
            >
              <SelectTrigger id="bureau">
                <SelectValue placeholder="Select a bureau" />
              </SelectTrigger>
              <SelectContent>
                {bureauOptions.map((bureau) => (
                  <SelectItem key={bureau} value={bureau}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      {bureau}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasPausedBureaus && (
              <p className="text-xs text-slate-500">
                Only paused bureaus are shown. Currently paused: {pausedBureaus.join(", ")}
              </p>
            )}
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes about this inquiry removal request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedBureau || isSubmitting || !hasPausedBureaus}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
