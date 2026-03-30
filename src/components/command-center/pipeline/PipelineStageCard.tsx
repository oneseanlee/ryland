import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Search,
  Phone,
  Wrench,
  ClipboardCheck,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  LucideIcon,
} from "lucide-react";
import type { PipelineStage } from "@/types/command-center";

interface PipelineStageCardProps {
  stage: PipelineStage;
  count: number;
  overdueCount: number;
  isSelected: boolean;
  onClick: () => void;
}

const stageIcons: Record<PipelineStage, LucideIcon> = {
  Onboarding: UserPlus,
  Analysis: Search,
  "Kickoff Call": Phone,
  Remediation: Wrench,
  "Post-Audit Check": ClipboardCheck,
  "Funding Execution": Rocket,
  "Closed/Funded": CheckCircle2,
  "Inquiry Removal": AlertTriangle,
};

const stageColors: Record<PipelineStage, { bg: string; border: string; ring: string; icon: string }> = {
  Onboarding: {
    bg: "bg-blue-50",
    border: "border-blue-400",
    ring: "ring-blue-400",
    icon: "text-blue-600",
  },
  Analysis: {
    bg: "bg-purple-50",
    border: "border-purple-400",
    ring: "ring-purple-400",
    icon: "text-purple-600",
  },
  "Kickoff Call": {
    bg: "bg-cyan-50",
    border: "border-cyan-400",
    ring: "ring-cyan-400",
    icon: "text-cyan-600",
  },
  Remediation: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    ring: "ring-amber-400",
    icon: "text-amber-600",
  },
  "Post-Audit Check": {
    bg: "bg-orange-50",
    border: "border-orange-400",
    ring: "ring-orange-400",
    icon: "text-orange-600",
  },
  "Funding Execution": {
    bg: "bg-rose-50",
    border: "border-rose-400",
    ring: "ring-rose-400",
    icon: "text-rose-600",
  },
  "Closed/Funded": {
    bg: "bg-emerald-50",
    border: "border-emerald-400",
    ring: "ring-emerald-400",
    icon: "text-emerald-600",
  },
  "Inquiry Removal": {
    bg: "bg-slate-100",
    border: "border-slate-400",
    ring: "ring-slate-400",
    icon: "text-slate-600",
  },
};

export function PipelineStageCard({
  stage,
  count,
  overdueCount,
  isSelected,
  onClick,
}: PipelineStageCardProps) {
  const Icon = stageIcons[stage];
  const colors = stageColors[stage];

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200",
        "flex-1 min-w-0",
        "rounded-xl shadow-none",
        isSelected
          ? cn("border-2", colors.border, colors.bg)
          : "border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className={cn(
              "rounded-full p-2",
              isSelected ? colors.bg : "bg-slate-100"
            )}
          >
            <Icon className={cn("h-5 w-5", colors.icon)} />
          </div>

          <div className="space-y-1 w-full">
            <h3 className="text-sm font-medium text-slate-900 truncate">
              {stage}
            </h3>

            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{count}</span>
              {overdueCount > 0 && (
                <Badge
                  variant="destructive"
                  className="text-xs px-1.5 py-0 h-5"
                >
                  {overdueCount} overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
