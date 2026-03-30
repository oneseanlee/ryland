import { useState } from "react";
import { format } from "date-fns";
import {
  GitBranch,
  FileText,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  PlusCircle,
  CheckCircle2,
  UserCog,
  PauseCircle,
  PlayCircle,
  Activity,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ActivityLogEntry,
  ActivityType,
  getActivityBadgeVariant,
} from "@/hooks/useClientActivity";

interface ActivityTabProps {
  activities: ActivityLogEntry[];
  isLoading: boolean;
  error: Error | null;
  page: number;
  totalCount: number | null;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 20;

// Icon component mapping
const ActivityIcon = ({ type }: { type: ActivityType }) => {
  const iconClass = "h-4 w-4";

  switch (type) {
    case "StageChange":
      return <GitBranch className={iconClass} />;
    case "NoteAdded":
      return <FileText className={iconClass} />;
    case "DocumentUploaded":
      return <Upload className={iconClass} />;
    case "ApplicationSubmitted":
      return <Send className={iconClass} />;
    case "ApplicationApproved":
      return <CheckCircle className={iconClass} />;
    case "ApplicationDenied":
      return <XCircle className={iconClass} />;
    case "TaskCreated":
      return <PlusCircle className={iconClass} />;
    case "TaskCompleted":
      return <CheckCircle2 className={iconClass} />;
    case "AssignmentChanged":
      return <UserCog className={iconClass} />;
    case "BureauPaused":
      return <PauseCircle className={iconClass} />;
    case "BureauUnpaused":
      return <PlayCircle className={iconClass} />;
    default:
      return <Activity className={iconClass} />;
  }
};

// Badge variant mapping
const getBadgeVariant = (
  type: ActivityType
): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "StageChange":
      return "default";
    case "NoteAdded":
      return "secondary";
    case "ApplicationApproved":
      return "default";
    case "ApplicationDenied":
      return "destructive";
    case "TaskCompleted":
      return "default";
    case "BureauPaused":
      return "destructive";
    case "BureauUnpaused":
      return "default";
    default:
      return "outline";
  }
};

// Format activity details for display
const formatActivityDetails = (entry: ActivityLogEntry): string => {
  if (!entry.details) return "";

  const details = entry.details as Record<string, unknown>;

  switch (entry.action_type) {
    case "StageChange":
      return `Changed to: ${details.new_stage || "Unknown"}`;
    case "NoteAdded":
      return details.note_preview
      ? `Note: ${String(details.note_preview).substring(0, 100)}${
          String(details.note_preview).length > 100 ? "..." : ""
        }`
      : "Added a note";
    case "DocumentUploaded":
      return `Document: ${details.filename || "Unknown file"}`;
    case "ApplicationSubmitted":
      return `Applied to: ${details.bank_name || "Unknown bank"}`;
    case "ApplicationApproved":
      return `Approved: ${details.bank_name || "Unknown bank"}${
        details.amount ? ` - $${Number(details.amount).toLocaleString()}` : ""
      }`;
    case "ApplicationDenied":
      return `Denied: ${details.bank_name || "Unknown bank"}`;
    case "TaskCreated":
      return `Task: ${details.task_title || "New task"}`;
    case "TaskCompleted":
      return `Completed: ${details.task_title || "Task"}`;
    case "AssignmentChanged":
      return `Assigned to: ${details.assigned_to || "Unknown"}`;
    case "BureauPaused":
      return `Paused: ${details.bureau || "Bureau"}`;
    case "BureauUnpaused":
      return `Resumed: ${details.bureau || "Bureau"}`;
    default:
      return details.message ? String(details.message) : "";
  }
};

export function ActivityTab({
  activities,
  isLoading,
  error,
  page,
  totalCount,
  onPageChange,
}: ActivityTabProps) {
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>Failed to load activity log</p>
            <p className="text-sm text-slate-500">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="font-medium">No activity recorded yet</p>
            <p className="text-sm mt-1">
              Actions like stage changes, notes, and applications will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Activity Log</span>
          {totalCount !== null && (
            <span className="text-sm font-normal text-slate-500">
              {totalCount} total entries
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((entry) => {
            const userName =
              entry.user?.raw_user_meta_data?.full_name ||
              entry.user?.email ||
              "System";

            return (
              <div
                key={entry.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                    entry.action_type === "ApplicationApproved" ||
                    entry.action_type === "TaskCompleted"
                      ? "bg-emerald-100 text-emerald-600"
                      : entry.action_type === "ApplicationDenied" ||
                          entry.action_type === "BureauPaused"
                        ? "bg-red-100 text-red-600"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  <ActivityIcon type={entry.action_type} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={getBadgeVariant(entry.action_type)}>
                      {entry.action_type}
                    </Badge>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(entry.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700">
                    <span className="font-medium">{userName}</span>{" "}
                    {formatActivityDetails(entry)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
