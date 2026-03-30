import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientsByStageData } from "@/hooks/useMetrics";

const STAGE_COLORS: Record<string, string> = {
  "Onboarding": "#3b82f6",
  "Analysis": "#8b5cf6",
  "Kickoff Call": "#f59e0b",
  "Remediation": "#ef4444",
  "Post-Audit Check": "#10b981",
  "Funding Execution": "#06b6d4",
  "Closed/Funded": "#22c55e",
  "Inquiry Removal": "#6366f1",
};

interface ClientsByStageChartProps {
  data: ClientsByStageData[];
  isLoading?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{payload[0].value}</span> client
          {payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
}

export function ClientsByStageChart({ data, isLoading }: ClientsByStageChartProps) {
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <Card className="h-full border border-slate-200 rounded-xl shadow-none">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          Clients by Stage
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="h-[280px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="h-32 w-full bg-slate-200 rounded"></div>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STAGE_COLORS[entry.stage] || "#64748b"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
