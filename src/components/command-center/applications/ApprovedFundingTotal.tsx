import { DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FundingApplication } from "@/hooks/useClientApplications";
import { formatCurrency, calculateTotalApproved } from "@/hooks/useClientApplications";

interface ApprovedFundingTotalProps {
  applications: FundingApplication[];
}

export function ApprovedFundingTotal({ applications }: ApprovedFundingTotalProps) {
  const { total, count, totalCount } = calculateTotalApproved(applications);
  const approvalRate = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Approved Funding */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Approved Funding
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(total)}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {count} approved application{count !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Approval Rate */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {approvalRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            {count} approved out of {totalCount} total
          </p>
        </CardContent>
      </Card>

      {/* Total Applications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Applications
          </CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCount}</div>
          <p className="text-xs text-muted-foreground">
            Applications submitted to date
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
