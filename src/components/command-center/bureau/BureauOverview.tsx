import { AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BureauStatusCard } from "./BureauStatusCard";
import type { BureauStatus, BureauName } from "@/hooks/useBureauStatus";
import { countActiveBureaus, getPausedBureaus } from "@/hooks/useBureauStatus";

interface BureauOverviewProps {
  bureauStatuses: BureauStatus[];
  isAdmin: boolean;
  onUnpause: (bureau: BureauName) => void;
  isUnpausing: boolean;
}

export function BureauOverview({
  bureauStatuses,
  isAdmin,
  onUnpause,
  isUnpausing,
}: BureauOverviewProps) {
  const activeCount = countActiveBureaus(bureauStatuses);
  const pausedBureaus = getPausedBureaus(bureauStatuses);
  const hasPausedBureaus = pausedBureaus.length > 0;

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-100">
        {hasPausedBureaus ? (
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-500" />
        )}
        <div>
          <p className="font-medium">
            {activeCount} of {bureauStatuses.length} bureaus active
          </p>
          {hasPausedBureaus && (
            <p className="text-sm text-slate-600">
              Paused: {pausedBureaus.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Warning Alert for Paused Bureaus */}
      {hasPausedBureaus && (
        <Alert variant="destructive" className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Bureau Paused</AlertTitle>
          <AlertDescription>
            Inquiry removal needed before continuing applications with{" "}
            {pausedBureaus.length === 1 ? "this bureau" : "these bureaus"}:{" "}
            <strong>{pausedBureaus.join(", ")}</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Bureau Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bureauStatuses.map((status) => (
          <BureauStatusCard
            key={status.id}
            status={status}
            isAdmin={isAdmin}
            onUnpause={onUnpause}
            isUnpausing={isUnpausing}
          />
        ))}
      </div>
    </div>
  );
}
