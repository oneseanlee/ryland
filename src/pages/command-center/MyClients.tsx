import { Users, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MyClientsList from "@/components/command-center/my-clients/MyClientsList";
import TaskList from "@/components/command-center/my-clients/TaskList";
import { useMyClients } from "@/hooks/useMyClients";
import { useMyTasks, useMyTaskStats } from "@/hooks/useMyTasks";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyClients() {
  const { data: clients, isLoading: clientsLoading } = useMyClients();
  const { data: tasks, isLoading: tasksLoading } = useMyTasks();
  const { data: stats, isLoading: statsLoading } = useMyTaskStats();

  const isLoading = clientsLoading || tasksLoading || statsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Clients & Tasks</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your assigned clients and tasks
        </p>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="Total Clients"
          value={clients?.length || 0}
          isLoading={isLoading}
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5 text-amber-600" />}
          label="Open Tasks"
          value={stats?.totalOpen || 0}
          isLoading={isLoading}
        />
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          label="Overdue Tasks"
          value={stats?.overdue || 0}
          isLoading={isLoading}
          highlight={stats && stats.overdue > 0}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          label="Completed Today"
          value={stats?.completedToday || 0}
          isLoading={isLoading}
        />
      </div>

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Panel - My Clients (60% on large screens) */}
        <div className="lg:col-span-3">
          <MyClientsList />
        </div>

        {/* Right Panel - Task List (40% on large screens) */}
        <div className="lg:col-span-2">
          <TaskList />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  isLoading: boolean;
  highlight?: boolean;
}

function StatCard({ icon, label, value, isLoading, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? "border border-red-200 bg-red-50/50 rounded-xl shadow-none" : "border border-slate-200 rounded-xl shadow-none"}>
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={`p-2.5 rounded-lg ${
            highlight ? "bg-red-100" : "bg-slate-100"
          }`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-12 mt-1" />
          ) : (
            <p
              className={`text-2xl font-semibold ${
                highlight ? "text-red-600" : "text-slate-900"
              }`}
            >
              {value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
