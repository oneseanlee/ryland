import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { ClientWithDetails, PipelineStage, RepOption, ClientStatus } from "@/types/command-center";
import { getClientStatus } from "@/hooks/usePipelineData";
import { useAuth } from "@/hooks/useAuth";

interface StageDrillDownProps {
  stage: PipelineStage;
  clients: ClientWithDetails[];
  reps: RepOption[];
}

type SortField = "full_name" | "assigned_rep" | "days_in_stage" | "last_action" | "next_action" | "status";
type SortDirection = "asc" | "desc";

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

function StatusIndicator({ status }: { status: ClientStatus }) {
  const colors: Record<ClientStatus, string> = {
    "On Track": "bg-emerald-500",
    "At Risk": "bg-amber-500",
    Overdue: "bg-red-500",
    Blocked: "bg-orange-500",
  };

  const badgeClasses: Record<ClientStatus, string> = {
    "On Track": "bg-emerald-100 text-emerald-700",
    "At Risk": "bg-amber-100 text-amber-700",
    Overdue: "bg-red-100 text-red-700",
    Blocked: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-2.5 w-2.5 rounded-full", colors[status])} />
      <span className={cn("text-sm px-2 py-0.5 rounded-full font-medium", badgeClasses[status])}>
        {status}
      </span>
    </div>
  );
}

function getPrimaryRep(client: ClientWithDetails): string {
  const primaryAssignment = client.assignments.find((a) => a.is_primary);
  if (primaryAssignment?.user) {
    return (
      primaryAssignment.user.raw_user_meta_data?.full_name ||
      primaryAssignment.user.email
    );
  }
  const firstAssignment = client.assignments[0];
  if (firstAssignment?.user) {
    return (
      firstAssignment.user.raw_user_meta_data?.full_name ||
      firstAssignment.user.email
    );
  }
  return "Unassigned";
}

