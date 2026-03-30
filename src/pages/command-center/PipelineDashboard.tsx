import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, DollarSign } from "lucide-react";
import { PipelineStageCard } from "@/components/command-center/pipeline/PipelineStageCard";
import { StageDrillDown } from "@/components/command-center/pipeline/StageDrillDown";
import { usePipelineData, useReps } from "@/hooks/usePipelineData";
import { PIPELINE_STAGES, type PipelineStage } from "@/types/command-center";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border border-slate-200 rounded-xl shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg p-2.5 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function PipelineDashboard() {
  const { data: pipelineData, isLoading, error } = usePipelineData();
  const { data: reps = [] } = useReps();

  // Find the first stage with clients to select by default
  const defaultStage = useMemo(() => {
    if (!pipelineData) return "Onboarding";
    for (const stage of PIPELINE_STAGES) {
      if (pipelineData.stages[stage]?.count > 0) {
        return stage;
      }
    }
    return "Onboarding";
  }, [pipelineData]);

  const [selectedStage, setSelectedStage] = useState<PipelineStage | null>(null);

  // Use the selected stage or default
  const activeStage = selectedStage ?? defaultStage;

  if (isLoading) {
    return <PipelineLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pipeline Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of all clients in the funding pipeline
          </p>
        </div>
        <Card className="border border-red-200 bg-red-50 rounded-xl shadow-none">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 font-medium">Failed to load pipeline data</p>
            <p className="text-sm text-red-500 mt-1">
              Please try refreshing the page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stagesData = pipelineData?.stages ?? {};
  const selectedStageData = stagesData[activeStage];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pipeline Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of all clients in the funding pipeline
        </p>
      </div>

      {/* Pipeline Stage Cards - Evenly Distributed */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageData = stagesData[stage];
          return (
            <PipelineStageCard
              key={stage}
              stage={stage}
              count={stageData?.count ?? 0}
              overdueCount={stageData?.overdueCount ?? 0}
              isSelected={activeStage === stage}
              onClick={() => setSelectedStage(stage)}
            />
          );
        })}
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Active Clients"
          value={pipelineData?.totalActiveClients ?? 0}
          color="bg-blue-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Total Overdue"
          value={pipelineData?.totalOverdue ?? 0}
          color="bg-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="Funded This Month"
          value={pipelineData?.totalFundedThisMonth ?? 0}
          color="bg-emerald-500"
        />
      </div>

      {/* Stage Drill-Down Table */}
      <StageDrillDown
        stage={activeStage}
        clients={selectedStageData?.clients ?? []}
        reps={reps}
      />
    </div>
  );
}
