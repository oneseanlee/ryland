import { useState } from "react";
import { Building2, Pause, Play, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BureauStatus, BureauName } from "@/hooks/useBureauStatus";
import { INQUIRY_THRESHOLD, getBureauStatusColor } from "@/hooks/useBureauStatus";

interface BureauStatusCardProps {
  status: BureauStatus;
  isAdmin: boolean;
  onUnpause: (bureau: BureauName) => void;
  isUnpausing: boolean;
}

// Bureau display configuration
const BUREAU_CONFIG: Record<BureauName, { color: string; bgColor: string }> = {
  Experian: { color: "text-blue-600", bgColor: "bg-blue-50" },
  Equifax: { color: "text-red-600", bgColor: "bg-red-50" },
  TransUnion: { color: "text-green-600", bgColor: "bg-green-50" },
};

export function BureauStatusCard({
  status,
  isAdmin,
  onUnpause,
  isUnpausing,
}: BureauStatusCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { bureau, inquiry_count: inquiryCount, is_paused: isPaused, paused_at: pausedAt } = status;

  const config = BUREAU_CONFIG[bureau];
  const statusColor = getBureauStatusColor(inquiryCount);
  const progressPercent = Math.min((inquiryCount / INQUIRY_THRESHOLD) * 100, 100);

  // Determine border/background colors based on status
  const getBorderColor = () => {
    if (statusColor === "green") return "border-green-300";
    if (statusColor === "yellow") return "border-yellow-400";
    return "border-red-500";
  };

  const getBgColor = () => {
    if (statusColor === "green") return "bg-green-50/50";
    if (statusColor === "yellow") return "bg-yellow-50/50";
    return "bg-red-50/50";
  };

  const handleConfirmUnpause = () => {
    onUnpause(bureau);
    setShowConfirmDialog(false);
  };

  // Format paused_at timestamp
  const formatPausedAt = (timestamp: string | null) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Card className={`relative overflow-hidden ${getBorderColor()} ${getBgColor()}`}>
      {/* Paused Overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-10">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg">
            <Pause className="h-4 w-4" />
            PAUSED
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className={`h-5 w-5 ${config.color}`} />
            <span>{bureau}</span>
          </div>
          {isPaused ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Pause className="h-3 w-3" />
              Paused
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-600 flex items-center gap-1">
              <Play className="h-3 w-3" />
              Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Inquiry Count Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900">{inquiryCount}</div>
          <div className="text-sm text-slate-500">Inquiries</div>
        </div>

        {/* Threshold Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Threshold Progress</span>
            <span className="font-medium">
              {inquiryCount} of {INQUIRY_THRESHOLD}
            </span>
          </div>
          <Progress
            value={progressPercent}
            className={`h-2 ${
              statusColor === "green"
                ? "[&>div]:bg-green-500"
                : statusColor === "yellow"
                  ? "[&>div]:bg-yellow-500"
                  : "[&>div]:bg-red-500"
            }`}
          />
        </div>

        {/* Paused Timestamp */}
        {isPaused && pausedAt && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Paused: {formatPausedAt(pausedAt)}</span>
          </div>
        )}

        {/* Warning if approaching threshold */}
        {inquiryCount === 1 && !isPaused && (
          <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-800">
              Approaching inquiry threshold. One more inquiry will pause this bureau.
            </p>
          </div>
        )}

        {/* Admin Override Button */}
        {isAdmin && isPaused && (
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Override - Unpause
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Unpause {bureau}?</DialogTitle>
                <DialogDescription>
                  Are you sure you want to unpause {bureau}? This will allow new applications to
                  pull this bureau and reset the inquiry count to 0.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmUnpause}
                  disabled={isUnpausing}
                >
                  {isUnpausing ? "Unpausing..." : "Yes, Unpause"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Help Tooltip for Non-Admin */}
        {!isAdmin && isPaused && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs text-slate-500 text-center cursor-help">
                  Contact admin to unpause
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Only administrators can override bureau pauses.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
