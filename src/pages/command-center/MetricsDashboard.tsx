import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Activity,
  Timer,
  Download,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";
import { KpiCard } from "@/components/command-center/metrics/KpiCard";
import { DateRangeFilter } from "@/components/command-center/metrics/DateRangeFilter";
import { ClientsByStageChart } from "@/components/command-center/metrics/ClientsByStageChart";
import { FundingOverTimeChart } from "@/components/command-center/metrics/FundingOverTimeChart";
import { ApplicationStatusChart } from "@/components/command-center/metrics/ApplicationStatusChart";
import { FundingByRepChart } from "@/components/command-center/metrics/FundingByRepChart";
import { useMetrics, type DateRange as MetricsDateRange, type RepPerformanceData } from "@/hooks/useMetrics";
import type { DateRange, DateRangePreset } from "@/components/command-center/metrics/DateRangeFilter";
import { startOfMonth, endOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function downloadCSV(rows: string[][], filename: string): void {
  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getDaysInStageColor(days: number): string {
  if (days > 14) return "text-red-600 font-semibold";
  if (days > 7) return "text-orange-600 font-semibold";
  return "text-slate-600";
}

type SortField = keyof RepPerformanceData;
type SortDirection = "asc" | "desc";

export default function MetricsDashboard() {
  // Default to current month
  const now = new Date();
  const [dateRange, setDateRange] = useState<DateRange | null>({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  const [sortField, setSortField] = useState<SortField>("totalFunded");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data, isLoading } = useMetrics(dateRange as MetricsDateRange | null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-slate-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 text-emerald-600" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 text-emerald-600" />
    );
  };

  const sortedRepPerformance = data?.repPerformance
    ? [...data.repPerformance].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return 0;
      })
    : [];

  const handleDateRangeChange = (
    range: DateRange | null,
    _preset: DateRangePreset | null
  ) => {
    setDateRange(range);
  };

  const handleExportClients = async () => {
    try {
      const { data: clients, error } = await supabase
        .from("funding_clients")
        .select(`
          id, full_name, email, current_stage, stage_entered_at, created_at,
          client_assignments!left(user_id, is_primary)
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user roles for rep names
      const userIds = clients
        ?.map((c) => {
          const assignments = c.client_assignments as unknown as Array<{ user_id: string; is_primary: boolean }> | null;
          return assignments?.find((a) => a.is_primary)?.user_id;
        })
        .filter(Boolean) as string[] || [];

      const userDisplayNames = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        userRoles?.forEach((ur) => userDisplayNames.set(ur.user_id, ur.role));
      }

      const rows: string[][] = [
        ["Name", "Email", "Stage", "Days in Stage", "Assigned Rep", "Created At"],
        ...(clients || []).map((client) => {
          const assignments = client.client_assignments as unknown as Array<{ user_id: string; is_primary: boolean }> | null;
          const primaryAssignment = assignments?.find((a) => a.is_primary);
          const daysInStage = Math.floor(
            (Date.now() - new Date(client.stage_entered_at || client.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const repName = primaryAssignment
            ? userDisplayNames.get(primaryAssignment.user_id) || primaryAssignment.user_id.slice(0, 8)
            : "";
          return [
            client.full_name,
            client.email || "",
            client.current_stage,
            daysInStage.toString(),
            repName,
            new Date(client.created_at).toLocaleDateString(),
          ];
        }),
      ];

      downloadCSV(rows, `clients-export-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Clients exported successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export clients";
      toast.error(errorMessage);
    }
  };

  const handleExportApplications = async () => {
    try {
      const { data: applications, error } = await supabase
        .from("funding_applications")
        .select(`
          id, bank_id, product_type, status, applied_date, approval_amount,
          clients!inner(full_name),
          banks!inner(name, bureau_pulled)
        `)
        .order("applied_date", { ascending: false });

      if (error) throw error;

      const rows: string[][] = [
        ["Client Name", "Bank", "Product Type", "Status", "Applied Date", "Approval Amount", "Bureau"],
        ...(applications || []).map((app) => {
          const client = app.clients as unknown as { full_name: string };
          const bank = app.banks as unknown as { name: string; bureau_pulled: string | null };
          return [
            client?.full_name || "",
            bank?.name || "",
            app.product_type || "",
            app.status,
            app.applied_date || "",
            app.approval_amount ? `$${app.approval_amount.toLocaleString()}` : "",
            bank?.bureau_pulled || "",
          ];
        }),
      ];

      downloadCSV(rows, `applications-export-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Applications exported successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to export applications";
      toast.error(errorMessage);
    }
  };

  const kpiData = [
    {
      label: "Total Approved Funding",
      value: isLoading ? "—" : formatCurrency(data?.totalApproved || 0),
      icon: DollarSign,
      iconClassName: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Pipeline Value",
      value: isLoading ? "—" : formatCurrency(data?.pipelineValue || 0),
      icon: Activity,
      iconClassName: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Clients",
      value: isLoading ? "—" : (data?.activeClients || 0).toString(),
      icon: Users,
      iconClassName: "bg-violet-100 text-violet-600",
    },
    {
      label: "Conversion Rate",
      value: isLoading ? "—" : formatPercentage(data?.conversionRate || 0),
      icon: TrendingUp,
      iconClassName: "bg-amber-100 text-amber-600",
    },
    {
      label: "Overdue Clients",
      value: isLoading ? "—" : (data?.overdueClients || 0).toString(),
      icon: Clock,
      iconClassName: "bg-red-100 text-red-600",
    },
    {
      label: "Avg Time to Fund",
      value: isLoading ? "—" : `${Math.round(data?.avgTimeToFund || 0)} days`,
      icon: Timer,
      iconClassName: "bg-cyan-100 text-cyan-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Metrics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Performance metrics and analytics for your funding pipeline
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportClients}>
              <Download className="h-4 w-4 mr-2" />
              Export Clients CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportApplications}>
              <Download className="h-4 w-4 mr-2" />
              Export Applications CSV
            </Button>
          </div>
          <DateRangeFilter
            value={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiData.map((kpi, index) => (
          <KpiCard
            key={index}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconClassName={kpi.iconClassName}
          />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients by Stage - Bar Chart */}
        <ClientsByStageChart
          data={data?.clientsByStage || []}
          isLoading={isLoading}
        />

        {/* Application Status - Pie Chart */}
        <ApplicationStatusChart
          data={data?.applicationStatuses || []}
          isLoading={isLoading}
        />
      </div>

      {/* Second Row of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funding Over Time - Line Chart */}
        <FundingOverTimeChart
          data={data?.fundingOverTime || []}
          isLoading={isLoading}
        />

        {/* Funding by Rep - Horizontal Bar Chart */}
        <FundingByRepChart
          data={data?.fundingByRep || []}
          isLoading={isLoading}
        />
      </div>

      {/* Overdue Clients Table */}
      <Card className="border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Overdue Clients
            </CardTitle>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {data?.overdueList?.length || 0}
            </Badge>
          </div>
          <Link
            to="/command-center/pipeline"
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            View all in Pipeline
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : (data?.overdueList?.length || 0) === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No overdue clients found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Days in Stage</TableHead>
                  <TableHead>Assigned Rep</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.overdueList?.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link
                        to={`/command-center/clients/${client.id}`}
                        className="text-slate-900 hover:text-emerald-600 font-medium"
                      >
                        {client.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-600">
                        {client.current_stage}
                      </Badge>
                    </TableCell>
                    <TableCell className={getDaysInStageColor(client.daysInStage)}>
                      {client.daysInStage} days
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {client.repDisplayName || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Rep Performance Table */}
      <Card className="border border-slate-200 rounded-xl shadow-none">
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-5 pt-5">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Rep Performance
            </CardTitle>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              {data?.repPerformance?.length || 0}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">Loading...</div>
          ) : (data?.repPerformance?.length || 0) === 0 ? (
            <div className="py-8 text-center text-slate-500">
              No rep performance data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort("displayName")}
                  >
                    <div className="flex items-center">
                      Rep Name
                      {getSortIcon("displayName")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("assignedClients")}
                  >
                    <div className="flex items-center justify-end">
                      Assigned Clients
                      {getSortIcon("assignedClients")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("activeClients")}
                  >
                    <div className="flex items-center justify-end">
                      Active Clients
                      {getSortIcon("activeClients")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("appsSubmitted")}
                  >
                    <div className="flex items-center justify-end">
                      Apps Submitted
                      {getSortIcon("appsSubmitted")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("appsApproved")}
                  >
                    <div className="flex items-center justify-end">
                      Apps Approved
                      {getSortIcon("appsApproved")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("totalFunded")}
                  >
                    <div className="flex items-center justify-end">
                      Total Funded
                      {getSortIcon("totalFunded")}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-50 text-right"
                    onClick={() => handleSort("avgTimeToFund")}
                  >
                    <div className="flex items-center justify-end">
                      Avg Time to Fund
                      {getSortIcon("avgTimeToFund")}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRepPerformance.map((rep) => (
                  <TableRow key={rep.userId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-slate-400" />
                        <span className="font-medium text-slate-900">
                          {rep.displayName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {rep.assignedClients}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {rep.activeClients}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {rep.appsSubmitted}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={rep.appsApproved > 0 ? "default" : "outline"}
                        className={
                          rep.appsApproved > 0
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "text-slate-600"
                        }
                      >
                        {rep.appsApproved}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-900">
                      {formatCurrency(rep.totalFunded)}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {rep.avgTimeToFund > 0
                        ? `${Math.round(rep.avgTimeToFund)} days`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
