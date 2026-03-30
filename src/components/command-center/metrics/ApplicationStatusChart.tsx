import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationStatusData } from "@/hooks/useMetrics";

const STATUS_COLORS: Record<string, string> = {
  "Applied": "#3b82f6",
  "Pending": "#f59e0b",
  "Approved": "#22c55e",
  "Denied": "#ef4444",
  "NeedsFollowUp": "#8b5cf6",
};

const STATUS_LABELS: Record<string, string> = {
  "Applied": "Applied",
  "Pending": "Pending",
  "Approved": "Approved",
  "Denied": "Denied",
  "NeedsFollowUp": "Needs Follow Up",
};

interface ApplicationStatusChartProps {
  data: ApplicationStatusData[];
  isLoading?: boolean;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = payload[0]?.payload?.total || 0;
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0";
    
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="font-medium text-slate-900">
            {STATUS_LABELS[data.name] || data.name}
          </span>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          <span className="font-semibold">{data.value}</span> applications
        </p>
        <p className="text-xs text-slate-500">{percentage}% of total</p>
      </div>
    );
  }
  return null;
}

function CustomLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload) return null;

  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-600">
            {STATUS_LABELS[entry.value] || entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ApplicationStatusChart({
  data,
  isLoading,
}: ApplicationStatusChartProps) {
  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Add total to each data point for tooltip calculations
  const chartData = data.map((item) => ({
    ...item,
    total,
    fill: STATUS_COLORS[item.status] || "#64748b",
    name: item.status,
  }));

  return (
    <Card className="h-full border border-slate-200 rounded-xl shadow-none">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          Application Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="h-[280px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse flex space-x-4">
                <div className="h-32 w-32 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500">
              No application data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  content={<CustomLegend />}
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
