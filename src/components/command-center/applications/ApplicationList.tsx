import { Building2, Calendar, ExternalLink, FileText, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ApplicationStatusUpdate } from "./ApplicationStatusUpdate";
import type {
  ApplicationStatus,
  FundingApplication,
} from "@/hooks/useClientApplications";
import {
  getStatusColor,
  formatCurrency,
} from "@/hooks/useClientApplications";

interface ApplicationListProps {
  applications: FundingApplication[];
  onUpdateStatus: (params: {
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

const bureauColors: Record<string, string> = {
  Experian: "bg-blue-100 text-blue-800 border-blue-200",
  Equifax: "bg-red-100 text-red-800 border-red-200",
  TransUnion: "bg-orange-100 text-orange-800 border-orange-200",
};

const productTypeLabels: Record<string, string> = {
  CreditCard: "Credit Card",
  LOC: "Line of Credit",
  TermLoan: "Term Loan",
};

export function ApplicationList({
  applications,
  onUpdateStatus,
  isUpdating,
}: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No Applications Yet
        </h3>
        <p className="text-sm text-slate-500 max-w-sm">
          This client hasn&apos;t submitted any funding applications yet. Click
          &quot;Log Application&quot; to add the first one.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bank</TableHead>
            <TableHead>Product Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bureau</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Approval Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((application) => (
            <TableRow key={application.id}>
              {/* Bank Name */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">
                    {application.bank?.name || "Unknown Bank"}
                  </span>
                  {application.bank?.product_name && (
                    <span className="text-xs text-slate-500">
                      ({application.bank.product_name})
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Product Type */}
              <TableCell>
                {application.product_type ? (
                  <span className="text-sm">
                    {productTypeLabels[application.product_type] ||
                      application.product_type}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </TableCell>

              {/* Status */}
              <TableCell>
                <ApplicationStatusUpdate
                  application={application}
                  onUpdate={onUpdateStatus}
                  isUpdating={isUpdating}
                />
              </TableCell>

              {/* Bureau */}
              <TableCell>
                {application.bureau_pulled ? (
                  <Badge
                    variant="outline"
                    className={
                      bureauColors[application.bureau_pulled] ||
                      "bg-slate-100 text-slate-800"
                    }
                  >
                    {application.bureau_pulled}
                  </Badge>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </TableCell>

              {/* Applied Date */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">
                    {application.applied_date
                      ? new Date(application.applied_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </span>
                </div>
              </TableCell>

              {/* Approval Amount */}
              <TableCell>
                {application.status === "Approved" &&
                application.approval_amount ? (
                  <span className="font-medium text-green-600">
                    {formatCurrency(application.approval_amount)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  {application.application_url && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a
                              href={application.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Open Application URL</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {application.notes && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-500"
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{application.notes}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
