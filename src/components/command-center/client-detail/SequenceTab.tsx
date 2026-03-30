import { useState } from "react";
import {
  ListOrdered,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  PauseCircle,
  Building2,
  CheckCircle2,
  Wallet,
  Landmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useFundingSequence,
  formatLimitRange,
  getProductTypeDisplay,
  type SequenceItem,
} from "@/hooks/useFundingSequence";
import { formatCurrency } from "@/utils/formatters";
import type { FundingApplication } from "@/hooks/useClientApplications";

interface SequenceTabProps {
  clientId: string;
}

export function SequenceTab({ clientId }: SequenceTabProps) {
  const {
    sequence,
    blockedCount,
    pausedBureaus,
    isLoading,
    error,
    regenerate,
  } = useFundingSequence(clientId);

  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    regenerate();
    // Reset after a brief delay for UX feedback
    setTimeout(() => setIsRegenerating(false), 500);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-slate-500" />
            Recommended Application Sequence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-slate-500" />
            Recommended Application Sequence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Failed to load funding sequence"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5 text-slate-500" />
            Recommended Application Sequence
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
        </CardHeader>
      </Card>

      {/* Bureau Pause Warning */}
      {pausedBureaus.length > 0 && (
        <Alert variant="destructive" className="border-orange-300 bg-orange-50">
          <PauseCircle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Bureau Pause Alert</AlertTitle>
          <AlertDescription className="text-orange-700">
            The following {pausedBureaus.length === 1 ? "bureau is" : "bureaus are"} currently paused:
            <div className="flex flex-wrap gap-2 mt-2">
              {pausedBureaus.map((bureau) => (
                <Badge
                  key={bureau}
                  variant="outline"
                  className="bg-orange-100 text-orange-800 border-orange-300"
                >
                  {bureau}
                </Badge>
              ))}
            </div>
            <p className="mt-2 text-sm">
              Sequence items pulling these bureaus are blocked. Complete inquiry
              removal before proceeding with blocked applications.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Sequence List */}
      <Card>
        <CardContent className="pt-6">
          {sequence.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-700">
                No Banks Available
              </h3>
              <p className="text-slate-500 mt-1">
                All active banks have approved applications or there are no
                active banks configured.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sequence.map((item, index) => (
                <SequenceItemRow
                  key={item.bank.id}
                  item={item}
                  sequenceNumber={index + 1}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Footer */}
      {sequence.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {sequence.length} bank{sequence.length !== 1 ? "s" : ""} in sequence
          </span>
          {blockedCount > 0 && (
            <span className="text-orange-600">
              {blockedCount} blocked due to paused bureau
              {blockedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface SequenceItemRowProps {
  item: SequenceItem;
  sequenceNumber: number;
}

function SequenceItemRow({ item, sequenceNumber }: SequenceItemRowProps) {
  const { bank, isBlocked, hasRelationship, existingApplication } = item;

  return (
    <div
      className={`relative rounded-lg border p-4 transition-colors ${
        isBlocked
          ? "bg-slate-50 border-slate-200 opacity-75"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Sequence Number */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
            isBlocked
              ? "bg-slate-200 text-slate-500"
              : hasRelationship
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          #{sequenceNumber}
        </div>

        {/* Bank Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                {bank.name}
                {hasRelationship && (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs"
                  >
                    <Wallet className="h-3 w-3 mr-1" />
                    Relationship
                  </Badge>
                )}
                {isBlocked && (
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200 text-xs"
                  >
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Blocked
                  </Badge>
                )}
              </h4>
              <p className="text-sm text-slate-600 mt-0.5">
                {bank.product_name || "—"} ·{" "}
                {getProductTypeDisplay(bank.product_type)}
              </p>
            </div>

            {/* Application URL Button */}
            {bank.application_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex-shrink-0"
                asChild
              >
                <a
                  href={bank.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply
                </a>
              </Button>
            )}
          </div>

          <Separator className="my-3" />

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {/* Bureau */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Bureau:</span>
              <Badge
                variant="outline"
                className={
                  isBlocked
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }
              >
                {bank.bureau_pulled || "—"}
              </Badge>
            </div>

            {/* Estimated Limit */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Est. Limit:</span>
              <span className="font-medium text-slate-700">
                {formatLimitRange(
                  bank.typical_limit_min,
                  bank.typical_limit_max
                )}
              </span>
            </div>

            {/* Existing Application Status */}
            {existingApplication && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Status:</span>
                <ApplicationStatusBadge application={existingApplication} />
              </div>
            )}
          </div>

          {/* Notes */}
          {bank.notes && (
            <p className="text-xs text-slate-500 mt-3 italic">
              Note: {bank.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface ApplicationStatusBadgeProps {
  application: FundingApplication;
}

function ApplicationStatusBadge({ application }: ApplicationStatusBadgeProps) {
  const getStatusStyles = (status: string): string => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Denied":
        return "bg-red-100 text-red-800 border-red-200";
      case "NeedsFollowUp":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Applied":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case "Applied":
        return <Landmark className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Badge
      variant="outline"
      className={`${getStatusStyles(application.status)} text-xs`}
    >
      {getStatusIcon(application.status)}
      {application.status}
      {application.approval_amount !== null &&
        application.approval_amount > 0 && (
          <span className="ml-1">
            ({formatCurrency(application.approval_amount)})
          </span>
        )}
    </Badge>
  );
}
