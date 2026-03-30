import { useState } from "react";
import { Plus, Building2, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryRemovalForm } from "./InquiryRemovalForm";
import type { InquiryRemoval, BureauName, RemovalStatus, BureauStatus } from "@/hooks/useBureauStatus";
import { getRemovalStatusVariant, getPausedBureaus } from "@/hooks/useBureauStatus";

interface InquiryRemovalListProps {
  clientId: string;
  inquiryRemovals: InquiryRemoval[];
  bureauStatuses: BureauStatus[];
  onCreateRemoval: (bureau: BureauName, notes: string | null) => void;
  onUpdateStatus: (removalId: string, status: RemovalStatus) => void;
  isCreating: boolean;
  isUpdating: boolean;
}

// Status badge styling
const STATUS_STYLES: Record<RemovalStatus, { icon: React.ReactNode; className: string }> = {
  Requested: {
    icon: <Clock className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  InProgress: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  Completed: {
    icon: <CheckCircle className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

export function InquiryRemovalList({
  clientId,
  inquiryRemovals,
  bureauStatuses,
  onCreateRemoval,
  onUpdateStatus,
  isCreating,
  isUpdating,
}: InquiryRemovalListProps) {
  const [showForm, setShowForm] = useState(false);

  // Get paused bureaus for the form dropdown
  const pausedBureaus = getPausedBureaus(bureauStatuses);

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get assigned user display name
  const getAssignedUser = (removal: InquiryRemoval) => {
    if (!removal.assigned_user) return "-";
    return (
      removal.assigned_user.raw_user_meta_data?.full_name ||
      removal.assigned_user.email ||
      "-"
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-500" />
            Inquiry Removal Requests
          </CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Request Removal
          </Button>
        </CardHeader>
        <CardContent>
          {inquiryRemovals.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No inquiry removal requests yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Click "Request Removal" to create a new request
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bureau</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiryRemovals.map((removal) => {
                    const statusStyle = STATUS_STYLES[removal.status];
                    return (
                      <TableRow key={removal.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            {removal.bureau}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 w-fit ${statusStyle.className}`}
                          >
                            {statusStyle.icon}
                            {removal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(removal.requested_at)}</TableCell>
                        <TableCell>{formatDate(removal.completed_at)}</TableCell>
                        <TableCell>{getAssignedUser(removal)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {removal.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {removal.status !== "Completed" && (
                            <Select
                              value={removal.status}
                              onValueChange={(value: RemovalStatus) =>
                                onUpdateStatus(removal.id, value)
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[140px] ml-auto">
                                <SelectValue placeholder="Update status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Requested">Requested</SelectItem>
                                <SelectItem value="InProgress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {removal.status === "Completed" && (
                            <span className="text-sm text-green-600">Completed</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Removal Form Modal */}
      <InquiryRemovalForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={onCreateRemoval}
        pausedBureaus={pausedBureaus}
        isSubmitting={isCreating}
      />
    </>
  );
}
