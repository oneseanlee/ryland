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
import type { FundingByRepData } from "@/hooks/useMetrics";

interface FundingByRepChartProps {
  data: FundingByRepData[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
          Total Funded:{" "}
          <span className="font-semibold text-emerald-600">
            {formatCurrency(payload[0].value)}
          </span>
        </p>
      </div>
    );
  }
  return null;
}

export function FundingByRepChart({ data, isLoading }: FundingByRepChartProps) {
  // Sort by total funded descending for better visualization
  const sortedData = [...data].sort((a, b) => b.totalFunded - a.totalFunded);

  return (
    <Card className="h-full border border-slate-200 rounded-xl shadow-none">
      <CardHeader className="pb-2 px-5 pt-5">
        <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
          Funding by Rep
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
              No funding data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    }
                    if (value >= 1000) {
                      return `$${(value / 1000).toFixed(0)}k`;
                    }
                    return `$${value}`;
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="displayName"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={55}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
                <Bar dataKey="totalFunded" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="#10b981"
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