function formatLastAction(client: ClientWithDetails): string {
  if (!client.last_activity) {
    return "No activity";
  }
  const action = client.last_activity;
  const date = new Date(action.created_at);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export function StageDrillDown({ stage, clients, reps }: StageDrillDownProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [sortField, setSortField] = useState<SortField>("days_in_stage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterRep, setFilterRep] = useState<string>("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isReassigning, setIsReassigning] = useState(false);
  const [selectedRep, setSelectedRep] = useState<string>("");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedClients = useMemo(() => {
    let result = [...clients];

    // Filter by rep
    if (filterRep !== "all") {
      result = result.filter((client) =>
        client.assignments.some((a) => a.user_id === filterRep)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "full_name":
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case "assigned_rep":
          comparison = getPrimaryRep(a).localeCompare(getPrimaryRep(b));
          break;
        case "days_in_stage":
          comparison = a.days_in_stage - b.days_in_stage;
          break;
        case "last_action": {
          const aTime = a.last_activity
            ? new Date(a.last_activity.created_at).getTime()
            : 0;
          const bTime = b.last_activity
            ? new Date(b.last_activity.created_at).getTime()
            : 0;
          comparison = aTime - bTime;
          break;
        }
        case "next_action": {
          const aTitle = a.next_action || "";
          const bTitle = b.next_action || "";
          comparison = aTitle.localeCompare(bTitle);
          break;
        }
        case "status": {
          const statusOrder: Record<ClientStatus, number> = {
            Blocked: 4,
            Overdue: 3,
            "At Risk": 2,
            "On Track": 1,
          };
          const aBlocked = (a.has_paused_bureau || false) && a.current_stage !== "Inquiry Removal";
          const bBlocked = (b.has_paused_bureau || false) && b.current_stage !== "Inquiry Removal";
          comparison =
            statusOrder[getClientStatus(a.days_in_stage, aBlocked)] -
            statusOrder[getClientStatus(b.days_in_stage, bBlocked)];
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [clients, sortField, sortDirection, filterRep]);

  const handleClientClick = (clientId: string) => {
    navigate(`/command-center/clients/${clientId}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(new Set(filteredAndSortedClients.map((c) => c.id)));
    } else {
      setSelectedClients(new Set());
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    const newSelected = new Set(selectedClients);
    if (checked) {
      newSelected.add(clientId);
    } else {
      newSelected.delete(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleBulkReassign = async () => {
    if (!selectedRep || selectedClients.size === 0 || !user) return;

    setIsReassigning(true);
    try {
      const clientIds = Array.from(selectedClients);
      
      // Get current primary assignments for logging
      const { data: currentAssignments } = await supabase
        .from("client_assignments")
        .select("client_id, user_id")
        .in("client_id", clientIds)
        .eq("is_primary", true);

      const assignmentMap = new Map(
        (currentAssignments || []).map((a) => [a.client_id, a.user_id])
      );

      // Upsert new assignments
      const upsertData = clientIds.map((clientId) => ({
        client_id: clientId,
        user_id: selectedRep,
        is_primary: true,
        assigned_at: new Date().toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from("client_assignments")
        .upsert(upsertData, { onConflict: "client_id,user_id" });

      if (upsertError) throw upsertError;

      // Log activity for each client
      const activityLogs = clientIds.map((clientId) => ({
        client_id: clientId,
        user_id: user.id,
        action_type: "AssignmentChanged",
        details: {
          previous_assignee: assignmentMap.get(clientId) || null,
          new_assignee: selectedRep,
          changed_by: user.id,
        },
        created_at: new Date().toISOString(),
      }));

      const { error: logError } = await supabase
        .from("client_activity_log")
        .insert(activityLogs);

      if (logError) throw logError;

      toast.success(`Reassigned ${clientIds.length} client${clientIds.length > 1 ? "s" : ""}`);
      setSelectedClients(new Set());
      setSelectedRep("");
      queryClient.invalidateQueries({ queryKey: ["pipeline-data"] });
    } catch (error) {
      console.error("Failed to reassign clients:", error);
      toast.error("Failed to reassign clients");
    } finally {
      setIsReassigning(false);
    }
  };

  const clearSelection = () => {
    setSelectedClients(new Set());
    setSelectedRep("");
  };

  if (clients.length === 0) {
    return (
      <Card className="border border-slate-200 rounded-xl shadow-none">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No clients in {stage}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Clients will appear here when they enter this stage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 rounded-xl shadow-none">
      <CardHeader className="pb-4 px-5 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg">{stage} Clients</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Filter by Rep:</span>
            <Select value={filterRep} onValueChange={setFilterRep}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Reps" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reps</SelectItem>
                {reps.map((rep) => (
                  <SelectItem key={rep.id} value={rep.id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      filteredAndSortedClients.length > 0 &&
                      filteredAndSortedClients.every((c) => selectedClients.has(c.id))
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all clients"
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("full_name")}
                  >
                    Client Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("assigned_rep")}
                  >
                    Assigned Rep
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("days_in_stage")}
                  >
                    Days in Stage
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("last_action")}
                  >
                    Last Action
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("next_action")}
                  >
                    Next Action
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedClients.map((client) => {
                const isBlocked = (client.has_paused_bureau || false) && client.current_stage !== "Inquiry Removal";
                const status = getClientStatus(client.days_in_stage, isBlocked);
                return (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={(checked) =>
                          handleSelectClient(client.id, checked as boolean)
                        }
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${client.full_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleClientClick(client.id)}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {client.full_name}
                      </button>
                      {client.email && (
                        <p className="text-xs text-slate-500">{client.email}</p>
                      )}
                    </TableCell>
                    <TableCell>{getPrimaryRep(client)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          client.days_in_stage > 14
                            ? "text-red-600"
                            : client.days_in_stage > 7
                            ? "text-amber-600"
                            : "text-slate-900"
                        )}
                      >
                        {client.days_in_stage} days
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600">
                        {formatLastAction(client)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-slate-600" title={client.next_action || undefined}>
                        {client.next_action ? truncateText(client.next_action, 40) : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusIndicator status={status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {filterRep !== "all" && filteredAndSortedClients.length === 0 && (
          <div className="py-8 text-center text-slate-500">
            No clients assigned to this rep in the current stage
          </div>
        )}

        {/* Bulk Reassignment Action Bar */}
        {selectedClients.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {selectedClients.size} client{selectedClients.size > 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">Reassign to:</span>
                <Select value={selectedRep} onValueChange={setSelectedRep}>
                  <SelectTrigger className="w-[200px] bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select rep" />
                  </SelectTrigger>
                  <SelectContent>
                    {reps.map((rep) => (
                      <SelectItem key={rep.id} value={rep.id}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkReassign}
                  disabled={!selectedRep || isReassigning}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isReassigning ? "Assigning..." : "Assign"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
