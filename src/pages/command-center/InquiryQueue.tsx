import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ClipboardList, MoreHorizontal, Play, CheckCircle, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useInquiryQueue } from "@/hooks/useInquiryQueue";
import { useCommandCenterRole } from "@/hooks/useCommandCenterRole";
import type { BureauName, RemovalStatus } from "@/hooks/useBureauStatus";
import type { InquiryQueueItem } from "@/hooks/useInquiryQueue";

type TabFilter = "all" | BureauName;

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 30) {
    return `${Math.floor(diffDays / 30)}mo ago`;
  }
  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}m ago`;
  }
  return "just now";
}

function getStatusBadge(status: RemovalStatus | "None") {
  const styles: Record<string, string> = {
    Requested: "bg-blue-100 text-blue-700",
    InProgress: "bg-amber-100 text-amber-700",
    Completed: "bg-green-100 text-green-700",
    None: "bg-slate-100 text-slate-500",
  };
  const labels: Record<string, string> = {
    Requested: "Requested",
    InProgress: "In Progress",
    Completed: "Completed",
    None: "None",
  };
  return (
    <Badge variant="secondary" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

function getBureauBadge(bureau: BureauName) {
  const styles: Record<BureauName, string> = {
    Experian: "bg-red-100 text-red-700",
    Equifax: "bg-orange-100 text-orange-700",
    TransUnion: "bg-green-100 text-green-700",
  };
  return (
    <Badge variant="secondary" className={styles[bureau]}>
      {bureau}
    </Badge>
  );
}

function QueueTable({
  items,
  onStartRemoval,
  onUpdateStatus,
  isStartingRemoval,
  isUpdatingStatus,
}: {
  items: InquiryQueueItem[];
  onStartRemoval: (bureauStatusId: string, clientId: string, bureau: BureauName) => void;
  onUpdateStatus: (removalId: string, clientId: string, bureau: BureauName, status: RemovalStatus) => void;
  isStartingRemoval: boolean;
  isUpdatingStatus: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 text-slate-300" />
        <p className="text-lg font-medium">No paused bureaus</p>
        <p className="text-sm">All clients are clear for applications</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client Name</TableHead>
          <TableHead>Bureau</TableHead>
          <TableHead>Paused Since</TableHead>
          <TableHead>Inquiries</TableHead>
          <TableHead>Removal Status</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const latestRemoval = item.inquiry_removals?.[0];
          const currentStatus: RemovalStatus | "None" = latestRemoval?.status || "None";
          const isDisabled = isStartingRemoval || isUpdatingStatus;

          return (
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  to={`/command-center/clients/${item.client.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {item.client.full_name}
                </Link>
              </TableCell>
              <TableCell>{getBureauBadge(item.bureau)}</TableCell>
              <TableCell className="text-slate-600">
                {formatRelativeTime(item.paused_at)}
              </TableCell>
              <TableCell className="font-medium">{item.inquiry_count}</TableCell>
              <TableCell>{getStatusBadge(currentStatus)}</TableCell>
              <TableCell className="text-slate-500">
                {latestRemoval?.assigned_to ? (
                  <span className="text-sm">{latestRemoval.assigned_to.slice(0, 8)}...</span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" disabled={isDisabled}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Start Removal - only if no removal exists or status is None */}
                    {(!latestRemoval || currentStatus === "None") && (
                      <DropdownMenuItem
                        onClick={() => onStartRemoval(item.id, item.client.id, item.bureau)}
                        disabled={isDisabled}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Removal
                      </DropdownMenuItem>
                    )}
                    {/* Mark In Progress - only if status is Requested */}
                    {latestRemoval && currentStatus === "Requested" && (
                      <DropdownMenuItem
                        onClick={() =>
                          onUpdateStatus(latestRemoval.id, item.client.id, item.bureau, "InProgress")
                        }
                        disabled={isDisabled}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark In Progress
                      </DropdownMenuItem>
                    )}
                    {/* Mark Completed - only if status is Requested or InProgress */}
                    {latestRemoval && (currentStatus === "Requested" || currentStatus === "InProgress") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            onUpdateStatus(latestRemoval.id, item.client.id, item.bureau, "Completed")
                          }
                          disabled={isDisabled}
                          className="text-green-600 focus:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Completed
                        </DropdownMenuItem>
                      </>
                    )}
                    {/* If completed, show no actions */}
                    {currentStatus === "Completed" && (
                      <DropdownMenuItem disabled className="text-slate-400">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already Completed
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function InquiryQueue() {
  const navigate = useNavigate();
  const { role, isLoading: roleLoading } = useCommandCenterRole();
  const [activeTab, setActiveTab] = useState<TabFilter>("all");

  const {
    items,
    isLoading,
    error,
    summary,
    startRemoval,
    updateStatus,
    isStartingRemoval,
    isUpdatingStatus,
  } = useInquiryQueue();

  // Redirect non-managers and non-admins
  if (!roleLoading && role !== "admin" && role !== "manager") {
    navigate("/command-center");
    return null;
  }

  const handleStartRemoval = (bureauStatusId: string, clientId: string, bureau: BureauName) => {
    try {
      startRemoval({ bureauStatusId, clientId, bureau });
      toast.success("Removal request started");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start removal");
    }
  };

  const handleUpdateStatus = (
    removalId: string,
    clientId: string,
    bureau: BureauName,
    status: RemovalStatus
  ) => {
    try {
      updateStatus({ removalId, clientId, bureau, status });
      toast.success(`Removal marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  // Filter items by tab
  const filteredItems =
    activeTab === "all" ? items : items.filter((i) => i.bureau === activeTab);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-red-600">Failed to load inquiry queue</p>
        <p className="text-sm text-slate-500 mt-2">{error.message}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/command-center")}>
          Back to Pipeline
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-emerald-600" />
          Inquiry Removal Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage clients with paused bureaus due to inquiry thresholds
        </p>
      </div>

      {/* Summary Bar */}
      <Card className="bg-slate-50 border border-slate-200 rounded-xl shadow-none">
        <CardContent className="py-4 px-5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="font-medium text-slate-900">
              {summary.total} client{summary.total !== 1 ? "s" : ""} paused
            </span>
            <span className="text-slate-500">—</span>
            <span className="text-red-600">{summary.experian} Experian</span>
            <span className="text-slate-400">/</span>
            <span className="text-orange-600">{summary.equifax} Equifax</span>
            <span className="text-slate-400">/</span>
            <span className="text-green-600">{summary.transunion} TransUnion</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs and Table */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabFilter)}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all">All Paused</TabsTrigger>
          <TabsTrigger value="Experian">Experian</TabsTrigger>
          <TabsTrigger value="Equifax">Equifax</TabsTrigger>
          <TabsTrigger value="TransUnion">TransUnion</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card className="border border-slate-200 rounded-xl shadow-none">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <QueueTable
                  items={filteredItems}
                  onStartRemoval={handleStartRemoval}
                  onUpdateStatus={handleUpdateStatus}
                  isStartingRemoval={isStartingRemoval}
                  isUpdatingStatus={isUpdatingStatus}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loading overlay for mutations */}
      {(isStartingRemoval || isUpdatingStatus) && (
        <div className="fixed inset-0 bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
