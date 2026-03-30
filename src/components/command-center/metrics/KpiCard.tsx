import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
}: KpiCardProps) {
  return (
    <Card className={cn("border border-slate-200 rounded-xl shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
        <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          {label}
        </CardTitle>
        <div
          className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {trend.value > 0 ? "+" : ""}
              {trend.value.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">vs last period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
