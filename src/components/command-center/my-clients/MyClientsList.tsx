import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyClients, useClientStages } from "@/hooks/useMyClients";
import { formatDistanceToNow } from "date-fns";

const stageColors: Record<string, string> = {
  Onboarding: "bg-blue-100 text-blue-800 border-blue-200",
  Analysis: "bg-purple-100 text-purple-800 border-purple-200",
  "Kickoff Call": "bg-amber-100 text-amber-800 border-amber-200",
  Remediation: "bg-orange-100 text-orange-800 border-orange-200",
  "Post-Audit Check": "bg-cyan-100 text-cyan-800 border-cyan-200",
  "Funding Execution": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Closed/Funded": "bg-green-100 text-green-800 border-green-200",
  "Inquiry Removal": "bg-pink-100 text-pink-800 border-pink-200",
};

export default function MyClientsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "stage" | "daysInStage">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { data: clients, isLoading, error } = useMyClients({
    searchQuery,
    stageFilter: stageFilter === "all" ? undefined : stageFilter,
    sortBy,
    sortOrder,
  });

  const { data: stages } = useClientStages();

  const handleSort = (column: "name" | "stage" | "daysInStage") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const getDaysInStage = (stageEnteredAt: string): number => {
    const entered = new Date(stageEnteredAt);
    const now = new Date();
    return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getSortIcon = (column: "name" | "stage" | "daysInStage") => {
    if (sortBy !== column) {
      return <ChevronDown className="h-4 w-4 text-slate-300" />;
    }
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 text-slate-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-slate-600" />
    );
  };

  if (isLoading) {
    return (
      <Card className="h-full border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-slate-400" />
            My Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-slate-400" />
            My Clients
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-red-500">Error loading clients: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col border border-slate-200 rounded-xl shadow-none">
      <CardHeader className="pb-4 px-5 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-slate-600" />
            My Clients
            <Badge variant="secondary" className="ml-2">
              {clients?.length || 0}
            </Badge>
          </CardTitle>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages?.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto p-0">
        {clients && clients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Client Name
                    {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("stage")}
                >
                  <div className="flex items-center gap-1">
                    Stage
                    {getSortIcon("stage")}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right"
                  onClick={() => handleSort("daysInStage")}
                >
                  <div className="flex items-center justify-end gap-1">
                    Days in Stage
                    {getSortIcon("daysInStage")}
                  </div>
                </TableHead>
                <TableHead>Last Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const daysInStage = getDaysInStage(client.stage_entered_at);
                const stageColor =
                  stageColors[client.current_stage] ||
                  "bg-slate-100 text-slate-800 border-slate-200";

                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        to={`/command-center/clients/${client.id}`}
                        className="font-medium text-slate-900 hover:text-emerald-600 hover:underline"
                      >
                        {client.full_name}
                      </Link>
                      {client.email && (
                        <p className="text-xs text-slate-500">{client.email}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${stageColor} font-medium`}
                      >
                        {client.current_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          daysInStage > 7 ? "text-amber-600 font-medium" : ""
                        }
                      >
                        {daysInStage} days
                      </span>
                    </TableCell>
                    <TableCell>
                      {client.last_action ? (
                        <div className="text-sm">
                          <span className="text-slate-700">
                            {client.last_action.action_type}
                          </span>
                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(
                              new Date(client.last_action.created_at),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">No recent activity</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">
              No clients assigned to you yet
            </h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              When clients are assigned to you, they will appear here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
